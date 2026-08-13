const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  isVeg: { type: Boolean, default: true },
  spiceLevel: { type: String, default: 'Medium' },
  prepTime: { type: String, default: '15 mins' },
  desc: { type: String, default: '' },
  img: { type: String, default: '/hero_dish_2.png' },
  isBestseller: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
