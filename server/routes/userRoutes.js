const express = require('express');
const router = express.Router();
const {
  createBooking,
  cancelBooking,
  getUserBookings,
  getUserProfile,
} = require('../controllers/userController');
const { protectUser } = require('../middleware/authMiddleware');

router.route('/bookings').post(protectUser, createBooking).get(protectUser, getUserBookings);
router.put('/bookings/:id/cancel', protectUser, cancelBooking);
router.get('/profile', protectUser, getUserProfile);

module.exports = router;
