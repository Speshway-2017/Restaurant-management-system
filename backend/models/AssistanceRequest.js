const mongoose = require('mongoose');

const assistanceRequestSchema = new mongoose.Schema({
  table: { type: String, required: true },
  requestType: { type: String, default: 'Assistance' },
  note: { type: String, default: '' },
  status: { type: String, enum: ['NEW', 'ACKNOWLEDGED', 'RESOLVED'], default: 'NEW' },
  acknowledgedAt: { type: Date, default: null },
  resolvedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('AssistanceRequest', assistanceRequestSchema);
