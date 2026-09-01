const mongoose = require('mongoose');

const tableSessionSchema = new mongoose.Schema({
  tableNum: { type: String, required: true },
  sessionToken: { type: String, required: true, unique: true },
  guestName: { type: String, default: 'Guest Diner' },
  phone: { type: String, default: '' },
  partySize: { type: Number, default: 2 },
  specialOccasion: { type: String, default: 'None' },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['ACTIVE', 'CLOSED'], default: 'ACTIVE' },
  orderId: { type: String, default: null },
  seatedAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('TableSession', tableSessionSchema);
