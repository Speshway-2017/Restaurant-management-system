const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  orderId: { type: String, default: '' },
  table: { type: String, default: 'General' },
  customerName: { type: String, default: 'Guest' },
  phone: { type: String, default: '' },
  foodRating: { type: Number, min: 1, max: 5, default: 5 },
  serviceRating: { type: Number, min: 1, max: 5, default: 5 },
  ambienceRating: { type: Number, min: 1, max: 5, default: 5 },
  overallRating: { type: Number, min: 1, max: 5, default: 5 },
  comments: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
