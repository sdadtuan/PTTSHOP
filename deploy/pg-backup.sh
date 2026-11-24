#!/usr/bin/env bash
# Sao lưu PostgreSQL bằng pg_dump. Không in chuỗi kết nối.
# Giữ 14 bản gần nhất trong /var/backups/pttshop. Số bản giữ lại đang [cần chốt].
set -euo pipefail

BACKUP_DIR=/var/backups/pttshop
KEEP=14

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

count=0
for old in $(ls -1t "$BACKUP_DIR"/pg-*.dump 2>/dev/null); do
  count=$((count + 1))
  if [ "$count" -gt "$KEEP" ]; then
    rm -f "$old"
    echo "Xoá bản cũ $(basename "$old")"
  fi
done
