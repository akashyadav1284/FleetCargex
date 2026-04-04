// Wallet transaction service
const User = require('../models/User');
const Driver = require('../models/Driver');
const WalletTransaction = require('../models/Wallet');

const processTransaction = async (userId, userModel, amount, description, bookingId = null) => {
  const Model = userModel === 'User' ? User : Driver;
  
  const person = await Model.findById(userId);
  if (!person) throw new Error(`${userModel} not found`);

  if (amount < 0 && person.walletBalance < Math.abs(amount)) {
    throw new Error('Insufficient wallet balance');
  }

  person.walletBalance += amount;
  await person.save();

  const transaction = await WalletTransaction.create({
    userId,
    userModel,
    amount: Math.abs(amount),
    type: amount >= 0 ? 'credit' : 'debit',
    description,
    bookingId,
  });

  return { balance: person.walletBalance, transaction };
};

module.exports = { processTransaction };
