const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Template = require("../models/Template");
const logger = require("../config/logger");

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.templateRooms = new Map(); // templateId -> Set of userIds
    this.userSockets = new Map(); // userId -> Set of socketIds
  }

  // Socket.IO sunucusunu başlat
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info("WebSocket service initialized");
  }

  // Middleware - JWT doğrulama
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
          return next(new Error("Token gerekli"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
          return next(new Error("Kullanıcı bulunamadı"));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        logger.error("WebSocket authentication error", {
          error: error.message,
          socketId: socket.id,
        });
        next(new Error("Geçersiz token"));
      }
    });
  }

  // Event handler'ları kur
  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      this.handleConnection(socket);
    });
  }

  // Bağlantı kurulduğunda
  handleConnection(socket) {
    const userId = socket.userId;
    const user = socket.user;

    // Kullanıcıyı bağlı kullanıcılar listesine ekle
    this.connectedUsers.set(userId, socket.id);

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socket.id);

    logger.info("User connected to WebSocket", {
      userId,
      socketId: socket.id,
      userName: user.name,
    });

    // Kullanıcıya bağlantı onayı gönder
    socket.emit("connected", {
      message: "WebSocket bağlantısı kuruldu",
      userId,
      timestamp: new Date().toISOString(),
    });

    // Şablon odasına katılma
    socket.on("join-template", async (data) => {
      await this.handleJoinTemplate(socket, data);
    });

    // Şablon odasından ayrılma
    socket.on("leave-template", async (data) => {
      await this.handleLeaveTemplate(socket, data);
    });

    // Blok değişikliklerini dinleme
    socket.on("block-change", async (data) => {
      await this.handleBlockChange(socket, data);
    });

    // Kursor pozisyonu güncelleme
    socket.on("cursor-update", async (data) => {
      await this.handleCursorUpdate(socket, data);
    });

    // Canlı önizleme güncelleme
    socket.on("preview-update", async (data) => {
      await this.handlePreviewUpdate(socket, data);
    });

    // Bağlantı kesildiğinde
    socket.on("disconnect", () => {
      this.handleDisconnection(socket);
    });

    // Hata durumunda
    socket.on("error", (error) => {
      logger.error("WebSocket error", {
        error: error.message,
        userId,
        socketId: socket.id,
      });
    });
  }

  // Şablon odasına katılma
  async handleJoinTemplate(socket, data) {
    try {
      const { templateId } = data;
      const userId = socket.userId;

      if (!templateId) {
        socket.emit("error", { message: "Template ID gerekli" });
        return;
      }

      // Şablon erişim kontrolü
      const template = await Template.findById(templateId);
      if (!template) {
        socket.emit("error", { message: "Şablon bulunamadı" });
        return;
      }

      if (!template.hasAccess(userId, "view")) {
        socket.emit("error", { message: "Bu şablona erişim izniniz yok" });
        return;
      }

      // Socket'i odaya ekle
      socket.join(`template:${templateId}`);

      // Template odası kullanıcılarını güncelle
      if (!this.templateRooms.has(templateId)) {
        this.templateRooms.set(templateId, new Set());
      }
      this.templateRooms.get(templateId).add(userId);

      // Diğer kullanıcılara bildirim gönder
      socket.to(`template:${templateId}`).emit("user-joined", {
        userId,
        userName: socket.user.name,
        timestamp: new Date().toISOString(),
      });

      // Mevcut kullanıcıları gönder
      const currentUsers = Array.from(this.templateRooms.get(templateId)).map(
        (id) => ({
          userId: id,
          isOnline: this.connectedUsers.has(id),
        })
      );

      socket.emit("template-joined", {
        templateId,
        currentUsers,
        timestamp: new Date().toISOString(),
      });

      logger.info("User joined template room", {
        userId,
        templateId,
        socketId: socket.id,
      });
    } catch (error) {
      logger.error("Error joining template room", {
        error: error.message,
        userId: socket.userId,
        templateId: data.templateId,
      });
      socket.emit("error", { message: "Odaya katılırken hata oluştu" });
    }
  }

  // Şablon odasından ayrılma
  async handleLeaveTemplate(socket, data) {
    try {
      const { templateId } = data;
      const userId = socket.userId;

      if (templateId) {
        socket.leave(`template:${templateId}`);

        // Template odası kullanıcılarını güncelle
        if (this.templateRooms.has(templateId)) {
          this.templateRooms.get(templateId).delete(userId);
          if (this.templateRooms.get(templateId).size === 0) {
            this.templateRooms.delete(templateId);
          }
        }

        // Diğer kullanıcılara bildirim gönder
        socket.to(`template:${templateId}`).emit("user-left", {
          userId,
          userName: socket.user.name,
          timestamp: new Date().toISOString(),
        });

        logger.info("User left template room", {
          userId,
          templateId,
          socketId: socket.id,
        });
      }
    } catch (error) {
      logger.error("Error leaving template room", {
        error: error.message,
        userId: socket.userId,
        templateId: data.templateId,
      });
    }
  }

  // Blok değişikliklerini işleme
  async handleBlockChange(socket, data) {
    try {
      const { templateId, blockId, changeType, blockData, userId } = data;
      const senderId = socket.userId;

      if (!templateId || !blockId) {
        socket.emit("error", { message: "Template ID ve Block ID gerekli" });
        return;
      }

      // Şablon erişim kontrolü
      const template = await Template.findById(templateId);
      if (!template || !template.hasAccess(senderId, "edit")) {
        socket.emit("error", { message: "Bu şablonu düzenleme izniniz yok" });
        return;
      }

      // Değişikliği diğer kullanıcılara gönder
      socket.to(`template:${templateId}`).emit("block-changed", {
        templateId,
        blockId,
        changeType, // 'add', 'update', 'delete', 'reorder'
        blockData,
        changedBy: {
          userId: senderId,
          userName: socket.user.name,
        },
        timestamp: new Date().toISOString(),
      });

      logger.info("Block change broadcasted", {
        templateId,
        blockId,
        changeType,
        senderId,
        socketId: socket.id,
      });
    } catch (error) {
      logger.error("Error handling block change", {
        error: error.message,
        userId: socket.userId,
        templateId: data.templateId,
      });
      socket.emit("error", {
        message: "Blok değişikliği işlenirken hata oluştu",
      });
    }
  }

  // Kursor pozisyonu güncelleme
  async handleCursorUpdate(socket, data) {
    try {
      const { templateId, blockId, position } = data;
      const userId = socket.userId;

      if (!templateId) {
        return;
      }

      // Kursor pozisyonunu diğer kullanıcılara gönder
      socket.to(`template:${templateId}`).emit("cursor-updated", {
        templateId,
        blockId,
        position,
        userId,
        userName: socket.user.name,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error handling cursor update", {
        error: error.message,
        userId: socket.userId,
        templateId: data.templateId,
      });
    }
  }

  // Canlı önizleme güncelleme
  async handlePreviewUpdate(socket, data) {
    try {
      const { templateId, previewData } = data;
      const userId = socket.userId;

      if (!templateId) {
        return;
      }

      // Önizleme verisini diğer kullanıcılara gönder
      socket.to(`template:${templateId}`).emit("preview-updated", {
        templateId,
        previewData,
        updatedBy: {
          userId,
          userName: socket.user.name,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error handling preview update", {
        error: error.message,
        userId: socket.userId,
        templateId: data.templateId,
      });
    }
  }

  // Bağlantı kesildiğinde
  handleDisconnection(socket) {
    const userId = socket.userId;

    if (userId) {
      // Kullanıcının tüm socket'lerini kaldır
      if (this.userSockets.has(userId)) {
        this.userSockets.get(userId).delete(socket.id);

        // Eğer kullanıcının başka socket'i yoksa, bağlı kullanıcılar listesinden kaldır
        if (this.userSockets.get(userId).size === 0) {
          this.connectedUsers.delete(userId);
          this.userSockets.delete(userId);
        }
      }

      // Tüm template odalarından çıkar
      for (const [templateId, users] of this.templateRooms.entries()) {
        if (users.has(userId)) {
          users.delete(userId);
          if (users.size === 0) {
            this.templateRooms.delete(templateId);
          } else {
            // Diğer kullanıcılara kullanıcının ayrıldığını bildir
            this.io.to(`template:${templateId}`).emit("user-left", {
              userId,
              userName: socket.user?.name || "Bilinmeyen Kullanıcı",
              timestamp: new Date().toISOString(),
            });
          }
        }
      }

      logger.info("User disconnected from WebSocket", {
        userId,
        socketId: socket.id,
      });
    }
  }

  // Belirli bir kullanıcıya mesaj gönderme
  sendToUser(userId, event, data) {
    if (this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId);
      sockets.forEach((socketId) => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(event, data);
        }
      });
    }
  }

  // Belirli bir template odasına mesaj gönderme
  sendToTemplate(templateId, event, data) {
    this.io.to(`template:${templateId}`).emit(event, data);
  }

  // Tüm bağlı kullanıcılara mesaj gönderme
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  // Bağlı kullanıcı sayısını alma
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Template odasındaki kullanıcı sayısını alma
  getTemplateUsersCount(templateId) {
    return this.templateRooms.get(templateId)?.size || 0;
  }

  // Bağlı kullanıcıları listeleme
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  // Template odasındaki kullanıcıları listeleme
  getTemplateUsers(templateId) {
    return Array.from(this.templateRooms.get(templateId) || []);
  }

  // Servisi kapatma
  close() {
    if (this.io) {
      this.io.close();
      this.connectedUsers.clear();
      this.templateRooms.clear();
      this.userSockets.clear();
      logger.info("WebSocket service closed");
    }
  }
}

module.exports = new WebSocketService();
