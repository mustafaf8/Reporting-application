const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  // Temel bilgiler
  action: {
    type: String,
    required: true,
    enum: [
      "create", "update", "delete", "view", "export", "import",
      "share", "unshare", "duplicate", "revert", "restore",
      "login", "logout", "register", "password_change",
      "subscription_change", "permission_change", "access_denied"
    ]
  },
  
  // Hangi kaynak üzerinde işlem yapıldı
  resource: {
    type: {
      type: String,
      required: true,
      enum: ["template", "user", "proposal", "asset", "subscription", "system"]
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: String // Kaynağın adı (arama kolaylığı için)
  },

  // Kim yaptı
  user: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: String,
    email: String,
    role: String
  },

  // Ne değişti
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    fields: [String] // Değişen alanların listesi
  },

  // İşlem detayları
  details: {
    description: String,
    reason: String,
    ipAddress: String,
    userAgent: String,
    sessionId: String,
    requestId: String
  },

  // Güvenlik ve risk seviyesi
  security: {
    level: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low"
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    suspicious: {
      type: Boolean,
      default: false
    },
    flags: [String] // Güvenlik bayrakları
  },

  // Zaman bilgileri
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Coğrafi bilgi
  location: {
    country: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },

  // Ekstra metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Durum
  status: {
    type: String,
    enum: ["success", "failed", "pending"],
    default: "success"
  },

  // Hata bilgisi (eğer işlem başarısızsa)
  error: {
    message: String,
    code: String,
    stack: String
  }
}, {
  timestamps: true
});

// Index'ler
auditLogSchema.index({ "resource.type": 1, "resource.id": 1 });
auditLogSchema.index({ "user.id": 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ "security.level": 1, timestamp: -1 });
auditLogSchema.index({ "security.suspicious": 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ "details.ipAddress": 1, timestamp: -1 });

// Compound index'ler
auditLogSchema.index({ 
  "resource.type": 1, 
  "user.id": 1, 
  timestamp: -1 
});

auditLogSchema.index({ 
  action: 1, 
  "security.level": 1, 
  timestamp: -1 
});

// Virtual fields
auditLogSchema.virtual("isRecent").get(function() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return this.timestamp > oneHourAgo;
});

auditLogSchema.virtual("isHighRisk").get(function() {
  return this.security.level === "high" || this.security.level === "critical";
});

auditLogSchema.virtual("duration").get(function() {
  if (this.createdAt && this.updatedAt) {
    return this.updatedAt.getTime() - this.createdAt.getTime();
  }
  return null;
});

// Instance methods
auditLogSchema.methods.addFlag = function(flag) {
  if (!this.security.flags.includes(flag)) {
    this.security.flags.push(flag);
  }
};

auditLogSchema.methods.removeFlag = function(flag) {
  this.security.flags = this.security.flags.filter(f => f !== flag);
};

auditLogSchema.methods.hasFlag = function(flag) {
  return this.security.flags.includes(flag);
};

auditLogSchema.methods.setSuspicious = function(reason) {
  this.security.suspicious = true;
  this.addFlag(`suspicious:${reason}`);
  this.security.riskScore = Math.min(this.security.riskScore + 20, 100);
};

auditLogSchema.methods.calculateRiskScore = function() {
  let score = 0;

  // Yüksek riskli işlemler
  if (["delete", "password_change", "permission_change"].includes(this.action)) {
    score += 30;
  }

  // Kritik kaynaklar
  if (["user", "subscription", "system"].includes(this.resource.type)) {
    score += 20;
  }

  // Şüpheli aktiviteler
  if (this.security.suspicious) {
    score += 25;
  }

  // Çok sayıda alan değişikliği
  if (this.changes.fields && this.changes.fields.length > 5) {
    score += 15;
  }

  // Gece saatleri (23:00 - 06:00)
  const hour = this.timestamp.getHours();
  if (hour >= 23 || hour <= 6) {
    score += 10;
  }

  this.security.riskScore = Math.min(score, 100);
  return this.security.riskScore;
};

// Static methods
auditLogSchema.statics.logAction = async function(actionData) {
  try {
    const auditLog = new this(actionData);
    
    // Risk skorunu hesapla
    auditLog.calculateRiskScore();
    
    // Güvenlik seviyesini belirle
    if (auditLog.security.riskScore >= 80) {
      auditLog.security.level = "critical";
    } else if (auditLog.security.riskScore >= 60) {
      auditLog.security.level = "high";
    } else if (auditLog.security.riskScore >= 30) {
      auditLog.security.level = "medium";
    }

    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error("Error logging audit action:", error);
    throw error;
  }
};

auditLogSchema.statics.getUserActivity = async function(userId, options = {}) {
  const {
    startDate,
    endDate,
    actions,
    limit = 100
  } = options;

  const query = { "user.id": userId };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  if (actions && Array.isArray(actions)) {
    query.action = { $in: actions };
  }

  return await this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

auditLogSchema.statics.getResourceHistory = async function(resourceType, resourceId, options = {}) {
  const {
    startDate,
    endDate,
    actions,
    limit = 100
  } = options;

  const query = {
    "resource.type": resourceType,
    "resource.id": resourceId
  };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  if (actions && Array.isArray(actions)) {
    query.action = { $in: actions };
  }

  return await this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("user.id", "name email")
    .lean();
};

auditLogSchema.statics.getSuspiciousActivity = async function(options = {}) {
  const {
    startDate,
    endDate,
    limit = 100
  } = options;

  const query = {
    "security.suspicious": true
  };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  return await this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("user.id", "name email")
    .lean();
};

auditLogSchema.statics.getSecurityStats = async function(options = {}) {
  const {
    startDate,
    endDate
  } = options;

  const matchStage = {};

  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = new Date(startDate);
    if (endDate) matchStage.timestamp.$lte = new Date(endDate);
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalActions: { $sum: 1 },
        suspiciousActions: {
          $sum: { $cond: ["$security.suspicious", 1, 0] }
        },
        highRiskActions: {
          $sum: {
            $cond: [
              { $in: ["$security.level", ["high", "critical"]] },
              1,
              0
            ]
          }
        },
        failedActions: {
          $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
        },
        averageRiskScore: { $avg: "$security.riskScore" },
        actionBreakdown: {
          $push: {
            action: "$action",
            level: "$security.level",
            suspicious: "$security.suspicious"
          }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalActions: 0,
    suspiciousActions: 0,
    highRiskActions: 0,
    failedActions: 0,
    averageRiskScore: 0,
    actionBreakdown: []
  };
};

// Pre-save middleware
auditLogSchema.pre("save", function(next) {
  // Risk skorunu yeniden hesapla
  this.calculateRiskScore();
  
  // Şüpheli aktivite kontrolü
  this.checkForSuspiciousActivity();
  
  next();
});

// Şüpheli aktivite kontrolü
auditLogSchema.methods.checkForSuspiciousActivity = function() {
  // Çok hızlı ardışık işlemler
  // Bu kontrol daha karmaşık olabilir ve ayrı bir serviste yapılabilir
  
  // Gece saatleri
  const hour = this.timestamp.getHours();
  if (hour >= 23 || hour <= 6) {
    this.addFlag("night_activity");
  }

  // Çok sayıda silme işlemi
  if (this.action === "delete") {
    this.addFlag("deletion_activity");
  }

  // Yetki değişiklikleri
  if (this.action === "permission_change") {
    this.addFlag("permission_change");
  }
};

module.exports = mongoose.model("AuditLog", auditLogSchema);
