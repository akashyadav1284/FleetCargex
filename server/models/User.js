const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, sparse: true },
  password: { type: String },
  clerkId: { type: String, unique: true, sparse: true },
  profileImage: { type: String, default: '' },
  role: { type: String, default: 'user', enum: ['user'] },
  isVerified: { type: Boolean, default: false },
  walletBalance: { type: Number, default: 0 },
  defaultPaymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Wallet'], default: 'Cash' },
  savedAddresses: [{
    label: { type: String, enum: ['Home', 'Work', 'Other'] },
    address: { type: String },
    latitude: { type: Number },
    longitude: { type: Number }
  }],
  rideHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
  ratingsGiven: { type: Number, default: 0 }
}, {
  timestamps: true
});

const bcrypt = require('bcryptjs');

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (!this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ clerkId: 1 }, { unique: true, sparse: true });
// Create indexes for fast querying
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
