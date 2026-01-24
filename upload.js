class UploadHandler {
    constructor() {
        this.allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'video/mp4'];
    }

    validateFile(file) {
        if (!this.allowedTypes.includes(file.mimetype)) {
            return { valid: false, error: 'Định dạng file không hỗ trợ' };
        }
        // Jinokyu tính năng: Không giới hạn dung lượng
        return { valid: true };
    }

    // Giả lập lưu file
    saveFile(file) {
        const validation = this.validateFile(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        const fileName = `${Date.now()}_${file.originalname}`;
        // Trong thực tế code này sẽ dùng 'fs' để lưu vào ổ cứng
        console.log(`Đang lưu file ${fileName} vào thư mục uploads...`);
        
        return `/uploads/${fileName}`; // Trả về đường dẫn để hiển thị
    }
}

module.exports = new UploadHandler();