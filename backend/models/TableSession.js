const mongoose = require('mongoose');

const tableSessionSchema = new mongoose.Schema({
  tableNum: { type: String, required: true },
  sessionToken: { type: String, required: true, unique: true },
  guestName: { type: String, default: '' },
  phone: { type: String, default: '' },
  partySize: { type: Number, default: 2 },
  specialOccasion: { type: String, default: 'None' },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['ACTIVE', 'CLOSED'], default: 'ACTIVE' },
  isWalkIn: { type: Boolean, default: false },
  isReceptionistAssigned: { type: Boolean, default: false },
  deviceToken: { type: String, default: null },
  customerToken: { type: String, default: null },
  orderId: { type: String, default: null },
  seatedAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null }
}, { timestamps: true });

// ATOMIC DATABASE CONSTRAINT: Only ONE active session can exist per tableNum in MongoDB at any time
tableSessionSchema.index(
  { tableNum: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);

module.exports = mongoose.model('TableSession', tableSessionSchema);
