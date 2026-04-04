const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { 
  loginSchema, 
  adminLoginSchema, 
  registerUserSchema, 
  registerDriverSchema 
} = require('../utils/schemas');
const {
  registerUser,
  loginUser,
  registerDriver,
  loginDriver,
  loginAdmin,
  refreshContext,
  logout,
  clerkSyncUser
} = require('../controllers/authController');

router.post('/register/user', validate(registerUserSchema), registerUser);
router.post('/login/user', validate(loginSchema), loginUser);

router.post('/register/driver', validate(registerDriverSchema), registerDriver);
router.post('/login/driver', validate(loginSchema), loginDriver);

router.post('/login/admin', validate(adminLoginSchema), loginAdmin);

// Secure Session Endpoints
router.post('/refresh', refreshContext);
router.post('/logout', logout);
router.post('/clerk-sync', clerkSyncUser);

module.exports = router;
