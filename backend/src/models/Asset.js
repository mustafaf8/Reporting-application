const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
    },
    url: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    uploadType: {
      type: String,
      enum: ["block", "logo", "gallery", "hero", "signature"],
      default: "block",
    },
    blockId: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware
assetSchema.pre("save", function (next) {
  // URL'den public ID'yi çıkar (eğer yoksa)
  if (!this.publicId && this.url) {
    const urlParts = this.url.split("/");
    const filename = urlParts[urlParts.length - 1];
    this.publicId = filename.split(".")[0];
  }
  next();
});

// Kullanım sayısını artırma metodu
assetSchema.methods.incrementUsage = function () {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
};

// Asset'in kullanılıp kullanılmadığını kontrol etme
assetSchema.methods.isUsed = function () {
  return this.usageCount > 0;
};

// Asset boyutunu formatlanmış string olarak döndürme
assetSchema.methods.getFormattedSize = function () {
  const bytes = this.size;
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Asset'in resim olup olmadığını kontrol etme
assetSchema.methods.isImage = function () {
  return this.mimeType.startsWith("image/");
};

// Asset'in video olup olmadığını kontrol etme
assetSchema.methods.isVideo = function () {
  return this.mimeType.startsWith("video/");
};

// Asset'in PDF olup olmadığını kontrol etme
assetSchema.methods.isPDF = function () {
  return this.mimeType === "application/pdf";
};

// Cloudinary transformation URL'i oluşturma
assetSchema.methods.getTransformedUrl = function (transformations = {}) {
  const {
    width,
    height,
    crop = "scale",
    quality = "auto",
    format = "auto",
  } = transformations;

  let url = this.url;

  if (
    width ||
    height ||
    crop !== "scale" ||
    quality !== "auto" ||
    format !== "auto"
  ) {
    const transformParts = [];

    if (width || height) {
      const size = width && height ? `${width}x${height}` : width || height;
      transformParts.push(`w_${size},c_${crop}`);
    }

    if (quality !== "auto") {
      transformParts.push(`q_${quality}`);
    }

    if (format !== "auto") {
      transformParts.push(`f_${format}`);
    }

    if (transformParts.length > 0) {
      const publicId = this.publicId;
      const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
      url = `${baseUrl}/${transformParts.join(",")}/${publicId}`;
    }
  }

  return url;
};

// Thumbnail URL'i oluşturma
assetSchema.methods.getThumbnailUrl = function (size = 150) {
  return this.getTransformedUrl({
    width: size,
    height: size,
    crop: "fill",
    quality: "auto",
    format: "auto",
  });
};

// Index'ler
assetSchema.index({ owner: 1, uploadType: 1 });
assetSchema.index({ blockId: 1 });
assetSchema.index({ publicId: 1 });
assetSchema.index({ mimeType: 1 });
assetSchema.index({ createdAt: -1 });
assetSchema.index({ lastUsedAt: -1 });
assetSchema.index({ usageCount: -1 });

// Virtual fields
assetSchema.virtual("isRecentlyUsed").get(function () {
  if (!this.lastUsedAt) return false;
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return this.lastUsedAt > oneWeekAgo;
});

assetSchema.virtual("isLargeFile").get(function () {
  return this.size > 5 * 1024 * 1024; // 5MB
});

// JSON serialization
assetSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Asset", assetSchema);
