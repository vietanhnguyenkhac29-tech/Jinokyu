const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

/**
 * Cấu hình lưu trữ Multer: Định nghĩa thư mục đích và quy tắc đặt tên tệp
 * Đảm bảo tính duy nhất của tệp tin để tránh ghi đè dữ liệu.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`,
    );
  },
});

/**
 * Bộ lọc tệp tin (File Filter): Kiểm tra định dạng tệp đầu vào
 * Tăng cường bảo mật bằng cách chỉ cho phép các loại MIME hình ảnh cụ thể.
 */
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|webp|gif/;
  const isMimeValid = allowedFileTypes.test(file.mimetype);
  const isExtValid = allowedFileTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );

  if (isMimeValid && isExtValid) {
    return cb(null, true);
  }
  cb(
    new Error(
      "Định dạng tệp không hợp lệ. Chỉ chấp nhận hình ảnh (jpg, png, webp, gif).",
    ),
  );
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn kích thước 5MB
  fileFilter,
});

/**
 * @route   POST /api/upload
 * @desc    Xử lý tải lên một hình ảnh duy nhất
 * @access  Public/Protected
 */
router.post("/", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn một tệp tin để tải lên.",
      });
    }

    // Trả về thông tin tệp tin sau khi xử lý thành công
    res.status(200).json({
      success: true,
      message: "Tải lên thành công!",
      file: {
        name: req.file.filename,
        url: `/uploads/${req.file.filename}`,
        size: req.file.size,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi xử lý tải lên.",
      error: error.message,
    });
  }
});

module.exports = router;
