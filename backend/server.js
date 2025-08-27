const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const pdfRoutes = require('./src/routes/pdfRoutes');
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const proposalRoutes = require('./src/routes/proposalRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', pdfRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/proposals', proposalRoutes);

// Health check
app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rmr_teklif';

mongoose.connect(MONGODB_URI).then(() => {
	console.log('MongoDB connected');
	app.listen(PORT, () => {
		console.log(`Backend server listening on port ${PORT}`);
	});
}).catch((err) => {
	console.error('MongoDB connection error:', err);
	process.exit(1);
});


