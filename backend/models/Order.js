const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  table: { type: String, default: 'Takeaway' },
  type: { type: String, enum: ['Dine-In', 'Takeaway', 'Delivery'], default: 'Dine-In' },
  customer: { type: String, default: 'Guest' },
  phone: { type: String, default: '' },
  items: [{
    name: String,
    price: Number,
    quantity: Number
  }],
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Placed', 'Accepted', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled'], 
    default: 'Placed' 
  },
  payment: { type: String, default: 'Pending' },
  time: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
