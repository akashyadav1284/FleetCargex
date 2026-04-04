const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  amount: { type: Number, required: true },
  platformCommission: { type: Number, required: true },
  driverEarning: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['UPI', 'Card', 'Cash', 'Wallet'], required: true },
  paymentGatewayId: { type: String }, 
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' }
}, {
  timestamps: true
});

paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ userId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
