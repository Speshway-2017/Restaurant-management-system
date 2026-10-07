const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const {
  checkIn,
  checkOut,
  getCurrentAvailability,
  getAttendanceHistory,
  getMyStatus,
  triggerAutoCheckout
} = require('../controllers/staffAttendanceController');

router.post('/in', protect, checkIn);
router.post('/check-in', protect, checkIn);
router.post('/out', protect, checkOut);
router.post('/check-out', protect, checkOut);
router.post('/trigger-auto-checkout', triggerAutoCheckout);
router.get('/current', optionalAuth, getCurrentAvailability);
router.get('/history', optionalAuth, getAttendanceHistory);
router.get('/my-status', protect, getMyStatus);

module.exports = router;
