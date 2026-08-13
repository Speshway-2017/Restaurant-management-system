const Coupon = require('../models/Coupon');

const getCoupons = async (req, res) => {
  try {
    const list = await Coupon.find({});
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getCoupons, createCoupon };
