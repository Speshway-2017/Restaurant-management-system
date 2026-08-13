const express = require('express');
const router = express.Router();
const { loginUser, getProfile } = require('../controllers/authController');

router.post('/login', loginUser);
router.get('/profile/:id', getProfile);

module.exports = router;
