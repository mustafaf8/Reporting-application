const express = require("express");
const router = express.Router();
const Template = require("../models/Template");
const auth = require("../middleware/auth");
const {
  validateBlockEditorRequest,
} = require("../middleware/blockEditorValidation");
const {
  requireCreateTemplate,
  requireTemplateAccess,
  requireAddBlock,
  addUserPermissions,
  addTemplatePermissions,
} = require("../middleware/authorization");
const blockEditorService = require("../services/blockEditorService");
const cacheService = require("../services/cacheService");
const versionControlService = require("../services/versionControlService");
const bulkOperationsService = require("../services/bulkOperationsService");
const logger = require("../config/logger");

// Blok editörü için şablon oluşturma
router.post(
  "/templates",
  auth,
  requireCreateTemplate,
  addUserPermissions,
  async (req, res) => {
    try {
      const {
        name,
        description,
        blocks = [],
        globalStyles = {},
        canvasSize = {},
        category = "custom",
        tags = [],
      } = req.body;

      const template = new Template({
        name,
        description,
        blocks,
        globalStyles,
        canvasSize,
        category,
        tags,
        owner: req.user.id,
        createdBy: req.user.id,
        updatedBy: req.user.id,
        isTemplate: false,
      });

      await template.save();

      logger.info("Block editor template created", {
        templateId: template._id,
        userId: req.user.id,
        blockCount: blocks.length,
      });

      res.success(
        {
          templateId: template._id,
          template: template,
        },
        "Şablon başarıyla oluşturuldu"
      );
    } catch (error) {
      logger.error("Error creating block editor template", {
        error: error.message,
        userId: req.user.id,
      });
      res.error("Şablon oluşturulurken hata oluştu", 500);
    }
  }
);

// Blok editörü şablonunu yükleme
router.get(
  "/templates/:id",
  auth,
  requireTemplateAccess("view"),
  addTemplatePermissions,
  async (req, res) => {
    try {
      const templateId = req.params.id;

      // Cache'den kontrol et
      let template = await cacheService.getCachedTemplate(templateId);

      if (!template) {
        // Cache'de yok, veritabanından yükle
        template = await Template.findById(templateId)
          .populate("owner", "name email")
          .populate("createdBy", "name email")
          .populate("updatedBy", "name email");

        if (!template) {
          return res.error("Şablon bulunamadı", 404);
        }

        // Cache'e kaydet
        await cacheService.cacheTemplate(templateId, template);
      }

      // Erişim kontrolü
      if (!template.hasAccess(req.user.id, "view")) {
        return res.error("Bu şablona erişim izniniz yok", 403);
      }

      // Kullanım sayısını artır (sadece veritabanındaki template için)
      if (template._id) {
        const dbTemplate = await Template.findById(templateId);
        if (dbTemplate) {
          dbTemplate.incrementUsage();
          await dbTemplate.save();
        }
      }

      res.success(
        {
          template: template,
        },
        "Şablon başarıyla yüklendi"
      );
    } catch (error) {
      logger.error("Error loading block editor template", {
        error: error.message,
        templateId: req.params.id,
        userId: req.user.id,
      });
      res.error("Şablon yüklenirken hata oluştu", 500);
    }
  }
);

// Blok editörü şablonunu güncelleme
router.put("/templates/:id", auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.error("Şablon bulunamadı", 404);
    }

    // Erişim kontrolü
    if (!template.hasAccess(req.user.id, "edit")) {
      return res.error("Bu şablonu düzenleme izniniz yok", 403);
    }

    const {
      name,
      description,
      blocks,
      globalStyles,
      canvasSize,
      category,
      tags,
      status,
    } = req.body;

    // Güncelleme
    if (name !== undefined) template.name = name;
    if (description !== undefined) template.description = description;
    if (blocks !== undefined) template.blocks = blocks;
    if (globalStyles !== undefined) template.globalStyles = globalStyles;
    if (canvasSize !== undefined) template.canvasSize = canvasSize;
    if (category !== undefined) template.category = category;
    if (tags !== undefined) template.tags = tags;
    if (status !== undefined) template.status = status;

    template.updatedBy = req.user.id;

    await template.save();

    // Cache'i temizle
    await cacheService.invalidateTemplate(template._id);
    await cacheService.invalidateTemplateList(req.user.id);

    logger.info("Block editor template updated", {
      templateId: template._id,
      userId: req.user.id,
      changes: Object.keys(req.body),
    });

    res.success(
      {
        template: template,
      },
      "Şablon başarıyla güncellendi"
    );
  } catch (error) {
    logger.error("Error updating block editor template", {
      error: error.message,
      templateId: req.params.id,
      userId: req.user.id,
    });
    res.error("Şablon güncellenirken hata oluştu", 500);
  }
});

// Blok editörü şablonunu silme
router.delete("/templates/:id", auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.error("Şablon bulunamadı", 404);
    }

    // Sadece sahip silebilir
    if (template.owner.toString() !== req.user.id) {
      return res.error("Bu şablonu silme izniniz yok", 403);
    }

    await Template.findByIdAndDelete(req.params.id);

    logger.info("Block editor template deleted", {
      templateId: req.params.id,
      userId: req.user.id,
    });

    res.success(null, "Şablon başarıyla silindi");
  } catch (error) {
    logger.error("Error deleting block editor template", {
      error: error.message,
      templateId: req.params.id,
      userId: req.user.id,
    });
    res.error("Şablon silinirken hata oluştu", 500);
  }
});

// Kullanıcının şablonlarını listeleme
router.get("/templates", auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      search,
      sortBy = "updatedAt",
      sortOrder = "desc",
    } = req.query;

    const query = {
      $or: [
        { owner: req.user.id },
        { "sharingPermissions.userId": req.user.id },
        { isPublic: true },
      ],
    };

    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$and = [
        {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { tags: { $in: [new RegExp(search, "i")] } },
          ],
        },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const templates = await Template.find(query)
      .populate("owner", "name email")
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-blocks -versionHistory"); // Büyük verileri hariç tut

    const total = await Template.countDocuments(query);

    res.success(
      {
        templates,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
      "Şablonlar başarıyla listelendi"
    );
  } catch (error) {
    logger.error("Error listing block editor templates", {
      error: error.message,
      userId: req.user.id,
    });
    res.error("Şablonlar listelenirken hata oluştu", 500);
  }
});

// Blok ekleme
router.post("/templates/:id/blocks", auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.error("Şablon bulunamadı", 404);
    }

    if (!template.hasAccess(req.user.id, "edit")) {
      return res.error("Bu şablona blok ekleme izniniz yok", 403);
    }

    const { block, position } = req.body;

    template.addBlock(block, position);
    template.updatedBy = req.user.id;

    await template.save();

    logger.info("Block added to template", {
      templateId: template._id,
      blockId: block.id,
      blockType: block.type,
      userId: req.user.id,
    });

    res.success(
      {
        template: template,
      },
      "Blok başarıyla eklendi"
    );
  } catch (error) {
    logger.error("Error adding block to template", {
      error: error.message,
      templateId: req.params.id,
      userId: req.user.id,
    });
    res.error("Blok eklenirken hata oluştu", 500);
  }
});

// Blok güncelleme
router.put("/templates/:id/blocks/:blockId", auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.error("Şablon bulunamadı", 404);
    }

    if (!template.hasAccess(req.user.id, "edit")) {
      return res.error("Bu şablondaki bloğu düzenleme izniniz yok", 403);
    }

    const { updates } = req.body;

    template.updateBlock(req.params.blockId, updates);
    template.updatedBy = req.user.id;

    await template.save();

    logger.info("Block updated in template", {
      templateId: template._id,
      blockId: req.params.blockId,
      userId: req.user.id,
    });

    res.success(
      {
        template: template,
      },
      "Blok başarıyla güncellendi"
    );
  } catch (error) {
    logger.error("Error updating block in template", {
      error: error.message,
      templateId: req.params.id,
      blockId: req.params.blockId,
      userId: req.user.id,
    });
    res.error("Blok güncellenirken hata oluştu", 500);
  }
});

// Blok silme
router.delete("/templates/:id/blocks/:blockId", auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.error("Şablon bulunamadı", 404);
    }

    if (!template.hasAccess(req.user.id, "edit")) {
      return res.error("Bu şablondaki bloğu silme izniniz yok", 403);
    }

    template.removeBlock(req.params.blockId);
    template.updatedBy = req.user.id;

    await template.save();

    logger.info("Block removed from template", {
      templateId: template._id,
      blockId: req.params.blockId,
      userId: req.user.id,
    });

    res.success(
      {
        template: template,
      },
      "Blok başarıyla silindi"
    );
  } catch (error) {
    logger.error("Error removing block from template", {
      error: error.message,
      templateId: req.params.id,
      blockId: req.params.blockId,
      userId: req.user.id,
    });
    res.error("Blok silinirken hata oluştu", 500);
  }
});

// Blok sıralama
router.put("/templates/:id/blocks/reorder", auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.error("Şablon bulunamadı", 404);
    }

    if (!template.hasAccess(req.user.id, "edit")) {
      return res.error("Bu şablondaki blokları sıralama izniniz yok", 403);
    }

    const { fromIndex, toIndex } = req.body;

    template.reorderBlocks(fromIndex, toIndex);
    template.updatedBy = req.user.id;

    await template.save();

    logger.info("Blocks reordered in template", {
      templateId: template._id,
      fromIndex,
      toIndex,
      userId: req.user.id,
    });

    res.success(
      {
        template: template,
      },
      "Bloklar başarıyla yeniden sıralandı"
    );
  } catch (error) {
    logger.error("Error reordering blocks in template", {
      error: error.message,
      templateId: req.params.id,
      userId: req.user.id,
    });
    res.error("Bloklar sıralanırken hata oluştu", 500);
  }
});

// Toplu blok işlemleri
router.post(
  "/templates/:id/blocks/bulk",
  auth,
  requireTemplateAccess("edit"),
  async (req, res) => {
    try {
      const { operations } = req.body;

      if (!Array.isArray(operations)) {
        return res.error("İşlem listesi gerekli", 400);
      }

      const result = await bulkOperationsService.executeBulkOperations(
        req.params.id,
        operations,
        req.user.id
      );

      // Cache'i temizle
      await cacheService.invalidateTemplate(req.params.id);

      res.success(result, "Toplu işlemler başarıyla gerçekleştirildi");
    } catch (error) {
      logger.error("Error performing bulk operations on template", {
        error: error.message,
        templateId: req.params.id,
        userId: req.user.id,
      });
      res.error(
        error.message || "Toplu işlemler gerçekleştirilirken hata oluştu",
        500
      );
    }
  }
);

// Toplu blok ekleme
router.post(
  "/templates/:id/blocks/batch-add",
  auth,
  requireTemplateAccess("edit"),
  async (req, res) => {
    try {
      const { blocks, position } = req.body;

      if (!Array.isArray(blocks)) {
        return res.error("Blok listesi gerekli", 400);
      }

      const result = await bulkOperationsService.executeBulkOperations(
        req.params.id,
        [{ type: "batch_add", data: { blocks, position } }],
        req.user.id
      );

      // Cache'i temizle
      await cacheService.invalidateTemplate(req.params.id);

      res.success(result, "Bloklar başarıyla eklendi");
    } catch (error) {
      logger.error("Error batch adding blocks", {
        error: error.message,
        templateId: req.params.id,
        userId: req.user.id,
      });
      res.error(error.message || "Bloklar eklenirken hata oluştu", 500);
    }
  }
);

// Toplu blok güncelleme
router.post(
  "/templates/:id/blocks/batch-update",
  auth,
  requireTemplateAccess("edit"),
  async (req, res) => {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates)) {
        return res.error("Güncelleme listesi gerekli", 400);
      }

      const result = await bulkOperationsService.executeBulkOperations(
        req.params.id,
        [{ type: "batch_update", data: { updates } }],
        req.user.id
      );

      // Cache'i temizle
      await cacheService.invalidateTemplate(req.params.id);

      res.success(result, "Bloklar başarıyla güncellendi");
    } catch (error) {
      logger.error("Error batch updating blocks", {
        error: error.message,
        templateId: req.params.id,
        userId: req.user.id,
      });
      res.error(error.message || "Bloklar güncellenirken hata oluştu", 500);
    }
  }
);

// Toplu blok silme
router.post(
  "/templates/:id/blocks/batch-delete",
  auth,
  requireTemplateAccess("edit"),
  async (req, res) => {
    try {
      const { blockIds } = req.body;

      if (!Array.isArray(blockIds)) {
        return res.error("Blok ID listesi gerekli", 400);
      }

      const result = await bulkOperationsService.executeBulkOperations(
        req.params.id,
        [{ type: "batch_delete", data: { blockIds } }],
        req.user.id
      );

      // Cache'i temizle
      await cacheService.invalidateTemplate(req.params.id);

      res.success(result, "Bloklar başarıyla silindi");
    } catch (error) {
      logger.error("Error batch deleting blocks", {
        error: error.message,
        templateId: req.params.id,
        userId: req.user.id,
      });
      res.error(error.message || "Bloklar silinirken hata oluştu", 500);
    }
  }
);

// Blokları kopyalama
router.post(
  "/templates/:id/blocks/duplicate",
  auth,
  requireTemplateAccess("edit"),
  async (req, res) => {
    try {
      const { blockId, position } = req.body;

      if (!blockId) {
        return res.error("Blok ID'si gerekli", 400);
      }

      const result = await bulkOperationsService.executeBulkOperations(
        req.params.id,
        [{ type: "duplicate", data: { blockId, position } }],
        req.user.id
      );

      // Cache'i temizle
      await cacheService.invalidateTemplate(req.params.id);

      res.success(result, "Blok başarıyla kopyalandı");
    } catch (error) {
      logger.error("Error duplicating block", {
        error: error.message,
        templateId: req.params.id,
        userId: req.user.id,
      });
      res.error(error.message || "Blok kopyalanırken hata oluştu", 500);
    }
  }
);

// Blokları taşıma
router.post(
  "/templates/:id/blocks/move",
  auth,
  requireTemplateAccess("edit"),
  async (req, res) => {
    try {
      const { blockId, fromPosition, toPosition } = req.body;

      if (!blockId || fromPosition === undefined || toPosition === undefined) {
        return res.error("Blok ID'si, kaynak ve hedef pozisyon gerekli", 400);
      }

      const result = await bulkOperationsService.executeBulkOperations(
        req.params.id,
        [{ type: "move", data: { blockId, fromPosition, toPosition } }],
        req.user.id
      );

      // Cache'i temizle
      await cacheService.invalidateTemplate(req.params.id);

      res.success(result, "Blok başarıyla taşındı");
    } catch (error) {
      logger.error("Error moving block", {
        error: error.message,
        templateId: req.params.id,
        userId: req.user.id,
      });
      res.error(error.message || "Blok taşınırken hata oluştu", 500);
    }
  }
);

// Blokları import etme
router.post(
  "/templates/:id/blocks/import",
  auth,
  requireTemplateAccess("edit"),
  async (req, res) => {
    try {
      const { blocks, position, replaceExisting = false } = req.body;

      if (!Array.isArray(blocks)) {
        return res.error("Blok listesi gerekli", 400);
      }

      const result = await bulkOperationsService.executeBulkOperations(
        req.params.id,
        [
          {
            type: "import_blocks",
            data: { blocks, position, replaceExisting },
          },
        ],
        req.user.id
      );

      // Cache'i temizle
      await cacheService.invalidateTemplate(req.params.id);

      res.success(result, "Bloklar başarıyla import edildi");
    } catch (error) {
      logger.error("Error importing blocks", {
        error: error.message,
        templateId: req.params.id,
        userId: req.user.id,
      });
      res.error(error.message || "Bloklar import edilirken hata oluştu", 500);
    }
  }
);

// Blokları export etme
router.get(
  "/templates/:id/blocks/export",
  auth,
  requireTemplateAccess("view"),
  async (req, res) => {
    try {
      const { blockIds, includeMetadata = true } = req.query;

      const data = {
        includeMetadata: includeMetadata === "true",
      };

      if (blockIds) {
        data.blockIds = blockIds.split(",");
      }

      const result = await bulkOperationsService.executeBulkOperations(
        req.params.id,
        [{ type: "export_blocks", data }],
        req.user.id
      );

      res.success(result, "Bloklar başarıyla export edildi");
    } catch (error) {
      logger.error("Error exporting blocks", {
        error: error.message,
        templateId: req.params.id,
        userId: req.user.id,
      });
      res.error(error.message || "Bloklar export edilirken hata oluştu", 500);
    }
  }
);

// Blokları validate etme
router.post(
  "/templates/:id/blocks/validate",
  auth,
  requireTemplateAccess("view"),
  async (req, res) => {
    try {
      const { blockIds } = req.body;

      const data = {};
      if (blockIds && Array.isArray(blockIds)) {
        data.blockIds = blockIds;
      }

      const result = await bulkOperationsService.executeBulkOperations(
        req.params.id,
        [{ type: "validate_blocks", data }],
        req.user.id
      );

      res.success(result, "Blok validasyonu tamamlandı");
    } catch (error) {
      logger.error("Error validating blocks", {
        error: error.message,
        templateId: req.params.id,
        userId: req.user.id,
      });
      res.error(
        error.message || "Blok validasyonu yapılırken hata oluştu",
        500
      );
    }
  }
);

// Blok stillerini güncelleme
router.post(
  "/templates/:id/blocks/update-styles",
  auth,
  requireTemplateAccess("edit"),
  async (req, res) => {
    try {
      const { blockIds, styles, merge = true } = req.body;

      if (!Array.isArray(blockIds) || !styles) {
        return res.error("Blok ID listesi ve stiller gerekli", 400);
      }

      const result = await bulkOperationsService.executeBulkOperations(
        req.params.id,
        [{ type: "update_styles", data: { blockIds, styles, merge } }],
        req.user.id
      );

      // Cache'i temizle
      await cacheService.invalidateTemplate(req.params.id);

      res.success(result, "Blok stilleri başarıyla güncellendi");
    } catch (error) {
      logger.error("Error updating block styles", {
        error: error.message,
        templateId: req.params.id,
        userId: req.user.id,
      });
      res.error(
        error.message || "Blok stilleri güncellenirken hata oluştu",
        500
      );
    }
  }
);

// Blok içeriklerini güncelleme
router.post(
  "/templates/:id/blocks/update-content",
  auth,
  requireTemplateAccess("edit"),
  async (req, res) => {
    try {
      const { blockIds, content, merge = true } = req.body;

      if (!Array.isArray(blockIds) || !content) {
        return res.error("Blok ID listesi ve içerik gerekli", 400);
      }

      const result = await bulkOperationsService.executeBulkOperations(
        req.params.id,
        [{ type: "update_content", data: { blockIds, content, merge } }],
        req.user.id
      );

      // Cache'i temizle
      await cacheService.invalidateTemplate(req.params.id);

      res.success(result, "Blok içerikleri başarıyla güncellendi");
    } catch (error) {
      logger.error("Error updating block content", {
        error: error.message,
        templateId: req.params.id,
        userId: req.user.id,
      });
      res.error(
        error.message || "Blok içerikleri güncellenirken hata oluştu",
        500
      );
    }
  }
);

// Sürüm geçmişini getirme
router.get("/templates/:id/versions", auth, async (req, res) => {
  try {
    const result = await versionControlService.getVersionHistory(
      req.params.id,
      req.user.id
    );
    res.success(result, "Sürüm geçmişi başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting template version history", {
      error: error.message,
      templateId: req.params.id,
      userId: req.user.id,
    });
    res.error(error.message || "Sürüm geçmişi getirilirken hata oluştu", 500);
  }
});

// Belirli bir sürüme geri dönme
router.post(
  "/templates/:id/versions/:versionNumber/revert",
  auth,
  async (req, res) => {
    try {
      const { changeDescription } = req.body;
      const versionNumber = parseInt(req.params.versionNumber);

      const result = await versionControlService.revertToVersion(
        req.params.id,
        versionNumber,
        req.user.id,
        changeDescription
      );

      // Cache'i temizle
      await cacheService.invalidateTemplate(req.params.id);

      res.success(
        {
          template: result.template,
          revertedFrom: result.revertedFrom,
          revertedTo: result.revertedTo,
        },
        `Şablon sürüm ${versionNumber}'a başarıyla geri döndürüldü`
      );
    } catch (error) {
      logger.error("Error reverting template to version", {
        error: error.message,
        templateId: req.params.id,
        versionNumber: req.params.versionNumber,
        userId: req.user.id,
      });
      res.error(
        error.message || "Şablon sürüme geri döndürülürken hata oluştu",
        500
      );
    }
  }
);

// Önizleme oluşturma
router.post("/preview", auth, async (req, res) => {
  try {
    const { blocks, globalStyles, canvasSize, data = {} } = req.body;

    if (!blocks || !Array.isArray(blocks)) {
      return res.error("Bloklar gerekli", 400);
    }

    const html = await blockEditorService.renderBlocksToHTML(
      blocks,
      globalStyles || {},
      canvasSize || {},
      data
    );

    logger.info("Block editor preview generated", {
      userId: req.user.id,
      blockCount: blocks.length,
    });

    res.success(
      {
        html,
        previewUrl: `/api/block-editor/preview/${Date.now()}`,
      },
      "Önizleme başarıyla oluşturuldu"
    );
  } catch (error) {
    logger.error("Error generating block editor preview", {
      error: error.message,
      userId: req.user.id,
    });
    res.error("Önizleme oluşturulurken hata oluştu", 500);
  }
});

// Şablon önizleme
router.get("/templates/:id/preview", auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.error("Şablon bulunamadı", 404);
    }

    if (!template.hasAccess(req.user.id, "view")) {
      return res.error("Bu şablonun önizlemesine erişim izniniz yok", 403);
    }

    const { data = {} } = req.query;
    let parsedData = {};

    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      // JSON parse hatası, boş obje kullan
    }

    const html = await blockEditorService.renderBlocksToHTML(
      template.blocks,
      template.globalStyles,
      template.canvasSize,
      parsedData
    );

    // Kullanım sayısını artır
    template.incrementUsage();
    await template.save();

    logger.info("Template preview generated", {
      templateId: template._id,
      userId: req.user.id,
    });

    res.set("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    logger.error("Error generating template preview", {
      error: error.message,
      templateId: req.params.id,
      userId: req.user.id,
    });
    res.error("Şablon önizlemesi oluşturulurken hata oluştu", 500);
  }
});

// EJS şablonu render etme (eski sistem uyumluluğu)
router.get("/ejs/:templateId", auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { data = {} } = req.query;
    let parsedData = {};

    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      // JSON parse hatası, boş obje kullan
    }

    const html = await blockEditorService.renderEJSTemplate(
      templateId,
      parsedData
    );

    logger.info("EJS template rendered", {
      templateId,
      userId: req.user.id,
    });

    res.set("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    logger.error("Error rendering EJS template", {
      error: error.message,
      templateId: req.params.templateId,
      userId: req.user.id,
    });
    res.error("EJS şablonu render edilirken hata oluştu", 500);
  }
});

// Sürüm detaylarını getirme
router.get("/templates/:id/versions/:versionNumber", auth, async (req, res) => {
  try {
    const versionNumber = parseInt(req.params.versionNumber);
    const result = await versionControlService.getVersionDetails(
      req.params.id,
      versionNumber,
      req.user.id
    );
    res.success(result, "Sürüm detayları başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting version details", {
      error: error.message,
      templateId: req.params.id,
      versionNumber: req.params.versionNumber,
      userId: req.user.id,
    });
    res.error(error.message || "Sürüm detayları getirilirken hata oluştu", 500);
  }
});

// Sürüm karşılaştırması
router.get(
  "/templates/:id/versions/compare/:version1/:version2",
  auth,
  async (req, res) => {
    try {
      const version1 = parseInt(req.params.version1);
      const version2 = parseInt(req.params.version2);

      const result = await versionControlService.compareVersions(
        req.params.id,
        version1,
        version2,
        req.user.id
      );
      res.success(result, "Sürüm karşılaştırması başarıyla tamamlandı");
    } catch (error) {
      logger.error("Error comparing versions", {
        error: error.message,
        templateId: req.params.id,
        version1: req.params.version1,
        version2: req.params.version2,
        userId: req.user.id,
      });
      res.error(
        error.message || "Sürüm karşılaştırması yapılırken hata oluştu",
        500
      );
    }
  }
);

// Sürüm geçmişini temizleme
router.post("/templates/:id/versions/cleanup", auth, async (req, res) => {
  try {
    const { keepVersions = 10 } = req.body;

    const result = await versionControlService.cleanupVersionHistory(
      req.params.id,
      req.user.id,
      keepVersions
    );
    res.success(result, "Sürüm geçmişi başarıyla temizlendi");
  } catch (error) {
    logger.error("Error cleaning up version history", {
      error: error.message,
      templateId: req.params.id,
      userId: req.user.id,
    });
    res.error(error.message || "Sürüm geçmişi temizlenirken hata oluştu", 500);
  }
});

// Sürüm istatistikleri
router.get("/templates/:id/versions/stats", auth, async (req, res) => {
  try {
    const result = await versionControlService.getVersionStats(
      req.params.id,
      req.user.id
    );
    res.success(result, "Sürüm istatistikleri başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting version stats", {
      error: error.message,
      templateId: req.params.id,
      userId: req.user.id,
    });
    res.error(
      error.message || "Sürüm istatistikleri getirilirken hata oluştu",
      500
    );
  }
});

// Sürüm yedekleme (export)
router.get(
  "/templates/:id/versions/:versionNumber/export",
  auth,
  async (req, res) => {
    try {
      const versionNumber = parseInt(req.params.versionNumber);

      const result = await versionControlService.exportVersion(
        req.params.id,
        versionNumber,
        req.user.id
      );
      res.success(result, "Sürüm başarıyla yedeklendi");
    } catch (error) {
      logger.error("Error exporting version", {
        error: error.message,
        templateId: req.params.id,
        versionNumber: req.params.versionNumber,
        userId: req.user.id,
      });
      res.error(error.message || "Sürüm yedeklenirken hata oluştu", 500);
    }
  }
);

module.exports = router;
