const auditLoggingService = require("../services/auditLoggingService");
const logger = require("../config/logger");

/**
 * Otomatik audit logging middleware'i
 */
const auditLogging = (options = {}) => {
  const {
    resourceType,
    action,
    getResourceId = (req) => req.params.id,
    getResourceName = (req) => req.params.name || req.body.name,
    getChanges = (req) => ({ before: req.auditData?.before, after: req.body }),
    getDetails = (req) => ({
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      requestId: req.id
    }),
    skipOnError = false
  } = options;

  return async (req, res, next) => {
    // Audit data'yı request'e ekle
    req.auditData = {
      before: null,
      after: null,
      changes: null
    };

    // Response interceptor ekle
    const originalSend = res.send;
    const originalJson = res.json;

    res.send = function(data) {
      // Audit log kaydet
      if (req.user && action) {
        try {
          const resourceId = getResourceId(req);
          const resourceName = getResourceName(req);
          const changes = getChanges(req);
          const details = getDetails(req);

          if (resourceId) {
            auditLoggingService.log(
              action,
              {
                type: resourceType,
                id: resourceId,
                name: resourceName
              },
              {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
              },
              changes,
              {
                ...details,
                status: res.statusCode >= 400 ? "failed" : "success"
              }
            );
          }
        } catch (error) {
          logger.error("Error in audit logging middleware", {
            error: error.message,
            action,
            resourceType,
            userId: req.user?.id
          });
        }
      }

      return originalSend.call(this, data);
    };

    res.json = function(data) {
      // Audit log kaydet
      if (req.user && action) {
        try {
          const resourceId = getResourceId(req);
          const resourceName = getResourceName(req);
          const changes = getChanges(req);
          const details = getDetails(req);

          if (resourceId) {
            auditLoggingService.log(
              action,
              {
                type: resourceType,
                id: resourceId,
                name: resourceName
              },
              {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
              },
              changes,
              {
                ...details,
                status: res.statusCode >= 400 ? "failed" : "success"
              }
            );
          }
        } catch (error) {
          logger.error("Error in audit logging middleware", {
            error: error.message,
            action,
            resourceType,
            userId: req.user?.id
          });
        }
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Şablon işlemleri için audit logging
 */
const auditTemplateActions = (action) => {
  return auditLogging({
    resourceType: "template",
    action,
    getResourceId: (req) => req.params.id,
    getResourceName: (req) => req.body.name || req.params.name,
    getChanges: (req) => ({
      before: req.auditData?.before,
      after: req.body,
      fields: req.auditData?.changedFields || []
    })
  });
};

/**
 * Kullanıcı işlemleri için audit logging
 */
const auditUserActions = (action) => {
  return auditLogging({
    resourceType: "user",
    action,
    getResourceId: (req) => req.params.id || req.user.id,
    getResourceName: (req) => req.body.name || req.user.name,
    getChanges: (req) => ({
      before: req.auditData?.before,
      after: req.body,
      fields: req.auditData?.changedFields || []
    })
  });
};

/**
 * Asset işlemleri için audit logging
 */
const auditAssetActions = (action) => {
  return auditLogging({
    resourceType: "asset",
    action,
    getResourceId: (req) => req.params.id || req.params.assetId,
    getResourceName: (req) => req.body.originalName || req.params.name,
    getChanges: (req) => ({
      before: req.auditData?.before,
      after: req.body,
      fields: req.auditData?.changedFields || []
    })
  });
};

/**
 * Abonelik işlemleri için audit logging
 */
const auditSubscriptionActions = (action) => {
  return auditLogging({
    resourceType: "subscription",
    action,
    getResourceId: (req) => req.user.id,
    getResourceName: (req) => req.user.name,
    getChanges: (req) => ({
      before: req.auditData?.before,
      after: req.body,
      fields: req.auditData?.changedFields || []
    })
  });
};

/**
 * Manuel audit log kaydetme
 */
const logAuditAction = async (req, action, resourceType, resourceId, resourceName, changes = {}, details = {}) => {
  try {
    if (!req.user) {
      logger.warn("No user found for audit logging", { action, resourceType });
      return;
    }

    const auditDetails = {
      ...details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      requestId: req.id
    };

    return await auditLoggingService.log(
      action,
      {
        type: resourceType,
        id: resourceId,
        name: resourceName
      },
      {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      changes,
      auditDetails
    );
  } catch (error) {
    logger.error("Error logging manual audit action", {
      error: error.message,
      action,
      resourceType,
      userId: req.user?.id
    });
  }
};

/**
 * Başarısız işlemleri logla
 */
const logFailedAction = async (req, action, resourceType, resourceId, resourceName, error, details = {}) => {
  try {
    if (!req.user) {
      logger.warn("No user found for failed action logging", { action, resourceType });
      return;
    }

    const auditDetails = {
      ...details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      requestId: req.id,
      status: "failed",
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack
      }
    };

    return await auditLoggingService.log(
      action,
      {
        type: resourceType,
        id: resourceId,
        name: resourceName
      },
      {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      {},
      auditDetails
    );
  } catch (auditError) {
    logger.error("Error logging failed action", {
      error: auditError.message,
      action,
      resourceType,
      userId: req.user?.id
    });
  }
};

/**
 * Güvenlik olaylarını logla
 */
const logSecurityEvent = async (req, eventType, details = {}) => {
  try {
    if (!req.user) {
      logger.warn("No user found for security event logging", { eventType });
      return;
    }

    return await auditLoggingService.logSecurityEvent(
      eventType,
      {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      {
        ...details,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        requestId: req.id
      }
    );
  } catch (error) {
    logger.error("Error logging security event", {
      error: error.message,
      eventType,
      userId: req.user?.id
    });
  }
};

module.exports = {
  auditLogging,
  auditTemplateActions,
  auditUserActions,
  auditAssetActions,
  auditSubscriptionActions,
  logAuditAction,
  logFailedAction,
  logSecurityEvent
};
