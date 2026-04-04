const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  type: { type: String, enum: ['booking', 'payment', 'alert', 'system'], required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false }
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1 });
notificationSchema.index({ driverId: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
