const express = require('express');
const AuthController = require('../controllers/authController');
const { authLimiter } = require('../middleware/security');
const {
  validateVendorRegistration,
  validateUserRegistration,
  validateLogin,
  validateEmail,
  validatePasswordReset
} = require('../middleware/validation');
const { anyAuth } = require('../middleware/auth');

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

// Vendor Registration
router.post('/vendor/register', [
  validateVendorRegistration,
  validateUserRegistration
], AuthController.registerVendor);

// Vendor Login
router.post('/vendor/login', validateLogin, AuthController.vendorLogin);

// Admin Login
router.post('/admin/login', validateLogin, AuthController.adminLogin);

// Password Reset Request
router.post('/forgot-password', validateEmail, AuthController.requestPasswordReset);

// Reset Password
router.post('/reset-password', validatePasswordReset, AuthController.resetPassword);

// Get Current User Profile (requires auth)
router.get('/profile', anyAuth, AuthController.getProfile);

// Update Profile (requires auth)
router.put('/profile', anyAuth, AuthController.updateProfile);

// Change Password (requires auth)
router.post('/change-password', anyAuth, AuthController.changePassword);

module.exports = router;