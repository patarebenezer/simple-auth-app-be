// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const googleController = require('../controllers/googleController');
const facebookController = require('../controllers/facebookController');
const ensureAuthenticated = require('../middlewares/authMiddleware');
const ensureEmailVerified = require('../middlewares/ensureEmailVerified');

// Auth
router.post('/sign-up', userController.signUpUser);
router.post('/sign-in', userController.signInUser);

// Google OAuth
router.get('/auth/google', googleController.googleAuthLogin);
router.get('/auth/google/callback', googleController.googleAuthLoginCallback);

// Facebook OAuth
router.get('/auth/facebook', facebookController.facebookAuthLogin);
router.get('/auth/facebook/callback', facebookController.facebookAuthLoginCallback);

// Verify auth
router.get('/verify-email', userController.verifyEmail);
router.post('/resend-verification-email', userController.resendVerificationEmail)

// User statistics
router.get('/user-statistics', userController.getUserStatistics)

// User profile
router.get('/profile', ensureAuthenticated, userController.getUserProfile);
router.put('/profile', ensureAuthenticated, userController.updateUserName);

// Logout user
router.get('/sign-out', userController.logoutUser);

// Password reset`
router.post('/reset-password', ensureAuthenticated, ensureEmailVerified, userController.resetPassword);

// Dashboard route
router.get('/dashboard', userController.getAllUsers);

module.exports = router;