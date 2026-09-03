import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, Clock, RefreshCw, AlertTriangle, Utensils, Search, Filter, Receipt, CreditCard, QrCode, DollarSign, X, Bell, Ticket, Coins, Eye, Printer } from 'lucide-react';
import { api } from '../../services/api';
import { mergeOrderItems, normalizeOrderItem, clearTableSessionStorage } from '../../utils/orderUtils';
import { useRestaurantBranding } from '../../context/RestaurantBrandingContext';

export default function WaiterOrdersPage() {
  const brandingContext = useRestaurantBranding ? useRestaurantBranding() : null;
  const branding = brandingContext?.branding;
  const [dynamicGstRate, setDynamicGstRate] = useState(0.05);

  useEffect(() => {
    const loadGstRate = async () => {
      try {
        let rawGst = branding?.gstRate;
        const rawSaved = localStorage.getItem('flavora_restaurant_settings');
        if (rawSaved) {
          const parsed = JSON.parse(rawSaved);
          if (parsed.gstRate !== undefined) rawGst = parsed.gstRate;
        }
        if (!rawGst) {
          const settings = await api.getSettings();
          if (settings && settings.gstRate !== undefined) {
            rawGst = settings.gstRate;
          }
        }
        if (rawGst !== undefined && rawGst !== null) {
          const str = String(rawGst).replace('%', '').trim();
          const num = parseFloat(str);
          if (!isNaN(num) && num >= 0) {
            const rateVal = num > 1 ? num / 100 : num;
            setDynamicGstRate(rateVal);
          }
        }
      } catch (e) {}
    };

    loadGstRate();
    const interval = setInterval(loadGstRate, 3000);
    return () => clearInterval(interval);
  }, [branding]);

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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Pagination state (10 orders per page, starting on page 1 showing latest 10 orders)
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, showPreparedOnly]);

  // Toast notification state
  const [toastMsg, setToastMsg] = useState('');
  const showNotification = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg('');
    }, 4500);
  };

  // Cancellation state
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Customer changed mind');
  const [selectedCancelItems, setSelectedCancelItems] = useState([]);

  const handleExecuteCancellation = async () => {
    if (!cancelModalOrder) return;
    try {
      const targetId = cancelModalOrder._id || cancelModalOrder.id || cancelModalOrder.orderId;
      const orderNum = getOrderId(cancelModalOrder);
      const count = selectedCancelItems.length;

      await api.requestOrderCancellation(targetId, cancelReason, selectedCancelItems);
      setCancelModalOrder(null);
      setCancelReason('Customer changed mind');
      setSelectedCancelItems([]);
      fetchOrders();
      window.dispatchEvent(new Event('flavora_orders_updated'));
      try {
        localStorage.setItem('flavora_orders_sync', Date.now().toString());
      } catch (e) { }

      showNotification(`✓ Successfully submitted cancellation request for ${count > 0 ? `${count} dish(es) in` : ''} Order #${orderNum}!`);
    } catch (err) {
      alert(err.message || 'Failed to submit cancellation request');
    }
  };

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
          if (stUpper === 'CANCELLED' || stUpper === 'CANCEL') {
            return {
              ...it,
              status: 'CANCELLED',
              isReady: false,
              isDelivered: false
            };
          }

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

        const activeFinalItems = finalItems.filter(i => i.status !== 'CANCELLED');
        const totalCount = activeFinalItems.reduce((sum, i) => sum + Number(i.quantity || 1), 0);
        const readyCount = activeFinalItems.reduce((sum, i) => ((i.status === 'READY' || i.isReady) && !i.isDelivered && i.status !== 'SERVED' && i.status !== 'DELIVERED') ? sum + Number(i.quantity || 1) : sum, 0);
        const deliveredCount = activeFinalItems.reduce((sum, i) => (i.status === 'SERVED' || i.status === 'DELIVERED' || i.isDelivered) ? sum + Number(i.quantity || 1) : sum, 0);

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
    if (!order || isProcessingPayment) return;
    setIsProcessingPayment(true);

    try {
      const orderId = order._id || order.id || order.orderId;
      const tableNum = order.table || order.tableNumber || 'T-01';
      const foodSubtotal = Number(order.subtotal ?? order.originalTotal ?? order.originalAmount ?? order.total ?? 0);
      const gstAmount = order.gstAmount !== undefined && order.gstAmount !== null && Number(order.gstAmount) > 0
        ? Number(order.gstAmount)
        : Math.round(foodSubtotal * 0.05);
      const totalBeforeDiscount = foodSubtotal + gstAmount;

      const discountAmount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : Number(order.discountAmount || 0);
      const amountAfterDiscount = Math.max(0, totalBeforeDiscount - discountAmount);
      const couponCode = appliedCoupon ? appliedCoupon.code : (order.couponCode || '');
      const tipVal = Number(tipInput !== '' ? tipInput : (order.tip ?? order.tipAmount ?? 0));
      const customerPaidAmount = amountAfterDiscount + tipVal;
      const txnId = `TXN-${Date.now().toString().slice(-8)}`;
      const paidTimestamp = new Date().toISOString();

      // 1. Confirm Payment -> Order Status = Completed, Payment Status = Paid
      await handleUpdateStatus(orderId, 'Completed', {
        status: 'Completed',
        orderStatus: 'Completed',
        payment: 'Paid',
        paymentStatus: 'Paid',
        paymentMethod: paymentMethod,
        originalTotal: foodSubtotal,
        originalAmount: foodSubtotal,
        subtotal: foodSubtotal,
        gstAmount: gstAmount,
        totalBeforeDiscount: totalBeforeDiscount,
        couponCode: couponCode,
        discountAmount: discountAmount,
        amountAfterDiscount: amountAfterDiscount,
        finalAmount: amountAfterDiscount,
        total: amountAfterDiscount,
        totalAmount: amountAfterDiscount,
        tip: tipVal,
        tipAmount: tipVal,
        customerPaidAmount: customerPaidAmount,
        transactionId: txnId,
        paidAt: paidTimestamp
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
      } catch (e) { }

      try {
        await api.updateTableStatus(tableNum, 'Cleaning');
      } catch (e) { }

      showNotification(`✓ Payment of ₹${customerPaidAmount} confirmed for Order #${getOrderId(order)}! Table ${tableNum} is now CLEANING.`);
      setPaymentModalOrder(null);
      setTipInput('');
      handleRemoveCoupon();
    } catch (err) {
      alert(err.message || 'Failed to confirm payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getIsPaid = (o) => Boolean(
    o.status === 'Completed' || o.status === 'Paid' || 
    o.payment === 'Paid' || o.payment === 'Completed'
  );

  const sortedOrders = [...orders].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return timeB - timeA;
  });

  const filteredOrders = sortedOrders.filter(o => {
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

  const totalOrders = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalOrders / ordersPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const indexOfLastOrder = validCurrentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const paginatedOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

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

      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#0F2A1D',
          color: '#FFFFFF',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          zIndex: 999999,
          fontSize: '0.85rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          borderLeft: '4px solid #E07A3C'
        }}>
          <CheckCircle2 size={18} color="#A7F3D0" />
          <span>{toastMsg}</span>
        </div>
      )}

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
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map(order => {
                const rawItems = Array.isArray(order.items) ? order.items : [];
                const itemsList = rawItems.filter(i => {
                  if (!i) return false;
                  if (typeof i === 'string') return true;
                  const s = String(i.status || '').toUpperCase().trim();
                  return s !== 'CANCELLED';
                });
                
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
                  const isCookingOrder = order.status === 'Preparing' || order.status === 'Cooking' || order.status === 'In-Progress';
                  orderStatusBadgeText = isCookingOrder ? 'Preparing' : (order.status || 'Placed');
                  badgeBg = isCookingOrder ? '#FFF3EB' : '#EEF2FF';
                  badgeColor = isCookingOrder ? '#E07A3C' : '#283593';
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
                            const isCookingItem = !isDeliveredItem && !isReadyItem && (item.status === 'PREPARING' || item.status === 'COOKING' || order.status === 'Preparing' || order.status === 'Cooking');

                            return (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  backgroundColor: isDeliveredItem ? '#F1F5F9' : (isReadyItem ? '#DCFCE7' : (isCookingItem ? '#FFF3EB' : '#FFFFFF')),
                                  border: isDeliveredItem ? '1px solid #CBD5E1' : (isReadyItem ? '1.5px solid #86EFAC' : (isCookingItem ? '1px solid #FDBA74' : '1px solid #E2E8F0')),
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem'
                                }}
                              >
                                <span style={{ fontWeight: 800, color: isDeliveredItem ? '#64748B' : (isReadyItem ? '#166534' : (isCookingItem ? '#C2410C' : '#0F2A1D')), textDecoration: isDeliveredItem ? 'line-through' : 'none' }}>
                                  {isDeliveredItem ? '✓' : (isReadyItem ? '🔔 READY:' : (isCookingItem ? '⏳' : '📝'))} {item.name || item.dishId} (x{item.quantity || 1})
                                </span>

                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  color: isDeliveredItem ? '#64748B' : (isReadyItem ? '#166534' : (isCookingItem ? '#C2410C' : '#283593')),
                                  backgroundColor: isDeliveredItem ? '#E2E8F0' : (isReadyItem ? '#BBF7D0' : (isCookingItem ? '#FFEDD5' : '#EEF2FF')),
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '6px'
                                }}>
                                  {isDeliveredItem ? 'Delivered' : (isReadyItem ? 'READY TO SERVE' : (isCookingItem ? 'Preparing' : 'Placed'))}
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
                        <div
                          style={{
                            width: '100%',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            border: '1px solid #FCD34D',
                            padding: '0.65rem',
                            borderRadius: '10px',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'center',
                            gap: '0.4rem',
                            textAlign: 'center'
                          }}
                        >
                          <Clock size={16} color="#D97706" />
                          <span>⌛ Bill Generated • Awaiting Customer Payment</span>
                        </div>
                      )}

                      {!isPaid && (
                        <div style={{ marginTop: '0.4rem' }}>
                          {(() => {
                            const hasCancellableItems = Array.isArray(order.items) && order.items.some(it => {
                              const isServed = Boolean(it.isDelivered || it.status === 'DELIVERED' || it.status === 'SERVED');
                              const isReady = Boolean(it.isReady || it.status === 'READY' || it.status === 'READY_FOR_PASS');
                              const isCancelled = it.status === 'CANCELLED';
                              return !isServed && !isReady && !isCancelled;
                            });

                            if (!hasCancellableItems) return null;

                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  setCancelModalOrder(order);
                                  setSelectedCancelItems([]);
                                }}
                                style={{
                                  width: '100%',
                                  backgroundColor: '#FEF2F2',
                                  color: '#991B1B',
                                  border: '1px solid #FCA5A5',
                                  padding: '0.5rem',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                ⚠️ Request Cancellation
                              </button>
                            );
                          })()}
                        </div>
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

          {/* ================= PAGINATION CONTROL BAR (10 Orders / Page) ================= */}
          {totalOrders > 0 && (
            <div style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginTop: '1.5rem',
              backgroundColor: '#FFFFFF',
              padding: '0.85rem 1.25rem',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 700 }}>
                Showing <strong>{indexOfFirstOrder + 1}</strong> to <strong>{Math.min(indexOfLastOrder, totalOrders)}</strong> of <strong>{totalOrders}</strong> Orders
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  disabled={validCurrentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{
                    backgroundColor: validCurrentPage === 1 ? '#F1F5F9' : '#0F2A1D',
                    color: validCurrentPage === 1 ? '#94A3B8' : '#FFFFFF',
                    border: 'none',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ← Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    style={{
                      backgroundColor: validCurrentPage === p ? '#E07A3C' : '#F8FAFC',
                      color: validCurrentPage === p ? '#FFFFFF' : '#475569',
                      border: '1px solid',
                      borderColor: validCurrentPage === p ? '#E07A3C' : '#CBD5E1',
                      padding: '0.4rem 0.7rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {p}
                  </button>
                ))}

                <button
                  disabled={validCurrentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  style={{
                    backgroundColor: validCurrentPage === totalPages ? '#F1F5F9' : '#0F2A1D',
                    color: validCurrentPage === totalPages ? '#94A3B8' : '#FFFFFF',
                    border: 'none',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: validCurrentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

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
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
                  PAYMENT / BILLING
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
                  Table {paymentModalOrder.table} • Order #{getOrderId(paymentModalOrder)}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 700, marginTop: '0.15rem' }}>
                  Customer: <span style={{ color: '#0F2A1D', fontWeight: 800 }}>{paymentModalOrder.customer || 'Guest Diner'}</span>
                </div>
              </div>
              <button onClick={() => { setPaymentModalOrder(null); setTipInput(''); handleRemoveCoupon(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={22} />
              </button>
            </div>

            {(() => {
              const rawSubtotal = Number(paymentModalOrder.subtotal ?? paymentModalOrder.originalTotal ?? paymentModalOrder.originalAmount ?? paymentModalOrder.total ?? 0);
              const gstAmount = paymentModalOrder.gstAmount !== undefined && paymentModalOrder.gstAmount !== null && Number(paymentModalOrder.gstAmount) > 0
                ? Number(paymentModalOrder.gstAmount)
                : Math.round(rawSubtotal * dynamicGstRate);
              const totalBeforeDiscount = rawSubtotal + gstAmount;
              const gstPctDisplay = Math.round(dynamicGstRate * 100);

              const discAmt = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : Number(paymentModalOrder.discountAmount || 0);
              const amountAfterDiscount = Math.max(0, totalBeforeDiscount - discAmt);
              
              const customerTip = Number(tipInput !== '' ? tipInput : (paymentModalOrder.tip ?? paymentModalOrder.tipAmount ?? 0));
              const customerPaid = amountAfterDiscount + customerTip;

              const isAlreadyPaid = paymentModalOrder.status === 'Completed' || paymentModalOrder.status === 'Paid' || paymentModalOrder.payment === 'Paid' || paymentModalOrder.paymentStatus === 'Paid';

              return (
                <>
                  {/* 1. BILL SUMMARY */}
                  <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '14px', border: '1.5px solid #E2E8F0', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      BILL SUMMARY
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#475569', marginBottom: '0.3rem' }}>
                      <span>Food / Subtotal:</span>
                      <span style={{ fontWeight: 700, color: '#0F2A1D' }}>₹{rawSubtotal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#475569', marginBottom: '0.3rem' }}>
                      <span>GST ({gstPctDisplay}%):</span>
                      <span style={{ fontWeight: 700, color: '#0F2A1D' }}>+₹{gstAmount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 800, color: '#0F2A1D', borderTop: '1px dashed #CBD5E1', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                      <span>Total Before Discount:</span>
                      <span>₹{totalBeforeDiscount}</span>
                    </div>
                  </div>

                  {/* 2. COUPON / DISCOUNT */}
                  <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '14px', border: '1.5px solid #E2E8F0', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Ticket size={15} color="#E07A3C" />
                      <span>COUPON / DISCOUNT</span>
                    </div>

                    {!appliedCoupon && !paymentModalOrder.couponCode ? (
                      <div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            placeholder="ENTER COUPON CODE"
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value.toUpperCase());
                              setCouponError('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleApplyCoupon(rawSubtotal);
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
                            onClick={() => handleApplyCoupon(rawSubtotal)}
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
                            {validatingCoupon ? 'Validating...' : 'APPLY'}
                          </button>
                        </div>

                        {couponError && (
                          <div style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 700, marginTop: '0.4rem' }}>
                            ⚠️ {couponError}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ backgroundColor: '#FEF2F2', padding: '0.75rem 0.9rem', borderRadius: '12px', border: '1.5px solid #FCA5A5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#991B1B' }}>
                            Coupon: <strong>{appliedCoupon ? appliedCoupon.code : paymentModalOrder.couponCode}</strong>
                          </div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#DC2626', marginTop: '0.1rem' }}>
                            Discount: -₹{discAmt}
                          </div>
                        </div>
                        {!isAlreadyPaid && (
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            style={{
                              backgroundColor: '#FFFFFF',
                              color: '#991B1B',
                              border: '1px solid #FCA5A5',
                              borderRadius: '8px',
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 3. FINAL FOOD AMOUNT & TIP SUMMARY */}
                  <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '14px', border: '1.5px solid #E2E8F0', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.4rem' }}>
                      <span>Amount After Discount:</span>
                      <span style={{ fontWeight: 900, color: '#0F2A1D' }}>₹{amountAfterDiscount}</span>
                    </div>

                    {/* Manual Customer Tip Input */}
                    {!isAlreadyPaid && (
                      <div style={{ marginTop: '0.6rem', marginBottom: '0.6rem', padding: '0.75rem', backgroundColor: '#FFF7ED', borderRadius: '12px', border: '1.5px solid #FFEDD5' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 800, color: '#C2410C', marginBottom: '0.45rem' }}>
                          <Coins size={15} color="#EA580C" />
                          <span>Add Customer Tip (Manual Entry):</span>
                        </label>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: '#EA580C', fontSize: '0.88rem' }}>₹</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="Enter tip amount"
                              value={tipInput}
                              onChange={(e) => setTipInput(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.5rem 0.5rem 0.5rem 1.8rem',
                                borderRadius: '8px',
                                border: '1.5px solid #FDBA74',
                                fontSize: '0.88rem',
                                fontWeight: 800,
                                color: '#C2410C',
                                outline: 'none',
                                backgroundColor: '#FFFFFF',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                          {['20', '50', '100'].map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setTipInput(amt)}
                              style={{
                                padding: '0.5rem 0.6rem',
                                backgroundColor: tipInput === amt ? '#EA580C' : '#FFFFFF',
                                color: tipInput === amt ? '#FFFFFF' : '#C2410C',
                                border: '1.5px solid #FDBA74',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              +₹{amt}
                            </button>
                          ))}
                          {tipInput !== '' && (
                            <button
                              type="button"
                              onClick={() => setTipInput('')}
                              style={{
                                padding: '0.5rem 0.6rem',
                                backgroundColor: '#FEE2E2',
                                color: '#991B1B',
                                border: '1px solid #FCA5A5',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 800, color: '#EA580C', marginBottom: '0.4rem' }}>
                      <span>Customer Tip:</span>
                      <span style={{ fontWeight: 900 }}>+₹{customerTip}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 900, color: '#166534', borderTop: '1.5px solid #CBD5E1', paddingTop: '0.5rem', marginTop: '0.4rem' }}>
                      <span>Customer Paid:</span>
                      <span>₹{customerPaid}</span>
                    </div>
                  </div>

                  {/* 4. PAYMENT METHOD SELECTOR */}
                  {!isAlreadyPaid ? (
                    <>
                      <div style={{ marginBottom: '1.25rem' }}>
                        <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#0F2A1D' }}>
                          Select Payment Method:
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                          {[
                            { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                            { id: 'Card', label: 'CARD', icon: CreditCard },
                            { id: 'Cash', label: 'CASH', icon: DollarSign }
                          ].map(pm => (
                            <button
                              key={pm.id}
                              onClick={() => setPaymentMethod(pm.id)}
                              style={{
                                backgroundColor: paymentMethod === pm.id ? '#0F2A1D' : '#FFFFFF',
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
                                boxShadow: paymentMethod === pm.id ? '0 4px 12px rgba(15, 42, 29, 0.2)' : 'none',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <pm.icon size={20} color={paymentMethod === pm.id ? '#4ADE80' : '#E07A3C'} />
                              <span>{pm.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Confirm Action Button */}
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          disabled={isProcessingPayment}
                          onClick={() => handleConfirmPayment(paymentModalOrder)}
                          style={{
                            flex: 1,
                            backgroundColor: isProcessingPayment ? '#94A3B8' : '#166534',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '0.85rem',
                            borderRadius: '12px',
                            fontSize: '0.9rem',
                            fontWeight: 900,
                            cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 12px rgba(22, 101, 52, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem'
                          }}
                        >
                          <CheckCircle2 size={18} />
                          {isProcessingPayment ? 'Processing Payment...' : `CONFIRM PAYMENT (₹${customerPaid})`}
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
                  ) : (
                    <div style={{ backgroundColor: '#F0FDF4', padding: '1rem', borderRadius: '14px', border: '1.5px solid #86EFAC', textAlign: 'center', color: '#166534', fontWeight: 900 }}>
                      ✓ PAYMENT SUCCESSFUL • PAID
                    </div>
                  )}
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
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
                  PAYMENT DETAILS
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
                  Table {viewOrderDetailsModal.table} • Order #{getOrderId(viewOrderDetailsModal)}
                </h3>
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
              {viewOrderDetailsModal.transactionId && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Transaction ID:</span>
                  <div style={{ fontWeight: 800, color: '#0F2A1D' }}>{viewOrderDetailsModal.transactionId}</div>
                </div>
              )}
            </div>

            {/* Itemized Dish List */}
            <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.9rem', fontWeight: 800, color: '#0F2A1D' }}>Itemized Ordered Dishes:</h4>
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0.75rem', marginBottom: '1.25rem', maxHeight: '180px', overflowY: 'auto' }}>
              {Array.isArray(viewOrderDetailsModal.items) ? (
                viewOrderDetailsModal.items.filter(it => it && it.status !== 'CANCELLED').map((it, idx) => (
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

            {/* Complete Financial Breakdown */}
            <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.9rem', fontWeight: 800, color: '#0F2A1D' }}>Payment Financial Breakdown:</h4>
            <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '14px', border: '1.5px solid #E2E8F0', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.85rem' }}>
              {(() => {
                const subtotal = Number(viewOrderDetailsModal.subtotal ?? viewOrderDetailsModal.originalTotal ?? viewOrderDetailsModal.originalAmount ?? viewOrderDetailsModal.total ?? 0);
                const gst = viewOrderDetailsModal.gstAmount !== undefined && viewOrderDetailsModal.gstAmount !== null && Number(viewOrderDetailsModal.gstAmount) > 0
                  ? Number(viewOrderDetailsModal.gstAmount)
                  : Math.round(subtotal * 0.05);
                const totalBeforeDisc = subtotal + gst;
                const disc = Number(viewOrderDetailsModal.discountAmount ?? 0);
                const amountAfterDisc = Number(viewOrderDetailsModal.amountAfterDiscount ?? viewOrderDetailsModal.finalAmount ?? (totalBeforeDisc - disc));
                const code = viewOrderDetailsModal.couponCode || '';
                const tip = Number(viewOrderDetailsModal.tip ?? viewOrderDetailsModal.tipAmount ?? 0);
                const customerPaid = Number(viewOrderDetailsModal.customerPaidAmount ?? (amountAfterDisc + tip));

                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontWeight: 700 }}>
                      <span>Original Total:</span>
                      <span>₹{subtotal}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontWeight: 700 }}>
                      <span>GST (5%):</span>
                      <span>+₹{gst}</span>
                    </div>

                    {code && disc > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#991B1B', fontWeight: 800 }}>
                        <span>Coupon ({code}):</span>
                        <span style={{ color: '#DC2626' }}>-₹{disc}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#991B1B', fontWeight: 800 }}>
                      <span>Coupon Discount:</span>
                      <span style={{ color: '#DC2626' }}>{disc > 0 ? `-₹${disc}` : '-₹0'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F2A1D', fontWeight: 900, paddingTop: '0.35rem', borderTop: '1px solid #E2E8F0' }}>
                      <span>Amount After Discount:</span>
                      <span>₹{amountAfterDisc}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#EA580C', fontWeight: 800 }}>
                      <span>Customer Tip:</span>
                      <span>+₹{tip}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontWeight: 900, fontSize: '1.05rem', paddingTop: '0.45rem', borderTop: '1.5px solid #CBD5E1' }}>
                      <span>Customer Paid:</span>
                      <span>₹{customerPaid}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F2A1D', fontWeight: 800, paddingTop: '0.4rem', borderTop: '1px dashed #CBD5E1' }}>
                      <span>Payment Method:</span>
                      <span>{viewOrderDetailsModal.paymentMethod || 'UPI / QR'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontWeight: 800 }}>
                      <span>Payment Status:</span>
                      <span>{viewOrderDetailsModal.paymentStatus || viewOrderDetailsModal.payment || 'PAID'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.78rem', paddingTop: '0.35rem', borderTop: '1px solid #E2E8F0' }}>
                      <span>Restaurant Revenue:</span>
                      <span style={{ fontWeight: 800, color: '#166534' }}>₹{amountAfterDisc}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.78rem' }}>
                      <span>Tip (Excluded from Revenue):</span>
                      <span style={{ fontWeight: 800, color: '#EA580C' }}>₹{tip}</span>
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

      {/* ================= ORDER CANCELLATION OVERLAY MODAL ================= */}
      {cancelModalOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#991B1B' }}>
                ⚠️ Request Order / Item Cancellation
              </h3>
              <button onClick={() => { setCancelModalOrder(null); setSelectedCancelItems([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.85rem' }}>
              Table <strong>{cancelModalOrder.table}</strong> (Order #{getOrderId(cancelModalOrder)}). Select pending dishes to cancel:
            </p>

            {/* Dish Selection List */}
            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', display: 'block', marginBottom: '0.4rem' }}>
              Select Dishes to Cancel:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem', border: '1px solid #CBD5E1', padding: '0.65rem', borderRadius: '10px', backgroundColor: '#F8FAFC' }}>
              {Array.isArray(cancelModalOrder.items) && cancelModalOrder.items.length > 0 ? (
                cancelModalOrder.items.map((it, idx) => {
                  const itName = typeof it === 'string' ? it : (it.name || it.dishId || '');
                  const targetKey = String(it._id || it.id || itName || `item-${idx}`);
                  const isServed = Boolean(it.isDelivered || it.status === 'DELIVERED' || it.status === 'SERVED');
                  const isReady = Boolean(it.isReady || it.status === 'READY' || it.status === 'READY_FOR_PASS');
                  const isCancelled = it.status === 'CANCELLED';
                  const isNonCancellable = isServed || isReady || isCancelled;

                  const isChecked = selectedCancelItems.includes(targetKey);

                  return (
                    <label
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '0.45rem 0.6rem',
                        backgroundColor: isNonCancellable ? '#F1F5F9' : (isChecked ? '#FEF2F2' : '#FFFFFF'),
                        border: isNonCancellable ? '1px solid #E2E8F0' : (isChecked ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0'),
                        borderRadius: '8px',
                        cursor: isNonCancellable ? 'not-allowed' : 'pointer',
                        opacity: isNonCancellable ? 0.7 : 1
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          disabled={isNonCancellable}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCancelItems(prev => prev.includes(targetKey) ? prev : [...prev, targetKey]);
                            } else {
                              setSelectedCancelItems(prev => prev.filter(i => i !== targetKey));
                            }
                          }}
                        />
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: isNonCancellable ? '#64748B' : '#0F2A1D', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                          <strong style={{ color: isNonCancellable ? '#64748B' : '#E07A3C', marginRight: '0.3rem' }}>{it.quantity || it.qty || 1}x</strong>
                          {itName}
                        </span>
                      </div>

                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '5px',
                        backgroundColor: isServed ? '#E2E8F0' : (isReady ? '#DCFCE7' : (isCancelled ? '#FEE2E2' : '#FFEDD5')),
                        color: isServed ? '#64748B' : (isReady ? '#166534' : (isCancelled ? '#991B1B' : '#C2410C'))
                      }}>
                        {isServed ? '🚫 Served (Cannot cancel)' : (isReady ? '🔔 Ready to serve (Cannot cancel)' : (isCancelled ? 'Cancelled' : '⏳ Pending (Can cancel)'))}
                      </span>
                    </label>
                  );
                })
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>No dishes found in order.</div>
              )}
            </div>

            {/* Cancellation Reason Code */}
            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', display: 'block', marginBottom: '0.4rem' }}>
              Cancellation Reason Code:
            </label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '1.25rem', outline: 'none' }}
            >
              <option value="Customer changed mind">Customer changed mind</option>
              <option value="Item unavailable">Item unavailable / Out of stock</option>
              <option value="Wrong item ordered">Wrong item ordered</option>
              <option value="Duplicate item">Duplicate item</option>
              <option value="Kitchen issue">Kitchen delay / Kitchen issue</option>
              <option value="Other">Other reason</option>
            </select>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={selectedCancelItems.length === 0}
                onClick={handleExecuteCancellation}
                style={{
                  flex: 1,
                  backgroundColor: selectedCancelItems.length === 0 ? '#94A3B8' : '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  cursor: selectedCancelItems.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Submit Cancellation Request ({selectedCancelItems.length} Dish{selectedCancelItems.length > 1 ? 'es' : ''})
              </button>
              <button
                onClick={() => { setCancelModalOrder(null); setSelectedCancelItems([]); }}
                style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
