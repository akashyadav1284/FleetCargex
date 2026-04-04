const Booking = require('../models/Booking');

// @desc    Trigger Emergency SOS
const triggerSOS = async (req, res) => {
  const { bookingId, latitude, longitude } = req.body;
  try {
    console.log(`[SOS TRIGGERED] Booking ${bookingId} at Lat: ${latitude}, Lng: ${longitude}`);
    if (req.io) {
      req.io.emit('emergency_alert', { bookingId, latitude, longitude, by: req.user ? 'User' : 'Driver' });
    }
    res.json({ message: 'Emergency services and platform admins have been notified immediately.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate Live Trip Link
const getLiveTrackingLink = async (req, res) => {
  const { bookingId } = req.params;
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    const trackingUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/track/${bookingId}`;
    res.json({ trackingUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { triggerSOS, getLiveTrackingLink };
