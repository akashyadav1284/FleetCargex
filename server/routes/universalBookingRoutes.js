const express = require('express');
const router = express.Router();
const { getCargoCategories, getCargoByCategory, getRecommendations } = require('../controllers/universalBookingController');

router.get('/categories', getCargoCategories);
router.get('/cargo/:category', getCargoByCategory);
router.post('/recommend', getRecommendations);

module.exports = router;
