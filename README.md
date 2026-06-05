# Ứng dụng Quản lý Chi tiêu Cá nhân & Gia đình (AI Smart Finance)

Dự án Đồ án môn học Công nghệ Phần mềm / Lập trình Web. Ứng dụng được xây dựng trên kiến trúc phân tách giữa Node.js/Express Backend và Next.js 14 Frontend.

## 🚀 Các Tính Năng Nổi Bật

1. **Quản lý Thu Chi & Danh Mục**: CRUD giao dịch thu/chi linh hoạt. Phân biệt danh mục hệ thống dùng chung và danh mục cá nhân do người dùng tự tạo.
2. **Thiết Lập Ngân Sách (Budgets)**: Thiết lập hạn mức chi tiêu hàng tháng theo từng danh mục. Cảnh báo tự động ngay khi giao dịch chi tiêu mới vượt hạn mức ngân sách tháng.
3. **Cố Vấn Tài Chính AI**: Tích hợp AI sinh thành (Gemini API) đóng vai trò cố vấn tài chính cá nhân để đưa ra lời khuyên tiết kiệm, chi tiêu hợp lý dựa trên dữ liệu giao dịch thực tế.
4. **Xuất Báo Cáo Tài Chính**: Tải báo cáo chi tiết định dạng **Excel (.xlsx)** hoặc **PDF** hỗ trợ Unicode tiếng Việt đầy đủ.
5. **Phân Quyền User/Admin**: Bảo mật xác thực qua JWT ở backend và NextAuth ở frontend. Phân quyền Admin quản lý danh mục hệ thống.

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Khởi chạy CSDL MongoDB (Docker)
Ứng dụng sử dụng MongoDB. Một file `docker-compose.yml` đã được thiết lập sẵn ở thư mục gốc:
```bash
docker compose up -d
```
*Lưu ý: MongoDB sẽ chạy tại `mongodb://localhost:27017` và trang quản trị trực quan Mongo Express chạy tại `http://localhost:8081`.*

---

### 2. Thiết lập & Khởi chạy Backend
1. Cài đặt các package (đã cài sẵn):
   ```bash
   cd backend
   npm install
   ```
2. Cấu hình file `.env` (đã được tạo mẫu sẵn):
   - `PORT=5000`
   - `MONGODB_URI=mongodb://localhost:27017/personal_finance`
   - `JWT_SECRET=supersecretjwtkeychangeinproduction`
   - `GEMINI_API_KEY=key_cua_ban` (Nếu không điền, ứng dụng sẽ tự động chạy ở chế độ **Mock AI Offline** thông minh mà không bị crash lỗi).

3. Seed dữ liệu mẫu ban đầu:
   ```bash
   npm run seed
   ```
   *Thao tác này sẽ tạo tài khoản kiểm thử:*
   - **Tài khoản Thành viên:** `user@example.com` / mật khẩu: `password123`
   - **Tài khoản Admin:** `admin@example.com` / mật khẩu: `password123`

4. Khởi chạy server phát triển:
   ```bash
   npm run dev
   ```
   *Backend chạy tại `http://localhost:5000`.*

5. Chạy unit tests:
   ```bash
   npm run test
   ```

---

### 3. Thiết lập & Khởi chạy Frontend
1. Di chuyển vào thư mục frontend:
   ```bash
   cd ../frontend
   ```
2. Cài đặt package (đã cài sẵn):
   ```bash
   npm install
   ```
3. Cấu hình file `.env` (đã được tạo sẵn):
   - `NEXTAUTH_SECRET=supersecretnextauthsessionkeychangeinproduction`
   - `NEXTAUTH_URL=http://localhost:3000`
   - `NEXT_PUBLIC_API_URL=http://localhost:5000/api`

4. Khởi chạy Next.js dev server:
   ```bash
   npm run dev
   ```
   *Frontend chạy tại `http://localhost:3000`.*

---

## 💻 Công Nghệ Sử Dụng

### Backend
- **Node.js & Express.js**: Xây dựng RESTful API
- **Mongoose & MongoDB**: Cơ sở dữ liệu NoSQL
- **JSON Web Token (JWT) & Bcryptjs**: Xác thực và mã hóa mật khẩu
- **ExcelJS & PDFKit**: Tạo file báo cáo Excel và PDF tiếng Việt
- **@google/generative-ai**: Tích hợp mô hình ngôn ngữ lớn Gemini 1.5 Flash làm cố vấn tài chính
- **Jest & Supertest**: Viết unit test & integration test tự động

### Frontend
- **Next.js 14 (App Router)**: Framework React tối ưu render SSR/SSG
- **NextAuth.js**: Xác thực và quản lý phiên làm việc người dùng (Session)
- **Tailwind CSS v3**: Thiết kế giao diện Premium responsive (Dark mode)
- **Zustand**: Quản lý state toàn cục Client-side
- **React Hook Form & Zod**: Xác thực dữ liệu form chặt chẽ
- **Recharts**: Biểu đồ thống kê tròn, cột trực quan tương tác
