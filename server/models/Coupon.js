const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  maxDiscount: { type: Number },
  expiryDate: { type: Date, required: true },
  usageLimit: { type: Number, default: 0 }, 
  usedCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

couponSchema.index({ code: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
