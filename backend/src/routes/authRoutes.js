const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const logger = require("../config/logger");
const { validate, schemas } = require("../middleware/validation");

const User = require("../models/User");

const router = express.Router();

router.post("/register", validate(schemas.register), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      logger.warn("Registration attempt with existing email", {
        ip: req.ip,
        email,
      });
      return res.error("Bu e-posta zaten kayıtlı", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    logger.business("User registered successfully", {
      userId: user._id,
      email: user.email,
      ip: req.ip,
    });
    return res.success(
      { id: user._id, name: user.name, email: user.email },
      "Kullanıcı başarıyla kayıt edildi"
    );
  } catch (err) {
    logger.error("Registration error:", {
      error: err.message,
      email: req.body.email,
      ip: req.ip,
    });
    return res.error("Kayıt olurken hata oluştu", 500);
  }
});

router.post("/login", validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.security("Login attempt with non-existent email", {
        ip: req.ip,
        email,
      });
      return res.error("Geçersiz kimlik bilgileri", 401);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      logger.security("Login attempt with wrong password", {
        ip: req.ip,
        email,
        userId: user._id,
      });
      return res.error("Geçersiz kimlik bilgileri", 401);
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );
    logger.business("User logged in successfully", {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: req.ip,
    });
    return res.success(
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      "Başarıyla giriş yapıldı"
    );
  } catch (err) {
    logger.error("Login error:", {
      error: err.message,
      email: req.body.email,
      ip: req.ip,
    });
    return res.error("Giriş yapılırken hata oluştu", 500);
  }
});

// Kullanıcı bilgisini dönen endpoint (token ile)
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("_id name email role");
    if (!user) return res.error("Kullanıcı bulunamadı", 404);
    return res.success({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return res.error("Kullanıcı bilgisi alınamadı", 500);
  }
});

module.exports = router;
