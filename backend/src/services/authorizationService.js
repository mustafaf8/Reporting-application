const User = require("../models/User");
const Template = require("../models/Template");
const logger = require("../config/logger");

class AuthorizationService {
  /**
   * Kullanıcının şablona erişim iznini kontrol et
   */
  static async checkTemplateAccess(templateId, userId, requiredPermission = "view") {
    try {
      const template = await Template.findById(templateId);
      
      if (!template) {
        throw new Error("Şablon bulunamadı");
      }

      return template.hasAccess(userId, requiredPermission);
    } catch (error) {
      logger.error("Error checking template access", {
        error: error.message,
        templateId,
        userId,
        requiredPermission
      });
      return false;
    }
  }

  /**
   * Kullanıcının abonelik seviyesine göre özellik kısıtlamalarını kontrol et
   */
  static async checkSubscriptionLimits(userId, feature) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error("Kullanıcı bulunamadı");
      }

      const subscription = user.subscription || { plan: "free", features: {} };
      const limits = this.getSubscriptionLimits(subscription.plan);

      // Özellik mevcut mu kontrol et
      if (!limits.features.includes(feature)) {
        return {
          allowed: false,
          reason: "Bu özellik abonelik planınızda mevcut değil",
          requiredPlan: this.getRequiredPlan(feature)
        };
      }

      // Kullanım limitlerini kontrol et
      const usage = await this.getFeatureUsage(userId, feature);
      const limit = limits.usage[feature];

      if (usage >= limit) {
        return {
          allowed: false,
          reason: `${feature} kullanım limitiniz aşıldı`,
          currentUsage: usage,
          limit: limit,
          requiredPlan: this.getRequiredPlan(feature)
        };
      }

      return {
        allowed: true,
        currentUsage: usage,
        limit: limit,
        remaining: limit - usage
      };
    } catch (error) {
      logger.error("Error checking subscription limits", {
        error: error.message,
        userId,
        feature
      });
      return {
        allowed: false,
        reason: "Abonelik kontrolü yapılamadı"
      };
    }
  }

  /**
   * Abonelik planına göre limitleri getir
   */
  static getSubscriptionLimits(plan) {
    const limits = {
      free: {
        features: ["view", "create", "edit", "delete"],
        usage: {
          templates: 5,
          blocks: 50,
          assets: 10,
          collaborators: 0,
          versionHistory: 10,
          exports: 5
        }
      },
      basic: {
        features: ["view", "create", "edit", "delete", "share", "collaborate"],
        usage: {
          templates: 25,
          blocks: 200,
          assets: 50,
          collaborators: 3,
          versionHistory: 50,
          exports: 25
        }
      },
      pro: {
        features: ["view", "create", "edit", "delete", "share", "collaborate", "advanced"],
        usage: {
          templates: 100,
          blocks: 1000,
          assets: 200,
          collaborators: 10,
          versionHistory: 100,
          exports: 100
        }
      },
      enterprise: {
        features: ["view", "create", "edit", "delete", "share", "collaborate", "advanced", "admin"],
        usage: {
          templates: -1, // Unlimited
          blocks: -1,
          assets: -1,
          collaborators: -1,
          versionHistory: -1,
          exports: -1
        }
      }
    };

    return limits[plan] || limits.free;
  }

  /**
   * Özellik için gerekli planı getir
   */
  static getRequiredPlan(feature) {
    const featurePlans = {
      share: "basic",
      collaborate: "basic",
      advanced: "pro",
      admin: "enterprise"
    };

    return featurePlans[feature] || "free";
  }

  /**
   * Kullanıcının özellik kullanımını getir
   */
  static async getFeatureUsage(userId, feature) {
    try {
      switch (feature) {
        case "templates":
          return await Template.countDocuments({ owner: userId });
        
        case "blocks":
          const templates = await Template.find({ owner: userId });
          return templates.reduce((total, template) => total + (template.blocks?.length || 0), 0);
        
        case "assets":
          // Asset modeli kullanılarak hesaplanacak
          return 0; // Placeholder
        
        case "collaborators":
          const sharedTemplates = await Template.find({ 
            "sharingPermissions.userId": userId 
          });
          return sharedTemplates.length;
        
        case "versionHistory":
          const userTemplates = await Template.find({ owner: userId });
          return userTemplates.reduce((total, template) => 
            total + (template.versionHistory?.length || 0), 0);
        
        case "exports":
          // Export sayısı için ayrı bir model gerekebilir
          return 0; // Placeholder
        
        default:
          return 0;
      }
    } catch (error) {
      logger.error("Error getting feature usage", {
        error: error.message,
        userId,
        feature
      });
      return 0;
    }
  }

  /**
   * Kullanıcının şablon oluşturma iznini kontrol et
   */
  static async canCreateTemplate(userId) {
    return await this.checkSubscriptionLimits(userId, "templates");
  }

  /**
   * Kullanıcının blok ekleme iznini kontrol et
   */
  static async canAddBlock(userId, templateId) {
    const [accessCheck, subscriptionCheck] = await Promise.all([
      this.checkTemplateAccess(templateId, userId, "edit"),
      this.checkSubscriptionLimits(userId, "blocks")
    ]);

    return {
      allowed: accessCheck && subscriptionCheck.allowed,
      accessCheck,
      subscriptionCheck
    };
  }

  /**
   * Kullanıcının şablon paylaşma iznini kontrol et
   */
  static async canShareTemplate(userId) {
    return await this.checkSubscriptionLimits(userId, "share");
  }

  /**
   * Kullanıcının işbirliği yapma iznini kontrol et
   */
  static async canCollaborate(userId) {
    return await this.checkSubscriptionLimits(userId, "collaborate");
  }

  /**
   * Kullanıcının gelişmiş özellikleri kullanma iznini kontrol et
   */
  static async canUseAdvancedFeatures(userId) {
    return await this.checkSubscriptionLimits(userId, "advanced");
  }

  /**
   * Kullanıcının admin özelliklerini kullanma iznini kontrol et
   */
  static async canUseAdminFeatures(userId) {
    return await this.checkSubscriptionLimits(userId, "admin");
  }

  /**
   * Kullanıcının şablonu düzenleme iznini kontrol et
   */
  static async canEditTemplate(userId, templateId) {
    const accessCheck = await this.checkTemplateAccess(templateId, userId, "edit");
    return {
      allowed: accessCheck,
      accessCheck
    };
  }

  /**
   * Kullanıcının şablonu silme iznini kontrol et
   */
  static async canDeleteTemplate(userId, templateId) {
    const accessCheck = await this.checkTemplateAccess(templateId, userId, "admin");
    return {
      allowed: accessCheck,
      accessCheck
    };
  }

  /**
   * Kullanıcının şablonu görüntüleme iznini kontrol et
   */
  static async canViewTemplate(userId, templateId) {
    const accessCheck = await this.checkTemplateAccess(templateId, userId, "view");
    return {
      allowed: accessCheck,
      accessCheck
    };
  }

  /**
   * Kullanıcının şablonu paylaşma iznini kontrol et
   */
  static async canShareTemplateWithUser(userId, templateId, targetUserId, permission) {
    const [canShare, canAccess] = await Promise.all([
      this.canShareTemplate(userId),
      this.checkTemplateAccess(templateId, userId, "admin")
    ]);

    return {
      allowed: canShare.allowed && canAccess,
      canShare,
      canAccess
    };
  }

  /**
   * Kullanıcının sürüm geçmişine erişim iznini kontrol et
   */
  static async canAccessVersionHistory(userId, templateId) {
    const accessCheck = await this.checkTemplateAccess(templateId, userId, "view");
    return {
      allowed: accessCheck,
      accessCheck
    };
  }

  /**
   * Kullanıcının sürüme geri dönme iznini kontrol et
   */
  static async canRevertVersion(userId, templateId) {
    const accessCheck = await this.checkTemplateAccess(templateId, userId, "edit");
    return {
      allowed: accessCheck,
      accessCheck
    };
  }

  /**
   * Kullanıcının asset yükleme iznini kontrol et
   */
  static async canUploadAsset(userId) {
    return await this.checkSubscriptionLimits(userId, "assets");
  }

  /**
   * Kullanıcının şablonu dışa aktarma iznini kontrol et
   */
  static async canExportTemplate(userId) {
    return await this.checkSubscriptionLimits(userId, "exports");
  }

  /**
   * Kullanıcının tüm izinlerini getir
   */
  static async getUserPermissions(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error("Kullanıcı bulunamadı");
      }

      const subscription = user.subscription || { plan: "free" };
      const limits = this.getSubscriptionLimits(subscription.plan);

      // Her özellik için kullanım durumunu kontrol et
      const usage = {};
      for (const feature of Object.keys(limits.usage)) {
        usage[feature] = await this.getFeatureUsage(userId, feature);
      }

      return {
        userId,
        subscription: subscription.plan,
        limits: limits.usage,
        usage,
        features: limits.features,
        canUse: (feature) => limits.features.includes(feature),
        canUseWithLimit: async (feature) => {
          const check = await this.checkSubscriptionLimits(userId, feature);
          return check.allowed;
        }
      };
    } catch (error) {
      logger.error("Error getting user permissions", {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Kullanıcının şablon üzerindeki izinlerini getir
   */
  static async getTemplatePermissions(userId, templateId) {
    try {
      const template = await Template.findById(templateId);
      
      if (!template) {
        throw new Error("Şablon bulunamadı");
      }

      const isOwner = template.owner.toString() === userId.toString();
      const sharingPermission = template.sharingPermissions.find(
        p => p.userId.toString() === userId.toString()
      );

      return {
        canView: template.hasAccess(userId, "view"),
        canEdit: template.hasAccess(userId, "edit"),
        canDelete: template.hasAccess(userId, "admin"),
        canShare: template.hasAccess(userId, "admin"),
        isOwner,
        permission: sharingPermission?.permission || (isOwner ? "owner" : "none"),
        isPublic: template.isPublic
      };
    } catch (error) {
      logger.error("Error getting template permissions", {
        error: error.message,
        userId,
        templateId
      });
      throw error;
    }
  }
}

module.exports = AuthorizationService;
