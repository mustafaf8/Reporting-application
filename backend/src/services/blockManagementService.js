const blockRegistry = require("./blockRegistry");
const logger = require("../config/logger");

class BlockManagementService {
  constructor() {
    this.initialize();
  }

  /**
   * Servisi başlat
   */
  initialize() {
    blockRegistry.initialize();
    logger.info("Block management service initialized");
  }

  /**
   * Yeni blok türü kaydet
   */
  registerBlock(blockType, config) {
    try {
      blockRegistry.registerBlock(blockType, config);
      return {
        success: true,
        message: `Block type ${blockType} registered successfully`
      };
    } catch (error) {
      logger.error("Error registering block type", {
        error: error.message,
        blockType,
        config
      });
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Blok türünü kaldır
   */
  unregisterBlock(blockType) {
    try {
      const removed = blockRegistry.unregisterBlock(blockType);
      return {
        success: removed,
        message: removed ? 
          `Block type ${blockType} unregistered successfully` :
          `Block type ${blockType} not found`
      };
    } catch (error) {
      logger.error("Error unregistering block type", {
        error: error.message,
        blockType
      });
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Blok türünü getir
   */
  getBlock(blockType) {
    return blockRegistry.getBlock(blockType);
  }

  /**
   * Tüm blok türlerini getir
   */
  getAllBlocks() {
    return blockRegistry.getAllBlocks();
  }

  /**
   * Kategoriye göre blok türlerini getir
   */
  getBlocksByCategory(category) {
    return blockRegistry.getBlocksByCategory(category);
  }

  /**
   * Gelişmiş blok türlerini getir
   */
  getAdvancedBlocks() {
    return blockRegistry.getAdvancedBlocks();
  }

  /**
   * Temel blok türlerini getir
   */
  getBasicBlocks() {
    return blockRegistry.getBasicBlocks();
  }

  /**
   * Blok türünün mevcut olup olmadığını kontrol et
   */
  hasBlock(blockType) {
    return blockRegistry.hasBlock(blockType);
  }

  /**
   * Blok türünün bağımlılıklarını kontrol et
   */
  checkDependencies(blockType) {
    return blockRegistry.checkDependencies(blockType);
  }

  /**
   * Blok türünü render et
   */
  async renderBlock(blockType, blockData, context = {}) {
    try {
      if (!blockRegistry.hasBlock(blockType)) {
        throw new Error(`Block type ${blockType} not found`);
      }

      const result = await blockRegistry.renderBlock(blockType, blockData, context);
      return {
        success: true,
        html: result
      };
    } catch (error) {
      logger.error("Error rendering block", {
        error: error.message,
        blockType,
        blockData
      });
      return {
        success: false,
        message: error.message,
        html: `<div style="color: red; padding: 8px; border: 1px solid red; border-radius: 4px;">Error rendering block: ${error.message}</div>`
      };
    }
  }

  /**
   * Blok türünü validate et
   */
  async validateBlock(blockType, blockData) {
    try {
      if (!blockRegistry.hasBlock(blockType)) {
        return {
          success: false,
          valid: false,
          errors: [`Block type ${blockType} not found`]
        };
      }

      const result = await blockRegistry.validateBlock(blockType, blockData);
      return {
        success: true,
        valid: result.valid,
        errors: result.errors || []
      };
    } catch (error) {
      logger.error("Error validating block", {
        error: error.message,
        blockType,
        blockData
      });
      return {
        success: false,
        valid: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Blok türünün varsayılan stilini getir
   */
  getDefaultStyle(blockType) {
    return blockRegistry.getDefaultStyle(blockType);
  }

  /**
   * Blok türü istatistiklerini getir
   */
  getStats() {
    return blockRegistry.getStats();
  }

  /**
   * Blok türlerini filtrele
   */
  filterBlocks(filters = {}) {
    let blocks = blockRegistry.getAllBlocks();

    if (filters.category) {
      blocks = blocks.filter(block => block.category === filters.category);
    }

    if (filters.isAdvanced !== undefined) {
      blocks = blocks.filter(block => block.isAdvanced === filters.isAdvanced);
    }

    if (filters.requiresAuth !== undefined) {
      blocks = blocks.filter(block => block.requiresAuth === filters.requiresAuth);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      blocks = blocks.filter(block => 
        block.name.toLowerCase().includes(searchTerm) ||
        block.description.toLowerCase().includes(searchTerm) ||
        block.type.toLowerCase().includes(searchTerm)
      );
    }

    return blocks;
  }

  /**
   * Blok türünü güncelle
   */
  updateBlock(blockType, updates) {
    try {
      const existingBlock = blockRegistry.getBlock(blockType);
      if (!existingBlock) {
        return {
          success: false,
          message: `Block type ${blockType} not found`
        };
      }

      // Mevcut konfigürasyonu güncelle
      const updatedConfig = {
        ...existingBlock,
        ...updates,
        type: blockType, // Type değiştirilemez
        registeredAt: existingBlock.registeredAt // Kayıt tarihi değiştirilemez
      };

      // Eski blok türünü kaldır
      blockRegistry.unregisterBlock(blockType);

      // Güncellenmiş blok türünü kaydet
      blockRegistry.registerBlock(blockType, updatedConfig);

      return {
        success: true,
        message: `Block type ${blockType} updated successfully`
      };
    } catch (error) {
      logger.error("Error updating block type", {
        error: error.message,
        blockType,
        updates
      });
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Blok türünü kopyala
   */
  copyBlock(blockType, newBlockType, modifications = {}) {
    try {
      const existingBlock = blockRegistry.getBlock(blockType);
      if (!existingBlock) {
        return {
          success: false,
          message: `Source block type ${blockType} not found`
        };
      }

      if (blockRegistry.hasBlock(newBlockType)) {
        return {
          success: false,
          message: `Target block type ${newBlockType} already exists`
        };
      }

      // Mevcut konfigürasyonu kopyala ve değişiklikleri uygula
      const copiedConfig = {
        ...existingBlock,
        ...modifications,
        type: newBlockType,
        registeredAt: new Date()
      };

      blockRegistry.registerBlock(newBlockType, copiedConfig);

      return {
        success: true,
        message: `Block type ${blockType} copied to ${newBlockType} successfully`
      };
    } catch (error) {
      logger.error("Error copying block type", {
        error: error.message,
        blockType,
        newBlockType,
        modifications
      });
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Blok türünü export et
   */
  exportBlock(blockType) {
    try {
      const block = blockRegistry.getBlock(blockType);
      if (!block) {
        return {
          success: false,
          message: `Block type ${blockType} not found`
        };
      }

      const renderer = blockRegistry.getRenderer(blockType);
      const validator = blockRegistry.getValidator(blockType);
      const defaultStyle = blockRegistry.getDefaultStyle(blockType);

      return {
        success: true,
        data: {
          ...block,
          renderer: renderer ? renderer.toString() : null,
          validator: validator ? validator.toString() : null,
          defaultStyle
        }
      };
    } catch (error) {
      logger.error("Error exporting block type", {
        error: error.message,
        blockType
      });
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Blok türünü import et
   */
  importBlock(blockType, config) {
    try {
      if (blockRegistry.hasBlock(blockType)) {
        return {
          success: false,
          message: `Block type ${blockType} already exists`
        };
      }

      // Renderer ve validator'ı string'den function'a çevir
      if (config.renderer && typeof config.renderer === 'string') {
        try {
          config.renderer = eval(`(${config.renderer})`);
        } catch (error) {
          return {
            success: false,
            message: `Invalid renderer function: ${error.message}`
          };
        }
      }

      if (config.validator && typeof config.validator === 'string') {
        try {
          config.validator = eval(`(${config.validator})`);
        } catch (error) {
          return {
            success: false,
            message: `Invalid validator function: ${error.message}`
          };
        }
      }

      blockRegistry.registerBlock(blockType, config);

      return {
        success: true,
        message: `Block type ${blockType} imported successfully`
      };
    } catch (error) {
      logger.error("Error importing block type", {
        error: error.message,
        blockType,
        config
      });
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Tüm blok türlerini export et
   */
  exportAllBlocks() {
    try {
      const blocks = blockRegistry.getAllBlocks();
      const exportedBlocks = {};

      blocks.forEach(block => {
        const exportResult = this.exportBlock(block.type);
        if (exportResult.success) {
          exportedBlocks[block.type] = exportResult.data;
        }
      });

      return {
        success: true,
        data: exportedBlocks,
        count: Object.keys(exportedBlocks).length
      };
    } catch (error) {
      logger.error("Error exporting all blocks", {
        error: error.message
      });
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Blok türlerini toplu import et
   */
  importAllBlocks(blocksData) {
    try {
      const results = [];
      const errors = [];

      Object.entries(blocksData).forEach(([blockType, config]) => {
        const result = this.importBlock(blockType, config);
        results.push({ blockType, ...result });
        
        if (!result.success) {
          errors.push(`${blockType}: ${result.message}`);
        }
      });

      return {
        success: errors.length === 0,
        results,
        errors,
        imported: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      };
    } catch (error) {
      logger.error("Error importing all blocks", {
        error: error.message
      });
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = new BlockManagementService();
