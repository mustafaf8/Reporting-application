const express = require('express');
const cors = require('cors');

const pdfRoutes = require('./src/routes/pdfRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', pdfRoutes);

// Health check
app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Backend server listening on port ${PORT}`);
});


