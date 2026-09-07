const express = require('express');
const router = express.Router();
const {
  loginUser,
  getMe,
  updateMe,
  getManagerSettings,
  updateManagerSettings,
  getManagerNotifications,
  markNotificationsRead,
  getManagerActivities,
  addManagerActivity,
  getProfile,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Exact authenticated user endpoints (Strictly derived from req.user._id)
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.patch('/me', protect, updateMe);

// Manager-isolated settings & preferences
router.get('/me/settings', protect, getManagerSettings);
router.put('/me/settings', protect, updateManagerSettings);

// Manager-isolated notifications
router.get('/me/notifications', protect, getManagerNotifications);
router.patch('/me/notifications/read', protect, markNotificationsRead);

// Manager-isolated activities
router.get('/me/activities', protect, getManagerActivities);
router.post('/me/activities', protect, addManagerActivity);

router.get('/profile/:id', getProfile);

module.exports = router;
