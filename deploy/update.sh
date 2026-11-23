#!/usr/bin/env bash
# Triển khai một nhánh đã có trên origin. Không seed, không reset, không clean.
set -euo pipefail

APP_DIR=/var/www/pttshop
DB_PATH="$APP_DIR/data/prod.db"
BACKUP_DIR=/var/backups/pttshop
PREV_SHA=""
BACKUP=""
SERVICE_USER=""

rollback_hint() {
  echo "--- Quay lui (script không tự chạy các lệnh này) ---"
  if [ -n "${PREV_SHA}" ]; then
    echo "Mã nguồn về commit trước:"
    echo "  cd ${APP_DIR}"
    echo "  git checkout ${PREV_SHA}"
    echo "  sudo -u ${SERVICE_USER:-deploy} npm ci"
    echo "  sudo -u ${SERVICE_USER:-deploy} npm run build"
    echo "  sudo systemctl restart pttshop"
  fi
  if [ -n "${BACKUP}" ]; then
    echo "Cơ sở dữ liệu về bản sao lưu vừa tạo:"
    echo "  sudo systemctl stop pttshop"
    echo "  sudo cp ${BACKUP} ${DB_PATH}"
    echo "  sudo chown ${SERVICE_USER:-deploy}:${SERVICE_USER:-deploy} ${DB_PATH}"
    echo "  sudo systemctl start pttshop"
  fi
}

die() {
  echo "$1" >&2
  rollback_hint
  trap - ERR
  exit 1
}

find_next_server() {
  local pid="$1"
  local cmd child found
  cmd="$(ps -o cmd= -p "$pid" 2>/dev/null || true)"
  case "$cmd" in
    *next-server*)
      echo "$pid"
      return 0
      ;;
  esac
  for child in $(ps -o pid= --ppid "$pid" 2>/dev/null); do
    found="$(find_next_server "$child" || true)"
    if [ -n "$found" ]; then
      echo "$found"
      return 0
    fi
  done
  return 1
}

trap 'status=$?; echo "Lỗi ở dòng ${LINENO} (mã ${status})." >&2; rollback_hint; exit "$status"' ERR

if [ -z "${DEPLOY_BRANCH:-}" ]; then
  echo "Thiếu DEPLOY_BRANCH. Ví dụ: DEPLOY_BRANCH=fix/remove-demo-credentials ./deploy/update.sh" >&2
  trap - ERR
  exit 1
fi

case "$DEPLOY_BRANCH" in
  *[!A-Za-z0-9._/-]*|"") die "DEPLOY_BRANCH không hợp lệ." ;;
esac

if [ ! -d "$APP_DIR/.git" ]; then
  die "Không thấy git tại ${APP_DIR}."
fi

cd "$APP_DIR"
GIT=(git -c safe.directory="$APP_DIR")

if [ -n "$("${GIT[@]}" status --porcelain)" ]; then
  echo "Thư mục ${APP_DIR} còn thay đổi chưa commit. Dừng. Không reset, không clean." >&2
  trap - ERR
  exit 1
fi

SERVICE_USER="$(systemctl show pttshop -p User --value)"
if [ -z "$SERVICE_USER" ] || [ "$SERVICE_USER" = "root" ]; then
  die "Không xác định được user dịch vụ pttshop (systemctl show pttshop -p User)."
fi

if ! command -v sqlite3 >/dev/null 2>&1; then
  die "Thiếu sqlite3. Cài bằng: sudo apt-get install -y sqlite3"
fi

PREV_SHA="$("${GIT[@]}" rev-parse HEAD)"
install -d -m 700 "$BACKUP_DIR"
TS="$(date +%Y%m%d-%H%M%S)"
BACKUP="${BACKUP_DIR}/prod-${TS}.db"
sqlite3 "$DB_PATH" ".backup '${BACKUP}'"
INTEGRITY="$(sqlite3 "$BACKUP" "PRAGMA integrity_check;")"
if [ "$INTEGRITY" != "ok" ]; then
  die "integrity_check của bản sao lưu không phải ok. Dừng trước khi đổi mã."
fi
sha256sum "$BACKUP" | tee "${BACKUP}.sha256" >/dev/null
echo "Đã sao lưu ${BACKUP} (integrity_check=ok)."

"${GIT[@]}" fetch origin "+refs/heads/${DEPLOY_BRANCH}:refs/remotes/origin/${DEPLOY_BRANCH}"
remote_sha="$("${GIT[@]}" rev-parse "origin/${DEPLOY_BRANCH}")"
if "${GIT[@]}" show-ref --verify --quiet "refs/heads/${DEPLOY_BRANCH}"; then
  local_sha="$("${GIT[@]}" rev-parse "refs/heads/${DEPLOY_BRANCH}")"
  if [ "$local_sha" != "$remote_sha" ] && ! "${GIT[@]}" merge-base --is-ancestor "$local_sha" "$remote_sha"; then
    die "Nhánh local ${DEPLOY_BRANCH} lệch origin/${DEPLOY_BRANCH}. Dừng."
  fi
fi
"${GIT[@]}" checkout -B "$DEPLOY_BRANCH" "origin/${DEPLOY_BRANCH}"
head_sha="$("${GIT[@]}" rev-parse HEAD)"
if [ "$head_sha" != "$remote_sha" ]; then
  die "HEAD không trùng origin/${DEPLOY_BRANCH}."
fi

install -d -m 755 "$APP_DIR/data/media"
if [ ! -e "$APP_DIR/public/media" ]; then
  ln -s ../data/media "$APP_DIR/public/media"
fi

chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"
sudo -u "$SERVICE_USER" env NODE_ENV=development npm ci

if [ ! -d "$APP_DIR/prisma/migrations" ] || [ -z "$(find "$APP_DIR/prisma/migrations" -mindepth 2 -name migration.sql -print -quit)" ]; then
  die "Repo không có migrations, cần anh quyết định"
fi

baseline_count="$(sqlite3 -readonly "$DB_PATH" "SELECT COUNT(*) FROM _prisma_migrations WHERE migration_name = '0_init';" 2>/dev/null || true)"
if [ -z "$baseline_count" ] || [ "$baseline_count" = "0" ]; then
  die "Chưa baseline. Chạy một lần: cd /var/www/pttshop && sudo -u ${SERVICE_USER} npx prisma migrate resolve --applied 0_init, rồi chạy lại script."
fi

sudo -u "$SERVICE_USER" bash -lc 'cd /var/www/pttshop && set +x && set -a && { [ ! -f .env ] || . ./.env; } && set +x && set +a && npx prisma migrate deploy'
sudo -u "$SERVICE_USER" npm run build
build_done_epoch="$(date +%s)"
echo "Build xong lúc $(date -d "@${build_done_epoch}" '+%Y-%m-%d %H:%M:%S %Z') (epoch ${build_done_epoch})."
systemctl restart pttshop

main_pid=""
next_pid=""
for _try in 1 2 3 4 5 6 7 8 9 10; do
  main_pid="$(systemctl show pttshop -p MainPID --value)"
  if [ -n "$main_pid" ] && [ "$main_pid" != "0" ]; then
    next_pid="$(find_next_server "$main_pid" || true)"
  fi
  if [ -n "$next_pid" ]; then
    break
  fi
  sleep 0.5
done
if [ -z "$next_pid" ]; then
  die "Không thấy next-server sau systemctl restart pttshop."
fi
start_raw="$(ps -o lstart= -p "$next_pid" | sed 's/^ *//')"
start_epoch="$(date -d "$start_raw" +%s)"
active_enter="$(systemctl show pttshop -p ActiveEnterTimestamp --value)"
echo "next-server PID=${next_pid} khởi động ${start_raw} (epoch ${start_epoch}). MainPID=${main_pid}. ActiveEnterTimestamp=${active_enter}."
if [ "$start_epoch" -lt "$build_done_epoch" ]; then
  die "next-server PID ${next_pid} khởi động trước khi build xong. Tiến trình cũ vẫn đang chạy."
fi

deadline=$((SECONDS + 30))
home_code="000"
login_code="000"
while true; do
  home_code="$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 2 --max-time 5 http://127.0.0.1:3400/ || true)"
  login_code="$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 2 --max-time 5 http://127.0.0.1:3400/dang-nhap || true)"
  if [ "$home_code" = "200" ] && [ "$login_code" = "200" ]; then
    break
  fi
  if [ "$SECONDS" -ge "$deadline" ]; then
    die "HTTP không phải 200 sau 30 giây (trang chủ=${home_code}, /dang-nhap=${login_code})."
  fi
  sleep 2
done

trap - ERR
echo "Triển khai ${DEPLOY_BRANCH} xong. Trang chủ và /dang-nhap trả 200."
