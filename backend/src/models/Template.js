const mongoose = require("mongoose");

// Blok şeması - esnek ve genişletilebilir
const blockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: [
        "text",
        "heading",
        "image",
        "table",
        "spacer",
        "divider",
        "customer",
        "company",
        "pricing",
        "signature",
      ],
    },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    styles: { type: mongoose.Schema.Types.Mixed, default: {} },
    position: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

// Global stil şeması
const globalStylesSchema = new mongoose.Schema(
  {
    primaryColor: { type: String, default: "#4f46e5" },
    secondaryColor: { type: String, default: "#7c3aed" },
    fontFamily: { type: String, default: "Inter, sans-serif" },
    fontSize: { type: Number, default: 16 },
    lineHeight: { type: Number, default: 1.5 },
    backgroundColor: { type: String, default: "#ffffff" },
    textColor: { type: String, default: "#1f2937" },
    borderRadius: { type: Number, default: 8 },
    spacing: { type: Number, default: 16 },
  },
  { _id: false }
);

// Canvas boyut şeması
const canvasSizeSchema = new mongoose.Schema(
  {
    width: { type: Number, default: 800 },
    height: { type: Number, default: 1000 },
    unit: { type: String, default: "px" },
  },
  { _id: false }
);

// Sürüm geçmişi şeması
const versionHistorySchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    blocks: [blockSchema],
    globalStyles: globalStylesSchema,
    canvasSize: canvasSizeSchema,
    changeDescription: { type: String, default: "" },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Paylaşım izinleri şeması
const sharingPermissionsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    permission: {
      type: String,
      enum: ["view", "edit", "admin"],
      default: "view",
    },
    sharedAt: { type: Date, default: Date.now },
    sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, default: "custom" },
    previewImageUrl: { type: String, default: "" },

    // Yeni blok editörü alanları
    blocks: [blockSchema],
    globalStyles: globalStylesSchema,
    canvasSize: canvasSizeSchema,

    // Eski sistem uyumluluğu için
    ejsFile: { type: String, default: "" },
    structure: { type: mongoose.Schema.Types.Mixed, default: {} },
    design: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Sahiplik ve erişim
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublic: { type: Boolean, default: false },
    sharingPermissions: [sharingPermissionsSchema],

    // Sürüm kontrolü
    version: { type: Number, default: 1 },
    versionHistory: [versionHistorySchema],
    maxVersions: { type: Number, default: 50 },

    // Durum ve meta bilgiler
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    tags: [{ type: String }],
    isTemplate: { type: Boolean, default: false }, // Sistem şablonu mu, kullanıcı şablonu mu

    // İlişki takibi
    relationships: {
      usedInProposals: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Proposal" },
      ],
      forkedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Template" },
      forks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Template" }],
      categories: [{ type: String, trim: true }],
      relatedTemplates: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Template" },
      ],
    },

    // İstatistikler
    usageCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date },

    // Audit
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    minimize: false,
    timestamps: true,
  }
);

// Pre-save middleware
templateSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Sürüm geçmişine ekle
  if (
    this.isModified("blocks") ||
    this.isModified("globalStyles") ||
    this.isModified("canvasSize")
  ) {
    this.addToVersionHistory();
  }

  next();
});

// Sürüm geçmişine ekleme metodu
templateSchema.methods.addToVersionHistory = function (
  changeDescription = "Otomatik kayıt"
) {
  const versionData = {
    version: this.version,
    blocks: this.blocks,
    globalStyles: this.globalStyles,
    canvasSize: this.canvasSize,
    changeDescription,
    changedBy: this.updatedBy || this.createdBy,
    changedAt: new Date(),
  };

  this.versionHistory.push(versionData);

  // Maksimum sürüm sayısını kontrol et
  if (this.versionHistory.length > this.maxVersions) {
    this.versionHistory.shift();
  }

  this.version += 1;
};

// Belirli bir sürüme geri dönme metodu
templateSchema.methods.revertToVersion = function (versionNumber) {
  const version = this.versionHistory.find((v) => v.version === versionNumber);
  if (!version) {
    throw new Error(`Sürüm ${versionNumber} bulunamadı`);
  }

  this.blocks = version.blocks;
  this.globalStyles = version.globalStyles;
  this.canvasSize = version.canvasSize;
  this.addToVersionHistory(`Sürüm ${versionNumber}'a geri dönüldü`);
};

// Blok ekleme metodu
templateSchema.methods.addBlock = function (block, position = null) {
  if (position !== null) {
    this.blocks.splice(position, 0, block);
  } else {
    this.blocks.push(block);
  }
  this.addToVersionHistory(`Blok eklendi: ${block.type}`);
};

// Blok güncelleme metodu
templateSchema.methods.updateBlock = function (blockId, updates) {
  const blockIndex = this.blocks.findIndex((block) => block.id === blockId);
  if (blockIndex === -1) {
    throw new Error(`Blok bulunamadı: ${blockId}`);
  }

  this.blocks[blockIndex] = { ...this.blocks[blockIndex], ...updates };
  this.addToVersionHistory(`Blok güncellendi: ${blockId}`);
};

// Blok silme metodu
templateSchema.methods.removeBlock = function (blockId) {
  const blockIndex = this.blocks.findIndex((block) => block.id === blockId);
  if (blockIndex === -1) {
    throw new Error(`Blok bulunamadı: ${blockId}`);
  }

  const removedBlock = this.blocks.splice(blockIndex, 1)[0];
  this.addToVersionHistory(`Blok silindi: ${removedBlock.type}`);
};

// Blok sıralama metodu
templateSchema.methods.reorderBlocks = function (fromIndex, toIndex) {
  const [movedBlock] = this.blocks.splice(fromIndex, 1);
  this.blocks.splice(toIndex, 0, movedBlock);
  this.addToVersionHistory(`Bloklar yeniden sıralandı`);
};

// Paylaşım izni ekleme metodu
templateSchema.methods.addSharingPermission = function (
  userId,
  permission,
  sharedBy
) {
  const existingPermission = this.sharingPermissions.find(
    (p) => p.userId.toString() === userId.toString()
  );

  if (existingPermission) {
    existingPermission.permission = permission;
    existingPermission.sharedAt = new Date();
    existingPermission.sharedBy = sharedBy;
  } else {
    this.sharingPermissions.push({
      userId,
      permission,
      sharedBy,
      sharedAt: new Date(),
    });
  }
};

// Paylaşım izni kaldırma metodu
templateSchema.methods.removeSharingPermission = function (userId) {
  this.sharingPermissions = this.sharingPermissions.filter(
    (p) => p.userId.toString() !== userId.toString()
  );
};

// Kullanıcının erişim iznini kontrol etme metodu
templateSchema.methods.hasAccess = function (
  userId,
  requiredPermission = "view"
) {
  if (!userId) return false;

  // Sahip her zaman erişebilir (owner olabilirliğini kontrol et)
  if (this.owner && this.owner.toString() === userId.toString()) {
    return true;
  }

  // Public şablonlar için view izni
  if (this.isPublic && requiredPermission === "view") {
    return true;
  }

  // Paylaşım izinlerini kontrol et (güvenli erişim)
  const permission = (this.sharingPermissions || []).find(
    (p) => p.userId && p.userId.toString() === userId.toString()
  );
  if (!permission) {
    return false;
  }

  const permissionLevels = { view: 1, edit: 2, admin: 3 };
  const userLevel = permissionLevels[permission.permission] || 0;
  const requiredLevel = permissionLevels[requiredPermission] || 0;
  return userLevel >= requiredLevel;
};

// Kullanım sayısını artırma metodu
templateSchema.methods.incrementUsage = function () {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
};

// İlişki ekleme metodu
templateSchema.methods.addRelationship = function (type, itemId) {
  if (!this.relationships[type]) {
    this.relationships[type] = [];
  }

  if (!this.relationships[type].includes(itemId)) {
    this.relationships[type].push(itemId);
  }
};

// İlişki kaldırma metodu
templateSchema.methods.removeRelationship = function (type, itemId) {
  if (this.relationships[type]) {
    this.relationships[type] = this.relationships[type].filter(
      (id) => id.toString() !== itemId.toString()
    );
  }
};

// İlişki kontrolü metodu
templateSchema.methods.hasRelationship = function (type, itemId) {
  if (!this.relationships[type]) return false;
  return this.relationships[type].includes(itemId);
};

// Şablonu fork etme metodu
templateSchema.methods.fork = function (newOwnerId) {
  const forkedTemplate = this.toObject();
  delete forkedTemplate._id;
  delete forkedTemplate.createdAt;
  delete forkedTemplate.updatedAt;
  delete forkedTemplate.usageCount;
  delete forkedTemplate.lastUsedAt;

  forkedTemplate.owner = newOwnerId;
  forkedTemplate.forkedFrom = this._id;
  forkedTemplate.isTemplate = false;
  forkedTemplate.status = "draft";
  forkedTemplate.relationships = {
    usedInProposals: [],
    forkedFrom: this._id,
    forks: [],
    categories: [...(this.relationships?.categories || [])],
    relatedTemplates: [],
  };

  return forkedTemplate;
};

// İlgili şablonları getirme metodu
templateSchema.methods.getRelatedTemplates = function () {
  return this.relationships.relatedTemplates || [];
};

// Kategori ekleme metodu
templateSchema.methods.addCategory = function (category) {
  if (!this.relationships.categories) {
    this.relationships.categories = [];
  }

  if (!this.relationships.categories.includes(category)) {
    this.relationships.categories.push(category);
  }
};

// Index'ler
templateSchema.index({ owner: 1, status: 1 });
templateSchema.index({ isPublic: 1, status: 1 });
templateSchema.index({ category: 1 });
templateSchema.index({ tags: 1 });
templateSchema.index({ "sharingPermissions.userId": 1 });
templateSchema.index({ createdAt: -1 });
templateSchema.index({ updatedAt: -1 });

module.exports = mongoose.model("Template", templateSchema);
