const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
	try {
		const { name, email, password } = req.body;
		if (!name || !email || !password) return res.error('Tüm alanlar zorunludur', 400);
		
		const existing = await User.findOne({ email });
		if (existing) return res.error('Bu e-posta zaten kayıtlı', 409);
		
		const passwordHash = await bcrypt.hash(password, 10);
		const user = await User.create({ name, email, passwordHash });
		
		return res.success({ id: user._id, name: user.name, email: user.email }, 'Kullanıcı başarıyla kayıt edildi');
	} catch (err) {
		return res.error('Kayıt olurken hata oluştu', 500);
	}
});

router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		if (!user) return res.error('Geçersiz kimlik bilgileri', 401);
		
		const ok = await bcrypt.compare(password, user.passwordHash);
		if (!ok) return res.error('Geçersiz kimlik bilgileri', 401);
		
		const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
		return res.success({ token, user: { id: user._id, name: user.name, email: user.email } }, 'Başarıyla giriş yapıldı');
	} catch (err) {
		return res.error('Giriş yapılırken hata oluştu', 500);
	}
});

// Kullanıcı bilgisini dönen endpoint (token ile)
router.get('/me', auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('_id name email');
		if (!user) return res.error('Kullanıcı bulunamadı', 404);
		return res.success({ user: { id: user._id, name: user.name, email: user.email } });
	} catch (err) {
		return res.error('Kullanıcı bilgisi alınamadı', 500);
	}
});

module.exports = router;


