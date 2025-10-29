# Báo cáo chi tiết - Dự án user-management-app

## Tóm tắt
Mục tiêu chính:
- Hoàn thiện UI/UX cho trang quản trị (Users List, Add/Edit, Login).
- Thêm QR code hiển thị cho từng user (dùng `react-native-qrcode-svg`).
- Cho phép image upload và lưu URL (đã thực hiện trong các phần trước của dự án).
- Bật Dark Mode tự động theo hệ thống (sử dụng `useColorScheme`).


   ## 1. Tóm tắt & công nghệ

   - Frontend: React Native (Expo), TypeScript, Axios, AsyncStorage, `expo-image-picker`, `react-native-qrcode-svg`.
   - Backend: Node.js, Express, MongoDB (Mongoose), Cloudinary (upload ảnh), JWT cho auth.
   - Lưu trữ: MongoDB (local hoặc Atlas).
   - Giao thức: REST API (JSON).

   ## 2. Kiến trúc hệ thống

   - Client (React Native, Expo): Hiển thị UI, gọi API, lưu JWT vào AsyncStorage.
   - Server (Node/Express): Xử lý xác thực (login), CRUD user, upload ảnh (Cloudinary) và trả về URL ảnh.
   - Database (MongoDB): Lưu user với 4 trường: `username`, `email`, `password` (bcrypt hash), `image` (URL hoặc base64 nếu không dùng Cloudinary).

   Luồng cơ bản:
   - Người dùng đăng nhập → server trả JWT → client lưu token → client gọi API có auth header.

   ## 3. Thiết lập môi trường (PowerShell — Windows)

   1) Backend (node)

   ```powershell
   # 1. Tạo folder và cài đặt
   cd path\to\project
   mkdir backend; cd backend
   npm init -y
   npm install express mongoose dotenv bcryptjs jsonwebtoken cors multer cloudinary
   npm install -D nodemon

   # 2. Tạo file .env
   # Ví dụ .env
   # MONGO_URI=mongodb://localhost:27017/user_management_db
   # JWT_SECRET=some_super_secret
   # CLOUDINARY_CLOUD_NAME=...
   # CLOUDINARY_API_KEY=...
   # CLOUDINARY_API_SECRET=...
   # PORT=5000

   # 3. Chạy server
   npm run dev
   ```

   2) Frontend (Expo)

   ```powershell
   # 1. Vào folder frontend
   cd user-management-app
   npm install
   # Expo và dependencies
   npx expo install expo-image-picker react-native-svg
   npm install axios @react-native-async-storage/async-storage react-native-qrcode-svg

   # 2. Chạy dev server (xóa cache nếu cần)
   npx expo start -c
   ```

   ## 4. Backend — API endpoints (chi tiết)

   Các endpoint chính (cần có để frontend hoạt động):

   | Method | Endpoint | Mô tả |
   |---|---|---|
   | POST | /api/users/login | Đăng nhập (email, password) → trả token, user |
   | GET | /api/users | Lấy danh sách người dùng |
   | POST | /api/users | Tạo user mới (username, email, password, image) |
   | GET | /api/users/:id | Lấy user theo id |
   | PUT | /api/users/:id | Cập nhật user (username, email, image) |
   | DELETE | /api/users/:id | Xóa user |
   | POST | /api/uploads/user/:id/image | Upload ảnh (multipart/form-data) → trả URL |

   Authentication: JWT trong header Authorization: Bearer <token>. Middleware kiểm token, trả 401 nếu expired.


   ## 5. Frontend — cấu trúc & màn hình chính

   - `app/login.tsx`: Form đăng nhập. Sau login lưu `token` và `user` (AsyncStorage), chuyển sang `(tabs)`.
   - `app/(tabs)/index.tsx`: Danh sách người dùng — tìm kiếm, swipe delete, nút Add, QR modal, Edit.
   - `app/add-user.tsx` & `app/edit-user.tsx`: Form thêm/sửa người dùng, chọn ảnh (camera / library), gọi upload và create/update API.
   - `components/AddEditUserForm.tsx`: Form dùng chung cho add & edit.
   - `app/(tabs)/explore.tsx`: Admin settings — hiển thị thông tin admin, edit profile, logout.
   - `services/api.ts`: Axios instance với baseURL; interceptor gắn token tự động.

   Giao diện hỗ trợ Dark Mode và có theme hook `utils/theme.tsx` (follow system or persisted override).


   ## 6. HƯỚNG DẪN SỬ DỤNG CHI TIẾT (kèm ví dụ và kiểm tra)

   Phần này hướng dẫn từng chức năng: kết nối DB, đăng nhập, thêm, hiển thị, xóa, sửa, tìm kiếm, QR, đăng xuất, setting admin.

   1) Kết nối database
   - Đảm bảo `MONGO_URI` trong file `.env` đã đúng: local hoặc Atlas.
   - Chạy `npm run dev` trong folder backend; kiểm tra log "MongoDB connected".

   2) Đăng nhập (Login)
   - Mở app (Expo). Giao diện Login yêu cầu `email` + `password`.
   - Nếu account chưa có, dùng endpoint POST `/api/users` để tạo 1 admin test (hoặc seed DB).
   - Sau login thành công, token được lưu vào AsyncStorage (`token`) và user được lưu (`user`).

   3) Thêm người dùng
   - Vào màn hình Add User (nút +). Nhập `username`, `email`, `password` (nếu tạo mới), chọn ảnh từ thư viện hoặc camera.
   - Ảnh sẽ được upload lên Cloudinary (nếu backend implement upload) và endpoint tạo user lưu URL vào `image`.
   - Hoàn tất → điều hướng trả về danh sách và tải lại.

   4) Hiển thị danh sách
   - Màn `User List` lấy `/api/users` và hiển thị card cho mỗi user: avatar (image URL), username, email.
   - Tìm kiếm realtime: input filter theo `username` hoặc `email`.

   5) Xóa người dùng
   - Hai cách: swipe-to-delete hoặc nút Delete.
   - Khi xóa, app gọi DELETE `/api/users/:id`. Sau khi thành công call, load lại danh sách.

   6) Sửa người dùng
   - Bấm nút Edit (dẫn tới modal màn `edit-user?id=...`), sửa trường `username`, `email` và/hoặc thay ảnh.
   - Gửi PUT `/api/users/:id` với payload `{ username, email, image }`.
   - Nếu dùng upload riêng, upload ảnh trước, nhận URL, rồi PUT với URL.

   7) Tìm kiếm
   - Thanh tìm kiếm ở top filter client-side: tìm theo `username` và `email`.

   8) QR Code
   - Mỗi user có nút QR: mở modal chứa `<QRCode value={JSON.stringify({ _id, username, email })} />`.
   - Mã QR có thể dùng để scan bằng camera app khác; payload chứa id/username/email.

   9) Đăng xuất
   - Gọi `AsyncStorage.removeItem('token')` và `AsyncStorage.removeItem('user')` rồi router.replace('/login').

   10) Admin Settings (Setting)
   - Màn `explore.tsx` hiển thị thông tin admin (từ AsyncStorage) và cho phép sửa thông tin cá nhân.
   - Khi Save: gọi PUT `/api/users/:id` (nếu id có) và persist vào AsyncStorage.

   ## 7. Kiểm thử & xác minh

   Checklist kiểm thử (manual):
   - [x] Đăng nhập/luồng auth hoạt động (token được lưu và tự gắn vào header).
   - [x] Danh sách người dùng lấy đúng dữ liệu từ API.
   - [x] Thêm người dùng hiện ảnh đúng sau upload.
   - [x] Sửa user cập nhật server + AsyncStorage.
   - [x] Xóa user hoạt động và danh sách refresh.
   - [x] Tìm kiếm trả về kết quả realtime.
   - [x] QR modal hiển thị và mã có payload hợp lệ.

   Gợi ý test nhanh (PowerShell + curl) — kiểm tra API backend:

   ```powershell
   # Get users
   curl http://localhost:5000/api/users

   # Create user (example)
   curl -X POST http://localhost:5000/api/users -H "Content-Type: application/json" -d '{"username":"test","email":"t@test.com","password":"pass"}'
   ```

   ## 8. Triển khai & lưu ý vận hành

   - Khi chạy trên thiết bị thật: đảm bảo `services/api.ts` chứa `baseURL` là IP LAN của máy (ví dụ `http://192.168.1.100:5000/api`).
   - Nếu dùng Cloudinary, set biến môi trường chính xác trong backend.
   - Đóng gói release (EAS hoặc expo build) khi cần phát hành.


   ## 9. Phụ lục — các lệnh & khắc phục sự cố thường gặp

   Chạy frontend:

   ```powershell
   cd user-management-app
   npm install
   npx expo start -c
   ```

   Chạy backend:

   ```powershell
   cd backend
   npm install
   npm run dev
   ```

   Nếu frontend không kết nối tới backend trên thiết bị thật:

   - Kiểm tra `services/api.ts` và đảm bảo `baseURL` dùng IP LAN của máy (không dùng `localhost`).
   - Kiểm tra firewall và mở port 5000.
   - Chạy `npx expo start` rồi dùng QR/Expo Go hoặc `expo dev-client`.

   Lỗi axios "401 Unauthorized":

   - Kiểm tra token trong AsyncStorage. Nếu token hết hạn, gọi logout và login lại.

   Lỗi react-native-svg khi chạy: cài `expo install react-native-svg` và restart Metro với cache clear `npx expo start -c`.



   ## 10. Hướng dẫn thao tác (tóm tắt từng bước công việc)

   1) Tạo admin (nếu chưa có): POST `/api/users` hoặc seed DB.
   2) Mở app → Login với admin → vào tab Users.
   3) Thêm user: nhấn + → chọn ảnh → nhập username, email (và password nếu add) → Save.
   4) Sửa user: nhấn Edit → chỉnh → Save.
   5) Xóa user: swipe → Delete hoặc nút Delete.
   6) Tìm kiếm: nhập tên hoặc email vào ô tìm kiếm.
   7) QR: bấm icon QR trên card → modal QR hiện lên → scan bằng app khác.
   8) Logout: bấm Logout → Confirm → trở về Login.



   ## 11. Thông tin mã nguồn & liên hệ

   - Repo (frontend): `user-management-app` (thư mục `app/`) — chứa các màn hình chính: `login.tsx`, `(tabs)/index.tsx`, `add-user.tsx`, `edit-user.tsx`, `(tabs)/explore.tsx`.
   - Repo (backend): `backend` (Express + routes, controllers, models/User.js).
   - Nếu cần demo chi tiết, cung cấp video demo & screenshot: cập nhật link ở đầu báo cáo.

  ## 13. Code chính — các chức năng cốt lõi

  1) services/api.ts — Axios instance và các API helpers

  ```ts
  import axios from 'axios';
  import AsyncStorage from '@react-native-async-storage/async-storage';

  const API = axios.create({ baseURL: 'http://192.168.1.100:5000/api' });

  API.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      if (!config.headers) config.headers = {} as any;
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  });

  API.interceptors.response.use((res) => res, async (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(err);
  });

  export const fetchUsers = () => API.get('/users');
  export const fetchUserById = (id: string) => API.get(`/users/${id}`);
  export const createUser = (data: any) => API.post('/users', data);
  export const updateUser = (id: string, data: any) => API.put(`/users/${id}`, data);
  export const deleteUser = (id: string) => API.delete(`/users/${id}`);
  export default API;
  ```

  2) Login — handleLogin (login.tsx)

  ```tsx
  const handleLogin = async () => {
    try {
      setLoading(true);
      const res = await API.post('/users/login', { email, password });
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      router.replace('/');
    } catch (e) {
      Alert.alert('Lỗi', 'Sai email hoặc mật khẩu');
    } finally { setLoading(false); }
  };
  ```

  3) Lấy danh sách người dùng & filter (index.tsx)

  ```tsx
  const loadUsers = async () => {
    try {
      const res = await fetchUsers();
      setUsers(res.data || []);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải danh sách người dùng');
    }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(query) ||
    (u.email || '').toLowerCase().includes(query)
  );
  ```

  4) Tạo / Cập nhật user (AddEditUserForm.tsx)

  ```tsx
  const handleSubmit = async () => {
    const payload = { username, email, image: imageUri };
    if (isEdit) {
      await updateUser(id, payload);
    } else {
      await createUser({ ...payload, password });
    }
    router.replace('/');
  };
  ```

  5) Xóa user (index.tsx)

  ```tsx
  const handleDelete = async (id: string) => {
    Alert.alert('Xóa người dùng', 'Bạn có chắc chắn?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
          await deleteUser(id);
          await loadUsers();
      }}
    ]);
  };
  ```

  6) Upload ảnh (ví dụ upload lên Cloudinary via backend)

  ```ts
  // frontend: gửi file lên endpoint upload (multipart)
  const uploadImage = async (uri: string, userId: string) => {
    const form = new FormData();
    form.append('image', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as any);
    const res = await fetch(`${API_BASE}/uploads/user/${userId}/image`, {
      method: 'POST',
      body: form,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return await res.json(); // expect { url: 'https://...' }
  };
  ```

  7) QR modal render (index.tsx)

  ```tsx
  <Modal visible={!!qrUser} transparent>
    <View style={...}>
      {/* @ts-ignore */}
      <QRCode value={JSON.stringify({ _id: qrUser._id, username: qrUser.username, email: qrUser.email })} size={180} />
    </View>
  </Modal>
  ```

  8) Theme hook (utils/theme.tsx)

  ```ts
  import { useColorScheme } from 'react-native';
  import { useState, useEffect, useCallback } from 'react';
  import AsyncStorage from '@react-native-async-storage/async-storage';

  const light = { background: '#F5F7FB', surface: '#fff', card: '#fff', text: '#111', subtext: '#666', border: '#e8e8e8', gradient: ['#F8FAFF','#EEF3FF'], primary: '#007AFF' };
  const dark = { background: '#0B1220', surface: '#0F1724', card: '#0B1220', text: '#F8FAFC', subtext: '#9CA3AF', border: '#162029', gradient: ['#071226','#0B1B2E'], primary: '#3B82F6' };

  export default function useTheme() {
    const system = useColorScheme();
    const [override, setOverride] = useState<'light'|'dark'|null>(null);
    useEffect(() => { AsyncStorage.getItem('app_theme_preference').then(v => setOverride(v === 'dark' ? 'dark' : v === 'light' ? 'light' : null)); }, []);
    const scheme = override ?? system;
    const colors = scheme === 'dark' ? dark : light;
    const toggle = useCallback(() => { AsyncStorage.setItem('app_theme_preference', scheme === 'dark' ? 'light' : 'dark'); setOverride(scheme === 'dark' ? 'light' : 'dark'); }, [scheme]);
    return { scheme, colors, isDark: scheme === 'dark', toggle } as const;
  }
  ```

  9) Admin Settings — saveEdit (explore.tsx)

  ```tsx
  const saveEdit = async () => {
    if (!username.trim()) return setUsernameError('Tên đăng nhập bắt buộc');
    setLoading(true);
    try {
      const id = (user as any)._id;
      const payload = { username: username.trim(), email: email.trim() };
      if (id) await updateUser(id, payload);
      const updated = { ...(user as any), ...payload };
      await AsyncStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setEditing(false);
    } catch (e) { Alert.alert('Lỗi', 'Không thể cập nhật'); }
    finally { setLoading(false); }
  };
  ```

