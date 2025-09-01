const Joi = require("joi");
const logger = require("../config/logger");

// Validation middleware factory
const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Tüm hataları göster
      stripUnknown: true, // Bilinmeyen alanları kaldır
      convert: true, // Tip dönüşümlerini yap
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context?.value,
      }));

      logger.warn("Validation error:", {
        errors,
        url: req.url,
        method: req.method,
        ip: req.ip,
      });

      return res.status(400).json({
        success: false,
        message: "Veri doğrulama hatası",
        errors,
      });
    }

    // Doğrulanmış veriyi req'e ekle
    req[property] = value;
    next();
  };
};

// Validation schemas
const schemas = {
  // Auth schemas
  register: Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
      "string.min": "Ad en az 2 karakter olmalıdır",
      "string.max": "Ad en fazla 50 karakter olabilir",
      "any.required": "Ad alanı zorunludur",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Geçerli bir e-posta adresi giriniz",
      "any.required": "E-posta alanı zorunludur",
    }),
    password: Joi.string().min(6).max(100).required().messages({
      "string.min": "Şifre en az 6 karakter olmalıdır",
      "string.max": "Şifre en fazla 100 karakter olabilir",
      "any.required": "Şifre alanı zorunludur",
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Geçerli bir e-posta adresi giriniz",
      "any.required": "E-posta alanı zorunludur",
    }),
    password: Joi.string().required().messages({
      "any.required": "Şifre alanı zorunludur",
    }),
  }),

  // User profile schemas
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50).optional().messages({
      "string.min": "Ad en az 2 karakter olmalıdır",
      "string.max": "Ad en fazla 50 karakter olabilir",
    }),
    position: Joi.string().max(100).optional().allow("").messages({
      "string.max": "Pozisyon en fazla 100 karakter olabilir",
    }),
    department: Joi.string().max(100).optional().allow("").messages({
      "string.max": "Departman en fazla 100 karakter olabilir",
    }),
    company: Joi.string().max(100).optional().allow("").messages({
      "string.max": "Şirket adı en fazla 100 karakter olabilir",
    }),
    phone: Joi.string().max(20).optional().allow("").messages({
      "string.max": "Telefon numarası en fazla 20 karakter olabilir",
    }),
    address: Joi.string().max(500).optional().allow("").messages({
      "string.max": "Adres en fazla 500 karakter olabilir",
    }),
    bio: Joi.string().max(1000).optional().allow("").messages({
      "string.max": "Hakkımda en fazla 1000 karakter olabilir",
    }),
    profileImageUrl: Joi.string().uri().optional().allow("").messages({
      "string.uri": "Geçerli bir URL giriniz",
    }),
  }),

  // Proposal schemas
  createProposal: Joi.object({
    customerName: Joi.string().min(2).max(100).required().messages({
      "string.min": "Müşteri adı en az 2 karakter olmalıdır",
      "string.max": "Müşteri adı en fazla 100 karakter olabilir",
      "any.required": "Müşteri adı zorunludur",
    }),
    items: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().min(1).max(200).required().messages({
            "string.min": "Malzeme adı boş olamaz",
            "string.max": "Malzeme adı en fazla 200 karakter olabilir",
            "any.required": "Malzeme adı zorunludur",
          }),
          quantity: Joi.number().min(1).max(10000).required().messages({
            "number.min": "Miktar en az 1 olmalıdır",
            "number.max": "Miktar en fazla 10000 olabilir",
            "any.required": "Miktar zorunludur",
          }),
          unitPrice: Joi.number().min(0).max(1000000).required().messages({
            "number.min": "Birim fiyat 0'dan küçük olamaz",
            "number.max": "Birim fiyat çok yüksek",
            "any.required": "Birim fiyat zorunludur",
          }),
        })
      )
      .min(1)
      .required()
      .messages({
        "array.min": "En az bir malzeme eklenmelidir",
        "any.required": "Malzeme listesi zorunludur",
      }),
    vatRate: Joi.number().min(0).max(100).default(0).messages({
      "number.min": "KDV oranı 0'dan küçük olamaz",
      "number.max": "KDV oranı 100'den büyük olamaz",
    }),
    discountRate: Joi.number().min(0).max(100).default(0).messages({
      "number.min": "İskonto oranı 0'dan küçük olamaz",
      "number.max": "İskonto oranı 100'den büyük olamaz",
    }),
    extraCosts: Joi.number().min(0).max(1000000).default(0).messages({
      "number.min": "Ek maliyetler 0'dan küçük olamaz",
      "number.max": "Ek maliyetler çok yüksek",
    }),
    status: Joi.string()
      .valid("draft", "sent", "approved", "rejected")
      .default("draft")
      .messages({
        "any.only": "Geçersiz durum değeri",
      }),
  }),

  updateProposal: Joi.object({
    customerName: Joi.string().min(2).max(100).optional().messages({
      "string.min": "Müşteri adı en az 2 karakter olmalıdır",
      "string.max": "Müşteri adı en fazla 100 karakter olabilir",
    }),
    items: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().min(1).max(200).required().messages({
            "string.min": "Malzeme adı boş olamaz",
            "string.max": "Malzeme adı en fazla 200 karakter olabilir",
            "any.required": "Malzeme adı zorunludur",
          }),
          quantity: Joi.number().min(1).max(10000).required().messages({
            "number.min": "Miktar en az 1 olmalıdır",
            "number.max": "Miktar en fazla 10000 olabilir",
            "any.required": "Miktar zorunludur",
          }),
          unitPrice: Joi.number().min(0).max(1000000).required().messages({
            "number.min": "Birim fiyat 0'dan küçük olamaz",
            "number.max": "Birim fiyat çok yüksek",
            "any.required": "Birim fiyat zorunludur",
          }),
        })
      )
      .min(1)
      .optional()
      .messages({
        "array.min": "En az bir malzeme eklenmelidir",
      }),
    vatRate: Joi.number().min(0).max(100).optional().messages({
      "number.min": "KDV oranı 0'dan küçük olamaz",
      "number.max": "KDV oranı 100'den büyük olamaz",
    }),
    discountRate: Joi.number().min(0).max(100).optional().messages({
      "number.min": "İskonto oranı 0'dan küçük olamaz",
      "number.max": "İskonto oranı 100'den büyük olamaz",
    }),
    extraCosts: Joi.number().min(0).max(1000000).optional().messages({
      "number.min": "Ek maliyetler 0'dan küçük olamaz",
      "number.max": "Ek maliyetler çok yüksek",
    }),
    status: Joi.string()
      .valid("draft", "sent", "approved", "rejected")
      .optional()
      .messages({
        "any.only": "Geçersiz durum değeri",
      }),
  }),

  updateProposalStatus: Joi.object({
    status: Joi.string()
      .valid("draft", "sent", "approved", "rejected")
      .required()
      .messages({
        "any.only": "Geçersiz durum değeri",
        "any.required": "Durum alanı zorunludur",
      }),
  }),

  // Query parameters
  proposalQuery: Joi.object({
    q: Joi.string().max(100).optional().messages({
      "string.max": "Arama terimi çok uzun",
    }),
    status: Joi.string()
      .valid("draft", "sent", "approved", "rejected")
      .optional()
      .messages({
        "any.only": "Geçersiz durum filtresi",
      }),
    page: Joi.number().min(1).max(1000).default(1).messages({
      "number.min": "Sayfa numarası 1'den küçük olamaz",
      "number.max": "Sayfa numarası çok büyük",
    }),
    limit: Joi.number().min(1).max(100).default(20).messages({
      "number.min": "Limit 1'den küçük olamaz",
      "number.max": "Limit çok büyük",
    }),
  }),

  // Product schemas
  createProduct: Joi.object({
    name: Joi.string().min(1).max(200).required().messages({
      "string.min": "Ürün adı boş olamaz",
      "string.max": "Ürün adı en fazla 200 karakter olabilir",
      "any.required": "Ürün adı zorunludur",
    }),
    unit: Joi.string()
      .valid("adet", "kg", "m", "m²", "m³", "lt", "paket", "set")
      .default("adet")
      .messages({
        "any.only": "Geçersiz birim değeri",
      }),
    unitPrice: Joi.number().min(0).max(1000000).required().messages({
      "number.min": "Birim fiyat 0'dan küçük olamaz",
      "number.max": "Birim fiyat çok yüksek",
      "any.required": "Birim fiyat zorunludur",
    }),
    category: Joi.string().max(100).optional().allow("").messages({
      "string.max": "Kategori en fazla 100 karakter olabilir",
    }),
    description: Joi.string().max(1000).optional().allow("").messages({
      "string.max": "Açıklama en fazla 1000 karakter olabilir",
    }),
  }),

  updateProduct: Joi.object({
    name: Joi.string().min(1).max(200).optional().messages({
      "string.min": "Ürün adı boş olamaz",
      "string.max": "Ürün adı en fazla 200 karakter olabilir",
    }),
    unit: Joi.string()
      .valid("adet", "kg", "m", "m²", "m³", "lt", "paket", "set")
      .optional()
      .messages({
        "any.only": "Geçersiz birim değeri",
      }),
    unitPrice: Joi.number().min(0).max(1000000).optional().messages({
      "number.min": "Birim fiyat 0'dan küçük olamaz",
      "number.max": "Birim fiyat çok yüksek",
    }),
    category: Joi.string().max(100).optional().allow("").messages({
      "string.max": "Kategori en fazla 100 karakter olabilir",
    }),
    description: Joi.string().max(1000).optional().allow("").messages({
      "string.max": "Açıklama en fazla 1000 karakter olabilir",
    }),
    isActive: Joi.boolean().optional(),
  }),

  productQuery: Joi.object({
    q: Joi.string().max(100).optional().messages({
      "string.max": "Arama terimi çok uzun",
    }),
    category: Joi.string().max(100).optional().messages({
      "string.max": "Kategori filtresi çok uzun",
    }),
    isActive: Joi.boolean().optional(),
    page: Joi.number().min(1).max(1000).default(1).messages({
      "number.min": "Sayfa numarası 1'den küçük olamaz",
      "number.max": "Sayfa numarası çok büyük",
    }),
    limit: Joi.number().min(1).max(100).default(20).messages({
      "number.min": "Limit 1'den küçük olamaz",
      "number.max": "Limit çok büyük",
    }),
  }),
};

module.exports = {
  validate,
  schemas,
};
