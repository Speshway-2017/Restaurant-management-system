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
    status: { type: String, default: 'PLACED' },
    isReady: { type: Boolean, default: false },
    isDelivered: { type: Boolean, default: false }
  }],
  total: { type: Number, required: true },
  originalTotal: { type: Number },
  originalAmount: { type: Number },
  subtotal: { type: Number },
  gstAmount: { type: Number, default: 0 },
  totalBeforeDiscount: { type: Number },
  couponCode: { type: String, default: '' },
  discountAmount: { type: Number, default: 0 },
  amountAfterDiscount: { type: Number },
  tip: { type: Number, default: 0 },
  tipAmount: { type: Number, default: 0 },
  customerPaidAmount: { type: Number },
  paymentMethod: { type: String, default: 'UPI' },
  status: { 
    type: String, 
    default: 'Placed' 
  },
  payment: { type: String, default: 'Pending' },
  paymentStatus: { type: String, default: 'Pending' },
  transactionId: { type: String, default: '' },
  paidAt: { type: Date },
  time: { type: String, default: '' },
  notes: { type: String, default: '' },
  managerId: { type: String, index: true, default: '' },
  tableId: { type: String, default: '' },
  sessionId: { type: String, default: '' },
  chefStatus: { 
    type: String, 
    enum: ['NEW', 'ACCEPTED', 'PREPARING', 'READY'], 
    default: 'NEW' 
  },
  waiterStatus: { 
    type: String, 
    enum: ['PENDING', 'ACCEPTED', 'SERVING', 'SERVED'], 
    default: 'PENDING' 
  },
  chefId: { type: String, index: true, default: '' },
  chefName: { type: String, default: '' },
  claimedAt: { type: Date },
  chefAcceptedAt: { type: Date },
  chefPreparingAt: { type: Date },
  chefReadyAt: { type: Date },
  waiterId: { type: String, index: true, default: '' },
  waiterName: { type: String, default: '' },
  waiterAcceptedAt: { type: Date },
  waiterServingAt: { type: Date },
  waiterServedAt: { type: Date }
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
