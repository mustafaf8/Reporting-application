const express = require("express");
const router = express.Router();
const auditLoggingService = require("../services/auditLoggingService");
const auth = require("../middleware/auth");
const { requireAdminFeatures } = require("../middleware/authorization");
const logger = require("../config/logger");

// Kullanıcının kendi aktivitelerini getir
router.get("/my-activity", auth, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      actions,
      limit = 100
    } = req.query;

    const activities = await auditLoggingService.getUserActivity(req.user.id, {
      startDate,
      endDate,
      actions: actions ? actions.split(',') : undefined,
      limit: parseInt(limit)
    });

    res.success(activities, "Kullanıcı aktiviteleri başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting user activity", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Kullanıcı aktiviteleri getirilirken hata oluştu", 500);
  }
});

// Kaynak geçmişini getir
router.get("/resource/:resourceType/:resourceId", auth, async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const {
      startDate,
      endDate,
      actions,
      limit = 100
    } = req.query;

    const history = await auditLoggingService.getResourceHistory(
      resourceType,
      resourceId,
      {
        startDate,
        endDate,
        actions: actions ? actions.split(',') : undefined,
        limit: parseInt(limit)
      }
    );

    res.success(history, "Kaynak geçmişi başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting resource history", {
      error: error.message,
      resourceType: req.params.resourceType,
      resourceId: req.params.resourceId,
      userId: req.user.id
    });
    res.error("Kaynak geçmişi getirilirken hata oluştu", 500);
  }
});

// Şüpheli aktiviteleri getir (sadece admin)
router.get("/suspicious", auth, requireAdminFeatures, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      limit = 100
    } = req.query;

    const suspiciousActivities = await auditLoggingService.getSuspiciousActivity({
      startDate,
      endDate,
      limit: parseInt(limit)
    });

    res.success(suspiciousActivities, "Şüpheli aktiviteler başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting suspicious activities", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Şüpheli aktiviteler getirilirken hata oluştu", 500);
  }
});

// Güvenlik istatistiklerini getir (sadece admin)
router.get("/security-stats", auth, requireAdminFeatures, async (req, res) => {
  try {
    const {
      startDate,
      endDate
    } = req.query;

    const stats = await auditLoggingService.getSecurityStats({
      startDate,
      endDate
    });

    res.success(stats, "Güvenlik istatistikleri başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting security stats", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Güvenlik istatistikleri getirilirken hata oluştu", 500);
  }
});

// Risk analizi yap (sadece admin)
router.get("/risk-analysis/:userId", auth, requireAdminFeatures, async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeWindowHours = 24 } = req.query;

    const riskAnalysis = await auditLoggingService.analyzeRisk(
      userId,
      parseInt(timeWindowHours)
    );

    res.success(riskAnalysis, "Risk analizi başarıyla tamamlandı");
  } catch (error) {
    logger.error("Error analyzing risk", {
      error: error.message,
      targetUserId: req.params.userId,
      userId: req.user.id
    });
    res.error("Risk analizi yapılırken hata oluştu", 500);
  }
});

// Kendi risk analizini yap
router.get("/my-risk-analysis", auth, async (req, res) => {
  try {
    const { timeWindowHours = 24 } = req.query;

    const riskAnalysis = await auditLoggingService.analyzeRisk(
      req.user.id,
      parseInt(timeWindowHours)
    );

    res.success(riskAnalysis, "Risk analizi başarıyla tamamlandı");
  } catch (error) {
    logger.error("Error analyzing user risk", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Risk analizi yapılırken hata oluştu", 500);
  }
});

// Audit logları temizle (sadece admin)
router.post("/cleanup", auth, requireAdminFeatures, async (req, res) => {
  try {
    const { olderThanDays = 90 } = req.body;

    const result = await auditLoggingService.cleanupAuditLogs(olderThanDays);

    res.success({
      deletedCount: result.deletedCount,
      olderThanDays
    }, "Audit logları başarıyla temizlendi");
  } catch (error) {
    logger.error("Error cleaning up audit logs", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Audit logları temizlenirken hata oluştu", 500);
  }
});

// Audit logging ayarlarını güncelle (sadece admin)
router.put("/settings", auth, requireAdminFeatures, async (req, res) => {
  try {
    const { enabled, sensitiveFields } = req.body;

    if (enabled !== undefined) {
      auditLoggingService.setEnabled(enabled);
    }

    if (sensitiveFields && Array.isArray(sensitiveFields)) {
      sensitiveFields.forEach(field => {
        auditLoggingService.addSensitiveField(field);
      });
    }

    res.success({
      enabled: auditLoggingService.isEnabled,
      sensitiveFields: auditLoggingService.sensitiveFields
    }, "Audit logging ayarları güncellendi");
  } catch (error) {
    logger.error("Error updating audit logging settings", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Audit logging ayarları güncellenirken hata oluştu", 500);
  }
});

// Hassas alan ekle (sadece admin)
router.post("/sensitive-fields", auth, requireAdminFeatures, async (req, res) => {
  try {
    const { field } = req.body;

    if (!field) {
      return res.error("Alan adı gerekli", 400);
    }

    auditLoggingService.addSensitiveField(field);

    res.success({
      field,
      sensitiveFields: auditLoggingService.sensitiveFields
    }, "Hassas alan eklendi");
  } catch (error) {
    logger.error("Error adding sensitive field", {
      error: error.message,
      field: req.body.field,
      userId: req.user.id
    });
    res.error("Hassas alan eklenirken hata oluştu", 500);
  }
});

// Hassas alan kaldır (sadece admin)
router.delete("/sensitive-fields/:field", auth, requireAdminFeatures, async (req, res) => {
  try {
    const { field } = req.params;

    auditLoggingService.removeSensitiveField(field);

    res.success({
      field,
      sensitiveFields: auditLoggingService.sensitiveFields
    }, "Hassas alan kaldırıldı");
  } catch (error) {
    logger.error("Error removing sensitive field", {
      error: error.message,
      field: req.params.field,
      userId: req.user.id
    });
    res.error("Hassas alan kaldırılırken hata oluştu", 500);
  }
});

// Audit log detaylarını getir
router.get("/:logId", auth, async (req, res) => {
  try {
    const { logId } = req.params;

    const AuditLog = require("../models/AuditLog");
    const log = await AuditLog.findById(logId);

    if (!log) {
      return res.error("Audit log bulunamadı", 404);
    }

    // Kullanıcı sadece kendi loglarını veya admin ise tüm logları görebilir
    if (log.user.id.toString() !== req.user.id && req.user.role !== "admin") {
      return res.error("Bu audit log'u görüntüleme izniniz yok", 403);
    }

    res.success(log, "Audit log detayları başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting audit log details", {
      error: error.message,
      logId: req.params.logId,
      userId: req.user.id
    });
    res.error("Audit log detayları getirilirken hata oluştu", 500);
  }
});

// Audit logları filtrele ve arama yap
router.get("/search", auth, async (req, res) => {
  try {
    const {
      action,
      resourceType,
      startDate,
      endDate,
      securityLevel,
      suspicious,
      page = 1,
      limit = 50
    } = req.query;

    const AuditLog = require("../models/AuditLog");
    const query = {};

    // Kullanıcı sadece kendi loglarını görebilir (admin hariç)
    if (req.user.role !== "admin") {
      query["user.id"] = req.user.id;
    }

    if (action) {
      query.action = action;
    }

    if (resourceType) {
      query["resource.type"] = resourceType;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (securityLevel) {
      query["security.level"] = securityLevel;
    }

    if (suspicious !== undefined) {
      query["security.suspicious"] = suspicious === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user.id", "name email")
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    res.success({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }, "Audit log arama sonuçları başarıyla getirildi");
  } catch (error) {
    logger.error("Error searching audit logs", {
      error: error.message,
      userId: req.user.id,
      query: req.query
    });
    res.error("Audit log arama yapılırken hata oluştu", 500);
  }
});

module.exports = router;
