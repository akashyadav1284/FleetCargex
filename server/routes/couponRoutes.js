const express = require('express');
const router = express.Router();
const { applyCoupon } = require('../controllers/couponController');
const { protectUser } = require('../middleware/authMiddleware');

router.post('/apply', protectUser, applyCoupon);
module.exports = router;
