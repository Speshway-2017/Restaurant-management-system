const mongoose = require('mongoose');

const staffAttendanceSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  staffName: { type: String, required: true },
  empId: { type: String, default: '' },
  role: { type: String, required: true }, // 'chef', 'waiter', 'receptionist', 'manager', 'admin'
  loginAt: { type: Date, required: true, default: Date.now },
  logoutAt: { type: Date, default: null },
  status: { type: String, enum: ['available', 'offline'], default: 'available' },
  date: { type: String, required: true }, // YYYY-MM-DD in Asia/Kolkata IST
  loginTimeFormatted: { type: String, default: '' }, // e.g. "09:32 AM"
  logoutTimeFormatted: { type: String, default: '' }, // e.g. "06:15 PM"
  durationMinutes: { type: Number, default: 0 },
  durationFormatted: { type: String, default: '' } // e.g. "4h 30m"
}, { timestamps: true });

staffAttendanceSchema.index({ staffId: 1, status: 1 });
staffAttendanceSchema.index({ date: 1, role: 1 });

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);
