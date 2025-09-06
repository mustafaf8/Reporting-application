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
    let [items, total] = await Promise.all([
      Template.find(filter)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Template.countDocuments(filter),
    ]);

    // Seed default templates if empty
    if (total === 0) {
      const seed = [
        {
          name: "Modern Kurumsal",
          description: "Profesyonel kurumsal çizgi",
          category: "corporate",
          previewImageUrl: "/static/templates/2.jpg",
          ejsFile: "proposal-modern-corporate.ejs",
        },
        {
          name: "Yenilikçi Teknoloji",
          description: "Dinamik ve modern teknoloji teması",
          category: "tech",
          previewImageUrl: "/static/templates/2.jpg",
          ejsFile: "proposal-innovative-tech.ejs",
        },
        {
          name: "Doğa & Çevre Dostu",
          description: "Sürdürülebilir yeşil tema",
          category: "eco",
          previewImageUrl: "/static/templates/2.jpg",
          ejsFile: "proposal-eco-green.ejs",
        },
        {
          name: "Zarif & Prestijli",
          description: "Bordo-altın premium tema",
          category: "premium",
          previewImageUrl: "/static/templates/2.jpg",
          ejsFile: "proposal-elegant-premium.ejs",
        },
        {
          name: "Minimal & Sade",
          description: "Tipografi odaklı minimal tasarım",
          category: "minimal",
          previewImageUrl: "/static/templates/2.jpg",
          ejsFile: "proposal-minimal-clean.ejs",
        },
      ];
      await Template.insertMany(
        seed.map((s) => ({
          ...s,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
      items = seed; // hızlıca geri döndür
      total = seed.length;
    }

    // Geçici: tüm kart önizlemelerini tek görsele sabitle (tam URL)
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const forced = `${baseUrl}/static/templates/2.jpg`;
    const normalized = (items || []).map((it) => {
      const obj = typeof it.toObject === "function" ? it.toObject() : it;
      return { ...obj, previewImageUrl: forced };
    });

    return res.json({
      items: normalized,
      total,
      page: Number(page),
      limit: Number(limit),
    });
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

// Public: Get live HTML preview rendered from EJS (no PDF)
router.post("/:id/preview", async (req, res) => {
  try {
    const tpl = await Template.findById(req.params.id);
    if (!tpl) return res.status(404).json({ message: "Şablon bulunamadı" });

    const path = require("path");
    const ejs = require("ejs");

    const payload = req.body || {};
    const file = tpl.ejsFile || "proposal-template.ejs";
    const abs = path.join(__dirname, "..", "templates", file);

    const html = await ejs.renderFile(
      abs,
      {
        customerName: payload.customerName || "Önizleme Müşterisi",
        items: payload.items || [{ name: "Ürün", quantity: 1, unitPrice: 100 }],
        createdAt: Date.now(),
        status: payload.status,
        subtotal: 100,
        vatRate: Number(payload.vatRate || 0),
        vatAmount: 0,
        discountRate: Number(payload.discountRate || 0),
        extraCosts: Number(payload.extraCosts || 0),
        grandTotal: 100,
        company: {
          ...payload.company,
          ...payload.customizations?.company,
          logoUrl:
            payload.customizations?.brand?.logoUrl || payload.company?.logoUrl,
          heroImage:
            payload.customizations?.images?.hero || payload.company?.heroImage,
          gallery:
            payload.customizations?.images?.gallery || payload.company?.gallery,
        },
        customer: payload.customer || {},
        issuer: payload.issuer || {},
        aboutRmr: payload.aboutRmr,
        design: payload.customizations?.design || {},
        customizations: payload.customizations || {},
        formatCurrency: (v) =>
          new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
          }).format(Number(v || 0)),
      },
      { async: true }
    );

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (err) {
    return res.status(500).json({ message: "Önizleme oluşturulamadı" });
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
