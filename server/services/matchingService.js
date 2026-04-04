// Driver Matching Engine Service
const Driver = require('../models/Driver');

/**
 * Finds the best driver using a scoring algorithm
 * @param {Array<Number>} coordinates [lng, lat]
 * @param {string} vehicleType
 * @param {number} maxDistance in meters
 */
const findBestDriver = async (coordinates, vehicleType, maxDistance = 5000) => {
  const nearbyDrivers = await Driver.find({
    vehicleType,
    isAvailable: true,
    isApproved: true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: maxDistance,
      },
    },
  }).limit(10);

  if (nearbyDrivers.length === 0) return null;

  // Prioritize logic: Proximity handled by $near. Adding Rating and Acceptance Rate constraints
  nearbyDrivers.sort((a, b) => {
    const scoreA = (a.rating * 10) + (a.acceptanceRate * 0.2);
    const scoreB = (b.rating * 10) + (b.acceptanceRate * 0.2);
    return scoreB - scoreA;
  });

  return nearbyDrivers[0];
};

module.exports = { findBestDriver };
