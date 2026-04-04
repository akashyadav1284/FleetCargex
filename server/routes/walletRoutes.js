const express = require('express');
const router = express.Router();
const { addMoney, getWalletHistory } = require('../controllers/walletController');
const { protectUser, protectDriver } = require('../middleware/authMiddleware');

const protectAny = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    protectUser(req, res, err => {
      if (!err && req.user) return next();
      protectDriver(req, res, next);
    });
  } else {
    res.status(401).json({ message: 'Not authorized' });
  }
};

router.route('/add').post(protectAny, addMoney);
router.route('/history').get(protectAny, getWalletHistory);

module.exports = router;
