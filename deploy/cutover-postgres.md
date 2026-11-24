# Chuyển production sang PostgreSQL

Chưa chạy. Chỉ bắt đầu khi phiên làm việc có đúng câu `OK deploy`, vào ngày anh chọn, trong cửa sổ 23:00–00:00 giờ Việt Nam.

Máy chủ đang để múi giờ UTC. Cửa sổ đó là 16:00–17:00 UTC. Lệch khỏi cửa sổ thì dừng.

Production hiện tại không bị tài liệu này đụng tới. Dịch vụ `pttshop` vẫn trỏ `file:/var/www/pttshop/data/prod.db`. Role production là `pttshop_prod`, database là `pttshop_prod`. Không dùng `pttshop_app` và không dùng `pttshop_staging`.

Mã sẽ chạy sau khi chuyển là commit trên `feat/postgres` mà câu `OK deploy` chỉ định. Lúc viết tài liệu, commit đó là `a300527`, chưa push. Câu `OK deploy` phải đi kèm push. Tài liệu này không push. Nếu máy chủ không fetch đúng commit đó, dừng.

`EXCLUDE_LIST` để trống. Không seed, không `migrate reset`, không sửa Nginx, không xoá `prod.db`.

## Dừng ngay khi

- Chưa có đúng câu `OK deploy`, hoặc đồng hồ ngoài 16:00–17:00 UTC.
- `integrity_check` không in đúng `ok`, hoặc sha256 tính lại không khớp.
- `prod.db` sau `chmod` không phải `444 deploy:deploy`.
- `verify-migration` thoát khác 0, hoặc lệch một bản ghi.
- Diff của env đụng dòng nào khác `DATABASE_URL`, hoặc URL mới không phải user `pttshop_prod`, host `127.0.0.1`, database `pttshop_prod`.
- `migrate deploy` đòi reset, seed, hoặc áp một migration không nằm trong commit được duyệt.
- `/`, `/san-pham` hoặc `/api/shipping/quote?subtotal=100000` không trả 200.
- `ss -ltnp | grep 5432` thấy địa chỉ khác `127.0.0.1`.

Lệch dữ liệu hoặc HTTP sai thì làm mục Quay lui. Chưa đổi env thì chỉ làm nhánh «chưa đổi env».

## 0. Bản build sẵn, chưa đổi dịch vụ

Làm trước 23:00, sau khi có `OK deploy`. Không `systemctl restart pttshop`. Không sửa `/var/www/pttshop/.env`.

`git fetch` chỉ lấy object. Không checkout trong `/var/www/pttshop`, không restart.

```bash
sudo git -C /var/www/pttshop fetch origin feat/postgres
sudo git -C /var/www/pttshop worktree add --detach /var/www/pttshop-pg a300527
sudo chown -R deploy:deploy /var/www/pttshop-pg
sudo -u deploy bash -lc 'cd /var/www/pttshop-pg && npm ci && npx prisma generate && npm run build'
sudo ln -sfn /var/www/pttshop/data/media /var/www/pttshop-pg/public/media
```

Thay `a300527` bằng commit trong câu `OK deploy` nếu khác. Kiểm tra, rồi dừng nếu sai:

```bash
git -c safe.directory=/var/www/pttshop-pg -C /var/www/pttshop-pg rev-parse HEAD
readlink -f /var/www/pttshop-pg/public/media
test ! -e /var/www/pttshop-pg/.env && echo "không có env riêng"
systemctl is-active pttshop
readlink /proc/$(systemctl show pttshop -p MainPID --value)/cwd
```

HEAD phải là commit được duyệt. `readlink` của media phải ra `/var/www/pttshop/data/media`. `pttshop` vẫn `active` và cwd vẫn là `/var/www/pttshop`. Thư mục production cũ giữ nguyên để quay lui, kể cả `.next`.

## 1. Role và database riêng

Anh tự nhập mật khẩu. Lệnh này cần TTY.

```bash
ssh -t -i "$HOME/.ssh/id_ed25519" root@45.76.157.102
sudo -u postgres createuser --pwprompt --no-superuser --no-createdb --no-createrole --no-inherit pttshop_prod
sudo -u postgres createdb -O pttshop_prod pttshop_prod
```

Ghi mật khẩu vào file chỉ root đọc, không ghi vào repo, không in ra lệnh:

```bash
sudo install -m 600 /dev/null /root/pttshop-prod-db.pass
sudoedit /root/pttshop-prod-db.pass
```

File chỉ chứa mật khẩu, một dòng, không có URL. Kiểm tra role:

```bash
sudo -u postgres psql -c '\du pttshop_prod'
sudo -u postgres psql -c '\l pttshop_prod'
```

Dừng nếu role là superuser, có quyền tạo database, có quyền tạo role, hoặc owner của `pttshop_prod` không phải `pttshop_prod`.

## 2. Chặn ghi

Ứng dụng không có trang bảo trì. Không sửa Nginx. Dừng dịch vụ để không còn tiến trình ghi `prod.db`.

```bash
date -u +%Y-%m-%dT%H:%M:%SZ
sudo systemctl stop pttshop
systemctl is-active pttshop
sudo lsof /var/www/pttshop/data/prod.db || true
```

`is-active` phải là `inactive`. `lsof` không được thấy tiến trình nào. Còn tiến trình thì dừng, chưa chmod, chưa import.

## 3. Sao lưu cuối và khoá file SQLite

```bash
sudo /usr/local/bin/pttshop-backup.sh
NEW=$(ls -1t /var/backups/pttshop/prod-*.db.gz | head -n 1)
sha256sum "$NEW" | sudo tee "${NEW}.sha256"
sha256sum -c "${NEW}.sha256"
COPY=/var/backups/pttshop/cutover-source.db
sudo gzip -dc "$NEW" > "$COPY"
sudo sqlite3 "$COPY" "PRAGMA integrity_check;"
sudo sha256sum "$COPY" | sudo tee "${COPY}.sha256"
```

`pttshop-backup.sh` đã chạy `PRAGMA integrity_check` trước khi nén. Lệnh `sqlite3` ở trên phải in đúng `ok`. Sai thì dừng. Import chỉ đọc `$COPY`, không đọc `/var/www/pttshop/data/prod.db`.

```bash
sudo chmod 444 /var/www/pttshop/data/prod.db
stat -c '%a %U:%G' /var/www/pttshop/data/prod.db
```

Dòng quyền phải là `444 deploy:deploy`.

## 4. Tạo schema, nhập, đối chiếu

Các lệnh dưới đây đặt `DATABASE_URL` trong môi trường của một lệnh, chưa ghi vào env của dịch vụ `pttshop`. `dotenv` không ghi đè biến đã có. `EXCLUDE_LIST` không được set.

File một lần nằm trên `/run`, quyền `600`, user `deploy`. Mật khẩu không xuất hiện trên dòng lệnh.

```bash
sudo install -m 600 -o deploy -g deploy /dev/null /run/pttshop-cutover.env
sudo python3 - << 'PY'
import urllib.parse
from pathlib import Path
password = Path("/root/pttshop-prod-db.pass").read_text().strip()
url = "postgresql://pttshop_prod:" + urllib.parse.quote(password, safe="") + "@127.0.0.1:5432/pttshop_prod"
Path("/run/pttshop-cutover.env").write_text("DATABASE_URL=" + url + "\n")
print("wrote /run/pttshop-cutover.env user=pttshop_prod host=127.0.0.1 db=pttshop_prod")
PY
cd /var/www/pttshop-pg
sudo -u deploy bash -lc 'set -a; . /run/pttshop-cutover.env; set +a; unset EXCLUDE_LIST; cd /var/www/pttshop-pg && npx prisma migrate deploy'
sudo -u deploy bash -lc 'set -a; . /run/pttshop-cutover.env; set +a; unset EXCLUDE_LIST; cd /var/www/pttshop-pg && SQLITE_SOURCE=/var/backups/pttshop/cutover-source.db npm run import-from-sqlite'
sudo -u deploy bash -lc 'set -a; . /run/pttshop-cutover.env; set +a; unset EXCLUDE_LIST; cd /var/www/pttshop-pg && SQLITE_SOURCE=/var/backups/pttshop/cutover-source.db npm run verify-migration'
echo "verify_exit=$?"
```

`verify_exit` phải là 0. `migrate deploy` chỉ tạo schema trên `pttshop_prod`. Không seed, không reset. `verify-migration` phải in `Đối chiếu khớp`. Lệch một bản ghi thì nhánh quay lui «chưa đổi env». Giữ `/run/pttshop-cutover.env` cho tới khi env dịch vụ đã ghi xong.

## 5. Đổi DATABASE_URL của dịch vụ rồi khởi động

Giữ bản env cũ, quyền 600:

```bash
sudo cp -a /var/www/pttshop/.env /root/pttshop.env.before
sudo chmod 600 /root/pttshop.env.before
```

Sửa đúng một dòng trong `/var/www/pttshop/.env`. In diff đã che mật khẩu. Lệnh này dừng nếu có dòng khác đổi:

```bash
sudo python3 - << 'PY'
import os, urllib.parse
from pathlib import Path
env = Path("/var/www/pttshop/.env")
before = Path("/root/pttshop.env.before").read_text().splitlines()
password = Path("/root/pttshop-prod-db.pass").read_text().strip()
url = "postgresql://pttshop_prod:" + urllib.parse.quote(password, safe="") + "@127.0.0.1:5432/pttshop_prod"
old = env.read_text().splitlines()
out = []
replaced = 0
for line in old:
    if line.startswith("DATABASE_URL="):
        out.append("DATABASE_URL=" + url)
        replaced += 1
    else:
        out.append(line)
if replaced != 1:
    raise SystemExit(f"Số dòng DATABASE_URL là {replaced}")
env.write_text("\n".join(out) + "\n")
new = env.read_text().splitlines()
if len(new) != len(before):
    raise SystemExit("Số dòng env đổi")
for a, b in zip(before, new):
    if a == b:
        continue
    if not a.startswith("DATABASE_URL=") or not b.startswith("DATABASE_URL="):
        raise SystemExit("Có dòng khác DATABASE_URL bị đổi")
    print("- DATABASE_URL=file:/var/www/pttshop/data/prod.db")
    print("+ DATABASE_URL=postgresql://pttshop_prod:***@127.0.0.1:5432/pttshop_prod")
PY
sudo rm -f /run/pttshop-cutover.env
```

Trỏ tiến trình mới vào bản build PostgreSQL. Giữ `EnvironmentFile` cũ và hai drop-in `auth-secret.conf`, `payment-hold.conf`.

```bash
sudo tee /etc/systemd/system/pttshop.service.d/postgres.conf >/dev/null << 'EOF'
[Service]
WorkingDirectory=/var/www/pttshop-pg
EOF
sudo systemctl daemon-reload
cd /var/www/pttshop-pg
sudo -u deploy bash -lc 'set -a; . /var/www/pttshop/.env; set +a; npx prisma migrate deploy'
```

Lần `migrate deploy` này phải báo schema đã đủ, không áp migration mới, không seed. Sai thì quay lui, chưa cần giữ dịch vụ ở trạng thái mới.

```bash
sudo systemctl start pttshop
systemctl is-active pttshop
PID=$(systemctl show pttshop -p MainPID --value)
readlink /proc/"$PID"/cwd
tr '\0' '\n' < /proc/"$PID"/environ | sed -n 's#^\(DATABASE_URL=postgresql://pttshop_prod:\)[^@]*#\1***#p'
```

`cwd` phải là `/var/www/pttshop-pg`. Dòng env in ra phải là `DATABASE_URL=postgresql://pttshop_prod:***@127.0.0.1:5432/pttshop_prod`.

## 6. Kiểm tra sau chuyển

```bash
curl -sS -o /dev/null -w 'home %{http_code}\n' http://127.0.0.1:3400/
curl -sS -o /dev/null -w 'san-pham %{http_code}\n' http://127.0.0.1:3400/san-pham
curl -sS -o /dev/null -w 'quote %{http_code}\n' 'http://127.0.0.1:3400/api/shipping/quote?subtotal=100000'
ss -ltnp | grep 5432
stat -c '%a %U:%G' /var/www/pttshop/data/prod.db
```

Ba mã HTTP phải là 200. Postgres chỉ nghe `127.0.0.1:5432`. `prod.db` vẫn `444 deploy:deploy`.

`/admin` để anh tự đăng nhập. Không tạo đơn thử khi chưa có câu duyệt riêng cho việc đó.

## Quay lui trong 15 phút

Ghi giờ bắt đầu. Xong khi trang chủ và `/dang-nhap` trả 200. Tổng thời gian phải dưới 900 giây. Giữ database PostgreSQL và các file dump để đối chiếu. Không seed, không reset, không xoá backup.

### Chưa đổi env

```bash
START=$(date +%s)
sudo rm -f /run/pttshop-cutover.env
sudo chmod 640 /var/www/pttshop/data/prod.db
stat -c '%a %U:%G' /var/www/pttshop/data/prod.db
sudo systemctl start pttshop
curl -sS -o /dev/null -w 'home %{http_code}\n' http://127.0.0.1:3400/
curl -sS -o /dev/null -w 'login %{http_code}\n' http://127.0.0.1:3400/dang-nhap
echo "seconds $(( $(date +%s) - START ))"
```

Quyền phải là `640 deploy:deploy`. Hai HTTP phải là 200.

### Đã đổi env

```bash
START=$(date +%s)
sudo rm -f /run/pttshop-cutover.env
sudo systemctl stop pttshop
sudo cp -a /root/pttshop.env.before /var/www/pttshop/.env
sudo chmod 640 /var/www/pttshop/.env
sudo chown deploy:deploy /var/www/pttshop/.env
sudo rm -f /etc/systemd/system/pttshop.service.d/postgres.conf
sudo systemctl daemon-reload
sudo chmod 640 /var/www/pttshop/data/prod.db
stat -c '%a %U:%G' /var/www/pttshop/data/prod.db
sudo systemctl start pttshop
PID=$(systemctl show pttshop -p MainPID --value)
readlink /proc/"$PID"/cwd
curl -sS -o /dev/null -w 'home %{http_code}\n' http://127.0.0.1:3400/
curl -sS -o /dev/null -w 'login %{http_code}\n' http://127.0.0.1:3400/dang-nhap
echo "seconds $(( $(date +%s) - START ))"
```

`cwd` phải là `/var/www/pttshop`. Quyền `prod.db` phải là `640 deploy:deploy`. Hai HTTP phải là 200. `seconds` phải nhỏ hơn 900.

File `deploy/rollback-to-sqlite.md` ghi `chmod 644`. Với file đang là `640 deploy:deploy`, lần chuyển này dùng `chmod 640`.

## 7. Cron

Chỉ bật cron `pg_dump` sau khi mục 6 đạt. Chưa tắt cron SQLite.

Máy chủ là UTC. Dump lúc 17:30 UTC, tức 00:30 giờ Việt Nam:

```bash
sudo tee /etc/cron.d/pttshop-pg-backup >/dev/null << 'EOF'
CRON_TZ=UTC
30 17 * * * root bash -c 'set -a; . /var/www/pttshop/.env; set +a; exec /var/www/pttshop-pg/deploy/pg-backup.sh' >> /var/log/pttshop-pg-backup.log 2>&1
EOF
sudo chmod 644 /etc/cron.d/pttshop-pg-backup
```

Script giữ 14 bản ngày và 8 bản tuần, không in chuỗi kết nối. Bản ra máy Mac vẫn do anh tự chạy theo `deploy/pg-offsite-mac.md`.

Cron SQLite đang là `/etc/cron.d/pttshop-backup`: 19:15 UTC sao lưu, 01:30 UTC kiểm tra bản không cũ quá 26 giờ. Giữ nguyên. `prod.db` ở quyền 444 vẫn đọc được khi root sao lưu.

Sau 14 ngày chạy ổn, tắt cron SQLite bằng cách đổi tên file đó, và chỉ khi có một câu duyệt riêng. Khi đó mới đề xuất chuyển `prod.db` vào `/var/backups/pttshop/archive/`. Chưa xoá file gốc.
