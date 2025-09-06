const express = require("express");
const router = express.Router();
const blockManagementService = require("../services/blockManagementService");
const auth = require("../middleware/auth");
const { requireAdvancedFeatures } = require("../middleware/authorization");
const logger = require("../config/logger");

// Tüm blok türlerini listele
router.get("/blocks", auth, async (req, res) => {
  try {
    const { category, isAdvanced, requiresAuth, search } = req.query;
    
    const filters = {};
    if (category) filters.category = category;
    if (isAdvanced !== undefined) filters.isAdvanced = isAdvanced === 'true';
    if (requiresAuth !== undefined) filters.requiresAuth = requiresAuth === 'true';
    if (search) filters.search = search;

    const blocks = blockManagementService.filterBlocks(filters);

    res.success({
      blocks,
      total: blocks.length,
      filters
    }, "Blok türleri başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting blocks", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Blok türleri getirilirken hata oluştu", 500);
  }
});

// Belirli bir blok türünü getir
router.get("/blocks/:blockType", auth, async (req, res) => {
  try {
    const { blockType } = req.params;
    const block = blockManagementService.getBlock(blockType);

    if (!block) {
      return res.error("Blok türü bulunamadı", 404);
    }

    res.success(block, "Blok türü başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting block type", {
      error: error.message,
      blockType: req.params.blockType,
      userId: req.user.id
    });
    res.error("Blok türü getirilirken hata oluştu", 500);
  }
});

// Blok türü oluştur (gelişmiş özellikler gerekli)
router.post("/blocks", auth, requireAdvancedFeatures, async (req, res) => {
  try {
    const { blockType, config } = req.body;

    if (!blockType || !config) {
      return res.error("Blok türü ve konfigürasyon gerekli", 400);
    }

    const result = blockManagementService.registerBlock(blockType, config);

    if (!result.success) {
      return res.error(result.message, 400);
    }

    logger.info("New block type registered", {
      blockType,
      userId: req.user.id,
      config: {
        name: config.name,
        category: config.category,
        isAdvanced: config.isAdvanced
      }
    });

    res.success({
      blockType,
      config: blockManagementService.getBlock(blockType)
    }, result.message);
  } catch (error) {
    logger.error("Error creating block type", {
      error: error.message,
      blockType: req.body.blockType,
      userId: req.user.id
    });
    res.error("Blok türü oluşturulurken hata oluştu", 500);
  }
});

// Blok türünü güncelle (gelişmiş özellikler gerekli)
router.put("/blocks/:blockType", auth, requireAdvancedFeatures, async (req, res) => {
  try {
    const { blockType } = req.params;
    const { updates } = req.body;

    if (!updates) {
      return res.error("Güncelleme verileri gerekli", 400);
    }

    const result = blockManagementService.updateBlock(blockType, updates);

    if (!result.success) {
      return res.error(result.message, 400);
    }

    logger.info("Block type updated", {
      blockType,
      userId: req.user.id,
      updates
    });

    res.success({
      blockType,
      config: blockManagementService.getBlock(blockType)
    }, result.message);
  } catch (error) {
    logger.error("Error updating block type", {
      error: error.message,
      blockType: req.params.blockType,
      userId: req.user.id
    });
    res.error("Blok türü güncellenirken hata oluştu", 500);
  }
});

// Blok türünü sil (gelişmiş özellikler gerekli)
router.delete("/blocks/:blockType", auth, requireAdvancedFeatures, async (req, res) => {
  try {
    const { blockType } = req.params;

    const result = blockManagementService.unregisterBlock(blockType);

    if (!result.success) {
      return res.error(result.message, 400);
    }

    logger.info("Block type unregistered", {
      blockType,
      userId: req.user.id
    });

    res.success(null, result.message);
  } catch (error) {
    logger.error("Error deleting block type", {
      error: error.message,
      blockType: req.params.blockType,
      userId: req.user.id
    });
    res.error("Blok türü silinirken hata oluştu", 500);
  }
});

// Blok türünü kopyala (gelişmiş özellikler gerekli)
router.post("/blocks/:blockType/copy", auth, requireAdvancedFeatures, async (req, res) => {
  try {
    const { blockType } = req.params;
    const { newBlockType, modifications = {} } = req.body;

    if (!newBlockType) {
      return res.error("Yeni blok türü adı gerekli", 400);
    }

    const result = blockManagementService.copyBlock(blockType, newBlockType, modifications);

    if (!result.success) {
      return res.error(result.message, 400);
    }

    logger.info("Block type copied", {
      sourceBlockType: blockType,
      newBlockType,
      userId: req.user.id,
      modifications
    });

    res.success({
      sourceBlockType: blockType,
      newBlockType,
      config: blockManagementService.getBlock(newBlockType)
    }, result.message);
  } catch (error) {
    logger.error("Error copying block type", {
      error: error.message,
      blockType: req.params.blockType,
      userId: req.user.id
    });
    res.error("Blok türü kopyalanırken hata oluştu", 500);
  }
});

// Blok türünü render et
router.post("/blocks/:blockType/render", auth, async (req, res) => {
  try {
    const { blockType } = req.params;
    const { blockData, context = {} } = req.body;

    if (!blockData) {
      return res.error("Blok verisi gerekli", 400);
    }

    const result = await blockManagementService.renderBlock(blockType, blockData, context);

    if (!result.success) {
      return res.error(result.message, 400);
    }

    res.success({
      html: result.html
    }, "Blok başarıyla render edildi");
  } catch (error) {
    logger.error("Error rendering block", {
      error: error.message,
      blockType: req.params.blockType,
      userId: req.user.id
    });
    res.error("Blok render edilirken hata oluştu", 500);
  }
});

// Blok türünü validate et
router.post("/blocks/:blockType/validate", auth, async (req, res) => {
  try {
    const { blockType } = req.params;
    const { blockData } = req.body;

    if (!blockData) {
      return res.error("Blok verisi gerekli", 400);
    }

    const result = await blockManagementService.validateBlock(blockType, blockData);

    if (!result.success) {
      return res.error(result.message, 400);
    }

    res.success({
      valid: result.valid,
      errors: result.errors
    }, "Blok validasyonu tamamlandı");
  } catch (error) {
    logger.error("Error validating block", {
      error: error.message,
      blockType: req.params.blockType,
      userId: req.user.id
    });
    res.error("Blok validasyonu yapılırken hata oluştu", 500);
  }
});

// Blok türünün varsayılan stilini getir
router.get("/blocks/:blockType/default-style", auth, async (req, res) => {
  try {
    const { blockType } = req.params;
    const defaultStyle = blockManagementService.getDefaultStyle(blockType);

    res.success({
      blockType,
      defaultStyle
    }, "Varsayılan stil başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting default style", {
      error: error.message,
      blockType: req.params.blockType,
      userId: req.user.id
    });
    res.error("Varsayılan stil getirilirken hata oluştu", 500);
  }
});

// Blok türü bağımlılıklarını kontrol et
router.get("/blocks/:blockType/dependencies", auth, async (req, res) => {
  try {
    const { blockType } = req.params;
    const dependencies = blockManagementService.checkDependencies(blockType);

    res.success(dependencies, "Bağımlılık kontrolü tamamlandı");
  } catch (error) {
    logger.error("Error checking dependencies", {
      error: error.message,
      blockType: req.params.blockType,
      userId: req.user.id
    });
    res.error("Bağımlılık kontrolü yapılırken hata oluştu", 500);
  }
});

// Blok türü export et
router.get("/blocks/:blockType/export", auth, async (req, res) => {
  try {
    const { blockType } = req.params;
    const result = blockManagementService.exportBlock(blockType);

    if (!result.success) {
      return res.error(result.message, 400);
    }

    res.success(result.data, "Blok türü başarıyla export edildi");
  } catch (error) {
    logger.error("Error exporting block type", {
      error: error.message,
      blockType: req.params.blockType,
      userId: req.user.id
    });
    res.error("Blok türü export edilirken hata oluştu", 500);
  }
});

// Blok türü import et (gelişmiş özellikler gerekli)
router.post("/blocks/:blockType/import", auth, requireAdvancedFeatures, async (req, res) => {
  try {
    const { blockType } = req.params;
    const { config } = req.body;

    if (!config) {
      return res.error("Konfigürasyon gerekli", 400);
    }

    const result = blockManagementService.importBlock(blockType, config);

    if (!result.success) {
      return res.error(result.message, 400);
    }

    logger.info("Block type imported", {
      blockType,
      userId: req.user.id
    });

    res.success({
      blockType,
      config: blockManagementService.getBlock(blockType)
    }, result.message);
  } catch (error) {
    logger.error("Error importing block type", {
      error: error.message,
      blockType: req.params.blockType,
      userId: req.user.id
    });
    res.error("Blok türü import edilirken hata oluştu", 500);
  }
});

// Tüm blok türlerini export et
router.get("/blocks/export/all", auth, async (req, res) => {
  try {
    const result = blockManagementService.exportAllBlocks();

    if (!result.success) {
      return res.error(result.message, 400);
    }

    res.success(result.data, "Tüm blok türleri başarıyla export edildi");
  } catch (error) {
    logger.error("Error exporting all blocks", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Blok türleri export edilirken hata oluştu", 500);
  }
});

// Tüm blok türlerini import et (gelişmiş özellikler gerekli)
router.post("/blocks/import/all", auth, requireAdvancedFeatures, async (req, res) => {
  try {
    const { blocksData } = req.body;

    if (!blocksData) {
      return res.error("Blok verileri gerekli", 400);
    }

    const result = blockManagementService.importAllBlocks(blocksData);

    if (!result.success) {
      return res.error(result.message, 400);
    }

    logger.info("All blocks imported", {
      userId: req.user.id,
      imported: result.imported,
      failed: result.failed
    });

    res.success({
      results: result.results,
      imported: result.imported,
      failed: result.failed,
      errors: result.errors
    }, "Blok türleri başarıyla import edildi");
  } catch (error) {
    logger.error("Error importing all blocks", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Blok türleri import edilirken hata oluştu", 500);
  }
});

// Blok türü istatistiklerini getir
router.get("/blocks/stats", auth, async (req, res) => {
  try {
    const stats = blockManagementService.getStats();

    res.success(stats, "Blok türü istatistikleri başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting block stats", {
      error: error.message,
      userId: req.user.id
    });
    res.error("İstatistikler getirilirken hata oluştu", 500);
  }
});

// Kategorilere göre blok türlerini getir
router.get("/blocks/category/:category", auth, async (req, res) => {
  try {
    const { category } = req.params;
    const blocks = blockManagementService.getBlocksByCategory(category);

    res.success({
      category,
      blocks,
      count: blocks.length
    }, "Kategori blok türleri başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting blocks by category", {
      error: error.message,
      category: req.params.category,
      userId: req.user.id
    });
    res.error("Kategori blok türleri getirilirken hata oluştu", 500);
  }
});

// Gelişmiş blok türlerini getir
router.get("/blocks/advanced", auth, async (req, res) => {
  try {
    const blocks = blockManagementService.getAdvancedBlocks();

    res.success({
      blocks,
      count: blocks.length
    }, "Gelişmiş blok türleri başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting advanced blocks", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Gelişmiş blok türleri getirilirken hata oluştu", 500);
  }
});

// Temel blok türlerini getir
router.get("/blocks/basic", auth, async (req, res) => {
  try {
    const blocks = blockManagementService.getBasicBlocks();

    res.success({
      blocks,
      count: blocks.length
    }, "Temel blok türleri başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting basic blocks", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Temel blok türleri getirilirken hata oluştu", 500);
  }
});

module.exports = router;
