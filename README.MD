CẤU TRÚC:
fetcher
- index.js -> file chính gọi các API của AddressKit
- validate.js -> kiểm tra dữ liệu trả về
- schedule.js -> chạy cron update dữ liệu hằng ngày
data
- full-address.json -> sau khi npm run fetch sẽ gọi ra toàn bộ 
                       danh sách tỉnh-huyện-xã mới nhất
- snapshots -> lưu lịch sử các lần update
utils
- file.js -> đọc/ghi JSON
- logger.js -> ghi log hoạt động của fetch