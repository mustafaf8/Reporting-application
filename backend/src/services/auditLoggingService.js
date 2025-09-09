const AuditLog = require("../models/AuditLog");
const logger = require("../config/logger");

class AuditLoggingService {
  constructor() {
    this.isEnabled = process.env.AUDIT_LOGGING_ENABLED !== "false";
    this.sensitiveFields = [
      "password", "passwordHash", "token", "secret", "key",
      "creditCard", "ssn", "socialSecurityNumber"
    ];
  }

  /**
   * Audit log kaydet
   */
  async log(action, resource, user, changes = {}, details = {}) {
    if (!this.isEnabled) {
      return null;
    }

    try {
      const auditData = {
        action,
        resource: {
          type: resource.type,
          id: resource.id,
          name: resource.name
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        changes: this.sanitizeChanges(changes),
        details: {
          description: details.description,
          reason: details.reason,
          ipAddress: details.ipAddress,
          userAgent: details.userAgent,
          sessionId: details.sessionId,
          requestId: details.requestId
        },
        security: {
          level: this.determineSecurityLevel(action, resource.type),
          riskScore: 0,
          suspicious: false,
          flags: []
        },
        location: details.location,
        metadata: details.metadata || {},
        status: details.status || "success",
        error: details.error
      };

      const auditLog = await AuditLog.logAction(auditData);
      
      // Yüksek riskli işlemler için ek log
      if (auditLog.security.level === "high" || auditLog.security.level === "critical") {
        logger.warn("High risk audit action detected", {
          auditId: auditLog._id,
          action,
          resource: resource.type,
          userId: user.id,
          riskScore: auditLog.security.riskScore
        });
      }

      return auditLog;
    } catch (error) {
      logger.error("Error logging audit action", {
        error: error.message,
        action,
        resource,
        userId: user.id
      });
      // Audit logging hatası ana işlemi etkilememeli
      return null;
    }
  }

  /**
   * Şablon işlemlerini logla
   */
  async logTemplateAction(action, templateId, templateName, user, changes = {}, details = {}) {
    return await this.log(action, {
      type: "template",
      id: templateId,
      name: templateName
    }, user, changes, details);
  }

  /**
   * Kullanıcı işlemlerini logla
   */
  async logUserAction(action, userId, userName, user, changes = {}, details = {}) {
    return await this.log(action, {
      type: "user",
      id: userId,
      name: userName
    }, user, changes, details);
  }

  /**
   * Asset işlemlerini logla
   */
  async logAssetAction(action, assetId, assetName, user, changes = {}, details = {}) {
    return await this.log(action, {
      type: "asset",
      id: assetId,
      name: assetName
    }, user, changes, details);
  }

  /**
   * Abonelik işlemlerini logla
   */
  async logSubscriptionAction(action, userId, userName, user, changes = {}, details = {}) {
    return await this.log(action, {
      type: "subscription",
      id: userId,
      name: userName
    }, user, changes, details);
  }

  /**
   * Sistem işlemlerini logla
   */
  async logSystemAction(action, systemId, systemName, user, changes = {}, details = {}) {
    return await this.log(action, {
      type: "system",
      id: systemId,
      name: systemName
    }, user, changes, details);
  }

  /**
   * Başarısız işlemleri logla
   */
  async logFailedAction(action, resource, user, error, details = {}) {
    return await this.log(action, resource, user, {}, {
      ...details,
      status: "failed",
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack
      }
    });
  }

  /**
   * Güvenlik olaylarını logla
   */
  async logSecurityEvent(eventType, user, details = {}) {
    const securityActions = {
      "login_failed": "login",
      "password_brute_force": "login",
      "suspicious_activity": "access_denied",
      "unauthorized_access": "access_denied",
      "data_breach_attempt": "access_denied"
    };

    const action = securityActions[eventType] || "access_denied";
    
    return await this.log(action, {
      type: "system",
      id: "security",
      name: "Security System"
    }, user, {}, {
      ...details,
      description: `Security event: ${eventType}`,
      security: {
        level: "high",
        suspicious: true,
        flags: [eventType]
      }
    });
  }

  /**
   * Değişiklikleri temizle (hassas verileri kaldır)
   */
  sanitizeChanges(changes) {
    const sanitized = { ...changes };

    if (sanitized.before) {
      sanitized.before = this.removeSensitiveData(sanitized.before);
    }

    if (sanitized.after) {
      sanitized.after = this.removeSensitiveData(sanitized.after);
    }

    return sanitized;
  }

  /**
   * Hassas verileri kaldır
   */
  removeSensitiveData(data) {
    if (!data || typeof data !== "object") {
      return data;
    }

    const sanitized = { ...data };

    this.sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = "[REDACTED]";
      }
    });

    // Nested objects için recursive
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
        sanitized[key] = this.removeSensitiveData(sanitized[key]);
      }
    });

    return sanitized;
  }

  /**
   * Güvenlik seviyesini belirle
   */
  determineSecurityLevel(action, resourceType) {
    const highRiskActions = ["delete", "password_change", "permission_change"];
    const highRiskResources = ["user", "subscription", "system"];

    if (highRiskActions.includes(action) || highRiskResources.includes(resourceType)) {
      return "high";
    }

    const mediumRiskActions = ["update", "share", "export"];
    if (mediumRiskActions.includes(action)) {
      return "medium";
    }

    return "low";
  }

  /**
   * Kullanıcı aktivitelerini getir
   */
  async getUserActivity(userId, options = {}) {
    try {
      return await AuditLog.getUserActivity(userId, options);
    } catch (error) {
      logger.error("Error getting user activity", {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Kaynak geçmişini getir
   */
  async getResourceHistory(resourceType, resourceId, options = {}) {
    try {
      return await AuditLog.getResourceHistory(resourceType, resourceId, options);
    } catch (error) {
      logger.error("Error getting resource history", {
        error: error.message,
        resourceType,
        resourceId
      });
      throw error;
    }
  }

  /**
   * Şüpheli aktiviteleri getir
   */
  async getSuspiciousActivity(options = {}) {
    try {
      return await AuditLog.getSuspiciousActivity(options);
    } catch (error) {
      logger.error("Error getting suspicious activity", {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Güvenlik istatistiklerini getir
   */
  async getSecurityStats(options = {}) {
    try {
      return await AuditLog.getSecurityStats(options);
    } catch (error) {
      logger.error("Error getting security stats", {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Audit logları temizle (eski logları sil)
   */
  async cleanupAuditLogs(olderThanDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await AuditLog.deleteMany({
        timestamp: { $lt: cutoffDate },
        "security.level": { $in: ["low", "medium"] }
      });

      logger.info("Audit logs cleaned up", {
        deletedCount: result.deletedCount,
        cutoffDate
      });

      return result;
    } catch (error) {
      logger.error("Error cleaning up audit logs", {
        error: error.message,
        olderThanDays
      });
      throw error;
    }
  }

  /**
   * Risk analizi yap
   */
  async analyzeRisk(userId, timeWindowHours = 24) {
    try {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - timeWindowHours);

      const activities = await AuditLog.find({
        "user.id": userId,
        timestamp: { $gte: startDate }
      }).sort({ timestamp: -1 });

      const riskFactors = {
        highRiskActions: 0,
        suspiciousActivities: 0,
        failedActions: 0,
        nightActivities: 0,
        rapidActions: 0
      };

      activities.forEach((activity, index) => {
        if (["high", "critical"].includes(activity.security.level)) {
          riskFactors.highRiskActions++;
        }

        if (activity.security.suspicious) {
          riskFactors.suspiciousActivities++;
        }

        if (activity.status === "failed") {
          riskFactors.failedActions++;
        }

        const hour = activity.timestamp.getHours();
        if (hour >= 23 || hour <= 6) {
          riskFactors.nightActivities++;
        }

        // Hızlı ardışık işlemler
        if (index > 0) {
          const timeDiff = activities[index - 1].timestamp.getTime() - activity.timestamp.getTime();
          if (timeDiff < 60000) { // 1 dakikadan az
            riskFactors.rapidActions++;
          }
        }
      });

      const riskScore = this.calculateRiskScore(riskFactors, activities.length);

      return {
        riskScore,
        riskFactors,
        activityCount: activities.length,
        timeWindow: timeWindowHours,
        recommendation: this.getRiskRecommendation(riskScore)
      };
    } catch (error) {
      logger.error("Error analyzing risk", {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Risk skorunu hesapla
   */
  calculateRiskScore(riskFactors, totalActivities) {
    let score = 0;

    // Yüksek riskli işlemler
    score += riskFactors.highRiskActions * 20;

    // Şüpheli aktiviteler
    score += riskFactors.suspiciousActivities * 15;

    // Başarısız işlemler
    score += riskFactors.failedActions * 10;

    // Gece aktiviteleri
    score += riskFactors.nightActivities * 5;

    // Hızlı işlemler
    score += riskFactors.rapidActions * 8;

    // Toplam aktivite sayısına göre normalize et
    if (totalActivities > 0) {
      score = (score / totalActivities) * 100;
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * Risk önerisi al
   */
  getRiskRecommendation(riskScore) {
    if (riskScore >= 80) {
      return {
        level: "critical",
        action: "immediate_investigation",
        message: "Kritik risk seviyesi. Hemen araştırma gerekli."
      };
    } else if (riskScore >= 60) {
      return {
        level: "high",
        action: "investigate",
        message: "Yüksek risk seviyesi. Araştırma önerilir."
      };
    } else if (riskScore >= 40) {
      return {
        level: "medium",
        action: "monitor",
        message: "Orta risk seviyesi. İzleme önerilir."
      };
    } else {
      return {
        level: "low",
        action: "normal",
        message: "Düşük risk seviyesi. Normal işlem."
      };
    }
  }

  /**
   * Audit log servisini etkinleştir/devre dışı bırak
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    logger.info(`Audit logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Hassas alan listesini güncelle
   */
  addSensitiveField(field) {
    if (!this.sensitiveFields.includes(field)) {
      this.sensitiveFields.push(field);
    }
  }

  removeSensitiveField(field) {
    this.sensitiveFields = this.sensitiveFields.filter(f => f !== field);
  }
}

module.exports = new AuditLoggingService();
