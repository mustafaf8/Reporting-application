const express = require('express');
const Proposal = require('../models/Proposal');
const auth = require('../middleware/auth');

const router = express.Router();

function computeLineTotals(items) {
	return items.map((it) => ({
		name: it.name,
		quantity: Number(it.quantity),
		unitPrice: Number(it.unitPrice),
		lineTotal: Number(it.quantity) * Number(it.unitPrice)
	}));
}

function computeGrandTotal(items, { vatRate = 0, discountRate = 0, extraCosts = 0 } = {}) {
	const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
	const discounted = subtotal * (1 - (Number(discountRate) || 0) / 100);
	const withExtras = discounted + (Number(extraCosts) || 0);
	const withVat = withExtras * (1 + (Number(vatRate) || 0) / 100);
	return Math.round(withVat * 100) / 100;
}

// Create
router.post('/', auth, async (req, res) => {
	try {
		const { customerName, items = [], vatRate = 0, discountRate = 0, extraCosts = 0, status } = req.body;
		if (!customerName || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ message: 'Müşteri adı ve en az bir kalem gerekli' });
		}
		const normalizedItems = computeLineTotals(items);
		const grandTotal = computeGrandTotal(normalizedItems, { vatRate, discountRate, extraCosts });
		const proposal = await Proposal.create({
			customerName,
			items: normalizedItems,
			grandTotal,
			vatRate,
			discountRate,
			extraCosts,
			status: status || 'draft',
			owner: req.user?.id
		});
		return res.status(201).json(proposal);
	} catch (err) {
		return res.status(400).json({ message: 'Teklif oluşturulamadı', error: err.message });
	}
});

// List
router.get('/', auth, async (req, res) => {
	const { q, status, page = 1, limit = 20 } = req.query;
	const filter = {};
	if (q) filter.customerName = { $regex: q, $options: 'i' };
	if (status) filter.status = status;
	if (req.user?.id) filter.owner = req.user.id;
	const skip = (Number(page) - 1) * Number(limit);
	const [items, total] = await Promise.all([
		Proposal.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
		Proposal.countDocuments(filter)
	]);
	return res.json({ items, total, page: Number(page), limit: Number(limit) });
});

// Get by id
router.get('/:id', auth, async (req, res) => {
	const proposal = await Proposal.findById(req.params.id);
	if (!proposal) return res.status(404).json({ message: 'Teklif bulunamadı' });
	return res.json(proposal);
});

// Update
router.put('/:id', auth, async (req, res) => {
	try {
		const { customerName, items, vatRate, discountRate, extraCosts, status } = req.body;
		const update = {};
		if (customerName) update.customerName = customerName;
		if (Array.isArray(items)) {
			update.items = computeLineTotals(items);
			update.grandTotal = computeGrandTotal(update.items, { vatRate, discountRate, extraCosts });
		}
		if (vatRate !== undefined) update.vatRate = Number(vatRate);
		if (discountRate !== undefined) update.discountRate = Number(discountRate);
		if (extraCosts !== undefined) update.extraCosts = Number(extraCosts);
		if (status) update.status = status;
		update.updatedAt = new Date();
		const proposal = await Proposal.findByIdAndUpdate(req.params.id, update, { new: true });
		if (!proposal) return res.status(404).json({ message: 'Teklif bulunamadı' });
		return res.json(proposal);
	} catch (err) {
		return res.status(400).json({ message: 'Teklif güncellenemedi' });
	}
});

// Delete
router.delete('/:id', auth, async (req, res) => {
	const deleted = await Proposal.findByIdAndDelete(req.params.id);
	if (!deleted) return res.status(404).json({ message: 'Teklif bulunamadı' });
	return res.json({ message: 'Silindi' });
});

module.exports = router;


