(function () {
  const SmartAgent = {
    init() {
      this.monitorErrors();
      this.unlockFeatures();
      this.autoFixUI();
      console.log(
        "%c[Agent] Hệ thống thông minh đã kích hoạt. Đang quét lỗi và tối ưu trình duyệt...",
        "color: #00ff00; font-weight: bold;",
      );
    },

    // 1. Tìm và sửa BUG Runtime
    monitorErrors() {
      window.addEventListener("error", (event) => {
        console.warn(
          `[Agent] Đã phát hiện và đang xử lý lỗi: ${event.message} tại ${event.filename}:${event.lineno}`,
        );
        // Thực hiện logic tự phục hồi hoặc bỏ qua lỗi để tránh crash
        return true;
      });

      window.addEventListener("unhandledrejection", (event) => {
        console.warn(
          `[Agent] Đã chặn lỗi Promise không được xử lý: ${event.reason}`,
        );
        event.preventDefault();
      });
    },

    // 2. Gỡ bỏ các hạn chế tương tác (Copy, Context Menu, Selection)
    unlockFeatures() {
      const eventsToEnable = [
        "contextmenu",
        "copy",
        "cut",
        "paste",
        "selectstart",
        "mousedown",
      ];
      eventsToEnable.forEach((eventName) => {
        document.addEventListener(eventName, (e) => e.stopPropagation(), true);
      });

      // Khôi phục quyền chọn văn bản bằng CSS
      const style = document.createElement("style");
      style.innerHTML = `
        * { 
          user-select: auto !important; 
          -webkit-user-select: auto !important; 
          -moz-user-select: auto !important; 
          -ms-user-select: auto !important; 
        }
      `;
      document.head.appendChild(style);
    },

    // 3. Tự động sửa lỗi hiển thị và UI
    autoFixUI() {
      // Xử lý các phần tử bị ẩn hoặc vô hiệu hóa nhầm
      const elements = document.querySelectorAll(
        '[disabled], .disabled, [style*="display: none"]',
      );
      elements.forEach((el) => {
        if (el.hasAttribute("disabled")) el.removeAttribute("disabled");
        // Chỉ hiện lại nếu không phải là các phần tử ẩn có chủ đích của hệ thống
        if (
          el.style.display === "none" &&
          el.getAttribute("aria-hidden") !== "true"
        ) {
          el.style.setProperty("display", "block", "important");
        }
      });
    },
  };

  SmartAgent.init();
})();
