const DOMPurify = require("isomorphic-dompurify");
const validator = require("validator");
const logger = require("../config/logger");

class SecurityService {
  /**
   * Metni XSS saldırılarına karşı temizler
   * @param {string} text - Temizlenecek metin
   * @param {Object} options - Temizleme seçenekleri
   */
  static sanitizeText(text, options = {}) {
    try {
      if (typeof text !== "string") {
        return text;
      }

      const defaultOptions = {
        ALLOWED_TAGS: [
          "b",
          "i",
          "em",
          "strong",
          "p",
          "br",
          "ul",
          "ol",
          "li",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
        ],
        ALLOWED_ATTR: ["class", "id"],
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        RETURN_DOM_IMPORT: false,
      };

      const sanitizeOptions = { ...defaultOptions, ...options };
      return DOMPurify.sanitize(text, sanitizeOptions);
    } catch (error) {
      logger.error(`Error sanitizing text: ${error.message}`);
      return text;
    }
  }

  /**
   * HTML içeriğini güvenli hale getirir
   * @param {string} html - Temizlenecek HTML
   * @param {Object} options - Temizleme seçenekleri
   */
  static sanitizeHTML(html, options = {}) {
    try {
      if (typeof html !== "string") {
        return html;
      }

      const defaultOptions = {
        ALLOWED_TAGS: [
          "p",
          "br",
          "strong",
          "em",
          "u",
          "s",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "ul",
          "ol",
          "li",
          "blockquote",
          "pre",
          "code",
          "a",
          "img",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
          "div",
          "span",
        ],
        ALLOWED_ATTR: [
          "class",
          "id",
          "href",
          "src",
          "alt",
          "title",
          "width",
          "height",
          "colspan",
          "rowspan",
          "align",
          "valign",
        ],
        ALLOWED_URI_REGEXP:
          /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        RETURN_DOM_IMPORT: false,
      };

      const sanitizeOptions = { ...defaultOptions, ...options };
      return DOMPurify.sanitize(html, sanitizeOptions);
    } catch (error) {
      logger.error(`Error sanitizing HTML: ${error.message}`);
      return html;
    }
  }

  /**
   * Obje içindeki tüm metinleri temizler
   * @param {Object} obj - Temizlenecek obje
   * @param {Object} options - Temizleme seçenekleri
   */
  static sanitizeObject(obj, options = {}) {
    try {
      if (typeof obj !== "object" || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map((item) => this.sanitizeObject(item, options));
      }

      const sanitizedObj = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
          sanitizedObj[key] = this.sanitizeText(value, options);
        } else if (typeof value === "object" && value !== null) {
          sanitizedObj[key] = this.sanitizeObject(value, options);
        } else {
          sanitizedObj[key] = value;
        }
      }

      return sanitizedObj;
    } catch (error) {
      logger.error(`Error sanitizing object: ${error.message}`);
      return obj;
    }
  }

  /**
   * E-posta adresini doğrular ve temizler
   * @param {string} email - E-posta adresi
   */
  static sanitizeEmail(email) {
    try {
      if (typeof email !== "string") {
        return null;
      }

      const trimmedEmail = email.trim().toLowerCase();

      if (!validator.isEmail(trimmedEmail)) {
        return null;
      }

      return trimmedEmail;
    } catch (error) {
      logger.error(`Error sanitizing email: ${error.message}`);
      return null;
    }
  }

  /**
   * URL'yi doğrular ve temizler
   * @param {string} url - URL
   */
  static sanitizeURL(url) {
    try {
      if (typeof url !== "string") {
        return null;
      }

      const trimmedURL = url.trim();

      if (
        !validator.isURL(trimmedURL, {
          protocols: ["http", "https", "ftp"],
          require_protocol: true,
        })
      ) {
        return null;
      }

      return trimmedURL;
    } catch (error) {
      logger.error(`Error sanitizing URL: ${error.message}`);
      return null;
    }
  }

  /**
   * Telefon numarasını doğrular ve temizler
   * @param {string} phone - Telefon numarası
   */
  static sanitizePhone(phone) {
    try {
      if (typeof phone !== "string") {
        return null;
      }

      // Sadece rakam, +, -, (, ), boşluk karakterlerini tut
      const cleanedPhone = phone.replace(/[^\d+\-()\s]/g, "");

      if (cleanedPhone.length < 10) {
        return null;
      }

      return cleanedPhone;
    } catch (error) {
      logger.error(`Error sanitizing phone: ${error.message}`);
      return null;
    }
  }

  /**
   * Dosya adını güvenli hale getirir
   * @param {string} filename - Dosya adı
   */
  static sanitizeFilename(filename) {
    try {
      if (typeof filename !== "string") {
        return null;
      }

      // Tehlikeli karakterleri kaldır
      const sanitized = filename
        .replace(/[<>:"/\\|?*]/g, "")
        .replace(/\.\./g, "")
        .replace(/^\./, "")
        .trim();

      if (sanitized.length === 0) {
        return null;
      }

      return sanitized;
    } catch (error) {
      logger.error(`Error sanitizing filename: ${error.message}`);
      return null;
    }
  }

  /**
   * SQL injection saldırılarını önler
   * @param {string} input - Giriş metni
   */
  static preventSQLInjection(input) {
    try {
      if (typeof input !== "string") {
        return input;
      }

      // Tehlikeli SQL karakterlerini temizle
      const dangerousChars = [
        "'",
        '"',
        ";",
        "--",
        "xp_",
        "sp_",
        "exec",
        "execute",
        "select",
        "insert",
        "update",
        "delete",
        "drop",
        "create",
        "alter",
        "union",
      ];

      let sanitized = input;
      dangerousChars.forEach((char) => {
        // Özel karakterleri escape et
        const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escapedChar, "gi");
        sanitized = sanitized.replace(regex, "");
      });

      // Çoklu yorum karakterlerini ayrı olarak temizle
      sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, "");
      sanitized = sanitized.replace(/--.*$/gm, "");

      return sanitized;
    } catch (error) {
      logger.error(`Error preventing SQL injection: ${error.message}`);
      return input;
    }
  }

  /**
   * NoSQL injection saldırılarını önler
   * @param {Object} query - MongoDB sorgusu
   */
  static preventNoSQLInjection(query) {
    try {
      if (typeof query !== "object" || query === null) {
        return query;
      }

      const sanitizedQuery = {};

      for (const [key, value] of Object.entries(query)) {
        if (typeof value === "string") {
          // $where, $regex gibi tehlikeli operatörleri kontrol et
          if (
            key.startsWith("$") &&
            ![
              "$eq",
              "$ne",
              "$gt",
              "$gte",
              "$lt",
              "$lte",
              "$in",
              "$nin",
              "$exists",
              "$regex",
            ].includes(key)
          ) {
            continue;
          }
          sanitizedQuery[key] = this.preventSQLInjection(value);
        } else if (typeof value === "object" && value !== null) {
          sanitizedQuery[key] = this.preventNoSQLInjection(value);
        } else {
          sanitizedQuery[key] = value;
        }
      }

      return sanitizedQuery;
    } catch (error) {
      logger.error(`Error preventing NoSQL injection: ${error.message}`);
      return query;
    }
  }

  /**
   * CSRF token oluşturur
   * @param {string} userId - Kullanıcı ID'si
   */
  static generateCSRFToken(userId) {
    try {
      const crypto = require("crypto");
      const secret = process.env.CSRF_SECRET || "default-secret";
      const timestamp = Date.now().toString();
      const data = `${userId}:${timestamp}:${secret}`;

      const token = crypto.createHash("sha256").update(data).digest("hex");
      return `${token}:${timestamp}`;
    } catch (error) {
      logger.error(`Error generating CSRF token: ${error.message}`);
      return null;
    }
  }

  /**
   * CSRF token'ı doğrular
   * @param {string} token - CSRF token
   * @param {string} userId - Kullanıcı ID'si
   * @param {number} maxAge - Maksimum yaş (milisaniye)
   */
  static validateCSRFToken(token, userId, maxAge = 3600000) {
    // 1 saat
    try {
      if (!token || !userId) {
        return false;
      }

      const parts = token.split(":");
      if (parts.length !== 2) {
        return false;
      }

      const [tokenHash, timestamp] = parts;
      const tokenAge = Date.now() - parseInt(timestamp);

      if (tokenAge > maxAge) {
        return false;
      }

      const expectedToken = this.generateCSRFToken(userId);
      return token === expectedToken;
    } catch (error) {
      logger.error(`Error validating CSRF token: ${error.message}`);
      return false;
    }
  }

  /**
   * Rate limiting kontrolü yapar
   * @param {string} identifier - Kullanıcı tanımlayıcısı
   * @param {number} maxRequests - Maksimum istek sayısı
   * @param {number} windowMs - Zaman penceresi (milisaniye)
   */
  static async checkRateLimit(
    identifier,
    maxRequests = 100,
    windowMs = 900000
  ) {
    // 15 dakika
    try {
      // Burada Redis veya başka bir cache sistemi kullanılabilir
      // Şimdilik basit bir in-memory cache kullanıyoruz
      if (!this.rateLimitCache) {
        this.rateLimitCache = new Map();
      }

      const now = Date.now();
      const key = `${identifier}:${Math.floor(now / windowMs)}`;

      const currentCount = this.rateLimitCache.get(key) || 0;

      if (currentCount >= maxRequests) {
        return false;
      }

      this.rateLimitCache.set(key, currentCount + 1);

      // Eski kayıtları temizle
      this.cleanupRateLimitCache(now, windowMs);

      return true;
    } catch (error) {
      logger.error(`Error checking rate limit: ${error.message}`);
      return true; // Hata durumunda izin ver
    }
  }

  /**
   * Rate limit cache'ini temizler
   * @param {number} now - Şu anki zaman
   * @param {number} windowMs - Zaman penceresi
   */
  static cleanupRateLimitCache(now, windowMs) {
    try {
      const cutoff = now - windowMs;

      for (const [key, value] of this.rateLimitCache.entries()) {
        const keyTime = parseInt(key.split(":")[1]) * windowMs;
        if (keyTime < cutoff) {
          this.rateLimitCache.delete(key);
        }
      }
    } catch (error) {
      logger.error(`Error cleaning up rate limit cache: ${error.message}`);
    }
  }

  /**
   * Güvenli şifre oluşturur
   * @param {number} length - Şifre uzunluğu
   */
  static generateSecurePassword(length = 12) {
    try {
      const crypto = require("crypto");
      const charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      let password = "";

      for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, charset.length);
        password += charset[randomIndex];
      }

      return password;
    } catch (error) {
      logger.error(`Error generating secure password: ${error.message}`);
      return null;
    }
  }

  /**
   * Şifre güçlülüğünü kontrol eder
   * @param {string} password - Şifre
   */
  static validatePasswordStrength(password) {
    try {
      if (typeof password !== "string") {
        return { valid: false, message: "Şifre metin olmalı" };
      }

      if (password.length < 8) {
        return { valid: false, message: "Şifre en az 8 karakter olmalı" };
      }

      if (password.length > 128) {
        return {
          valid: false,
          message: "Şifre en fazla 128 karakter olabilir",
        };
      }

      if (!/[a-z]/.test(password)) {
        return { valid: false, message: "Şifre en az bir küçük harf içermeli" };
      }

      if (!/[A-Z]/.test(password)) {
        return { valid: false, message: "Şifre en az bir büyük harf içermeli" };
      }

      if (!/[0-9]/.test(password)) {
        return { valid: false, message: "Şifre en az bir rakam içermeli" };
      }

      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return {
          valid: false,
          message: "Şifre en az bir özel karakter içermeli",
        };
      }

      return { valid: true, message: "Şifre güçlü" };
    } catch (error) {
      logger.error(`Error validating password strength: ${error.message}`);
      return { valid: false, message: "Şifre kontrol edilemedi" };
    }
  }

  /**
   * Güvenli hash oluşturur
   * @param {string} input - Hash'lenecek metin
   * @param {string} salt - Tuz
   */
  static createSecureHash(input, salt = null) {
    try {
      const crypto = require("crypto");

      if (!salt) {
        salt = crypto.randomBytes(32).toString("hex");
      }

      const hash = crypto.pbkdf2Sync(input, salt, 100000, 64, "sha512");
      return {
        hash: hash.toString("hex"),
        salt: salt,
      };
    } catch (error) {
      logger.error(`Error creating secure hash: ${error.message}`);
      return null;
    }
  }

  /**
   * Hash'i doğrular
   * @param {string} input - Giriş metni
   * @param {string} hash - Hash
   * @param {string} salt - Tuz
   */
  static verifyHash(input, hash, salt) {
    try {
      const crypto = require("crypto");
      const inputHash = crypto.pbkdf2Sync(input, salt, 100000, 64, "sha512");
      return inputHash.toString("hex") === hash;
    } catch (error) {
      logger.error(`Error verifying hash: ${error.message}`);
      return false;
    }
  }

  /**
   * Güvenlik logu oluşturur
   * @param {string} event - Olay
   * @param {string} userId - Kullanıcı ID'si
   * @param {Object} details - Detaylar
   * @param {string} severity - Önem derecesi
   */
  static logSecurityEvent(event, userId, details = {}, severity = "info") {
    try {
      const logEntry = {
        timestamp: new Date(),
        event,
        userId,
        details,
        severity,
        ip: details.ip || "unknown",
        userAgent: details.userAgent || "unknown",
      };

      logger[severity](`Security Event: ${event}`, logEntry);
    } catch (error) {
      logger.error(`Error logging security event: ${error.message}`);
    }
  }
}

module.exports = SecurityService;
