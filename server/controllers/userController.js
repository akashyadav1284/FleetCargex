const Booking = require('../models/Booking');
const { calculateFareBreakdown } = require('./fareController');

// @desc    Create a new booking (with server-side pricing)
const createBooking = async (req, res) => {
  const { pickupLocation, dropLocation, distance, duration, vehicleType, category, subcategory, loadType, loadWeight, helpersRequired, scheduledAt, paymentMethod } = req.body;
  try {
    // SERVER-SIDE PRICING — never trust client-sent prices
    const distanceKm = distance || 15;
    const breakdown = await calculateFareBreakdown({
      vehicleType,
      distanceKm,
      loadType: loadType || 'small',
      timeOfDay: new Date().getHours()
    });

    const booking = await Booking.create({
      userId: req.user._id,
      pickupLocation,
      dropLocation,
      distance: distanceKm,
      duration,
      vehicleType,
      category,
      subcategory,
      loadType: loadType || 'small',
      loadWeight,
      helpersRequired,
      scheduledAt,
      // New detailed pricing
      pricing: {
        baseFare: breakdown.baseFare,
        distanceCost: breakdown.distanceCost,
        loadCost: breakdown.loadCost,
        vehicleMultiplier: breakdown.vehicleMultiplier,
        surgeMultiplier: breakdown.surgeMultiplier,
        nightSurcharge: breakdown.nightSurcharge,
        waitingCharges: 0,
        subtotal: breakdown.subtotal,
        totalFare: breakdown.totalFare
      },
      // Legacy compat
      price: {
        baseFare: breakdown.baseFare,
        distanceFare: breakdown.distanceCost,
        surge: breakdown.surgeMultiplier > 1 ? Math.round(breakdown.totalFare * (breakdown.surgeMultiplier - 1) / breakdown.surgeMultiplier) : 0,
        total: breakdown.totalFare
      },
      paymentMethod,
      status: 'requested',
      pickupOtp: Math.floor(1000 + Math.random() * 9000).toString(),
      dropOtp: Math.floor(1000 + Math.random() * 9000).toString()
    });

    if (req.io && !scheduledAt) {
      const Driver = require('../models/Driver');

      console.log(`📦 Dispatching booking ${booking._id} | Fare: ₹${breakdown.totalFare}`);

      const leanBooking = {
        _id: booking._id,
        pickupLocation: booking.pickupLocation,
        dropLocation: booking.dropLocation,
        vehicleType: booking.vehicleType,
        loadType: booking.loadType,
        distance: booking.distance,
        pricing: { totalFare: breakdown.totalFare, surgeMultiplier: breakdown.surgeMultiplier },
        status: booking.status,
        pickupOtp: booking.pickupOtp,
        dropOtp: booking.dropOtp
      };

      req.io.to('available_drivers').emit('new_ride_request', leanBooking);

      try {
        const nearbyDrivers = await Driver.find({
          isOnline: true,
          'currentLocation.coordinates': { $ne: [0, 0] },
          currentLocation: {
            $nearSphere: {
              $geometry: { type: "Point", coordinates: [pickupLocation.longitude || 77.2090, pickupLocation.latitude || 28.6139] },
              $maxDistance: 50000
            }
          }
        }).limit(5);

        if (nearbyDrivers.length > 0) {
          nearbyDrivers.forEach(driver => {
            req.io.to(`driver_${driver._id}`).emit('new_ride_request', leanBooking);
          });
        }
      } catch (geoErr) {
        console.log('Geo dispatch skipped, global pool broadcast sent.');
      }
    }

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel a booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ message: `Booking already ${booking.status}` });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = req.body.reason || 'Cancelled by user';
    await booking.save();

    if (req.io) {
      req.io.to('available_drivers').emit('ride_cancelled', { bookingId: booking._id.toString() });
      req.io.to(booking._id.toString()).emit('ride_cancelled', { bookingId: booking._id.toString() });
    }

    res.json({ message: 'Booking cancelled', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user bookings
const getUserBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await Booking.countDocuments({ userId: req.user._id });
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('driverId', 'fullName vehicleDetails.numberPlate phone')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();
    res.json({ bookings, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await req.user;
    if (user) {
      res.json({ _id: user._id, fullName: user.fullName, email: user.email, phone: user.phone, walletBalance: user.walletBalance });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBooking, cancelBooking, getUserBookings, getUserProfile };
