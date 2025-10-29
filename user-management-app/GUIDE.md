# Project GUIDE — user-management-app

Ngày: 2025-10-29

Mục đích: hướng dẫn chi tiết từng bước để thiết lập và chạy toàn bộ dự án `user-management-app` (Backend: Node/Express + MongoDB + Cloudinary; Frontend: Expo React Native) trên máy Windows (PowerShell).

---

## Tổng quan thứ tự công việc

1. Cài đặt môi trường dev (Node, npm, MongoDB, Expo).
2. Cấu hình và chạy Backend (kết nối MongoDB, biến môi trường, Cloudinary, start server).
3. Cấu hình Frontend (cập nhật baseURL nếu cần, cài packages SVG/QR, start Expo).
4. Chạy end-to-end: login, add/edit user, upload ảnh, QR, delete.
5. Xử lý lỗi thường gặp & mẹo debug.

---

## 1) Yêu cầu trước khi bắt đầu

- Node.js (phiên bản >=16 LTS). Kiểm tra:

```powershell
node -v
npm -v
```

- MongoDB server (local) hoặc MongoDB Atlas (cloud).
- Expo CLI (tuỳ chọn, chỉ để chạy các lệnh global):

```powershell
npm install -g expo-cli
```

- Trình giả lập/simulator hoặc Expo Go (trên điện thoại). Nếu dùng thiết bị thật, đảm bảo điện thoại và máy dev cùng mạng LAN.

---

## 2) Backend — thiết lập và chạy

Đường dẫn backend trong repo: `d:\DNT\test1\backend`

1. Tạo file `.env` (nằm trong `d:\DNT\test1\backend`) với nội dung ví dụ:

```env
# .env
MONGO_URI=mongodb://localhost:27017/user_management_db
JWT_SECRET=change_this_to_a_secure_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
```

- Nếu dùng MongoDB Atlas thay `MONGO_URI` bằng connection string Atlas.

2. Cài dependencies & chạy server (PowerShell):

```powershell
cd d:\DNT\test1\backend
npm install
# nếu package.json có script dev (nodemon):
npm run dev
# hoặc
node index.js
```

3. Kiểm tra kết nối MongoDB
- Trong log server, bạn nên thấy message `MongoDB connected` hoặc tương tự.

4. Kiểm tra các route chính (Postman hoặc curl):

```powershell
curl http://localhost:5000/api/users
curl -X POST http://localhost:5000/api/users/login -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"password"}'
```

5. Cloudinary (upload ảnh)
- Đăng ký Cloudinary, lấy `cloud_name`, `api_key`, `api_secret`, điền vào `.env`.
- Server sẽ dùng `cloudinary.v2` hoặc SDK để upload file và trả về URL.

6. Middleware cần có (nếu chưa):
- CORS: `app.use(require('cors')());`
- Body parser: `app.use(express.json());`
- Multer (nếu server nhận file multipart).

---

## 3) Frontend (Expo) — thiết lập và chạy

Đường dẫn frontend: `d:\DNT\test1\user-management-app`

1. Cài dependencies:

```powershell
cd d:\DNT\test1\user-management-app
npm install
# cài module svg + qrcode nếu chưa có
expo install react-native-svg
npm install react-native-qrcode-svg
```

2. Cấu hình baseURL/API
- Mở file: `user-management-app/services/api.ts` (hoặc tương tự) và kiểm tra `baseURL`.
- Nếu bạn test trên thiết bị thật, `localhost` KHÔNG hoạt động — phải dùng IP LAN của máy dev. Ví dụ:

```ts
export const API_BASE = 'http://192.168.1.100:5000/api';
```

- Lấy IP LAN trên PowerShell bằng `ipconfig` và tìm `IPv4 Address` tương ứng với adapter mạng đang sử dụng.

3. TypeScript declarations (nếu project dùng TS và thiếu types):
- Nếu IDE báo lỗi cho `react-native-qrcode-svg` hoặc `react-native-svg`, thêm `declarations.d.ts` (đã có trong repo):

```ts
declare module 'react-native-qrcode-svg';
declare module 'react-native-svg';
```

4. Start Expo:

```powershell
cd d:\DNT\test1\user-management-app
npx expo start -c
```

- `-c` clear cache (giúp khắc phục các lỗi module/native).

5. Mở app
- Dùng Expo Go (quét QR) hoặc chạy trên emulator. Nếu dùng Android emulator, có thể chọn `Run on Android device/emulator` từ DevTools.

---

## 4) Chạy flow kiểm thử (end-to-end)

1. Bật backend (`npm run dev` hoặc `node index.js`).
2. Bật frontend (`npx expo start -c`).
3. Mở app trên thiết bị/simulator.
4. Login:
   - Dùng tài khoản có sẵn hoặc dev-fake login flow (nếu app hỗ trợ).
5. Users list:
   - Add user: điền username/email/password + chọn ảnh -> upload -> kiểm tra ảnh hiển thị.
   - Edit: chỉnh dữ liệu -> lưu -> kiểm tra DB.
   - Delete: swipe left -> delete -> đảm bảo record bị xóa.
   - QR: bấm icon QR trên card -> modal hiện mã QR (nội dung JSON hoặc id tuỳ cấu hình).

---

## 5) Mẹo xử lý lỗi phổ biến

- Metro không tìm `react-native-svg` sau khi cài:
  - Chạy: `npx expo start -c` để clear cache.
  - Nếu ở bare RN: chạy `pod install` trong `ios/` rồi build lại.

- App trên điện thoại không gọi được backend:
  - Dùng IP LAN (ví dụ: `http://192.168.1.100:5000`) thay vì `localhost`.
  - Kiểm tra firewall (Windows Defender) - mở port 5000 hoặc tắt tạm firewall.

- Lỗi CORS khi gọi API từ frontend:
  - Backend cần dùng `cors` middleware: `npm i cors` rồi `app.use(require('cors')());`

- Lỗi 401 JWT:
  - Kiểm tra `JWT_SECRET` trong `.env` và mã hóa token trên server.
  - Client gửi header `Authorization: Bearer <token>`.

- Lỗi upload FormData:
  - Client phải gửi `FormData` đúng key (ví dụ `image`) và backend phải dùng multer hoặc tương đương để parse.

---

## 6) Security & Best practices (ngắn)

- Luôn hash password bằng `bcrypt` trước khi lưu (ví dụ `bcrypt.hash(password, 10)`).
- Không chấp nhận profile social từ client mà không verify token với nhà cung cấp (Google/Facebook) trên server.
- Đặt `JWT` expiration hợp lý; sử dụng refresh token nếu cần.
- Giới hạn kích thước file upload và validate mime/type.
- Đặt `.env` vào `.gitignore`.

---

## 7) Deploy (gợi ý ngắn)

- Backend: deploy lên Heroku / Render / DigitalOcean / Azure. Dùng MongoDB Atlas cho production.
- Frontend: build bằng EAS (Expo Application Services) hoặc tạo native builds (bare workflow).

---

## 8) Các lệnh tóm tắt (PowerShell) — copy/paste

```powershell
# Backend
cd d:\DNT\test1\backend
npm install
# set .env then
npm run dev  # or node index.js

# Frontend
cd d:\DNT\test1\user-management-app
npm install
expo install react-native-svg
npm install react-native-qrcode-svg
npx expo start -c
```

---

Nếu bạn muốn, tôi có thể thực hiện thêm những việc sau ngay bây giờ:

- (A) Gắn baseURL trong `services/api.ts` thành IP LAN của bạn (nếu bạn cung cấp IP).
- (B) Tạo Postman collection / curl scripts cho các endpoint chính (login, CRUD, upload).
- (C) Commit `GUIDE.md` vào git & tạo PR (nếu repo đang kết nối và bạn muốn tôi tạo branch PR).

Thông báo cho tôi muốn làm mục nào tiếp theo (A / B / C / hoặc khác).