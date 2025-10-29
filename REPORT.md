REPORT - Đề thi giữa kỳ (RN + Expo + MongoDB)

Mục tiêu: Xây dựng app quản lý người dùng (admin) đa nền tảng bằng React Native (Expo) với backend Node/Express và MongoDB.

Các bước thực hiện (tóm tắt):
1. Scaffold backend (Express) với mô hình `User` gồm 4 trường: username, email, password, image.
2. Implement API CRUD: GET/POST/PUT/DELETE và login.
3. Scaffold frontend (Expo) với 3 màn hình: Login, Users list, Add/Edit user.
4. Image upload: frontend chuyển file ảnh thành base64, gửi trong trường `image`.
5. Password: lưu dưới dạng băm (bcrypt) trong trường `password`.

Lệnh & chụp ảnh minh họa:
- Backend:
  - copy `.env.example` -> `.env` và set `MONGO_URI`
  - npm install
  - npm run dev

- Mobile:
  - cd mobile
  - npm install
  - npx expo start

(Thêm ảnh chụp màn hình khi demo và link video lên GitHub)

Link source code: <PUT_GITHUB_LINK_HERE>

Link video demo: <PUT_VIDEO_LINK_HERE>

Ghi chú: Cơ sở dữ liệu chỉ chứa các trường: username, email, password, image. Không thêm trường khác.
