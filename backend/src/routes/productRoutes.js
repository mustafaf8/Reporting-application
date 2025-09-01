const express = require("express");
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const logger = require("../config/logger");
const { validate, schemas } = require("../middleware/validation");

const router = express.Router();

// Create
router.post("/", auth, validate(schemas.createProduct), async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      createdBy: req.user.id,
    });

    logger.business("Product created", {
      productId: product._id,
      name: product.name,
      userId: req.user.id,
    });

    return res.status(201).json(product);
  } catch (err) {
    logger.error("Product creation error:", {
      error: err.message,
      userId: req.user.id,
    });
    return res
      .status(400)
      .json({ message: "Ürün oluşturulamadı", error: err.message });
  }
});

// List
router.get(
  "/",
  auth,
  validate(schemas.productQuery, "query"),
  async (req, res) => {
    try {
      const { q, category, isActive, page = 1, limit = 20 } = req.query;

      const filter = {};
      if (q) filter.name = { $regex: q, $options: "i" };
      if (category) filter.category = category;
      if (isActive !== undefined) filter.isActive = isActive === "true";

      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        Product.find(filter)
          .populate("createdBy", "name email")
          .skip(skip)
          .limit(Number(limit))
          .sort({ createdAt: -1 }),
        Product.countDocuments(filter),
      ]);

      return res.json({
        items,
        total,
        page: Number(page),
        limit: Number(limit),
      });
    } catch (err) {
      logger.error("Product list error:", {
        error: err.message,
        userId: req.user.id,
      });
      return res
        .status(500)
        .json({ message: "Ürünler alınamadı", error: err.message });
    }
  }
);

// Get by id
router.get("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );
    if (!product) return res.status(404).json({ message: "Ürün bulunamadı" });
    return res.json(product);
  } catch (err) {
    logger.error("Product get error:", {
      error: err.message,
      productId: req.params.id,
      userId: req.user.id,
    });
    return res
      .status(500)
      .json({ message: "Ürün alınamadı", error: err.message });
  }
});

// Update
router.put("/:id", auth, validate(schemas.updateProduct), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");

    if (!product) return res.status(404).json({ message: "Ürün bulunamadı" });

    logger.business("Product updated", {
      productId: product._id,
      name: product.name,
      userId: req.user.id,
    });

    return res.json(product);
  } catch (err) {
    logger.error("Product update error:", {
      error: err.message,
      productId: req.params.id,
      userId: req.user.id,
    });
    return res
      .status(400)
      .json({ message: "Ürün güncellenemedi", error: err.message });
  }
});

// Delete
router.delete("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Ürün bulunamadı" });

    logger.business("Product deleted", {
      productId: req.params.id,
      name: product.name,
      userId: req.user.id,
    });

    return res.json({ message: "Silindi" });
  } catch (err) {
    logger.error("Product delete error:", {
      error: err.message,
      productId: req.params.id,
      userId: req.user.id,
    });
    return res
      .status(500)
      .json({ message: "Ürün silinemedi", error: err.message });
  }
});

// Get categories
router.get("/categories/list", auth, async (req, res) => {
  try {
    const categories = await Product.distinct("category", {
      category: { $ne: null, $ne: "" },
    });
    return res.json(categories);
  } catch (err) {
    logger.error("Categories list error:", {
      error: err.message,
      userId: req.user.id,
    });
    return res
      .status(500)
      .json({ message: "Kategoriler alınamadı", error: err.message });
  }
});

module.exports = router;
