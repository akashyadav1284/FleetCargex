const express = require('express');
const router = express.Router();
const { calculateFare, getAllConfigs, updateConfig } = require('../controllers/fareController');
const { protectAdmin } = require('../middleware/authMiddleware');

// Public — fare estimation
router.post('/calculate', calculateFare);

// Admin — pricing config management
router.get('/configs', protectAdmin, getAllConfigs);
router.put('/configs/:id', protectAdmin, updateConfig);

module.exports = router;
