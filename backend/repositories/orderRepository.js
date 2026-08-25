const Order = require('../models/Order');

class OrderRepository {
  async findAll() {
    return await Order.find({}).sort({ createdAt: -1 });
  }

  async findById(id) {
    if (typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
      return await Order.findById(id);
    }
    return await Order.findOne({ $or: [{ orderId: id }, { id: id }] });
  }

  async create(orderData) {
    return await Order.create(orderData);
  }

  async updateStatus(id, status, fullOrderData = {}) {
    let existing;
    if (typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
      existing = await Order.findByIdAndUpdate(id, { status }, { new: true });
    } else {
      existing = await Order.findOneAndUpdate(
        { $or: [{ orderId: id }, { id: id }] },
        { status },
        { new: true }
      );
    }

    if (!existing) {
      // Upsert order in MongoDB so status change persists across page refreshes
      existing = await Order.create({
        orderId: id,
        table: fullOrderData.table || 'Table 01',
        type: fullOrderData.type || 'Dine-In',
        customer: fullOrderData.customer || 'Guest',
        phone: fullOrderData.phone || '',
        total: fullOrderData.total || 0,
        status: status,
        payment: fullOrderData.payment || 'Pending',
        time: fullOrderData.time || 'Just now',
        items: fullOrderData.items || []
      });
    }

    return existing;
  }
}

module.exports = new OrderRepository();
