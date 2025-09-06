const SecurityService = require("../services/securityService");
const logger = require("../config/logger");

/**
 * XSS koruması middleware'i
 */
const xssProtection = (req, res, next) => {
  try {
    // Request body'yi temizle
    if (req.body && typeof req.body === 'object') {
      req.body = SecurityService.sanitizeObject(req.body);
    }

    // Query parametrelerini temizle
    if (req.query && typeof req.query === 'object') {
      req.query = SecurityService.sanitizeObject(req.query);
    }

    // Params'ı temizle
    if (req.params && typeof req.params === 'object') {
      req.params = SecurityService.sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    logger.error(`XSS protection middleware error: ${error.message}`);
    next(error);
  }
};

/**
 * SQL injection koruması middleware'i
 */
const sqlInjectionProtection = (req, res, next) => {
  try {
    // Request body'yi kontrol et
    if (req.body && typeof req.body === 'object') {
      req.body = SecurityService.preventNoSQLInjection(req.body);
    }

    // Query parametrelerini kontrol et
    if (req.query && typeof req.query === 'object') {
      req.query = SecurityService.preventNoSQLInjection(req.query);
    }

    next();
  } catch (error) {
    logger.error(`SQL injection protection middleware error: ${error.message}`);
    next(error);
  }
};

/**
 * Rate limiting middleware'i
 */
const rateLimit = (maxRequests = 100, windowMs = 900000) => {
  return async (req, res, next) => {
    try {
      const identifier = req.user?.id || req.ip;
      
      const allowed = await SecurityService.checkRateLimit(identifier, maxRequests, windowMs);
      
      if (!allowed) {
        SecurityService.logSecurityEvent('RATE_LIMIT_EXCEEDED', req.user?.id, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          method: req.method
        }, 'warn');
        
        return res.status(429).json({
          success: false,
          message: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      next();
    } catch (error) {
      logger.error(`Rate limit middleware error: ${error.message}`);
      next();
    }
  };
};

/**
 * CSRF koruması middleware'i
 */
const csrfProtection = (req, res, next) => {
  try {
    // GET, HEAD, OPTIONS istekleri için CSRF kontrolü yapma
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const userId = req.user?.id;

    if (!token || !userId) {
      SecurityService.logSecurityEvent('CSRF_TOKEN_MISSING', userId, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method
      }, 'warn');
      
      return res.status(403).json({
        success: false,
        message: 'CSRF token gerekli'
      });
    }

    const isValid = SecurityService.validateCSRFToken(token, userId);
    
    if (!isValid) {
      SecurityService.logSecurityEvent('CSRF_TOKEN_INVALID', userId, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method
      }, 'warn');
      
      return res.status(403).json({
        success: false,
        message: 'Geçersiz CSRF token'
      });
    }

    next();
  } catch (error) {
    logger.error(`CSRF protection middleware error: ${error.message}`);
    next(error);
  }
};

/**
 * Güvenlik başlıkları middleware'i
 */
const securityHeaders = (req, res, next) => {
  try {
    // XSS koruması
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Content Type Options
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Frame Options
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' ws: wss:; " +
      "frame-ancestors 'none';"
    );
    
    // HSTS (HTTPS kullanılıyorsa)
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    next();
  } catch (error) {
    logger.error(`Security headers middleware error: ${error.message}`);
    next();
  }
};

/**
 * IP whitelist kontrolü middleware'i
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    try {
      if (allowedIPs.length === 0) {
        return next();
      }

      const clientIP = req.ip || req.connection.remoteAddress;
      
      if (!allowedIPs.includes(clientIP)) {
        SecurityService.logSecurityEvent('IP_NOT_WHITELISTED', req.user?.id, {
          ip: clientIP,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          method: req.method
        }, 'warn');
        
        return res.status(403).json({
          success: false,
          message: 'IP adresi izin verilenler listesinde değil'
        });
      }

      next();
    } catch (error) {
      logger.error(`IP whitelist middleware error: ${error.message}`);
      next();
    }
  };
};

/**
 * Dosya yükleme güvenliği middleware'i
 */
const fileUploadSecurity = (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const maxFileSize = 10 * 1024 * 1024; // 10MB

    for (const file of req.files) {
      // Dosya türü kontrolü
      if (!allowedTypes.includes(file.mimetype)) {
        SecurityService.logSecurityEvent('INVALID_FILE_TYPE', req.user?.id, {
          ip: req.ip,
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        }, 'warn');
        
        return res.status(400).json({
          success: false,
          message: 'Geçersiz dosya türü'
        });
      }

      // Dosya boyutu kontrolü
      if (file.size > maxFileSize) {
        SecurityService.logSecurityEvent('FILE_TOO_LARGE', req.user?.id, {
          ip: req.ip,
          filename: file.originalname,
          size: file.size,
          maxSize: maxFileSize
        }, 'warn');
        
        return res.status(400).json({
          success: false,
          message: 'Dosya boyutu çok büyük'
        });
      }

      // Dosya adı güvenliği
      const sanitizedFilename = SecurityService.sanitizeFilename(file.originalname);
      if (!sanitizedFilename) {
        SecurityService.logSecurityEvent('INVALID_FILENAME', req.user?.id, {
          ip: req.ip,
          filename: file.originalname
        }, 'warn');
        
        return res.status(400).json({
          success: false,
          message: 'Geçersiz dosya adı'
        });
      }

      file.originalname = sanitizedFilename;
    }

    next();
  } catch (error) {
    logger.error(`File upload security middleware error: ${error.message}`);
    next(error);
  }
};

/**
 * Güvenlik olaylarını loglama middleware'i
 */
const securityLogging = (req, res, next) => {
  try {
    // Response'u yakala
    const originalSend = res.send;
    res.send = function(data) {
      // Güvenlik olaylarını logla
      if (res.statusCode >= 400) {
        SecurityService.logSecurityEvent('HTTP_ERROR', req.user?.id, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          response: typeof data === 'string' ? data.substring(0, 200) : data
        }, res.statusCode >= 500 ? 'error' : 'warn');
      }

      originalSend.call(this, data);
    };

    next();
  } catch (error) {
    logger.error(`Security logging middleware error: ${error.message}`);
    next();
  }
};

/**
 * Güvenlik taraması middleware'i
 */
const securityScan = (req, res, next) => {
  try {
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /<link[^>]*>.*?<\/link>/gi,
      /<meta[^>]*>.*?<\/meta>/gi,
      /<style[^>]*>.*?<\/style>/gi
    ];

    const checkContent = (content) => {
      if (typeof content === 'string') {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(content)) {
            return true;
          }
        }
      } else if (typeof content === 'object' && content !== null) {
        for (const value of Object.values(content)) {
          if (checkContent(value)) {
            return true;
          }
        }
      }
      return false;
    };

    const suspiciousContent = checkContent(req.body) || checkContent(req.query) || checkContent(req.params);

    if (suspiciousContent) {
      SecurityService.logSecurityEvent('SUSPICIOUS_CONTENT_DETECTED', req.user?.id, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method,
        body: JSON.stringify(req.body).substring(0, 500),
        query: JSON.stringify(req.query).substring(0, 500)
      }, 'warn');
      
      return res.status(400).json({
        success: false,
        message: 'Şüpheli içerik tespit edildi'
      });
    }

    next();
  } catch (error) {
    logger.error(`Security scan middleware error: ${error.message}`);
    next();
  }
};

module.exports = {
  xssProtection,
  sqlInjectionProtection,
  rateLimit,
  csrfProtection,
  securityHeaders,
  ipWhitelist,
  fileUploadSecurity,
  securityLogging,
  securityScan
};
