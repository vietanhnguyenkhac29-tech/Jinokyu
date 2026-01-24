/**
 * ChatStorage - Module lưu trữ tin nhắn và media vĩnh viễn
 * Sử dụng IndexedDB để lưu file lớn (ảnh, video) không giới hạn
 */
const ChatStorage = {
  dbName: "JinokyuChatDB",
  dbVersion: 1,
  db: null,
  useMemory: false,
  mem: {
    messages: [],
    media: new Map(),
  },

  async init() {
    if (typeof indexedDB === "undefined") {
      console.warn(
        "[Jinokyu] IndexedDB not available -> fallback to memory mode",
      );
      this.useMemory = true;
      return null;
    }

    return new Promise((resolve) => {
      let request;
      try {
        request = indexedDB.open(this.dbName, this.dbVersion);
      } catch (e) {
        this.useMemory = true;
        return resolve(null);
      }

      request.onerror = () => {
        this.useMemory = true;
        resolve(null);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.useMemory = false;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("messages")) {
          const msgStore = db.createObjectStore("messages", { keyPath: "id" });
          msgStore.createIndex("timestamp", "timestamp", { unique: false });
        }
        if (!db.objectStoreNames.contains("media")) {
          db.createObjectStore("media", { keyPath: "id" });
        }
      };
    });
  },

  async saveMedia(file) {
    const id = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (this.useMemory) {
      this.mem.media.set(id, {
        id,
        blob: file,
        type: file.type,
        name: file.name,
        size: file.size,
      });
      return id;
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["media"], "readwrite");
      const store = transaction.objectStore("media");
      const request = store.add({
        id,
        blob: file,
        type: file.type,
        name: file.name,
        size: file.size,
      });
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  },

  async getMedia(id) {
    if (this.useMemory) return this.mem.media.get(id) || null;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["media"], "readonly");
      const store = transaction.objectStore("media");
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async saveMessage(message) {
    if (this.useMemory) {
      this.mem.messages.push(message);
      return message.id;
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["messages"], "readwrite");
      const store = transaction.objectStore("messages");
      const request = store.add(message);
      request.onsuccess = () => resolve(message.id);
      request.onerror = () => reject(request.error);
    });
  },

  async loadMessages() {
    if (this.useMemory) return this.mem.messages.slice();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["messages"], "readonly");
      const store = transaction.objectStore("messages");
      const index = store.index("timestamp");
      const request = index.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteAll() {
    if (this.useMemory) {
      this.mem.messages = [];
      this.mem.media = new Map();
      return true;
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        ["messages", "media"],
        "readwrite",
      );
      transaction.objectStore("messages").clear();
      transaction.objectStore("media").clear();
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  },
};

/**
 * CloudSync (Firebase) - Đồng bộ realtime đa thiết bị
 */
const CloudSync = {
  enabled: false,
  app: null,
  db: null,
  storage: null,
  roomId: "chung",
  lastUnsub: null,

  init() {
    try {
      if (
        typeof window.firebase === "undefined" ||
        !window.firebaseConfig ||
        !window.firebaseConfig.projectId
      ) {
        this.enabled = false;
        return false;
      }
      this.app = window.firebase.initializeApp(window.firebaseConfig);
      this.db = window.firebase.firestore();
      this.storage = window.firebase.storage();
      this.enabled = true;
      return true;
    } catch (e) {
      this.enabled = false;
      return false;
    }
  },

  messagesCol() {
    return this.db.collection("rooms").doc(this.roomId).collection("messages");
  },

  async uploadMediaFiles(msgId, files) {
    if (!files || files.length === 0) return [];
    const uploads = [];
    for (const file of files) {
      const safeName = `${Date.now()}_${file.name}`.replace(/[^\w.\-]+/g, "_");
      const ref = this.storage
        .ref()
        .child(`rooms/${this.roomId}/${msgId}/${safeName}`);
      await ref.put(file);
      const url = await ref.getDownloadURL();
      uploads.push({ url, type: file.type, name: file.name, size: file.size });
    }
    return uploads;
  },

  async sendMessage({ id, text, username, timestampISO, files }) {
    const msgId = id || `msg_${Date.now()}`;
    const media = await this.uploadMediaFiles(msgId, files || []);
    const payload = {
      text: text || "",
      username: username || "Bạn",
      media: media,
      timestamp: window.firebase.firestore.Timestamp.fromDate(
        timestampISO ? new Date(timestampISO) : new Date(),
      ),
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
    };
    await this.messagesCol().doc(msgId).set(payload, { merge: true });
    return msgId;
  },

  listenMessages(onChange, onError) {
    if (!this.enabled) return () => {};
    if (this.lastUnsub) this.lastUnsub();
    const unsub = this.messagesCol()
      .orderBy("timestamp", "asc")
      .onSnapshot(
        (snap) => {
          const items = [];
          snap.forEach((doc) => {
            const data = doc.data() || {};
            items.push({
              id: doc.id,
              text: data.text || "",
              username: data.username || "Bạn",
              timestamp:
                data.timestamp && data.timestamp.toDate
                  ? data.timestamp.toDate().toISOString()
                  : new Date().toISOString(),
              media: Array.isArray(data.media) ? data.media : [],
            });
          });
          onChange(items);
        },
        (err) => {
          console.error("[Jinokyu] Firestore listen error:", err);
          if (onError) onError(err);
        },
      );
    this.lastUnsub = unsub;
    return unsub;
  },

  async deleteAllMessages() {
    const snap = await this.messagesCol().get();
    const batch = this.db.batch();
    snap.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  },
};

const Translations = {
  vi: {
    "nav-home": "Trang chủ",
    "nav-about": "Giới thiệu",
    "nav-contact": "Liên hệ",
    "nav-download": "Tải ứng dụng",
    "sidebar-channels": "Kênh chat",
    "set-user-head": "Cài đặt người dùng",
    "set-tab-user": "Người dùng",
    "set-app-head": "Cài đặt ứng dụng",
    "set-tab-theme": "Giao diện",
    "set-tab-advanced": "Nâng cao (GPU)",
    "set-tab-lang": "Ngôn ngữ & Thời gian",
    "set-tab-security": "Dữ liệu & Bảo mật",
    "set-tab-logout": "Đăng xuất",
    "set-user-title": "Người dùng",
    "set-user-item-label": "Hồ sơ cá nhân",
    "set-user-item-desc": "Thay đổi tên hiển thị và ảnh đại diện của bạn.",
    "set-btn-edit": "Chỉnh sửa",
    "set-theme-title": "Chủ đề giao diện",
    "set-theme-light": "Sáng",
    "set-theme-dark": "Tối",
    "set-theme-amoled": "AMOLED",
    "set-advanced-title": "Nâng cao",
    "set-advanced-gpu-label": "Tăng tốc phần cứng (GPU)",
    "set-advanced-gpu-desc":
      "Sử dụng sức mạnh GPU để làm các hiệu ứng chuyển động mượt mà hơn.",
    "set-lang-title": "Ngôn ngữ & Thời gian",
    "set-lang-label": "Ngôn ngữ",
    "set-security-title": "Dữ liệu & Bảo mật",
    "set-security-encrypt-label": "Mã hóa tin nhắn",
    "set-security-encrypt-desc":
      "Tin nhắn của bạn được bảo mật thông qua IndexedDB local.",
    "confirm-delete-all": "Xóa toàn bộ lịch sử chat?",
    "delete-success": "Đã xóa sạch dữ liệu.",
    "import-success": "Import thành công!",
    "import-error": "Lỗi khi import file.",
    "welcome-message": "--- Chào mừng bạn đến với kênh #",
    "send-placeholder": "Gửi tin nhắn đến #",
  },
  en: {
    "nav-home": "Home",
    "nav-about": "About",
    "nav-contact": "Contact",
    "nav-download": "Download App",
    "sidebar-channels": "Channels",
    "set-user-head": "User Settings",
    "set-tab-user": "User Profile",
    "set-app-head": "App Settings",
    "set-tab-theme": "Appearance",
    "set-tab-advanced": "Advanced (GPU)",
    "set-tab-lang": "Language & Time",
    "set-tab-security": "Data & Privacy",
    "set-tab-logout": "Log Out",
    "set-user-title": "User",
    "set-user-item-label": "Personal Profile",
    "set-user-item-desc": "Change your display name and profile picture.",
    "set-btn-edit": "Edit",
    "set-theme-title": "Interface Theme",
    "set-theme-light": "Light",
    "set-theme-dark": "Dark",
    "set-theme-amoled": "AMOLED",
    "set-advanced-title": "Advanced",
    "set-advanced-gpu-label": "Hardware Acceleration (GPU)",
    "set-advanced-gpu-desc":
      "Use GPU power for smoother animations and transitions.",
    "set-lang-title": "Language & Time",
    "set-lang-label": "Language",
    "set-security-title": "Data & Security",
    "set-security-encrypt-label": "Message Encryption",
    "set-security-encrypt-desc":
      "Your messages are secured via local IndexedDB storage.",
    "confirm-delete-all": "Delete all chat history?",
    "delete-success": "Data cleared successfully.",
    "import-success": "Imported successfully!",
    "import-error": "Error importing file.",
    "welcome-message": "--- Welcome to channel #",
    "send-placeholder": "Send message to #",
  },
  fr: {
    "nav-home": "Accueil",
    "nav-about": "À propos",
    "nav-contact": "Contact",
    "nav-download": "Télécharger",
    "sidebar-channels": "Salons",
    "set-user-head": "Paramètres utilisateur",
    "set-tab-user": "Profil",
    "set-app-head": "Paramètres de l'application",
    "set-tab-theme": "Apparence",
    "set-tab-advanced": "Avancé (GPU)",
    "set-tab-lang": "Langue et heure",
    "set-tab-security": "Données et sécurité",
    "set-tab-logout": "Déconnexion",
    "set-user-title": "Utilisateur",
    "set-user-item-label": "Profil personnel",
    "set-user-item-desc":
      "Changez votre nom d'affichage et votre photo de profil.",
    "set-btn-edit": "Modifier",
    "set-theme-title": "Thème de l'interface",
    "set-theme-light": "Clair",
    "set-theme-dark": "Sombre",
    "set-theme-amoled": "AMOLED",
    "set-advanced-title": "Avancé",
    "set-advanced-gpu-label": "Accélération matérielle (GPU)",
    "set-advanced-gpu-desc":
      "Utilisez la puissance du GPU pour des animations plus fluides.",
    "set-lang-title": "Langue et heure",
    "set-lang-label": "Langue",
    "set-security-title": "Données et sécurité",
    "set-security-encrypt-label": "Chiffrement des messages",
    "set-security-encrypt-desc":
      "Vos messages sont sécurisés via IndexedDB local.",
    "confirm-delete-all": "Supprimer tout l'historique ?",
    "delete-success": "Données effacées.",
    "import-success": "Importation réussie !",
    "import-error": "Erreur d'importation.",
    "welcome-message": "--- Bienvenue dans le salon #",
    "send-placeholder": "Envoyer un message dans #",
  },
  jp: {
    "nav-home": "ホーム",
    "nav-about": "紹介",
    "nav-contact": "連絡先",
    "nav-download": "アプリをダウンロード",
    "sidebar-channels": "チャンネル",
    "set-user-head": "ユーザー設定",
    "set-tab-user": "ユーザープロフィール",
    "set-app-head": "アプリ設定",
    "set-tab-theme": "外観",
    "set-tab-advanced": "詳細設定 (GPU)",
    "set-tab-lang": "言語と時間",
    "set-tab-security": "データとセキュリティ",
    "set-tab-logout": "ログアウト",
    "set-user-title": "ユーザー",
    "set-user-item-label": "個人プロフィール",
    "set-user-item-desc": "表示名とプロフィール画像を変更します。",
    "set-btn-edit": "編集",
    "set-theme-title": "インターフェーステーマ",
    "set-theme-light": "ライト",
    "set-theme-dark": "ダーク",
    "set-theme-amoled": "AMOLED",
    "set-advanced-title": "詳細設定",
    "set-advanced-gpu-label": "ハードウェアアクセラレーション (GPU)",
    "set-advanced-gpu-desc":
      "GPUを使用してアニメーションをより滑らかにします。",
    "set-lang-title": "言語と時間",
    "set-lang-label": "言語",
    "set-security-title": "データとセキュリティ",
    "set-security-encrypt-label": "メッセージ暗号化",
    "set-security-encrypt-desc":
      "メッセージはローカルのIndexedDBを介して保護されています。",
    "confirm-delete-all": "チャット履歴をすべて削除しますか？",
    "delete-success": "データが削除されました。",
    "import-success": "インポートに成功しました！",
    "import-error": "ファイルのインポート中にエラーが発生しました。",
    "welcome-message": "--- チャンネル # へようこそ ---",
    "send-placeholder": "# へメッセージを送信: ",
  },
};

// ============ MAIN APP ============
document.addEventListener("DOMContentLoaded", async () => {
  // Init Storage
  try {
    await ChatStorage.init();
  } catch (e) {
    ChatStorage.useMemory = true;
  }
  CloudSync.init();

  // Load Theme
  const savedTheme = localStorage.getItem("jinokyu-theme") || "dark";
  document.body.className = savedTheme === "dark" ? "" : `${savedTheme}-theme`;

  // Language Logic
  const savedLang = localStorage.getItem("jinokyu-lang") || "vi";

  function applyLanguage(lang) {
    const dict = Translations[lang] || Translations["en"];
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Update dynamically rendered parts
    const currentChannel = CloudSync.roomId || "chung";
    const msgInput = document.getElementById("message-input");
    if (msgInput) {
      msgInput.placeholder = `${dict["send-placeholder"]}${currentChannel}`;
    }

    const welcomeText = document.querySelector(
      ".message-item.system .message-text",
    );
    if (welcomeText) {
      welcomeText.textContent = `${dict["welcome-message"]}${currentChannel} ---`;
    }
  }

  // Highlight active theme segment in settings
  const updateThemeUI = (theme) => {
    document
      .querySelectorAll(".theme-switch-container .theme-segment")
      .forEach((seg) => {
        seg.classList.remove("active");
        if (seg.dataset.theme === theme) {
          seg.classList.add("active");
        }
      });
  };
  updateThemeUI(savedTheme);

  // Elements
  const messageInput = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");
  const messagesContainer = document.getElementById("messages-container");
  const fileInput = document.getElementById("file-input");
  const filePreview = document.getElementById("file-preview");
  const deleteAllBtn = document.getElementById("delete-all-btn");
  const exportBtn = document.getElementById("export-btn");
  const importBtn = document.getElementById("import-btn");
  const importFileInput = document.getElementById("import-file-input");
  const emojiBtn = document.querySelector(".emoji-btn");
  const currentChannelName = document.getElementById("current-channel-name");
  const channelItems = document.querySelectorAll(".channel-list li");
  const languageSelect = document.getElementById("language-select");

  // Initial Language Apply
  if (languageSelect) {
    const langMap = {
      "Tiếng Việt": "vi",
      English: "en",
      French: "fr",
      Japanese: "jp",
      German: "de",
      Spanish: "es",
      Italian: "it",
      Portuguese: "pt",
      Russian: "ru",
      Arabic: "ar",
      Chinese: "zh",
      Korean: "ko",
      Thai: "th",
    };
    // Sync select value
    for (let opt of languageSelect.options) {
      if (langMap[opt.textContent] === savedLang) {
        opt.selected = true;
        break;
      }
    }

    languageSelect.onchange = (e) => {
      const selectedText = e.target.options[e.target.selectedIndex].textContent;
      const lang = langMap[selectedText] || "en";
      localStorage.setItem("jinokyu-lang", lang);
      applyLanguage(lang);
    };
  }
  applyLanguage(savedLang);

  let currentFiles = [];

  // Helper: Get initials for avatar
  function getInitials(name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }

  // Helper: Generate consistent color for username
  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  }

  // Helper: Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  // Helper: Escape HTML
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Render Preview Item
  function renderPreviews() {
    filePreview.innerHTML = "";
    currentFiles.forEach((file, index) => {
      const item = document.createElement("div");
      item.className = "preview-item";
      let thumb = "";
      if (file.type.startsWith("image/")) {
        thumb = `<img src="${URL.createObjectURL(file)}" alt="preview">`;
      } else {
        thumb = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:var(--primary-color);color:white;font-size:20px;">📄</div>`;
      }
      item.innerHTML = `${thumb}<button class="remove-btn" data-index="${index}">×</button>`;
      filePreview.appendChild(item);
    });

    filePreview.querySelectorAll(".remove-btn").forEach((btn) => {
      btn.onclick = (e) => {
        const idx = parseInt(e.target.dataset.index);
        currentFiles.splice(idx, 1);
        renderPreviews();
      };
    });
  }

  fileInput.onchange = (e) => {
    currentFiles = currentFiles.concat(Array.from(e.target.files));
    renderPreviews();
    fileInput.value = "";
  };

  // Render Message
  async function renderMessage(msgData) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message-item";

    let mediaHtml = "";
    if (Array.isArray(msgData.media) && msgData.media.length > 0) {
      for (const m of msgData.media) {
        if (m.type.startsWith("image/")) {
          mediaHtml += `<div class="media"><img src="${m.url}" alt="image" onclick="openLightbox('${m.url}')"></div>`;
        } else if (m.type.startsWith("video/")) {
          mediaHtml += `<div class="media"><video src="${m.url}" controls></video></div>`;
        }
      }
    } else if (msgData.mediaIds && msgData.mediaIds.length > 0) {
      for (const id of msgData.mediaIds) {
        const m = await ChatStorage.getMedia(id);
        if (m) {
          const url = URL.createObjectURL(m.blob);
          if (m.type.startsWith("image/")) {
            mediaHtml += `<div class="media"><img src="${url}" alt="image" onclick="openLightbox('${url}')"></div>`;
          } else if (m.type.startsWith("video/")) {
            mediaHtml += `<div class="media"><video src="${url}" controls></video></div>`;
          }
        }
      }
    }

    const time = new Date(msgData.timestamp).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const color = stringToColor(msgData.username || "Bạn");
    const initials = getInitials(msgData.username || "Bạn");

    messageDiv.innerHTML = `
      <div class="message-avatar" style="background: ${color}">${initials}</div>
      <div class="message-content">
        <div class="message-info">
          <span class="username">${escapeHtml(msgData.username || "Bạn")}</span>
          <span class="time">${time}</span>
        </div>
        ${msgData.text ? `<div class="message-text">${escapeHtml(msgData.text)}</div>` : ""}
        ${mediaHtml}
      </div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: "smooth",
    });
  }

  // Load History
  async function loadHistory() {
    const lang = localStorage.getItem("jinokyu-lang") || "vi";
    const dict = Translations[lang] || Translations["en"];
    messagesContainer.innerHTML = `<div class="message-item system"><div class="message-content"><div class="message-text" style="color:var(--text-muted);font-style:italic">${dict["welcome-message"]}${CloudSync.roomId} ---</div></div></div>`;
    if (CloudSync.enabled) {
      CloudSync.listenMessages((msgs) => {
        messagesContainer.innerHTML = "";
        msgs.forEach((m) => renderMessage(m));
      });
    } else {
      const msgs = await ChatStorage.loadMessages();
      msgs.forEach((m) => renderMessage(m));
    }
  }

  // Send Message
  async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text && currentFiles.length === 0) return;

    const msgId = `msg_${Date.now()}`;
    const timestamp = new Date().toISOString();

    if (CloudSync.enabled) {
      try {
        await CloudSync.sendMessage({
          id: msgId,
          text,
          username: "Bạn",
          timestampISO: timestamp,
          files: currentFiles,
        });
        resetInput();
        return;
      } catch (e) {
        console.error("Cloud send failed", e);
      }
    }

    const mediaIds = [];
    for (const f of currentFiles) mediaIds.push(await ChatStorage.saveMedia(f));

    const msgData = { id: msgId, text, username: "Bạn", timestamp, mediaIds };
    await ChatStorage.saveMessage(msgData);
    renderMessage(msgData);
    resetInput();
  }

  function resetInput() {
    messageInput.value = "";
    currentFiles = [];
    filePreview.innerHTML = "";
    messageInput.focus();
  }

  sendBtn.onclick = sendMessage;
  messageInput.onkeypress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  // Emoji
  if (emojiBtn) {
    emojiBtn.onclick = () => {
      const emojis = [
        "😀",
        "😂",
        "🥰",
        "😎",
        "🔥",
        "👍",
        "💯",
        "🎉",
        "🌈",
        "💻",
      ];
      messageInput.value += emojis[Math.floor(Math.random() * emojis.length)];
      messageInput.focus();
    };
  }

  // Channel Switch
  channelItems.forEach((item) => {
    item.onclick = () => {
      channelItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      const name = item.textContent.replace("# ", "");
      currentChannelName.textContent = name;
      CloudSync.roomId = name;
      const lang = localStorage.getItem("jinokyu-lang") || "vi";
      const dict = Translations[lang] || Translations["en"];
      // Note: placeholder update is handled here as well for better UX
      messageInput.placeholder =
        (lang === "vi" ? "Gửi tin nhắn đến #" : "Send message to #") + name;
      loadHistory();
      if (window.innerWidth <= 768) {
        document.querySelector(".sidebar").classList.remove("active");
      }
    };
  });

  // Delete All
  deleteAllBtn.onclick = async () => {
    const lang = localStorage.getItem("jinokyu-lang") || "vi";
    const dict = Translations[lang] || Translations["en"];
    if (confirm(dict["confirm-delete-all"])) {
      if (CloudSync.enabled) await CloudSync.deleteAllMessages();
      await ChatStorage.deleteAll();
      messagesContainer.innerHTML = "";
      alert(dict["delete-success"]);
    }
  };

  // Export/Import
  exportBtn.onclick = async () => {
    const msgs = await ChatStorage.loadMessages();
    const data = JSON.stringify({
      version: 2,
      timestamp: new Date(),
      messages: msgs,
    });
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jinokyu_backup_${Date.now()}.json`;
    a.click();
  };

  importBtn.onclick = () => importFileInput.click();
  importFileInput.onchange = async (e) => {
    const lang = localStorage.getItem("jinokyu-lang") || "vi";
    const dict = Translations[lang] || Translations["en"];
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (data.messages) {
        for (const m of data.messages) await ChatStorage.saveMessage(m);
        loadHistory();
        alert(dict["import-success"]);
      }
    } catch (err) {
      alert(dict["import-error"]);
    }
  };

  // Lightbox
  window.openLightbox = (src) => {
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = `<button class="close-btn">×</button><img src="${src}">`;
    lb.onclick = () => lb.remove();
    document.body.appendChild(lb);
  };

  // Theme Selection Logic
  document
    .querySelectorAll(".theme-switch-container .theme-segment")
    .forEach((seg) => {
      seg.onclick = () => {
        const theme = seg.dataset.theme;
        localStorage.setItem("jinokyu-theme", theme);

        // Reset and apply theme classes
        document.body.classList.remove("light-theme", "amoled-theme");
        if (theme !== "dark") {
          document.body.classList.add(`${theme}-theme`);
        }

        updateThemeUI(theme);
      };
    });

  // Settings
  const settingsModal = document.getElementById("settings-modal");
  const settingsBtn = document.querySelector('.icon-btn[title="Cài đặt"]');
  const settingsClose = document.getElementById("settings-close");
  const settingsTabs = document.querySelectorAll(".settings-tab");
  const settingsSections = document.querySelectorAll(".settings-section");

  if (settingsBtn)
    settingsBtn.onclick = () => (settingsModal.style.display = "block");
  if (settingsClose)
    settingsClose.onclick = () => (settingsModal.style.display = "none");
  window.onkeydown = (e) => {
    if (e.key === "Escape") settingsModal.style.display = "none";
  };

  settingsTabs.forEach((tab) => {
    tab.onclick = () => {
      settingsTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      settingsSections.forEach((s) => s.classList.remove("active"));
      document.getElementById(tab.dataset.target).classList.add("active");
    };
  });

  // Sidebar Toggle
  const menuToggle = document.getElementById("menu-toggle");
  if (menuToggle) {
    menuToggle.onclick = (e) => {
      e.stopPropagation();
      document.querySelector(".sidebar").classList.toggle("active");
    };
  }

  // Initial Load
  loadHistory();
});
