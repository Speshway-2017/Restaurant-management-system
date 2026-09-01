const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  guestName: { type: String, required: true },
  phone: { type: String, required: true },
  guests: { type: Number, default: 2 },
  date: { type: String, required: true },
  timeSlot: { type: String, required: true },
  tableNo: { type: String, default: 'Unassigned' },
  section: { type: String, default: 'Main Hall' },
  specialOccasion: { type: String, default: 'None' },
  notes: { type: String, default: '' },
  confirmationSent: { type: Boolean, default: false },
  reminderSent: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Checked_In', 'Seated', 'Completed', 'Cancelled', 'No_Show'],
    default: 'Confirmed'
  }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
