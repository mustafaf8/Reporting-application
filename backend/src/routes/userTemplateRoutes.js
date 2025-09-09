const express = require("express");
const router = express.Router();
const Template = require("../models/Template");
const User = require("../models/User");
const userTemplateService = require("../services/userTemplateService");
const auth = require("../middleware/auth");
const { requireTemplateAccess } = require("../middleware/authorization");
const logger = require("../config/logger");

// Kullanıcının kişisel şablonlarını getir
router.get("/", auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sortBy = "updatedAt",
      sortOrder = "desc",
      includeSystemTemplates = false
    } = req.query;

    const result = await userTemplateService.getUserTemplates(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      search,
      sortBy,
      sortOrder,
      includeSystemTemplates: includeSystemTemplates === 'true'
    });

    res.success(result, "Kişisel şablonlar başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting user templates", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Kişisel şablonlar getirilirken hata oluştu", 500);
  }
});

// Kişisel şablon oluştur
router.post("/", auth, async (req, res) => {
  try {
    const templateData = req.body;

    const template = await userTemplateService.createUserTemplate(
      req.user.id,
      templateData
    );

    res.success(template, "Kişisel şablon başarıyla oluşturuldu");
  } catch (error) {
    logger.error("Error creating user template", {
      error: error.message,
      userId: req.user.id,
      templateData: req.body
    });
    res.error(error.message || "Kişisel şablon oluşturulurken hata oluştu", 500);
  }
});

// Belirli bir kişisel şablonu getir
router.get("/:templateId", auth, async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await Template.findById(templateId);

    if (!template) {
      return res.error("Şablon bulunamadı", 404);
    }

    if (template.owner.toString() !== req.user.id) {
      return res.error("Bu şablonu görüntüleme izniniz yok", 403);
    }

    if (!template.isTemplate) {
      return res.error("Bu bir kişisel şablon değil", 400);
    }

    res.success(template, "Kişisel şablon başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting user template", {
      error: error.message,
      templateId: req.params.templateId,
      userId: req.user.id
    });
    res.error("Kişisel şablon getirilirken hata oluştu", 500);
  }
});

// Kişisel şablonu güncelle
router.put("/:templateId", auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const updateData = req.body;

    const template = await userTemplateService.updateUserTemplate(
      templateId,
      req.user.id,
      updateData
    );

    res.success(template, "Kişisel şablon başarıyla güncellendi");
  } catch (error) {
    logger.error("Error updating user template", {
      error: error.message,
      templateId: req.params.templateId,
      userId: req.user.id
    });
    res.error(error.message || "Kişisel şablon güncellenirken hata oluştu", 500);
  }
});

// Kişisel şablonu sil
router.delete("/:templateId", auth, async (req, res) => {
  try {
    const { templateId } = req.params;

    const result = await userTemplateService.deleteUserTemplate(
      templateId,
      req.user.id
    );

    res.success(result, "Kişisel şablon başarıyla silindi");
  } catch (error) {
    logger.error("Error deleting user template", {
      error: error.message,
      templateId: req.params.templateId,
      userId: req.user.id
    });
    res.error(error.message || "Kişisel şablon silinirken hata oluştu", 500);
  }
});

// Şablonu kişisel şablon olarak kaydet
router.post("/save-as-template/:templateId", auth, requireTemplateAccess("view"), async (req, res) => {
  try {
    const { templateId } = req.params;
    const templateData = req.body;

    const template = await userTemplateService.saveAsUserTemplate(
      templateId,
      req.user.id,
      templateData
    );

    res.success(template, "Şablon kişisel şablon olarak kaydedildi");
  } catch (error) {
    logger.error("Error saving template as user template", {
      error: error.message,
      templateId: req.params.templateId,
      userId: req.user.id
    });
    res.error(error.message || "Şablon kaydedilirken hata oluştu", 500);
  }
});

// Şablonu kopyala
router.post("/:templateId/duplicate", auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { newName } = req.body;

    const template = await userTemplateService.duplicateUserTemplate(
      templateId,
      req.user.id,
      newName
    );

    res.success(template, "Şablon başarıyla kopyalandı");
  } catch (error) {
    logger.error("Error duplicating user template", {
      error: error.message,
      templateId: req.params.templateId,
      userId: req.user.id
    });
    res.error(error.message || "Şablon kopyalanırken hata oluştu", 500);
  }
});

// Şablonu paylaş
router.post("/:templateId/share", auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const shareData = req.body;

    const template = await userTemplateService.shareUserTemplate(
      templateId,
      req.user.id,
      shareData
    );

    res.success(template, "Şablon paylaşım ayarları güncellendi");
  } catch (error) {
    logger.error("Error sharing user template", {
      error: error.message,
      templateId: req.params.templateId,
      userId: req.user.id
    });
    res.error(error.message || "Şablon paylaşılırken hata oluştu", 500);
  }
});

// Şablonları kategorilere göre grupla
router.get("/categories/grouped", auth, async (req, res) => {
  try {
    const categories = await userTemplateService.getTemplatesByCategory(req.user.id);

    res.success(categories, "Kategorilere göre şablonlar başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting templates by category", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Kategorilere göre şablonlar getirilirken hata oluştu", 500);
  }
});

// Şablon istatistiklerini getir
router.get("/stats/overview", auth, async (req, res) => {
  try {
    const stats = await userTemplateService.getTemplateStats(req.user.id);

    res.success(stats, "Şablon istatistikleri başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting template stats", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Şablon istatistikleri getirilirken hata oluştu", 500);
  }
});

// Şablonları arama
router.get("/search", auth, async (req, res) => {
  try {
    const { q: searchQuery, ...options } = req.query;

    if (!searchQuery) {
      return res.error("Arama sorgusu gerekli", 400);
    }

    const result = await userTemplateService.searchTemplates(
      req.user.id,
      searchQuery,
      {
        page: parseInt(options.page) || 1,
        limit: parseInt(options.limit) || 10,
        category: options.category,
        tags: options.tags ? options.tags.split(',') : undefined,
        isPublic: options.isPublic === 'true' ? true : options.isPublic === 'false' ? false : undefined
      }
    );

    res.success(result, "Arama sonuçları başarıyla getirildi");
  } catch (error) {
    logger.error("Error searching templates", {
      error: error.message,
      userId: req.user.id,
      searchQuery: req.query.q
    });
    res.error("Şablonlar aranırken hata oluştu", 500);
  }
});

// Şablonu kullanım sayısını artır
router.post("/:templateId/use", auth, async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await userTemplateService.incrementTemplateUsage(
      templateId,
      req.user.id
    );

    res.success(template, "Şablon kullanım sayısı güncellendi");
  } catch (error) {
    logger.error("Error incrementing template usage", {
      error: error.message,
      templateId: req.params.templateId,
      userId: req.user.id
    });
    res.error(error.message || "Şablon kullanım sayısı güncellenirken hata oluştu", 500);
  }
});

// Kullanıcının şablon limitlerini getir
router.get("/limits/current", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.error("Kullanıcı bulunamadı", 404);
    }

    const subscription = user.subscription || { plan: "free" };
    const limits = userTemplateService.getSubscriptionLimits(subscription.plan);
    
    const currentUsage = await Template.countDocuments({
      owner: req.user.id,
      isTemplate: true
    });

    res.success({
      plan: subscription.plan,
      limits,
      currentUsage,
      remaining: limits.templates === -1 ? -1 : limits.templates - currentUsage
    }, "Şablon limitleri başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting template limits", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Şablon limitleri getirilirken hata oluştu", 500);
  }
});

module.exports = router;
