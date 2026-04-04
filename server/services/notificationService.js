// Mock Notification Service
const sendNotification = async (userId, userModel, title, body, io) => {
  console.log(`[NOTIFICATION] To ${userModel} ${userId}: [${title}] ${body}`);
  
  if (io) {
    io.emit('new_notification', { userId, title, body });
  }
  
  // Placeholder: Integrate SendGrid for Email and Twilio for SMS
  return true;
};

module.exports = { sendNotification };
