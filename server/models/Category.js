const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '' }
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  icon: { type: String, default: 'box' },
  subcategories: [subcategorySchema]
}, {
  timestamps: true
});

// Create index for fast name lookups since frontend queries heavily by category name
categorySchema.index({ name: 1 });

module.exports = mongoose.model('Category', categorySchema);
