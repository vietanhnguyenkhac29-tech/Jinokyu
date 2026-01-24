const express = require("express");
const router = express.Router();
const {
  sendMessage,
  allMessages,
  deleteMessage,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

/**
 * @route   POST /api/messages
 * @desc    Gửi tin nhắn mới
 * @access  Private (Yêu cầu xác thực)
 */
router.route("/").post(protect, sendMessage);

/**
 * @route   GET /api/messages/:chatId
 * @desc    Lấy toàn bộ tin nhắn từ một cuộc hội thoại cụ thể
 * @access  Private
 */
router.route("/:chatId").get(protect, allMessages);

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Xóa tin nhắn dựa trên ID
 * @access  Private
 */
router.route("/:messageId").delete(protect, deleteMessage);

module.exports = router;
