const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Payments Summary & Metrics
router.get('/summary', paymentController.getSummary);

// Refund Operations
router.patch('/refunds/:id', paymentController.updateRefundStatus);

// Payment Gateway Configurations
router.get('/gateways', paymentController.getGatewayConfigs);
router.put('/gateways/:gatewayId', paymentController.updateGatewayConfig);
router.post('/gateways/:gatewayId/test', paymentController.testGatewayConnection);

module.exports = router;
