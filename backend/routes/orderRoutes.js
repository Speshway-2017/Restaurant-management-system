const express = require('express');
const router = express.Router();
const {
  getOrders,
  createOrder,
  updateOrderStatus,
  updateOrderItemStatus,
  clearAllOrders,
  callWaiter,
  getAssistanceRequests,
  updateAssistanceStatus,
  requestOrderCancellation
} = require('../controllers/orderController');

router.get('/', getOrders);
router.post('/', createOrder);
router.post('/call-waiter', callWaiter);
router.get('/assistance', getAssistanceRequests);
router.patch('/assistance/:id/status', updateAssistanceStatus);
router.post('/:id/cancel-request', requestOrderCancellation);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/items/status', updateOrderItemStatus);
router.delete('/all', clearAllOrders);

module.exports = router;
