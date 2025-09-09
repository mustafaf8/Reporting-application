const Joi = require("joi");
const logger = require("../config/logger");

// Blok şeması validasyonu
const blockSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string()
    .valid(
      "text",
      "heading",
      "image",
      "table",
      "spacer",
      "divider",
      "customer",
      "company",
      "pricing",
      "signature"
    )
    .required(),
  content: Joi.object().default({}),
  styles: Joi.object().default({}),
  position: Joi.object().default({}),
  metadata: Joi.object().default({}),
  order: Joi.number().default(0),
});

// Global stil şeması validasyonu
const globalStylesSchema = Joi.object({
  primaryColor: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .default("#4f46e5"),
  secondaryColor: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .default("#7c3aed"),
  fontFamily: Joi.string().default("Inter, sans-serif"),
  fontSize: Joi.number().min(8).max(72).default(16),
  lineHeight: Joi.number().min(0.5).max(3).default(1.5),
  backgroundColor: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .default("#ffffff"),
  textColor: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .default("#1f2937"),
  borderRadius: Joi.number().min(0).max(50).default(8),
  spacing: Joi.number().min(0).max(100).default(16),
});

// Canvas boyut şeması validasyonu
const canvasSizeSchema = Joi.object({
  width: Joi.number().min(100).max(2000).default(800),
  height: Joi.number().min(100).max(3000).default(1000),
  unit: Joi.string().valid("px", "mm", "cm", "in").default("px"),
});

// Şablon oluşturma validasyonu
const createTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).default(""),
  category: Joi.string().max(50).default("custom"),
  blocks: Joi.array().items(blockSchema).default([]),
  globalStyles: globalStylesSchema.default({}),
  canvasSize: canvasSizeSchema.default({}),
  tags: Joi.array().items(Joi.string().max(30)).max(10).default([]),
  status: Joi.string().valid("draft", "published", "archived").default("draft"),
});

// Şablon güncelleme validasyonu
const updateTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  description: Joi.string().max(500),
  category: Joi.string().max(50),
  blocks: Joi.array().items(blockSchema),
  globalStyles: globalStylesSchema,
  canvasSize: canvasSizeSchema,
  tags: Joi.array().items(Joi.string().max(30)).max(10),
  status: Joi.string().valid("draft", "published", "archived"),
}).min(1); // En az bir alan güncellenmeli

// Blok ekleme validasyonu
const addBlockSchema = Joi.object({
  block: blockSchema.required(),
  position: Joi.number().integer().min(0),
});

// Blok güncelleme validasyonu
const updateBlockSchema = Joi.object({
  updates: Joi.object({
    content: Joi.object(),
    styles: Joi.object(),
    position: Joi.object(),
    metadata: Joi.object(),
    order: Joi.number().integer(),
  })
    .min(1)
    .required(),
});

// Blok sıralama validasyonu
const reorderBlocksSchema = Joi.object({
  fromIndex: Joi.number().integer().min(0).required(),
  toIndex: Joi.number().integer().min(0).required(),
});

// Toplu işlem validasyonu
const bulkOperationsSchema = Joi.object({
  operations: Joi.array()
    .items(
      Joi.object({
        type: Joi.string()
          .valid("add", "update", "remove", "reorder")
          .required(),
        block: blockSchema.when("type", { is: "add", then: Joi.required() }),
        blockId: Joi.string().when("type", {
          is: Joi.valid("update", "remove"),
          then: Joi.required(),
        }),
        updates: Joi.object().when("type", {
          is: "update",
          then: Joi.required(),
        }),
        position: Joi.number()
          .integer()
          .min(0)
          .when("type", { is: "add", then: Joi.optional() }),
        fromIndex: Joi.number()
          .integer()
          .min(0)
          .when("type", { is: "reorder", then: Joi.required() }),
        toIndex: Joi.number()
          .integer()
          .min(0)
          .when("type", { is: "reorder", then: Joi.required() }),
      })
    )
    .min(1)
    .max(50)
    .required(), // Maksimum 50 işlem
});

// Blok türüne özel validasyon fonksiyonları
const validateBlockByType = (block) => {
  const { type, content } = block;

  switch (type) {
    case "text":
      if (!content.text || typeof content.text !== "string") {
        throw new Error("Text bloğu için text alanı gerekli");
      }
      break;

    case "heading":
      if (!content.text || typeof content.text !== "string") {
        throw new Error("Heading bloğu için text alanı gerekli");
      }
      if (!content.level || content.level < 1 || content.level > 6) {
        throw new Error("Heading bloğu için geçerli level (1-6) gerekli");
      }
      break;

    case "image":
      if (!content.imageUrl || typeof content.imageUrl !== "string") {
        throw new Error("Image bloğu için imageUrl alanı gerekli");
      }
      break;

    case "table":
      if (!content.headers || !Array.isArray(content.headers)) {
        throw new Error("Table bloğu için headers array gerekli");
      }
      if (!content.rows || !Array.isArray(content.rows)) {
        throw new Error("Table bloğu için rows array gerekli");
      }
      break;

    case "customer":
      if (!content.name || typeof content.name !== "string") {
        throw new Error("Customer bloğu için name alanı gerekli");
      }
      break;

    case "company":
      if (!content.name || typeof content.name !== "string") {
        throw new Error("Company bloğu için name alanı gerekli");
      }
      break;

    case "pricing":
      if (!content.items || !Array.isArray(content.items)) {
        throw new Error("Pricing bloğu için items array gerekli");
      }
      break;

    case "spacer":
    case "divider":
      // Bu bloklar için özel içerik gerekmez
      break;

    default:
      throw new Error(`Bilinmeyen blok türü: ${type}`);
  }
};

// Ana validasyon middleware'i
const validateBlockEditorRequest = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        logger.warn("Block editor validation error", {
          errors: errorMessages,
          userId: req.user?.id,
          endpoint: req.path,
        });

        return res.error(`Validasyon hatası: ${errorMessages.join(", ")}`, 400);
      }

      // Blok validasyonu (eğer blocks varsa)
      if (value.blocks && Array.isArray(value.blocks)) {
        for (const block of value.blocks) {
          try {
            validateBlockByType(block);
          } catch (blockError) {
            logger.warn("Block type validation error", {
              error: blockError.message,
              blockType: block.type,
              blockId: block.id,
              userId: req.user?.id,
            });

            return res.error(
              `Blok validasyon hatası: ${blockError.message}`,
              400
            );
          }
        }
      }

      // Tek blok validasyonu (eğer block varsa)
      if (value.block) {
        try {
          validateBlockByType(value.block);
        } catch (blockError) {
          logger.warn("Single block validation error", {
            error: blockError.message,
            blockType: value.block.type,
            blockId: value.block.id,
            userId: req.user?.id,
          });

          return res.error(
            `Blok validasyon hatası: ${blockError.message}`,
            400
          );
        }
      }

      req.body = value;
      next();
    } catch (error) {
      logger.error("Block editor validation middleware error", {
        error: error.message,
        userId: req.user?.id,
        endpoint: req.path,
      });

      res.error("Validasyon işlemi sırasında hata oluştu", 500);
    }
  };
};

// XSS koruması için içerik temizleme
const sanitizeContent = (content) => {
  if (typeof content === "string") {
    // Basit XSS koruması - gerçek uygulamada daha güçlü bir kütüphane kullanılmalı
    return content
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  if (typeof content === "object" && content !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(content)) {
      sanitized[key] = sanitizeContent(value);
    }
    return sanitized;
  }

  if (Array.isArray(content)) {
    return content.map((item) => sanitizeContent(item));
  }

  return content;
};

// İçerik temizleme middleware'i
const sanitizeBlockEditorContent = (req, res, next) => {
  try {
    if (req.body.blocks && Array.isArray(req.body.blocks)) {
      req.body.blocks = req.body.blocks.map((block) => ({
        ...block,
        content: sanitizeContent(block.content),
      }));
    }

    if (req.body.block && req.body.block.content) {
      req.body.block.content = sanitizeContent(req.body.block.content);
    }

    next();
  } catch (error) {
    logger.error("Content sanitization error", {
      error: error.message,
      userId: req.user?.id,
    });

    res.error("İçerik temizleme sırasında hata oluştu", 500);
  }
};

module.exports = {
  validateBlockEditorRequest,
  createTemplateSchema,
  updateTemplateSchema,
  addBlockSchema,
  updateBlockSchema,
  reorderBlocksSchema,
  bulkOperationsSchema,
  sanitizeBlockEditorContent,
  validateBlockByType,
};
