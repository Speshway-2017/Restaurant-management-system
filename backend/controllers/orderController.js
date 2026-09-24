const orderService = require('../services/orderService');
const AssistanceRequest = require('../models/AssistanceRequest');
const Order = require('../models/Order');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const {
  notifyOrderCreated,
  notifyChefAccepted,
  notifyChefPreparing,
  notifyChefReady,
  notifyWaiterAccepted,
  notifyWaiterServing,
  notifyWaiterServed
} = require('../socket');

const isWaiterIn = (user) => {
  if (!user) return true;
  const statusLower = String(user.attendanceStatus || 'Present').toLowerCase().trim();
  if (statusLower === 'checked out' || statusLower === 'absent' || statusLower === 'off duty' || statusLower === 'out') {
    return false;
  }
  return true;
};

const buildOrderQueryOr = (id) => {
  if (!id) return [];
  const idStr = String(id || '').trim();
  const cleanId = idStr.replace(/^#/i, '').trim();
  const cleanNum = idStr.replace(/[^0-9]/g, '');

  const queryOr = [
    { orderId: idStr },
    { orderId: `#${idStr}` },
    { orderId: cleanId },
    { orderId: `#${cleanId}` },
    { id: idStr },
    { id: cleanId }
  ];
  if (cleanId.match(/^[0-9a-fA-F]{24}$/)) {
    queryOr.push({ _id: cleanId });
  }
  if (cleanNum) {
    const matchRegex = new RegExp(`^(#)?(ORD-)?0*${cleanNum}$`, 'i');
    queryOr.push({ orderId: matchRegex }, { id: matchRegex });
  }
  return queryOr;
};

const getOrders = async (req, res) => {
  try {
    let query = {};
    if (req.user) {
      const userRole = (req.user.role || '').toLowerCase();
      if (userRole.includes('manager')) {
        query.$or = [
          { managerId: req.user._id.toString() },
          { managerId: { $in: ['', null, undefined] } },
          { managerId: { $exists: false } }
        ];
      } else if (userRole.includes('waiter')) {
        const managerCondition = req.user.managerId ? {
          $or: [
            { managerId: req.user.managerId.toString() },
            { managerId: { $in: ['', null, undefined] } },
            { managerId: { $exists: false } }
          ]
        } : null;

        const isAvailable = isWaiterIn(req.user);
        if (!isAvailable) {
          // Waiter Mobile Status is OUT: Unavailable for new orders.
          // Must NOT receive or view any NEW / UNCLAIMED / PENDING orders.
          // Only return orders that were already ACCEPTED / SERVING / SERVED by this specific waiter.
          const waiterIdStr = req.user._id ? req.user._id.toString() : '';
          const waiterNameStr = req.user.name ? req.user.name.trim() : '';

          const assignedCondition = {
            $and: [
              {
                $or: [
                  { waiterId: waiterIdStr },
                  ...(waiterNameStr ? [{ waiterName: waiterNameStr }] : [])
                ]
              },
              {
                waiterStatus: { $in: ['ACCEPTED', 'SERVING', 'SERVED'] }
              }
            ]
          };

          if (managerCondition) {
            query.$and = [managerCondition, assignedCondition];
          } else {
            Object.assign(query, assignedCondition);
          }
        } else {
          // Waiter Mobile Status is IN:
          // Can see:
          // 1) Shared pending-order pool (waiterStatus: 'PENDING', not cancelled/completed/paid)
          // 2) Orders claimed by/assigned to THIS specific waiter (waiterId === myId or waiterName === myName)
          const waiterIdStr = req.user._id ? req.user._id.toString() : '';
          const waiterNameStr = req.user.name ? req.user.name.trim() : '';
          const waiterEmpIdStr = req.user.empId ? req.user.empId.trim() : '';

          const waiterTokens = [
            ...(waiterIdStr ? [waiterIdStr, waiterIdStr.toLowerCase()] : []),
            ...(waiterNameStr ? [waiterNameStr, waiterNameStr.toLowerCase()] : []),
            ...(waiterEmpIdStr ? [waiterEmpIdStr, waiterEmpIdStr.toLowerCase()] : [])
          ];

          const visibleCondition = {
            $and: [
              {
                $or: [
                  // Shared pending pool: unaccepted orders
                  {
                    waiterStatus: 'PENDING',
                    status: { $nin: ['Cancelled', 'CANCELLED', 'Completed', 'Paid'] }
                  },
                  // Orders accepted/claimed by THIS waiter
                  { waiterId: waiterIdStr },
                  ...(waiterNameStr ? [{ waiterName: waiterNameStr }] : [])
                ]
              },
              // Exclude orders rejected by this specific waiter
              {
                rejectedByWaiters: {
                  $nin: waiterTokens
                }
              }
            ]
          };

          if (managerCondition) {
            query.$and = [managerCondition, visibleCondition];
          } else {
            Object.assign(query, visibleCondition);
          }
        }
      } else if (userRole.includes('chef') || userRole.includes('receptionist')) {
        if (req.user.managerId) {
          query.$or = [
            { managerId: req.user.managerId.toString() },
            { managerId: { $in: ['', null, undefined] } },
            { managerId: { $exists: false } }
          ];
        }
      }
    } else if (req.query.managerId) {
      query.$or = [
        { managerId: req.query.managerId },
        { managerId: { $in: ['', null, undefined] } },
        { managerId: { $exists: false } }
      ];
    }

    const orders = await orderService.getOrders(query);
    return successResponse(res, orders, 'Orders retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const createOrder = async (req, res) => {
  try {
    const orderData = { ...req.body };
    if (req.user) {
      const userRole = (req.user.role || '').toLowerCase();
      if (userRole.includes('manager')) {
        orderData.managerId = req.user._id.toString();
      } else if (req.user.managerId) {
        orderData.managerId = req.user.managerId.toString();
      }
    }
    const newOrder = await orderService.createOrder(orderData);
    try {
      notifyOrderCreated(newOrder);
    } catch (e) {
      console.warn('Socket emit on order created error:', e.message);
    }
    return successResponse(res, newOrder, 'Order created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.user) {
      const userRole = (req.user.role || '').toLowerCase();
      if (userRole.includes('chef')) {
        updateData.chefId = req.user._id.toString();
        updateData.chefName = req.user.name;
        updateData.claimedAt = new Date();
      } else if (userRole.includes('waiter')) {
        updateData.waiterId = req.user._id.toString();
        updateData.waiterName = req.user.name;
      }
    }
    const updated = await orderService.updateOrderStatus(req.params.id, req.body.status, updateData);

    try {
      const socket = require('../socket');
      const isBill = req.body.status === 'Bill Generated' || updated?.status === 'Bill Generated' || updated?.isBillGenerated;
      if (isBill) {
        socket.notifyBillGenerated(updated);
      } else {
        const io = socket.getIO();
        if (io) {
          io.emit('order_status_updated', { order: updated, status: req.body.status });
          io.emit('order_updated', { order: updated });
          if (updated?.table) {
            io.emit('table_updated', { table: updated.table, status: updated.status });
          }
        }
      }
    } catch (sErr) {
      console.warn('Socket emission error in updateOrderStatus:', sErr.message);
    }

    return successResponse(res, updated, 'Order status updated');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const claimOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const orderRepo = require('../repositories/orderRepository');
    const doc = await orderRepo.findById(id);
    if (!doc) {
      return errorResponse(res, 'Order not found', 404);
    }
    if (req.user) {
      const userRole = (req.user.role || '').toLowerCase();
      if (userRole.includes('chef')) {
        doc.chefId = req.user._id.toString();
        doc.chefName = req.user.name;
        doc.claimedAt = new Date();
        if (doc.status === 'Placed') {
          doc.status = 'Preparing';
        }
      } else if (userRole.includes('waiter')) {
        doc.waiterId = req.user._id.toString();
        doc.waiterName = req.user.name;
      }
    }
    await doc.save();
    return successResponse(res, doc, 'Order claimed successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const updateOrderItemStatus = async (req, res) => {
  try {
    const { itemIds, status } = req.body;
    const updated = await orderService.updateOrderItemStatus(req.params.id, itemIds, status || 'DELIVERED');
    return successResponse(res, updated, 'Order item status updated');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const clearAllOrders = async (req, res) => {
  try {
    const TableModel = require('../models/Table');
    await Order.deleteMany({});
    await TableModel.updateMany({}, { status: 'Available', currentOrder: '', cleaningUntil: null });
    return successResponse(res, null, 'All orders deleted and tables reset to Available');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const callWaiter = async (req, res) => {
  try {
    const { table, requestType, note } = req.body;
    const cleanTable = table || 'T-01';
    const reqReason = requestType || 'Assistance';

    const newAssistance = await AssistanceRequest.create({
      table: cleanTable,
      requestType: reqReason,
      note: note || '',
      status: 'NEW',
      createdAt: new Date()
    });

    return successResponse(res, newAssistance, `Service request sent to Waiter for Table ${cleanTable}`);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const getAssistanceRequests = async (req, res) => {
  try {
    const requests = await AssistanceRequest.find({}).sort({ createdAt: -1 });
    return successResponse(res, requests, 'Assistance requests retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const updateAssistanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updateData = { status };
    if (status === 'ACKNOWLEDGED') updateData.acknowledgedAt = new Date();
    if (status === 'RESOLVED') updateData.resolvedAt = new Date();

    const updated = await AssistanceRequest.findByIdAndUpdate(id, updateData, { new: true });
    return successResponse(res, updated, `Assistance request updated to ${status}`);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const requestOrderCancellation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, itemId, itemIds } = req.body;

    const cleanId = String(id || '').replace(/^#/i, '').trim();
    const order = await Order.findOne({
      $or: [{ orderId: cleanId }, { _id: cleanId.match(/^[0-9a-fA-F]{24}$/) ? cleanId : null }]
    });

    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    // Waiter must accept order before performing cancellation or item operations
    if (req.user && req.user.role === 'Waiter') {
      const wStatus = String(order.waiterStatus || 'PENDING').toUpperCase();
      const isAccepted = wStatus === 'ACCEPTED' || wStatus === 'SERVING' || wStatus === 'SERVED';
      if (!isAccepted) {
        return errorResponse(res, 'You must accept the order before requesting cancellation of items.', 400);
      }
    }

    const cancelReason = reason || 'Customer changed mind';
    const targetItemIds = Array.isArray(itemIds) && itemIds.length > 0
      ? itemIds.map(i => String(i))
      : (itemId ? [String(itemId)] : []);

    const normalizeItem = (it) => {
      if (typeof it === 'string') {
        return { name: it, quantity: 1, price: 150, status: 'PLACED' };
      }
      if (it && typeof it.toObject === 'function') {
        return it.toObject();
      }
      return { ...(it || {}) };
    };

    if (targetItemIds.length > 0) {
      // Validate each target item
      const invalidItem = (order.items || []).map(normalizeItem).find(it => {
        const itemName = String(it.name || it.dishId || '');
        const itemIdStr = String(it._id || it.id || itemName);
        const isMatch = targetItemIds.includes(itemIdStr) || targetItemIds.includes(itemName);
        if (!isMatch) return false;
        
        const isReady = Boolean(it.isReady || it.status === 'READY' || it.status === 'READY_FOR_PASS');
        const isServed = Boolean(it.isDelivered || it.status === 'DELIVERED' || it.status === 'SERVED');
        return isReady || isServed;
      });

      if (invalidItem) {
        return errorResponse(res, `Dish "${invalidItem.name || 'Selected'}" is already ready or served and cannot be cancelled.`, 400);
      }

      const cancelledDishNames = [];
      // Mark target pending items as CANCELLED
      order.items = (order.items || []).map(it => {
        const itObj = normalizeItem(it);
        const itemName = String(itObj.name || itObj.dishId || 'Dish');
        const itemIdStr = String(itObj._id || itObj.id || itemName);
        const isMatch = targetItemIds.includes(itemIdStr) || targetItemIds.includes(itemName);

        if (isMatch) {
          if (!cancelledDishNames.includes(itemName)) {
            cancelledDishNames.push(itemName);
          }
          return { ...itObj, status: 'CANCELLED', cancellationReason: cancelReason };
        }
        return itObj;
      });

      order.markModified('items');

      if (cancelledDishNames.length > 0) {
        const cancelNoteStr = `Cancelled dishes: ${cancelledDishNames.join(', ')} (${cancelReason})`;
        let existingNotes = String(order.notes || '').trim();
        if (existingNotes.includes('Cancelled dishes:')) {
          existingNotes = existingNotes.replace(/Cancelled dishes:[^|]*/gi, cancelNoteStr);
        } else {
          existingNotes = existingNotes ? `${existingNotes} | ${cancelNoteStr}` : cancelNoteStr;
        }
        order.notes = existingNotes;
      }

      // Recalculate order total excluding cancelled items
      const activeItems = order.items.filter(i => i.status !== 'CANCELLED');
      const newTotal = activeItems.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
      order.total = newTotal;
      order.finalAmount = Math.max(0, newTotal - (order.discountAmount || 0));

      if (activeItems.length === 0) {
        order.status = 'Cancelled';
      } else {
        order.status = 'PENDING CANCELLATION APPROVAL';
      }

      order.cancellationReason = cancelReason;
      order.cancellationRequestedAt = new Date();
    } else {
      // Cancel whole order
      const hasDeliveredOrReady = Array.isArray(order.items) && order.items.map(normalizeItem).some(i => i.isDelivered || i.isReady || i.status === 'DELIVERED' || i.status === 'SERVED' || i.status === 'READY');
      if (hasDeliveredOrReady) {
        return errorResponse(res, 'Order cannot be cancelled because some dishes are ready or served.', 400);
      }

      order.status = 'PENDING CANCELLATION APPROVAL';
      order.cancellationReason = cancelReason;
      order.cancellationRequestedAt = new Date();
    }

    await order.save();
    return successResponse(res, order, `Cancellation request submitted successfully`);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const chefAcceptOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.user) {
      return errorResponse(res, 'Authentication required to accept order', 401);
    }
    const cleanId = String(id || '').replace(/^#/i, '').trim();
    const queryOr = [
      { orderId: id },
      { orderId: `#${cleanId}` },
      { orderId: cleanId }
    ];
    if (cleanId.match(/^[0-9a-fA-F]{24}$/)) {
      queryOr.push({ _id: cleanId });
    }

    // Atomic claim with race-condition protection
    const updated = await Order.findOneAndUpdate(
      {
        $and: [
          { $or: queryOr },
          {
            $or: [
              { chefStatus: 'NEW' },
              { chefStatus: { $exists: false } },
              { chefId: null },
              { chefId: '' }
            ]
          }
        ]
      },
      {
        $set: {
          chefId: req.user._id.toString(),
          chefName: req.user.name,
          chefStatus: 'ACCEPTED',
          status: 'Accepted',
          chefAcceptedAt: new Date(),
          claimedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updated) {
      // Check if order exists to distinguish 404 from 409 Conflict
      const existing = await Order.findOne({ $or: queryOr });
      if (!existing) {
        return errorResponse(res, 'Order not found', 404);
      }
      return res.status(409).json({
        success: false,
        message: `Order #${existing.orderId || id} has already been accepted by Chef ${existing.chefName || 'another chef'}.`,
        order: existing
      });
    }

    try {
      notifyChefAccepted(updated);
    } catch (e) {
      console.warn('Socket emit error on chef accept:', e.message);
    }
    return successResponse(res, updated, 'Order accepted by chef');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const chefUpdateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const cleanId = String(id || '').replace(/^#/i, '').trim();
    const queryOr = [
      { orderId: id },
      { orderId: `#${cleanId}` },
      { orderId: cleanId }
    ];
    if (cleanId.match(/^[0-9a-fA-F]{24}$/)) {
      queryOr.push({ _id: cleanId });
    }

    const order = await Order.findOne({ $or: queryOr });
    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    const targetStatus = String(status || '').toUpperCase();
    if (!['PREPARING', 'READY'].includes(targetStatus)) {
      return errorResponse(res, 'Invalid chef status. Allowed values: PREPARING, READY', 400);
    }

    // Ownership check: If order has a chefId and user is chef, ensure they match
    const userRole = (req.user.role || '').toLowerCase();
    if (userRole.includes('chef') && order.chefId && order.chefId !== req.user._id.toString()) {
      return errorResponse(res, `This order is claimed by Chef ${order.chefName || 'another chef'}.`, 403);
    }

    if (!order.chefId) {
      order.chefId = req.user._id.toString();
      order.chefName = req.user.name;
    }

    if (targetStatus === 'PREPARING') {
      order.chefStatus = 'PREPARING';
      order.status = 'Preparing';
      order.chefPreparingAt = new Date();
      if (Array.isArray(order.items)) {
        order.items = order.items.map(it => {
          if (it.status === 'CANCELLED' || it.isDelivered || it.status === 'SERVED' || it.status === 'DELIVERED') return it;
          return { ...it, status: 'PREPARING' };
        });
      }
      await order.save();
      try {
        notifyChefPreparing(order);
      } catch (e) {
        console.warn('Socket emit error on chef preparing:', e.message);
      }
    } else if (targetStatus === 'READY') {
      order.chefStatus = 'READY';
      order.chefReadyAt = new Date();
      if (Array.isArray(req.body.items) && req.body.items.length > 0) {
        order.items = req.body.items.map((it, idx) => {
          const orig = (order.items && order.items[idx]) || {};
          const isDel = Boolean(it.isDelivered || it.status === 'SERVED' || it.status === 'DELIVERED' || orig.isDelivered);
          const isExplicitlyPreparing = it.status === 'PREPARING' || it.status === 'PLACED' || it.status === 'COOKING';
          const isRdy = !isDel && !isExplicitlyPreparing && Boolean(it.isReady || it.status === 'READY');
          return {
            id: String(it.id || it._id || orig.id || `item-${idx}`),
            name: it.name || orig.name || 'Dish Item',
            price: Number(it.price || orig.price || 0),
            quantity: Number(it.quantity || orig.quantity || 1),
            status: isDel ? 'DELIVERED' : (isRdy ? 'READY' : (it.status === 'CANCELLED' ? 'CANCELLED' : 'PREPARING')),
            isReady: isRdy,
            isDelivered: isDel
          };
        });
      } else if (Array.isArray(order.items)) {
        order.items = order.items.map(it => {
          if (it.status === 'CANCELLED' || it.isDelivered || it.status === 'SERVED' || it.status === 'DELIVERED') return it;
          const isRdy = Boolean(it.isReady || it.status === 'READY');
          return {
            ...it,
            status: isRdy ? 'READY' : 'PREPARING',
            isReady: isRdy
          };
        });
      }
      
      const activeItems = (order.items || []).filter(it => it.status !== 'CANCELLED');
      const allActiveReadyOrDelivered = activeItems.length > 0 && activeItems.every(it => it.isReady || it.status === 'READY' || it.isDelivered || it.status === 'SERVED' || it.status === 'DELIVERED');
      if (allActiveReadyOrDelivered) {
        order.status = 'Ready';
      } else {
        order.status = 'Preparing';
      }
      
      await order.save();
      try {
        notifyChefReady(order);
      } catch (e) {
        console.warn('Socket emit error on chef ready:', e.message);
      }
    }

    return successResponse(res, order, `Chef status updated to ${targetStatus}`);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const waiterAcceptOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const queryOr = buildOrderQueryOr(id);

    if (req.user && !isWaiterIn(req.user)) {
      return errorResponse(res, 'You are currently Checked Out / OUT. Please check in to accept orders.', 403);
    }

    const waiterIdVal = req.user ? req.user._id.toString() : (req.body.waiterId || '');
    const waiterNameVal = req.user ? req.user.name : (req.body.waiterName || 'Waiter');

    // Atomic claim with race-condition protection (First Accept Wins!)
    const updated = await Order.findOneAndUpdate(
      {
        $and: [
          { $or: queryOr },
          {
            $or: [
              { waiterStatus: 'PENDING' },
              { waiterStatus: { $exists: false } },
              { waiterId: null },
              { waiterId: '' },
              { waiterId: waiterIdVal } // Idempotent re-accept by same waiter
            ]
          },
          {
            status: { $nin: ['Cancelled', 'CANCELLED', 'Completed', 'Paid', 'SERVED'] }
          }
        ]
      },
      {
        $set: {
          waiterId: waiterIdVal,
          waiterName: waiterNameVal,
          waiterStatus: 'ACCEPTED',
          status: 'Accepted',
          waiterAcceptedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updated) {
      const existing = await Order.findOne({ $or: queryOr });
      if (!existing) {
        return errorResponse(res, 'Order not found', 404);
      }
      return res.status(409).json({
        success: false,
        code: 'ORDER_ALREADY_CLAIMED',
        message: `Order #${existing.orderId || id} has already been accepted by Waiter ${existing.waiterName || 'another waiter'}.`,
        order: existing
      });
    }

    try {
      notifyWaiterAccepted(updated);
    } catch (e) {
      console.warn('Socket emit error on waiter accept:', e.message);
    }
    return successResponse(res, updated, 'Order accepted for service by Waiter');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const waiterRejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const queryOr = buildOrderQueryOr(id);

    const waiterIdVal = req.user ? req.user._id.toString() : (req.body.waiterId || '');
    const waiterNameVal = req.user ? req.user.name : (req.body.waiterName || 'Waiter');
    const waiterEmpIdVal = req.user ? (req.user.empId || '') : (req.body.empId || '');

    const tokens = [
      ...(waiterIdVal ? [waiterIdVal, waiterIdVal.toLowerCase()] : []),
      ...(waiterNameVal ? [waiterNameVal, waiterNameVal.toLowerCase(), waiterNameVal.trim()] : []),
      ...(waiterEmpIdVal ? [waiterEmpIdVal, waiterEmpIdVal.toLowerCase()] : [])
    ];

    const updated = await Order.findOneAndUpdate(
      { $or: queryOr },
      {
        $addToSet: {
          rejectedByWaiters: {
            $each: tokens
          }
        }
      },
      { new: true }
    );

    if (!updated) {
      return errorResponse(res, 'Order not found', 404);
    }

    return successResponse(res, updated, `Order #${updated.orderId} rejected by ${waiterNameVal}`);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const waiterUpdateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const queryOr = buildOrderQueryOr(id);

    const order = await Order.findOne({ $or: queryOr });
    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    const targetStatus = String(status || '').toUpperCase();
    if (targetStatus.includes('BILL')) {
      const updated = await orderService.updateOrderStatus(order._id || id, 'Bill Generated', {
        status: 'Bill Generated',
        payment: 'Awaiting Payment',
        paymentStatus: 'Awaiting Payment',
        ...req.body
      });
      try {
        const socket = require('../socket');
        socket.notifyBillGenerated(updated);
      } catch (sErr) {}
      return successResponse(res, updated, 'Bill generated successfully for table');
    }

    if (!['SERVING', 'SERVED'].includes(targetStatus)) {
      return errorResponse(res, 'Invalid waiter status. Allowed values: SERVING, SERVED, Bill Generated', 400);
    }

    if (targetStatus === 'SERVING') {
      order.waiterStatus = 'SERVING';
      order.waiterServingAt = new Date();
      if (!order.waiterId) {
        order.waiterId = req.user._id.toString();
        order.waiterName = req.user.name;
      }
      await order.save();
      try {
        notifyWaiterServing(order);
      } catch (e) {
        console.warn('Socket emit error on waiter serving:', e.message);
      }
    } else if (targetStatus === 'SERVED') {
      if (!order.waiterId) {
        order.waiterId = req.user._id.toString();
        order.waiterName = req.user.name;
      }
      const activeItems = (order.items || []).filter(it => it.status !== 'CANCELLED');
      const isAllServed = activeItems.length > 0 && activeItems.every(it => it.isDelivered || it.status === 'SERVED' || it.status === 'DELIVERED');

      if (isAllServed) {
        order.waiterStatus = 'SERVED';
        order.status = 'Served';
        order.waiterServedAt = new Date();
      } else {
        order.waiterStatus = 'SERVING';
        if (activeItems.some(it => it.isDelivered || it.status === 'SERVED' || it.status === 'DELIVERED')) {
          order.status = 'PARTIALLY DELIVERED';
        }
        order.waiterServingAt = new Date();
      }
      await order.save();
      try {
        notifyWaiterServed(order);
      } catch (e) {
        console.warn('Socket emit error on waiter served:', e.message);
      }
    }

    return successResponse(res, order, `Waiter service status updated to ${targetStatus}`);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrderStatus,
  claimOrder,
  chefAcceptOrder,
  chefUpdateStatus,
  waiterAcceptOrder,
  waiterRejectOrder,
  waiterUpdateStatus,
  updateOrderItemStatus,
  clearAllOrders,
  callWaiter,
  getAssistanceRequests,
  updateAssistanceStatus,
  requestOrderCancellation
};
