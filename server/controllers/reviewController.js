const Review = require('../models/Review');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');

// @desc    Create new review
const createReview = async (req, res) => {
  const { bookingId, rating, comment } = req.body;
  const isUser = Boolean(req.user);
  const reviewerId = isUser ? req.user._id : req.driver._id;
  const reviewerModel = isUser ? 'User' : 'Driver';

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    const revieweeId = isUser ? booking.driver : booking.user;
    const revieweeModel = isUser ? 'Driver' : 'User';

    const review = await Review.create({
      booking: bookingId,
      reviewer: reviewerId,
      reviewerModel,
      reviewee: revieweeId,
      revieweeModel,
      rating,
      comment,
    });

    const Model = isUser ? Driver : User;
    const allReviews = await Review.find({ reviewee: revieweeId });
    const avgRating = allReviews.reduce((acc, item) => acc + item.rating, 0) / allReviews.length;
    
    await Model.findByIdAndUpdate(revieweeId, { rating: parseFloat(avgRating.toFixed(1)) });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createReview };
