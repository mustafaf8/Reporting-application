const Template = require("../models/Template");
const blockManagementService = require("./blockManagementService");
const logger = require("../config/logger");

class BulkOperationsService {
  /**
   * Birden fazla blok işlemi gerçekleştir
   */
  async executeBulkOperations(templateId, operations, userId) {
    try {
      const template = await Template.findById(templateId);
      
      if (!template) {
        throw new Error("Şablon bulunamadı");
      }

      if (!template.hasAccess(userId, "edit")) {
        throw new Error("Bu şablonu düzenleme izniniz yok");
      }

      const results = {
        success: [],
        failed: [],
        total: operations.length
      };

      // İşlemleri sırayla gerçekleştir
      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        
        try {
          const result = await this.executeOperation(template, operation, userId);
          results.success.push({
            index: i,
            operation: operation.type,
            result
          });
        } catch (error) {
          results.failed.push({
            index: i,
            operation: operation.type,
            error: error.message
          });
        }
      }

      // Değişiklikleri kaydet
      if (results.success.length > 0) {
        template.addToVersionHistory(`Toplu işlem: ${results.success.length} işlem başarılı`);
        template.updatedBy = userId;
        await template.save();
      }

      return {
        success: results.failed.length === 0,
        results,
        summary: {
          total: results.total,
          successful: results.success.length,
          failed: results.failed.length
        }
      };
    } catch (error) {
      logger.error("Error executing bulk operations", {
        error: error.message,
        templateId,
        userId,
        operationsCount: operations.length
      });
      throw error;
    }
  }

  /**
   * Tek bir işlemi gerçekleştir
   */
  async executeOperation(template, operation, userId) {
    const { type, data } = operation;

    switch (type) {
      case "add":
        return await this.addBlock(template, data);
      
      case "update":
        return await this.updateBlock(template, data);
      
      case "delete":
        return await this.deleteBlock(template, data);
      
      case "reorder":
        return await this.reorderBlocks(template, data);
      
      case "duplicate":
        return await this.duplicateBlock(template, data);
      
      case "move":
        return await this.moveBlock(template, data);
      
      case "copy":
        return await this.copyBlock(template, data);
      
      case "replace":
        return await this.replaceBlock(template, data);
      
      case "batch_update":
        return await this.batchUpdateBlocks(template, data);
      
      case "batch_delete":
        return await this.batchDeleteBlocks(template, data);
      
      case "batch_add":
        return await this.batchAddBlocks(template, data);
      
      case "import_blocks":
        return await this.importBlocks(template, data);
      
      case "export_blocks":
        return await this.exportBlocks(template, data);
      
      case "validate_blocks":
        return await this.validateBlocks(template, data);
      
      case "update_styles":
        return await this.updateStyles(template, data);
      
      case "update_content":
        return await this.updateContent(template, data);
      
      default:
        throw new Error(`Bilinmeyen işlem türü: ${type}`);
    }
  }

  /**
   * Blok ekleme
   */
  async addBlock(template, data) {
    const { block, position } = data;
    
    if (!block || !block.type) {
      throw new Error("Blok verisi ve türü gerekli");
    }

    // Blok türünü validate et
    const validation = await blockManagementService.validateBlock(block.type, block);
    if (!validation.valid) {
      throw new Error(`Blok validasyon hatası: ${validation.errors.join(", ")}`);
    }

    // Blok ID'si yoksa oluştur
    if (!block.id) {
      block.id = this.generateBlockId();
    }

    // Pozisyon belirtilmişse o konuma ekle, yoksa sona ekle
    if (position !== undefined && position >= 0) {
      template.blocks.splice(position, 0, block);
    } else {
      template.blocks.push(block);
    }

    return {
      blockId: block.id,
      position: position !== undefined ? position : template.blocks.length - 1,
      message: "Blok başarıyla eklendi"
    };
  }

  /**
   * Blok güncelleme
   */
  async updateBlock(template, data) {
    const { blockId, updates } = data;
    
    if (!blockId) {
      throw new Error("Blok ID'si gerekli");
    }

    const blockIndex = template.blocks.findIndex(block => block.id === blockId);
    if (blockIndex === -1) {
      throw new Error(`Blok bulunamadı: ${blockId}`);
    }

    const originalBlock = template.blocks[blockIndex];
    const updatedBlock = { ...originalBlock, ...updates };

    // Güncellenmiş bloku validate et
    const validation = await blockManagementService.validateBlock(updatedBlock.type, updatedBlock);
    if (!validation.valid) {
      throw new Error(`Blok validasyon hatası: ${validation.errors.join(", ")}`);
    }

    template.blocks[blockIndex] = updatedBlock;

    return {
      blockId,
      position: blockIndex,
      message: "Blok başarıyla güncellendi"
    };
  }

  /**
   * Blok silme
   */
  async deleteBlock(template, data) {
    const { blockId } = data;
    
    if (!blockId) {
      throw new Error("Blok ID'si gerekli");
    }

    const blockIndex = template.blocks.findIndex(block => block.id === blockId);
    if (blockIndex === -1) {
      throw new Error(`Blok bulunamadı: ${blockId}`);
    }

    const removedBlock = template.blocks.splice(blockIndex, 1)[0];

    return {
      blockId,
      position: blockIndex,
      blockType: removedBlock.type,
      message: "Blok başarıyla silindi"
    };
  }

  /**
   * Blok sıralama
   */
  async reorderBlocks(template, data) {
    const { blockIds, newOrder } = data;
    
    if (!Array.isArray(blockIds) || !Array.isArray(newOrder)) {
      throw new Error("Blok ID'leri ve yeni sıralama gerekli");
    }

    if (blockIds.length !== newOrder.length) {
      throw new Error("Blok ID'leri ve sıralama uzunlukları eşleşmiyor");
    }

    const reorderedBlocks = [];
    const remainingBlocks = [...template.blocks];

    // Yeni sıraya göre blokları yeniden düzenle
    for (let i = 0; i < newOrder.length; i++) {
      const blockId = blockIds[i];
      const newPosition = newOrder[i];
      
      const blockIndex = remainingBlocks.findIndex(block => block.id === blockId);
      if (blockIndex === -1) {
        throw new Error(`Blok bulunamadı: ${blockId}`);
      }

      const block = remainingBlocks.splice(blockIndex, 1)[0];
      reorderedBlocks[newPosition] = block;
    }

    // Kalan blokları sona ekle
    reorderedBlocks.push(...remainingBlocks);

    template.blocks = reorderedBlocks;

    return {
      reorderedCount: blockIds.length,
      message: "Bloklar başarıyla yeniden sıralandı"
    };
  }

  /**
   * Blok kopyalama
   */
  async duplicateBlock(template, data) {
    const { blockId, position } = data;
    
    if (!blockId) {
      throw new Error("Blok ID'si gerekli");
    }

    const blockIndex = template.blocks.findIndex(block => block.id === blockId);
    if (blockIndex === -1) {
      throw new Error(`Blok bulunamadı: ${blockId}`);
    }

    const originalBlock = template.blocks[blockIndex];
    const duplicatedBlock = {
      ...originalBlock,
      id: this.generateBlockId(),
      metadata: {
        ...originalBlock.metadata,
        duplicatedFrom: blockId,
        duplicatedAt: new Date()
      }
    };

    // Pozisyon belirtilmişse o konuma ekle, yoksa orijinal bloktan sonra ekle
    const insertPosition = position !== undefined ? position : blockIndex + 1;
    template.blocks.splice(insertPosition, 0, duplicatedBlock);

    return {
      originalBlockId: blockId,
      newBlockId: duplicatedBlock.id,
      position: insertPosition,
      message: "Blok başarıyla kopyalandı"
    };
  }

  /**
   * Blok taşıma
   */
  async moveBlock(template, data) {
    const { blockId, fromPosition, toPosition } = data;
    
    if (!blockId || fromPosition === undefined || toPosition === undefined) {
      throw new Error("Blok ID'si, kaynak ve hedef pozisyon gerekli");
    }

    if (fromPosition === toPosition) {
      return {
        blockId,
        position: toPosition,
        message: "Blok zaten doğru pozisyonda"
      };
    }

    const block = template.blocks[fromPosition];
    if (!block || block.id !== blockId) {
      throw new Error(`Blok bulunamadı: ${blockId} at position ${fromPosition}`);
    }

    // Bloku kaldır ve yeni pozisyona ekle
    template.blocks.splice(fromPosition, 1);
    template.blocks.splice(toPosition, 0, block);

    return {
      blockId,
      fromPosition,
      toPosition,
      message: "Blok başarıyla taşındı"
    };
  }

  /**
   * Blok kopyalama (farklı template'e)
   */
  async copyBlock(template, data) {
    const { blockId, targetTemplateId } = data;
    
    if (!blockId || !targetTemplateId) {
      throw new Error("Blok ID'si ve hedef template ID'si gerekli");
    }

    const blockIndex = template.blocks.findIndex(block => block.id === blockId);
    if (blockIndex === -1) {
      throw new Error(`Blok bulunamadı: ${blockId}`);
    }

    const block = template.blocks[blockIndex];
    const targetTemplate = await Template.findById(targetTemplateId);
    
    if (!targetTemplate) {
      throw new Error("Hedef şablon bulunamadı");
    }

    if (!targetTemplate.hasAccess(template.owner, "edit")) {
      throw new Error("Hedef şablona erişim izniniz yok");
    }

    const copiedBlock = {
      ...block,
      id: this.generateBlockId(),
      metadata: {
        ...block.metadata,
        copiedFrom: blockId,
        copiedFromTemplate: template._id,
        copiedAt: new Date()
      }
    };

    targetTemplate.blocks.push(copiedBlock);
    await targetTemplate.save();

    return {
      blockId,
      targetTemplateId,
      newBlockId: copiedBlock.id,
      message: "Blok başarıyla kopyalandı"
    };
  }

  /**
   * Blok değiştirme
   */
  async replaceBlock(template, data) {
    const { blockId, newBlock } = data;
    
    if (!blockId || !newBlock) {
      throw new Error("Blok ID'si ve yeni blok gerekli");
    }

    const blockIndex = template.blocks.findIndex(block => block.id === blockId);
    if (blockIndex === -1) {
      throw new Error(`Blok bulunamadı: ${blockId}`);
    }

    // Yeni blok ID'si yoksa oluştur
    if (!newBlock.id) {
      newBlock.id = this.generateBlockId();
    }

    // Yeni bloku validate et
    const validation = await blockManagementService.validateBlock(newBlock.type, newBlock);
    if (!validation.valid) {
      throw new Error(`Blok validasyon hatası: ${validation.errors.join(", ")}`);
    }

    const originalBlock = template.blocks[blockIndex];
    template.blocks[blockIndex] = newBlock;

    return {
      originalBlockId: blockId,
      newBlockId: newBlock.id,
      position: blockIndex,
      originalType: originalBlock.type,
      newType: newBlock.type,
      message: "Blok başarıyla değiştirildi"
    };
  }

  /**
   * Toplu blok güncelleme
   */
  async batchUpdateBlocks(template, data) {
    const { updates } = data;
    
    if (!Array.isArray(updates)) {
      throw new Error("Güncelleme listesi gerekli");
    }

    const results = [];
    
    for (const update of updates) {
      try {
        const result = await this.updateBlock(template, update);
        results.push({ success: true, ...result });
      } catch (error) {
        results.push({ 
          success: false, 
          blockId: update.blockId, 
          error: error.message 
        });
      }
    }

    return {
      results,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      message: "Toplu güncelleme tamamlandı"
    };
  }

  /**
   * Toplu blok silme
   */
  async batchDeleteBlocks(template, data) {
    const { blockIds } = data;
    
    if (!Array.isArray(blockIds)) {
      throw new Error("Blok ID listesi gerekli");
    }

    const results = [];
    const remainingBlocks = [...template.blocks];

    for (const blockId of blockIds) {
      const blockIndex = remainingBlocks.findIndex(block => block.id === blockId);
      if (blockIndex !== -1) {
        const removedBlock = remainingBlocks.splice(blockIndex, 1)[0];
        results.push({
          success: true,
          blockId,
          blockType: removedBlock.type,
          message: "Blok silindi"
        });
      } else {
        results.push({
          success: false,
          blockId,
          error: "Blok bulunamadı"
        });
      }
    }

    template.blocks = remainingBlocks;

    return {
      results,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      message: "Toplu silme tamamlandı"
    };
  }

  /**
   * Toplu blok ekleme
   */
  async batchAddBlocks(template, data) {
    const { blocks, position } = data;
    
    if (!Array.isArray(blocks)) {
      throw new Error("Blok listesi gerekli");
    }

    const results = [];
    const insertPosition = position !== undefined ? position : template.blocks.length;

    for (let i = 0; i < blocks.length; i++) {
      try {
        const block = blocks[i];
        if (!block.id) {
          block.id = this.generateBlockId();
        }

        const validation = await blockManagementService.validateBlock(block.type, block);
        if (!validation.valid) {
          throw new Error(`Blok validasyon hatası: ${validation.errors.join(", ")}`);
        }

        template.blocks.splice(insertPosition + i, 0, block);
        results.push({
          success: true,
          blockId: block.id,
          position: insertPosition + i,
          message: "Blok eklendi"
        });
      } catch (error) {
        results.push({
          success: false,
          index: i,
          error: error.message
        });
      }
    }

    return {
      results,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      message: "Toplu ekleme tamamlandı"
    };
  }

  /**
   * Blokları import etme
   */
  async importBlocks(template, data) {
    const { blocks, position, replaceExisting = false } = data;
    
    if (!Array.isArray(blocks)) {
      throw new Error("Blok listesi gerekli");
    }

    if (replaceExisting) {
      template.blocks = [];
    }

    const results = [];
    const insertPosition = position !== undefined ? position : template.blocks.length;

    for (let i = 0; i < blocks.length; i++) {
      try {
        const block = blocks[i];
        if (!block.id) {
          block.id = this.generateBlockId();
        }

        const validation = await blockManagementService.validateBlock(block.type, block);
        if (!validation.valid) {
          throw new Error(`Blok validasyon hatası: ${validation.errors.join(", ")}`);
        }

        template.blocks.splice(insertPosition + i, 0, block);
        results.push({
          success: true,
          blockId: block.id,
          position: insertPosition + i,
          message: "Blok import edildi"
        });
      } catch (error) {
        results.push({
          success: false,
          index: i,
          error: error.message
        });
      }
    }

    return {
      results,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      message: "Bloklar import edildi"
    };
  }

  /**
   * Blokları export etme
   */
  async exportBlocks(template, data) {
    const { blockIds, includeMetadata = true } = data;
    
    let blocksToExport = template.blocks;
    
    if (blockIds && Array.isArray(blockIds)) {
      blocksToExport = template.blocks.filter(block => blockIds.includes(block.id));
    }

    const exportedBlocks = blocksToExport.map(block => {
      const exported = { ...block };
      
      if (!includeMetadata) {
        delete exported.metadata;
      }

      return exported;
    });

    return {
      blocks: exportedBlocks,
      count: exportedBlocks.length,
      templateId: template._id,
      exportedAt: new Date(),
      message: "Bloklar export edildi"
    };
  }

  /**
   * Blokları validate etme
   */
  async validateBlocks(template, data) {
    const { blockIds } = data;
    
    let blocksToValidate = template.blocks;
    
    if (blockIds && Array.isArray(blockIds)) {
      blocksToValidate = template.blocks.filter(block => blockIds.includes(block.id));
    }

    const results = [];
    
    for (const block of blocksToValidate) {
      try {
        const validation = await blockManagementService.validateBlock(block.type, block);
        results.push({
          blockId: block.id,
          blockType: block.type,
          valid: validation.valid,
          errors: validation.errors || []
        });
      } catch (error) {
        results.push({
          blockId: block.id,
          blockType: block.type,
          valid: false,
          errors: [error.message]
        });
      }
    }

    return {
      results,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      message: "Blok validasyonu tamamlandı"
    };
  }

  /**
   * Blok stillerini güncelleme
   */
  async updateStyles(template, data) {
    const { blockIds, styles, merge = true } = data;
    
    if (!Array.isArray(blockIds) || !styles) {
      throw new Error("Blok ID listesi ve stiller gerekli");
    }

    const results = [];
    
    for (const blockId of blockIds) {
      const blockIndex = template.blocks.findIndex(block => block.id === blockId);
      if (blockIndex !== -1) {
        const block = template.blocks[blockIndex];
        
        if (merge) {
          block.styles = { ...block.styles, ...styles };
        } else {
          block.styles = styles;
        }
        
        results.push({
          success: true,
          blockId,
          message: "Stiller güncellendi"
        });
      } else {
        results.push({
          success: false,
          blockId,
          error: "Blok bulunamadı"
        });
      }
    }

    return {
      results,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      message: "Stil güncelleme tamamlandı"
    };
  }

  /**
   * Blok içeriklerini güncelleme
   */
  async updateContent(template, data) {
    const { blockIds, content, merge = true } = data;
    
    if (!Array.isArray(blockIds) || !content) {
      throw new Error("Blok ID listesi ve içerik gerekli");
    }

    const results = [];
    
    for (const blockId of blockIds) {
      const blockIndex = template.blocks.findIndex(block => block.id === blockId);
      if (blockIndex !== -1) {
        const block = template.blocks[blockIndex];
        
        if (merge) {
          block.content = { ...block.content, ...content };
        } else {
          block.content = content;
        }
        
        // Güncellenmiş bloku validate et
        const validation = await blockManagementService.validateBlock(block.type, block);
        if (!validation.valid) {
          results.push({
            success: false,
            blockId,
            error: `Validasyon hatası: ${validation.errors.join(", ")}`
          });
          continue;
        }
        
        results.push({
          success: true,
          blockId,
          message: "İçerik güncellendi"
        });
      } else {
        results.push({
          success: false,
          blockId,
          error: "Blok bulunamadı"
        });
      }
    }

    return {
      results,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      message: "İçerik güncelleme tamamlandı"
    };
  }

  /**
   * Blok ID'si oluştur
   */
  generateBlockId() {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new BulkOperationsService();
