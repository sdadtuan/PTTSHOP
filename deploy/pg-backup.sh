#!/usr/bin/env bash
# Sao lưu PostgreSQL bằng pg_dump. Không in chuỗi kết nối.
# Giữ 14 bản ngày và 8 bản tuần trong /var/backups/pttshop.
set -euo pipefail

BACKUP_DIR=/var/backups/pttshop
KEEP_DAILY=14
KEEP_WEEKLY=8

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Thiếu DATABASE_URL" >&2
  exit 1
fi
case "$DATABASE_URL" in
  postgres://*|postgresql://*) ;;
  *)
    echo "DATABASE_URL không phải PostgreSQL" >&2
    exit 1
    ;;
esac

mkdir -p "$BACKUP_DIR"
STAMP=$(date -u +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/pg-$STAMP.dump"
pg_dump -Fc --file "$OUT" "$DATABASE_URL"
echo "Đã ghi $(basename "$OUT")"

WEEK=$(TZ=Asia/Ho_Chi_Minh date +%G-W%V)
WEEKLY="$BACKUP_DIR/pg-weekly-$WEEK.dump"
if [ "$(TZ=Asia/Ho_Chi_Minh date +%u)" = "7" ] || [ ! -f "$WEEKLY" ]; then
  cp "$OUT" "$WEEKLY"
  echo "Đã ghi bản tuần $(basename "$WEEKLY")"
fi

count=0
for old in $(ls -1t "$BACKUP_DIR"/pg-[0-9]*.dump 2>/dev/null); do
  count=$((count + 1))
  if [ "$count" -gt "$KEEP_DAILY" ]; then
    rm -f "$old"
    echo "Xoá bản ngày cũ $(basename "$old")"
  fi
done

count=0
for old in $(ls -1t "$BACKUP_DIR"/pg-weekly-*.dump 2>/dev/null); do
  count=$((count + 1))
  if [ "$count" -gt "$KEEP_WEEKLY" ]; then
    rm -f "$old"
    echo "Xoá bản tuần cũ $(basename "$old")"
  fi
done
