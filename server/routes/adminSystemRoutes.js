const express = require('express');
const router = express.Router();
const { createCargoType, createServiceType, createVehicleType, getAllMasterData } = require('../controllers/adminSystemController');

router.post('/cargo', createCargoType);
router.post('/service', createServiceType);
router.post('/vehicle', createVehicleType);
router.get('/master', getAllMasterData);

module.exports = router;
