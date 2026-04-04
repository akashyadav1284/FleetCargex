const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String }
}, {
  timestamps: true
});

reviewSchema.index({ driverId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
