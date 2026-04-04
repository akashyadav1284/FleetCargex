// Pricing Engine Service

const BASE_FARES = { 'Mini Truck': 150, 'Pickup': 250, 'Heavy': 500 };
const PER_KM_RATES = { 'Mini Truck': 15, 'Pickup': 20, 'Heavy': 35 };

/**
 * Calculates the dynamic fare breakdown
 * @param {string} vehicleType 
 * @param {number} distance in km
 * @param {number} duration in minutes
 * @param {boolean} isNight whether it's night time
 * @param {number} supplyDemandRatio ratio < 1 means high demand (surge)
 * @returns {Object} detailed fare breakdown
 */
const calculateFare = (vehicleType, distance, duration, isNight = false, supplyDemandRatio = 1.0, loadDetails = {}) => {
  const base = BASE_FARES[vehicleType] || 150;
  const perKm = PER_KM_RATES[vehicleType] || 15;
  
  const timeCharge = duration * 2;
  const distanceCharge = distance * perKm;

  let surgeMultiplier = 1.0;
  if (supplyDemandRatio < 0.5) surgeMultiplier = 1.8;
  else if (supplyDemandRatio < 0.8) surgeMultiplier = 1.3;

  const nightMultiplier = isNight ? 1.25 : 1.0;
  
  let cargoFee = 0;
  if (loadDetails.laborRequired) cargoFee += 300;
  if (loadDetails.insuranceRequested) cargoFee += 100;
  
  const subtotal = (base + distanceCharge + timeCharge + cargoFee) * surgeMultiplier * nightMultiplier;
  const tax = subtotal * 0.18; // 18% GST
  
  const surgeValue = subtotal - (base + distanceCharge + timeCharge);

  return {
    base,
    distance: distanceCharge,
    time: timeCharge,
    surge: parseFloat(surgeValue > 0 ? surgeValue.toFixed(2) : 0),
    tax: parseFloat(tax.toFixed(2)),
    discount: 0,
    total: Math.ceil(subtotal + tax),
  };
};

module.exports = { calculateFare };
