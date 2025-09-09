const Template = require("../models/Template");
const logger = require("../config/logger");

class VersionControlService {
  /**
   * Şablonun sürüm geçmişini getir
   */
  static async getVersionHistory(templateId, userId) {
    try {
      const template = await Template.findById(templateId);
      
      if (!template) {
        throw new Error("Şablon bulunamadı");
      }

      if (!template.hasAccess(userId, "view")) {
        throw new Error("Bu şablonun sürüm geçmişine erişim izniniz yok");
      }

      return {
        versions: template.versionHistory,
        currentVersion: template.version,
        totalVersions: template.versionHistory.length,
        maxVersions: template.maxVersions
      };
    } catch (error) {
      logger.error("Error getting version history", {
        error: error.message,
        templateId,
        userId
      });
      throw error;
    }
  }

  /**
   * Belirli bir sürümün detaylarını getir
   */
  static async getVersionDetails(templateId, versionNumber, userId) {
    try {
      const template = await Template.findById(templateId);
      
      if (!template) {
        throw new Error("Şablon bulunamadı");
      }

      if (!template.hasAccess(userId, "view")) {
        throw new Error("Bu şablonun sürüm detaylarına erişim izniniz yok");
      }

      const version = template.versionHistory.find(v => v.version === versionNumber);
      
      if (!version) {
        throw new Error(`Sürüm ${versionNumber} bulunamadı`);
      }

      return {
        version: version.version,
        blocks: version.blocks,
        globalStyles: version.globalStyles,
        canvasSize: version.canvasSize,
        changeDescription: version.changeDescription,
        changedBy: version.changedBy,
        changedAt: version.changedAt,
        isCurrentVersion: version.version === template.version
      };
    } catch (error) {
      logger.error("Error getting version details", {
        error: error.message,
        templateId,
        versionNumber,
        userId
      });
      throw error;
    }
  }

  /**
   * Şablonu belirli bir sürüme geri döndür
   */
  static async revertToVersion(templateId, versionNumber, userId, changeDescription = null) {
    try {
      const template = await Template.findById(templateId);
      
      if (!template) {
        throw new Error("Şablon bulunamadı");
      }

      if (!template.hasAccess(userId, "edit")) {
        throw new Error("Bu şablonu sürüme geri döndürme izniniz yok");
      }

      const version = template.versionHistory.find(v => v.version === versionNumber);
      
      if (!version) {
        throw new Error(`Sürüm ${versionNumber} bulunamadı`);
      }

      // Mevcut durumu yedekle
      const currentState = {
        blocks: template.blocks,
        globalStyles: template.globalStyles,
        canvasSize: template.canvasSize
      };

      // Sürüme geri dön
      template.revertToVersion(versionNumber);
      template.updatedBy = userId;

      // Özel geri dönüş açıklaması ekle
      if (changeDescription) {
        const lastVersion = template.versionHistory[template.versionHistory.length - 1];
        lastVersion.changeDescription = changeDescription;
      }

      await template.save();

      logger.info("Template reverted to version", {
        templateId,
        versionNumber,
        userId,
        previousVersion: template.version - 1
      });

      return {
        template,
        revertedFrom: currentState,
        revertedTo: {
          blocks: version.blocks,
          globalStyles: version.globalStyles,
          canvasSize: version.canvasSize
        }
      };
    } catch (error) {
      logger.error("Error reverting to version", {
        error: error.message,
        templateId,
        versionNumber,
        userId
      });
      throw error;
    }
  }

  /**
   * Sürüm geçmişini temizle (eski sürümleri sil)
   */
  static async cleanupVersionHistory(templateId, userId, keepVersions = 10) {
    try {
      const template = await Template.findById(templateId);
      
      if (!template) {
        throw new Error("Şablon bulunamadı");
      }

      if (!template.hasAccess(userId, "admin")) {
        throw new Error("Sürüm geçmişini temizleme izniniz yok");
      }

      const originalLength = template.versionHistory.length;
      
      if (originalLength <= keepVersions) {
        return {
          message: "Temizlenecek sürüm bulunmuyor",
          removedCount: 0,
          remainingCount: originalLength
        };
      }

      // En son N sürümü koru
      template.versionHistory = template.versionHistory.slice(-keepVersions);
      template.maxVersions = keepVersions;
      
      await template.save();

      const removedCount = originalLength - template.versionHistory.length;

      logger.info("Version history cleaned up", {
        templateId,
        userId,
        removedCount,
        remainingCount: template.versionHistory.length
      });

      return {
        message: `${removedCount} sürüm temizlendi`,
        removedCount,
        remainingCount: template.versionHistory.length
      };
    } catch (error) {
      logger.error("Error cleaning up version history", {
        error: error.message,
        templateId,
        userId
      });
      throw error;
    }
  }

  /**
   * Sürüm karşılaştırması yap
   */
  static async compareVersions(templateId, version1, version2, userId) {
    try {
      const template = await Template.findById(templateId);
      
      if (!template) {
        throw new Error("Şablon bulunamadı");
      }

      if (!template.hasAccess(userId, "view")) {
        throw new Error("Sürüm karşılaştırması yapma izniniz yok");
      }

      const v1 = template.versionHistory.find(v => v.version === version1);
      const v2 = template.versionHistory.find(v => v.version === version2);

      if (!v1 || !v2) {
        throw new Error("Belirtilen sürümlerden biri bulunamadı");
      }

      const differences = this.findDifferences(v1, v2);

      return {
        version1: {
          version: v1.version,
          changedAt: v1.changedAt,
          changedBy: v1.changedBy,
          changeDescription: v1.changeDescription
        },
        version2: {
          version: v2.version,
          changedAt: v2.changedAt,
          changedBy: v2.changedBy,
          changeDescription: v2.changeDescription
        },
        differences
      };
    } catch (error) {
      logger.error("Error comparing versions", {
        error: error.message,
        templateId,
        version1,
        version2,
        userId
      });
      throw error;
    }
  }

  /**
   * İki sürüm arasındaki farkları bul
   */
  static findDifferences(version1, version2) {
    const differences = {
      blocks: {
        added: [],
        removed: [],
        modified: []
      },
      globalStyles: {},
      canvasSize: {}
    };

    // Blok farklarını bul
    const blocks1 = version1.blocks || [];
    const blocks2 = version2.blocks || [];

    // Eklenen bloklar
    differences.blocks.added = blocks2.filter(
      block2 => !blocks1.some(block1 => block1.id === block2.id)
    );

    // Silinen bloklar
    differences.blocks.removed = blocks1.filter(
      block1 => !blocks2.some(block2 => block2.id === block1.id)
    );

    // Değiştirilen bloklar
    differences.blocks.modified = blocks1
      .filter(block1 => blocks2.some(block2 => block2.id === block1.id))
      .map(block1 => {
        const block2 = blocks2.find(b => b.id === block1.id);
        const blockDifferences = this.compareObjects(block1, block2);
        return {
          id: block1.id,
          type: block1.type,
          differences: blockDifferences
        };
      })
      .filter(block => Object.keys(block.differences).length > 0);

    // Global stil farkları
    differences.globalStyles = this.compareObjects(
      version1.globalStyles || {},
      version2.globalStyles || {}
    );

    // Canvas boyut farkları
    differences.canvasSize = this.compareObjects(
      version1.canvasSize || {},
      version2.canvasSize || {}
    );

    return differences;
  }

  /**
   * İki objeyi karşılaştır ve farkları döndür
   */
  static compareObjects(obj1, obj2) {
    const differences = {};
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    for (const key of allKeys) {
      if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        differences[key] = {
          old: obj1[key],
          new: obj2[key]
        };
      }
    }

    return differences;
  }

  /**
   * Sürüm istatistiklerini getir
   */
  static async getVersionStats(templateId, userId) {
    try {
      const template = await Template.findById(templateId);
      
      if (!template) {
        throw new Error("Şablon bulunamadı");
      }

      if (!template.hasAccess(userId, "view")) {
        throw new Error("Sürüm istatistiklerine erişim izniniz yok");
      }

      const versionHistory = template.versionHistory;
      const totalVersions = versionHistory.length;
      
      // Son 30 gün içindeki değişiklikler
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentChanges = versionHistory.filter(
        v => new Date(v.changedAt) > thirtyDaysAgo
      ).length;

      // En aktif kullanıcılar
      const userActivity = {};
      versionHistory.forEach(version => {
        if (version.changedBy) {
          const userId = version.changedBy.toString();
          userActivity[userId] = (userActivity[userId] || 0) + 1;
        }
      });

      const mostActiveUsers = Object.entries(userActivity)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([userId, count]) => ({ userId, changeCount: count }));

      // En çok değişen blok türleri
      const blockTypeChanges = {};
      versionHistory.forEach(version => {
        if (version.blocks) {
          version.blocks.forEach(block => {
            blockTypeChanges[block.type] = (blockTypeChanges[block.type] || 0) + 1;
          });
        }
      });

      const mostChangedBlockTypes = Object.entries(blockTypeChanges)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([type, count]) => ({ type, changeCount: count }));

      return {
        totalVersions,
        recentChanges,
        mostActiveUsers,
        mostChangedBlockTypes,
        averageChangesPerDay: recentChanges / 30,
        versionHistorySize: JSON.stringify(versionHistory).length
      };
    } catch (error) {
      logger.error("Error getting version stats", {
        error: error.message,
        templateId,
        userId
      });
      throw error;
    }
  }

  /**
   * Sürüm yedekleme (export)
   */
  static async exportVersion(templateId, versionNumber, userId) {
    try {
      const template = await Template.findById(templateId);
      
      if (!template) {
        throw new Error("Şablon bulunamadı");
      }

      if (!template.hasAccess(userId, "view")) {
        throw new Error("Sürüm yedekleme izniniz yok");
      }

      const version = template.versionHistory.find(v => v.version === versionNumber);
      
      if (!version) {
        throw new Error(`Sürüm ${versionNumber} bulunamadı`);
      }

      const exportData = {
        templateId: template._id,
        templateName: template.name,
        version: version.version,
        exportedAt: new Date(),
        exportedBy: userId,
        data: {
          blocks: version.blocks,
          globalStyles: version.globalStyles,
          canvasSize: version.canvasSize
        },
        metadata: {
          changeDescription: version.changeDescription,
          changedBy: version.changedBy,
          changedAt: version.changedAt
        }
      };

      return exportData;
    } catch (error) {
      logger.error("Error exporting version", {
        error: error.message,
        templateId,
        versionNumber,
        userId
      });
      throw error;
    }
  }
}

module.exports = VersionControlService;
