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

const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || !String(code).trim()) {
      return res.status(400).json({ valid: false, message: 'Please enter a coupon code' });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: { $regex: new RegExp(`^${cleanCode}$`, 'i') } });

    if (!coupon) {
      return res.status(404).json({ valid: false, message: 'Invalid or expired coupon' });
    }

    if (coupon.isActive === false || coupon.status === 'Inactive') {
      return res.status(400).json({ valid: false, message: 'Coupon is currently inactive' });
    }

    // Check validity date if configured
    if (coupon.validTill && coupon.validTill !== 'Never') {
      const expiry = new Date(coupon.validTill);
      if (!isNaN(expiry.getTime()) && new Date() > expiry) {
        return res.status(400).json({ valid: false, message: 'Coupon has expired' });
      }
    }
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ valid: false, message: 'Coupon has expired' });
    }

    // Check minimum order amount
    const orderTotal = Number(subtotal || 0);
    const minOrderVal = Number(coupon.minOrder || coupon.minOrderAmount || 0);
    if (minOrderVal > 0 && orderTotal < minOrderVal) {
      return res.status(400).json({
        valid: false,
        message: `Coupon is valid only for orders above ₹${minOrderVal}.`
      });
    }

    // Check usage limits
    if (coupon.totalUsageLimit > 0 && coupon.usedCount >= coupon.totalUsageLimit) {
      return res.status(400).json({ valid: false, message: 'Coupon usage limit reached' });
    }

    // Calculate Discount Amount
    let discountAmount = 0;
    const discountVal = Number(coupon.discount || coupon.discountValue || 0);
    const discountType = String(coupon.discountType || (discountVal <= 100 ? 'PERCENTAGE' : 'FIXED')).toUpperCase();

    if (discountType === 'PERCENTAGE' || discountType === 'PERCENT') {
      discountAmount = Math.round((orderTotal * discountVal) / 100);
      const maxCap = Number(coupon.maxDiscount || coupon.maxDiscountLimit || 0);
      if (maxCap > 0 && discountAmount > maxCap) {
        discountAmount = maxCap;
      }
    } else {
      // Fixed amount discount
      discountAmount = Math.min(discountVal, orderTotal);
    }

    const finalAmount = Math.max(0, orderTotal - discountAmount);

    res.json({
      valid: true,
      code: coupon.code,
      discountType,
      discountVal,
      discountAmount,
      finalAmount,
      message: `✓ Coupon ${coupon.code} applied successfully!`
    });
  } catch (error) {
    res.status(500).json({ valid: false, message: error.message });
  }
};

module.exports = { getCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon };
