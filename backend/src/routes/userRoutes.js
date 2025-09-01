const express = require("express");
const User = require("../models/User");
const Proposal = require("../models/Proposal");
const auth = require("../middleware/auth");

const router = express.Router();

// Kullanıcı profili endpoint'i
router.get("/me/profile", auth, async (req, res) => {
  try {
    // Kullanıcı bilgilerini getir
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    // Kullanıcıya ait teklifleri getir
    const proposals = await Proposal.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10); // Son 10 teklifi getir

    return res.json({
      user,
      proposals,
    });
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

module.exports = router;
