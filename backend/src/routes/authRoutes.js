const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
	try {
		const { name, email, password } = req.body;
		if (!name || !email || !password) return res.status(400).json({ message: 'Tüm alanlar zorunludur' });
		const existing = await User.findOne({ email });
		if (existing) return res.status(409).json({ message: 'Bu e-posta zaten kayıtlı' });
		const passwordHash = await bcrypt.hash(password, 10);
		const user = await User.create({ name, email, passwordHash });
		return res.status(201).json({ id: user._id, name: user.name, email: user.email });
	} catch (err) {
		return res.status(500).json({ message: 'Kayıt olurken hata' });
	}
});

router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		if (!user) return res.status(401).json({ message: 'Geçersiz kimlik bilgileri' });
		const ok = await bcrypt.compare(password, user.passwordHash);
		if (!ok) return res.status(401).json({ message: 'Geçersiz kimlik bilgileri' });
		const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
		return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
	} catch (err) {
		return res.status(500).json({ message: 'Girişte hata' });
	}
});

module.exports = router;


