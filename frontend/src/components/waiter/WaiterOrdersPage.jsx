import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, Clock, RefreshCw, AlertTriangle, Utensils, Search, Filter, Receipt, CreditCard, QrCode, DollarSign, X, Bell, Ticket, Coins, Eye, Printer } from 'lucide-react';
import { api } from '../../services/api';
import { mergeOrderItems, normalizeOrderItem, clearTableSessionStorage } from '../../utils/orderUtils';

export default function WaiterOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);
  const [billingOrder, setBillingOrder] = useState(null);
  const [viewOrderDetailsModal, setViewOrderDetailsModal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [tipInput, setTipInput] = useState('');
  const [showPreparedOnly, setShowPreparedOnly] = useState(false);

  // Coupon state for payment modal
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const handleApplyCoupon = async (rawSubtotal) => {
    if (!couponInput || !couponInput.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await api.validateCoupon(couponInput.trim(), Number(rawSubtotal || 0));
      if (res && res.valid) {
        setAppliedCoupon({
          code: res.code,
          discountType: res.discountType,
          discountVal: res.discountVal,
          discountAmount: res.discountAmount,
          finalAmount: res.finalAmount
        });
      } else {
        setCouponError(res ? res.message : 'Invalid or expired coupon');
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError(err.message || 'Invalid or expired coupon');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  // Live time ticker matching Dashboard Home
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    const handleSync = () => fetchOrders();
    window.addEventListener('flavora_orders_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('flavora_orders_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      let data = [];
      try {
        data = await api.getOrders();
      } catch (e) { }

      let localOrders = [];
      try {
        const raw = localStorage.getItem('flavora_manager_orders');
        if (raw) localOrders = JSON.parse(raw);
      } catch (e) { }

      const dbList = Array.isArray(data) ? data : [];
      const localList = Array.isArray(localOrders) ? localOrders : [];

      const getCleanOrderId = (ord, idx) => {
        if (!ord) return `ORD-${idx + 1}`;
        const raw = ord.orderId || ord.id || ord._id || ord.orderNum;
        if (!raw) return `ORD-${idx + 1}`;
        return String(raw).replace(/^#/i, '').trim();
      };

      const orderMap = new Map();

      dbList.forEach((d, idx) => {
        if (!d) return;
        const key = getCleanOrderId(d, idx);
        orderMap.set(key, d);
      });

      localList.forEach((l, idx) => {
        if (!l) return;
        const key = getCleanOrderId(l, idx);
        if (!orderMap.has(key)) {
          orderMap.set(key, l);
        }
      });

      const sourceOrders = Array.from(orderMap.values());

      const merged = sourceOrders.map((ordDoc, idx) => {
        const cleanId = getCleanOrderId(ordDoc, idx);

        const dbMatch = dbList.find((d, dIdx) => d && getCleanOrderId(d, dIdx) === cleanId);
        const localMatch = localList.find((l, lIdx) => l && getCleanOrderId(l, lIdx) === cleanId);

        const dbStatus = dbMatch?.status;
        const localStatus = localMatch?.status;
        const isOrderReady = dbStatus === 'Ready' || localStatus === 'Ready' || ordDoc.status === 'Ready';

        const dbItems = Array.isArray(dbMatch?.items) ? dbMatch.items : (Array.isArray(ordDoc.items) ? ordDoc.items : []);
        const localItems = Array.isArray(localMatch?.items) ? localMatch.items : [];

        const mergedItems = mergeOrderItems(dbItems, localItems);
        const finalItems = mergedItems.map(it => {
          const stUpper = String(it.status || '').toUpperCase().trim();
          const isDelivered = Boolean(it.isDelivered || stUpper === 'DELIVERED' || stUpper === 'SERVED');
          const isReady = Boolean(!isDelivered && (it.isReady || stUpper === 'READY' || stUpper === 'READY_FOR_PASS'));
          const isCooking = Boolean(!isDelivered && !isReady && (stUpper === 'COOKING' || stUpper === 'PREPARING' || dbStatus === 'Preparing' || dbStatus === 'Cooking'));
          const status = isDelivered ? 'SERVED' : (isReady ? 'READY' : (isCooking ? 'PREPARING' : 'PLACED'));

          return {
            ...it,
            status,
            isReady,
            isDelivered
          };
        });

        const totalCount = finalItems.reduce((sum, i) => sum + Number(i.quantity || 1), 0);
        const readyCount = finalItems.reduce((sum, i) => ((i.status === 'READY' || i.isReady) && !i.isDelivered && i.status !== 'SERVED' && i.status !== 'DELIVERED') ? sum + Number(i.quantity || 1) : sum, 0);
        const deliveredCount = finalItems.reduce((sum, i) => (i.status === 'SERVED' || i.status === 'DELIVERED' || i.isDelivered) ? sum + Number(i.quantity || 1) : sum, 0);

        const isAlreadyPaid = Boolean(
          dbStatus === 'Completed' || dbStatus === 'Paid' || 
          localStatus === 'Completed' || localStatus === 'Paid' || 
          ordDoc.status === 'Completed' || ordDoc.status === 'Paid' || 
          ordDoc.payment === 'Paid' || ordDoc.payment === 'Completed'
        );

        let derivedStatus = isAlreadyPaid ? 'Completed' : (dbStatus || localStatus || ordDoc.status || 'Placed');
        if (!isAlreadyPaid) {
          if (totalCount > 0 && deliveredCount === totalCount) {
            derivedStatus = 'Served';
          } else if (deliveredCount > 0) {
            derivedStatus = 'PARTIALLY DELIVERED';
          } else if (readyCount === totalCount || (readyCount > 0 && readyCount + deliveredCount === totalCount)) {
            derivedStatus = 'Ready';
          } else if (readyCount > 0) {
            derivedStatus = 'Preparing';
          }
        }

        return {
          ...ordDoc,
          id: ordDoc.id || ordDoc._id || ordDoc.orderId || cleanId,
          status: derivedStatus,
          items: finalItems
        };
      });

      setOrders(merged);
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverReadyDishes = async (order) => {
    const rawItems = Array.isArray(order.items) ? order.items : [];
    const itemsToDeliver = rawItems.filter(i => (i.status === 'READY' || i.isReady) && i.status !== 'DELIVERED' && !i.isDelivered);
    if (itemsToDeliver.length === 0) return;

    const targetItemIds = itemsToDeliver.map((i, idx) => i._id || i.id || i.itemId || idx);
    const targetOrderId = order._id || order.id || order.orderId;

    try {
      await api.updateOrderItemStatus(targetOrderId, targetItemIds, 'DELIVERED');
    } catch (e) {
      console.warn("API delivery call fallback:", e.message);
    }

    const updatedOrders = orders.map(o => {
      if (o.id === order.id || o._id === order._id || o.orderId === order.orderId) {
        const newItems = (o.items || []).map((it, idx) => {
          const itId = it._id || it.id || it.itemId || idx;
          const isTarget = targetItemIds.includes(itId) || targetItemIds.includes(idx);
          if (isTarget) {
            return { ...it, status: 'DELIVERED', isDelivered: true, isReady: true };
          }
          return it;
        });

        const totalCount = newItems.length;
        const deliveredCount = newItems.filter(i => i.status === 'DELIVERED' || i.isDelivered).length;
        const newStatus = (totalCount > 0 && deliveredCount === totalCount) ? 'Served' : (deliveredCount > 0 ? 'PARTIALLY DELIVERED' : o.status);

        return {
          ...o,
          items: newItems,
          status: newStatus
        };
      }
      return o;
    });

    setOrders(updatedOrders);
    try {
      localStorage.setItem('flavora_manager_orders', JSON.stringify(updatedOrders));
      window.dispatchEvent(new Event('flavora_orders_updated'));
      window.dispatchEvent(new Event('flavora_tables_updated'));
    } catch (e) { }
  };

  const handleUpdateStatus = async (orderId, newStatus, extra = {}) => {
    const cleanOrderId = String(orderId).replace(/^#/i, '');
    const updated = orders.map(o => {
      const oId = String(o.id || o._id || o.orderId || '').replace(/^#/i, '');
      if (oId === cleanOrderId || o.id === orderId || o._id === orderId || o.orderId === orderId) {
        return { ...o, status: newStatus, ...extra };
      }
      return o;
    });

    setOrders(updated);

    try {
      localStorage.setItem('flavora_manager_orders', JSON.stringify(updated));
      window.dispatchEvent(new Event('flavora_orders_updated'));
      window.dispatchEvent(new Event('flavora_tables_updated'));
    } catch (e) { }

    try {
      await api.updateOrderStatus(orderId, newStatus, extra);
    } catch (e) {
      console.warn("Backend order status sync warning:", e);
    }
  };

  const handleGenerateBill = async (order) => {
    const orderId = order._id || order.id || order.orderId;
    await handleUpdateStatus(orderId, 'Bill Generated', { payment: 'Awaiting Payment' });
    setBillingOrder({ ...order, status: 'Bill Generated', payment: 'Awaiting Payment' });
  };

  const handleConfirmPayment = async (order) => {
    const orderId = order._id || order.id || order.orderId;
    const tableNum = order.table || order.tableNumber || 'T-01';
    const originalTotal = Number(order.originalTotal || order.originalAmount || order.total || order.totalAmount || 0);
    const discountAmount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : Number(order.discountAmount || 0);
    const finalAmount = appliedCoupon ? Number(appliedCoupon.finalAmount || (originalTotal - discountAmount)) : (order.finalAmount !== undefined ? Number(order.finalAmount) : originalTotal);
    const couponCode = appliedCoupon ? appliedCoupon.code : (order.couponCode || '');
    const tipVal = Number(tipInput || 0);

    // 1. Confirm Payment -> Order Status = Completed, Payment Status = Paid
    await handleUpdateStatus(orderId, 'Completed', {
      status: 'Completed',
      orderStatus: 'Completed',
      payment: 'Paid',
      paymentStatus: 'Paid',
      paymentMethod: paymentMethod,
      originalTotal: originalTotal,
      originalAmount: originalTotal,
      couponCode: couponCode,
      discountAmount: discountAmount,
      finalAmount: finalAmount,
      total: finalAmount,
      totalAmount: finalAmount,
      tip: tipVal,
      tipAmount: tipVal
    });

    // 2. Table AUTOMATICALLY transitions to CLEANING
    try {
      let savedTables = [];
      const raw = localStorage.getItem('flavora_tables');
      if (raw) savedTables = JSON.parse(raw);

      let updated = false;
      const updatedList = savedTables.map(t => {
        const tNum = t.num || t.number || `T-${String(t.id || 1).padStart(2, '0')}`;
        if (tNum === tableNum) {
          updated = true;
          return { ...t, status: 'Cleaning' };
        }
        return t;
      });

      if (!updated) {
        updatedList.push({ num: tableNum, status: 'Cleaning', zone: 'Main Dining', cap: 4 });
      }

      localStorage.setItem('flavora_tables', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('flavora_tables_updated'));
    } catch (e) { }

    setPaymentModalOrder(null);
    setBillingOrder(null);
  };

  const getIsPaid = (o) => Boolean(
    o.status === 'Completed' || o.status === 'Paid' || 
    o.payment === 'Paid' || o.payment === 'Completed'
  );

  const filteredOrders = orders.filter(o => {
    const isPaid = getIsPaid(o);
    if (filter === 'ALL') return showPreparedOnly ? (Array.isArray(o.items) && o.items.some(i => (i.status === 'READY' || i.isReady) && !i.isDelivered && i.status !== 'DELIVERED')) : true;
    if (filter === 'READY') {
      if (isPaid) return false;
      const itemsList = Array.isArray(o.items) ? o.items : [];
      const readyCount = itemsList.filter(i => (i.status === 'READY' || i.isReady) && i.status !== 'DELIVERED' && !i.isDelivered).length;
      return o.status === 'Ready' || readyCount > 0;
    }
    if (filter === 'ACTIVE') {
      if (isPaid) return false;
      return o.status === 'Placed' || o.status === 'Preparing' || o.status === 'Ready' || o.status === 'PARTIALLY DELIVERED';
    }
    if (filter === 'SERVED') {
      if (isPaid) return false;
      return o.status === 'Served' || o.status === 'PARTIALLY DELIVERED' || o.status === 'Bill Generated';
    }
    if (filter === 'PAID') {
      return isPaid;
    }
    return true;
  });

  const getOrderId = (ord) => {
    if (!ord) return 'ORD-101';
    const val = ord.orderId || ord._id || ord.id || ord.orderNum;
    if (!val) return 'ORD-101';
    const str = String(val);
    if (str.startsWith('ORD-') || str.startsWith('#')) return str.replace(/^#/, '');
    if (str.length > 8) return `ORD-${str.slice(-6).toUpperCase()}`;
    return `ORD-${str}`;
  };

  return (
    <div className="admin-dashboard-container" style={{ width: '100%', boxSizing: 'border-box' }}>

      {/* ================= 1. PAGE HEADER (MATCHING DASHBOARD HOME) ================= */}
          <div className="admin-dashboard-header" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="page-breadcrumb-bar">
                <span>Waiter</span>
                <span className="crumb-sep">›</span>
                <span className="crumb-current">Orders</span>
              </div>
              <h1 className="admin-page-title" style={{ margin: 0 }}>
                Orders
              </h1>
              <p className="admin-page-subtitle" style={{ margin: '0.2rem 0 0 0' }}>
                Track Kitchen Progress, Generate Bills & Confirm Successful Payments
              </p>
            </div>
          </div>

          {/* ================= 2. FILTER TOOLBAR ================= */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            padding: '0.85rem 1.25rem',
            border: '1px solid #E2E8F0',
            marginBottom: '1.5rem',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: `All Orders (${orders.length})` },
                { id: 'READY', label: `Ready for Pickup (${orders.filter(o => !getIsPaid(o) && (o.status === 'Ready' || (Array.isArray(o.items) && o.items.some(i => (i.status === 'READY' || i.isReady) && !i.isDelivered && i.status !== 'DELIVERED')))).length})` },
                { id: 'ACTIVE', label: `Preparing (${orders.filter(o => !getIsPaid(o) && (o.status === 'Placed' || o.status === 'Preparing')).length})` },
                { id: 'SERVED', label: `Served / Billing (${orders.filter(o => !getIsPaid(o) && (o.status === 'Served' || o.status === 'Bill Generated' || o.status === 'PARTIALLY DELIVERED')).length})` },
                { id: 'PAID', label: `Paid (${orders.filter(o => getIsPaid(o)).length})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    backgroundColor: filter === f.id ? '#0F2A1D' : '#F8FAFC',
                    color: filter === f.id ? '#FFFFFF' : '#475569',
                    border: '1px solid',
                    borderColor: filter === f.id ? '#0F2A1D' : '#E2E8F0',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}

              <button
                onClick={() => setShowPreparedOnly(!showPreparedOnly)}
                style={{
                  backgroundColor: showPreparedOnly ? '#166534' : '#F0FDF4',
                  color: showPreparedOnly ? '#FFFFFF' : '#166534',
                  border: '1.5px solid #86EFAC',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Bell size={13} />
                <span>{showPreparedOnly ? '✓ Showing Prepared Items Only' : 'Filter Prepared Items Only'}</span>
              </button>
            </div>

            <button
              onClick={fetchOrders}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#F1F5F9',
                color: '#0F2A1D',
                border: '1px solid #CBD5E1',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {/* ================= 3. ORDERS GRID ================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => {
                const itemsList = Array.isArray(order.items) ? order.items : [];
                
                // Helper to check if item is delivered / served
                const isItemDelivered = (item) => {
                  if (!item) return false;
                  const s = String(item.status || '').toUpperCase().trim();
                  return s === 'DELIVERED' || s === 'SERVED' || Boolean(item.isDelivered);
                };

                // Helper to check if item is ready for pass / ready to serve
                const isItemReady = (item) => {
                  if (!item) return false;
                  if (isItemDelivered(item)) return false;
                  const s = String(item.status || '').toUpperCase().trim();
                  return s === 'READY' || s === 'READY_FOR_PASS' || Boolean(item.isReady);
                };

                const totalItemsCount = itemsList.reduce((sum, i) => sum + Number(i.quantity || 1), 0);
                const readyCount = itemsList.reduce((sum, i) => isItemReady(i) ? sum + Number(i.quantity || 1) : sum, 0);
                const deliveredCount = itemsList.reduce((sum, i) => isItemDelivered(i) ? sum + Number(i.quantity || 1) : sum, 0);

                const readyItems = itemsList.filter(isItemReady);
                const deliveredItems = itemsList.filter(isItemDelivered);

                // STRICT DERIVED STATUS FORMULA (Req #3, #4, #6)
                const isAllDelivered = totalItemsCount > 0 && deliveredCount === totalItemsCount;
                const isPartiallyDelivered = deliveredCount > 0 && deliveredCount < totalItemsCount;
                const isAllReady = totalItemsCount > 0 && readyCount === totalItemsCount && deliveredCount === 0;
                const isPartiallyReady = readyCount > 0 && (readyCount + deliveredCount) < totalItemsCount;

                const isBillGenerated = order.status === 'Bill Generated' || order.payment === 'Awaiting Payment';
                const isPaid = order.status === 'Completed' || order.status === 'Paid' || order.payment === 'Completed' || order.payment === 'Paid' || order.paymentStatus === 'Paid';
                const isServed = order.status === 'Served' || isAllDelivered;

                let orderStatusBadgeText = 'Preparing';
                let badgeBg = '#FFF3EB';
                let badgeColor = '#E07A3C';

                if (isPaid) {
                  orderStatusBadgeText = '✓ Completed (Paid)';
                  badgeBg = '#F0FDF4';
                  badgeColor = '#166534';
                } else if (isBillGenerated) {
                  orderStatusBadgeText = '📄 Bill Presented';
                  badgeBg = '#FEF3C7';
                  badgeColor = '#92400E';
                } else if (isAllDelivered) {
                  orderStatusBadgeText = '✓ Fully Delivered';
                  badgeBg = '#DCFCE7';
                  badgeColor = '#166534';
                } else if (isPartiallyDelivered) {
                  orderStatusBadgeText = `⚡ Partial Delivered (${deliveredCount}/${totalItemsCount})`;
                  badgeBg = '#EEF2FF';
                  badgeColor = '#283593';
                } else if (isAllReady) {
                  orderStatusBadgeText = '🔔 Ready for Serving';
                  badgeBg = '#EEF2FF';
                  badgeColor = '#283593';
                } else if (isPartiallyReady) {
                  orderStatusBadgeText = `🔔 Partially Ready (${readyCount}/${totalItemsCount})`;
                  badgeBg = '#FEF3C7';
                  badgeColor = '#92400E';
                } else {
                  orderStatusBadgeText = 'Preparing';
                  badgeBg = '#FFF3EB';
                  badgeColor = '#E07A3C';
                }

                return (
                  <div
                    key={order._id || order.id || order.orderId}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      border: isAllDelivered ? '2px solid #22C55E' : (readyCount > 0 ? '2px solid #283593' : (isBillGenerated ? '2px solid #D97706' : '1px solid #E2E8F0')),
                      boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D' }}>
                            Table {order.table || order.tableNumber || '01'}
                          </h3>
                          <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700 }}>
                            ID: #{getOrderId(order)}
                          </span>
                        </div>

                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          backgroundColor: badgeBg,
                          color: badgeColor,
                          padding: '0.3rem 0.65rem',
                          borderRadius: '8px'
                        }}>
                          {orderStatusBadgeText}
                        </span>
                      </div>

                      {/* Itemized Dish List */}
                      <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F2A1D' }}>
                            👤 Customer: {order.customer || order.guestName || 'Guest'}
                          </div>
                          {readyCount > 0 && (
                            <span style={{ fontSize: '0.72rem', backgroundColor: '#DCFCE7', color: '#166534', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid #86EFAC' }}>
                              🔔 {readyCount} Prepared to Serve
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '140px', overflowY: 'auto' }}>
                          {((showPreparedOnly || filter === 'READY') && readyCount > 0 ? readyItems : itemsList).map((item, idx) => {
                            const isDeliveredItem = isPaid || isItemDelivered(item);
                            const isReadyItem = !isDeliveredItem && isItemReady(item);

                            return (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  backgroundColor: isDeliveredItem ? '#F1F5F9' : (isReadyItem ? '#DCFCE7' : '#FFFFFF'),
                                  border: isDeliveredItem ? '1px solid #CBD5E1' : (isReadyItem ? '1.5px solid #86EFAC' : '1px solid #E2E8F0'),
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem'
                                }}
                              >
                                <span style={{ fontWeight: 800, color: isDeliveredItem ? '#64748B' : (isReadyItem ? '#166534' : '#0F2A1D'), textDecoration: isDeliveredItem ? 'line-through' : 'none' }}>
                                  {isDeliveredItem ? '✓' : (isReadyItem ? '🔔 READY:' : '⏳')} {item.name || item.dishId} (x{item.quantity || 1})
                                </span>

                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  color: isDeliveredItem ? '#64748B' : (isReadyItem ? '#166534' : '#C2410C'),
                                  backgroundColor: isDeliveredItem ? '#E2E8F0' : (isReadyItem ? '#BBF7D0' : '#FFEDD5'),
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '6px'
                                }}>
                                  {isDeliveredItem ? 'Delivered' : (isReadyItem ? 'READY TO SERVE' : 'Preparing')}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {(() => {
                          const isPaid = order.status === 'Completed' || order.status === 'Paid' || order.payment === 'Paid' || order.payment === 'Completed';
                          const displayPaidVal = Number(order.finalAmount ?? order.total ?? order.totalAmount ?? 0);

                          return (
                            <div style={{ marginTop: '0.5rem' }}>
                              {/* Primary Paid Amount Line */}
                              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#166534', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span>₹{displayPaidVal}</span>
                                {isPaid && (
                                  <span style={{ fontSize: '0.7rem', backgroundColor: '#DCFCE7', color: '#166534', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '6px', border: '1px solid #86EFAC' }}>
                                    ✓ PAID
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {/* ITEM-LEVEL DELIVERY BUTTONS (Req #4, #5, #13) */}
                      {!isPaid && !isBillGenerated && (
                        <div style={{ marginBottom: '0.2rem' }}>
                          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', marginBottom: '0.3rem', textAlign: 'center' }}>
                            {deliveredCount > 0 ? `Delivered: ${deliveredCount} / ${totalItemsCount} • Remaining: ${totalItemsCount - deliveredCount}` : `${readyCount} of ${totalItemsCount} dishes ready`}
                          </div>

                          {readyCount > 0 ? (
                            <button
                              onClick={() => handleDeliverReadyDishes(order)}
                              style={{
                                width: '100%',
                                backgroundColor: '#1E4636',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '0.65rem',
                                borderRadius: '10px',
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem',
                                boxShadow: '0 4px 12px rgba(30, 70, 54, 0.2)'
                              }}
                            >
                              <CheckCircle2 size={16} />
                              <span>Mark Ready Dishes as Delivered</span>
                            </button>
                          ) : (!isAllDelivered && (
                            <button
                              disabled
                              style={{
                                width: '100%',
                                backgroundColor: '#F1F5F9',
                                color: '#94A3B8',
                                border: '1px solid #CBD5E1',
                                padding: '0.6rem',
                                borderRadius: '10px',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                cursor: 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              <Clock size={16} />
                              <span>{readyCount} of {totalItemsCount} dishes ready</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {!isPaid && !isBillGenerated && (isAllDelivered || isServed) && (
                        <button
                          onClick={() => handleGenerateBill(order)}
                          style={{ width: '100%', backgroundColor: '#FFF3EB', color: '#E07A3C', border: '1px solid #FDBA74', padding: '0.65rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(224, 122, 60, 0.15)' }}
                        >
                          <Receipt size={16} />
                          <span>📄 Generate & Present Bill</span>
                        </button>
                      )}

                      {!isPaid && isBillGenerated && (
                        <button
                          onClick={() => setPaymentModalOrder(order)}
                          style={{ width: '100%', backgroundColor: '#0F2A1D', color: '#FFFFFF', border: 'none', padding: '0.65rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(15, 42, 29, 0.3)' }}
                        >
                          <CreditCard size={16} />
                          <span>💳 Confirm Customer Payment</span>
                        </button>
                      )}

                      {isPaid && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                          <div style={{ flex: 1, fontSize: '0.78rem', color: '#166534', fontWeight: 800, textAlign: 'center', padding: '0.45rem', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #86EFAC' }}>
                            ✓ Payment Completed
                          </div>
                          <button
                            type="button"
                            onClick={() => setViewOrderDetailsModal(order)}
                            title="View Complete Order & Payment Details"
                            style={{
                              backgroundColor: '#FFFFFF',
                              color: '#0F2A1D',
                              border: '1.5px solid #CBD5E1',
                              padding: '0.45rem 0.65rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Eye size={16} color="#0F2A1D" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: '1 / -1', backgroundColor: '#FFFFFF', padding: '3rem', borderRadius: '16px', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
                <ShoppingBag size={40} color="#CBD5E1" style={{ marginBottom: '0.75rem' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D' }}>No Orders Found</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Active order tickets will appear here automatically.</p>
              </div>
            )}
          </div>

      {/* ================= PRINTABLE BILL / RECEIPT PRESENTATION MODAL ================= */}
      {billingOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '480px', padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
                  📄 Restaurant Customer Bill
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700 }}>
                  Table {billingOrder.table} • Order #{getOrderId(billingOrder)}
                </span>
              </div>
              <button onClick={() => setBillingOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '14px', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Customer: <b style={{ color: '#0F2A1D' }}>{billingOrder.customer || 'Guest Diner'}</b></div>
              <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginTop: '0.2rem' }}>Status: <b style={{ color: '#D97706' }}>Bill Presented (Awaiting Payment)</b></div>
            </div>

            <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.9rem', fontWeight: 800, color: '#0F2A1D' }}>Itemized Order Receipt</h4>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0.85rem', marginBottom: '1.25rem', maxHeight: '180px', overflowY: 'auto' }}>
              {Array.isArray(billingOrder.items) ? (
                billingOrder.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.4rem 0', borderBottom: i === billingOrder.items.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                    <span style={{ fontWeight: 700, color: '#0F2A1D' }}>{item.name} (x{item.quantity || 1})</span>
                    <span style={{ fontWeight: 800, color: '#166534' }}>₹{(item.price || 150) * (item.quantity || 1)}</span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>{String(billingOrder.items)}</div>
              )}
            </div>

            <div style={{ backgroundColor: '#F0FDF4', padding: '1rem', borderRadius: '14px', border: '1.5px solid #86EFAC', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 900, color: '#166534', fontFamily: 'var(--font-heading)' }}>
                <span>Food Bill Total:</span>
                <span>₹{billingOrder.total || billingOrder.totalAmount || 0}</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 600, marginTop: '0.25rem' }}>
                *Includes all applicable GST Taxes. Exact food bill recorded as restaurant revenue.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setPaymentModalOrder(billingOrder);
                  setBillingOrder(null);
                }}
                style={{ flex: 1, backgroundColor: '#0F2A1D', color: '#FFFFFF', border: 'none', padding: '0.85rem', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15, 42, 29, 0.3)' }}
              >
                💳 Proceed to Payment (₹{billingOrder.total || billingOrder.totalAmount || 0})
              </button>
              <button
                onClick={() => setBillingOrder(null)}
                style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '0.85rem 1.25rem', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 6. OVERLAY PAYMENT CONFIRMATION POPUP MODAL ================= */}
      {paymentModalOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {/* Header Lockup */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
                  💳 Confirm Customer Payment
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700 }}>
                  Table {paymentModalOrder.table} • Order #{getOrderId(paymentModalOrder)}
                </span>
              </div>
              <button onClick={() => { setPaymentModalOrder(null); setTipInput(''); handleRemoveCoupon(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={22} />
              </button>
            </div>

            {/* Food Bill Revenue Banner */}
            {(() => {
              const origTotal = Number(paymentModalOrder.total || paymentModalOrder.totalAmount || 0);
              const discAmt = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
              const finalPayable = appliedCoupon ? Number(appliedCoupon.finalAmount || (origTotal - discAmt)) : origTotal;
              const tipAmt = Number(tipInput || 0);
              const totalToCollect = finalPayable + tipAmt;

              return (
                <>
                  <div style={{ textAlign: 'center', backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1.5px solid #E2E8F0', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      FOOD BILL AMOUNT (RESTAURANT REVENUE)
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#166534', fontFamily: 'var(--font-heading)', margin: '0.2rem 0' }}>
                      ₹{finalPayable}
                    </div>
                    {appliedCoupon && (
                      <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 800 }}>
                        (Discounted from Original ₹{origTotal} using coupon {appliedCoupon.code})
                      </div>
                    )}
                    <div style={{ fontSize: '0.85rem', color: '#0F2A1D', fontWeight: 700, marginTop: '0.2rem' }}>
                      Customer: <span style={{ color: '#E07A3C', fontWeight: 800 }}>{paymentModalOrder.customer || 'Guest Diner'}</span>
                    </div>
                  </div>

                  {/* Apply Coupon Section */}
                  <div style={{ marginBottom: '1.25rem', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '14px', border: '1.5px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Ticket size={16} color="#E07A3C" />
                      <span>Apply Coupon</span>
                    </div>

                    {!appliedCoupon ? (
                      <div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            placeholder="Enter coupon code (e.g. ROYAL20)"
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value.toUpperCase());
                              setCouponError('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleApplyCoupon(origTotal);
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: '0.55rem 0.75rem',
                              borderRadius: '10px',
                              border: couponError ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: '#0F2A1D',
                              textTransform: 'uppercase',
                              outline: 'none'
                            }}
                          />
                          <button
                            type="button"
                            disabled={validatingCoupon || !couponInput.trim()}
                            onClick={() => handleApplyCoupon(origTotal)}
                            style={{
                              padding: '0.55rem 1.1rem',
                              backgroundColor: validatingCoupon || !couponInput.trim() ? '#94A3B8' : '#0F2A1D',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '10px',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              cursor: validatingCoupon || !couponInput.trim() ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {validatingCoupon ? 'Validating...' : 'Apply'}
                          </button>
                        </div>

                        {couponError && (
                          <div style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 700, marginTop: '0.4rem' }}>
                            ⚠️ {couponError}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ backgroundColor: '#F0FDF4', padding: '0.75rem 0.9rem', borderRadius: '12px', border: '1.5px solid #86EFAC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            ✓ Coupon Applied
                          </div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F2A1D', marginTop: '0.1rem' }}>
                            {appliedCoupon.code} <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>({appliedCoupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.discountVal}% OFF` : `₹${appliedCoupon.discountVal} OFF`})</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#166534', marginTop: '0.1rem' }}>
                            Coupon Discount: -₹{discAmt}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          style={{
                            backgroundColor: '#FEE2E2',
                            color: '#991B1B',
                            border: '1px solid #FCA5A5',
                            borderRadius: '8px',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {/* Price Breakdown */}
                    {appliedCoupon && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #CBD5E1', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontWeight: 700 }}>
                          <span>Original Total:</span>
                          <span>₹{origTotal}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontWeight: 800 }}>
                          <span>Coupon Discount ({appliedCoupon.code}):</span>
                          <span>-₹{discAmt}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F2A1D', fontWeight: 900, fontSize: '0.9rem', paddingTop: '0.3rem', borderTop: '1px solid #E2E8F0' }}>
                          <span>Final Payable Amount:</span>
                          <span style={{ color: '#166534' }}>₹{finalPayable}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Customer Tip Section */}
                  <div style={{ marginBottom: '1.25rem', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '14px', border: '1.5px solid #E2E8F0' }}>
                    <label style={{ display: 'flex', fontSize: '0.85rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.4rem', alignItems: 'center', gap: '0.35rem' }}>
                      <Coins size={16} color="#B45309" />
                      <span>Optional Customer Tip</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0F2A1D' }}>₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Enter tip amount (e.g. 50, 100)"
                        value={tipInput}
                        onChange={(e) => setTipInput(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '0.55rem 0.75rem',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#0F2A1D',
                          outline: 'none',
                          backgroundColor: '#FFFFFF'
                        }}
                      />
                    </div>
                    {tipAmt > 0 && (
                      <div style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 800, marginTop: '0.4rem' }}>
                        🪙 Customer Tip Added: <b>+₹{tipAmt}</b> • Total to Collect from Diner: <b style={{ color: '#166534' }}>₹{totalToCollect}</b>
                        <br />
                        <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem' }}>✓ Restaurant Revenue remains ₹{finalPayable} ONLY (Tip excluded from revenue).</span>
                      </div>
                    )}
                  </div>

                  {/* Payment Method Selector */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#0F2A1D' }}>
                      Select Payment Method:
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                      {[
                        { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                        { id: 'Card', label: 'Card Swipe', icon: CreditCard },
                        { id: 'Cash', label: 'Cash Paid', icon: DollarSign }
                      ].map(pm => (
                        <button
                          key={pm.id}
                          onClick={() => setPaymentMethod(pm.id)}
                          style={{
                            backgroundColor: paymentMethod === pm.id ? '#0F2A1D' : '#F8FAFC',
                            color: paymentMethod === pm.id ? '#FFFFFF' : '#475569',
                            border: paymentMethod === pm.id ? '2px solid #0F2A1D' : '1px solid #CBD5E1',
                            borderRadius: '12px',
                            padding: '0.75rem 0.4rem',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <pm.icon size={20} color={paymentMethod === pm.id ? '#4ADE80' : '#E07A3C'} />
                          <span>{pm.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => {
                        handleConfirmPayment(paymentModalOrder);
                        setTipInput('');
                        handleRemoveCoupon();
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: '#166534',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '0.85rem',
                        borderRadius: '12px',
                        fontSize: '0.88rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(22, 101, 52, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <CheckCircle2 size={16} />
                      Confirm Payment (₹{totalToCollect})
                    </button>
                    <button
                      onClick={() => {
                        setPaymentModalOrder(null);
                        setTipInput('');
                        handleRemoveCoupon();
                      }}
                      style={{
                        backgroundColor: '#F1F5F9',
                        color: '#475569',
                        border: '1px solid #CBD5E1',
                        padding: '0.85rem 1.25rem',
                        borderRadius: '12px',
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              );
            })()}

          </div>
        </div>
      )}

      {/* ================= COMPLETE ORDER & PAYMENT DETAILS MODAL ================= */}
      {viewOrderDetailsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '520px', padding: '1.75rem', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
                  📋 Complete Order & Payment Details
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700 }}>
                  Table {viewOrderDetailsModal.table} • Order #{getOrderId(viewOrderDetailsModal)}
                </span>
              </div>
              <button onClick={() => setViewOrderDetailsModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={22} />
              </button>
            </div>

            {/* Customer & Order Metadata */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '14px', marginBottom: '1.25rem', border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Customer:</span>
                <div style={{ fontWeight: 800, color: '#0F2A1D' }}>{viewOrderDetailsModal.customer || 'Guest Diner'}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Order ID:</span>
                <div style={{ fontWeight: 800, color: '#0F2A1D' }}>#{getOrderId(viewOrderDetailsModal)}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Order Status:</span>
                <div style={{ fontWeight: 800, color: '#166534' }}>{viewOrderDetailsModal.status || 'Placed'}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Payment Status:</span>
                <div style={{ fontWeight: 800, color: viewOrderDetailsModal.paymentStatus === 'Paid' || viewOrderDetailsModal.payment === 'Paid' ? '#166534' : '#D97706' }}>
                  {viewOrderDetailsModal.paymentStatus || viewOrderDetailsModal.payment || 'Pending'}
                </div>
              </div>
            </div>

            {/* Itemized Dish List */}
            <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.9rem', fontWeight: 800, color: '#0F2A1D' }}>Itemized Ordered Dishes:</h4>
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0.75rem', marginBottom: '1.25rem', maxHeight: '200px', overflowY: 'auto' }}>
              {Array.isArray(viewOrderDetailsModal.items) ? (
                viewOrderDetailsModal.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: idx === viewOrderDetailsModal.items.length - 1 ? 'none' : '1px solid #F1F5F9', fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ fontWeight: 800, color: '#0F2A1D' }}>{typeof it === 'string' ? it : it.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '0.4rem' }}>(x{it.quantity || 1})</span>
                    </div>
                    <div style={{ fontWeight: 900, color: '#166534' }}>₹{(Number(it.price || 150) * Number(it.quantity || 1))}</div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.82rem', color: '#475569' }}>No dish details found.</div>
              )}
            </div>

            {/* Complete Financial & Payment Breakdown */}
            <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.9rem', fontWeight: 800, color: '#0F2A1D' }}>Payment Breakdown:</h4>
            <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '14px', border: '1.5px solid #E2E8F0', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.85rem' }}>
              {(() => {
                const orig = Number(viewOrderDetailsModal.originalTotal ?? viewOrderDetailsModal.originalAmount ?? viewOrderDetailsModal.total ?? 0);
                const disc = Number(viewOrderDetailsModal.discountAmount ?? 0);
                const finalNet = Number(viewOrderDetailsModal.finalAmount ?? viewOrderDetailsModal.total ?? 0);
                const code = viewOrderDetailsModal.couponCode || '';
                const tip = Number(viewOrderDetailsModal.tip ?? viewOrderDetailsModal.tipAmount ?? 0);

                const subtotal = orig > 0 ? orig : (disc > 0 ? finalNet + disc : finalNet);

                return (
                  <>
                    {/* 1. Subtotal */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontWeight: 700 }}>
                      <span>Food Bill Subtotal (Without Discount):</span>
                      <span>₹{subtotal}</span>
                    </div>

                    {/* 2. Coupon Discount Applied */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: disc > 0 ? '#DC2626' : '#64748B', fontWeight: 800 }}>
                      <span>Coupon Discount Applied:</span>
                      <span>{disc > 0 ? `-₹${disc} (${code || 'Coupon'})` : '₹0 (No Coupon)'}</span>
                    </div>

                    {/* 3. Net Food Bill Revenue */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontWeight: 900, fontSize: '0.95rem', paddingTop: '0.4rem', borderTop: '1px solid #E2E8F0' }}>
                      <span>Food Bill Revenue (Net Paid):</span>
                      <span>₹{finalNet}</span>
                    </div>

                    {/* 4. Customer Tip Collected */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: tip > 0 ? '#EA580C' : '#64748B', fontWeight: 800 }}>
                      <span>Customer Tip Collected:</span>
                      <span>{tip > 0 ? `+₹${tip}` : '₹0 (No Tip)'}</span>
                    </div>

                    {/* 5. Total Collected from Diner */}
                    {tip > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F2A1D', fontWeight: 900, fontSize: '0.95rem', paddingTop: '0.35rem', borderTop: '1px dashed #CBD5E1' }}>
                        <span>Total Collected from Diner (Revenue + Tip):</span>
                        <span style={{ color: '#166534' }}>₹{finalNet + tip}</span>
                      </div>
                    )}

                    {/* 6. Payment Method */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F2A1D', fontWeight: 800, paddingTop: '0.4rem', borderTop: '1px solid #E2E8F0' }}>
                      <span>Payment Method:</span>
                      <span>{viewOrderDetailsModal.paymentMethod || 'UPI / QR'}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => window.print()}
                style={{ flex: 1, backgroundColor: '#0F2A1D', color: '#FFFFFF', border: 'none', padding: '0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Printer size={16} />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setViewOrderDetailsModal(null)}
                style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '0.75rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
