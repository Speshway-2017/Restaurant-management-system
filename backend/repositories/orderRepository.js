const Order = require('../models/Order');

class OrderRepository {
  async findAll() {
    return await Order.find({}).sort({ createdAt: -1 });
  }

  async findById(id) {
    if (!id) return null;
    const idStr = String(id).trim();
    if (idStr.match(/^[0-9a-fA-F]{24}$/)) {
      const doc = await Order.findById(idStr);
      if (doc) return doc;
    }
    const cleanId = idStr.replace(/^#/i, '');
    return await Order.findOne({
      $or: [
        { orderId: idStr },
        { orderId: `#${idStr}` },
        { orderId: cleanId },
        { orderId: `#${cleanId}` },
        { id: idStr }
      ]
    });
  }

  async create(orderData) {
    return await Order.create(orderData);
  }

  async updateStatus(id, status, fullOrderData = {}) {
    const isPaid = status === 'Paid' || status === 'Completed' || fullOrderData.payment === 'Completed' || fullOrderData.payment === 'Paid';
    const isBillGenerated = status === 'Bill Generated' || status === 'Awaiting Payment' || fullOrderData.payment === 'Bill Generated' || fullOrderData.payment === 'Awaiting Payment';

    const targetStatus = isPaid ? 'Completed' : (status || 'Placed');
    const targetPayment = isPaid ? 'Completed' : (isBillGenerated ? 'Awaiting Payment' : (fullOrderData.payment || 'Pending'));

    const updateFields = {
      ...fullOrderData,
      status: targetStatus,
      payment: targetPayment
    };

    let existing;
    const idStr = String(id).trim();
    const cleanId = idStr.replace(/^#/i, '');

    if (idStr.match(/^[0-9a-fA-F]{24}$/)) {
      existing = await Order.findByIdAndUpdate(idStr, updateFields, { new: true });
    }

    if (!existing) {
      existing = await Order.findOneAndUpdate(
        {
          $or: [
            { orderId: idStr },
            { orderId: `#${idStr}` },
            { orderId: cleanId },
            { orderId: `#${cleanId}` },
            { id: idStr }
          ]
        },
        updateFields,
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
        status: targetStatus,
        payment: targetPayment,
        time: fullOrderData.time || 'Just now',
        items: fullOrderData.items || []
      });
    }

    return existing;
  }
}

module.exports = new OrderRepository();
