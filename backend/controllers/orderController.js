const orderService = require('../services/orderService');
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
    const OrderModel = require('../models/Order');
    const TableModel = require('../models/Table');
    await OrderModel.deleteMany({});
    await TableModel.updateMany({}, { status: 'Available', currentOrder: '', cleaningUntil: null });
    return successResponse(res, null, 'All orders deleted and tables reset to Available');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getOrders, createOrder, updateOrderStatus, updateOrderItemStatus, clearAllOrders };
