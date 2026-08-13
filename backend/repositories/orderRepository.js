const Order = require('../models/Order');

class OrderRepository {
  async findAll() {
    return await Order.find({}).sort({ createdAt: -1 });
  }

  async findById(id) {
    return await Order.findById(id);
  }

  async create(orderData) {
    return await Order.create(orderData);
  }

  async updateStatus(id, status) {
    return await Order.findByIdAndUpdate(id, { status }, { new: true });
  }
}

module.exports = new OrderRepository();
