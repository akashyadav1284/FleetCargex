const { processTransaction } = require('../services/walletService');
const WalletTransaction = require('../models/Wallet');

// @desc    Add money to wallet
const addMoney = async (req, res) => {
  const { amount } = req.body;
  const userModel = req.user ? 'User' : 'Driver';
  const userId = req.user ? req.user._id : req.driver._id;
  
  try {
    const result = await processTransaction(userId, userModel, amount, 'Added money via Payment Gateway');
    res.json({ message: 'Money added successfully', balance: result.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get wallet history
const getWalletHistory = async (req, res) => {
  const userId = req.user ? req.user._id : req.driver._id;
  try {
    const history = await WalletTransaction.find({ userId }).sort('-createdAt');
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addMoney, getWalletHistory };
