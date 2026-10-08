const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  table: { type: String, default: 'Takeaway' },
  type: { type: String, default: 'Dine-In' },
  customer: { type: String, default: 'Guest Diner' },
  phone: { type: String, default: '' },
  items: [{
    id: String,
    menuItemId: String,
    name: String,
    price: Number, // unitPrice for backward compatibility
    basePrice: Number,
    spiceLevel: String,
    selectedSpiceLevel: String,
    spiceLevelPrice: { type: Number, default: 0 },
    selectedAddOns: [{
      name: String,
      price: Number
    }],
    addOns: [{
      name: String,
      price: Number
    }],
    unitPrice: Number,
    quantity: Number,
    totalPrice: Number,
    status: { type: String, default: 'PLACED' },
    isReady: { type: Boolean, default: false },
    isDelivered: { type: Boolean, default: false }
  }],
  total: { type: Number, required: true },
  originalTotal: { type: Number },
  originalAmount: { type: Number },
  subtotal: { type: Number },
  gstRate: { type: String, default: '5%' },
  cgstRate: { type: Number },
  sgstRate: { type: Number },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  grandTotal: { type: Number },
  gstAmount: { type: Number, default: 0 },
  totalBeforeDiscount: { type: Number },
  couponCode: { type: String, default: '' },
  discountAmount: { type: Number, default: 0 },
  amountAfterDiscount: { type: Number },
  tip: { type: Number, default: 0 },
  tipAmount: { type: Number, default: 0 },
  customerPaidAmount: { type: Number },
  paymentMethod: { type: String, default: '' },
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
        if (it.status !== 'CANCELLED' && !it.isCancelled) {
          it.status = 'DELIVERED';
          it.isDelivered = true;
          it.isReady = true;
        }
      });
    }
  } else if (this.status === 'Bill Generated' || this.status === 'Awaiting Payment' || this.payment === 'Bill Generated' || this.payment === 'Awaiting Payment') {
    this.payment = 'Awaiting Payment';
    this.paymentStatus = 'Awaiting Payment';
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
