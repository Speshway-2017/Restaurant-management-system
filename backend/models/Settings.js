const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  restaurantName: { type: String, default: 'Flavora Kitchen' },
  brandName: { type: String, default: 'Flavora Kitchen' },
  name: { type: String, default: 'Flavora Kitchen' },
  logoUrl: { type: String, default: '/logo.png' },
  logo: { type: String, default: '/logo.png' },
  brandLogo: { type: String, default: '/logo.png' },
  tagline: { type: String, default: 'Good food. Great moments.' },
  email: { type: String, default: 'admin@flavorakitchen.in' },
  phone: { type: String, default: '+91 98765 43210' },
  address: { type: String, default: 'Plot No. 42, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033, India' },
  gstin: { type: String, default: '29AAAAA0000A1Z5' },
  fssaiLicense: { type: String, default: '11223344556677' },
  defaultGstRate: { type: String, default: '5% (Restaurant CGST 2.5% + SGST 2.5%)' }
}, { timestamps: true, strict: false });

module.exports = mongoose.model('Settings', settingsSchema);
