const User = require("../models/User");
const Template = require("../models/Template");
const Proposal = require("../models/Proposal");
const Product = require("../models/Product");
const Asset = require("../models/Asset");
const logger = require("../config/logger");

class DatabaseMigrationService {
  /**
   * Mevcut verileri yeni ilişki yapısına göre günceller
   */
  static async migrateToRelationshipStructure() {
    try {
      logger.info("Database migration started: Adding relationship structures");

      // 1. User modelini güncelle
      await this.migrateUsers();
      
      // 2. Template modelini güncelle
      await this.migrateTemplates();
      
      // 3. Proposal modelini güncelle
      await this.migrateProposals();
      
      // 4. Product modelini güncelle
      await this.migrateProducts();
      
      // 5. Asset modelini güncelle
      await this.migrateAssets();

      logger.info("Database migration completed successfully");
      return { success: true, message: "Migration completed successfully" };
    } catch (error) {
      logger.error(`Database migration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * User modelindeki mevcut verileri yeni yapıya göre günceller
   */
  static async migrateUsers() {
    try {
      logger.info("Migrating users...");
      
      const users = await User.find({});
      let updatedCount = 0;

      for (const user of users) {
        // Eğer relationships alanı yoksa ekle
        if (!user.relationships) {
          user.relationships = {
            ownedTemplates: [],
            sharedTemplates: [],
            createdProposals: [],
            createdProducts: [],
            uploadedAssets: [],
            collaborators: []
          };
        }

        // Eğer stats alanı yoksa ekle
        if (!user.stats) {
          user.stats = {
            totalTemplates: 0,
            totalProposals: 0,
            totalProducts: 0,
            totalAssets: 0,
            totalCollaborations: 0,
            lastLogin: null,
            loginCount: 0,
            lastActivity: user.createdAt || new Date()
          };
        }

        await user.save();
        updatedCount++;
      }

      logger.info(`Migrated ${updatedCount} users`);
    } catch (error) {
      logger.error(`Error migrating users: ${error.message}`);
      throw error;
    }
  }

  /**
   * Template modelindeki mevcut verileri yeni yapıya göre günceller
   */
  static async migrateTemplates() {
    try {
      logger.info("Migrating templates...");
      
      const templates = await Template.find({});
      let updatedCount = 0;

      for (const template of templates) {
        // Eğer relationships alanı yoksa ekle
        if (!template.relationships) {
          template.relationships = {
            usedInProposals: [],
            forkedFrom: null,
            forks: [],
            categories: [],
            relatedTemplates: []
          };
        }

        // Eski category alanını yeni yapıya taşı
        if (template.category && !template.relationships.categories.includes(template.category)) {
          template.relationships.categories.push(template.category);
        }

        await template.save();
        updatedCount++;
      }

      logger.info(`Migrated ${updatedCount} templates`);
    } catch (error) {
      logger.error(`Error migrating templates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Proposal modelindeki mevcut verileri yeni yapıya göre günceller
   */
  static async migrateProposals() {
    try {
      logger.info("Migrating proposals...");
      
      const proposals = await Proposal.find({});
      let updatedCount = 0;

      for (const proposal of proposals) {
        // Eğer relationships alanı yoksa ekle
        if (!proposal.relationships) {
          proposal.relationships = {
            templateVersion: null,
            forkedFrom: null,
            forks: [],
            relatedProposals: [],
            tags: [],
            categories: []
          };
        }

        // Eğer metadata alanı yoksa ekle
        if (!proposal.metadata) {
          proposal.metadata = {
            clientEmail: null,
            clientPhone: null,
            projectName: null,
            projectDescription: null,
            validUntil: null,
            notes: null
          };
        }

        await proposal.save();
        updatedCount++;
      }

      logger.info(`Migrated ${updatedCount} proposals`);
    } catch (error) {
      logger.error(`Error migrating proposals: ${error.message}`);
      throw error;
    }
  }

  /**
   * Product modelindeki mevcut verileri yeni yapıya göre günceller
   */
  static async migrateProducts() {
    try {
      logger.info("Migrating products...");
      
      const products = await Product.find({});
      let updatedCount = 0;

      for (const product of products) {
        // Eğer relationships alanı yoksa ekle
        if (!product.relationships) {
          product.relationships = {
            usedInProposals: [],
            usedInTemplates: [],
            relatedProducts: [],
            tags: [],
            categories: []
          };
        }

        // Eski category alanını yeni yapıya taşı
        if (product.category && !product.relationships.categories.includes(product.category)) {
          product.relationships.categories.push(product.category);
        }

        // Eğer metadata alanı yoksa ekle
        if (!product.metadata) {
          product.metadata = {
            sku: null,
            barcode: null,
            weight: null,
            dimensions: {
              length: null,
              width: null,
              height: null
            },
            supplier: null,
            notes: null
          };
        }

        await product.save();
        updatedCount++;
      }

      logger.info(`Migrated ${updatedCount} products`);
    } catch (error) {
      logger.error(`Error migrating products: ${error.message}`);
      throw error;
    }
  }

  /**
   * Asset modelindeki mevcut verileri yeni yapıya göre günceller
   */
  static async migrateAssets() {
    try {
      logger.info("Migrating assets...");
      
      const assets = await Asset.find({});
      let updatedCount = 0;

      for (const asset of assets) {
        // Eğer relationships alanı yoksa ekle
        if (!asset.relationships) {
          asset.relationships = {
            usedInTemplates: [],
            usedInProposals: [],
            relatedAssets: [],
            tags: [],
            categories: []
          };
        }

        await asset.save();
        updatedCount++;
      }

      logger.info(`Migrated ${updatedCount} assets`);
    } catch (error) {
      logger.error(`Error migrating assets: ${error.message}`);
      throw error;
    }
  }

  /**
   * İlişkileri yeniden oluşturur (mevcut referanslara dayalı)
   */
  static async rebuildRelationships() {
    try {
      logger.info("Rebuilding relationships...");

      // Template-Proposal ilişkilerini oluştur
      await this.rebuildTemplateProposalRelationships();
      
      // User-Template ilişkilerini oluştur
      await this.rebuildUserTemplateRelationships();
      
      // User-Proposal ilişkilerini oluştur
      await this.rebuildUserProposalRelationships();
      
      // User-Product ilişkilerini oluştur
      await this.rebuildUserProductRelationships();

      logger.info("Relationships rebuilt successfully");
      return { success: true, message: "Relationships rebuilt successfully" };
    } catch (error) {
      logger.error(`Error rebuilding relationships: ${error.message}`);
      throw error;
    }
  }

  /**
   * Template-Proposal ilişkilerini yeniden oluşturur
   */
  static async rebuildTemplateProposalRelationships() {
    try {
      const proposals = await Proposal.find({ template: { $exists: true } });
      
      for (const proposal of proposals) {
        if (proposal.template) {
          // Template'e proposal referansını ekle
          const template = await Template.findById(proposal.template);
          if (template) {
            template.addRelationship('usedInProposals', proposal._id);
            await template.save();
          }

          // Proposal'a template referansını ekle
          proposal.addRelationship('template', proposal.template);
          await proposal.save();
        }
      }
    } catch (error) {
      logger.error(`Error rebuilding template-proposal relationships: ${error.message}`);
      throw error;
    }
  }

  /**
   * User-Template ilişkilerini yeniden oluşturur
   */
  static async rebuildUserTemplateRelationships() {
    try {
      const templates = await Template.find({ owner: { $exists: true } });
      
      for (const template of templates) {
        if (template.owner) {
          // User'a template referansını ekle
          const user = await User.findById(template.owner);
          if (user) {
            user.addRelationship('ownedTemplates', template._id);
            await user.save();
          }

          // Template'e user referansını ekle
          template.addRelationship('owner', template.owner);
          await template.save();
        }
      }
    } catch (error) {
      logger.error(`Error rebuilding user-template relationships: ${error.message}`);
      throw error;
    }
  }

  /**
   * User-Proposal ilişkilerini yeniden oluşturur
   */
  static async rebuildUserProposalRelationships() {
    try {
      const proposals = await Proposal.find({ owner: { $exists: true } });
      
      for (const proposal of proposals) {
        if (proposal.owner) {
          // User'a proposal referansını ekle
          const user = await User.findById(proposal.owner);
          if (user) {
            user.addRelationship('createdProposals', proposal._id);
            await user.save();
          }

          // Proposal'a user referansını ekle
          proposal.addRelationship('owner', proposal.owner);
          await proposal.save();
        }
      }
    } catch (error) {
      logger.error(`Error rebuilding user-proposal relationships: ${error.message}`);
      throw error;
    }
  }

  /**
   * User-Product ilişkilerini yeniden oluşturur
   */
  static async rebuildUserProductRelationships() {
    try {
      const products = await Product.find({ createdBy: { $exists: true } });
      
      for (const product of products) {
        if (product.createdBy) {
          // User'a product referansını ekle
          const user = await User.findById(product.createdBy);
          if (user) {
            user.addRelationship('createdProducts', product._id);
            await user.save();
          }

          // Product'a user referansını ekle
          product.addRelationship('createdBy', product.createdBy);
          await product.save();
        }
      }
    } catch (error) {
      logger.error(`Error rebuilding user-product relationships: ${error.message}`);
      throw error;
    }
  }

  /**
   * Veritabanı durumunu kontrol eder
   */
  static async checkDatabaseStatus() {
    try {
      const userCount = await User.countDocuments();
      const templateCount = await Template.countDocuments();
      const proposalCount = await Proposal.countDocuments();
      const productCount = await Product.countDocuments();
      const assetCount = await Asset.countDocuments();

      // İlişki yapısı kontrolü
      const usersWithRelationships = await User.countDocuments({ 
        'relationships': { $exists: true } 
      });
      const templatesWithRelationships = await Template.countDocuments({ 
        'relationships': { $exists: true } 
      });
      const proposalsWithRelationships = await Proposal.countDocuments({ 
        'relationships': { $exists: true } 
      });
      const productsWithRelationships = await Product.countDocuments({ 
        'relationships': { $exists: true } 
      });
      const assetsWithRelationships = await Asset.countDocuments({ 
        'relationships': { $exists: true } 
      });

      return {
        counts: {
          users: userCount,
          templates: templateCount,
          proposals: proposalCount,
          products: productCount,
          assets: assetCount
        },
        relationships: {
          users: usersWithRelationships,
          templates: templatesWithRelationships,
          proposals: proposalsWithRelationships,
          products: productsWithRelationships,
          assets: assetsWithRelationships
        },
        migrationStatus: {
          users: usersWithRelationships === userCount,
          templates: templatesWithRelationships === templateCount,
          proposals: proposalsWithRelationships === proposalCount,
          products: productsWithRelationships === productCount,
          assets: assetsWithRelationships === assetCount
        }
      };
    } catch (error) {
      logger.error(`Error checking database status: ${error.message}`);
      throw error;
    }
  }
}

module.exports = DatabaseMigrationService;
