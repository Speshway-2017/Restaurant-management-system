const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  seats: { type: Number, default: 4 },
  section: { type: String, default: 'Main Hall' },
  status: { type: String, enum: ['Available', 'Occupied', 'Reserved'], default: 'Available' },
  currentOrder: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Table', tableSchema);
