const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/authMiddleware');
const {
  getOrders,
  createOrder,
  updateOrderStatus,
  claimOrder,
  chefAcceptOrder,
  chefUpdateStatus,
  waiterAcceptOrder,
  waiterUpdateStatus,
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
router.patch('/assistance/:id/status', updateAssistanceStatus);
router.post('/:id/cancel-request', requestOrderCancellation);
router.patch('/:id/claim', claimOrder);
router.patch('/:id/chef-accept', chefAcceptOrder);
router.patch('/:id/chef-status', chefUpdateStatus);
router.patch('/:id/waiter-accept', waiterAcceptOrder);
router.patch('/:id/waiter-status', waiterUpdateStatus);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/items/status', updateOrderItemStatus);
router.delete('/all', clearAllOrders);

module.exports = router;
