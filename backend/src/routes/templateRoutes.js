const express = require("express");
const Template = require("../models/Template");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const logger = require("../config/logger");

const router = express.Router();

// Public: List published templates (şimdilik tüm kayıtlar)
router.get("/", async (req, res) => {
  try {
    const { category, q, page = 1, limit = 24 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (q) filter.name = { $regex: q, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Template.find(filter)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Template.countDocuments(filter),
    ]);

    return res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    logger.error("Template list error", { error: err.message });
    return res.status(500).json({ message: "Şablonlar alınamadı" });
  }
});

// Public: Get by id
router.get("/:id", async (req, res) => {
  try {
    const tpl = await Template.findById(req.params.id);
    if (!tpl) return res.status(404).json({ message: "Şablon bulunamadı" });
    return res.json(tpl);
  } catch (err) {
    return res.status(500).json({ message: "Şablon alınamadı" });
  }
});

// Super Admin: Create template
router.post("/", auth, admin, async (req, res) => {
  try {
    const template = await Template.create(req.body);
    return res.status(201).json(template);
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Şablon oluşturulamadı", error: err.message });
  }
});

// Super Admin: Update template
router.put("/:id", auth, admin, async (req, res) => {
  try {
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!template)
      return res.status(404).json({ message: "Şablon bulunamadı" });
    return res.json(template);
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Şablon güncellenemedi", error: err.message });
  }
});

module.exports = router;
