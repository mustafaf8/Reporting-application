const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
	const authHeader = req.headers.authorization || '';
	const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
	if (!token) return res.status(401).json({ message: 'Yetkilendirme gerekli' });
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
		req.user = decoded; // { id, email }
		return next();
	} catch (err) {
		return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token' });
	}
};


