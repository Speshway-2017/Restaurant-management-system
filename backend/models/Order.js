const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  table: { type: String, default: 'Takeaway' },
  type: { type: String, enum: ['Dine-In', 'Takeaway', 'Delivery'], default: 'Dine-In' },
  customer: { type: String, default: 'Guest' },
  phone: { type: String, default: '' },
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: Number,
    status: { type: String, enum: ['PREPARING', 'READY', 'DELIVERED'], default: 'PREPARING' },
    isReady: { type: Boolean, default: false },
    isDelivered: { type: Boolean, default: false }
  }],
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Placed', 'Accepted', 'Preparing', 'Ready', 'Served', 'Bill Generated', 'Awaiting Payment', 'Paid', 'Completed', 'Cancelled'], 
    default: 'Placed' 
  },
  payment: { type: String, default: 'Pending' },
  time: { type: String, default: '' }
}, { timestamps: true });

orderSchema.pre('save', function(next) {
  if (this.status === 'Paid' || this.status === 'Completed' || this.payment === 'Paid' || this.payment === 'Completed') {
    this.status = 'Completed';
    this.payment = 'Completed';
    if (Array.isArray(this.items)) {
      this.items.forEach(it => {
        it.status = 'DELIVERED';
        it.isDelivered = true;
        it.isReady = true;
      });
    }
  } else if (this.status === 'Bill Generated' || this.status === 'Awaiting Payment' || this.payment === 'Bill Generated' || this.payment === 'Awaiting Payment') {
    this.payment = 'Awaiting Payment';
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
