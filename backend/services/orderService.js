const orderRepository = require('../repositories/orderRepository');
const Table = require('../models/Table');

class OrderService {
  async getOrders() {
    return await orderRepository.findAll() || [];
  }

  async createOrder(data) {
    // Format table number cleanly
    const rawTable = data.table || data.tableNumber || data.tableId || 'T-10';
    const rawDigits = String(rawTable).replace(/[^0-9]/g, '');
    const cleanNum = rawDigits ? String(parseInt(rawDigits, 10)) : '10';
    const formattedTable = `T-${cleanNum.padStart(2, '0')}`;

    // Normalize incoming new items
    const newIncomingItems = Array.isArray(data.items) ? data.items.map((item, idx) => ({
      id: item.id || item._id || `item-${Date.now()}-${idx}`,
      name: item.name || item.dishId || 'Delicious Item',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity || item.qty || 1),
      status: item.status || (item.isDelivered ? 'DELIVERED' : (item.isReady ? 'READY' : 'PLACED')),
      isReady: Boolean(item.isReady || item.status === 'READY' || item.status === 'DELIVERED'),
      isDelivered: Boolean(item.isDelivered || item.status === 'DELIVERED')
    })) : [];

    const OrderModel = require('../models/Order');
    const exactRegex = new RegExp(`^(T-|Table\\s*)?0*${cleanNum}$`, 'i');

    // 1. Check if an ACTIVE (open/unpaid) order already exists for this table
    let existingActiveOrder = await OrderModel.findOne({
      $or: [
        { table: formattedTable },
        { table: `Table ${cleanNum}` },
        { table: cleanNum },
        { table: exactRegex }
      ],
      status: { $nin: ['Completed', 'Paid', 'Cancelled'] },
      payment: { $ne: 'Paid' }
    });

    if (existingActiveOrder) {
      // Preserve original customer details established in first order
      const originalCustomer = (existingActiveOrder.customer && existingActiveOrder.customer !== 'Guest Diner' && existingActiveOrder.customer !== 'Guest')
        ? existingActiveOrder.customer
        : (data.customer || data.guestName || existingActiveOrder.customer || 'Guest Diner');

      existingActiveOrder.customer = String(originalCustomer).trim();

      // Append new chef notes if provided
      const newNotes = (data.notes || data.chefNotes || data.instructions || '').trim();
      if (newNotes && !existingActiveOrder.notes?.includes(newNotes)) {
        existingActiveOrder.notes = existingActiveOrder.notes ? `${existingActiveOrder.notes} | ${newNotes}` : newNotes;
      }

      // MERGE NEW ITEMS INTO EXISTING ACTIVE ORDER (SAME ORDER ID)
      const existingItems = Array.isArray(existingActiveOrder.items) ? [...existingActiveOrder.items] : [];

      // Append new items while preserving existing item statuses completely
      newIncomingItems.forEach((newItem, idx) => {
        existingItems.push({
          id: newItem.id || `item-${Date.now()}-${idx}`,
          name: newItem.name,
          price: Number(newItem.price) || 0,
          quantity: Number(newItem.quantity || newItem.qty || 1),
          status: 'PLACED',
          isReady: false,
          isDelivered: false
        });
      });

      existingActiveOrder.items = existingItems;

      // Recalculate total amount for the combined order
      const newCalculatedTotal = existingItems.reduce((sum, it) => {
        const q = Number(it.quantity || it.qty || 1);
        const p = Number(it.price) || 0;
        return sum + (p * q);
      }, 0);

      existingActiveOrder.total = newCalculatedTotal;

      // Reopen/continue order status if new unserved items are added
      const unservedCount = existingItems.filter(i => !i.isDelivered && !i.isReady && i.status !== 'SERVED' && i.status !== 'DELIVERED' && i.status !== 'READY').length;
      if (unservedCount > 0) {
        existingActiveOrder.status = 'Placed';
      } else {
        const servedCount = existingItems.filter(i => i.isDelivered || i.status === 'SERVED' || i.status === 'DELIVERED').length;
        if (servedCount > 0 && servedCount < existingItems.length) {
          existingActiveOrder.status = 'PARTIALLY DELIVERED';
        } else {
          existingActiveOrder.status = 'Placed';
        }
      }

      await existingActiveOrder.save();

      // Ensure table remains occupied with this currentOrder
      try {
        await Table.findOneAndUpdate(
          {
            $or: [
              { number: formattedTable },
              { number: cleanNum },
              { number: `T-${cleanNum}` },
              { name: exactRegex },
              { number: exactRegex }
            ]
          },
          { status: 'Occupied', currentOrder: existingActiveOrder.orderId || existingActiveOrder._id },
          { new: true }
        );
      } catch (e) { }

      return existingActiveOrder;
    }

    // 2. If NO active order exists, generate a new orderId and create a brand new order document
    const orderId = data.orderId || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderData = {
      orderId: orderId,
      table: formattedTable,
      type: (data.type === 'Takeaway' || data.type === 'Delivery') ? data.type : 'Dine-In',
      customer: data.customer || data.guestName || 'Guest Diner',
      phone: data.phone || '+91 Direct QR',
      items: newIncomingItems,
      total: Number(data.total || data.totalAmount || 0),
      status: (data.status && ['Placed', 'Accepted', 'Preparing', 'Ready', 'Served', 'Cancelled', 'PARTIALLY DELIVERED'].includes(data.status)) ? data.status : 'Placed',
      payment: data.payment || 'Pending',
      paymentStatus: data.paymentStatus || data.payment || 'Pending',
      notes: (data.notes || data.chefNotes || data.instructions || '').trim(),
      time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Create and persist new order in MongoDB database
    const newOrder = await orderRepository.create(orderData);

    // Only after successful order persistence, update table status to Occupied
    if (formattedTable) {
      try {
        let updatedTable = await Table.findOneAndUpdate(
          {
            $or: [
              { number: formattedTable },
              { number: cleanNum },
              { number: `T-${cleanNum}` },
              { name: exactRegex },
              { number: exactRegex }
            ]
          },
          {
            status: 'Occupied',
            currentOrder: newOrder.orderId || newOrder._id
          },
          { new: true }
        );

        if (!updatedTable) {
          await Table.create({
            number: formattedTable,
            name: `Table ${cleanNum}`,
            seats: 4,
            section: 'Main Dining',
            status: 'Occupied',
            currentOrder: newOrder.orderId || newOrder._id
          });
        }
      } catch (tableErr) {
        console.error('Failed to update table status in database after order creation:', tableErr.message);
      }
    }

    return newOrder;
  }

  async syncTableStatusForOrder(tableIdentifier, forceStatus = null) {
    if (!tableIdentifier) return;
    const rawDigits = String(tableIdentifier).replace(/[^0-9]/g, '');
    const cleanNum = rawDigits ? String(parseInt(rawDigits, 10)) : '';
    if (!cleanNum) return;

    try {
      const OrderModel = require('../models/Order');
      const exactRegex = new RegExp(`^(T-|Table\\s*)?0*${cleanNum}$`, 'i');

      if (forceStatus === 'Cleaning') {
        const cleaningTime = new Date(Date.now() + 10 * 60 * 1000);
        await Table.findOneAndUpdate(
          { $or: [{ number: exactRegex }, { name: exactRegex }] },
          { status: 'Cleaning', currentOrder: '', cleaningUntil: cleaningTime }
        );
        return;
      }

      if (forceStatus === 'Available') {
        await Table.findOneAndUpdate(
          { $or: [{ number: exactRegex }, { name: exactRegex }] },
          { status: 'Available', currentOrder: '' }
        );
        return;
      }

      const tableOrders = await OrderModel.find({
        $or: [
          { table: exactRegex },
          { tableNumber: exactRegex }
        ]
      });

      // Orders that keep the table OCCUPIED (including Bill Generated and Awaiting Payment)
      const occupiedStatuses = ['Placed', 'Accepted', 'Preparing', 'Ready', 'Served', 'Bill Generated', 'Awaiting Payment'];
      const activeOccupiedOrders = tableOrders.filter(o => occupiedStatuses.includes(o.status) && o.payment !== 'Completed' && o.payment !== 'Paid');

      if (activeOccupiedOrders.length > 0) {
        // Table MUST REMAIN Occupied
        const latestActive = activeOccupiedOrders[activeOccupiedOrders.length - 1];
        await Table.findOneAndUpdate(
          { $or: [{ number: exactRegex }, { name: exactRegex }] },
          {
            status: 'Occupied',
            currentOrder: latestActive.orderId || latestActive._id
          }
        );
      } else {
        // Check if latest order was Paid / Completed -> Auto transition to Cleaning
        const lastOrder = tableOrders[tableOrders.length - 1];
        if (lastOrder && (lastOrder.payment === 'Completed' || lastOrder.payment === 'Paid' || lastOrder.status === 'Completed' || lastOrder.status === 'Paid')) {
          await Table.findOneAndUpdate(
            { $or: [{ number: exactRegex }, { name: exactRegex }] },
            {
              status: 'Cleaning',
              currentOrder: ''
            }
          );
        }
      }
    } catch (err) {
      console.warn("Could not sync table status for order completion:", err.message);
    }
  }

  async updateOrderStatus(id, status, fullOrderData = {}) {
    const isPaid = status === 'Paid' || status === 'Completed' || fullOrderData.payment === 'Completed' || fullOrderData.payment === 'Paid' || fullOrderData.paymentStatus === 'Paid';
    const isBillGenerated = status === 'Bill Generated' || status === 'Awaiting Payment' || fullOrderData.payment === 'Bill Generated' || fullOrderData.payment === 'Awaiting Payment';

    const updatePayload = {
      ...fullOrderData,
      status: isPaid ? 'Completed' : (status || 'Placed'),
      orderStatus: isPaid ? 'Completed' : (status || 'Placed'),
      payment: isPaid ? 'Paid' : (isBillGenerated ? 'Awaiting Payment' : (fullOrderData.payment || 'Pending')),
      paymentStatus: isPaid ? 'Paid' : (isBillGenerated ? 'Awaiting Payment' : (fullOrderData.paymentStatus || 'Pending')),
      ...(fullOrderData.originalTotal !== undefined && { originalTotal: Number(fullOrderData.originalTotal) }),
      ...(fullOrderData.originalAmount !== undefined && { originalAmount: Number(fullOrderData.originalAmount) }),
      ...(fullOrderData.couponCode !== undefined && { couponCode: String(fullOrderData.couponCode) }),
      ...(fullOrderData.discountAmount !== undefined && { discountAmount: Number(fullOrderData.discountAmount) }),
      ...(fullOrderData.tip !== undefined && { tip: Number(fullOrderData.tip) }),
      ...(fullOrderData.tipAmount !== undefined && { tipAmount: Number(fullOrderData.tipAmount) }),
      ...(fullOrderData.paymentMethod !== undefined && { paymentMethod: String(fullOrderData.paymentMethod) }),
      ...(fullOrderData.finalAmount !== undefined && { finalAmount: Number(fullOrderData.finalAmount), total: Number(fullOrderData.finalAmount) })
    };

    if (isPaid && fullOrderData.couponCode) {
      try {
        const Coupon = require('../models/Coupon');
        const cleanCode = String(fullOrderData.couponCode).trim().toUpperCase();
        const foundCoupon = await Coupon.findOne({ code: { $regex: new RegExp(`^${cleanCode}$`, 'i') } });
        if (foundCoupon && foundCoupon.isActive) {
          foundCoupon.usedCount = (foundCoupon.usedCount || 0) + 1;
          await foundCoupon.save();
        }
      } catch (err) {
        console.warn('Coupon usage update error:', err.message);
      }
    }

    const updatedOrder = await orderRepository.updateStatus(id, updatePayload.status, updatePayload);
    const tableId = (updatedOrder && updatedOrder.table) || (fullOrderData && fullOrderData.table);

    if (tableId) {
      if (isPaid) {
        // Successful payment -> Table AUTOMATICALLY changes to Cleaning
        await this.syncTableStatusForOrder(tableId, 'Cleaning');
      } else if (isBillGenerated) {
        // Bill Generated -> Table STAYS Occupied
        await this.syncTableStatusForOrder(tableId, 'Occupied');
      } else {
        await this.syncTableStatusForOrder(tableId);
      }
    }
    return updatedOrder;
  }

  async updateOrderItemStatus(id, itemIds = [], targetStatus = 'DELIVERED') {
    const order = await orderRepository.findById(id);
    if (!order) throw new Error('Order not found');

    const itemIdsToUpdate = Array.isArray(itemIds) ? itemIds.map(i => String(i)) : [String(itemIds)];

    let rawItems = order.items || [];
    let itemsUpdatedCount = 0;

    const updatedItems = rawItems.map((item, idx) => {
      const itemObj = item.toObject ? item.toObject() : item;
      const itemIdStr = String(itemObj._id || itemObj.id || itemObj.itemId || `item-${idx}`);
      const isTarget = itemIdsToUpdate.includes(itemIdStr) || 
                       itemIdsToUpdate.includes(String(idx)) || 
                       itemIdsToUpdate.includes(String(itemObj.name));

      if (isTarget) {
        if (targetStatus === 'DELIVERED') {
          // Backend Validation Rule (Req #12):
          // Must ONLY allow delivery if item's current status is READY (or isReady is true) and NOT ALREADY DELIVERED.
          const isCurrentlyReady = itemObj.status === 'READY' || itemObj.isReady === true || order.status === 'Ready';
          const isAlreadyDelivered = itemObj.status === 'DELIVERED' || itemObj.isDelivered === true;

          if (isCurrentlyReady && !isAlreadyDelivered) {
            itemObj.status = 'DELIVERED';
            itemObj.isDelivered = true;
            itemObj.isReady = true;
            itemsUpdatedCount++;
          }
        } else if (targetStatus === 'READY') {
          if (itemObj.status !== 'DELIVERED') {
            itemObj.status = 'READY';
            itemObj.isReady = true;
            itemsUpdatedCount++;
          }
        } else if (targetStatus === 'PREPARING') {
          if (itemObj.status !== 'DELIVERED') {
            itemObj.status = 'PREPARING';
            itemObj.isReady = false;
            itemsUpdatedCount++;
          }
        }
      }
      return itemObj;
    });

    // Derive Order Status (Req #7)
    const totalCount = updatedItems.length;
    const deliveredCount = updatedItems.filter(i => i.status === 'DELIVERED' || i.isDelivered).length;
    const readyCount = updatedItems.filter(i => (i.status === 'READY' || i.isReady) && (i.status !== 'DELIVERED' && !i.isDelivered)).length;

    let derivedOrderStatus = order.status;
    if (totalCount > 0 && deliveredCount === totalCount) {
      derivedOrderStatus = 'Served'; // Fully Delivered
    } else if (deliveredCount > 0) {
      derivedOrderStatus = 'PARTIALLY DELIVERED';
    } else if (readyCount === totalCount || (readyCount > 0 && readyCount + deliveredCount === totalCount)) {
      derivedOrderStatus = 'Ready';
    } else if (readyCount > 0) {
      derivedOrderStatus = 'Preparing';
    } else {
      derivedOrderStatus = (order.status === 'Placed' || order.status === 'NEW') ? 'Placed' : 'Preparing';
    }

    const updatedOrder = await orderRepository.updateStatus(order.orderId || order._id || id, derivedOrderStatus, {
      items: updatedItems,
      status: derivedOrderStatus
    });

    return updatedOrder;
  }
}

module.exports = new OrderService();
