const express = require('express');
const router = express.Router();
const { loginUser, getMe, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/profile/:id', getProfile);

module.exports = router;
