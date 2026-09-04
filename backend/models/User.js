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
  attendanceStatus: { type: String, default: 'Present' },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null }
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
  if (!candidatePassword) return false;
  if (this.password && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$'))) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    if (isMatch) return true;

    // Check seed default password variations for demo convenience
    const cleanEmail = (this.email || '').toLowerCase().trim();
    if ((candidatePassword === 'admin123' || candidatePassword === 'admin') && cleanEmail.includes('admin')) {
      return (await bcrypt.compare('admin123password', this.password)) || (await bcrypt.compare('admin123', this.password)) || (await bcrypt.compare('admin', this.password));
    }
    if ((candidatePassword === 'manager123' || candidatePassword === 'manager') && cleanEmail.includes('manager')) {
      return (await bcrypt.compare('manager123password', this.password)) || (await bcrypt.compare('manager123', this.password)) || (await bcrypt.compare('manager', this.password));
    }
    if ((candidatePassword === 'chef123' || candidatePassword === 'chef') && cleanEmail.includes('chef')) {
      return (await bcrypt.compare('chef123password', this.password)) || (await bcrypt.compare('chef123', this.password)) || (await bcrypt.compare('chef', this.password));
    }
    if ((candidatePassword === 'waiter123' || candidatePassword === 'waiter') && cleanEmail.includes('waiter')) {
      return (await bcrypt.compare('waiter123password', this.password)) || (await bcrypt.compare('waiter123', this.password)) || (await bcrypt.compare('waiter', this.password));
    }
    if ((candidatePassword === 'receptionist123' || candidatePassword === 'receptionist') && (cleanEmail.includes('reception') || cleanEmail.includes('host'))) {
      return (await bcrypt.compare('receptionist123password', this.password)) || (await bcrypt.compare('receptionist123', this.password)) || (await bcrypt.compare('receptionist', this.password));
    }
    return false;
  }
  return candidatePassword === this.password;
};

module.exports = mongoose.model('User', userSchema);
