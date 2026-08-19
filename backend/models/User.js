const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['Admin', 'Manager', 'Resto Manager', 'Chef', 'Head Chef', 'Waiter', 'Receptionist'], 
    default: 'Manager' 
  },
  phone: { type: String, default: '' },
  documentUrl: { type: String, default: '' },
  branch: { type: String, default: 'Jubilee Hills (Main Branch)' },
  empId: { type: String, default: '' },
  status: { type: String, default: 'Active' },
  checkInTime: { type: String, default: '09:00 AM' },
  checkOutTime: { type: String, default: '06:00 PM' },
  scheduledShift: { type: String, default: '09:00 AM – 06:00 PM (Morning)' },
  hoursLogged: { type: String, default: '8h 30m' },
  attendanceStatus: { type: String, default: 'Present' }
}, { timestamps: true });

// Pre-save hook: Automatically hash password using bcrypt before saving to database
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method: Verify candidate password against stored bcrypt hash
userSchema.methods.matchPassword = async function(candidatePassword) {
  if (this.password && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$'))) {
    return await bcrypt.compare(candidatePassword, this.password);
  }
  return candidatePassword === this.password;
};

module.exports = mongoose.model('User', userSchema);
