const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  tokenNum: { type: String, required: true, unique: true },
  guestName: { type: String, required: true },
  phone: { type: String, required: true },
  partySize: { type: Number, default: 2 },
  preferredSection: { type: String, default: 'Any Section' },
  specialOccasion: { type: String, default: 'None' },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['WAITING', 'CALLED', 'SEATED', 'NO_SHOW', 'EXPIRED', 'CANCELLED'],
    default: 'WAITING'
  },
  calledAt: { type: Date, default: null },
  seatedAt: { type: Date, default: null },
  estimatedWaitMins: { type: Number, default: 15 },
  position: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Waitlist', waitlistSchema);
