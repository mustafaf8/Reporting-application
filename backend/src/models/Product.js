const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
	name: { type: String, required: true },
	unit: { type: String, default: 'adet' },
	unitPrice: { type: Number, required: true },
	category: { type: String },
	description: { type: String },
	createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);


