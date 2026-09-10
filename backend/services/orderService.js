const orderRepository = require('../repositories/orderRepository');
const Table = require('../models/Table');

class OrderService {
  async getOrders(query = {}) {
    return await orderRepository.findAll(query) || [];
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

    // BACKEND ENFORCEMENT: Reject order creation if table is Cleaning or Billing
    const tableDoc = await Table.findOne({
      $or: [{ number: formattedTable }, { number: cleanNum }, { name: exactRegex }, { number: exactRegex }]
    });

    if (tableDoc && tableDoc.status === 'Cleaning') {
      throw new Error(`Table ${formattedTable} is currently unavailable due to cleaning & sanitization.`);
    }

    if (tableDoc && tableDoc.status === 'Billing') {
      throw new Error(`The bill has already been generated for Table ${formattedTable}. Additional items cannot be placed.`);
    }

    // 0. Resolve current ACTIVE session as single source of truth for customer name and authorization
    const TableSession = require('../models/TableSession');
    const searchNums = [formattedTable, cleanNum, `T-${cleanNum.padStart(2, '0')}`];
    let activeSession = await TableSession.findOne({
      $or: [
        { tableNum: { $in: searchNums } },
        { mergedTableNums: { $in: searchNums } }
      ],
      status: 'ACTIVE'
    });

    // Validate customer session ownership for non-staff order placement
    if (activeSession && !data.isStaffOverride && !data.managerId && !data.waiterId) {
      const callerSessToken = data.sessionToken || data.sessionId || '';
      const callerDevToken = data.deviceToken || '';
      if (
        activeSession.deviceToken &&
        callerDevToken &&
        activeSession.deviceToken !== callerDevToken &&
        callerSessToken !== activeSession.sessionToken
      ) {
        throw new Error(`Unauthorized: Table ${formattedTable} is currently active on another customer device.`);
      }
    }

    if (!activeSession) {
      const sessionToken = data.sessionToken || `SESS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      activeSession = await TableSession.create({
        tableNum: formattedTable,
        sessionToken,
        deviceToken: data.deviceToken || null,
        guestName: (data.customer && data.customer !== 'Guest Diner' && data.customer !== 'Guest') ? String(data.customer).trim() : '',
        phone: data.phone || '',
        partySize: 2,
        specialOccasion: 'None',
        notes: '',
        status: 'ACTIVE',
        isWalkIn: true,
        isReceptionistAssigned: false,
        seatedAt: new Date()
      });
    }

    let verifiedCustomerName = 'Guest Diner';
    // STRICT IMMUTABILITY: Once a diner name is established for this session, it is locked and cannot be changed until order/session completes
    if (activeSession.guestName && activeSession.guestName !== 'Guest Diner' && activeSession.guestName !== 'Guest' && String(activeSession.guestName).trim()) {
      verifiedCustomerName = String(activeSession.guestName).trim();
    } else if (data.customer && data.customer !== 'Guest Diner' && data.customer !== 'Guest' && String(data.customer).trim()) {
      verifiedCustomerName = String(data.customer).trim();
      activeSession.guestName = verifiedCustomerName;
      await activeSession.save();
      try {
        const { getIO } = require('../socket');
        const io = getIO();
        if (io) {
          io.emit('table_session_updated', {
            tableNum: formattedTable,
            guestName: verifiedCustomerName,
            sessionToken: activeSession.sessionToken,
            status: 'ACTIVE'
          });
        }
      } catch (e) { }
    }

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

    // Resolve Table model for tableId and assigned waiter
    let targetTableDoc = null;
    try {
      targetTableDoc = await Table.findOne({
        $or: [
          { number: formattedTable },
          { number: cleanNum },
          { number: `T-${cleanNum}` },
          { name: exactRegex },
          { number: exactRegex }
        ]
      });
    } catch (e) { }

    if (existingActiveOrder) {
      // Active session guestName is single source of truth! Client cannot override!
      existingActiveOrder.customer = verifiedCustomerName;
      if (activeSession) {
        existingActiveOrder.sessionId = activeSession._id.toString();
        existingActiveOrder.sessionToken = activeSession.sessionToken;
      }
      if (targetTableDoc) {
        if (!existingActiveOrder.tableId) existingActiveOrder.tableId = targetTableDoc._id.toString();
        if (!existingActiveOrder.waiterId && targetTableDoc.assignedWaiterId) {
          existingActiveOrder.waiterId = targetTableDoc.assignedWaiterId;
          existingActiveOrder.waiterName = targetTableDoc.assignedWaiterName || '';
        }
      }

      // Block adding items if bill has already been generated
      const isAlreadyBillGenerated = Boolean(
        existingActiveOrder.isBillGenerated ||
        existingActiveOrder.billGenerated ||
        existingActiveOrder.status === 'Bill Generated' ||
        existingActiveOrder.status === 'Billing' ||
        existingActiveOrder.payment === 'Awaiting Payment' ||
        existingActiveOrder.paymentStatus === 'Awaiting Payment'
      );
      if (isAlreadyBillGenerated) {
        throw new Error(`The bill has already been generated for Table ${existingActiveOrder.table || 'this table'}. Additional items cannot be added.`);
      }

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
      const hasDeliveredItems = existingItems.some(i => i.isDelivered || i.status === 'DELIVERED' || i.status === 'SERVED');
      const hasUnservedItems = existingItems.some(i => !i.isDelivered && i.status !== 'DELIVERED' && i.status !== 'SERVED');

      if (hasUnservedItems) {
        existingActiveOrder.status = hasDeliveredItems ? 'PARTIALLY DELIVERED' : 'Placed';
        if (newIncomingItems.length > 0) {
          existingActiveOrder.chefStatus = 'NEW';
        }
        // If the order had previously been completed/served by waiter, reopen it for service
        if (existingActiveOrder.waiterStatus === 'SERVED') {
          existingActiveOrder.waiterStatus = 'ACCEPTED';
        }
        // Disappear generated bill since customer placed more items!
        if (existingActiveOrder.payment === 'Awaiting Payment' || existingActiveOrder.payment === 'Bill Generated') {
          existingActiveOrder.payment = 'Pending';
        }
        if (existingActiveOrder.paymentStatus === 'Awaiting Payment' || existingActiveOrder.paymentStatus === 'Bill Generated') {
          existingActiveOrder.paymentStatus = 'Pending';
        }
        existingActiveOrder.isBillGenerated = false;
        existingActiveOrder.billGenerated = false;
      } else {
        existingActiveOrder.status = hasDeliveredItems ? 'Served' : 'Placed';
      }

      if (data.managerId && !existingActiveOrder.managerId) {
        existingActiveOrder.managerId = String(data.managerId);
      }

      if (verifiedCustomerName && verifiedCustomerName !== 'Guest Diner' && (!existingActiveOrder.customer || existingActiveOrder.customer === 'Guest Diner')) {
        existingActiveOrder.customer = verifiedCustomerName;
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
    const assignedWaiterId = (targetTableDoc && targetTableDoc.assignedWaiterId) || data.waiterId || '';
    const assignedWaiterName = (targetTableDoc && targetTableDoc.assignedWaiterName) || data.waiterName || '';
    const resolvedTableId = targetTableDoc ? targetTableDoc._id.toString() : (data.tableId || '');

    const orderData = {
      orderId: orderId,
      table: formattedTable,
      tableId: resolvedTableId,
      type: (data.type === 'Takeaway' || data.type === 'Delivery') ? data.type : 'Dine-In',
      customer: verifiedCustomerName,
      sessionId: activeSession ? activeSession._id.toString() : (data.sessionId || ''),
      sessionToken: activeSession ? activeSession.sessionToken : '',
      phone: (activeSession && activeSession.phone) || data.phone || '+91 Direct QR',
      managerId: data.managerId ? String(data.managerId) : undefined,
      chefStatus: 'NEW',
      waiterStatus: 'PENDING',
      chefId: '',
      chefName: '',
      waiterId: assignedWaiterId,
      waiterName: assignedWaiterName,
      items: newIncomingItems,
      total: Number(data.total || data.totalAmount || 0),
      status: 'Placed',
      payment: data.payment || 'Pending',
      paymentStatus: data.paymentStatus || data.payment || 'Pending',
      notes: (data.notes || data.chefNotes || data.instructions || '').trim(),
      time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Create and persist new order in MongoDB database
    const newOrder = await orderRepository.create(orderData);

    if (activeSession) {
      activeSession.orderId = newOrder.orderId || newOrder._id.toString();
      await activeSession.save();
    }

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
            currentOrder: newOrder.orderId || newOrder._id,
            activeSessionId: activeSession ? activeSession._id.toString() : null
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
            currentOrder: newOrder.orderId || newOrder._id,
            activeSessionId: activeSession ? activeSession._id.toString() : null,
            assignedWaiterId: assignedWaiterId,
            assignedWaiterName: assignedWaiterName
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

      const TableSession = require('../models/TableSession');

      if (forceStatus === 'Cleaning') {
        const cleaningTime = new Date(Date.now() + 10 * 60 * 1000);
        await Table.findOneAndUpdate(
          { $or: [{ number: exactRegex }, { name: exactRegex }] },
          { status: 'Cleaning', currentOrder: '', activeSessionId: null, cleaningUntil: cleaningTime }
        );
        await TableSession.updateMany(
          { $or: [{ tableNum: exactRegex }, { mergedTableNums: exactRegex }], status: 'ACTIVE' },
          { status: 'CLOSED', closedAt: new Date() }
        );
        return;
      }

      if (forceStatus === 'Available') {
        await Table.findOneAndUpdate(
          { $or: [{ number: exactRegex }, { name: exactRegex }] },
          { status: 'Available', currentOrder: '', activeSessionId: null }
        );
        await TableSession.updateMany(
          { $or: [{ tableNum: exactRegex }, { mergedTableNums: exactRegex }], status: 'ACTIVE' },
          { status: 'CLOSED', closedAt: new Date() }
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
              currentOrder: '',
              activeSessionId: null
            }
          );
          await TableSession.updateMany(
            { $or: [{ tableNum: exactRegex }, { mergedTableNums: exactRegex }], status: 'ACTIVE' },
            { status: 'CLOSED', closedAt: new Date() }
          );
        }
      }
    } catch (err) {
      console.warn("Could not sync table status for order completion:", err.message);
    }
  }

  async updateOrderStatus(id, status, fullOrderData = {}) {
    const OrderModel = require('../models/Order');
    let existingOrder = null;
    try {
      existingOrder = await orderRepository.findById(id);
    } catch (e) { }

    if (!existingOrder && (fullOrderData.table || id)) {
      const rawNum = String(fullOrderData.table || id).replace(/[^0-9]/g, '');
      if (rawNum) {
        const exactRegex = new RegExp(`^(T-|Table\\s*)?0*${rawNum}$`, 'i');
        existingOrder = await OrderModel.findOne({
          $or: [{ table: exactRegex }, { tableNumber: exactRegex }],
          status: { $nin: ['Completed', 'Paid', 'Cancelled'] }
        });
      }
    }

    const isPaid = status === 'Paid' || status === 'Completed' || fullOrderData.payment === 'Completed' || fullOrderData.payment === 'Paid' || fullOrderData.paymentStatus === 'Paid';
    const isBillGenerated = status === 'Bill Generated' || status === 'Awaiting Payment' || fullOrderData.isBillGenerated || fullOrderData.billGenerated || fullOrderData.payment === 'Bill Generated' || fullOrderData.payment === 'Awaiting Payment';

    // BLOCK PAYMENT if waiter has not generated the bill yet
    if (isPaid && !isBillGenerated && existingOrder) {
      const isAlreadyBillGenerated = Boolean(
        existingOrder.isBillGenerated ||
        existingOrder.billGenerated ||
        existingOrder.status === 'Bill Generated' ||
        existingOrder.status === 'Billing' ||
        existingOrder.payment === 'Awaiting Payment' ||
        existingOrder.paymentStatus === 'Awaiting Payment'
      );

      if (!isAlreadyBillGenerated) {
        throw new Error(`Payment is blocked for Table ${existingOrder.table || 'this table'}. The waiter must generate the bill before payment can be completed.`);
      }
    }

    const txnId = fullOrderData.transactionId || (isPaid ? `TXN-${Date.now().toString().slice(-8)}` : '');
    const paidTimestamp = fullOrderData.paidAt || (isPaid ? new Date() : null);

    const updatePayload = {
      ...fullOrderData,
      status: isPaid ? 'Completed' : (status || 'Placed'),
      orderStatus: isPaid ? 'Completed' : (status || 'Placed'),
      payment: isPaid ? 'Paid' : (isBillGenerated ? 'Awaiting Payment' : (fullOrderData.payment || 'Pending')),
      paymentStatus: isPaid ? 'Paid' : (isBillGenerated ? 'Awaiting Payment' : (fullOrderData.paymentStatus || 'Pending')),
      isBillGenerated: isBillGenerated || existingOrder?.isBillGenerated || false,
      billGenerated: isBillGenerated || existingOrder?.billGenerated || false,
      ...(fullOrderData.originalTotal !== undefined && { originalTotal: Number(fullOrderData.originalTotal) }),
      ...(fullOrderData.originalAmount !== undefined && { originalAmount: Number(fullOrderData.originalAmount) }),
      ...(fullOrderData.subtotal !== undefined && { subtotal: Number(fullOrderData.subtotal) }),
      ...(fullOrderData.gstAmount !== undefined && { gstAmount: Number(fullOrderData.gstAmount) }),
      ...(fullOrderData.totalBeforeDiscount !== undefined && { totalBeforeDiscount: Number(fullOrderData.totalBeforeDiscount) }),
      ...(fullOrderData.couponCode !== undefined && { couponCode: String(fullOrderData.couponCode) }),
      ...(fullOrderData.discountAmount !== undefined && { discountAmount: Number(fullOrderData.discountAmount) }),
      ...(fullOrderData.amountAfterDiscount !== undefined && { amountAfterDiscount: Number(fullOrderData.amountAfterDiscount) }),
      ...(fullOrderData.tip !== undefined && { tip: Number(fullOrderData.tip) }),
      ...(fullOrderData.tipAmount !== undefined && { tipAmount: Number(fullOrderData.tipAmount) }),
      ...(fullOrderData.customerPaidAmount !== undefined && { customerPaidAmount: Number(fullOrderData.customerPaidAmount) }),
      ...(fullOrderData.paymentMethod !== undefined && { paymentMethod: String(fullOrderData.paymentMethod) }),
      ...(fullOrderData.finalAmount !== undefined && { finalAmount: Number(fullOrderData.finalAmount), total: Number(fullOrderData.finalAmount) }),
      transactionId: txnId,
      ...(paidTimestamp && { paidAt: paidTimestamp })
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

    const targetId = existingOrder ? (existingOrder._id || existingOrder.orderId || id) : id;
    const updatedOrder = await orderRepository.updateStatus(targetId, updatePayload.status, updatePayload);
    const tableId = (updatedOrder && updatedOrder.table) || (fullOrderData && fullOrderData.table);

    if (tableId) {
      if (isPaid) {
        // Successful payment -> Table AUTOMATICALLY changes to Cleaning
        await this.syncTableStatusForOrder(tableId, 'Cleaning');

        // Update Guest Loyalty Points & Visit Count in MongoDB
        try {
          const Guest = require('../models/Guest');
          const phoneNum = updatedOrder?.phone || fullOrderData?.phone || '';
          const customerName = updatedOrder?.customer || fullOrderData?.customer || 'Guest Diner';
          if (phoneNum && phoneNum.length >= 10) {
            const pointsEarned = Math.floor((updatedOrder?.total || fullOrderData?.finalAmount || 100) / 10);
            await Guest.findOneAndUpdate(
              { phone: phoneNum },
              {
                $set: { name: customerName, lastVisitDate: new Date() },
                $inc: { visitCount: 1, loyaltyPoints: pointsEarned }
              },
              { upsert: true, new: true }
            );
          }
        } catch (e) {
          console.warn('Could not update guest loyalty points in DB:', e.message);
        }
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
      const itemNameStr = String(itemObj.name || '').trim().toLowerCase();

      const isTarget = itemIdsToUpdate.some(target => {
        const cleanTarget = String(target || '').trim().toLowerCase();
        if (!cleanTarget) return false;
        return cleanTarget === itemIdStr.toLowerCase() ||
               cleanTarget === String(idx) ||
               cleanTarget === itemNameStr ||
               cleanTarget === String(itemObj._id || '').toLowerCase() ||
               cleanTarget === String(itemObj.id || '').toLowerCase() ||
               cleanTarget === String(itemObj.itemId || '').toLowerCase();
      });

      if (isTarget) {
        if (targetStatus === 'DELIVERED') {
          // Backend Validation Rule (Req #12):
          // Must ONLY allow delivery if item's current status is READY (or isReady is true) and NOT ALREADY DELIVERED.
          const isCurrentlyReady = itemObj.status === 'READY' || itemObj.isReady === true;
          const isAlreadyDelivered = itemObj.status === 'DELIVERED' || itemObj.status === 'SERVED' || itemObj.isDelivered === true;

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

    const extraUpdates = {
      items: updatedItems,
      status: derivedOrderStatus
    };
    if (totalCount > 0 && deliveredCount === totalCount) {
      extraUpdates.waiterStatus = 'SERVED';
      extraUpdates.waiterServedAt = new Date();
    } else if (deliveredCount > 0) {
      extraUpdates.waiterStatus = 'SERVING';
      extraUpdates.waiterServingAt = new Date();
    }

    const updatedOrder = await orderRepository.updateStatus(order.orderId || order._id || id, derivedOrderStatus, extraUpdates);

    return updatedOrder;
  }
}

module.exports = new OrderService();
