const CargoType = require('../models/CargoType');
const ServiceType = require('../models/ServiceType');
const VehicleType = require('../models/VehicleType');

exports.createCargoType = async (req, res) => {
  try {
    const cargo = await CargoType.create(req.body);
    res.status(201).json({ success: true, data: cargo });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.createServiceType = async (req, res) => {
  try {
    const service = await ServiceType.create(req.body);
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.createVehicleType = async (req, res) => {
  try {
    const vehicle = await VehicleType.create(req.body);
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getAllMasterData = async (req, res) => {
  try {
    const cargoTypes = await CargoType.find({});
    const serviceTypes = await ServiceType.find({});
    const vehicleTypes = await VehicleType.find({}).populate('supportedCargoTypes');
    
    res.status(200).json({
      success: true,
      data: { cargoTypes, serviceTypes, vehicleTypes }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
