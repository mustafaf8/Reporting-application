const express = require("express");
const User = require("../models/User");
const Proposal = require("../models/Proposal");
const auth = require("../middleware/auth");
const logger = require("../config/logger");
const { validate, schemas } = require("../middleware/validation");

const router = express.Router();

// Profil resmi servis endpoint'i (MongoDB Buffer'dan)
router.get("/:id/profile-image", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("profileImage");
    if (!user || !user.profileImage || !user.profileImage.data) {
      return res.status(404).send("Not found");
    }

    res.set("Content-Type", user.profileImage.contentType || "image/jpeg");
    return res.send(user.profileImage.data);
  } catch (error) {
    logger.error("Serve profile image error", { error: error.message });
    return res.status(500).send("Server error");
  }
});

// Kullanıcı profili endpoint'i (Redis cache ile)
const { createClient } = require("redis");
const USE_REDIS = process.env.USE_REDIS === "true";
let redisClient = null;
if (USE_REDIS) {
  redisClient = createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  });
  redisClient.on("error", (err) =>
    logger.error("Redis error", { error: err.message })
  );
  (async () => {
    try {
      await redisClient.connect();
    } catch (e) {
      // Redis opsiyonel; bağlanamazsa cache devre dışı kalır
    }
  })();
}
const isRedisReady = () => USE_REDIS && redisClient?.isReady === true;

router.get("/me/profile", auth, async (req, res) => {
  try {
    const cacheKey = `users:me:profile:${req.user.id}`;
    if (isRedisReady()) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (_) {}
    }

    // Kullanıcı bilgilerini getir
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    // Kullanıcıya ait teklifleri getir
    const proposals = await Proposal.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10); // Son 10 teklifi getir

    const payload = {
      user,
      proposals,
    };
    if (isRedisReady()) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(payload), { EX: 60 });
      } catch (_) {}
    }
    return res.json(payload);
  } catch (error) {
    console.error("Profile endpoint error:", error);
    return res.status(500).json({ message: "Profil bilgileri alınamadı" });
  }
});

// Kullanıcı performans verileri endpoint'i
router.get("/me/performance", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Toplam teklif sayısı
    const totalProposals = await Proposal.countDocuments({ owner: userId });

    // Onaylanan teklif sayısı
    const approvedProposals = await Proposal.countDocuments({
      owner: userId,
      status: "approved",
    });

    // Reddedilen teklif sayısı
    const rejectedProposals = await Proposal.countDocuments({
      owner: userId,
      status: "rejected",
    });

    // Onaylanan tekliflerin toplam parasal değeri
    const approvedProposalsData = await Proposal.find({
      owner: userId,
      status: "approved",
    }).select("grandTotal");

    const totalRevenue = approvedProposalsData.reduce((sum, proposal) => {
      return sum + (proposal.grandTotal || 0);
    }, 0);

    // Başarı oranı hesapla
    const successRate =
      totalProposals > 0
        ? Math.round((approvedProposals / totalProposals) * 100)
        : 0;

    return res.json({
      totalProposals,
      approvedProposals,
      rejectedProposals,
      totalRevenue,
      successRate,
    });
  } catch (error) {
    console.error("Performance endpoint error:", error);
    return res.status(500).json({ message: "Performans verileri alınamadı" });
  }
});

// Profil güncelleme endpoint'i
router.put(
  "/me/profile",
  auth,
  validate(schemas.updateProfile),
  async (req, res) => {
    try {
      const { name, position, department, company, phone, address, bio } =
        req.body;

      // Sadece güncellenebilir alanları belirle
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (position !== undefined) updateData.position = position;
      if (department !== undefined) updateData.department = department;
      if (company !== undefined) updateData.company = company;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (bio !== undefined) updateData.bio = bio;

      updateData.updatedAt = new Date();

      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true, runValidators: true }
      ).select("-passwordHash");

      if (!updatedUser) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }

      // Cache invalidation
      try {
        if (isRedisReady()) {
          const cacheKey = `users:me:profile:${req.user.id}`;
          await redisClient.del(cacheKey);
        }
      } catch (_) {}

      return res.json(updatedUser);
    } catch (error) {
      console.error("Profile update error:", error);
      return res.status(500).json({ message: "Profil güncellenemedi" });
    }
  }
);

module.exports = router;
