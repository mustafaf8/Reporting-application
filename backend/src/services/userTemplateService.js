const Template = require("../models/Template");
const User = require("../models/User");
const logger = require("../config/logger");

class UserTemplateService {
  /**
   * Kullanıcının kişisel şablonlarını getir
   */
  async getUserTemplates(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        search,
        sortBy = "updatedAt",
        sortOrder = "desc",
        includeSystemTemplates = false
      } = options;

      const query = {
        owner: userId,
        isTemplate: true
      };

      // Sistem şablonlarını dahil et
      if (includeSystemTemplates) {
        query.$or = [
          { owner: userId, isTemplate: true },
          { isTemplate: true, isPublic: true }
        ];
        delete query.owner;
      }

      if (category) {
        query.category = category;
      }

      if (search) {
        query.$and = [
          {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { description: { $regex: search, $options: "i" } },
              { tags: { $in: [new RegExp(search, "i")] } }
            ]
          }
        ];
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

      const skip = (page - 1) * limit;

      const [templates, total] = await Promise.all([
        Template.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate("owner", "name email")
          .lean(),
        Template.countDocuments(query)
      ]);

      return {
        templates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error("Error getting user templates", {
        error: error.message,
        userId,
        options
      });
      throw error;
    }
  }

  /**
   * Kişisel şablon oluştur
   */
  async createUserTemplate(userId, templateData) {
    try {
      const {
        name,
        description = "",
        category = "custom",
        blocks = [],
        globalStyles = {},
        canvasSize = {},
        tags = [],
        isPublic = false,
        previewImageUrl = ""
      } = templateData;

      if (!name) {
        throw new Error("Şablon adı gerekli");
      }

      // Kullanıcının şablon limitini kontrol et
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("Kullanıcı bulunamadı");
      }

      const userTemplatesCount = await Template.countDocuments({
        owner: userId,
        isTemplate: true
      });

      const subscription = user.subscription || { plan: "free" };
      const limits = this.getSubscriptionLimits(subscription.plan);

      if (limits.templates !== -1 && userTemplatesCount >= limits.templates) {
        throw new Error(`Şablon limitiniz aşıldı. Maksimum ${limits.templates} şablon oluşturabilirsiniz.`);
      }

      const template = new Template({
        name,
        description,
        category,
        blocks,
        globalStyles,
        canvasSize,
        tags,
        isPublic,
        previewImageUrl,
        owner: userId,
        isTemplate: true,
        status: "draft",
        createdBy: userId,
        updatedBy: userId
      });

      await template.save();

      logger.info("User template created", {
        templateId: template._id,
        userId,
        name,
        category
      });

      return template;
    } catch (error) {
      logger.error("Error creating user template", {
        error: error.message,
        userId,
        templateData
      });
      throw error;
    }
  }

  /**
   * Kişisel şablonu güncelle
   */
  async updateUserTemplate(templateId, userId, updateData) {
    try {
      const template = await Template.findById(templateId);

      if (!template) {
        throw new Error("Şablon bulunamadı");
      }

      if (template.owner.toString() !== userId.toString()) {
        throw new Error("Bu şablonu güncelleme izniniz yok");
      }

      if (!template.isTemplate) {
        throw new Error("Bu bir kişisel şablon değil");
      }

      // Güncelleme verilerini uygula
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          template[key] = updateData[key];
        }
      });

      template.updatedBy = userId;
      await template.save();

      logger.info("User template updated", {
        templateId,
        userId,
        updatedFields: Object.keys(updateData)
      });

      return template;
    } catch (error) {
      logger.error("Error updating user template", {
        error: error.message,
        templateId,
        userId,
        updateData
      });
      throw error;
    }
  }

  /**
   * Kişisel şablonu sil
   */
  async deleteUserTemplate(templateId, userId) {
    try {
      const template = await Template.findById(templateId);

      if (!template) {
        throw new Error("Şablon bulunamadı");
      }

      if (template.owner.toString() !== userId.toString()) {
        throw new Error("Bu şablonu silme izniniz yok");
      }

      if (!template.isTemplate) {
        throw new Error("Bu bir kişisel şablon değil");
      }

      await Template.findByIdAndDelete(templateId);

      logger.info("User template deleted", {
        templateId,
        userId,
        templateName: template.name
      });

      return { success: true, message: "Şablon başarıyla silindi" };
    } catch (error) {
      logger.error("Error deleting user template", {
        error: error.message,
        templateId,
        userId
      });
      throw error;
    }
  }

  /**
   * Şablonu kişisel şablon olarak kaydet
   */
  async saveAsUserTemplate(templateId, userId, templateData) {
    try {
      const originalTemplate = await Template.findById(templateId);

      if (!originalTemplate) {
        throw new Error("Kaynak şablon bulunamadı");
      }

      // Erişim kontrolü
      if (!originalTemplate.hasAccess(userId, "view")) {
        throw new Error("Bu şablonu kişisel şablon olarak kaydetme izniniz yok");
      }

      const {
        name,
        description = originalTemplate.description,
        category = "custom",
        tags = []
      } = templateData;

      if (!name) {
        throw new Error("Şablon adı gerekli");
      }

      // Kullanıcının şablon limitini kontrol et
      const user = await User.findById(userId);
      const userTemplatesCount = await Template.countDocuments({
        owner: userId,
        isTemplate: true
      });

      const subscription = user.subscription || { plan: "free" };
      const limits = this.getSubscriptionLimits(subscription.plan);

      if (limits.templates !== -1 && userTemplatesCount >= limits.templates) {
        throw new Error(`Şablon limitiniz aşıldı. Maksimum ${limits.templates} şablon oluşturabilirsiniz.`);
      }

      // Yeni kişisel şablon oluştur
      const userTemplate = new Template({
        name,
        description,
        category,
        blocks: originalTemplate.blocks || [],
        globalStyles: originalTemplate.globalStyles || {},
        canvasSize: originalTemplate.canvasSize || {},
        tags,
        owner: userId,
        isTemplate: true,
        isPublic: false,
        status: "draft",
        createdBy: userId,
        updatedBy: userId,
        // Kaynak şablon bilgilerini metadata'da sakla
        metadata: {
          sourceTemplate: originalTemplate._id,
          sourceTemplateName: originalTemplate.name,
          savedAt: new Date()
        }
      });

      await userTemplate.save();

      logger.info("Template saved as user template", {
        originalTemplateId: templateId,
        newTemplateId: userTemplate._id,
        userId,
        name
      });

      return userTemplate;
    } catch (error) {
      logger.error("Error saving template as user template", {
        error: error.message,
        templateId,
        userId,
        templateData
      });
      throw error;
    }
  }

  /**
   * Şablonu kopyala
   */
  async duplicateUserTemplate(templateId, userId, newName) {
    try {
      const originalTemplate = await Template.findById(templateId);

      if (!originalTemplate) {
        throw new Error("Şablon bulunamadı");
      }

      if (originalTemplate.owner.toString() !== userId.toString()) {
        throw new Error("Bu şablonu kopyalama izniniz yok");
      }

      if (!originalTemplate.isTemplate) {
        throw new Error("Bu bir kişisel şablon değil");
      }

      // Kullanıcının şablon limitini kontrol et
      const user = await User.findById(userId);
      const userTemplatesCount = await Template.countDocuments({
        owner: userId,
        isTemplate: true
      });

      const subscription = user.subscription || { plan: "free" };
      const limits = this.getSubscriptionLimits(subscription.plan);

      if (limits.templates !== -1 && userTemplatesCount >= limits.templates) {
        throw new Error(`Şablon limitiniz aşıldı. Maksimum ${limits.templates} şablon oluşturabilirsiniz.`);
      }

      // Şablonu kopyala
      const duplicatedTemplate = new Template({
        ...originalTemplate.toObject(),
        _id: undefined,
        name: newName || `${originalTemplate.name} (Kopya)`,
        owner: userId,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        lastUsedAt: null,
        metadata: {
          ...originalTemplate.metadata,
          duplicatedFrom: originalTemplate._id,
          duplicatedAt: new Date()
        }
      });

      await duplicatedTemplate.save();

      logger.info("User template duplicated", {
        originalTemplateId: templateId,
        newTemplateId: duplicatedTemplate._id,
        userId,
        newName
      });

      return duplicatedTemplate;
    } catch (error) {
      logger.error("Error duplicating user template", {
        error: error.message,
        templateId,
        userId,
        newName
      });
      throw error;
    }
  }

  /**
   * Şablonu paylaş
   */
  async shareUserTemplate(templateId, userId, shareData) {
    try {
      const { isPublic, sharingPermissions = [] } = shareData;

      const template = await Template.findById(templateId);

      if (!template) {
        throw new Error("Şablon bulunamadı");
      }

      if (template.owner.toString() !== userId.toString()) {
        throw new Error("Bu şablonu paylaşma izniniz yok");
      }

      if (!template.isTemplate) {
        throw new Error("Bu bir kişisel şablon değil");
      }

      // Public durumunu güncelle
      if (isPublic !== undefined) {
        template.isPublic = isPublic;
      }

      // Paylaşım izinlerini güncelle
      if (sharingPermissions.length > 0) {
        template.sharingPermissions = sharingPermissions.map(permission => ({
          ...permission,
          sharedBy: userId,
          sharedAt: new Date()
        }));
      }

      template.updatedBy = userId;
      await template.save();

      logger.info("User template shared", {
        templateId,
        userId,
        isPublic,
        sharingPermissionsCount: sharingPermissions.length
      });

      return template;
    } catch (error) {
      logger.error("Error sharing user template", {
        error: error.message,
        templateId,
        userId,
        shareData
      });
      throw error;
    }
  }

  /**
   * Şablonu kategorilere göre grupla
   */
  async getTemplatesByCategory(userId) {
    try {
      const categories = await Template.aggregate([
        {
          $match: {
            owner: userId,
            isTemplate: true
          }
        },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            templates: {
              $push: {
                id: "$_id",
                name: "$name",
                description: "$description",
                previewImageUrl: "$previewImageUrl",
                isPublic: "$isPublic",
                createdAt: "$createdAt",
                updatedAt: "$updatedAt",
                usageCount: "$usageCount"
              }
            }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      return categories;
    } catch (error) {
      logger.error("Error getting templates by category", {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Şablon istatistiklerini getir
   */
  async getTemplateStats(userId) {
    try {
      const stats = await Template.aggregate([
        {
          $match: {
            owner: userId,
            isTemplate: true
          }
        },
        {
          $group: {
            _id: null,
            totalTemplates: { $sum: 1 },
            publicTemplates: {
              $sum: { $cond: [{ $eq: ["$isPublic", true] }, 1, 0] }
            },
            privateTemplates: {
              $sum: { $cond: [{ $eq: ["$isPublic", false] }, 1, 0] }
            },
            totalUsage: { $sum: "$usageCount" },
            averageUsage: { $avg: "$usageCount" },
            mostUsedTemplate: {
              $max: {
                name: "$name",
                usageCount: "$usageCount"
              }
            }
          }
        }
      ]);

      const categoryStats = await Template.aggregate([
        {
          $match: {
            owner: userId,
            isTemplate: true
          }
        },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            usage: { $sum: "$usageCount" }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      return {
        ...stats[0],
        categoryStats
      };
    } catch (error) {
      logger.error("Error getting template stats", {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Şablonu arama
   */
  async searchTemplates(userId, searchQuery, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        tags,
        isPublic
      } = options;

      const query = {
        owner: userId,
        isTemplate: true,
        $or: [
          { name: { $regex: searchQuery, $options: "i" } },
          { description: { $regex: searchQuery, $options: "i" } },
          { tags: { $in: [new RegExp(searchQuery, "i")] } }
        ]
      };

      if (category) {
        query.category = category;
      }

      if (tags && Array.isArray(tags)) {
        query.tags = { $in: tags };
      }

      if (isPublic !== undefined) {
        query.isPublic = isPublic;
      }

      const skip = (page - 1) * limit;

      const [templates, total] = await Promise.all([
        Template.find(query)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("owner", "name email")
          .lean(),
        Template.countDocuments(query)
      ]);

      return {
        templates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        searchQuery
      };
    } catch (error) {
      logger.error("Error searching templates", {
        error: error.message,
        userId,
        searchQuery,
        options
      });
      throw error;
    }
  }

  /**
   * Abonelik planına göre limitleri getir
   */
  getSubscriptionLimits(plan) {
    const limits = {
      free: { templates: 5 },
      basic: { templates: 25 },
      pro: { templates: 100 },
      enterprise: { templates: -1 } // Unlimited
    };

    return limits[plan] || limits.free;
  }

  /**
   * Şablonu kullanım sayısını artır
   */
  async incrementTemplateUsage(templateId, userId) {
    try {
      const template = await Template.findById(templateId);

      if (!template) {
        throw new Error("Şablon bulunamadı");
      }

      if (!template.hasAccess(userId, "view")) {
        throw new Error("Bu şablonu kullanma izniniz yok");
      }

      template.incrementUsage();
      await template.save();

      return template;
    } catch (error) {
      logger.error("Error incrementing template usage", {
        error: error.message,
        templateId,
        userId
      });
      throw error;
    }
  }
}

module.exports = new UserTemplateService();
