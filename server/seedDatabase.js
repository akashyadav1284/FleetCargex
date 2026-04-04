const mongoose = require('mongoose');

// Import all models
const User = require('./models/User');
const Driver = require('./models/Driver');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const Review = require('./models/Review');
const Wallet = require('./models/Wallet');
const Admin = require('./models/Admin');
const Coupon = require('./models/Coupon');
const Notification = require('./models/Notification');

// Connect to Local MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/cargex')
  .then(async () => {
    console.log('Connected to Local MongoDB (cargex)');

    // 1. Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany(),
      Driver.deleteMany(),
      Booking.deleteMany(),
      Payment.deleteMany(),
      Review.deleteMany(),
      Wallet.deleteMany(),
      Admin.deleteMany(),
      Coupon.deleteMany(),
      Notification.deleteMany()
    ]);

    // 2. Insert dummy User
    console.log('Seeding Users...');
    const user = await User.create({
      fullName: 'Rahul Sharma',
      email: 'rahul.s@example.com',
      phone: '+919876543210',
      password: 'hashedpassword123',
      role: 'user',
      isVerified: true,
      walletBalance: 1250,
      defaultPaymentMethod: 'Wallet',
      savedAddresses: [{
        label: 'Home',
        address: 'Andheri West, Mumbai',
        latitude: 19.1136,
        longitude: 72.8297
      }]
    });

    // 3. Insert dummy Driver
    console.log('Seeding Drivers...');
    const driver = await Driver.create({
      fullName: 'Amit Kumar',
      phone: '+919988776655',
      email: 'amit.driver@example.com',
      password: 'hashedpassword123',
      isVerified: true,
      isApproved: true,
      isOnline: true,
      currentLocation: {
        type: 'Point',
        coordinates: [72.8297, 19.1136] // [longitude, latitude]
      },
      vehicleDetails: {
        type: 'mini truck',
        model: 'Tata Ace',
        numberPlate: 'MH-02-AB-1234',
        capacity: 750
      },
      ratings: {
        averageRating: 4.8,
        totalReviews: 120
      },
      earnings: {
        totalEarnings: 45000,
        todayEarnings: 1500
      },
      completedRides: 110
    });

    // 4. Insert dummy Booking
    console.log('Seeding Bookings...');
    const booking = await Booking.create({
      userId: user._id,
      driverId: driver._id,
      pickupLocation: {
        address: 'Andheri West, Mumbai',
        latitude: 19.1136,
        longitude: 72.8297
      },
      dropLocation: {
        address: 'Bandra Kurla Complex, Mumbai',
        latitude: 19.0616,
        longitude: 72.8658
      },
      distance: 12.5,
      duration: 35,
      vehicleType: 'mini truck',
      loadType: 'furniture',
      helpersRequired: true,
      price: {
        baseFare: 150,
        distanceFare: 200,
        surge: 50,
        total: 400
      },
      status: 'completed',
      paymentStatus: 'paid',
      paymentMethod: 'Wallet',
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(Date.now() - 1800000)
    });

    // Update User rideHistory
    await User.findByIdAndUpdate(user._id, { $push: { rideHistory: booking._id } });

    // 5. Insert dummy Payment
    console.log('Seeding Payments...');
    const payment = await Payment.create({
      bookingId: booking._id,
      userId: user._id,
      driverId: driver._id,
      amount: 400,
      platformCommission: 80, // 20%
      driverEarning: 320,
      paymentMethod: 'wallet',
      status: 'success'
    });

    // 6. Insert dummy Review
    console.log('Seeding Reviews...');
    const review = await Review.create({
      bookingId: booking._id,
      userId: user._id,
      driverId: driver._id,
      rating: 5,
      comment: 'Very polite and helpful with the furniture.'
    });

    // 7. Insert dummy Wallet
    console.log('Seeding Wallets...');
    const wallet = await Wallet.create({
      userId: user._id,
      balance: 850, // 1250 - 400
      transactions: [{
        type: 'debit',
        amount: 400,
        reason: `Payment for booking ${booking._id}`,
        date: new Date()
      }]
    });

    // 8. Insert dummy Admin
    console.log('Seeding Admins...');
    const admin = await Admin.create({
      name: 'System Admin',
      email: 'admin@cargex.local',
      password: 'hashedpasswordadmin',
      role: 'superadmin',
      permissions: {
        manageUsers: true,
        manageDrivers: true,
        manageBookings: true,
        managePayments: true
      }
    });

    // 9. Insert dummy Coupon
    console.log('Seeding Coupons...');
    const coupon = await Coupon.create({
      code: 'FIRST50',
      discountType: 'percentage',
      discountValue: 50,
      maxDiscount: 150,
      expiryDate: new Date(Date.now() + 86400000 * 30), // 30 days from now
      usageLimit: 1000,
      usedCount: 45
    });

    // 10. Insert dummy Notification
    console.log('Seeding Notifications...');
    const notification = await Notification.create({
      userId: user._id,
      type: 'payment',
      message: '₹400 was debited from your wallet for your recent ride.',
      isRead: false
    });

    console.log('🎉 Seeding completed successfully! Check MongoDB Compass -> cargex database.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error seeding database:', err);
    process.exit(1);
  });
