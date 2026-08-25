const Coupon = require('../models/Coupon');

const getCoupons = async (req, res) => {
  try {
    let list = await Coupon.find({});
    if (!list || list.length === 0) {
      const seedCoupons = [
        { code: 'FLAVORA20', discount: 20, minOrder: 500, maxDiscount: 150, validTill: '2026-12-31', isActive: true },
        { code: 'WELCOME100', discount: 100, minOrder: 400, maxDiscount: 100, validTill: '2026-12-31', isActive: true },
        { code: 'BIRYANI50', discount: 50, minOrder: 300, maxDiscount: 50, validTill: '2026-12-31', isActive: true }
      ];
      await Coupon.insertMany(seedCoupons);
      list = await Coupon.find({});
    }
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

const updateCoupon = async (req, res) => {
  try {
    const updated = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCoupons, createCoupon, updateCoupon, deleteCoupon };
