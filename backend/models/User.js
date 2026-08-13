const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Admin', 'Resto Manager', 'Head Chef', 'Waiter', 'Receptionist'], 
    default: 'Admin' 
  },
  phone: { type: String, default: '' },
  branch: { type: String, default: 'Jubilee Hills (Main Branch)' },
  empId: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
