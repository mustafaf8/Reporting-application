const WebSocketService = require("./websocketService");
const Template = require("../models/Template");
const User = require("../models/User");
const logger = require("../config/logger");

class CollaborationService {
  /**
   * Kullanıcıyı şablon işbirliği odasına ekler
   * @param {string} userId - Kullanıcı ID'si
   * @param {string} templateId - Şablon ID'si
   * @param {string} socketId - Socket ID'si
   */
  static async joinTemplateRoom(userId, templateId, socketId) {
    try {
      // Kullanıcının şablona erişim izni var mı kontrol et
      const hasAccess = await this.checkTemplateAccess(userId, templateId);
      if (!hasAccess) {
        throw new Error("You don't have access to this template");
      }

      // Kullanıcıyı odaya ekle
      await WebSocketService.joinRoom(socketId, `template_${templateId}`);
      
      // Diğer kullanıcılara bildirim gönder
      await this.notifyUserJoined(templateId, userId, socketId);
      
      logger.info(`User ${userId} joined template room ${templateId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error joining template room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Kullanıcıyı şablon işbirliği odasından çıkarır
   * @param {string} userId - Kullanıcı ID'si
   * @param {string} templateId - Şablon ID'si
   * @param {string} socketId - Socket ID'si
   */
  static async leaveTemplateRoom(userId, templateId, socketId) {
    try {
      // Kullanıcıyı odadan çıkar
      await WebSocketService.leaveRoom(socketId, `template_${templateId}`);
      
      // Diğer kullanıcılara bildirim gönder
      await this.notifyUserLeft(templateId, userId, socketId);
      
      logger.info(`User ${userId} left template room ${templateId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error leaving template room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Şablon değişikliklerini gerçek zamanlı olarak yayınlar
   * @param {string} templateId - Şablon ID'si
   * @param {string} userId - Kullanıcı ID'si
   * @param {Object} changes - Yapılan değişiklikler
   */
  static async broadcastTemplateChanges(templateId, userId, changes) {
    try {
      const room = `template_${templateId}`;
      
      // Değişiklik verilerini hazırla
      const changeData = {
        type: 'template_change',
        templateId,
        userId,
        changes,
        timestamp: new Date(),
        version: changes.version || 1
      };

      // Odadaki tüm kullanıcılara gönder (gönderen hariç)
      await WebSocketService.broadcastToRoom(room, changeData, userId);
      
      logger.info(`Template changes broadcasted for ${templateId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error broadcasting template changes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Blok değişikliklerini gerçek zamanlı olarak yayınlar
   * @param {string} templateId - Şablon ID'si
   * @param {string} userId - Kullanıcı ID'si
   * @param {string} blockId - Blok ID'si
   * @param {Object} changes - Blok değişiklikleri
   */
  static async broadcastBlockChanges(templateId, userId, blockId, changes) {
    try {
      const room = `template_${templateId}`;
      
      // Blok değişiklik verilerini hazırla
      const changeData = {
        type: 'block_change',
        templateId,
        blockId,
        userId,
        changes,
        timestamp: new Date(),
        version: changes.version || 1
      };

      // Odadaki tüm kullanıcılara gönder (gönderen hariç)
      await WebSocketService.broadcastToRoom(room, changeData, userId);
      
      logger.info(`Block changes broadcasted for block ${blockId} in template ${templateId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error broadcasting block changes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Kullanıcı imleç pozisyonunu yayınlar
   * @param {string} templateId - Şablon ID'si
   * @param {string} userId - Kullanıcı ID'si
   * @param {Object} cursorData - İmleç verileri
   */
  static async broadcastCursorPosition(templateId, userId, cursorData) {
    try {
      const room = `template_${templateId}`;
      
      // İmleç verilerini hazırla
      const cursorInfo = {
        type: 'cursor_position',
        templateId,
        userId,
        cursor: cursorData,
        timestamp: new Date()
      };

      // Odadaki tüm kullanıcılara gönder (gönderen hariç)
      await WebSocketService.broadcastToRoom(room, cursorInfo, userId);
      
      return { success: true };
    } catch (error) {
      logger.error(`Error broadcasting cursor position: ${error.message}`);
      throw error;
    }
  }

  /**
   * Kullanıcı seçim durumunu yayınlar
   * @param {string} templateId - Şablon ID'si
   * @param {string} userId - Kullanıcı ID'si
   * @param {Object} selectionData - Seçim verileri
   */
  static async broadcastSelection(templateId, userId, selectionData) {
    try {
      const room = `template_${templateId}`;
      
      // Seçim verilerini hazırla
      const selectionInfo = {
        type: 'selection',
        templateId,
        userId,
        selection: selectionData,
        timestamp: new Date()
      };

      // Odadaki tüm kullanıcılara gönder (gönderen hariç)
      await WebSocketService.broadcastToRoom(room, selectionInfo, userId);
      
      return { success: true };
    } catch (error) {
      logger.error(`Error broadcasting selection: ${error.message}`);
      throw error;
    }
  }

  /**
   * Şablon odasındaki aktif kullanıcıları getirir
   * @param {string} templateId - Şablon ID'si
   */
  static async getActiveUsers(templateId) {
    try {
      const room = `template_${templateId}`;
      const activeUsers = await WebSocketService.getRoomUsers(room);
      
      // Kullanıcı bilgilerini getir
      const userIds = activeUsers.map(user => user.userId);
      const users = await User.find({ _id: { $in: userIds } })
        .select('name email profileImageUrl');
      
      return users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        socketId: activeUsers.find(u => u.userId === user._id.toString())?.socketId
      }));
    } catch (error) {
      logger.error(`Error getting active users: ${error.message}`);
      throw error;
    }
  }

  /**
   * Kullanıcının şablona erişim iznini kontrol eder
   * @param {string} userId - Kullanıcı ID'si
   * @param {string} templateId - Şablon ID'si
   */
  static async checkTemplateAccess(userId, templateId) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        return false;
      }

      // Sahip kontrolü
      if (template.owner.toString() === userId) {
        return true;
      }

      // Paylaşım izni kontrolü
      const hasSharePermission = template.sharingPermissions.some(
        p => p.user.toString() === userId && 
             ['view', 'edit', 'admin'].includes(p.permission) &&
             (!p.expiresAt || p.expiresAt > new Date())
      );

      return hasSharePermission;
    } catch (error) {
      logger.error(`Error checking template access: ${error.message}`);
      return false;
    }
  }

  /**
   * Kullanıcının şablonda düzenleme iznini kontrol eder
   * @param {string} userId - Kullanıcı ID'si
   * @param {string} templateId - Şablon ID'si
   */
  static async checkEditPermission(userId, templateId) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        return false;
      }

      // Sahip kontrolü
      if (template.owner.toString() === userId) {
        return true;
      }

      // Düzenleme izni kontrolü
      const hasEditPermission = template.sharingPermissions.some(
        p => p.user.toString() === userId && 
             ['edit', 'admin'].includes(p.permission) &&
             (!p.expiresAt || p.expiresAt > new Date())
      );

      return hasEditPermission;
    } catch (error) {
      logger.error(`Error checking edit permission: ${error.message}`);
      return false;
    }
  }

  /**
   * Kullanıcı katıldı bildirimini gönderir
   * @param {string} templateId - Şablon ID'si
   * @param {string} userId - Kullanıcı ID'si
   * @param {string} socketId - Socket ID'si
   */
  static async notifyUserJoined(templateId, userId, socketId) {
    try {
      const room = `template_${templateId}`;
      const user = await User.findById(userId).select('name email profileImageUrl');
      
      if (user) {
        const notification = {
          type: 'user_joined',
          templateId,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            profileImageUrl: user.profileImageUrl
          },
          timestamp: new Date()
        };

        await WebSocketService.broadcastToRoom(room, notification, userId);
      }
    } catch (error) {
      logger.error(`Error notifying user joined: ${error.message}`);
    }
  }

  /**
   * Kullanıcı ayrıldı bildirimini gönderir
   * @param {string} templateId - Şablon ID'si
   * @param {string} userId - Kullanıcı ID'si
   * @param {string} socketId - Socket ID'si
   */
  static async notifyUserLeft(templateId, userId, socketId) {
    try {
      const room = `template_${templateId}`;
      const user = await User.findById(userId).select('name email profileImageUrl');
      
      if (user) {
        const notification = {
          type: 'user_left',
          templateId,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            profileImageUrl: user.profileImageUrl
          },
          timestamp: new Date()
        };

        await WebSocketService.broadcastToRoom(room, notification, userId);
      }
    } catch (error) {
      logger.error(`Error notifying user left: ${error.message}`);
    }
  }

  /**
   * Şablon kilitleme durumunu yönetir
   * @param {string} templateId - Şablon ID'si
   * @param {string} userId - Kullanıcı ID'si
   * @param {string} blockId - Blok ID'si
   * @param {boolean} locked - Kilitleme durumu
   */
  static async manageBlockLock(templateId, userId, blockId, locked) {
    try {
      const room = `template_${templateId}`;
      
      const lockData = {
        type: 'block_lock',
        templateId,
        blockId,
        userId,
        locked,
        timestamp: new Date()
      };

      await WebSocketService.broadcastToRoom(room, lockData, userId);
      
      logger.info(`Block ${blockId} ${locked ? 'locked' : 'unlocked'} by user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error managing block lock: ${error.message}`);
      throw error;
    }
  }

  /**
   * Şablon değişiklik geçmişini yayınlar
   * @param {string} templateId - Şablon ID'si
   * @param {string} userId - Kullanıcı ID'si
   * @param {Object} historyData - Geçmiş verileri
   */
  static async broadcastHistoryUpdate(templateId, userId, historyData) {
    try {
      const room = `template_${templateId}`;
      
      const historyInfo = {
        type: 'history_update',
        templateId,
        userId,
        history: historyData,
        timestamp: new Date()
      };

      await WebSocketService.broadcastToRoom(room, historyInfo, userId);
      
      return { success: true };
    } catch (error) {
      logger.error(`Error broadcasting history update: ${error.message}`);
      throw error;
    }
  }
}

module.exports = CollaborationService;
