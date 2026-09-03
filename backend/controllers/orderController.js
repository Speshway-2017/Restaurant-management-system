const orderService = require('../services/orderService');
const AssistanceRequest = require('../models/AssistanceRequest');
const Order = require('../models/Order');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getOrders = async (req, res) => {
  try {
    const orders = await orderService.getOrders();
    return successResponse(res, orders, 'Orders retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const createOrder = async (req, res) => {
  try {
    const newOrder = await orderService.createOrder(req.body);
    return successResponse(res, newOrder, 'Order created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const updated = await orderService.updateOrderStatus(req.params.id, req.body.status, req.body);
    return successResponse(res, updated, 'Order status updated');
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

module.exports = {
  getOrders,
  createOrder,
  updateOrderStatus,
  updateOrderItemStatus,
  clearAllOrders,
  callWaiter,
  getAssistanceRequests,
  updateAssistanceStatus,
  requestOrderCancellation
};
