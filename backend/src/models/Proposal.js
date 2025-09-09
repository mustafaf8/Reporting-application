const mongoose = require("mongoose");

const proposalItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const proposalSchema = new mongoose.Schema({
  customerName: { type: String, required: true, index: true },
  items: { type: [proposalItemSchema], required: true },
  grandTotal: { type: Number, required: true },
  status: {
    type: String,
    enum: ["draft", "sent", "approved", "rejected"],
    default: "draft",
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  // Yeni alanlar: teklif hangi şablona dayanıyor ve özelleştirmeler
  template: { type: mongoose.Schema.Types.ObjectId, ref: "Template" },
  customizations: { type: mongoose.Schema.Types.Mixed, default: {} },
  vatRate: { type: Number, default: 0 },
  discountRate: { type: Number, default: 0 },
  extraCosts: { type: Number, default: 0 },
  
  // İlişki takibi
  relationships: {
    templateVersion: { type: Number }, // Kullanılan şablonun versiyonu
    forkedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Proposal" },
    forks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Proposal" }],
    relatedProposals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Proposal" }],
    tags: [{ type: String, trim: true }],
    categories: [{ type: String, trim: true }],
  },
  
  // Meta bilgiler
  metadata: {
    clientEmail: { type: String },
    clientPhone: { type: String },
    projectName: { type: String },
    projectDescription: { type: String },
    validUntil: { type: Date },
    notes: { type: String },
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

proposalSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// İlişki ekleme metodu
proposalSchema.methods.addRelationship = function (type, itemId) {
  if (!this.relationships[type]) {
    this.relationships[type] = [];
  }
  
  if (!this.relationships[type].includes(itemId)) {
    this.relationships[type].push(itemId);
  }
};

// İlişki kaldırma metodu
proposalSchema.methods.removeRelationship = function (type, itemId) {
  if (this.relationships[type]) {
    this.relationships[type] = this.relationships[type].filter(
      id => id.toString() !== itemId.toString()
    );
  }
};

// İlişki kontrolü metodu
proposalSchema.methods.hasRelationship = function (type, itemId) {
  if (!this.relationships[type]) return false;
  return this.relationships[type].includes(itemId);
};

// Teklifi fork etme metodu
proposalSchema.methods.fork = function (newOwnerId) {
  const forkedProposal = this.toObject();
  delete forkedProposal._id;
  delete forkedProposal.createdAt;
  delete forkedProposal.updatedAt;
  
  forkedProposal.owner = newOwnerId;
  forkedProposal.forkedFrom = this._id;
  forkedProposal.status = "draft";
  forkedProposal.relationships = {
    templateVersion: this.relationships?.templateVersion,
    forkedFrom: this._id,
    forks: [],
    relatedProposals: [],
    tags: [...(this.relationships?.tags || [])],
    categories: [...(this.relationships?.categories || [])]
  };
  
  return forkedProposal;
};

// Kategori ekleme metodu
proposalSchema.methods.addCategory = function (category) {
  if (!this.relationships.categories) {
    this.relationships.categories = [];
  }
  
  if (!this.relationships.categories.includes(category)) {
    this.relationships.categories.push(category);
  }
};

// Tag ekleme metodu
proposalSchema.methods.addTag = function (tag) {
  if (!this.relationships.tags) {
    this.relationships.tags = [];
  }
  
  if (!this.relationships.tags.includes(tag)) {
    this.relationships.tags.push(tag);
  }
};

// Meta bilgi güncelleme metodu
proposalSchema.methods.updateMetadata = function (metadata) {
  this.metadata = { ...this.metadata, ...metadata };
};

module.exports = mongoose.model("Proposal", proposalSchema);
