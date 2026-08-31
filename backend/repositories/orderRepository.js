const Order = require('../models/Order');

class OrderRepository {
  async findAll() {
    return await Order.find({}).sort({ createdAt: -1 });
  }

  async findById(id) {
    if (!id) return null;
    const idStr = String(id).trim();
    const cleanNum = idStr.replace(/[^0-9]/g, '');
    const cleanId = idStr.replace(/^#/i, '').trim();

    if (idStr.match(/^[0-9a-fA-F]{24}$/)) {
      const doc = await Order.findById(idStr);
      if (doc) return doc;
    }

    const matchRegex = cleanNum ? new RegExp(`^(#)?(ORD-)?0*${cleanNum}$`, 'i') : null;

    const queryOr = [
      { orderId: idStr },
      { orderId: `#${idStr}` },
      { orderId: cleanId },
      { orderId: `#${cleanId}` },
      { id: idStr },
      { id: cleanId }
    ];

    if (matchRegex) {
      queryOr.push({ orderId: matchRegex }, { id: matchRegex });
    }

    return await Order.findOne({ $or: queryOr });
  }

  async create(orderData) {
    return await Order.create(orderData);
  }

  async updateStatus(id, status, fullOrderData = {}) {
    const isPaid = status === 'Paid' || status === 'Completed' || fullOrderData.payment === 'Completed' || fullOrderData.payment === 'Paid';
    const isBillGenerated = status === 'Bill Generated' || status === 'Awaiting Payment' || fullOrderData.payment === 'Bill Generated' || fullOrderData.payment === 'Awaiting Payment';

    const targetStatus = isPaid ? 'Completed' : (status || 'Placed');
    const targetPayment = isPaid ? 'Completed' : (isBillGenerated ? 'Awaiting Payment' : (fullOrderData.payment || 'Pending'));

    const idStr = String(id).trim();
    const cleanNum = idStr.replace(/[^0-9]/g, '');
    const cleanId = idStr.replace(/^#/i, '').trim();

    // Find existing order document in MongoDB
    let doc = await this.findById(idStr);

    if (!doc && cleanNum) {
      // Table fallback matching
      const tableRegex = new RegExp(`^(T-|Table\\s*)?0*${cleanNum}$`, 'i');
      doc = await Order.findOne({
        $or: [{ table: tableRegex }, { tableNumber: tableRegex }],
        status: { $nin: ['Completed', 'Paid', 'Cancelled'] },
        payment: { $ne: 'Paid' }
      });
    }

    if (doc) {
      doc.status = targetStatus;
      doc.payment = targetPayment;
      if (fullOrderData.items && Array.isArray(fullOrderData.items)) {
        doc.items = fullOrderData.items.map((it, idx) => {
          const isDelivered = Boolean(it.isDelivered || it.status === 'DELIVERED' || it.status === 'SERVED');
          const isReady = Boolean(!isDelivered && (it.isReady || it.status === 'READY' || targetStatus === 'Ready'));
          const itemStatus = isDelivered ? 'DELIVERED' : (isReady ? 'READY' : 'PREPARING');

          return {
            id: String(it.id || it._id || `item-${idx}`),
            name: it.name || 'Dish Item',
            price: Number(it.price) || 0,
            quantity: Number(it.quantity || it.qty || 1),
            status: itemStatus,
            isReady: isReady,
            isDelivered: isDelivered
          };
        });
      }
      await doc.save();
      return doc;
    }

    // Fallback: Create new order document if not found
    const newDoc = await Order.create({
      orderId: idStr.startsWith('ORD-') ? idStr : `ORD-${cleanId}`,
      table: fullOrderData.table || 'T-01',
      type: fullOrderData.type || 'Dine-In',
      customer: fullOrderData.customer || 'Guest Diner',
      phone: fullOrderData.phone || '',
      total: Number(fullOrderData.total || fullOrderData.totalAmount || 0),
      status: targetStatus,
      payment: targetPayment,
      time: fullOrderData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: (fullOrderData.items || []).map((it, idx) => ({
        id: it.id || `item-${idx}`,
        name: it.name || 'Dish Item',
        price: Number(it.price) || 0,
        quantity: Number(it.quantity || it.qty || 1),
        status: (targetStatus === 'Ready' || it.status === 'READY' || it.isReady) ? 'READY' : (it.status || 'PREPARING'),
        isReady: targetStatus === 'Ready' || Boolean(it.isReady || it.status === 'READY' || it.status === 'DELIVERED'),
        isDelivered: Boolean(it.isDelivered || it.status === 'DELIVERED' || it.status === 'SERVED')
      }))
    });
    return newDoc;
  }
}

module.exports = new OrderRepository();
