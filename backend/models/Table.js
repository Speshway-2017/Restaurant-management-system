const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  seats: { type: Number, default: 4 },
  section: { type: String, default: 'Main Hall' },
  status: { type: String, enum: ['Available', 'Occupied', 'Reserved', 'Billing', 'Cleaning'], default: 'Available' },
  currentOrder: { type: String, default: '' },
  activeSessionId: { type: String, default: null },
  mergedWith: [{ type: String }],
  cleaningUntil: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Table', tableSchema);
