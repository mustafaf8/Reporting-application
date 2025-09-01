const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");
const logger = require("../config/logger");

const router = express.Router();

// Upload klasörünü oluştur
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Dosya adını kullanıcı ID + timestamp + orijinal uzantı olarak ayarla
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${ext}`);
  },
});

// Dosya filtresi
const fileFilter = (req, file, cb) => {
  // Sadece resim dosyalarını kabul et
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Sadece resim dosyaları yüklenebilir!"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Profil fotoğrafı yükleme
router.post(
  "/profile-image",
  auth,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Dosya seçilmedi",
        });
      }

      const User = require("../models/User");

      // Eski profil fotoğrafını sil
      const user = await User.findById(req.user.id);
      if (user.profileImageUrl) {
        const oldImagePath = path.join(
          uploadDir,
          path.basename(user.profileImageUrl)
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Yeni profil fotoğrafı URL'ini güncelle
      const imageUrl = `/uploads/${req.file.filename}`;
      await User.findByIdAndUpdate(req.user.id, {
        profileImageUrl: imageUrl,
        updatedAt: new Date(),
      });

      logger.business("Profile image uploaded", {
        userId: req.user.id,
        filename: req.file.filename,
        originalName: req.file.originalname,
      });

      res.json({
        success: true,
        message: "Profil fotoğrafı başarıyla yüklendi",
        imageUrl: imageUrl,
      });
    } catch (error) {
      logger.error("Profile image upload error:", {
        error: error.message,
        userId: req.user.id,
      });

      // Hata durumunda yüklenen dosyayı sil
      if (req.file) {
        const filePath = path.join(uploadDir, req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.status(500).json({
        success: false,
        message: "Profil fotoğrafı yüklenirken hata oluştu",
        error: error.message,
      });
    }
  }
);

// Profil fotoğrafı silme
router.delete("/profile-image", auth, async (req, res) => {
  try {
    const User = require("../models/User");

    const user = await User.findById(req.user.id);
    if (!user.profileImageUrl) {
      return res.status(404).json({
        success: false,
        message: "Profil fotoğrafı bulunamadı",
      });
    }

    // Dosyayı sil
    const imagePath = path.join(uploadDir, path.basename(user.profileImageUrl));
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Veritabanından kaldır
    await User.findByIdAndUpdate(req.user.id, {
      profileImageUrl: "",
      updatedAt: new Date(),
    });

    logger.business("Profile image deleted", {
      userId: req.user.id,
    });

    res.json({
      success: true,
      message: "Profil fotoğrafı başarıyla silindi",
    });
  } catch (error) {
    logger.error("Profile image delete error:", {
      error: error.message,
      userId: req.user.id,
    });

    res.status(500).json({
      success: false,
      message: "Profil fotoğrafı silinirken hata oluştu",
      error: error.message,
    });
  }
});

module.exports = router;
