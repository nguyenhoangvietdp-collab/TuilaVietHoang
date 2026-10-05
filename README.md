# Tui là Việt Hoàng

Portfolio của Nguyễn Hoàng Việt, kể chuyện qua bốn chặng: Trường học, Về tôi, Kinh nghiệm và Ngoài lề.

## Chạy trên máy

Yêu cầu Node.js 20 trở lên. Không cần cài thư viện.

```sh
npm start
```

Mở http://127.0.0.1:4173. Có thể đổi cổng bằng biến môi trường PORT.

## Chỉnh nội dung

Nội dung và vị trí ảnh nằm ở `dist/data/portfolio.json`; cấu hình feed tùy chọn nằm ở `dist/data/config.json`. Sau khi sửa, chạy:

```sh
npm run bundle
npm run check
```

`dist/bundled-content.js` cung cấp nội dung dự phòng để website hoạt động độc lập với Drive. Ảnh WebP đã có sẵn trong `dist/assets/photos`, gồm ảnh được gán theo tên vị trí trong Drive, gallery bonus và bộ ảnh Kết nối. Về tôi có bốn mốc.

## Đưa lên hosting

Website tĩnh: đăng toàn bộ thư mục `dist/` lên hosting hỗ trợ HTML/CSS/JavaScript. Không cần backend để xem portfolio. `backend/sync-drive.mjs` là tiện ích đồng bộ Drive tùy chọn; thông tin xác thực được truyền qua stdin, không ghi vào file hay commit vào Git.

Tương tác gồm ảnh đổi theo nội dung đang đọc, chữ menu chuyển xuống nhãn chặng khi cuộn, chuyển tên mở đầu lên header, giao diện sáng/tối và gallery câu chuyện. Điện thoại dùng bố cục thu gọn; chế độ giảm chuyển động được tôn trọng.

Một số câu chuyện và góc nhìn là nội dung sáng tác cho bản demo. Ảnh thuộc bộ sưu tập do chủ portfolio cung cấp; repository không cấp quyền tái sử dụng ảnh cá nhân.

Website hiện tại: https://personal-chapters-ghi.nguyenhoangvietdp.chatgpt.site/


## Website công khai trên GitHub Pages

https://nguyenhoangvietdp-collab.github.io/TuilaVietHoang/

GitHub Pages dùng nhánh main, thư mục /docs. Sau khi sửa dist/data/portfolio.json hoặc giao diện trong dist, chạy npm run build:pages và npm run check rồi commit, push lên main. Thư mục docs chứa bản website tĩnh cùng ảnh WebP, không cần backend trả phí.
