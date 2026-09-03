import React, { useState, useEffect } from 'react';
import { Table2, Plus, Sparkles, RefreshCw, CheckCircle2, User, Clock, UtensilsCrossed, Eye, X, Bell, DollarSign, AlertCircle, Search, Filter, Receipt, CreditCard, QrCode, Check, Ticket, Coins } from 'lucide-react';
import { api } from '../../services/api';
import { clearTableSessionStorage } from '../../utils/orderUtils';
import { groupTablesForFloorPlan } from '../../utils/floorPlanUtils';

const BASE_DEFAULT_TABLES = [
  { id: 1, num: 'T-01', zone: 'Main Dining', cap: 4, status: 'Available' },
  { id: 2, num: 'T-02', zone: 'Main Dining', cap: 2, status: 'Available' },
  { id: 3, num: 'T-03', zone: 'Main Dining', cap: 4, status: 'Available' },
  { id: 4, num: 'T-04', zone: 'Main Dining', cap: 6, status: 'Available' },
  { id: 5, num: 'T-05', zone: 'Window Section', cap: 2, status: 'Available' },
  { id: 6, num: 'T-06', zone: 'Window Section', cap: 4, status: 'Available' },
  { id: 7, num: 'T-07', zone: 'Window Section', cap: 4, status: 'Available' },
  { id: 8, num: 'T-08', zone: 'Family Lounge', cap: 8, status: 'Available' },
  { id: 9, num: 'T-09', zone: 'Family Lounge', cap: 6, status: 'Available' },
  { id: 10, num: 'T-10', zone: 'Patio Outdoor', cap: 4, status: 'Available' },
  { id: 11, num: 'T-11', zone: 'Patio Outdoor', cap: 2, status: 'Available' },
  { id: 12, num: 'T-12', zone: 'Patio Outdoor', cap: 4, status: 'Available' }
];

export default function WaiterTablesPage() {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [billingOrder, setBillingOrder] = useState(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [tipInput, setTipInput] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Table Transfer & Merge states
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [targetTransferTable, setTargetTransferTable] = useState('');
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [selectedSecondaryMergeTables, setSelectedSecondaryMergeTables] = useState([]);

  const handleExecuteTransfer = async () => {
    if (!selectedTable || !targetTransferTable) return;
    try {
      await api.transferTable(selectedTable.num, targetTransferTable);
      showNotification(`✓ Session transferred from ${selectedTable.num} to ${targetTransferTable}!`);
      setSelectedTable(null);
      setTransferModalOpen(false);
      setTargetTransferTable('');
      fetchTablesAndOrders();
      window.dispatchEvent(new Event('flavora_tables_updated'));
      window.dispatchEvent(new Event('flavora_orders_updated'));
    } catch (err) {
      alert(err.message || 'Failed to transfer table');
    }
  };

  const handleExecuteMerge = async () => {
    if (!selectedTable || selectedSecondaryMergeTables.length === 0) return;
    try {
      await api.mergeTables(selectedTable.num, selectedSecondaryMergeTables);
      showNotification(`✓ Tables ${[selectedTable.num, ...selectedSecondaryMergeTables].join(' + ')} merged successfully!`);
      setSelectedTable(null);
      setMergeModalOpen(false);
      setSelectedSecondaryMergeTables([]);
      fetchTablesAndOrders();
      window.dispatchEvent(new Event('flavora_tables_updated'));
    } catch (err) {
      alert(err.message || 'Failed to merge tables');
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
        showNotification(`✓ Coupon "${res.code}" applied! Saved ₹${res.discountAmount}`);
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
  const [toastMsg, setToastMsg] = useState(null);

  const showNotification = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
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
    fetchTablesAndOrders();
    const interval = setInterval(fetchTablesAndOrders, 4000);
    window.addEventListener('flavora_tables_updated', fetchTablesAndOrders);
    window.addEventListener('flavora_orders_updated', fetchTablesAndOrders);
    window.addEventListener('storage', fetchTablesAndOrders);

    return () => {
      clearInterval(interval);
      window.removeEventListener('flavora_tables_updated', fetchTablesAndOrders);
      window.removeEventListener('flavora_orders_updated', fetchTablesAndOrders);
      window.removeEventListener('storage', fetchTablesAndOrders);
    };
  }, []);

  const fetchTablesAndOrders = async () => {
    try {
      const [fetchedTables, fetchedOrders] = await Promise.all([
        api.getFloorPlan().catch(() => api.getTables().catch(() => [])),
        api.getOrders().catch(() => [])
      ]);

      const rawList = Array.isArray(fetchedTables) ? fetchedTables : (fetchedTables && fetchedTables.data ? fetchedTables.data : []);
      const groupedDisplayTables = groupTablesForFloorPlan(rawList);

      setTables(groupedDisplayTables);
      setOrders(fetchedOrders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const findTableOrder = (tb) => {
    if (!orders || orders.length === 0) return null;
    const memberNums = tb.tableNumbers || [tb.num || tb.number];
    const memberDigits = memberNums.map(n => String(n || '').replace(/[^0-9]/g, ''));

    return orders.find(o => {
      if (!o || o.status === 'Completed' || o.status === 'Cancelled' || o.status === 'Paid' || o.payment === 'Completed' || o.payment === 'Paid') return false;
      const orderTbStr = String(o.table || o.tableNumber || '');
      const orderDigits = orderTbStr.replace(/[^0-9]/g, '');
      return (orderDigits && memberDigits.includes(orderDigits)) || memberNums.some(m => orderTbStr.toLowerCase() === String(m || '').toLowerCase());
    });
  };

  const getTableRealStatus = (tb) => {
    if (tb.status === 'Cleaning') return 'Cleaning';
    if (tb.status === 'Reserved') return 'Reserved';

    const activeOrder = findTableOrder(tb);
    if (activeOrder) {
      if (activeOrder.status === 'Ready') return 'Ready';
      if (activeOrder.status === 'Bill Generated' || activeOrder.status === 'Awaiting Payment' || activeOrder.payment === 'Awaiting Payment') return 'Bill Generated';
      return 'Occupied';
    }

    if (tb.status === 'Occupied' || tb.isOccupied) return 'Occupied';

    return 'Available';
  };

  const filteredTables = tables.filter(tb => {
    const realStatus = getTableRealStatus(tb);
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'OCCUPIED') return realStatus === 'Occupied' || realStatus === 'Ready' || realStatus === 'Bill Generated';
    if (activeFilter === 'AVAILABLE') return realStatus === 'Available';
    if (activeFilter === 'READY') return realStatus === 'Ready';
    if (activeFilter === 'CLEANING') return realStatus === 'Cleaning';
    return true;
  });

  const occupiedCount = tables.filter(tb => {
    const status = getTableRealStatus(tb);
    return status === 'Occupied' || status === 'Ready' || status === 'Bill Generated';
  }).length;
  const readyCount = tables.filter(tb => getTableRealStatus(tb) === 'Ready').length;
  const cleaningCount = tables.filter(tb => getTableRealStatus(tb) === 'Cleaning').length;
  const availableCount = tables.filter(tb => getTableRealStatus(tb) === 'Available').length;

  const getOrderId = (ord) => {
    if (!ord) return 'ORD-101';
    const val = ord.orderId || ord._id || ord.id || ord.orderNum;
    if (!val) return 'ORD-101';
    const str = String(val);
    if (str.startsWith('ORD-') || str.startsWith('#')) return str.replace(/^#/, '');
    if (str.length > 8) return `ORD-${str.slice(-6).toUpperCase()}`;
    return `ORD-${str}`;
  };

  // STEP 2: Generate / Present Bill (Table STAYS Occupied)
  const handleGenerateBill = async (order) => {
    try {
      const orderId = order._id || order.id || order.orderId;
      await api.updateOrderStatus(orderId, 'Bill Generated', {
        status: 'Bill Generated',
        payment: 'Awaiting Payment'
      }).catch(() => { });

      setOrders(prev => prev.map(o => (o._id === orderId || o.id === orderId) ? { ...o, status: 'Bill Generated', payment: 'Awaiting Payment' } : o));
      setBillingOrder({ ...order, status: 'Bill Generated', payment: 'Awaiting Payment' });
      showNotification(`Bill Generated for Table ${order.table}. Order Status: Awaiting Payment. Table STAYS Occupied.`);
    } catch (e) {
      console.error(e);
    }
  };

  // STEP 4: Confirm Successful Payment -> Order = Paid, Table AUTOMATICALLY changes to Cleaning!
  const handleConfirmPayment = async (order) => {
    try {
      const orderId = order._id || order.id || order.orderId;
      const tableNum = order.table || order.tableNumber || 'T-01';
      const originalTotal = Number(order.originalTotal || order.originalAmount || order.total || order.totalAmount || 0);
      const discountAmount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : Number(order.discountAmount || 0);
      const finalAmount = appliedCoupon ? Number(appliedCoupon.finalAmount || (originalTotal - discountAmount)) : (order.finalAmount !== undefined ? Number(order.finalAmount) : originalTotal);
      const couponCode = appliedCoupon ? appliedCoupon.code : (order.couponCode || '');
      const tipVal = Number(tipInput || 0);

      // 1. Update Order in Backend & Memory (Payment Confirmed -> Paid)
      await api.updateOrderStatus(orderId, 'Paid', {
        status: 'Paid',
        payment: 'Completed',
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
      }).catch(() => { });

      setOrders(prev => prev.map(o => (o._id === orderId || o.id === orderId) ? { ...o, status: 'Completed', payment: 'Completed' } : o));

      // 2. Table AUTOMATICALLY transitions to CLEANING & session is closed
      clearTableSessionStorage(tableNum);
      await handleSetTableCleaning(tableNum);

      setPaymentModalOrder(null);
      setBillingOrder(null);
      setSelectedTable(null);
      handleRemoveCoupon();
      showNotification(`🎉 Payment Confirmed Success! Table ${tableNum} moved AUTOMATICALLY to CLEANING.`);
    } catch (e) {
      console.error('Payment confirmation error:', e);
    }
  };

  // STEP 5 & 6: Set Table to Cleaning or Mark Cleaned & Available
  const handleSetTableCleaning = async (tableNum) => {
    setTables(prev => prev.map(t => {
      const tNum = t.num || t.number || `T-${String(t.id || 1).padStart(2, '0')}`;
      if (tNum === tableNum) {
        return { ...t, status: 'Cleaning' };
      }
      return t;
    }));

    let savedTables = [];
    try {
      const raw = localStorage.getItem('flavora_tables');
      if (raw) savedTables = JSON.parse(raw);
    } catch (e) { }

    let updated = false;
    const baseList = savedTables.length > 0 ? savedTables : BASE_DEFAULT_TABLES;
    const updatedList = baseList.map(t => {
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

    const dbTable = tables.find(t => t.num === tableNum);
    if (dbTable && dbTable.id) {
      await api.updateTableStatus(dbTable.id, 'Cleaning').catch(() => { });
    }
  };

  const handleMarkCleanedAvailable = async (tableNum) => {
    // 1. Instant optimistic update for Waiter UI
    setTables(prev => prev.map(t => {
      const tNum = t.num || t.number || `T-${String(t.id || 1).padStart(2, '0')}`;
      if (tNum === tableNum) {
        return { ...t, status: 'Available', cleaningUntil: null, orderId: null, amount: '-', customer: '-' };
      }
      return t;
    }));

    // 2. Update local storage cache
    let savedTables = [];
    try {
      const raw = localStorage.getItem('flavora_tables');
      if (raw) savedTables = JSON.parse(raw);
    } catch (e) { }

    const baseList = savedTables.length > 0 ? savedTables : BASE_DEFAULT_TABLES;
    const updatedList = baseList.map(t => {
      const tNum = t.num || t.number || `T-${String(t.id || 1).padStart(2, '0')}`;
      if (tNum === tableNum) {
        return { ...t, status: 'Available', cleaningUntil: null, orderId: null, amount: '-', customer: '-' };
      }
      return t;
    });

    localStorage.setItem('flavora_tables', JSON.stringify(updatedList));
    window.dispatchEvent(new Event('flavora_tables_updated'));

    // 3. Persist to MongoDB database
    try {
      const dbTable = tables.find(t => (t.num === tableNum || t.number === tableNum || t.name === tableNum));
      const targetId = dbTable?._id || dbTable?.id || tableNum;
      await api.updateTableStatus(targetId, { status: 'Available', currentOrder: '' }).catch(() => { });
      await api.updateTableByNumber(tableNum, { status: 'Available', currentOrder: '' }).catch(() => { });
    } catch (err) {
      console.warn("Failed to persist table Available status to DB:", err);
    }

    if (selectedTable && selectedTable.num === tableNum) {
      setSelectedTable(null);
    }
    showNotification(`✨ Table ${tableNum} cleaned & reset to AVAILABLE for new guests!`);
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

      {/* ================= DEDICATED SEPARATE PAYMENT SETTLEMENT PAGE ================= */}
      {paymentModalOrder && (
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
              ← Back to Tables Floor Plan
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
            {(() => {
              const origTotal = Number(paymentModalOrder.total || paymentModalOrder.totalAmount || 0);
              const discAmt = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
              const finalPayable = appliedCoupon ? Number(appliedCoupon.finalAmount || (origTotal - discAmt)) : origTotal;

              return (
                <>
                  <div style={{ textAlign: 'center', backgroundColor: '#F8FAFC', padding: '1.75rem', borderRadius: '18px', border: '1.5px solid #E2E8F0', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      FOOD BILL AMOUNT (RESTAURANT REVENUE)
                    </div>
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: '#166534', fontFamily: 'var(--font-heading)', margin: '0.25rem 0' }}>
                      ₹{finalPayable}
                    </div>
                    {appliedCoupon && (
                      <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 800 }}>
                        (Discounted from Original ₹{origTotal} using coupon {appliedCoupon.code})
                      </div>
                    )}
                    <div style={{ fontSize: '0.9rem', color: '#0F2A1D', fontWeight: 700, marginTop: '0.25rem' }}>
                      Customer Name: <span style={{ color: '#E07A3C', fontWeight: 800 }}>{paymentModalOrder.customer || 'Guest Diner'}</span>
                    </div>
                  </div>

                  {/* Apply Coupon Section */}
                  <div style={{ marginBottom: '1.5rem', backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1.5px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Ticket size={18} color="#E07A3C" />
                      <span>Apply Coupon</span>
                    </div>

                    {!appliedCoupon ? (
                      <div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
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
                              padding: '0.75rem 1rem',
                              borderRadius: '10px',
                              border: couponError ? '1.5px solid #EF4444' : '1.5px solid #CBD5E1',
                              fontSize: '0.95rem',
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
                              padding: '0.75rem 1.4rem',
                              backgroundColor: validatingCoupon || !couponInput.trim() ? '#94A3B8' : '#0F2A1D',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '10px',
                              fontSize: '0.9rem',
                              fontWeight: 800,
                              cursor: validatingCoupon || !couponInput.trim() ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {validatingCoupon ? 'Validating...' : 'Apply'}
                          </button>
                        </div>

                        {couponError && (
                          <div style={{ fontSize: '0.8rem', color: '#DC2626', fontWeight: 700, marginTop: '0.5rem' }}>
                            ⚠️ {couponError}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ backgroundColor: '#F0FDF4', padding: '0.85rem 1.1rem', borderRadius: '14px', border: '1.5px solid #86EFAC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            ✓ Coupon Applied
                          </div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2A1D', marginTop: '0.15rem' }}>
                            {appliedCoupon.code} <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>({appliedCoupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.discountVal}% OFF` : `₹${appliedCoupon.discountVal} OFF`})</span>
                          </div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#166534', marginTop: '0.15rem' }}>
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
                            padding: '0.4rem 0.85rem',
                            fontSize: '0.8rem',
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
                      <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px dashed #CBD5E1', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontWeight: 700 }}>
                          <span>Original Total:</span>
                          <span>₹{origTotal}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontWeight: 800 }}>
                          <span>Coupon Discount ({appliedCoupon.code}):</span>
                          <span>-₹{discAmt}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F2A1D', fontWeight: 900, fontSize: '0.98rem', paddingTop: '0.4rem', borderTop: '1px solid #E2E8F0' }}>
                          <span>Final Payable Amount:</span>
                          <span style={{ color: '#166534' }}>₹{finalPayable}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

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
            <div style={{ backgroundColor: '#FEFCE8', padding: '1rem 1.25rem', borderRadius: '14px', border: '1.5.px solid #FDE047', marginBottom: '1.75rem', fontSize: '0.85rem', color: '#B45309', fontWeight: 700, lineHeight: '1.5' }}>
              ⚠️ <strong>Automated Table Lifecycle Transition:</strong>
              <br />
              1. Order Status ➔ <strong>PAID / COMPLETED</strong>
              <br />
              2. Table Status ➔ <strong>AUTOMATICALLY CHANGES TO CLEANING IN PROGRESS</strong>
            </div>

            {/* Bottom Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleConfirmPayment(paymentModalOrder)}
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
      )}

      {/* Main Floor Plan Container (Hidden when in Payment Settlement mode) */}
      {!paymentModalOrder && (
        <>
          <div className="admin-dashboard-header" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="page-breadcrumb-bar">
                <span>Waiter</span>
                <span className="crumb-sep">›</span>
                <span className="crumb-current">My Tables</span>
              </div>
              <h1 className="admin-page-title" style={{ margin: 0 }}>
                My Tables
              </h1>
            </div>
          </div>

          {/* ================= 2. KPI COUNTERS STRIP ================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: '#1E4636', color: '#FFFFFF', padding: '0.95rem 1.15rem', borderRadius: '14px', border: '1.5px solid #285A46', boxShadow: '0 6px 20px rgba(15,42,29,0.12)' }}>
              <div style={{ fontSize: '0.74rem', color: '#A7F3D0', fontWeight: 800, textTransform: 'uppercase' }}>Occupied / Billing</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', marginTop: '0.1rem', fontFamily: 'var(--font-heading)' }}>{occupiedCount} / {tables.length}</div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '0.95rem 1.15rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Dishes Ready</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#283593', marginTop: '0.1rem', fontFamily: 'var(--font-heading)' }}>{readyCount} Tables</div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '0.95rem 1.15rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Available Seating</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#166534', marginTop: '0.1rem', fontFamily: 'var(--font-heading)' }}>{availableCount} Tables</div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '0.95rem 1.15rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>In Cleaning State</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#D97706', marginTop: '0.1rem', fontFamily: 'var(--font-heading)' }}>{cleaningCount} Tables</div>
            </div>
          </div>

          {/* ================= 3. FILTER TOOLBAR ================= */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            padding: '0.85rem 1.25rem',
            border: '1px solid #E2E8F0',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: `All Tables (${tables.length})` },
                { id: 'OCCUPIED', label: `Occupied / Billing (${occupiedCount})` },
                { id: 'READY', label: `Ready for Service (${readyCount})` },
                { id: 'AVAILABLE', label: `Available (${availableCount})` },
                { id: 'CLEANING', label: `Cleaning (${cleaningCount})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  style={{
                    backgroundColor: activeFilter === f.id ? '#0F2A1D' : '#F8FAFC',
                    color: activeFilter === f.id ? '#FFFFFF' : '#475569',
                    border: '1px solid',
                    borderColor: activeFilter === f.id ? '#0F2A1D' : '#E2E8F0',
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
              onClick={fetchTablesAndOrders}
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

          {/* ================= 4. FLOOR TABLES GRID ================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {filteredTables.map(tb => {
              const realStatus = getTableRealStatus(tb);
              const activeOrder = findTableOrder(tb);

              let statusBg = '#F0FDF4';
              let statusColor = '#166534';
              let statusText = '🟢 Available';

              if (realStatus === 'Occupied') {
                statusBg = '#FFF3EB';
                statusColor = '#E07A3C';
                statusText = '🔴 Occupied';
              } else if (realStatus === 'Ready') {
                statusBg = '#EEF2FF';
                statusColor = '#283593';
                statusText = '🔔 Dish Ready!';
              } else if (realStatus === 'Bill Generated') {
                statusBg = '#FEF3C7';
                statusColor = '#92400E';
                statusText = '📄 Bill Generated (Occupied)';
              } else if (realStatus === 'Cleaning') {
                statusBg = '#FEFCE8';
                statusColor = '#B45309';
                statusText = '🧹 Cleaning';
              }

              return (
                <div
                  key={tb.num}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    border: realStatus === 'Ready' ? '2px solid #283593' : realStatus === 'Bill Generated' ? '2px solid #D97706' : '1px solid #E2E8F0',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0F2A1D' }}>
                          {tb.num}
                        </h3>
                        <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700 }}>
                          📍 {tb.zone} • 👥 {tb.cap} Seats
                        </span>
                      </div>

                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        backgroundColor: statusBg,
                        color: statusColor,
                        padding: '0.3rem 0.65rem',
                        borderRadius: '8px'
                      }}>
                        {statusText}
                      </span>
                    </div>

                    {activeOrder ? (
                      <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.25rem' }}>
                          <span>👤 {activeOrder.customer || activeOrder.guestName || 'Guest'}</span>
                          <span style={{ color: '#166534', fontWeight: 900 }}>₹{activeOrder.total || 0}</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                          🍲 {Array.isArray(activeOrder.items) ? activeOrder.items.length : 1} Items • Order #{getOrderId(activeOrder)}
                        </div>
                        {activeOrder.status === 'Bill Generated' && (
                          <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: '#B45309', fontWeight: 800, backgroundColor: '#FEF3C7', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                            ⏳ Bill Presented • Awaiting Payment
                          </div>
                        )}
                      </div>
                    ) : realStatus === 'Cleaning' ? (
                      <div 
                        onClick={() => handleMarkCleanedAvailable(tb.num)}
                        title="Click to finish cleaning and mark table as Available"
                        style={{ backgroundColor: '#FEFCE8', padding: '0.75rem', borderRadius: '10px', border: '1px solid #FDE047', marginBottom: '0.85rem', color: '#B45309', fontSize: '0.78rem', fontWeight: 800, textAlign: 'center', cursor: 'pointer' }}
                      >
                        🧹 Cleaning in Progress • Click to Finish ✨
                      </div>
                    ) : (
                      <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '10px', border: '1px border-dashed #CBD5E1', marginBottom: '0.85rem', color: '#94A3B8', fontSize: '0.78rem', fontWeight: 600, textAlign: 'center' }}>
                        No active table orders • Ready for guests
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => setSelectedTable({ ...tb, activeOrder })}
                        style={{
                          flex: 1,
                          backgroundColor: '#0F2A1D',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.5rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <Eye size={14} />
                        <span>Details</span>
                      </button>

                      {activeOrder && activeOrder.status !== 'Bill Generated' && activeOrder.payment !== 'Awaiting Payment' && (() => {
                        const items = Array.isArray(activeOrder.items) ? activeOrder.items : [];
                        const totalCount = items.length;
                        const deliveredCount = items.filter(i => i && (i.isDelivered || i.status === 'SERVED' || i.status === 'DELIVERED')).length;
                        const isFullyServed = activeOrder.status === 'Served' || (totalCount > 0 && deliveredCount === totalCount);

                        if (!isFullyServed) return null;

                        return (
                          <button
                            onClick={() => {
                              handleGenerateBill(activeOrder);
                              setBillingOrder(activeOrder);
                            }}
                            style={{
                              backgroundColor: '#FFF3EB',
                              color: '#E07A3C',
                              border: '1px solid #FDBA74',
                              padding: '0.5rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <Receipt size={14} />
                            <span>Generate Bill</span>
                          </button>
                        );
                      })()}
                    </div>

                    {activeOrder && (activeOrder.status === 'Bill Generated' || activeOrder.payment === 'Awaiting Payment') && (
                      <button
                        onClick={() => setPaymentModalOrder(activeOrder)}
                        style={{
                          backgroundColor: '#1E4636',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.5rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <CreditCard size={14} />
                        <span>Confirm Payment Received</span>
                      </button>
                    )}

                    {realStatus === 'Cleaning' && (
                      <button
                        onClick={() => handleMarkCleanedAvailable(tb.num)}
                        style={{
                          backgroundColor: '#F0FDF4',
                          color: '#166534',
                          border: '1.5px solid #86EFAC',
                          padding: '0.55rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 900,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Mark Cleaned & Available</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ================= 5. BILL & ITEM BREAKDOWN MODAL ================= */}
          {billingOrder && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0F2A1D' }}>
                      📄 Restaurant Tax Invoice
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>
                      Table {billingOrder.table} • Order #{getOrderId(billingOrder)}
                    </span>
                  </div>
                  <button onClick={() => setBillingOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Customer: <b>{billingOrder.customer || 'Guest Diner'}</b></div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Table Status: <b style={{ color: '#E07A3C' }}>Occupied (Bill Presented)</b></div>
                </div>

                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 800, color: '#0F2A1D' }}>Bill Summary</h4>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {Array.isArray(billingOrder.items) ? (
                    billingOrder.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.3rem 0', borderBottom: i === billingOrder.items.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                        <span>{item.name} (x{item.quantity || 1})</span>
                        <span style={{ fontWeight: 800, color: '#0F2A1D' }}>₹{(item.price || 150) * (item.quantity || 1)}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>{String(billingOrder.items)}</div>
                  )}
                </div>

                <div style={{ backgroundColor: '#F0FDF4', padding: '0.85rem', borderRadius: '12px', border: '1px solid #86EFAC', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900, color: '#166534' }}>
                    <span>Food Bill Total:</span>
                    <span>₹{billingOrder.total || 0}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600, marginTop: '0.2rem' }}>
                    *Includes all applicable GST Taxes. Food bill recorded as restaurant revenue.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setPaymentModalOrder(billingOrder);
                      setBillingOrder(null);
                    }}
                    style={{ flex: 1, backgroundColor: '#0F2A1D', color: '#FFFFFF', border: 'none', padding: '0.65rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    💳 Process Customer Payment (₹{billingOrder.total || 0})
                  </button>
                  <button
                    onClick={() => setBillingOrder(null)}
                    style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '0.65rem 1rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 6. PAYMENT CONFIRMATION MODAL ================= */}
          {paymentModalOrder && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0F2A1D' }}>
                      💳 Confirm Customer Payment
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>
                      Table {paymentModalOrder.table} • Order #{getOrderId(paymentModalOrder)}
                    </span>
                  </div>
                  <button onClick={() => setPaymentModalOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ textAlign: 'center', backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Food Bill Amount (Restaurant Revenue)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#166534', fontFamily: 'var(--font-heading)', margin: '0.2rem 0' }}>
                    ₹{paymentModalOrder.total || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                    Customer: <b>{paymentModalOrder.customer || 'Guest Diner'}</b>
                  </div>
                </div>

                {/* Customer Tip Section */}
                <div style={{ marginBottom: '1.15rem', backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '12px', border: '1.5px solid #E2E8F0' }}>
                  <label style={{ display: 'flex', fontSize: '0.82rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem', alignItems: 'center', gap: '0.3rem' }}>
                    <Coins size={15} color="#B45309" />
                    <span>Optional Customer Tip</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2A1D' }}>₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Enter tip (e.g. 50, 100)"
                      value={tipInput}
                      onChange={(e) => setTipInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.65rem',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#0F2A1D',
                        outline: 'none',
                        backgroundColor: '#FFFFFF'
                      }}
                    />
                  </div>
                  {Number(tipInput || 0) > 0 && (
                    <div style={{ fontSize: '0.74rem', color: '#B45309', fontWeight: 800, marginTop: '0.35rem' }}>
                      🪙 Tip Added: <b>+₹{tipInput}</b> • Total: <b style={{ color: '#166534' }}>₹{(Number(paymentModalOrder.total || 0) + Number(tipInput || 0))}</b>
                    </div>
                  )}
                </div>

                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 800, color: '#0F2A1D' }}>Select Payment Method</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
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
                        border: paymentMethod === pm.id ? '1.5px solid #0F2A1D' : '1px solid #CBD5E1',
                        borderRadius: '10px',
                        padding: '0.65rem 0.3rem',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <pm.icon size={18} />
                      <span>{pm.label}</span>
                    </button>
                  ))}
                </div>

                <div style={{ backgroundColor: '#FEFCE8', padding: '0.75rem', borderRadius: '10px', border: '1px solid #FDE047', marginBottom: '1.25rem', fontSize: '0.74rem', color: '#B45309', fontWeight: 700 }}>
                  ⚠️ Upon payment success confirmation:
                  <br />
                  1. Order Status ➔ <b>PAID / COMPLETED</b>
                  <br />
                  2. Table Status ➔ <b>AUTOMATICALLY CHANGES TO CLEANING</b>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleConfirmPayment(paymentModalOrder)}
                    style={{ flex: 1, backgroundColor: '#166534', color: '#FFFFFF', border: 'none', padding: '0.65rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer' }}
                  >
                    ✓ Confirm Payment (₹{(Number(paymentModalOrder.total || 0) + Number(tipInput || 0))})
                  </button>
                  <button
                    onClick={() => {
                      setPaymentModalOrder(null);
                      setTipInput('');
                    }}
                    style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '0.65rem 1rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 7. VIEW TABLE DETAILS MODAL ================= */}
          {selectedTable && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0F2A1D' }}>
                      Table {selectedTable.num} Breakdown
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>
                      Zone: {selectedTable.zone} • {selectedTable.cap} Guests Seating
                    </span>
                  </div>
                  <button onClick={() => setSelectedTable(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                    <X size={20} />
                  </button>
                </div>

                {selectedTable.activeOrder ? (
                  <div>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.2rem' }}>
                        Order ID: #{getOrderId(selectedTable.activeOrder)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                        Customer: {selectedTable.activeOrder.customer || 'Dine-in Guest'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                        Status: <span style={{ color: '#E07A3C', fontWeight: 800 }}>{selectedTable.activeOrder.status}</span>
                      </div>

                      {(() => {
                        const ord = selectedTable.activeOrder;
                        const isPaid = ord.status === 'Completed' || ord.status === 'Paid' || ord.payment === 'Paid' || ord.payment === 'Completed';
                        const displayPaidVal = Number(ord.finalAmount ?? ord.total ?? ord.totalAmount ?? 0);
                        const origVal = Number(ord.originalTotal ?? ord.originalAmount ?? 0);
                        const discVal = Number(ord.discountAmount ?? 0);
                        const couponName = ord.couponCode || '';
                        const tipVal = Number(ord.tip ?? ord.tipAmount ?? 0);

                        const hasOriginal = Boolean(origVal > 0 && origVal > displayPaidVal);
                        const actualDiscount = discVal > 0 ? discVal : (origVal > displayPaidVal ? origVal - displayPaidVal : 0);
                        const hasDiscount = Boolean(actualDiscount > 0);
                        const hasTip = Boolean(tipVal > 0);

                        return (
                          <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px dashed #CBD5E1' }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span>Paid Revenue: ₹{displayPaidVal}</span>
                              {isPaid && (
                                <span style={{ fontSize: '0.66rem', backgroundColor: '#DCFCE7', color: '#166534', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #86EFAC' }}>
                                  ✓ PAID
                                </span>
                              )}
                            </div>

                            {(hasOriginal || hasDiscount || hasTip) && (
                              <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.12rem', fontSize: '0.74rem' }}>
                                {hasOriginal && (
                                  <div style={{ color: '#64748B', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Original Bill Total:</span>
                                    <span style={{ textDecoration: 'line-through' }}>₹{origVal}</span>
                                  </div>
                                )}

                                {hasDiscount && (
                                  <div style={{ color: '#DC2626', fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Coupon ({couponName || 'Applied'}):</span>
                                    <span>-₹{actualDiscount}</span>
                                  </div>
                                )}

                                {hasTip && (
                                  <div style={{ color: '#EA580C', fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Customer Tip:</span>
                                    <span>+₹{tipVal}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 800, color: '#0F2A1D' }}>Ordered Items:</h4>
                    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.75rem', marginBottom: '1.25rem', maxHeight: '180px', overflowY: 'auto' }}>
                      {Array.isArray(selectedTable.activeOrder.items) ? (
                        selectedTable.activeOrder.items.filter(item => {
                          if (!item) return false;
                          if (typeof item === 'string') return true;
                          const s = String(item.status || '').toUpperCase().trim();
                          return s !== 'CANCELLED';
                        }).map((item, i, arr) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.3rem 0', borderBottom: i === arr.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                            <span>{typeof item === 'string' ? item : `${item.name} (x${item.quantity || 1})`}</span>
                            <span style={{ fontWeight: 800, color: '#0F2A1D' }}>₹{item.price || 150}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.82rem', color: '#475569' }}>{String(selectedTable.activeOrder.items)}</div>
                      )}
                    </div>
                  </div>
                ) : getTableRealStatus(selectedTable) === 'Cleaning' ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#B45309' }}>
                    <Sparkles size={32} color="#D97706" style={{ marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>This table is currently being cleaned and prepared for the next guests.</p>
                  </div>
                ) : (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748B' }}>
                    <Sparkles size={32} color="#CBD5E1" style={{ marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700 }}>This table is currently available for guest seating.</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  {getTableRealStatus(selectedTable) === 'Cleaning' && (
                    <button
                      onClick={() => handleMarkCleanedAvailable(selectedTable.num)}
                      style={{ flex: 1, backgroundColor: '#F0FDF4', color: '#166534', border: '1px solid #86EFAC', padding: '0.65rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 900, cursor: 'pointer' }}
                    >
                      🟢 Mark Cleaned & Available
                    </button>
                  )}

                  {getTableRealStatus(selectedTable) === 'Occupied' && (
                    <>
                      <button
                        onClick={() => setTransferModalOpen(true)}
                        style={{ flex: 1, backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', padding: '0.65rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 900, cursor: 'pointer' }}
                      >
                        ↔️ Transfer Table
                      </button>
                      <button
                        onClick={() => setMergeModalOpen(true)}
                        style={{ flex: 1, backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #93C5FD', padding: '0.65rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 900, cursor: 'pointer' }}
                      >
                        🔗 Merge Tables
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setSelectedTable(null)}
                    style={{ flex: 1, backgroundColor: '#0F2A1D', color: '#FFFFFF', border: 'none', padding: '0.65rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Close Window
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TRANSFER TABLE OVERLAY MODAL ================= */}
          {transferModalOpen && selectedTable && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '1rem' }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '420px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F2A1D' }}>
                    ↔️ Transfer Table {selectedTable.num}
                  </h3>
                  <button onClick={() => setTransferModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                    <X size={20} />
                  </button>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '1rem' }}>
                  Select an available target table to transfer customer <strong>{selectedTable.customer || 'Diner'}</strong> and active session without losing items or payment state:
                </p>

                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', display: 'block', marginBottom: '0.4rem' }}>
                  Target Available Table:
                </label>
                <select
                  value={targetTransferTable}
                  onChange={(e) => setTargetTransferTable(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '1.25rem', outline: 'none' }}
                >
                  <option value="">-- Select Available Table --</option>
                  {tables.filter(t => (t.status === 'Available' || getTableRealStatus(t) === 'Available') && t.num !== selectedTable.num).map(t => (
                    <option key={t.num} value={t.num}>
                      Table {t.num} ({t.cap || 4} Seats • {t.zone || 'Main'})
                    </option>
                  ))}
                </select>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    disabled={!targetTransferTable}
                    onClick={handleExecuteTransfer}
                    style={{ flex: 1, backgroundColor: !targetTransferTable ? '#94A3B8' : '#0F2A1D', color: '#FFFFFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 900, cursor: !targetTransferTable ? 'not-allowed' : 'pointer' }}
                  >
                    Confirm Transfer
                  </button>
                  <button
                    onClick={() => setTransferModalOpen(false)}
                    style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= MERGE TABLES OVERLAY MODAL ================= */}
          {mergeModalOpen && selectedTable && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '1rem' }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '420px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F2A1D' }}>
                    🔗 Merge Tables with {selectedTable.num}
                  </h3>
                  <button onClick={() => setMergeModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                    <X size={20} />
                  </button>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '1rem' }}>
                  Select tables to combine with primary Table <strong>{selectedTable.num}</strong>:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', marginBottom: '1.25rem', border: '1px solid #E2E8F0', padding: '0.65rem', borderRadius: '10px' }}>
                  {tables.filter(t => t.num !== selectedTable.num).map(t => {
                    const isChecked = selectedSecondaryMergeTables.includes(t.num);
                    return (
                      <label key={t.num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 700, color: '#0F2A1D', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSecondaryMergeTables(prev => [...prev, t.num]);
                            } else {
                              setSelectedSecondaryMergeTables(prev => prev.filter(n => n !== t.num));
                            }
                          }}
                        />
                        <span>Table {t.num} ({t.cap || 4} Seats • {t.status})</span>
                      </label>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    disabled={selectedSecondaryMergeTables.length === 0}
                    onClick={handleExecuteMerge}
                    style={{ flex: 1, backgroundColor: selectedSecondaryMergeTables.length === 0 ? '#94A3B8' : '#0F2A1D', color: '#FFFFFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 900, cursor: selectedSecondaryMergeTables.length === 0 ? 'not-allowed' : 'pointer' }}
                  >
                    Confirm Merge ({selectedSecondaryMergeTables.length})
                  </button>
                  <button
                    onClick={() => setMergeModalOpen(false)}
                    style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
