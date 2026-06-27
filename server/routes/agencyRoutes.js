const express = require('express');
const router = express.Router();
const {
  loginAgency,
  getDashboardData,
  getDrivers,
  getVehicles,
  getBookings,
  createDriver,
  createVehicle,
  getVehicleTypes,
  updateProfile,
  updatePassword
} = require('../controllers/agencyController');
const { protectAgency } = require('../middleware/authMiddleware');

router.post('/auth/login', loginAgency);

router.route('/dashboard').get(protectAgency, getDashboardData);
router.route('/drivers')
  .get(protectAgency, getDrivers)
  .post(protectAgency, createDriver);
router.route('/vehicles')
  .get(protectAgency, getVehicles)
  .post(protectAgency, createVehicle);
router.route('/bookings').get(protectAgency, getBookings);
router.route('/vehicle-types').get(protectAgency, getVehicleTypes);

router.route('/profile').put(protectAgency, updateProfile);
router.route('/password').put(protectAgency, updatePassword);

module.exports = router;
