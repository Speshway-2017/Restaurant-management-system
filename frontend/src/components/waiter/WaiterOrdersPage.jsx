import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, Clock, RefreshCw, AlertTriangle, Utensils, Search, Filter, Receipt, CreditCard, QrCode, DollarSign, X, Bell } from 'lucide-react';
import { api } from '../../services/api';
import { mergeOrderItems, normalizeOrderItem } from '../../utils/orderUtils';

export default function WaiterOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);
  const [billingOrder, setBillingOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [tipInput, setTipInput] = useState('');
  const [showPreparedOnly, setShowPreparedOnly] = useState(false);

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
          const isDelivered = Boolean(it.isDelivered || it.status === 'DELIVERED' || it.status === 'SERVED');
          const isReady = Boolean(!isDelivered && (it.isReady || it.status === 'READY'));
          const status = isDelivered ? 'SERVED' : (isReady ? 'READY' : 'PREPARING');

          return {
            ...it,
            status,
            isReady,
            isDelivered
          };
        });

        const totalCount = finalItems.length;
        const readyCount = finalItems.filter(i => (i.status === 'READY' || i.isReady) && !i.isDelivered && i.status !== 'SERVED' && i.status !== 'DELIVERED').length;
        const deliveredCount = finalItems.filter(i => i.status === 'SERVED' || i.status === 'DELIVERED' || i.isDelivered).length;

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

    // 1. Confirm Payment -> Order Status = Completed, Payment Status = Paid
    await handleUpdateStatus(orderId, 'Completed', {
      status: 'Completed',
      orderStatus: 'Completed',
      payment: 'Paid',
      paymentStatus: 'Paid',
      paymentMethod: paymentMethod,
      total: Number(order.total || 0) // Revenue Rule: Exact bill total ONLY
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
                const totalItemsCount = itemsList.length;

                const readyItems = itemsList.filter(i => (i.status === 'READY' || i.isReady) && i.status !== 'DELIVERED' && !i.isDelivered);
                const deliveredItems = itemsList.filter(i => i.status === 'DELIVERED' || i.isDelivered);

                const deliveredCount = deliveredItems.length;
                const readyCount = readyItems.length;

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
                            const isDeliveredItem = isPaid || item.status === 'DELIVERED' || item.isDelivered;
                            const isReadyItem = !isDeliveredItem && (item.status === 'READY' || item.isReady);

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

                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#166534', marginTop: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                          ₹{order.total || order.totalAmount || 0}
                        </div>
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
                              <span>0 of {totalItemsCount} dishes ready</span>
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
                        <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 800, textAlign: 'center', padding: '0.4rem', backgroundColor: '#F0FDF4', borderRadius: '8px' }}>
                          ✓ Paid • Table Moved to Cleaning
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

            {/* Manual Customer Tip Entry Section (Req: Tip excluded from revenue) */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '14px', border: '1.5px solid #E2E8F0', marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.4rem' }}>
                🪙 Optional Customer Tip (Manual Entry)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D' }}>₹</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter tip amount (e.g. 50, 100)"
                  value={tipInput}
                  onChange={e => setTipInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 600, marginTop: '0.4rem' }}>
                💡 Total to Collect from Diner: <b>₹{(Number(billingOrder.total || billingOrder.totalAmount || 0) + Number(tipInput || 0))}</b>
                <br />
                <span style={{ color: '#166534', fontWeight: 800 }}>✓ Restaurant Revenue: ₹{billingOrder.total || billingOrder.totalAmount || 0} ONLY</span> (Tip amount is excluded from revenue).
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
                💳 Proceed to Payment (₹{(Number(billingOrder.total || billingOrder.totalAmount || 0) + Number(tipInput || 0))})
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
              <button onClick={() => { setPaymentModalOrder(null); setTipInput(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={22} />
              </button>
            </div>

            {/* Food Bill Revenue Banner */}
            <div style={{ textAlign: 'center', backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1.5px solid #E2E8F0', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                FOOD BILL AMOUNT (RESTAURANT REVENUE)
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#166534', fontFamily: 'var(--font-heading)', margin: '0.2rem 0' }}>
                ₹{paymentModalOrder.total || paymentModalOrder.totalAmount || 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#0F2A1D', fontWeight: 700 }}>
                Customer: <span style={{ color: '#E07A3C', fontWeight: 800 }}>{paymentModalOrder.customer || 'Guest Diner'}</span>
              </div>
            </div>

            {/* Tip Summary Badge (No duplicate editable input box in payment confirmation modal) */}
            <div style={{ marginBottom: '1.25rem', backgroundColor: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              {Number(tipInput || 0) > 0 ? (
                <div style={{ fontSize: '0.82rem', color: '#B45309', fontWeight: 800, marginBottom: '0.3rem' }}>
                  🪙 Customer Tip Included: <b>+₹{tipInput}</b>
                </div>
              ) : null}
              <div style={{ fontSize: '0.88rem', color: '#0F2A1D', fontWeight: 800 }}>
                💡 Total to Collect from Diner: <b style={{ color: '#166534', fontSize: '1.05rem' }}>₹{(Number(paymentModalOrder.total || paymentModalOrder.totalAmount || 0) + Number(tipInput || 0))}</b>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600, marginTop: '0.2rem' }}>
                ✓ Restaurant Revenue: ₹{paymentModalOrder.total || paymentModalOrder.totalAmount || 0} ONLY (Tip excluded from revenue).
              </div>
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
                <span>Confirm Payment (₹{(Number(paymentModalOrder.total || paymentModalOrder.totalAmount || 0) + Number(tipInput || 0))})</span>
              </button>

              <button
                onClick={() => {
                  setPaymentModalOrder(null);
                  setTipInput('');
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
          </div>
        </div>
      )}

    </div>
  );
}
