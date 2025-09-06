const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  unit: {
    type: String,
    default: "adet",
    enum: ["adet", "kg", "m", "m²", "m³", "lt", "paket", "set"],
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  // İlişki takibi
  relationships: {
    usedInProposals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Proposal" }],
    usedInTemplates: [{ type: mongoose.Schema.Types.ObjectId, ref: "Template" }],
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    tags: [{ type: String, trim: true }],
    categories: [{ type: String, trim: true }],
  },
  
  // Meta bilgiler
  metadata: {
    sku: { type: String, unique: true, sparse: true },
    barcode: { type: String },
    weight: { type: Number },
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number }
    },
    supplier: { type: String },
    notes: { type: String },
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index'ler
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ createdBy: 1 });

// Pre-save middleware
productSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// İlişki ekleme metodu
productSchema.methods.addRelationship = function (type, itemId) {
  if (!this.relationships[type]) {
    this.relationships[type] = [];
  }
  
  if (!this.relationships[type].includes(itemId)) {
    this.relationships[type].push(itemId);
  }
};

// İlişki kaldırma metodu
productSchema.methods.removeRelationship = function (type, itemId) {
  if (this.relationships[type]) {
    this.relationships[type] = this.relationships[type].filter(
      id => id.toString() !== itemId.toString()
    );
  }
};

// İlişki kontrolü metodu
productSchema.methods.hasRelationship = function (type, itemId) {
  if (!this.relationships[type]) return false;
  return this.relationships[type].includes(itemId);
};

// Kategori ekleme metodu
productSchema.methods.addCategory = function (category) {
  if (!this.relationships.categories) {
    this.relationships.categories = [];
  }
  
  if (!this.relationships.categories.includes(category)) {
    this.relationships.categories.push(category);
  }
};

// Tag ekleme metodu
productSchema.methods.addTag = function (tag) {
  if (!this.relationships.tags) {
    this.relationships.tags = [];
  }
  
  if (!this.relationships.tags.includes(tag)) {
    this.relationships.tags.push(tag);
  }
};

// Meta bilgi güncelleme metodu
productSchema.methods.updateMetadata = function (metadata) {
  this.metadata = { ...this.metadata, ...metadata };
};

// Ürün kullanım istatistiklerini getirme metodu
productSchema.methods.getUsageStats = function () {
  return {
    usedInProposals: this.relationships?.usedInProposals?.length || 0,
    usedInTemplates: this.relationships?.usedInTemplates?.length || 0,
    totalUsage: (this.relationships?.usedInProposals?.length || 0) + 
                (this.relationships?.usedInTemplates?.length || 0)
  };
};

module.exports = mongoose.model("Product", productSchema);
