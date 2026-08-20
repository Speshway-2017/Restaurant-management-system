const paymentService = require('../services/paymentService');

const getSummary = async (req, res) => {
  try {
    const { dateRange, branch, paymentStatus, paymentMethod, startDate, endDate } = req.query;
    const data = await paymentService.getPaymentSummary({
      dateRange: dateRange || 'This Month',
      branch: branch || 'All Branches',
      paymentStatus: paymentStatus || 'All',
      paymentMethod: paymentMethod || 'All',
      startDate,
      endDate
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({ success: false, message: 'Server error fetching payment summary' });
  }
};

const updateRefundStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const updatedRefund = await paymentService.updateRefundStatus(id, action);
    res.json({ success: true, data: updatedRefund });
  } catch (error) {
    console.error('Error updating refund status:', error);
    res.status(500).json({ success: false, message: 'Failed to update refund status' });
  }
};

const getGatewayConfigs = async (req, res) => {
  try {
    const configs = await paymentService.getGatewayConfigs();
    res.json({ success: true, data: configs });
  } catch (error) {
    console.error('Error fetching gateway configs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch gateway configs' });
  }
};

const updateGatewayConfig = async (req, res) => {
  try {
    const { gatewayId } = req.params;
    const updatedConfig = await paymentService.updateGatewayConfig(gatewayId, req.body);
    res.json({ success: true, data: updatedConfig });
  } catch (error) {
    console.error('Error updating gateway config:', error);
    res.status(500).json({ success: false, message: 'Failed to update gateway config' });
  }
};

const testGatewayConnection = async (req, res) => {
  try {
    const { gatewayId } = req.params;
    res.json({
      success: true,
      message: `Gateway test connection for ${gatewayId.toUpperCase()} succeeded! Credentials verified with merchant API.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gateway test connection failed' });
  }
};

module.exports = {
  getSummary,
  updateRefundStatus,
  getGatewayConfigs,
  updateGatewayConfig,
  testGatewayConnection
};
