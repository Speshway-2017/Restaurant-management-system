const express = require('express');
const router = express.Router();
const { protect, optionalAuth, requireWaiterRole } = require('../middleware/authMiddleware');
const {
  getOrders,
  createOrder,
  updateOrderStatus,
  claimOrder,
  chefAcceptOrder,
  chefUpdateStatus,
  waiterAcceptOrder,
  waiterUpdateStatus,
  confirmWaiterPayment,
  updateOrderItemStatus,
  clearAllOrders,
  callWaiter,
  getAssistanceRequests,
  updateAssistanceStatus,
  requestOrderCancellation
} = require('../controllers/orderController');

router.use(optionalAuth);

router.get('/', getOrders);
router.post('/', createOrder);
router.post('/call-waiter', callWaiter);
router.get('/assistance', getAssistanceRequests);
router.patch('/assistance/:id/status', protect, updateAssistanceStatus);
router.post('/:id/cancel-request', protect, requestOrderCancellation);
router.patch('/:id/claim', protect, claimOrder);
router.patch('/:id/chef-accept', protect, chefAcceptOrder);
router.patch('/:id/chef-status', protect, chefUpdateStatus);
router.patch('/:id/waiter-accept', protect, requireWaiterRole, waiterAcceptOrder);
router.patch('/:id/waiter-status', protect, requireWaiterRole, waiterUpdateStatus);
router.patch('/:id/confirm-payment', protect, confirmWaiterPayment);
router.patch('/:id/complete', protect, confirmWaiterPayment);
router.patch('/:id/status', protect, updateOrderStatus);
router.patch('/:id/items/status', protect, updateOrderItemStatus);
router.delete('/all', protect, clearAllOrders);

module.exports = router;
