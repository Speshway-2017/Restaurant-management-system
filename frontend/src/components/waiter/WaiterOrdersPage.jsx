import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, Clock, RefreshCw, AlertTriangle, Utensils, Search, Filter, Receipt, CreditCard, QrCode, DollarSign, X } from 'lucide-react';
import { api } from '../../services/api';

export default function WaiterOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);
  const [billingOrder, setBillingOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [tipInput, setTipInput] = useState('');

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
      let data = await api.getOrders();

      let localOrders = [];
      try {
        const raw = localStorage.getItem('flavora_manager_orders');
        if (raw) localOrders = JSON.parse(raw);
      } catch (e) {}

      if (Array.isArray(data) && data.length > 0) {
        const merged = data.map(dbOrd => {
          const cleanDbId = String(dbOrd.orderId || dbOrd.id || dbOrd._id || '').replace(/^#/i, '');
          const matchedLocal = localOrders.find(l => {
            const cleanLId = String(l.orderId || l.id || l._id || '').replace(/^#/i, '');
            return cleanLId === cleanDbId;
          });

          if (matchedLocal && Array.isArray(matchedLocal.items) && Array.isArray(dbOrd.items)) {
            const mergedItems = dbOrd.items.map((it, idx) => {
              const localIt = matchedLocal.items[idx] || matchedLocal.items.find(li => li.name === it.name);
              if (localIt) {
                const finalStatus = it.status && it.status !== 'PREPARING' 
                  ? it.status 
                  : (localIt.status || (localIt.isDelivered ? 'DELIVERED' : (localIt.isReady ? 'READY' : 'PREPARING')));

                const isReadyFinal = Boolean(it.isReady || localIt.isReady || finalStatus === 'READY' || finalStatus === 'DELIVERED');
                const isDeliveredFinal = Boolean(it.isDelivered || localIt.isDelivered || finalStatus === 'DELIVERED');

                return {
                  ...it,
                  status: finalStatus,
                  isReady: isReadyFinal,
                  isDelivered: isDeliveredFinal
                };
              }
              return {
                ...it,
                status: it.status || (it.isDelivered ? 'DELIVERED' : (it.isReady ? 'READY' : 'PREPARING')),
                isReady: Boolean(it.isReady || it.status === 'READY' || it.status === 'DELIVERED'),
                isDelivered: Boolean(it.isDelivered || it.status === 'DELIVERED')
              };
            });

            return {
              ...dbOrd,
              items: mergedItems
            };
          }

          const itemsWithNormalizedStatus = (dbOrd.items || []).map(it => ({
            ...it,
            status: it.status || (it.isDelivered ? 'DELIVERED' : (it.isReady ? 'READY' : 'PREPARING')),
            isReady: Boolean(it.isReady || it.status === 'READY' || it.status === 'DELIVERED'),
            isDelivered: Boolean(it.isDelivered || it.status === 'DELIVERED')
          }));

          return {
            ...dbOrd,
            items: itemsWithNormalizedStatus
          };
        });
        setOrders(merged);
      } else if (localOrders.length > 0) {
        setOrders(localOrders);
      }
    } catch (e) {
      console.error(e);
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
    } catch (e) {}
  };

  const handleUpdateStatus = async (orderId, newStatus, extra = {}) => {
    try {
      await api.updateOrderStatus(orderId, newStatus, extra);
      fetchOrders();
      window.dispatchEvent(new Event('flavora_orders_updated'));
      window.dispatchEvent(new Event('flavora_tables_updated'));
    } catch (e) {
      alert('Failed to update status');
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

    // 1. Confirm Payment -> Order = Paid
    await handleUpdateStatus(orderId, 'Paid', {
      status: 'Paid',
      payment: 'Completed',
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
    } catch (e) {}

    setPaymentModalOrder(null);
    setBillingOrder(null);
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'ALL') return true;
    if (filter === 'READY') return o.status === 'Ready';
    if (filter === 'ACTIVE') return o.status === 'Placed' || o.status === 'Preparing';
    if (filter === 'SERVED') return o.status === 'Served' || o.status === 'Bill Generated';
    if (filter === 'PAID') return o.status === 'Completed' || o.status === 'Paid' || o.payment === 'Completed';
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
      
      {/* ================= DEDICATED SEPARATE PAYMENT SETTLEMENT PAGE ================= */}
      {paymentModalOrder ? (
        <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
          {/* Back Navigation Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
            <button
              onClick={() => {
                setPaymentModalOrder(null);
                setTipInput('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#F1F5F9',
                color: '#0F2A1D',
                border: '1px solid #CBD5E1',
                padding: '0.65rem 1.25rem',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              ← Back to Orders
            </button>

            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 800 }}>
              Payment Terminal • Table {paymentModalOrder.table}
            </span>
          </div>

          {/* Separate Payment Main Card */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '2.25rem', boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}>
            
            {/* Header Lockup */}
            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
                  💳 Confirm Customer Payment & Settlement
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: '#64748B', fontWeight: 600 }}>
                  Table <strong>{paymentModalOrder.table}</strong> • Order <strong>#{getOrderId(paymentModalOrder)}</strong>
                </p>
              </div>
              <span style={{ backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', padding: '0.4rem 0.95rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 900 }}>
                ✓ Bill Ready for Settlement
              </span>
            </div>

            {/* Food Bill Revenue Banner */}
            <div style={{ textAlign: 'center', backgroundColor: '#F8FAFC', padding: '1.75rem', borderRadius: '18px', border: '1.5px solid #E2E8F0', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                FOOD BILL AMOUNT (RESTAURANT REVENUE)
              </div>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#166534', fontFamily: 'var(--font-heading)', margin: '0.25rem 0' }}>
                ₹{paymentModalOrder.total || 0}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#0F2A1D', fontWeight: 700 }}>
                Customer Name: <span style={{ color: '#E07A3C', fontWeight: 800 }}>{paymentModalOrder.customer || 'Guest Diner'}</span>
              </div>
            </div>

            {/* Manual Tip Entry Section */}
            <div style={{ marginBottom: '1.5rem', backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
              <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.5rem' }}>
                🪙 Optional Customer Tip (Manual Entry)
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F2A1D' }}>₹</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter tip amount (e.g. 50, 100, 200)"
                  value={tipInput}
                  onChange={e => setTipInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '1rem',
                    fontWeight: 700,
                    outline: 'none',
                    backgroundColor: '#FAFAFA'
                  }}
                />
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginTop: '0.65rem', lineHeight: '1.5' }}>
                💡 Total Paid by Customer: <strong style={{ color: '#0F2A1D', fontSize: '1rem' }}>₹{(Number(paymentModalOrder.total || 0) + Number(tipInput || 0))}</strong>
                <br />
                <span style={{ color: '#166534', fontWeight: 800 }}>✓ Restaurant Revenue Recorded: ₹{paymentModalOrder.total || 0} ONLY</span> (Tip amount is excluded from restaurant revenue).
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.92rem', fontWeight: 800, color: '#0F2A1D' }}>
                Select Customer Payment Method:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
                {[
                  { id: 'UPI', label: 'UPI / QR Code', icon: QrCode, desc: 'GPay, PhonePe, Paytm' },
                  { id: 'Card', label: 'Card Swipe', icon: CreditCard, desc: 'POS Credit/Debit' },
                  { id: 'Cash', label: 'Cash Paid', icon: DollarSign, desc: 'Direct Currency' }
                ].map(pm => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    style={{
                      backgroundColor: paymentMethod === pm.id ? '#0F2A1D' : '#F8FAFC',
                      color: paymentMethod === pm.id ? '#FFFFFF' : '#475569',
                      border: paymentMethod === pm.id ? '2px solid #0F2A1D' : '1px solid #CBD5E1',
                      borderRadius: '14px',
                      padding: '1.1rem 0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <pm.icon size={26} color={paymentMethod === pm.id ? '#4ADE80' : '#E07A3C'} />
                    <span>{pm.label}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 500, color: paymentMethod === pm.id ? '#A3C2B3' : '#94A3B8' }}>{pm.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table Lifecycle Transition Notice */}
            <div style={{ backgroundColor: '#FEFCE8', padding: '1rem 1.25rem', borderRadius: '14px', border: '1.5px solid #FDE047', marginBottom: '1.75rem', fontSize: '0.85rem', color: '#B45309', fontWeight: 700, lineHeight: '1.5' }}>
              ⚠️ <strong>Automated Table Lifecycle Transition:</strong>
              <br />
              1. Order Status ➔ <strong>PAID / COMPLETED</strong>
              <br />
              2. Table Status ➔ <strong>AUTOMATICALLY CHANGES TO CLEANING IN PROGRESS</strong>
            </div>

            {/* Bottom Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  handleConfirmPayment(paymentModalOrder);
                  setTipInput('');
                }}
                style={{
                  flex: 2,
                  minWidth: '240px',
                  backgroundColor: '#166534',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '1.1rem',
                  borderRadius: '14px',
                  fontSize: '1.05rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(22, 101, 52, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                ✓ Confirm Successful Payment & Complete Order
              </button>

              <button
                onClick={() => {
                  setPaymentModalOrder(null);
                  setTipInput('');
                }}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  padding: '1.1rem',
                  borderRadius: '14px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      ) : (
        <>
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

            {currentTimeStr && (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                padding: '0.45rem 0.85rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
              }}>
                <Clock size={15} color="#E07A3C" />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F2A1D', fontFamily: 'monospace' }}>
                  {currentTimeStr}
                </span>
              </div>
            )}
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
                { id: 'READY', label: `Ready for Pickup (${orders.filter(o => o.status === 'Ready').length})` },
                { id: 'ACTIVE', label: `Preparing (${orders.filter(o => o.status === 'Placed' || o.status === 'Preparing').length})` },
                { id: 'SERVED', label: `Served / Billing (${orders.filter(o => o.status === 'Served' || o.status === 'Bill Generated').length})` },
                { id: 'PAID', label: `Paid (${orders.filter(o => o.status === 'Completed' || o.status === 'Paid' || o.payment === 'Completed').length})` }
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
                const isPaid = order.status === 'Completed' || order.status === 'Paid' || order.payment === 'Completed';
                const isServed = order.status === 'Served' || isAllDelivered;

                let orderStatusBadgeText = 'Preparing';
                let badgeBg = '#FFF3EB';
                let badgeColor = '#E07A3C';

                if (isPaid) {
                  orderStatusBadgeText = 'Paid';
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
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.45rem' }}>
                          👤 Customer: {order.customer || order.guestName || 'Guest'}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '140px', overflowY: 'auto' }}>
                          {itemsList.map((item, idx) => {
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
                                  border: isDeliveredItem ? '1px solid #CBD5E1' : (isReadyItem ? '1px solid #86EFAC' : '1px solid #E2E8F0'),
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem'
                                }}
                              >
                                <span style={{ fontWeight: 800, color: isDeliveredItem ? '#64748B' : '#0F2A1D', textDecoration: isDeliveredItem ? 'line-through' : 'none' }}>
                                  {isDeliveredItem ? '✓' : (isReadyItem ? '✓' : '⏳')} {item.name || item.dishId} (x{item.quantity || 1})
                                </span>

                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  color: isDeliveredItem ? '#64748B' : (isReadyItem ? '#166534' : '#C2410C'),
                                  backgroundColor: isDeliveredItem ? '#E2E8F0' : (isReadyItem ? '#BBF7D0' : '#FFEDD5'),
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '6px'
                                }}>
                                  {isDeliveredItem ? 'Delivered' : (isReadyItem ? 'READY' : 'Preparing')}
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

                      {(isAllDelivered || isServed) && (
                        <button
                          onClick={() => handleGenerateBill(order)}
                          style={{ width: '100%', backgroundColor: '#FFF3EB', color: '#E07A3C', border: '1px solid #FDBA74', padding: '0.55rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        >
                          <Receipt size={16} />
                          <span>📄 Generate & Present Bill</span>
                        </button>
                      )}

                      {(isServed || isBillGenerated || isAllDelivered) && (
                        <button
                          onClick={() => setPaymentModalOrder(order)}
                          style={{ width: '100%', backgroundColor: '#0F2A1D', color: '#FFFFFF', border: 'none', padding: '0.55rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
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
        </>
      )}

    </div>
  );
}
