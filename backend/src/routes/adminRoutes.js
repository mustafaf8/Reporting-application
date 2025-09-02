const express = require("express");
const User = require("../models/User");
const Proposal = require("../models/Proposal");
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const logger = require("../config/logger");

const router = express.Router();

// Tüm admin route'ları için auth ve admin middleware'i
router.use(auth, admin);

// Kullanıcı yönetimi
router.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const filter = search ? { name: { $regex: search, $options: "i" } } : {};

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    logger.business("Admin viewed users list", {
      adminId: req.user.id,
      searchTerm: search,
      resultCount: users.length,
    });

    return res.json({
      users,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    logger.error("Admin users list error:", {
      error: err.message,
      adminId: req.user.id,
    });
    return res
      .status(500)
      .json({ message: "Kullanıcılar alınamadı", error: err.message });
  }
});

// Kullanıcı rolü güncelleme
router.put("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Geçersiz rol" });
    }

    // Kendi rolünü değiştirmeye çalışıyorsa engelle
    if (req.params.id === req.user.id) {
      return res
        .status(400)
        .json({ message: "Kendi rolünüzü değiştiremezsiniz" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, updatedAt: new Date() },
      { new: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    logger.business("Admin updated user role", {
      adminId: req.user.id,
      targetUserId: req.params.id,
      newRole: role,
      oldRole: user.role,
    });

    return res.json(user);
  } catch (err) {
    logger.error("Admin role update error:", {
      error: err.message,
      adminId: req.user.id,
    });
    return res
      .status(500)
      .json({ message: "Rol güncellenemedi", error: err.message });
  }
});

// Kullanıcı aktif/pasif durumu
router.put("/users/:id/status", async (req, res) => {
  try {
    const { isActive } = req.body;

    // Kendi durumunu değiştirmeye çalışıyorsa engelle
    if (req.params.id === req.user.id) {
      return res
        .status(400)
        .json({ message: "Kendi durumunuzu değiştiremezsiniz" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive, updatedAt: new Date() },
      { new: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    logger.business("Admin updated user status", {
      adminId: req.user.id,
      targetUserId: req.params.id,
      newStatus: isActive,
    });

    return res.json(user);
  } catch (err) {
    logger.error("Admin status update error:", {
      error: err.message,
      adminId: req.user.id,
    });
    return res
      .status(500)
      .json({ message: "Durum güncellenemedi", error: err.message });
  }
});

// Kullanıcı onaylama/reddetme
router.put("/users/:id/approve", async (req, res) => {
  try {
    const { isApproved } = req.body;

    // Kendi onayını değiştirmeye çalışıyorsa engelle
    if (req.params.id === req.user.id) {
      return res
        .status(400)
        .json({ message: "Kendi onayınızı değiştiremezsiniz" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved, updatedAt: new Date() },
      { new: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    logger.business("Admin updated user approval", {
      adminId: req.user.id,
      targetUserId: req.params.id,
      newApprovalStatus: isApproved,
      userEmail: user.email,
    });

    return res.json(user);
  } catch (err) {
    logger.error("Admin approval update error:", {
      error: err.message,
      adminId: req.user.id,
    });
    return res
      .status(500)
      .json({ message: "Onay durumu güncellenemedi", error: err.message });
  }
});

// Tüm teklifleri görüntüleme
router.get("/proposals", async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search = "" } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) filter.customerName = { $regex: search, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);
    const [proposals, total] = await Promise.all([
      Proposal.find(filter)
        .populate("owner", "name email")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Proposal.countDocuments(filter),
    ]);

    logger.business("Admin viewed all proposals", {
      adminId: req.user.id,
      filter: { status, search },
      resultCount: proposals.length,
    });

    return res.json({
      proposals,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    logger.error("Admin proposals list error:", {
      error: err.message,
      adminId: req.user.id,
    });
    return res
      .status(500)
      .json({ message: "Teklifler alınamadı", error: err.message });
  }
});

// Tüm ürünleri görüntüleme
router.get("/products", async (req, res) => {
  try {
    const { page = 1, limit = 20, category, isActive } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("createdBy", "name email")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    logger.business("Admin viewed all products", {
      adminId: req.user.id,
      filter: { category, isActive },
      resultCount: products.length,
    });

    return res.json({
      products,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    logger.error("Admin products list error:", {
      error: err.message,
      adminId: req.user.id,
    });
    return res
      .status(500)
      .json({ message: "Ürünler alınamadı", error: err.message });
  }
});

// Sistem istatistikleri
router.get("/stats", async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      approvedUsers,
      pendingUsers,
      totalProposals,
      approvedProposals,
      totalProducts,
      activeProducts,
      totalRevenue,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isApproved: true }),
      User.countDocuments({ isApproved: false }),
      Proposal.countDocuments(),
      Proposal.countDocuments({ status: "approved" }),
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Proposal.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: null, total: { $sum: "$grandTotal" } } },
      ]),
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    logger.business("Admin viewed system stats", {
      adminId: req.user.id,
    });

    return res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        approved: approvedUsers,
        pending: pendingUsers,
      },
      proposals: {
        total: totalProposals,
        approved: approvedProposals,
        approvalRate:
          totalProposals > 0
            ? Math.round((approvedProposals / totalProposals) * 100)
            : 0,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
      },
      revenue: {
        total: revenue,
      },
    });
  } catch (err) {
    logger.error("Admin stats error:", {
      error: err.message,
      adminId: req.user.id,
    });
    return res
      .status(500)
      .json({ message: "İstatistikler alınamadı", error: err.message });
  }
});

module.exports = router;
