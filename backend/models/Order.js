const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  table: { type: String, default: 'Takeaway' },
  type: { type: String, default: 'Dine-In' },
  customer: { type: String, default: 'Guest Diner' },
  phone: { type: String, default: '' },
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: Number,
    status: { type: String, default: 'PREPARING' },
    isReady: { type: Boolean, default: false },
    isDelivered: { type: Boolean, default: false }
  }],
  total: { type: Number, required: true },
  status: { 
    type: String, 
    default: 'Placed' 
  },
  payment: { type: String, default: 'Pending' },
  paymentStatus: { type: String, default: 'Pending' },
  time: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { timestamps: true, strict: false });

orderSchema.pre('save', function(next) {
  if (this.status === 'Paid' || this.status === 'Completed' || this.payment === 'Paid' || this.payment === 'Completed' || this.paymentStatus === 'Paid') {
    this.status = 'Completed';
    this.payment = 'Paid';
    this.paymentStatus = 'Paid';
    if (Array.isArray(this.items)) {
      this.items.forEach(it => {
        it.status = 'DELIVERED';
        it.isDelivered = true;
        it.isReady = true;
      });
    }
  } else if (this.status === 'Bill Generated' || this.status === 'Awaiting Payment' || this.payment === 'Bill Generated' || this.payment === 'Awaiting Payment') {
    this.payment = 'Awaiting Payment';
    this.paymentStatus = 'Awaiting Payment';
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
