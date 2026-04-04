const mongoose = require('mongoose');

const pricingConfigSchema = new mongoose.Schema({
  vehicleName: { type: String, required: true, unique: true },

  baseFare: { type: Number, required: true },
  perKmRate: { type: Number, required: true },
  vehicleMultiplier: { type: Number, required: true, default: 1.0 },

  loadCharges: {
    small: { type: Number, default: 0 },
    medium: { type: Number, default: 50 },
    heavy: { type: Number, default: 150 }
  },

  nightSurcharge: { type: Number, default: 0.20 },    // +20% at night
  waitingChargePerMin: { type: Number, default: 2 },   // ₹2/min

  // Admin override for surge
  surgeOverride: {
    enabled: { type: Boolean, default: false },
    multiplier: { type: Number, default: 1.0 }
  },

  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

pricingConfigSchema.index({ vehicleName: 1 });
pricingConfigSchema.index({ isActive: 1 });

module.exports = mongoose.model('PricingConfig', pricingConfigSchema);
