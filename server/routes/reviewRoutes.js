const express = require('express');
const router = express.Router();
const { createReview } = require('../controllers/reviewController');
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

router.post('/', protectAny, createReview);
module.exports = router;
