const User = require("../models/User");
const Template = require("../models/Template");
const Proposal = require("../models/Proposal");
const Product = require("../models/Product");
const Asset = require("../models/Asset");
const logger = require("../config/logger");

class RelationshipService {
  /**
   * İki varlık arasında ilişki kurar
   * @param {string} fromType - Kaynak varlık türü (user, template, proposal, product, asset)
   * @param {string} fromId - Kaynak varlık ID'si
   * @param {string} toType - Hedef varlık türü
   * @param {string} toId - Hedef varlık ID'si
   * @param {string} relationshipType - İlişki türü
   * @param {Object} options - Ek seçenekler
   */
  static async createRelationship(fromType, fromId, toType, toId, relationshipType, options = {}) {
    try {
      const fromModel = this.getModel(fromType);
      const toModel = this.getModel(toType);
      
      if (!fromModel || !toModel) {
        throw new Error(`Invalid model type: ${fromType} or ${toType}`);
      }

      // Kaynak varlığı bul
      const fromEntity = await fromModel.findById(fromId);
      if (!fromEntity) {
        throw new Error(`${fromType} not found: ${fromId}`);
      }

      // Hedef varlığı bul
      const toEntity = await toModel.findById(toId);
      if (!toEntity) {
        throw new Error(`${toType} not found: ${toId}`);
      }

      // İlişkiyi ekle
      fromEntity.addRelationship(relationshipType, toId, options);
      await fromEntity.save();

      // Karşılıklı ilişkiyi de ekle (eğer gerekliyse)
      if (options.bidirectional) {
        const reverseRelationshipType = this.getReverseRelationshipType(relationshipType);
        if (reverseRelationshipType) {
          toEntity.addRelationship(reverseRelationshipType, fromId, options);
          await toEntity.save();
        }
      }

      logger.info(`Relationship created: ${fromType}:${fromId} -> ${toType}:${toId} (${relationshipType})`);
      return { success: true, message: "Relationship created successfully" };
    } catch (error) {
      logger.error(`Error creating relationship: ${error.message}`);
      throw error;
    }
  }

  /**
   * İki varlık arasındaki ilişkiyi kaldırır
   * @param {string} fromType - Kaynak varlık türü
   * @param {string} fromId - Kaynak varlık ID'si
   * @param {string} toType - Hedef varlık türü
   * @param {string} toId - Hedef varlık ID'si
   * @param {string} relationshipType - İlişki türü
   * @param {Object} options - Ek seçenekler
   */
  static async removeRelationship(fromType, fromId, toType, toId, relationshipType, options = {}) {
    try {
      const fromModel = this.getModel(fromType);
      const toModel = this.getModel(toType);
      
      if (!fromModel || !toModel) {
        throw new Error(`Invalid model type: ${fromType} or ${toType}`);
      }

      // Kaynak varlığı bul
      const fromEntity = await fromModel.findById(fromId);
      if (!fromEntity) {
        throw new Error(`${fromType} not found: ${fromId}`);
      }

      // Hedef varlığı bul
      const toEntity = await toModel.findById(toId);
      if (!toEntity) {
        throw new Error(`${toType} not found: ${toId}`);
      }

      // İlişkiyi kaldır
      fromEntity.removeRelationship(relationshipType, toId);
      await fromEntity.save();

      // Karşılıklı ilişkiyi de kaldır (eğer gerekliyse)
      if (options.bidirectional) {
        const reverseRelationshipType = this.getReverseRelationshipType(relationshipType);
        if (reverseRelationshipType) {
          toEntity.removeRelationship(reverseRelationshipType, fromId);
          await toEntity.save();
        }
      }

      logger.info(`Relationship removed: ${fromType}:${fromId} -> ${toType}:${toId} (${relationshipType})`);
      return { success: true, message: "Relationship removed successfully" };
    } catch (error) {
      logger.error(`Error removing relationship: ${error.message}`);
      throw error;
    }
  }

  /**
   * İki varlık arasında ilişki olup olmadığını kontrol eder
   * @param {string} fromType - Kaynak varlık türü
   * @param {string} fromId - Kaynak varlık ID'si
   * @param {string} toType - Hedef varlık türü
   * @param {string} toId - Hedef varlık ID'si
   * @param {string} relationshipType - İlişki türü
   */
  static async hasRelationship(fromType, fromId, toType, toId, relationshipType) {
    try {
      const fromModel = this.getModel(fromType);
      
      if (!fromModel) {
        throw new Error(`Invalid model type: ${fromType}`);
      }

      const fromEntity = await fromModel.findById(fromId);
      if (!fromEntity) {
        return false;
      }

      return fromEntity.hasRelationship(relationshipType, toId);
    } catch (error) {
      logger.error(`Error checking relationship: ${error.message}`);
      throw error;
    }
  }

  /**
   * Bir varlığın belirli türdeki tüm ilişkilerini getirir
   * @param {string} entityType - Varlık türü
   * @param {string} entityId - Varlık ID'si
   * @param {string} relationshipType - İlişki türü
   * @param {Object} options - Ek seçenekler (populate, limit, skip)
   */
  static async getRelationships(entityType, entityId, relationshipType, options = {}) {
    try {
      const model = this.getModel(entityType);
      
      if (!model) {
        throw new Error(`Invalid model type: ${entityType}`);
      }

      const entity = await model.findById(entityId);
      if (!entity) {
        throw new Error(`${entityType} not found: ${entityId}`);
      }

      const relationships = entity.relationships?.[relationshipType] || [];
      
      if (options.populate) {
        const populatedRelationships = await model.populate(relationships, options.populate);
        return populatedRelationships;
      }

      return relationships;
    } catch (error) {
      logger.error(`Error getting relationships: ${error.message}`);
      throw error;
    }
  }

  /**
   * Bir varlığın tüm ilişkilerini getirir
   * @param {string} entityType - Varlık türü
   * @param {string} entityId - Varlık ID'si
   * @param {Object} options - Ek seçenekler
   */
  static async getAllRelationships(entityType, entityId, options = {}) {
    try {
      const model = this.getModel(entityType);
      
      if (!model) {
        throw new Error(`Invalid model type: ${entityType}`);
      }

      const entity = await model.findById(entityId);
      if (!entity) {
        throw new Error(`${entityType} not found: ${entityId}`);
      }

      const relationships = entity.relationships || {};
      
      if (options.populate) {
        const populatedRelationships = {};
        for (const [type, ids] of Object.entries(relationships)) {
          if (Array.isArray(ids) && ids.length > 0) {
            populatedRelationships[type] = await model.populate(ids, options.populate);
          } else {
            populatedRelationships[type] = ids;
          }
        }
        return populatedRelationships;
      }

      return relationships;
    } catch (error) {
      logger.error(`Error getting all relationships: ${error.message}`);
      throw error;
    }
  }

  /**
   * İlişki istatistiklerini getirir
   * @param {string} entityType - Varlık türü
   * @param {string} entityId - Varlık ID'si
   */
  static async getRelationshipStats(entityType, entityId) {
    try {
      const model = this.getModel(entityType);
      
      if (!model) {
        throw new Error(`Invalid model type: ${entityType}`);
      }

      const entity = await model.findById(entityId);
      if (!entity) {
        throw new Error(`${entityType} not found: ${entityId}`);
      }

      const relationships = entity.relationships || {};
      const stats = {};

      for (const [type, ids] of Object.entries(relationships)) {
        if (Array.isArray(ids)) {
          stats[type] = ids.length;
        } else {
          stats[type] = ids ? 1 : 0;
        }
      }

      return stats;
    } catch (error) {
      logger.error(`Error getting relationship stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Model türüne göre Mongoose modelini döndürür
   * @param {string} type - Model türü
   */
  static getModel(type) {
    const models = {
      user: User,
      template: Template,
      proposal: Proposal,
      product: Product,
      asset: Asset
    };
    
    return models[type.toLowerCase()];
  }

  /**
   * İlişki türüne göre ters ilişki türünü döndürür
   * @param {string} relationshipType - İlişki türü
   */
  static getReverseRelationshipType(relationshipType) {
    const reverseMap = {
      'ownedTemplates': 'owner',
      'sharedTemplates': 'sharingPermissions',
      'createdProposals': 'owner',
      'createdProducts': 'createdBy',
      'uploadedAssets': 'owner',
      'usedInProposals': 'template',
      'usedInTemplates': 'products',
      'forks': 'forkedFrom',
      'relatedTemplates': 'relatedTemplates',
      'relatedProposals': 'relatedProposals',
      'relatedProducts': 'relatedProducts'
    };
    
    return reverseMap[relationshipType];
  }

  /**
   * Toplu ilişki işlemleri yapar
   * @param {Array} operations - İşlem listesi
   */
  static async bulkRelationshipOperations(operations) {
    try {
      const results = [];
      
      for (const operation of operations) {
        try {
          let result;
          
          switch (operation.action) {
            case 'create':
              result = await this.createRelationship(
                operation.fromType,
                operation.fromId,
                operation.toType,
                operation.toId,
                operation.relationshipType,
                operation.options
              );
              break;
            case 'remove':
              result = await this.removeRelationship(
                operation.fromType,
                operation.fromId,
                operation.toType,
                operation.toId,
                operation.relationshipType,
                operation.options
              );
              break;
            case 'check':
              result = await this.hasRelationship(
                operation.fromType,
                operation.fromId,
                operation.toType,
                operation.toId,
                operation.relationshipType
              );
              break;
            default:
              throw new Error(`Unknown action: ${operation.action}`);
          }
          
          results.push({ success: true, operation, result });
        } catch (error) {
          results.push({ success: false, operation, error: error.message });
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`Error in bulk relationship operations: ${error.message}`);
      throw error;
    }
  }
}

module.exports = RelationshipService;
