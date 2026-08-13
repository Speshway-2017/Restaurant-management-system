const express = require('express');
const router = express.Router();
const { getCoupons, createCoupon } = require('../controllers/couponController');

router.get('/', getCoupons);
router.post('/', createCoupon);

module.exports = router;
