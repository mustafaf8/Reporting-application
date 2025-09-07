const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");
const logger = require("../config/logger");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// Multer konfigürasyonu => memoryStorage
const storage = multer.memoryStorage();

// Dosya filtresi
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Sadece resim dosyaları yüklenebilir!"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

// Profil fotoğrafı yükleme (Cloudinary)
router.post(
  "/profile-image",
  auth,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Dosya seçilmedi" });
      }

      // Önce var olan varsa Cloudinary'den sil
      const currentUser = await User.findById(req.user.id);
      if (currentUser?.profileImagePublicId) {
        try {
          await cloudinary.uploader.destroy(currentUser.profileImagePublicId);
        } catch (e) {
          logger.warn("Cloudinary destroy failed", { error: e.message });
        }
      }

      // Yükleme (Cloudinary stream - await kullanılmaz)
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "reporting-app/profile-images",
          resource_type: "image",
          overwrite: true,
          transformation: [{ width: 512, height: 512, crop: "limit" }],
        },
        async (error, result) => {
          if (error) {
            logger.error("Cloudinary upload error", { error: error.message });
            return res
              .status(500)
              .json({ success: false, message: "Yükleme hatası" });
          }

          const updated = await User.findByIdAndUpdate(
            req.user.id,
            {
              profileImageUrl: result.secure_url,
              profileImagePublicId: result.public_id,
              updatedAt: new Date(),
            },
            { new: true }
          ).select("-passwordHash");

          logger.business("Profile image uploaded (Cloudinary)", {
            userId: req.user.id,
            publicId: result.public_id,
          });

          return res.json({
            success: true,
            message: "Profil fotoğrafı yüklendi",
            imageUrl: result.secure_url,
            user: updated,
          });
        }
      );

      // stream'e buffer'ı yaz
      uploadStream.end(req.file.buffer);
    } catch (error) {
      logger.error("Profile image upload error:", {
        error: error.message,
        userId: req.user.id,
      });
      return res.status(500).json({
        success: false,
        message: "Profil fotoğrafı yüklenirken hata oluştu",
      });
    }
  }
);

// Profil fotoğrafı silme (Cloudinary)
router.delete("/profile-image", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser?.profileImagePublicId) {
      return res
        .status(404)
        .json({ success: false, message: "Profil fotoğrafı bulunamadı" });
    }

    try {
      await cloudinary.uploader.destroy(currentUser.profileImagePublicId);
    } catch (e) {
      logger.warn("Cloudinary destroy failed", { error: e.message });
    }

    await User.findByIdAndUpdate(req.user.id, {
      profileImageUrl: "",
      profileImagePublicId: "",
      updatedAt: new Date(),
    });

    logger.business("Profile image deleted (Cloudinary)", {
      userId: req.user.id,
    });

    res.json({ success: true, message: "Profil fotoğrafı silindi" });
  } catch (error) {
    logger.error("Profile image delete error:", {
      error: error.message,
      userId: req.user.id,
    });
    res.status(500).json({
      success: false,
      message: "Profil fotoğrafı silinirken hata oluştu",
    });
  }
});

// Logo yükleme (Cloudinary)
router.post("/logo", auth, upload.single("logo"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Dosya seçilmedi" });
    }

    // Yükleme (Cloudinary stream)
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "reporting-app/logos",
        resource_type: "image",
        overwrite: true,
        transformation: [{ width: 512, height: 512, crop: "limit" }],
      },
      async (error, result) => {
        if (error) {
          logger.error("Cloudinary upload error", { error: error.message });
          return res
            .status(500)
            .json({ success: false, message: "Yükleme hatası" });
        }

        logger.business("Logo uploaded (Cloudinary)", {
          userId: req.user.id,
          publicId: result.public_id,
        });

        return res.json({
          success: true,
          message: "Logo yüklendi",
          imageUrl: result.secure_url,
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    logger.error("Logo upload error:", {
      error: error.message,
      userId: req.user.id,
    });
    return res.status(500).json({
      success: false,
      message: "Logo yüklenirken hata oluştu",
    });
  }
});

// Hero resmi yükleme (Cloudinary)
router.post("/hero", auth, upload.single("heroImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Dosya seçilmedi" });
    }

    // Yükleme (Cloudinary stream)
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "reporting-app/hero-images",
        resource_type: "image",
        overwrite: true,
        transformation: [{ width: 1200, height: 600, crop: "limit" }],
      },
      async (error, result) => {
        if (error) {
          logger.error("Cloudinary upload error", { error: error.message });
          return res
            .status(500)
            .json({ success: false, message: "Yükleme hatası" });
        }

        logger.business("Hero image uploaded (Cloudinary)", {
          userId: req.user.id,
          publicId: result.public_id,
        });

        return res.json({
          success: true,
          message: "Ana resim yüklendi",
          imageUrl: result.secure_url,
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    logger.error("Hero image upload error:", {
      error: error.message,
      userId: req.user.id,
    });
    return res.status(500).json({
      success: false,
      message: "Ana resim yüklenirken hata oluştu",
    });
  }
});

// Galeri resmi yükleme (Cloudinary)
router.post(
  "/gallery",
  auth,
  upload.single("galleryImage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Dosya seçilmedi" });
      }

      // Yükleme (Cloudinary stream)
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "reporting-app/gallery-images",
          resource_type: "image",
          overwrite: true,
          transformation: [{ width: 800, height: 600, crop: "limit" }],
        },
        async (error, result) => {
          if (error) {
            logger.error("Cloudinary upload error", { error: error.message });
            return res
              .status(500)
              .json({ success: false, message: "Yükleme hatası" });
          }

          logger.business("Gallery image uploaded (Cloudinary)", {
            userId: req.user.id,
            publicId: result.public_id,
          });

          return res.json({
            success: true,
            message: "Galeri resmi yüklendi",
            imageUrl: result.secure_url,
          });
        }
      );

      uploadStream.end(req.file.buffer);
    } catch (error) {
      logger.error("Gallery image upload error:", {
        error: error.message,
        userId: req.user.id,
      });
      return res.status(500).json({
        success: false,
        message: "Galeri resmi yüklenirken hata oluştu",
      });
    }
  }
);

// Genel resim yükleme (Cloudinary)
router.post("/general", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Dosya seçilmedi" });
    }

    // Yükleme (Cloudinary stream)
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "reporting-app/general-images",
        resource_type: "image",
        overwrite: true,
        transformation: [{ width: 1024, height: 768, crop: "limit" }],
      },
      async (error, result) => {
        if (error) {
          logger.error("Cloudinary upload error", { error: error.message });
          return res
            .status(500)
            .json({ success: false, message: "Yükleme hatası" });
        }

        logger.business("General image uploaded (Cloudinary)", {
          userId: req.user.id,
          publicId: result.public_id,
        });

        return res.json({
          success: true,
          message: "Resim yüklendi",
          imageUrl: result.secure_url,
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    logger.error("General image upload error:", {
      error: error.message,
      userId: req.user.id,
    });
    return res.status(500).json({
      success: false,
      message: "Resim yüklenirken hata oluştu",
    });
  }
});

// Logo silme
router.delete("/logo", auth, async (req, res) => {
  try {
    res.json({ success: true, message: "Logo silindi" });
  } catch (error) {
    logger.error("Logo delete error:", {
      error: error.message,
      userId: req.user.id,
    });
    res.status(500).json({
      success: false,
      message: "Logo silinirken hata oluştu",
    });
  }
});

// Hero resmi silme
router.delete("/hero", auth, async (req, res) => {
  try {
    res.json({ success: true, message: "Ana resim silindi" });
  } catch (error) {
    logger.error("Hero image delete error:", {
      error: error.message,
      userId: req.user.id,
    });
    res.status(500).json({
      success: false,
      message: "Ana resim silinirken hata oluştu",
    });
  }
});

// Galeri resmi silme
router.delete("/gallery", auth, async (req, res) => {
  try {
    res.json({ success: true, message: "Galeri resmi silindi" });
  } catch (error) {
    logger.error("Gallery image delete error:", {
      error: error.message,
      userId: req.user.id,
    });
    res.status(500).json({
      success: false,
      message: "Galeri resmi silinirken hata oluştu",
    });
  }
});

module.exports = router;
