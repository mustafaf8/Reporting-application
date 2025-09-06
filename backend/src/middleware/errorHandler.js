const logger = require("../config/logger");

// Geliştirme ortamı için gelişmiş hata yönetimi
const errorHandler = (err, req, res, next) => {
  // Hata loglama
  logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    userId: req.user?.id,
    userAgent: req.get("User-Agent"),
    ip: req.ip || req.connection.remoteAddress,
  });

  // Geliştirme ortamında detaylı hata bilgisi
  if (process.env.NODE_ENV === "development") {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Sunucu hatası",
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name,
        status: err.status || 500,
      },
      request: {
        url: req.url,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Production ortamında güvenli hata mesajı
  const statusCode = err.status || 500;
  const message =
    statusCode === 500 ? "Sunucu hatası" : err.message || "Bilinmeyen hata";

  res.status(statusCode).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  logger.warn("Route not found", {
    url: req.url,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent"),
  });

  res.status(404).json({
    success: false,
    message: "Endpoint bulunamadı",
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
};

// Async hata yakalama wrapper'ı
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation hata handler'ı
const validationErrorHandler = (err, req, res, next) => {
  if (err.name === "ValidationError") {
    logger.warn("Validation error", {
      error: err.message,
      details: err.details,
      url: req.url,
      method: req.method,
      userId: req.user?.id,
    });

    return res.status(400).json({
      success: false,
      message: "Geçersiz veri",
      errors: err.details || [err.message],
      timestamp: new Date().toISOString(),
    });
  }
  next(err);
};

// JWT hata handler'ı
const jwtErrorHandler = (err, req, res, next) => {
  if (err.name === "JsonWebTokenError") {
    logger.warn("JWT error", {
      error: err.message,
      url: req.url,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress,
    });

    return res.status(401).json({
      success: false,
      message: "Geçersiz token",
      timestamp: new Date().toISOString(),
    });
  }

  if (err.name === "TokenExpiredError") {
    logger.warn("JWT expired", {
      error: err.message,
      url: req.url,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress,
    });

    return res.status(401).json({
      success: false,
      message: "Token süresi dolmuş",
      timestamp: new Date().toISOString(),
    });
  }

  next(err);
};

// MongoDB hata handler'ı
const mongoErrorHandler = (err, req, res, next) => {
  if (err.name === "MongoError" || err.name === "MongoServerError") {
    logger.error("MongoDB error", {
      error: err.message,
      code: err.code,
      url: req.url,
      method: req.method,
      userId: req.user?.id,
    });

    return res.status(500).json({
      success: false,
      message: "Veritabanı hatası",
      timestamp: new Date().toISOString(),
    });
  }

  if (err.name === "CastError") {
    logger.warn("MongoDB cast error", {
      error: err.message,
      url: req.url,
      method: req.method,
      userId: req.user?.id,
    });

    return res.status(400).json({
      success: false,
      message: "Geçersiz ID formatı",
      timestamp: new Date().toISOString(),
    });
  }

  next(err);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validationErrorHandler,
  jwtErrorHandler,
  mongoErrorHandler,
};
