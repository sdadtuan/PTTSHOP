# Sao lưu PostgreSQL ra máy Mac

Cửa sổ bảo trì production, khi đến ngày chuyển: 23:00–00:00 giờ Việt Nam. Ngày cụ thể chọn sau khi Phần B được duyệt. Phần này chưa đặt lịch trên production.

Trên máy chủ, `deploy/pg-backup.sh` giữ 14 bản ngày (`pg-YYYYMMDD-HHMMSS.dump`) và 8 bản tuần (`pg-weekly-YYYY-Www.dump`) trong `/var/backups/pttshop`. Script không in chuỗi kết nối.

Anh tự chạy lệnh dưới đây trên máy Mac. Không lưu khoá SSH, mật khẩu hay chuỗi kết nối vào repo.

```bash
mkdir -p "$HOME/Backups/pttshop"
rsync -a \
  -e "ssh -o BatchMode=yes -i $HOME/.ssh/id_ed25519" \
  root@45.76.157.102:/var/backups/pttshop/pg-*.dump \
  root@45.76.157.102:/var/backups/pttshop/pg-weekly-*.dump \
  "$HOME/Backups/pttshop/"
```

Có thể đặt lệnh đó chạy mỗi ngày sau giờ dump trên máy chủ, bằng cron của máy Mac. Khoá dùng khoá SSH đang có trên máy, không chép vào git.
