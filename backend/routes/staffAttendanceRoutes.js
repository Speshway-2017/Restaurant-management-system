const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  checkIn,
  checkOut,
  getCurrentAvailability,
  getAttendanceHistory,
  getMyStatus
} = require('../controllers/staffAttendanceController');

// All endpoints require authentication token
router.use(protect);

router.post('/in', checkIn);
router.post('/check-in', checkIn);
router.post('/out', checkOut);
router.post('/check-out', checkOut);
router.get('/current', getCurrentAvailability);
router.get('/history', getAttendanceHistory);
router.get('/my-status', getMyStatus);

module.exports = router;
