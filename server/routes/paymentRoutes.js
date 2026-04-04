const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { protectUser } = require('../middleware/authMiddleware');

router.post('/create-order', protectUser, createOrder);
router.post('/verify', protectUser, verifyPayment);

module.exports = router;
