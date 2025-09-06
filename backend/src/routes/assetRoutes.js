const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const auth = require("../middleware/auth");
const logger = require("../config/logger");

// Cloudinary konfigürasyonu
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer konfigürasyonu - memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Sadece resim dosyalarına izin ver
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Sadece resim dosyaları yüklenebilir"), false);
    }
  },
});

// Asset modeli (opsiyonel - asset referanslarını takip etmek için)
const Asset = require("../models/Asset");

// Resim yükleme
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.error("Dosya gerekli", 400);
    }

    const { blockId, uploadType = "block", metadata = {} } = req.body;

    // Cloudinary'ye yükle
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: `block-editor/${req.user.id}`,
          public_id: `${blockId || "temp"}_${Date.now()}`,
          transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file.buffer);
    });

    // Asset referansını veritabanına kaydet
    const asset = new Asset({
      publicId: result.public_id,
      url: result.secure_url,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      width: result.width,
      height: result.height,
      uploadType,
      blockId,
      metadata: {
        ...metadata,
        uploadedBy: req.user.id,
        uploadedAt: new Date(),
      },
      owner: req.user.id,
    });

    await asset.save();

    logger.info("Asset uploaded successfully", {
      assetId: asset._id,
      publicId: result.public_id,
      userId: req.user.id,
      blockId,
      uploadType,
    });

    res.success(
      {
        assetId: asset._id,
        assetUrl: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      },
      "Dosya başarıyla yüklendi"
    );
  } catch (error) {
    logger.error("Error uploading asset", {
      error: error.message,
      userId: req.user.id,
      blockId: req.body.blockId,
    });
    res.error("Dosya yüklenirken hata oluştu", 500);
  }
});

// Çoklu dosya yükleme
router.post(
  "/upload-multiple",
  auth,
  upload.array("files", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.error("En az bir dosya gerekli", 400);
      }

      const { blockId, uploadType = "block" } = req.body;
      const uploadedAssets = [];

      for (const file of req.files) {
        try {
          // Cloudinary'ye yükle
          const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                resource_type: "auto",
                folder: `block-editor/${req.user.id}`,
                public_id: `${blockId || "temp"}_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
                transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );

            uploadStream.end(file.buffer);
          });

          // Asset referansını veritabanına kaydet
          const asset = new Asset({
            publicId: result.public_id,
            url: result.secure_url,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            width: result.width,
            height: result.height,
            uploadType,
            blockId,
            metadata: {
              uploadedBy: req.user.id,
              uploadedAt: new Date(),
            },
            owner: req.user.id,
          });

          await asset.save();
          uploadedAssets.push({
            assetId: asset._id,
            assetUrl: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
          });
        } catch (fileError) {
          logger.error("Error uploading individual file", {
            error: fileError.message,
            fileName: file.originalname,
            userId: req.user.id,
          });
          // Tek dosya hatası, devam et
        }
      }

      logger.info("Multiple assets uploaded", {
        uploadedCount: uploadedAssets.length,
        totalFiles: req.files.length,
        userId: req.user.id,
        blockId,
      });

      res.success(
        {
          assets: uploadedAssets,
          uploadedCount: uploadedAssets.length,
          totalFiles: req.files.length,
        },
        `${uploadedAssets.length} dosya başarıyla yüklendi`
      );
    } catch (error) {
      logger.error("Error uploading multiple assets", {
        error: error.message,
        userId: req.user.id,
        blockId: req.body.blockId,
      });
      res.error("Dosyalar yüklenirken hata oluştu", 500);
    }
  }
);

// Asset silme
router.delete("/:assetId", auth, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.assetId);

    if (!asset) {
      return res.error("Asset bulunamadı", 404);
    }

    // Sahiplik kontrolü
    if (asset.owner.toString() !== req.user.id) {
      return res.error("Bu asset'i silme izniniz yok", 403);
    }

    // Cloudinary'den sil
    try {
      await cloudinary.uploader.destroy(asset.publicId);
    } catch (cloudinaryError) {
      logger.warn("Error deleting from Cloudinary", {
        error: cloudinaryError.message,
        publicId: asset.publicId,
        assetId: asset._id,
      });
      // Cloudinary hatası olsa bile veritabanından sil
    }

    // Veritabanından sil
    await Asset.findByIdAndDelete(req.params.assetId);

    logger.info("Asset deleted successfully", {
      assetId: asset._id,
      publicId: asset.publicId,
      userId: req.user.id,
    });

    res.success(null, "Asset başarıyla silindi");
  } catch (error) {
    logger.error("Error deleting asset", {
      error: error.message,
      assetId: req.params.assetId,
      userId: req.user.id,
    });
    res.error("Asset silinirken hata oluştu", 500);
  }
});

// Asset listesi
router.get("/", auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      uploadType,
      blockId,
      sortBy = "uploadedAt",
      sortOrder = "desc",
    } = req.query;

    const query = { owner: req.user.id };

    if (uploadType) query.uploadType = uploadType;
    if (blockId) query.blockId = blockId;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const assets = await Asset.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-metadata.uploadedBy"); // Hassas bilgileri hariç tut

    const total = await Asset.countDocuments(query);

    logger.info("Assets listed", {
      userId: req.user.id,
      count: assets.length,
      total,
    });

    res.success(
      {
        assets,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
      "Asset'ler başarıyla listelendi"
    );
  } catch (error) {
    logger.error("Error listing assets", {
      error: error.message,
      userId: req.user.id,
    });
    res.error("Asset'ler listelenirken hata oluştu", 500);
  }
});

// Asset detayı
router.get("/:assetId", auth, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.assetId);

    if (!asset) {
      return res.error("Asset bulunamadı", 404);
    }

    // Sahiplik kontrolü
    if (asset.owner.toString() !== req.user.id) {
      return res.error("Bu asset'e erişim izniniz yok", 403);
    }

    res.success(
      {
        asset,
      },
      "Asset detayı başarıyla getirildi"
    );
  } catch (error) {
    logger.error("Error getting asset details", {
      error: error.message,
      assetId: req.params.assetId,
      userId: req.user.id,
    });
    res.error("Asset detayı getirilirken hata oluştu", 500);
  }
});

// Asset güncelleme (metadata)
router.put("/:assetId", auth, async (req, res) => {
  try {
    const { metadata } = req.body;

    const asset = await Asset.findById(req.params.assetId);

    if (!asset) {
      return res.error("Asset bulunamadı", 404);
    }

    // Sahiplik kontrolü
    if (asset.owner.toString() !== req.user.id) {
      return res.error("Bu asset'i güncelleme izniniz yok", 403);
    }

    asset.metadata = { ...asset.metadata, ...metadata };
    await asset.save();

    logger.info("Asset metadata updated", {
      assetId: asset._id,
      userId: req.user.id,
    });

    res.success(
      {
        asset,
      },
      "Asset başarıyla güncellendi"
    );
  } catch (error) {
    logger.error("Error updating asset", {
      error: error.message,
      assetId: req.params.assetId,
      userId: req.user.id,
    });
    res.error("Asset güncellenirken hata oluştu", 500);
  }
});

// Toplu asset silme
router.delete("/bulk", auth, async (req, res) => {
  try {
    const { assetIds } = req.body;

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return res.error("Asset ID'leri gerekli", 400);
    }

    // Sahiplik kontrolü
    const assets = await Asset.find({
      _id: { $in: assetIds },
      owner: req.user.id,
    });

    if (assets.length !== assetIds.length) {
      return res.error("Bazı asset'lere erişim izniniz yok", 403);
    }

    // Cloudinary'den sil
    for (const asset of assets) {
      try {
        await cloudinary.uploader.destroy(asset.publicId);
      } catch (cloudinaryError) {
        logger.warn("Error deleting asset from Cloudinary", {
          error: cloudinaryError.message,
          publicId: asset.publicId,
          assetId: asset._id,
        });
      }
    }

    // Veritabanından sil
    await Asset.deleteMany({
      _id: { $in: assetIds },
      owner: req.user.id,
    });

    logger.info("Bulk assets deleted", {
      deletedCount: assets.length,
      userId: req.user.id,
    });

    res.success(
      {
        deletedCount: assets.length,
      },
      `${assets.length} asset başarıyla silindi`
    );
  } catch (error) {
    logger.error("Error deleting bulk assets", {
      error: error.message,
      userId: req.user.id,
    });
    res.error("Asset'ler silinirken hata oluştu", 500);
  }
});

// Asset kullanım istatistikleri
router.get("/stats/usage", auth, async (req, res) => {
  try {
    const stats = await Asset.aggregate([
      { $match: { owner: req.user.id } },
      {
        $group: {
          _id: "$uploadType",
          count: { $sum: 1 },
          totalSize: { $sum: "$size" },
        },
      },
    ]);

    const totalAssets = await Asset.countDocuments({ owner: req.user.id });
    const totalSize = await Asset.aggregate([
      { $match: { owner: req.user.id } },
      { $group: { _id: null, totalSize: { $sum: "$size" } } },
    ]);

    res.success(
      {
        stats,
        totalAssets,
        totalSize: totalSize[0]?.totalSize || 0,
      },
      "Asset istatistikleri başarıyla getirildi"
    );
  } catch (error) {
    logger.error("Error getting asset stats", {
      error: error.message,
      userId: req.user.id,
    });
    res.error("Asset istatistikleri getirilirken hata oluştu", 500);
  }
});

module.exports = router;
