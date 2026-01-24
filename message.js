class Message {
  /**
   * @param {string} senderId - ID của người gửi
   * @param {string} content - Nội dung văn bản
   * @param {Array} attachments - Danh sách file đính kèm [{url, type, name, size}]
   */
  constructor(senderId, content, attachments = []) {
    this.id = Date.now().toString(); // ID unique
    this.senderId = senderId;
    this.content = content || "";

    // Hỗ trợ upload không giới hạn: lưu danh sách đính kèm
    this.attachments = attachments;

    this.timestamp = new Date();
    this.reactions = {}; // { '👍': ['user1', 'user2'] }
    this.replyTo = null; // ID tin nhắn đang reply
    this.isEdited = false;
  }

  /**
   * Thêm reaction vào tin nhắn
   */
  addReaction(emoji, userId) {
    if (!this.reactions[emoji]) {
      this.reactions[emoji] = [];
    }
    if (!this.reactions[emoji].includes(userId)) {
      this.reactions[emoji].push(userId);
    }
  }

  /**
   * Xóa reaction
   */
  removeReaction(emoji, userId) {
    if (this.reactions[emoji]) {
      this.reactions[emoji] = this.reactions[emoji].filter(
        (id) => id !== userId,
      );
      if (this.reactions[emoji].length === 0) {
        delete this.reactions[emoji];
      }
    }
  }

  /**
   * Chỉnh sửa nội dung tin nhắn
   */
  edit(newContent) {
    this.content = newContent;
    this.isEdited = true;
    this.editedTimestamp = new Date();
  }

  /**
   * Định dạng dữ liệu để gửi về client (JSON)
   */
  toJSON() {
    return {
      id: this.id,
      senderId: this.senderId,
      content: this.content,
      attachments: this.attachments, // Client sẽ render danh sách này
      timestamp: this.timestamp.toISOString(),
      reactions: this.reactions,
      replyTo: this.replyTo,
      isEdited: this.isEdited,
      editedTimestamp: this.editedTimestamp
        ? this.editedTimestamp.toISOString()
        : null,
    };
  }
}

module.exports = Message;
