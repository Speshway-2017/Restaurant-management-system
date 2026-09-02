const express = require('express');
const router = express.Router();
const { getOrders, createOrder, updateOrderStatus, updateOrderItemStatus, clearAllOrders, callWaiter } = require('../controllers/orderController');

router.get('/', getOrders);
router.post('/', createOrder);
router.post('/call-waiter', callWaiter);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/items/status', updateOrderItemStatus);
router.delete('/all', clearAllOrders);

module.exports = router;
