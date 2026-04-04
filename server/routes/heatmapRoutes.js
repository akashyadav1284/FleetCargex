const express = require('express');
const router = express.Router();
const { getDemandHeatmap } = require('../controllers/heatmapController');

router.get('/', getDemandHeatmap);
module.exports = router;
