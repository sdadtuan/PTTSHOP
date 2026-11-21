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

"${GIT[@]}" fetch origin "$DEPLOY_BRANCH"
if "${GIT[@]}" show-ref --verify --quiet "refs/heads/${DEPLOY_BRANCH}"; then
  "${GIT[@]}" checkout "$DEPLOY_BRANCH"
else
  "${GIT[@]}" checkout -b "$DEPLOY_BRANCH" --track "origin/${DEPLOY_BRANCH}"
fi
"${GIT[@]}" merge --ff-only "origin/${DEPLOY_BRANCH}"

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
systemctl restart pttshop

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
