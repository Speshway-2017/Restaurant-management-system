const Order = require('../models/Order');

class OrderRepository {
  async findAll(query = {}) {
    return await Order.find(query).sort({ createdAt: -1 });
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
      doc.paymentStatus = targetPayment;

      // Persist coupon and financial settlement fields to MongoDB document
      if (fullOrderData.originalTotal !== undefined) doc.originalTotal = Number(fullOrderData.originalTotal);
      if (fullOrderData.originalAmount !== undefined) doc.originalAmount = Number(fullOrderData.originalAmount);
      if (fullOrderData.subtotal !== undefined) doc.subtotal = Number(fullOrderData.subtotal);
      if (fullOrderData.gstAmount !== undefined) doc.gstAmount = Number(fullOrderData.gstAmount);
      if (fullOrderData.totalBeforeDiscount !== undefined) doc.totalBeforeDiscount = Number(fullOrderData.totalBeforeDiscount);
      if (fullOrderData.couponCode !== undefined) doc.couponCode = String(fullOrderData.couponCode);
      if (fullOrderData.discountAmount !== undefined) doc.discountAmount = Number(fullOrderData.discountAmount);
      if (fullOrderData.amountAfterDiscount !== undefined) doc.amountAfterDiscount = Number(fullOrderData.amountAfterDiscount);
      if (fullOrderData.tip !== undefined) doc.tip = Number(fullOrderData.tip);
      if (fullOrderData.tipAmount !== undefined) doc.tipAmount = Number(fullOrderData.tipAmount);
      if (fullOrderData.customerPaidAmount !== undefined) doc.customerPaidAmount = Number(fullOrderData.customerPaidAmount);
      if (fullOrderData.paymentMethod !== undefined) doc.paymentMethod = String(fullOrderData.paymentMethod);
      if (fullOrderData.transactionId !== undefined) doc.transactionId = String(fullOrderData.transactionId);
      if (fullOrderData.paidAt !== undefined) doc.paidAt = fullOrderData.paidAt;
      if (fullOrderData.finalAmount !== undefined) {
        doc.finalAmount = Number(fullOrderData.finalAmount);
        doc.total = Number(fullOrderData.finalAmount);
      } else if (fullOrderData.total !== undefined) {
        doc.total = Number(fullOrderData.total);
      }
      if (fullOrderData.chefStatus !== undefined) doc.chefStatus = String(fullOrderData.chefStatus);
      if (fullOrderData.waiterStatus !== undefined) doc.waiterStatus = String(fullOrderData.waiterStatus);
      if (fullOrderData.chefId !== undefined) doc.chefId = String(fullOrderData.chefId);
      if (fullOrderData.chefName !== undefined) doc.chefName = String(fullOrderData.chefName);
      if (fullOrderData.waiterId !== undefined) doc.waiterId = String(fullOrderData.waiterId);
      if (fullOrderData.waiterName !== undefined) doc.waiterName = String(fullOrderData.waiterName);
      if (fullOrderData.tableId !== undefined) doc.tableId = String(fullOrderData.tableId);
      if (fullOrderData.sessionId !== undefined) doc.sessionId = String(fullOrderData.sessionId);
      if (fullOrderData.claimedAt !== undefined) doc.claimedAt = fullOrderData.claimedAt;
      if (fullOrderData.chefAcceptedAt !== undefined) doc.chefAcceptedAt = fullOrderData.chefAcceptedAt;
      if (fullOrderData.chefPreparingAt !== undefined) doc.chefPreparingAt = fullOrderData.chefPreparingAt;
      if (fullOrderData.chefReadyAt !== undefined) doc.chefReadyAt = fullOrderData.chefReadyAt;
      if (fullOrderData.waiterAcceptedAt !== undefined) doc.waiterAcceptedAt = fullOrderData.waiterAcceptedAt;
      if (fullOrderData.waiterServingAt !== undefined) doc.waiterServingAt = fullOrderData.waiterServingAt;
      if (fullOrderData.waiterServedAt !== undefined) doc.waiterServedAt = fullOrderData.waiterServedAt;

      if (fullOrderData.items && Array.isArray(fullOrderData.items)) {
        doc.items = fullOrderData.items.map((it, idx) => {
          const isDelivered = Boolean(it.isDelivered || it.status === 'DELIVERED' || it.status === 'SERVED');
          const isReady = Boolean(!isDelivered && (it.isReady || it.status === 'READY'));
          const itemStatus = isDelivered ? 'DELIVERED' : (isReady ? 'READY' : (it.status === 'CANCELLED' ? 'CANCELLED' : (it.status || 'PREPARING')));

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
      managerId: fullOrderData.managerId ? String(fullOrderData.managerId) : undefined,
      originalTotal: Number(fullOrderData.originalTotal || fullOrderData.originalAmount || fullOrderData.total || 0),
      originalAmount: Number(fullOrderData.originalAmount || fullOrderData.originalTotal || fullOrderData.total || 0),
      couponCode: fullOrderData.couponCode || '',
      discountAmount: Number(fullOrderData.discountAmount || 0),
      finalAmount: fullOrderData.finalAmount !== undefined ? Number(fullOrderData.finalAmount) : Number(fullOrderData.total || 0),
      total: fullOrderData.finalAmount !== undefined ? Number(fullOrderData.finalAmount) : Number(fullOrderData.total || fullOrderData.totalAmount || 0),
      status: targetStatus,
      payment: targetPayment,
      paymentStatus: targetPayment,
      time: fullOrderData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: (fullOrderData.items || []).map((it, idx) => {
        const isDel = Boolean(it.isDelivered || it.status === 'DELIVERED' || it.status === 'SERVED');
        const isRdy = Boolean(!isDel && (it.isReady || it.status === 'READY'));
        return {
          id: it.id || `item-${idx}`,
          name: it.name || 'Dish Item',
          price: Number(it.price) || 0,
          quantity: Number(it.quantity || it.qty || 1),
          status: isDel ? 'DELIVERED' : (isRdy ? 'READY' : (it.status || 'PREPARING')),
          isReady: isRdy,
          isDelivered: isDel
        };
      })
    });
    return newDoc;
  }
}

module.exports = new OrderRepository();
