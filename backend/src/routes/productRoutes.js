const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();

// Create
router.post('/', auth, async (req, res) => {
	try {
		const product = await Product.create(req.body);
		return res.status(201).json(product);
	} catch (err) {
		return res.status(400).json({ message: 'Ürün oluşturulamadı', error: err.message });
	}
});

// List
router.get('/', auth, async (req, res) => {
	const { q, page = 1, limit = 20 } = req.query;
	const filter = q ? { name: { $regex: q, $options: 'i' } } : {};
	const skip = (Number(page) - 1) * Number(limit);
	const [items, total] = await Promise.all([
		Product.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
		Product.countDocuments(filter)
	]);
	return res.json({ items, total, page: Number(page), limit: Number(limit) });
});

// Get by id
router.get('/:id', auth, async (req, res) => {
	const product = await Product.findById(req.params.id);
	if (!product) return res.status(404).json({ message: 'Ürün bulunamadı' });
	return res.json(product);
});

// Update
router.put('/:id', auth, async (req, res) => {
	try {
		const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
		if (!product) return res.status(404).json({ message: 'Ürün bulunamadı' });
		return res.json(product);
	} catch (err) {
		return res.status(400).json({ message: 'Ürün güncellenemedi' });
	}
});

// Delete
router.delete('/:id', auth, async (req, res) => {
	const product = await Product.findByIdAndDelete(req.params.id);
	if (!product) return res.status(404).json({ message: 'Ürün bulunamadı' });
	return res.json({ message: 'Silindi' });
});

module.exports = router;


