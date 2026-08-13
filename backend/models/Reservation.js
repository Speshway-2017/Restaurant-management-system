const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  guestName: { type: String, required: true },
  phone: { type: String, required: true },
  guests: { type: Number, default: 2 },
  date: { type: String, required: true },
  timeSlot: { type: String, required: true },
  tableNo: { type: String, default: 'Unassigned' },
  status: { type: String, enum: ['Confirmed', 'Pending', 'Seated', 'Cancelled'], default: 'Confirmed' }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
