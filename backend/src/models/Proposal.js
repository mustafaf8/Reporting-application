const mongoose = require('mongoose');

const proposalItemSchema = new mongoose.Schema({
	name: { type: String, required: true },
	quantity: { type: Number, required: true, min: 1 },
	unitPrice: { type: Number, required: true, min: 0 },
	lineTotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const proposalSchema = new mongoose.Schema({
	customerName: { type: String, required: true },
	items: { type: [proposalItemSchema], required: true },
	grandTotal: { type: Number, required: true },
	status: { type: String, enum: ['draft', 'sent', 'approved', 'rejected'], default: 'draft' },
	owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	vatRate: { type: Number, default: 0 },
	discountRate: { type: Number, default: 0 },
	extraCosts: { type: Number, default: 0 },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
});

proposalSchema.pre('save', function(next) {
	this.updatedAt = new Date();
	next();
});

module.exports = mongoose.model('Proposal', proposalSchema);


