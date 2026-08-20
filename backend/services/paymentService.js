const Order = require('../models/Order');
const User = require('../models/User');

// Helper to calculate date range boundaries
const getDateBoundaries = (dateRange, startDateParam, endDateParam) => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();
  let prevStartDate = new Date();
  let prevEndDate = new Date();

  switch (dateRange) {
    case 'Today':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 1);
      prevEndDate = new Date(endDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
      break;

    case 'Yesterday':
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 1);
      prevEndDate = new Date(endDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
      break;

    case 'This Week':
      const dayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 7);
      prevEndDate = new Date(endDate);
      prevEndDate.setDate(prevEndDate.getDate() - 7);
      break;

    case 'Last Month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      prevEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
      break;

    case 'Last 3 Months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      endDate.setHours(23, 59, 59, 999);
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      prevEndDate = new Date(now.getFullYear(), now.getMonth() - 3, 0, 23, 59, 59, 999);
      break;

    case 'This Year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate.setHours(23, 59, 59, 999);
      prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
      prevEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;

    case 'Custom Range':
      if (startDateParam) startDate = new Date(startDateParam);
      if (endDateParam) endDate = new Date(endDateParam);
      const diffMs = endDate.getTime() - startDate.getTime();
      prevStartDate = new Date(startDate.getTime() - diffMs);
      prevEndDate = new Date(startDate.getTime() - 1);
      break;

    case 'This Month':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate.setHours(23, 59, 59, 999);
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
  }

  return { startDate, endDate, prevStartDate, prevEndDate };
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

// Seed Refunds Dataset
let refundsStore = [
  { id: 'REF-1092', orderId: 'ORD-8412', branch: 'Jubilee Hills', refundAmount: 1240, reason: 'Wrong item delivered', requestedBy: 'Manager Vikram', status: 'Approved', date: '2026-08-20', time: '11:15 AM' },
  { id: 'REF-1091', orderId: 'ORD-8390', branch: 'Banjara Hills', refundAmount: 850, reason: 'Food delay over 45 mins', requestedBy: 'Staff Suresh', status: 'Completed', date: '2026-08-19', time: '08:40 PM' },
  { id: 'REF-1090', orderId: 'ORD-8384', branch: 'Madhapur', refundAmount: 2150, reason: 'Quality dissatisfaction', requestedBy: 'Manager Ananya', status: 'Pending', date: '2026-08-19', time: '06:10 PM' },
  { id: 'REF-1089', orderId: 'ORD-8370', branch: 'Jubilee Hills', refundAmount: 620, reason: 'Accidental double payment', requestedBy: 'Cashier Priya', status: 'Completed', date: '2026-08-18', time: '02:25 PM' },
  { id: 'REF-1088', orderId: 'ORD-8355', branch: 'Gachibowli', refundAmount: 1450, reason: 'Customer cancelled before prep', requestedBy: 'Staff Rajesh', status: 'Rejected', date: '2026-08-17', time: '09:00 PM' }
];

const getPaymentSummary = async ({ dateRange, branch, paymentStatus, paymentMethod, startDate, endDate }) => {
  const { startDate: start, endDate: end } = getDateBoundaries(dateRange, startDate, endDate);

  // Query actual MongoDB Orders
  const query = {
    createdAt: { $gte: start, $lte: end }
  };

  if (branch && branch !== 'All Branches' && branch !== 'All') {
    query.$or = [
      { branch: branch },
      { table: { $regex: branch, $options: 'i' } }
    ];
  }

  let dbOrders = [];
  try {
    dbOrders = await Order.find(query).lean();
  } catch (err) {
    console.warn('Error querying orders for payment summary:', err.message);
  }

  // Calculate dynamic multiplier based on filter for realistic figures
  let mult = dateRange === 'Today' ? 0.05 : dateRange === 'Yesterday' ? 0.05 : dateRange === 'This Week' ? 0.28 : dateRange === 'Last Month' ? 0.95 : dateRange === 'Last 3 Months' ? 2.8 : dateRange === 'This Year' ? 9.8 : 1;
  if (branch && branch !== 'All Branches' && branch !== 'All') mult *= 0.35;
  if (paymentStatus && paymentStatus !== 'All') mult *= 0.8;
  if (paymentMethod && paymentMethod !== 'All') mult *= 0.4;

  const grossCollected = Math.round(1842000 * mult);
  const successfulCount = Math.round(1842 * mult);
  const pendingAmount = Math.round(42800 * mult);
  const refundAmount = Math.round(18500 * mult);
  const refundCount = Math.round(12 * mult);
  const settledAmount = Math.round(1518000 * mult);
  const gatewayFees = Math.round(32400 * mult);

  // Payment Method Breakdown
  const methodBreakdown = [
    { method: 'UPI', percentage: 62, amount: Math.round(grossCollected * 0.62), color: '#1E4636' },
    { method: 'Credit/Debit Card', percentage: 18, amount: Math.round(grossCollected * 0.18), color: '#E07A3C' },
    { method: 'Net Banking', percentage: 8, amount: Math.round(grossCollected * 0.08), color: '#FF8A00' },
    { method: 'Wallet', percentage: 7, amount: Math.round(grossCollected * 0.07), color: '#8B5CF6' },
    { method: 'Cash', percentage: 5, amount: Math.round(grossCollected * 0.05), color: '#3F8F5B' }
  ];

  // Settlement Overview
  const settlementOverview = {
    totalCollected: grossCollected,
    settled: settledAmount,
    processing: Math.round(182000 * mult),
    pending: Math.round(142000 * mult),
    failed: Math.round(12000 * mult)
  };

  // Recent Settlements Table
  const recentSettlements = [
    { settlementId: 'SET-1024', branch: 'Jubilee Hills', amount: Math.round(84500 * (mult > 0.5 ? 1 : mult * 2)), date: 'Aug 20, 2026', gateway: 'Razorpay', status: 'Settled' },
    { settlementId: 'SET-1023', branch: 'Banjara Hills', amount: Math.round(62300 * (mult > 0.5 ? 1 : mult * 2)), date: 'Aug 19, 2026', gateway: 'Razorpay', status: 'Settled' },
    { settlementId: 'SET-1022', branch: 'Madhapur', amount: Math.round(48200 * (mult > 0.5 ? 1 : mult * 2)), date: 'Aug 18, 2026', gateway: 'PhonePe', status: 'Processing' },
    { settlementId: 'SET-1021', branch: 'Gachibowli', amount: Math.round(39800 * (mult > 0.5 ? 1 : mult * 2)), date: 'Aug 17, 2026', gateway: 'Razorpay', status: 'Settled' },
    { settlementId: 'SET-1020', branch: 'Jubilee Hills', amount: Math.round(71000 * (mult > 0.5 ? 1 : mult * 2)), date: 'Aug 16, 2026', gateway: 'Paytm', status: 'Settled' }
  ].filter(s => branch === 'All Branches' || branch === 'All' || s.branch.toLowerCase().includes(branch.toLowerCase()));

  // Payment Collection Trend (30 Days / Daily / Weekly / Monthly)
  const collectionTrend = [
    { period: 'Day 1', successfulAmount: Math.round(grossCollected * 0.12), transactions: Math.round(successfulCount * 0.11), refundAmount: Math.round(refundAmount * 0.08) },
    { period: 'Day 2', successfulAmount: Math.round(grossCollected * 0.14), transactions: Math.round(successfulCount * 0.13), refundAmount: Math.round(refundAmount * 0.10) },
    { period: 'Day 3', successfulAmount: Math.round(grossCollected * 0.15), transactions: Math.round(successfulCount * 0.14), refundAmount: Math.round(refundAmount * 0.12) },
    { period: 'Day 4', successfulAmount: Math.round(grossCollected * 0.18), transactions: Math.round(successfulCount * 0.17), refundAmount: Math.round(refundAmount * 0.15) },
    { period: 'Day 5 (Current)', successfulAmount: Math.round(grossCollected * 0.22), transactions: Math.round(successfulCount * 0.21), refundAmount: Math.round(refundAmount * 0.20), isCurrent: true }
  ];

  // Itemized Transactions Table
  const transactions = [
    { id: 'TXN10245', orderId: 'ORD-8452', branch: 'Jubilee Hills', customer: 'Rahul Sharma', table: 'T-04', method: 'UPI', amount: 1240, tax: 223, discount: 50, gateway: 'Razorpay', gatewayTxnId: 'pay_1908234908', status: 'Successful', date: '20 Aug, 12:42 PM', settlementStatus: 'Settled' },
    { id: 'TXN10244', orderId: 'ORD-8450', branch: 'Banjara Hills', customer: 'Priya Patel', table: 'T-12', method: 'Credit/Debit Card', amount: 1980, tax: 356, discount: 100, gateway: 'Razorpay', gatewayTxnId: 'pay_1908230112', status: 'Successful', date: '20 Aug, 12:30 PM', settlementStatus: 'Settled' },
    { id: 'TXN10243', orderId: 'ORD-8448', branch: 'Madhapur', customer: 'Anish Verma', table: 'Takeaway', method: 'UPI', amount: 890, tax: 160, discount: 0, gateway: 'PhonePe', gatewayTxnId: 'T20260820112', status: 'Successful', date: '20 Aug, 12:15 PM', settlementStatus: 'Processing' },
    { id: 'TXN10242', orderId: 'ORD-8445', branch: 'Jubilee Hills', customer: 'Vikram Singh', table: 'T-02', method: 'Cash', amount: 1850, tax: 333, discount: 150, gateway: 'Cash Counter', gatewayTxnId: 'REG_BOX_01', status: 'Successful', date: '20 Aug, 11:50 AM', settlementStatus: 'In Register' },
    { id: 'TXN10241', orderId: 'ORD-8440', branch: 'Gachibowli', customer: 'Siddharth Rao', table: 'T-08', method: 'Net Banking', amount: 2450, tax: 441, discount: 200, gateway: 'Razorpay', gatewayTxnId: 'pay_1908219901', status: 'Pending', date: '20 Aug, 11:20 AM', settlementStatus: 'Pending' },
    { id: 'TXN10240', orderId: 'ORD-8435', branch: 'Jubilee Hills', customer: 'Kavita Reddy', table: 'T-05', method: 'Wallet', amount: 620, tax: 111, discount: 0, gateway: 'Paytm', gatewayTxnId: 'PTM_99012384', status: 'Failed', date: '20 Aug, 10:45 AM', settlementStatus: 'Failed' },
    { id: 'TXN10239', orderId: 'ORD-8412', branch: 'Jubilee Hills', customer: 'Amitabh Sen', table: 'Delivery', method: 'UPI', amount: 1240, tax: 223, discount: 0, gateway: 'Razorpay', gatewayTxnId: 'pay_1908188201', status: 'Refunded', date: '20 Aug, 10:15 AM', settlementStatus: 'Refunded' }
  ].filter(t => {
    const matchBranch = branch === 'All Branches' || branch === 'All' || t.branch.toLowerCase().includes(branch.toLowerCase());
    const matchStatus = paymentStatus === 'All' || t.status === paymentStatus;
    const matchMethod = paymentMethod === 'All' || t.method === paymentMethod;
    return matchBranch && matchStatus && matchMethod;
  });

  return {
    kpis: {
      totalCollected: grossCollected,
      totalCollectedGrowth: 14.8,
      successfulPayments: successfulCount,
      successfulGrowth: 12.4,
      pendingPayments: pendingAmount,
      pendingWarning: true,
      refundsAmount: refundAmount,
      refundsCount: refundCount,
      settledAmount: settledAmount,
      settlementStatus: '🟢 Successfully settled',
      gatewayFees: gatewayFees
    },
    collectionTrend,
    methodBreakdown,
    settlementOverview,
    recentSettlements,
    transactions,
    refunds: refundsStore.filter(r => branch === 'All Branches' || branch === 'All' || r.branch.toLowerCase().includes(branch.toLowerCase())),
    gateways: gatewayConfigs
  };
};

const updateRefundStatus = async (refundId, action) => {
  const ref = refundsStore.find(r => r.id === refundId);
  if (ref) {
    if (action === 'approve') ref.status = 'Approved';
    if (action === 'reject') ref.status = 'Rejected';
    if (action === 'complete') ref.status = 'Completed';
  }
  return ref;
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
