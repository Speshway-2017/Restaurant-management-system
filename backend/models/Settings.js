const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  restaurantName: { type: String, default: 'Flavora Kitchen' },
  branchName: { type: String, default: 'Jubilee Hills (Main Branch)' },
  tagline: { type: String, default: 'Good food. Great moments.' },
  email: { type: String, default: 'admin@flavorakitchen.in' },
  contactEmail: { type: String, default: 'admin@flavorakitchen.in' },
  phone: { type: String, default: '+91 98765 43210' },
  contactPhone: { type: String, default: '+91 98765 43210' },
  managerName: { type: String, default: 'Ram S. (On-Duty Manager)' },
  managerEmail: { type: String, default: 'manager@flavorakitchen.in' },
  managerPhone: { type: String, default: '+91 98765 43210' },
  address: { type: String, default: 'Plot No. 42, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033, India' },
  weekdayHours: { type: String, default: '11:00 AM – 10:00 PM' },
  weekendHours: { type: String, default: '10:00 AM – 12:00 AM' },
  restaurantStatus: { type: String, default: 'open' }, // 'open', 'closed', 'force_open'
  closedMessage: { type: String, default: 'We are currently closed for orders. Please visit during our operating hours!' },
  cleaningDuration: { type: String, default: '10' },
  autoAcceptOrders: { type: Boolean, default: true },
  audioAlerts: { type: Boolean, default: true },
  dispatchChime: { type: Boolean, default: true },
  prepTimeWarning: { type: String, default: '20 mins' },
  qrOrderingEnabled: { type: Boolean, default: true },
  autoPrintReceipt: { type: Boolean, default: true },
  autoCleaningExpire: { type: Boolean, default: true },
  maxDiningTime: { type: String, default: '60 mins' },
  gstin: { type: String, default: '29AAAAA0000A1Z5' },
  fssai: { type: String, default: '11223344556677' },
  fssaiLicense: { type: String, default: '11223344556677' },
  gstRate: { type: String, default: '5%' },
  defaultGstRate: { type: String, default: '5% (Restaurant CGST 2.5% + SGST 2.5%)' },
  invoiceFootnote: { type: String, default: 'Thank you for dining with Flavora Kitchen! Visit again.' }
}, { timestamps: true, strict: false });

module.exports = mongoose.model('Settings', settingsSchema);
