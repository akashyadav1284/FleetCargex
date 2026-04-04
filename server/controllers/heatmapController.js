const Booking = require('../models/Booking');

// @desc    Get demand heatmap data
const getDemandHeatmap = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const bookings = await Booking.find({ 
      createdAt: { $gte: oneDayAgo } 
    }).select('pickupLocation');

    const heatmapData = bookings.map(b => ({
      lat: b.pickupLocation.lat,
      lng: b.pickupLocation.lng,
      weight: 1
    }));

    res.json(heatmapData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDemandHeatmap };
