const Order = require('../models/Order');

// Helper to calculate date range boundaries
const getDateBoundaries = (dateRange, startDateParam, endDateParam) => {
  const now = new Date();
  let startDate = null;
  let endDate = null;

  switch (dateRange) {
    case 'Today':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'Yesterday':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'This Week':
      startDate = new Date(now);
      const dayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'Last Month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;

    case 'Last 3 Months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'This Year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'Custom Range':
      if (startDateParam) startDate = new Date(startDateParam);
      if (endDateParam) {
        endDate = new Date(endDateParam);
        endDate.setHours(23, 59, 59, 999);
      }
      break;

    case 'This Month':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return { startDate, endDate };
};

// Seed Payment Gateway Configurations
let gatewayConfigs = {
  razorpay: {
    id: 'razorpay',
    name: 'Razorpay',
    status: 'Connected',
    enabled: true,
    merchantId: 'rzp_live_894120948',
    apiKey: 'rzp_live_9081293841',
    secretKeyMasked: '••••••••••••••••3491',
    mode: 'Live',
    webhookStatus: 'Active',
    lastSync: 'Just now'
  },
  phonepe: {
    id: 'phonepe',
    name: 'PhonePe PG',
    status: 'Not Configured',
    enabled: false,
    merchantId: '',
    apiKey: '',
    secretKeyMasked: '',
    mode: 'Test',
    webhookStatus: 'Inactive',
    lastSync: 'Never'
  },
  paytm: {
    id: 'paytm',
    name: 'Paytm Business',
    status: 'Not Configured',
    enabled: false,
    merchantId: '',
    apiKey: '',
    secretKeyMasked: '',
    mode: 'Test',
    webhookStatus: 'Inactive',
    lastSync: 'Never'
  }
};

// In-memory refund status overrides
const refundStatusOverrides = {};

const getPaymentSummary = async ({ dateRange, branch, paymentStatus, paymentMethod, startDate, endDate }) => {
  const { startDate: start, endDate: end } = getDateBoundaries(dateRange, startDate, endDate);

  const query = {};
  if (start && end) {
    query.createdAt = { $gte: start, $lte: end };
  }

  if (branch && branch !== 'All Branches' && branch !== 'All') {
    query.$or = [
      { branch: branch },
      { table: { $regex: branch, $options: 'i' } }
    ];
  }

  let dbOrders = [];
  try {
    dbOrders = await Order.find(query).sort({ createdAt: -1 }).lean();
  } catch (err) {
    console.warn('Error querying orders for payment summary:', err.message);
  }

  let totalCollected = 0;
  let successfulPayments = 0;
  let pendingPayments = 0;
  let refundsAmount = 0;
  let refundsCount = 0;

  const methodTotals = {
    'UPI': 0,
    'Credit/Debit Card': 0,
    'Net Banking': 0,
    'Wallet': 0,
    'Cash': 0
  };

  const transactions = [];
  const refunds = [];

  dbOrders.forEach(order => {
    const isPaid = order.paymentStatus === 'Paid' || order.payment === 'Paid' || order.status === 'Completed' || order.status === 'Paid';
    const isCancelledOrRefunded = order.paymentStatus === 'Refunded' || order.status === 'Cancelled' || order.paymentStatus === 'Cancelled';
    const isPending = !isPaid && !isCancelledOrRefunded;

    const amount = Number(order.total || 0);
    const rawMethod = order.paymentMethod || 'UPI';
    let stdMethod = 'UPI';
    if (/card/i.test(rawMethod)) stdMethod = 'Credit/Debit Card';
    else if (/net/i.test(rawMethod) || /bank/i.test(rawMethod)) stdMethod = 'Net Banking';
    else if (/wallet/i.test(rawMethod) || /paytm/i.test(rawMethod)) stdMethod = 'Wallet';
    else if (/cash/i.test(rawMethod)) stdMethod = 'Cash';

    if (isPaid) {
      totalCollected += amount;
      successfulPayments += 1;
      methodTotals[stdMethod] += amount;
    } else if (isPending) {
      pendingPayments += amount;
    } else if (isCancelledOrRefunded) {
      refundsAmount += amount;
      refundsCount += 1;

      const refId = 'REF-' + (order.orderId ? String(order.orderId).replace(/^#/,'') : String(order._id).slice(-4).toUpperCase());
      const currentRefStatus = refundStatusOverrides[refId] || (order.paymentStatus === 'Refunded' ? 'Approved' : 'Completed');

      refunds.push({
        id: refId,
        orderId: order.orderId || ('ORD-' + String(order._id).slice(-4)),
        branch: order.branch || 'Main Branch',
        refundAmount: amount,
        reason: order.notes || 'Order Cancelled / Refunded',
        requestedBy: 'Staff',
        status: currentRefStatus,
        date: order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
      });
    }

    const txStatus = isPaid ? 'Paid' : isCancelledOrRefunded ? 'Refunded' : 'Pending';

    // Check filters
    const matchStatus = !paymentStatus || paymentStatus === 'All' || (paymentStatus === 'Successful' ? txStatus === 'Paid' : txStatus === paymentStatus);
    const matchMethod = !paymentMethod || paymentMethod === 'All' || stdMethod === paymentMethod;

    if (matchStatus && matchMethod) {
      transactions.push({
        id: order.transactionId || ('TXN-' + (order.orderId ? String(order.orderId).replace(/^#/,'') : String(order._id).slice(-6).toUpperCase())),
        orderId: order.orderId || ('ORD-' + String(order._id).slice(-4)),
        branch: order.branch || 'Main Branch',
        customer: order.customer || 'Guest Diner',
        table: order.table || 'Takeaway',
        method: stdMethod,
        amount: amount,
        tax: order.gstAmount || Math.round(amount * 0.05),
        discount: order.discountAmount || 0,
        gateway: stdMethod === 'Cash' ? 'Cash Counter' : 'Razorpay',
        gatewayTxnId: order.transactionId || ('pay_' + String(order._id).slice(-8)),
        status: txStatus,
        date: order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '',
        settlementStatus: isPaid ? 'Settled' : txStatus
      });
    }
  });

  const gatewayFees = Math.round(totalCollected * 0.015);
  const settledAmount = Math.max(0, totalCollected - refundsAmount - gatewayFees);

  // Method Breakdown
  const methodBreakdown = [
    { method: 'UPI', percentage: totalCollected > 0 ? Math.round((methodTotals['UPI'] / totalCollected) * 100) : 0, amount: methodTotals['UPI'], color: '#1E4636' },
    { method: 'Credit/Debit Card', percentage: totalCollected > 0 ? Math.round((methodTotals['Credit/Debit Card'] / totalCollected) * 100) : 0, amount: methodTotals['Credit/Debit Card'], color: '#E07A3C' },
    { method: 'Net Banking', percentage: totalCollected > 0 ? Math.round((methodTotals['Net Banking'] / totalCollected) * 100) : 0, amount: methodTotals['Net Banking'], color: '#FF8A00' },
    { method: 'Wallet', percentage: totalCollected > 0 ? Math.round((methodTotals['Wallet'] / totalCollected) * 100) : 0, amount: methodTotals['Wallet'], color: '#8B5CF6' },
    { method: 'Cash', percentage: totalCollected > 0 ? Math.round((methodTotals['Cash'] / totalCollected) * 100) : 0, amount: methodTotals['Cash'], color: '#3F8F5B' }
  ];

  // Collection Trend
  const collectionTrendMap = {};
  dbOrders.forEach(o => {
    if (o.createdAt && (o.paymentStatus === 'Paid' || o.status === 'Completed' || o.payment === 'Paid')) {
      const dayLabel = new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      collectionTrendMap[dayLabel] = (collectionTrendMap[dayLabel] || 0) + Number(o.total || 0);
    }
  });

  let collectionTrend = Object.keys(collectionTrendMap).map((period, idx, arr) => ({
    period,
    successfulAmount: collectionTrendMap[period],
    transactions: dbOrders.filter(o => o.createdAt && new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) === period).length,
    refundAmount: 0,
    isCurrent: idx === arr.length - 1
  }));

  if (collectionTrend.length === 0) {
    collectionTrend = [
      { period: 'Today', successfulAmount: 0, transactions: 0, refundAmount: 0, isCurrent: true }
    ];
  }

  // Recent Settlements
  const recentSettlements = [];
  if (totalCollected > 0) {
    recentSettlements.push({
      settlementId: 'SET-' + Math.floor(1000 + Math.random() * 9000),
      branch: branch && branch !== 'All Branches' ? branch : 'Main Branch',
      amount: settledAmount,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      gateway: 'Razorpay / Bank Direct',
      status: 'Settled'
    });
  }

  return {
    kpis: {
      totalCollected,
      totalCollectedGrowth: 0,
      successfulPayments,
      successfulGrowth: 0,
      pendingPayments,
      pendingWarning: pendingPayments > 0,
      refundsAmount,
      refundsCount,
      settledAmount,
      settlementStatus: totalCollected > 0 ? '🟢 Successfully settled' : '⚪ No settlements',
      gatewayFees
    },
    collectionTrend,
    methodBreakdown,
    settlementOverview: {
      totalCollected,
      settled: settledAmount,
      processing: pendingPayments,
      pending: pendingPayments,
      failed: 0
    },
    recentSettlements,
    transactions,
    refunds,
    gateways: gatewayConfigs
  };
};

const updateRefundStatus = async (refundId, action) => {
  if (action === 'approve') refundStatusOverrides[refundId] = 'Approved';
  if (action === 'reject') refundStatusOverrides[refundId] = 'Rejected';
  if (action === 'complete') refundStatusOverrides[refundId] = 'Completed';
  return { id: refundId, status: refundStatusOverrides[refundId] };
};

const getGatewayConfigs = async () => {
  return gatewayConfigs;
};

const updateGatewayConfig = async (gatewayId, data) => {
  if (gatewayConfigs[gatewayId]) {
    gatewayConfigs[gatewayId] = {
      ...gatewayConfigs[gatewayId],
      ...data,
      status: data.enabled ? 'Connected' : 'Not Configured',
      lastSync: 'Just now'
    };
    if (data.secretKey && data.secretKey !== '••••••••••••••••3491') {
      gatewayConfigs[gatewayId].secretKeyMasked = '••••••••••••••••' + data.secretKey.slice(-4);
    }
  }
  return gatewayConfigs[gatewayId];
};

module.exports = {
  getPaymentSummary,
  updateRefundStatus,
  getGatewayConfigs,
  updateGatewayConfig
};

