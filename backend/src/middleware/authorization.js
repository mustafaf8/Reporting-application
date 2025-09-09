const authorizationService = require("../services/authorizationService");
const logger = require("../config/logger");

/**
 * Şablon erişim kontrolü middleware'i
 */
const requireTemplateAccess = (requiredPermission = "view") => {
  return async (req, res, next) => {
    try {
      const templateId = req.params.id || req.params.templateId;
      const userId = req.user.id;

      if (!templateId) {
        return res.error("Şablon ID'si gerekli", 400);
      }

      const hasAccess = await authorizationService.checkTemplateAccess(
        templateId, 
        userId, 
        requiredPermission
      );

      if (!hasAccess) {
        return res.error("Bu şablon için gerekli izniniz yok", 403);
      }

      next();
    } catch (error) {
      logger.error("Error in requireTemplateAccess middleware", {
        error: error.message,
        templateId: req.params.id || req.params.templateId,
        userId: req.user?.id,
        requiredPermission
      });
      res.error("Erişim kontrolü yapılırken hata oluştu", 500);
    }
  };
};

/**
 * Abonelik limiti kontrolü middleware'i
 */
const requireSubscriptionFeature = (feature) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const check = await authorizationService.checkSubscriptionLimits(userId, feature);

      if (!check.allowed) {
        return res.error(check.reason, 403, {
          requiredPlan: check.requiredPlan,
          currentUsage: check.currentUsage,
          limit: check.limit
        });
      }

      // Kullanım bilgilerini response'a ekle
      req.subscriptionInfo = {
        feature,
        currentUsage: check.currentUsage,
        limit: check.limit,
        remaining: check.remaining
      };

      next();
    } catch (error) {
      logger.error("Error in requireSubscriptionFeature middleware", {
        error: error.message,
        userId: req.user?.id,
        feature
      });
      res.error("Abonelik kontrolü yapılırken hata oluştu", 500);
    }
  };
};

/**
 * Şablon oluşturma izni kontrolü
 */
const requireCreateTemplate = requireSubscriptionFeature("templates");

/**
 * Blok ekleme izni kontrolü
 */
const requireAddBlock = async (req, res, next) => {
  try {
    const templateId = req.params.id;
    const userId = req.user.id;

    const check = await authorizationService.canAddBlock(userId, templateId);

    if (!check.allowed) {
      if (!check.accessCheck) {
        return res.error("Bu şablonu düzenleme izniniz yok", 403);
      }
      if (!check.subscriptionCheck.allowed) {
        return res.error(check.subscriptionCheck.reason, 403, {
          requiredPlan: check.subscriptionCheck.requiredPlan,
          currentUsage: check.subscriptionCheck.currentUsage,
          limit: check.subscriptionCheck.limit
        });
      }
    }

    req.subscriptionInfo = check.subscriptionCheck;
    next();
  } catch (error) {
    logger.error("Error in requireAddBlock middleware", {
      error: error.message,
      templateId: req.params.id,
      userId: req.user?.id
    });
    res.error("Blok ekleme izni kontrol edilirken hata oluştu", 500);
  }
};

/**
 * Şablon paylaşma izni kontrolü
 */
const requireShareTemplate = requireSubscriptionFeature("share");

/**
 * İşbirliği izni kontrolü
 */
const requireCollaborate = requireSubscriptionFeature("collaborate");

/**
 * Gelişmiş özellikler izni kontrolü
 */
const requireAdvancedFeatures = requireSubscriptionFeature("advanced");

/**
 * Admin özellikleri izni kontrolü
 */
const requireAdminFeatures = requireSubscriptionFeature("admin");

/**
 * Asset yükleme izni kontrolü
 */
const requireUploadAsset = requireSubscriptionFeature("assets");

/**
 * Şablon dışa aktarma izni kontrolü
 */
const requireExportTemplate = requireSubscriptionFeature("exports");

/**
 * Kullanıcı izinlerini response'a ekleme middleware'i
 */
const addUserPermissions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const permissions = await authorizationService.getUserPermissions(userId);
    req.userPermissions = permissions;
    next();
  } catch (error) {
    logger.error("Error in addUserPermissions middleware", {
      error: error.message,
      userId: req.user?.id
    });
    // Hata durumunda da devam et, sadece logla
    next();
  }
};

/**
 * Şablon izinlerini response'a ekleme middleware'i
 */
const addTemplatePermissions = async (req, res, next) => {
  try {
    const templateId = req.params.id || req.params.templateId;
    const userId = req.user.id;

    if (templateId) {
      const permissions = await authorizationService.getTemplatePermissions(userId, templateId);
      req.templatePermissions = permissions;
    }

    next();
  } catch (error) {
    logger.error("Error in addTemplatePermissions middleware", {
      error: error.message,
      templateId: req.params.id || req.params.templateId,
      userId: req.user?.id
    });
    // Hata durumunda da devam et, sadece logla
    next();
  }
};

/**
 * Kullanıcının şablon sahibi olup olmadığını kontrol et
 */
const requireTemplateOwner = async (req, res, next) => {
  try {
    const templateId = req.params.id || req.params.templateId;
    const userId = req.user.id;

    if (!templateId) {
      return res.error("Şablon ID'si gerekli", 400);
    }

    const permissions = await authorizationService.getTemplatePermissions(userId, templateId);

    if (!permissions.isOwner) {
      return res.error("Bu işlem için şablon sahibi olmanız gerekli", 403);
    }

    req.templatePermissions = permissions;
    next();
  } catch (error) {
    logger.error("Error in requireTemplateOwner middleware", {
      error: error.message,
      templateId: req.params.id || req.params.templateId,
      userId: req.user?.id
    });
    res.error("Şablon sahipliği kontrol edilirken hata oluştu", 500);
  }
};

/**
 * Kullanıcının şablonu düzenleyebileceğini kontrol et
 */
const requireTemplateEdit = requireTemplateAccess("edit");

/**
 * Kullanıcının şablonu silebileceğini kontrol et
 */
const requireTemplateDelete = requireTemplateAccess("admin");

/**
 * Kullanıcının şablonu görüntüleyebileceğini kontrol et
 */
const requireTemplateView = requireTemplateAccess("view");

/**
 * Kullanıcının şablonu paylaşabileceğini kontrol et
 */
const requireTemplateShare = async (req, res, next) => {
  try {
    const templateId = req.params.id;
    const userId = req.user.id;

    const check = await authorizationService.canShareTemplateWithUser(
      userId, 
      templateId, 
      req.body.userId, 
      req.body.permission
    );

    if (!check.allowed) {
      if (!check.canAccess) {
        return res.error("Bu şablonu paylaşma izniniz yok", 403);
      }
      if (!check.canShare.allowed) {
        return res.error(check.canShare.reason, 403, {
          requiredPlan: check.canShare.requiredPlan
        });
      }
    }

    next();
  } catch (error) {
    logger.error("Error in requireTemplateShare middleware", {
      error: error.message,
      templateId: req.params.id,
      userId: req.user?.id
    });
    res.error("Şablon paylaşma izni kontrol edilirken hata oluştu", 500);
  }
};

module.exports = {
  requireTemplateAccess,
  requireSubscriptionFeature,
  requireCreateTemplate,
  requireAddBlock,
  requireShareTemplate,
  requireCollaborate,
  requireAdvancedFeatures,
  requireAdminFeatures,
  requireUploadAsset,
  requireExportTemplate,
  addUserPermissions,
  addTemplatePermissions,
  requireTemplateOwner,
  requireTemplateEdit,
  requireTemplateDelete,
  requireTemplateView,
  requireTemplateShare
};
