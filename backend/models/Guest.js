const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, default: '' },
  visitCount: { type: Number, default: 1 },
  loyaltyPoints: { type: Number, default: 100 },
  lastVisitDate: { type: Date, default: Date.now },
  preferences: [{ type: String }],
  specialOccasions: [{
    occasion: { type: String, default: 'Birthday' },
    date: { type: String, default: '' }
  }],
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Guest', guestSchema);
