const express = require("express");
const router = express.Router();
const SecurityService = require("../services/securityService");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const logger = require("../config/logger");

// Tüm route'lar için auth middleware
router.use(auth);

/**
 * @route POST /api/security/sanitize-text
 * @desc Metni XSS saldırılarına karşı temizler
 * @access Private
 */
router.post("/sanitize-text", async (req, res) => {
  try {
    const { text, options = {} } = req.body;

    if (typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: "text string olmalı"
      });
    }

    const sanitizedText = SecurityService.sanitizeText(text, options);
    
    res.json({
      success: true,
      message: "Metin başarıyla temizlendi",
      originalText: text,
      sanitizedText
    });
  } catch (error) {
    logger.error(`Error sanitizing text: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Metin temizlenirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/security/sanitize-html
 * @desc HTML içeriğini güvenli hale getirir
 * @access Private
 */
router.post("/sanitize-html", async (req, res) => {
  try {
    const { html, options = {} } = req.body;

    if (typeof html !== 'string') {
      return res.status(400).json({
        success: false,
        message: "html string olmalı"
      });
    }

    const sanitizedHTML = SecurityService.sanitizeHTML(html, options);
    
    res.json({
      success: true,
      message: "HTML başarıyla temizlendi",
      originalHTML: html,
      sanitizedHTML
    });
  } catch (error) {
    logger.error(`Error sanitizing HTML: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "HTML temizlenirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/security/sanitize-object
 * @desc Obje içindeki tüm metinleri temizler
 * @access Private
 */
router.post("/sanitize-object", async (req, res) => {
  try {
    const { obj, options = {} } = req.body;

    if (typeof obj !== 'object' || obj === null) {
      return res.status(400).json({
        success: false,
        message: "obj object olmalı"
      });
    }

    const sanitizedObj = SecurityService.sanitizeObject(obj, options);
    
    res.json({
      success: true,
      message: "Obje başarıyla temizlendi",
      originalObj: obj,
      sanitizedObj
    });
  } catch (error) {
    logger.error(`Error sanitizing object: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Obje temizlenirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/security/validate-email
 * @desc E-posta adresini doğrular ve temizler
 * @access Private
 */
router.post("/validate-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: "email string olmalı"
      });
    }

    const sanitizedEmail = SecurityService.sanitizeEmail(email);
    
    res.json({
      success: true,
      message: sanitizedEmail ? "E-posta geçerli" : "E-posta geçersiz",
      originalEmail: email,
      sanitizedEmail,
      isValid: !!sanitizedEmail
    });
  } catch (error) {
    logger.error(`Error validating email: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "E-posta doğrulanırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/security/validate-url
 * @desc URL'yi doğrular ve temizler
 * @access Private
 */
router.post("/validate-url", async (req, res) => {
  try {
    const { url } = req.body;

    if (typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        message: "url string olmalı"
      });
    }

    const sanitizedURL = SecurityService.sanitizeURL(url);
    
    res.json({
      success: true,
      message: sanitizedURL ? "URL geçerli" : "URL geçersiz",
      originalURL: url,
      sanitizedURL,
      isValid: !!sanitizedURL
    });
  } catch (error) {
    logger.error(`Error validating URL: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "URL doğrulanırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/security/validate-phone
 * @desc Telefon numarasını doğrular ve temizler
 * @access Private
 */
router.post("/validate-phone", async (req, res) => {
  try {
    const { phone } = req.body;

    if (typeof phone !== 'string') {
      return res.status(400).json({
        success: false,
        message: "phone string olmalı"
      });
    }

    const sanitizedPhone = SecurityService.sanitizePhone(phone);
    
    res.json({
      success: true,
      message: sanitizedPhone ? "Telefon numarası geçerli" : "Telefon numarası geçersiz",
      originalPhone: phone,
      sanitizedPhone,
      isValid: !!sanitizedPhone
    });
  } catch (error) {
    logger.error(`Error validating phone: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Telefon numarası doğrulanırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/security/validate-filename
 * @desc Dosya adını güvenli hale getirir
 * @access Private
 */
router.post("/validate-filename", async (req, res) => {
  try {
    const { filename } = req.body;

    if (typeof filename !== 'string') {
      return res.status(400).json({
        success: false,
        message: "filename string olmalı"
      });
    }

    const sanitizedFilename = SecurityService.sanitizeFilename(filename);
    
    res.json({
      success: true,
      message: sanitizedFilename ? "Dosya adı güvenli" : "Dosya adı güvenli değil",
      originalFilename: filename,
      sanitizedFilename,
      isValid: !!sanitizedFilename
    });
  } catch (error) {
    logger.error(`Error validating filename: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Dosya adı doğrulanırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/security/generate-csrf-token
 * @desc CSRF token oluşturur
 * @access Private
 */
router.post("/generate-csrf-token", async (req, res) => {
  try {
    const userId = req.user.id;
    const token = SecurityService.generateCSRFToken(userId);
    
    if (!token) {
      return res.status(500).json({
        success: false,
        message: "CSRF token oluşturulamadı"
      });
    }
    
    res.json({
      success: true,
      message: "CSRF token oluşturuldu",
      token
    });
  } catch (error) {
    logger.error(`Error generating CSRF token: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "CSRF token oluşturulurken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/security/validate-csrf-token
 * @desc CSRF token'ı doğrular
 * @access Private
 */
router.post("/validate-csrf-token", async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "token gerekli"
      });
    }

    const isValid = SecurityService.validateCSRFToken(token, userId);
    
    res.json({
      success: true,
      message: isValid ? "CSRF token geçerli" : "CSRF token geçersiz",
      isValid
    });
  } catch (error) {
    logger.error(`Error validating CSRF token: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "CSRF token doğrulanırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/security/validate-password
 * @desc Şifre güçlülüğünü kontrol eder
 * @access Private
 */
router.post("/validate-password", async (req, res) => {
  try {
    const { password } = req.body;

    if (typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: "password string olmalı"
      });
    }

    const validation = SecurityService.validatePasswordStrength(password);
    
    res.json({
      success: true,
      validation
    });
  } catch (error) {
    logger.error(`Error validating password: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Şifre doğrulanırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/security/generate-password
 * @desc Güvenli şifre oluşturur
 * @access Private
 */
router.post("/generate-password", async (req, res) => {
  try {
    const { length = 12 } = req.body;

    if (typeof length !== 'number' || length < 8 || length > 128) {
      return res.status(400).json({
        success: false,
        message: "length 8-128 arasında bir sayı olmalı"
      });
    }

    const password = SecurityService.generateSecurePassword(length);
    
    if (!password) {
      return res.status(500).json({
        success: false,
        message: "Şifre oluşturulamadı"
      });
    }
    
    res.json({
      success: true,
      message: "Güvenli şifre oluşturuldu",
      password,
      length
    });
  } catch (error) {
    logger.error(`Error generating password: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Şifre oluşturulurken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/security/create-hash
 * @desc Güvenli hash oluşturur
 * @access Private
 */
router.post("/create-hash", async (req, res) => {
  try {
    const { input, salt } = req.body;

    if (typeof input !== 'string') {
      return res.status(400).json({
        success: false,
        message: "input string olmalı"
      });
    }

    const hashResult = SecurityService.createSecureHash(input, salt);
    
    if (!hashResult) {
      return res.status(500).json({
        success: false,
        message: "Hash oluşturulamadı"
      });
    }
    
    res.json({
      success: true,
      message: "Hash başarıyla oluşturuldu",
      hash: hashResult.hash,
      salt: hashResult.salt
    });
  } catch (error) {
    logger.error(`Error creating hash: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Hash oluşturulurken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/security/verify-hash
 * @desc Hash'i doğrular
 * @access Private
 */
router.post("/verify-hash", async (req, res) => {
  try {
    const { input, hash, salt } = req.body;

    if (typeof input !== 'string' || typeof hash !== 'string' || typeof salt !== 'string') {
      return res.status(400).json({
        success: false,
        message: "input, hash ve salt string olmalı"
      });
    }

    const isValid = SecurityService.verifyHash(input, hash, salt);
    
    res.json({
      success: true,
      message: isValid ? "Hash doğrulandı" : "Hash doğrulanamadı",
      isValid
    });
  } catch (error) {
    logger.error(`Error verifying hash: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Hash doğrulanırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/security/log-event
 * @desc Güvenlik olayı loglar
 * @access Private (Admin only)
 */
router.post("/log-event", admin, async (req, res) => {
  try {
    const { event, userId, details = {}, severity = 'info' } = req.body;

    if (!event) {
      return res.status(400).json({
        success: false,
        message: "event gerekli"
      });
    }

    SecurityService.logSecurityEvent(event, userId, details, severity);
    
    res.json({
      success: true,
      message: "Güvenlik olayı loglandı"
    });
  } catch (error) {
    logger.error(`Error logging security event: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Güvenlik olayı loglanırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/security/check-rate-limit
 * @desc Rate limiting kontrolü yapar
 * @access Private
 */
router.get("/check-rate-limit", async (req, res) => {
  try {
    const { maxRequests = 100, windowMs = 900000 } = req.query;
    const identifier = req.user.id;
    
    const allowed = await SecurityService.checkRateLimit(
      identifier, 
      parseInt(maxRequests), 
      parseInt(windowMs)
    );
    
    res.json({
      success: true,
      allowed,
      maxRequests: parseInt(maxRequests),
      windowMs: parseInt(windowMs)
    });
  } catch (error) {
    logger.error(`Error checking rate limit: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Rate limit kontrolü yapılırken hata oluştu",
      error: error.message
    });
  }
});

module.exports = router;
