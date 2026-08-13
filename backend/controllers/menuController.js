const menuService = require('../services/menuService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getMenuItems = async (req, res) => {
  try {
    const items = await menuService.getMenuItems();
    return successResponse(res, items, 'Menu items retrieved');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const createMenuItem = async (req, res) => {
  try {
    const newItem = await menuService.createMenuItem(req.body);
    return successResponse(res, newItem, 'Menu item created', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const updated = await menuService.updateMenuItem(req.params.id, req.body);
    return successResponse(res, updated, 'Menu item updated');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    await menuService.deleteMenuItem(req.params.id);
    return successResponse(res, null, 'Menu item deleted');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem };
