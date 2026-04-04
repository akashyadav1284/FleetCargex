const mongoose = require('mongoose');

const vehicleTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Points to an _id within category.subcategories
  
  capacityKg: { type: Number, required: true },
  volume: { type: String },
  baseFare: { type: Number, required: true },
  perKmRate: { type: Number, required: true },
  helperAllowed: { type: Boolean, default: false },
  description: { type: String },
  icon: { type: String, default: 'truck' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Create indexes for fast querying of dynamic assignment and admin views
vehicleTypeSchema.index({ categoryId: 1, subcategoryId: 1 });
vehicleTypeSchema.index({ capacityKg: -1 });
vehicleTypeSchema.index({ isActive: 1 });

module.exports = mongoose.model('VehicleType', vehicleTypeSchema);
