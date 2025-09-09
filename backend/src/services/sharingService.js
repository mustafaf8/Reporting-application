const User = require("../models/User");
const Template = require("../models/Template");
const Proposal = require("../models/Proposal");
const logger = require("../config/logger");

class SharingService {
  /**
   * Şablonu başka kullanıcılarla paylaşır
   * @param {string} templateId - Şablon ID'si
   * @param {string} ownerId - Sahip kullanıcı ID'si
   * @param {Array} sharingData - Paylaşım verileri
   */
  static async shareTemplate(templateId, ownerId, sharingData) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      // Sahiplik kontrolü
      if (template.owner.toString() !== ownerId) {
        throw new Error("You don't have permission to share this template");
      }

      const results = [];
      
      for (const share of sharingData) {
        const { userId, permission, expiresAt, message } = share;
        
        // Kullanıcı var mı kontrol et
        const user = await User.findById(userId);
        if (!user) {
          results.push({ userId, success: false, error: "User not found" });
          continue;
        }

        // Zaten paylaşılmış mı kontrol et
        const existingShare = template.sharingPermissions.find(
          p => p.user.toString() === userId
        );

        if (existingShare) {
          // Mevcut paylaşımı güncelle
          existingShare.permission = permission;
          existingShare.addedAt = new Date();
          if (expiresAt) existingShare.expiresAt = expiresAt;
          if (message) existingShare.message = message;
        } else {
          // Yeni paylaşım ekle
          template.sharingPermissions.push({
            user: userId,
            permission,
            addedAt: new Date(),
            expiresAt,
            message
          });
        }

        // Kullanıcının sharedTemplates listesine ekle
        user.addRelationship('sharedTemplates', templateId);
        await user.save();

        results.push({ userId, success: true, permission });
      }

      await template.save();
      
      logger.info(`Template ${templateId} shared with ${results.length} users`);
      return { success: true, results };
    } catch (error) {
      logger.error(`Error sharing template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Şablon paylaşımını kaldırır
   * @param {string} templateId - Şablon ID'si
   * @param {string} ownerId - Sahip kullanıcı ID'si
   * @param {Array} userIds - Kaldırılacak kullanıcı ID'leri
   */
  static async unshareTemplate(templateId, ownerId, userIds) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      // Sahiplik kontrolü
      if (template.owner.toString() !== ownerId) {
        throw new Error("You don't have permission to unshare this template");
      }

      const results = [];
      
      for (const userId of userIds) {
        // Paylaşımı kaldır
        template.sharingPermissions = template.sharingPermissions.filter(
          p => p.user.toString() !== userId
        );

        // Kullanıcının sharedTemplates listesinden kaldır
        const user = await User.findById(userId);
        if (user) {
          user.removeRelationship('sharedTemplates', templateId);
          await user.save();
        }

        results.push({ userId, success: true });
      }

      await template.save();
      
      logger.info(`Template ${templateId} unshared with ${results.length} users`);
      return { success: true, results };
    } catch (error) {
      logger.error(`Error unsharing template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Kullanıcının erişebileceği şablonları getirir
   * @param {string} userId - Kullanıcı ID'si
   * @param {Object} options - Filtreleme seçenekleri
   */
  static async getAccessibleTemplates(userId, options = {}) {
    try {
      const { permission, includeOwned = true, includeShared = true } = options;
      
      let query = { $or: [] };

      // Kendi şablonları
      if (includeOwned) {
        query.$or.push({ owner: userId });
      }

      // Paylaşılan şablonlar
      if (includeShared) {
        const sharedQuery = {
          'sharingPermissions.user': userId,
          'sharingPermissions.expiresAt': { $gt: new Date() }
        };
        
        if (permission) {
          sharedQuery['sharingPermissions.permission'] = permission;
        }
        
        query.$or.push(sharedQuery);
      }

      // Eğer hiçbir şablon yoksa boş döndür
      if (query.$or.length === 0) {
        return [];
      }

      const templates = await Template.find(query)
        .populate('owner', 'name email')
        .populate('sharingPermissions.user', 'name email')
        .sort({ updatedAt: -1 });

      // Her şablon için kullanıcının izin seviyesini belirle
      const templatesWithPermissions = templates.map(template => {
        const templateObj = template.toObject();
        
        if (template.owner.toString() === userId) {
          templateObj.userPermission = 'owner';
        } else {
          const sharePermission = template.sharingPermissions.find(
            p => p.user.toString() === userId
          );
          templateObj.userPermission = sharePermission ? sharePermission.permission : 'none';
        }
        
        return templateObj;
      });

      return templatesWithPermissions;
    } catch (error) {
      logger.error(`Error getting accessible templates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Şablonun paylaşım durumunu getirir
   * @param {string} templateId - Şablon ID'si
   * @param {string} userId - Kullanıcı ID'si
   */
  static async getTemplateSharingStatus(templateId, userId) {
    try {
      const template = await Template.findById(templateId)
        .populate('owner', 'name email')
        .populate('sharingPermissions.user', 'name email');

      if (!template) {
        throw new Error("Template not found");
      }

      // Kullanıcının izin seviyesini belirle
      let userPermission = 'none';
      if (template.owner.toString() === userId) {
        userPermission = 'owner';
      } else {
        const sharePermission = template.sharingPermissions.find(
          p => p.user.toString() === userId
        );
        if (sharePermission) {
          userPermission = sharePermission.permission;
        }
      }

      return {
        templateId,
        owner: template.owner,
        isPublic: template.isPublic,
        sharingPermissions: template.sharingPermissions,
        userPermission,
        canEdit: ['owner', 'admin', 'edit'].includes(userPermission),
        canView: ['owner', 'admin', 'edit', 'view'].includes(userPermission)
      };
    } catch (error) {
      logger.error(`Error getting template sharing status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Şablonu genel erişime açar/kapatır
   * @param {string} templateId - Şablon ID'si
   * @param {string} userId - Kullanıcı ID'si
   * @param {boolean} isPublic - Genel erişim durumu
   */
  static async setTemplatePublic(templateId, userId, isPublic) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      // Sahiplik kontrolü
      if (template.owner.toString() !== userId) {
        throw new Error("You don't have permission to change template visibility");
      }

      template.isPublic = isPublic;
      await template.save();

      logger.info(`Template ${templateId} public status changed to ${isPublic}`);
      return { success: true, isPublic };
    } catch (error) {
      logger.error(`Error setting template public: ${error.message}`);
      throw error;
    }
  }

  /**
   * Şablonu fork eder (kopyalar)
   * @param {string} templateId - Şablon ID'si
   * @param {string} userId - Kullanıcı ID'si
   * @param {Object} options - Fork seçenekleri
   */
  static async forkTemplate(templateId, userId, options = {}) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      // Erişim kontrolü
      const sharingStatus = await this.getTemplateSharingStatus(templateId, userId);
      if (!sharingStatus.canView) {
        throw new Error("You don't have permission to fork this template");
      }

      // Fork oluştur
      const forkedTemplate = template.fork(userId);
      const newTemplate = new Template(forkedTemplate);
      await newTemplate.save();

      // Orijinal şablonun forks listesine ekle
      template.addRelationship('forks', newTemplate._id);
      await template.save();

      // Kullanıcının ownedTemplates listesine ekle
      const user = await User.findById(userId);
      if (user) {
        user.addRelationship('ownedTemplates', newTemplate._id);
        await user.save();
      }

      logger.info(`Template ${templateId} forked by user ${userId}`);
      return { success: true, forkedTemplate: newTemplate };
    } catch (error) {
      logger.error(`Error forking template: ${error.message}`);
      throw error;
    }
  }

  /**
   * İşbirliği davetiyesi gönderir
   * @param {string} templateId - Şablon ID'si
   * @param {string} ownerId - Sahip kullanıcı ID'si
   * @param {Array} invitations - Davetiye verileri
   */
  static async sendCollaborationInvitations(templateId, ownerId, invitations) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      // Sahiplik kontrolü
      if (template.owner.toString() !== ownerId) {
        throw new Error("You don't have permission to send invitations for this template");
      }

      const results = [];
      
      for (const invitation of invitations) {
        const { email, permission, message, expiresAt } = invitation;
        
        // Kullanıcıyı email ile bul
        const user = await User.findOne({ email });
        if (!user) {
          results.push({ email, success: false, error: "User not found" });
          continue;
        }

        // Davetiyeyi gönder (burada email servisi entegre edilebilir)
        // Şimdilik sadece paylaşım iznini ekleyelim
        template.sharingPermissions.push({
          user: user._id,
          permission,
          addedAt: new Date(),
          expiresAt,
          message,
          status: 'pending'
        });

        // Kullanıcının sharedTemplates listesine ekle
        user.addRelationship('sharedTemplates', templateId);
        await user.save();

        results.push({ email, success: true, permission });
      }

      await template.save();
      
      logger.info(`Collaboration invitations sent for template ${templateId}`);
      return { success: true, results };
    } catch (error) {
      logger.error(`Error sending collaboration invitations: ${error.message}`);
      throw error;
    }
  }

  /**
   * İşbirliği davetiyesini kabul eder/reddeder
   * @param {string} templateId - Şablon ID'si
   * @param {string} userId - Kullanıcı ID'si
   * @param {boolean} accept - Kabul/red durumu
   */
  static async respondToCollaborationInvitation(templateId, userId, accept) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      const sharePermission = template.sharingPermissions.find(
        p => p.user.toString() === userId && p.status === 'pending'
      );

      if (!sharePermission) {
        throw new Error("No pending invitation found");
      }

      if (accept) {
        sharePermission.status = 'accepted';
        sharePermission.acceptedAt = new Date();
      } else {
        sharePermission.status = 'rejected';
        sharePermission.rejectedAt = new Date();
        
        // Kullanıcının sharedTemplates listesinden kaldır
        const user = await User.findById(userId);
        if (user) {
          user.removeRelationship('sharedTemplates', templateId);
          await user.save();
        }
      }

      await template.save();
      
      logger.info(`Collaboration invitation ${accept ? 'accepted' : 'rejected'} for template ${templateId}`);
      return { success: true, accepted: accept };
    } catch (error) {
      logger.error(`Error responding to collaboration invitation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Şablon erişim loglarını getirir
   * @param {string} templateId - Şablon ID'si
   * @param {string} userId - Kullanıcı ID'si
   * @param {Object} options - Filtreleme seçenekleri
   */
  static async getTemplateAccessLogs(templateId, userId, options = {}) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      // Sahiplik kontrolü
      if (template.owner.toString() !== userId) {
        throw new Error("You don't have permission to view access logs");
      }

      // Burada gerçek bir log sistemi entegre edilebilir
      // Şimdilik temel bilgileri döndürelim
      const accessLogs = template.sharingPermissions.map(permission => ({
        user: permission.user,
        permission: permission.permission,
        addedAt: permission.addedAt,
        expiresAt: permission.expiresAt,
        status: permission.status || 'active',
        message: permission.message
      }));

      return accessLogs;
    } catch (error) {
      logger.error(`Error getting template access logs: ${error.message}`);
      throw error;
    }
  }
}

module.exports = SharingService;
