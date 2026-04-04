const express = require('express');
const router = express.Router();
const { triggerSOS, getLiveTrackingLink } = require('../controllers/safetyController');

router.post('/sos', triggerSOS);
router.get('/track/:bookingId', getLiveTrackingLink);

module.exports = router;
