const PricingConfig = require('../models/PricingConfig');
const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const apiCache = require('../utils/cache');

// ─────────────────────────────────────────────
// CORE FARE ENGINE
// ─────────────────────────────────────────────

/**
 * Calculate fare breakdown given inputs. Used both by the API endpoint
 * and internally by the booking creation flow.
 */
const calculateFareBreakdown = async ({ vehicleType, distanceKm, loadType, timeOfDay }) => {
  // 1. Get pricing config — cache for speed
  const cacheKey = `pricing_config_${vehicleType}`;
  let config = apiCache.get(cacheKey);

  if (!config) {
    config = await PricingConfig.findOne({ vehicleName: vehicleType, isActive: true }).lean();
    if (config) apiCache.set(cacheKey, config, 1800); // cache 30 min
  }

  if (!config) {
    throw new Error(`No pricing config found for vehicle: ${vehicleType}`);
  }

  // 2. Base calculations
  const distance = distanceKm || 15;
  const baseFare = config.baseFare;
  const distanceCost = Math.round(distance * config.perKmRate);

  // 3. Load cost
  const loadMap = { small: config.loadCharges?.small || 0, medium: config.loadCharges?.medium || 50, heavy: config.loadCharges?.heavy || 150 };
  const loadCost = loadMap[loadType] || loadMap.small;

  // 4. Subtotal before multipliers
  const rawSubtotal = baseFare + distanceCost + loadCost;

  // 5. Vehicle multiplier
  const vehicleMultiplier = config.vehicleMultiplier || 1.0;
  const vehicleAdjusted = Math.round(rawSubtotal * vehicleMultiplier);

  // 6. Surge multiplier — real-time demand OR admin override
  let surgeMultiplier = 1.0;
  if (config.surgeOverride?.enabled) {
    surgeMultiplier = config.surgeOverride.multiplier || 1.0;
  } else {
    // Real-time: activeBookings / onlineDrivers
    try {
      const [activeBookings, onlineDrivers] = await Promise.all([
        Booking.countDocuments({ status: { $in: ['requested', 'accepted', 'in_progress'] } }),
        Driver.countDocuments({ isOnline: true })
      ]);
      const ratio = onlineDrivers > 0 ? activeBookings / onlineDrivers : 1;
      // Clamp between 1.0 and 1.5
      surgeMultiplier = Math.min(1.5, Math.max(1.0, ratio));
      surgeMultiplier = Math.round(surgeMultiplier * 100) / 100; // 2 decimal places
    } catch {
      surgeMultiplier = 1.0;
    }
  }

  // 7. Night surcharge (+20% between 22:00 - 06:00)
  let nightSurchargeAmount = 0;
  const hour = timeOfDay !== undefined ? timeOfDay : new Date().getHours();
  if (hour >= 22 || hour < 6) {
    const nightRate = config.nightSurcharge || 0.20;
    nightSurchargeAmount = Math.round(vehicleAdjusted * nightRate);
  }

  // 8. Final total
  const surgedAmount = Math.round(vehicleAdjusted * surgeMultiplier);
  const totalFare = surgedAmount + nightSurchargeAmount;

  return {
    baseFare,
    distanceCost,
    loadCost,
    vehicleMultiplier,
    surgeMultiplier,
    nightSurcharge: nightSurchargeAmount,
    waitingCharges: 0, // Applied at ride completion
    subtotal: rawSubtotal,
    totalFare,
    // Extra metadata for display
    configId: config._id,
    waitingChargePerMin: config.waitingChargePerMin || 2
  };
};

// ─────────────────────────────────────────────
// API: POST /api/fare/calculate
// ─────────────────────────────────────────────
const calculateFare = async (req, res) => {
  try {
    const { vehicleType, distanceKm, loadType, timeOfDay } = req.body;
    if (!vehicleType) return res.status(400).json({ success: false, error: 'vehicleType is required' });

    const breakdown = await calculateFareBreakdown({ vehicleType, distanceKm, loadType, timeOfDay });

    res.json({
      success: true,
      breakdown: {
        baseFare: breakdown.baseFare,
        distanceCost: breakdown.distanceCost,
        loadCost: breakdown.loadCost,
        vehicleMultiplier: breakdown.vehicleMultiplier,
        surgeMultiplier: breakdown.surgeMultiplier,
        nightSurcharge: breakdown.nightSurcharge,
        subtotal: breakdown.subtotal,
        totalFare: breakdown.totalFare,
        waitingChargePerMin: breakdown.waitingChargePerMin
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN: GET /api/fare/configs
// ─────────────────────────────────────────────
const getAllConfigs = async (req, res) => {
  try {
    const configs = await PricingConfig.find({}).sort({ vehicleName: 1 }).lean();
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN: PUT /api/fare/configs/:id
// ─────────────────────────────────────────────
const updateConfig = async (req, res) => {
  try {
    const { baseFare, perKmRate, vehicleMultiplier, loadCharges, nightSurcharge, waitingChargePerMin, surgeOverride, isActive } = req.body;
    const config = await PricingConfig.findByIdAndUpdate(
      req.params.id,
      { baseFare, perKmRate, vehicleMultiplier, loadCharges, nightSurcharge, waitingChargePerMin, surgeOverride, isActive },
      { new: true, runValidators: true }
    );
    if (!config) return res.status(404).json({ success: false, error: 'Config not found' });

    // Bust cache for this vehicle
    apiCache.del(`pricing_config_${config.vehicleName}`);

    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { calculateFare, calculateFareBreakdown, getAllConfigs, updateConfig };
