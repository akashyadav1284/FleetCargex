const cron = require('node-cron');
const Booking = require('../models/Booking');

const initCronJobs = (io) => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Checking for upcoming scheduled bookings...');
    try {
      const now = new Date();
      const in30Mins = new Date(now.getTime() + 30 * 60000);

      const upcomingBookings = await Booking.find({
        status: 'pending',
        scheduledTime: { $gte: now, $lte: in30Mins },
      });

      if (upcomingBookings.length > 0) {
        console.log(`[CRON] Found ${upcomingBookings.length} upcoming scheduled rides. Broadcasting...`);
        upcomingBookings.forEach((booking) => {
          if (io) io.emit('new_scheduled_ride_request', booking);
        });
      }
    } catch (error) {
      console.error('[CRON] Error:', error);
    }
  });
};

module.exports = { initCronJobs };
