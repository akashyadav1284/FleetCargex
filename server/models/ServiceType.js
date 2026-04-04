const mongoose = require('mongoose');

const serviceTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  pricingModel: { type: String, enum: ['distance', 'hour', 'fixed'], required: true },
  basePrice: { type: Number, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('ServiceType', serviceTypeSchema);
