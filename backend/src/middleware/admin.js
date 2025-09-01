const logger = require("../config/logger");

// Admin yetkisi kontrolü middleware'i
module.exports = function admin(req, res, next) {
  // Önce auth middleware'inin çalıştığından emin ol
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Yetkilendirme gerekli",
    });
  }

  // Admin rolü kontrolü
  if (req.user.role !== "admin") {
    logger.security("Non-admin user attempted admin action", {
      userId: req.user.id,
      userRole: req.user.role,
      ip: req.ip,
      url: req.url,
      method: req.method,
    });

    return res.status(403).json({
      success: false,
      message: "Bu işlem için admin yetkisi gerekli",
    });
  }

  // Admin yetkisi var, devam et
  next();
};
