const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  stockQuantity: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  reorderLevel: { type: Number, default: 10 },
  status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], default: 'In Stock' }
}, { timestamps: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
