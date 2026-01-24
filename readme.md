# 🌌 Jinokyu - Nhắn tin không rào cản

![Jinokyu Logo](Client/assets/logo-jinokyu.svg)

**Jinokyu** là một nền tảng nhắn tin trực tuyến hiện đại, được thiết kế với sự kết hợp hoàn hảo giữa tính bảo mật, tốc độ và trải nghiệm người dùng cao cấp. Không chỉ đơn thuần là một ứng dụng chat, Jinokyu hướng tới việc phá bỏ mọi rào cản trong giao tiếp kỹ thuật số bằng cách cung cấp khả năng lưu trữ không giới hạn và quyền kiểm soát dữ liệu tuyệt đối cho người dùng.

---

## ✨ Tính Năng Nổi Bật

### 🚀 Giao Tiếp Thời Gian Thực (Real-time)

- **Đồng bộ tức thì:** Sử dụng công nghệ CloudSync tích hợp Firebase, tin nhắn của bạn được gửi và nhận chỉ trong tích tắc trên mọi thiết bị.
- **Hệ thống kênh đa dạng:** Phân loại cuộc trò chuyện theo nhiều chủ đề khác nhau như `#chung`, `#code`, `#game`, giúp việc quản lý thảo luận nhóm trở nên ngăn nắp hơn.

### 🛡️ Bảo Mật & Quyền Riêng Tư (Privacy First)

- **Lưu trữ cục bộ nâng cao:** Tích hợp IndexedDB để lưu trữ lịch sử tin nhắn và tệp tin đa phương tiện ngay trên trình duyệt của bạn. Điều này giúp tăng tốc độ tải ứng dụng và giữ cho dữ liệu cá nhân luôn nằm trong tầm kiểm soát.
- **Mã hóa dữ liệu:** Các tin nhắn được xử lý bảo mật, đảm bảo tính riêng tư tối đa.

### 🖼️ Trải Nghiệm Đa Phương Tiện

- **Tải lên không giới hạn:** Hỗ trợ gửi hình ảnh và video chất lượng gốc mà không lo về giới hạn băng thông hay dung lượng.
- **Trình xem ảnh chuyên nghiệp:** Tích hợp tính năng Lightbox giúp xem ảnh nhanh chóng ngay trong giao diện chat.

### 🎨 Giao Diện Tùy Biến (Customizable UI)

- **Hệ thống Theme đa dạng:**
  - **Light Mode:** Thanh lịch, nhẹ nhàng cho ban ngày.
  - **Dark Mode:** Hiện đại, giảm mỏi mắt (Mặc định).
  - **AMOLED Mode:** Tối ưu hóa cực độ cho màn hình OLED, tiết kiệm pin và mang lại sắc đen sâu thẳm.
- **Đa ngôn ngữ (i18n):** Hỗ trợ chuyển đổi nhanh chóng giữa Tiếng Việt, Tiếng Anh, Tiếng Pháp, Tiếng Nhật và nhiều ngôn ngữ khác.

### 📦 Quản Lý Dữ Liệu Thông Minh

- **Export/Import:** Cho phép người dùng xuất toàn bộ lịch sử chat ra file JSON để sao lưu và nhập lại dễ dàng bất cứ lúc nào.
- **Delete All:** Tính năng xóa sạch dữ liệu cục bộ chỉ với một cú click, bảo vệ thông tin khi sử dụng thiết bị công cộng.

---

## 🛠️ Công Nghệ Sử Dụng

Jinokyu được xây dựng trên nền tảng các công nghệ web tiên tiến nhất hiện nay để đảm bảo hiệu suất tối ưu mà không cần phụ thuộc quá nhiều vào các framework nặng nề:

- **Core Logic:** Vanilla JavaScript (ES6+).
- **Aesthetics (Mỹ thuật):**
  - **HTML5 Semantic:** Cấu trúc trang chuẩn SEO và dễ tiếp cận.
  - **CSS3 Modern:** Sử dụng **Glassmorphism** (hiệu ứng kính mờ), biến CSS (Variables), Flexbox và Grid để tạo ra giao diện responsive hoàn hảo trên mọi kích thước màn hình.
  - **Animations:** Hiệu ứng chuyển cảnh mượt mà với 60fps.
- **Backend & Sync:**
  - **Firebase Firestore:** Cơ sở dữ liệu thời gian thực.
  - **Firebase Storage:** Lưu trữ tệp tin đa phương tiện đám mây.
- **Local Storage:**
  - **IndexedDB:** Lưu trữ dữ liệu lớn (Big Data) ngay tại client-side.
  - **LocalStorage:** Quản lý các tùy chọn người dùng (Theme, Language).
- **Typography:** Phông chữ **Outfit** từ Google Fonts mang lại cảm giác cao cấp và dễ đọc.

---

## 📱 Khả Năng Tương Thích

Ứng dụng được thiết kế hoàn toàn theo phong cách **Responsive Design**, đảm bảo trải nghiệm tuyệt vời trên:

- 💻 Desktop (Màn hình rộng, siêu rộng)
- 📱 Smartphone (Android, iOS)
- 📟 Tablet (iPad, máy tính bảng)

---

## 🚀 Hướng Dẫn Cài Đặt

Để chạy dự án này trên môi trường local của bạn, hãy làm theo các bước sau:

1.  **Clone dự án:**
    ```bash
    git clone https://github.com/your-username/jinokyu.git
    ```
2.  **Cấu hình Firebase:**
    - Truy cập [Firebase Console](https://console.firebase.google.com/).
    - Tạo dự án mới và lấy cấu hình (API Key, Project ID...).
    - Cập nhật thông tin vào file `Client/firebase-config.js`.
3.  **Chạy ứng dụng:**
    - Chỉ cần mở file `Client/index.html` trên trình duyệt hoặc sử dụng Live Server trong VS Code để có trải nghiệm tốt nhất.

---

## 🛣️ Lộ Trình Phát Triển (Roadmap)

- [ ] Tích hợp cuộc gọi Video và Voice.
- [ ] Hệ thống AI Assistant hỗ trợ trả lời tự động.
- [ ] Thêm tính năng sticker và quà tặng ảo.
- [ ] Phát triển phiên bản Desktop App chính thức (Electron).

---

## 🤝 Contributor

Dự án được phát triển và duy trì bởi cộng đồng yêu công nghệ. Mọi đóng góp về mã nguồn hoặc ý tưởng thiết kế đều được trân trọng!

---

_Cảm ơn bạn đã lựa chọn **Jinokyu** - Nơi cuộc trò chuyện không bao giờ ngừng lại!_
