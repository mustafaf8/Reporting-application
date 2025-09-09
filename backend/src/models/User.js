const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  // Kurumsal alanlar (artık birincil değil, isteğe bağlı/deprecated)
  position: { type: String, default: "" },
  // Cloudinary ile saklanan profil resmi
  profileImageUrl: { type: String, default: "" },
  profileImagePublicId: { type: String, default: "" },
  phone: { type: String, default: "" },
  department: { type: String, default: "" },
  company: { type: String, default: "" },
  address: { type: String, default: "" },
  bio: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  // Yeni kayıt akışında otomatik onay: varsayılan true
  isApproved: { type: Boolean, default: true },
  // Abonelik bilgileri
  subscription: {
    plan: { 
      type: String, 
      enum: ["free", "basic", "pro", "enterprise"], 
      default: "free" 
    },
    status: { 
      type: String, 
      enum: ["inactive", "active", "cancelled", "past_due", "trialing"], 
      default: "inactive" 
    },
    customerId: { type: String, default: "" },
    subscriptionId: { type: String, default: "" },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    trialStart: { type: Date },
    trialEnd: { type: Date },
    features: {
      templates: { type: Number, default: 5 },
      blocks: { type: Number, default: 50 },
      assets: { type: Number, default: 10 },
      collaborators: { type: Number, default: 0 },
      versionHistory: { type: Number, default: 10 },
      exports: { type: Number, default: 5 }
    },
    customLimits: { type: mongoose.Schema.Types.Mixed, default: {} },
    billingCycle: { 
      type: String, 
      enum: ["monthly", "yearly"], 
      default: "monthly" 
    },
    price: { type: Number, default: 0 },
    currency: { type: String, default: "USD" }
  },
  // Kullanıcı istatistikleri ve ilişki takibi
  stats: {
    totalTemplates: { type: Number, default: 0 },
    totalProposals: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    totalAssets: { type: Number, default: 0 },
    totalCollaborations: { type: Number, default: 0 },
    lastLogin: { type: Date },
    loginCount: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
  },
  // İlişki referansları
  relationships: {
    ownedTemplates: [{ type: mongoose.Schema.Types.ObjectId, ref: "Template" }],
    sharedTemplates: [{ type: mongoose.Schema.Types.ObjectId, ref: "Template" }],
    createdProposals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Proposal" }],
    createdProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    uploadedAssets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Asset" }],
    collaborators: [{ 
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      permission: { type: String, enum: ["view", "edit", "admin"], default: "view" },
      addedAt: { type: Date, default: Date.now }
    }],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save middleware
userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Abonelik planını güncelleme metodu
userSchema.methods.updateSubscription = function (plan, status = "active", options = {}) {
  this.subscription.plan = plan;
  this.subscription.status = status;
  
  if (options.customerId) this.subscription.customerId = options.customerId;
  if (options.subscriptionId) this.subscription.subscriptionId = options.subscriptionId;
  if (options.currentPeriodStart) this.subscription.currentPeriodStart = options.currentPeriodStart;
  if (options.currentPeriodEnd) this.subscription.currentPeriodEnd = options.currentPeriodEnd;
  if (options.trialStart) this.subscription.trialStart = options.trialStart;
  if (options.trialEnd) this.subscription.trialEnd = options.trialEnd;
  if (options.billingCycle) this.subscription.billingCycle = options.billingCycle;
  if (options.price !== undefined) this.subscription.price = options.price;
  if (options.currency) this.subscription.currency = options.currency;
  
  // Plan özelliklerini güncelle
  this.updatePlanFeatures(plan);
};

// Plan özelliklerini güncelleme metodu
userSchema.methods.updatePlanFeatures = function (plan) {
  const planFeatures = {
    free: {
      templates: 5,
      blocks: 50,
      assets: 10,
      collaborators: 0,
      versionHistory: 10,
      exports: 5
    },
    basic: {
      templates: 25,
      blocks: 200,
      assets: 50,
      collaborators: 3,
      versionHistory: 50,
      exports: 25
    },
    pro: {
      templates: 100,
      blocks: 1000,
      assets: 200,
      collaborators: 10,
      versionHistory: 100,
      exports: 100
    },
    enterprise: {
      templates: -1, // Unlimited
      blocks: -1,
      assets: -1,
      collaborators: -1,
      versionHistory: -1,
      exports: -1
    }
  };

  const features = planFeatures[plan] || planFeatures.free;
  this.subscription.features = features;
};

// Abonelik aktif mi kontrol etme metodu
userSchema.methods.isSubscriptionActive = function () {
  if (this.subscription.status === "active") {
    return true;
  }
  
  if (this.subscription.status === "trialing" && this.subscription.trialEnd) {
    return new Date() < this.subscription.trialEnd;
  }
  
  return false;
};

// Abonelik süresi dolmuş mu kontrol etme metodu
userSchema.methods.isSubscriptionExpired = function () {
  if (this.subscription.status === "cancelled" || this.subscription.status === "past_due") {
    return true;
  }
  
  if (this.subscription.currentPeriodEnd) {
    return new Date() > this.subscription.currentPeriodEnd;
  }
  
  return false;
};

// Deneme süresi aktif mi kontrol etme metodu
userSchema.methods.isInTrial = function () {
  return this.subscription.status === "trialing" && 
         this.subscription.trialStart && 
         this.subscription.trialEnd &&
         new Date() >= this.subscription.trialStart &&
         new Date() < this.subscription.trialEnd;
};

// Abonelik iptal etme metodu
userSchema.methods.cancelSubscription = function () {
  this.subscription.status = "cancelled";
  this.subscription.currentPeriodEnd = new Date();
};

// Abonelik yenileme metodu
userSchema.methods.renewSubscription = function (newPeriodEnd) {
  this.subscription.status = "active";
  this.subscription.currentPeriodStart = new Date();
  this.subscription.currentPeriodEnd = newPeriodEnd;
};

// Kullanıcının özellik kullanımını kontrol etme metodu
userSchema.methods.canUseFeature = function (feature, currentUsage) {
  const limit = this.subscription.features[feature];
  
  // Unlimited (-1) ise her zaman true
  if (limit === -1) {
    return true;
  }
  
  return currentUsage < limit;
};

// Kullanıcının abonelik bilgilerini getirme metodu
userSchema.methods.getSubscriptionInfo = function () {
  return {
    plan: this.subscription.plan,
    status: this.subscription.status,
    isActive: this.isSubscriptionActive(),
    isExpired: this.isSubscriptionExpired(),
    isInTrial: this.isInTrial(),
    features: this.subscription.features,
    currentPeriodEnd: this.subscription.currentPeriodEnd,
    trialEnd: this.subscription.trialEnd,
    billingCycle: this.subscription.billingCycle,
    price: this.subscription.price,
    currency: this.subscription.currency
  };
};

// İstatistikleri güncelleme metodu
userSchema.methods.updateStats = function (field, increment = 1) {
  if (this.stats[field] !== undefined) {
    this.stats[field] += increment;
  }
  this.stats.lastActivity = new Date();
};

// İlişki ekleme metodu
userSchema.methods.addRelationship = function (type, itemId, options = {}) {
  if (!this.relationships[type]) {
    this.relationships[type] = [];
  }
  
  if (type === 'collaborators') {
    this.relationships[type].push({
      user: itemId,
      permission: options.permission || 'view',
      addedAt: new Date()
    });
  } else {
    if (!this.relationships[type].includes(itemId)) {
      this.relationships[type].push(itemId);
    }
  }
};

// İlişki kaldırma metodu
userSchema.methods.removeRelationship = function (type, itemId) {
  if (this.relationships[type]) {
    if (type === 'collaborators') {
      this.relationships[type] = this.relationships[type].filter(
        collab => collab.user.toString() !== itemId.toString()
      );
    } else {
      this.relationships[type] = this.relationships[type].filter(
        id => id.toString() !== itemId.toString()
      );
    }
  }
};

// İlişki kontrolü metodu
userSchema.methods.hasRelationship = function (type, itemId) {
  if (!this.relationships[type]) return false;
  
  if (type === 'collaborators') {
    return this.relationships[type].some(
      collab => collab.user.toString() === itemId.toString()
    );
  } else {
    return this.relationships[type].includes(itemId);
  }
};

// Kullanıcı aktivitesini güncelleme metodu
userSchema.methods.updateActivity = function () {
  this.stats.lastActivity = new Date();
  this.stats.loginCount += 1;
};

module.exports = mongoose.model("User", userSchema);
