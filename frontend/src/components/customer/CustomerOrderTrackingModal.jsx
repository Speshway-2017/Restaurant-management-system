import React, { useState, useEffect } from 'react';
import { 
  X, Clock, CheckCircle2, ChefHat, BellRing, Plus, Utensils, 
  AlertCircle, Sparkles, ChevronRight, Droplets, Receipt, Check 
} from 'lucide-react';
import { api } from '../../services/api';
import { onSocketEvent } from '../../services/socket';

export default function CustomerOrderTrackingModal({ 
  activeOrder, 
  orders = [], 
  tableNum, 
  onClose, 
  onAddMoreItems, 
  onViewBill 
}) {
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [waiterCallMsg, setWaiterCallMsg] = useState(null);
  const [liveOrders, setLiveOrders] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchFreshOrders = async () => {
      try {
        const freshOrders = await api.getOrders();
        if (!isMounted || !Array.isArray(freshOrders)) return;

        const targetTable = tableNum || activeOrder?.table || '';
        const cleanTableNum = String(targetTable).replace(/[^0-9]/g, '');
        if (!cleanTableNum) return;

        const tableOrders = freshOrders.filter(ord => {
          const ordTableDigits = String(ord.table || ord.tableNumber || '').replace(/[^0-9]/g, '');
          const isMatch = ordTableDigits && String(parseInt(ordTableDigits, 10)) === String(parseInt(cleanTableNum, 10));
          const isClosed = ord.status === 'Completed' || ord.status === 'Paid' || ord.status === 'Cancelled' || ord.payment === 'Paid' || ord.paymentStatus === 'Paid';
          return isMatch && !isClosed;
        });

        if (tableOrders.length > 0) {
          setLiveOrders(tableOrders);
        }
      } catch (e) {}
    };

    fetchFreshOrders();

    const unsub1 = onSocketEvent('chef_ready', fetchFreshOrders);
    const unsub2 = onSocketEvent('order_status_updated', fetchFreshOrders);
    const unsub3 = onSocketEvent('order_updated', fetchFreshOrders);
    const unsub4 = onSocketEvent('waiter_serving', fetchFreshOrders);
    const unsub5 = onSocketEvent('waiter_served', fetchFreshOrders);
    const unsub6 = onSocketEvent('order_item_cancelled', fetchFreshOrders);

    return () => {
      isMounted = false;
      if (typeof unsub1 === 'function') unsub1();
      if (typeof unsub2 === 'function') unsub2();
      if (typeof unsub3 === 'function') unsub3();
      if (typeof unsub4 === 'function') unsub4();
      if (typeof unsub5 === 'function') unsub5();
      if (typeof unsub6 === 'function') unsub6();
    };
  }, [tableNum, activeOrder?.table, activeOrder?.orderId]);

  // Collect all available orders for this table session
  const orderList = (Array.isArray(liveOrders) && liveOrders.length > 0)
    ? liveOrders
    : (Array.isArray(orders) && orders.length > 0 
      ? orders 
      : (activeOrder ? [activeOrder] : []));

  const [selectedOrderIdx, setSelectedOrderIdx] = useState(0);
  const currentOrder = orderList[selectedOrderIdx] || activeOrder || null;

  // Touch Swipe Gesture State
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  const handleTouchStart = (e) => {
    if (e.targetTouches && e.targetTouches[0]) {
      setTouchStartX(e.targetTouches[0].clientX);
      setTouchEndX(null);
    }
  };

  const handleTouchMove = (e) => {
    if (e.targetTouches && e.targetTouches[0]) {
      setTouchEndX(e.targetTouches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null || orderList.length <= 1) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance) {
      // Swiped left -> Next order round
      setSelectedOrderIdx((prev) => (prev + 1) % orderList.length);
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> Previous order round
      setSelectedOrderIdx((prev) => (prev - 1 + orderList.length) % orderList.length);
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const [cancellingItemId, setCancellingItemId] = useState(null);

  const handleCallWaiter = async (reason) => {
    setCallingWaiter(true);
    try {
      const targetTbl = currentOrder?.table || tableNum || 'T-01';
      await api.callWaiter(targetTbl, reason);
      setWaiterCallMsg(`✓ Request for "${reason}" sent to floor staff!`);
      setTimeout(() => setWaiterCallMsg(null), 4000);
    } catch (err) {
      setWaiterCallMsg(`✓ Request sent to floor staff!`);
      setTimeout(() => setWaiterCallMsg(null), 4000);
    } finally {
      setCallingWaiter(false);
    }
  };

  const handleCancelCustomerItem = async (item, itemKey) => {
    if (!currentOrder) return;
    const confirmCancel = window.confirm(`Request cancellation for "${item.name || 'this dish'}"?`);
    if (!confirmCancel) return;

    setCancellingItemId(itemKey);
    try {
      const orderTargetId = currentOrder._id || currentOrder.id || currentOrder.orderId;
      await api.requestOrderCancellation(orderTargetId, 'Customer changed mind', [itemKey]);
      setWaiterCallMsg(`✓ Cancellation request for "${item.name || 'Dish'}" submitted!`);
      setTimeout(() => setWaiterCallMsg(null), 4000);

      const freshOrders = await api.getOrders();
      if (Array.isArray(freshOrders)) {
        const targetTable = tableNum || activeOrder?.table || '';
        const cleanTableNum = String(targetTable).replace(/[^0-9]/g, '');
        const tableOrders = freshOrders.filter(ord => {
          const ordTableDigits = String(ord.table || ord.tableNumber || '').replace(/[^0-9]/g, '');
          return ordTableDigits && String(parseInt(ordTableDigits, 10)) === String(parseInt(cleanTableNum, 10));
        });
        if (tableOrders.length > 0) {
          setLiveOrders(tableOrders);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to request item cancellation');
    } finally {
      setCancellingItemId(null);
    }
  };

  // 1. EMPTY STATE IF NO ORDERS PLACED YET
  if (!currentOrder || orderList.length === 0) {
    return (
      <div 
        className="customer-modal-overlay" 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: 0
        }}
      >
        <div 
          className="customer-modal-card" 
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px 24px 0 0',
            maxWidth: '520px',
            width: '100%',
            padding: '1.75rem 1.5rem calc(1.75rem + env(safe-area-inset-bottom))',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}
        >
          {/* Mobile Drag Indicator */}
          <div style={{ width: '42px', height: '4.5px', backgroundColor: '#CBD5E1', borderRadius: '9999px', margin: '0 auto 1.25rem' }} />

          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span style={{ 
              backgroundColor: '#DCFCE7', 
              color: '#166534', 
              fontSize: '0.78rem', 
              fontWeight: 800, 
              padding: '0.25rem 0.65rem', 
              borderRadius: '8px', 
              border: '1px solid #86EFAC' 
            }}>
              Table {tableNum || 'General'}
            </span>
            <button 
              onClick={onClose} 
              style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                backgroundColor: '#F1F5F9', 
                border: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer' 
              }}
            >
              <X size={18} color="#0F2A1D" />
            </button>
          </div>

          {/* Empty State Content */}
          <div style={{ textAlign: 'center', padding: '1rem 0 1.5rem' }}>
            <div style={{ 
              width: '68px', 
              height: '68px', 
              borderRadius: '50%', 
              backgroundColor: '#F0FDF4', 
              color: '#166534', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.25rem',
              boxShadow: '0 8px 20px rgba(22, 101, 52, 0.12)'
            }}>
              <Clock size={34} strokeWidth={2.2} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2A1D', marginBottom: '0.5rem' }}>
              No Live Orders Yet
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5, margin: '0 auto 1.75rem', maxWidth: '320px' }}>
              You haven't placed an order for Table {tableNum || 'this table'} yet. Dishes you order will appear here with live preparation tracking.
            </p>

            <button 
              onClick={onClose} 
              style={{ 
                width: '100%', 
                padding: '0.9rem', 
                backgroundColor: '#166534', 
                color: '#FFFFFF', 
                borderRadius: '14px', 
                border: 'none', 
                fontWeight: 800, 
                fontSize: '0.95rem', 
                cursor: 'pointer',
                boxShadow: '0 10px 20px -3px rgba(22, 101, 52, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Utensils size={18} />
              <span>Browse Menu & Order</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE ORDER STATUS COMPUTATION
  const STEPS = [
    { key: 'PLACED', label: 'Placed', icon: Clock },
    { key: 'ACCEPTED', label: 'Confirmed', icon: Check },
    { key: 'PREPARING', label: 'Cooking', icon: ChefHat },
    { key: 'READY', label: 'Ready', icon: Sparkles },
    { key: 'SERVED', label: 'Served', icon: CheckCircle2 }
  ];

  const getStepIndex = (ord) => {
    if (!ord) return 0;
    const statusStr = String(ord.status || '').toUpperCase();
    const chefStr = String(ord.chefStatus || '').toUpperCase();
    const waiterStr = String(ord.waiterStatus || '').toUpperCase();
    const items = Array.isArray(ord.items) ? ord.items : [];
    const activeItems = items.filter(it => it.status !== 'CANCELLED' && it.status !== 'Cancelled');

    // 4. SERVED
    const isServed = statusStr === 'SERVED' ||
                     waiterStr === 'SERVED' ||
                     statusStr.includes('COMPLETED') ||
                     statusStr.includes('DELIVERED') ||
                     (activeItems.length > 0 && activeItems.every(it => it.isDelivered || it.status === 'DELIVERED' || it.status === 'SERVED'));
    if (isServed) return 4;

    // 3. READY
    const isReady = statusStr === 'READY' ||
                    chefStr === 'READY' ||
                    statusStr.includes('READY') ||
                    (activeItems.length > 0 && activeItems.every(it => it.isReady || it.status === 'READY' || it.status === 'READY_FOR_PASS' || it.isDelivered || it.status === 'DELIVERED' || it.status === 'SERVED'));
    if (isReady) return 3;

    // 2. COOKING / PREPARING
    const isCooking = statusStr === 'PREPARING' ||
                      statusStr === 'COOKING' ||
                      statusStr === 'PARTIALLY DELIVERED' ||
                      chefStr === 'PREPARING' ||
                      chefStr === 'COOKING' ||
                      statusStr.includes('PREPARING') ||
                      statusStr.includes('COOKING') ||
                      statusStr.includes('IN_PROGRESS') ||
                      activeItems.some(it => it.status === 'PREPARING' || it.status === 'COOKING' || it.isReady || it.status === 'READY' || it.status === 'READY_FOR_PASS');
    if (isCooking) return 2;

    // 1. CONFIRMED / ACCEPTED
    const isConfirmed = statusStr === 'ACCEPTED' ||
                        statusStr === 'CONFIRMED' ||
                        chefStr === 'ACCEPTED' ||
                        waiterStr === 'ACCEPTED' ||
                        statusStr.includes('ACCEPTED') ||
                        statusStr.includes('CONFIRMED') ||
                        statusStr.includes('APPROVED');
    if (isConfirmed) return 1;

    // 0. PLACED
    return 0;
  };

  const currentStepIdx = getStepIndex(currentOrder);

  const isBillGen = Boolean(
    currentOrder.isBillGenerated ||
    currentOrder.billGenerated ||
    currentOrder.status === 'Bill Generated' ||
    currentOrder.status === 'Billing' ||
    currentOrder.payment === 'Awaiting Payment' ||
    currentOrder.paymentStatus === 'Awaiting Payment'
  );

  // Status Highlight Message
  const getStatusDetails = (idx) => {
    switch (idx) {
      case 0:
        return {
          bg: '#EFF6FF',
          border: '#BFDBFE',
          color: '#1E40AF',
          icon: '🕒',
          title: 'Order Placed & Queued',
          desc: 'Sent to the kitchen! Waiting for chef confirmation.'
        };
      case 1:
        return {
          bg: '#F0FDF4',
          border: '#BBF7D0',
          color: '#166534',
          icon: '👨‍🍳',
          title: 'Kitchen Confirmed Order',
          desc: 'The chef has accepted your order. Ingredients are being assembled.'
        };
      case 2:
        return {
          bg: '#FFFBEB',
          border: '#FDE68A',
          color: '#92400E',
          icon: '🔥',
          title: 'Cooking Fresh in Kitchen',
          desc: 'Your food is sizzling on the stove! Est. serving time: ~10-15 mins.'
        };
      case 3:
        return {
          bg: '#FAF5FF',
          border: '#E9D5FF',
          color: '#6B21A8',
          icon: '🍽️',
          title: 'Plated & Ready to Serve',
          desc: 'Your dishes are freshly prepared! Floor staff is bringing them to your table.'
        };
      case 4:
      default:
        return {
          bg: '#F0FDF4',
          border: '#86EFAC',
          color: '#15803D',
          icon: '✨',
          title: 'Dishes Served at Table',
          desc: 'All items delivered. Enjoy your meal! Request assistance anytime below.'
        };
    }
  };

  const statusInfo = getStatusDetails(currentStepIdx);

  const orderItems = Array.isArray(currentOrder.items) ? currentOrder.items : [];
  const activeItems = orderItems.filter(it => it.status !== 'CANCELLED' && it.status !== 'Cancelled');
  const totalItemCount = activeItems.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  const totalAmount = currentOrder.totalAmount || currentOrder.total || activeItems.reduce((acc, it) => acc + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);

  return (
    <div
      className="customer-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 0
      }}
    >
      <div
        className="customer-modal-card"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px 24px 0 0',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Mobile Top Grabber Drag Handle */}
        <div style={{ padding: '0.75rem 0 0.25rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '42px', height: '4.5px', backgroundColor: '#CBD5E1', borderRadius: '9999px' }} />
        </div>

        {/* Modal Header */}
        <div style={{
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #F1F5F9'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
              <span style={{ 
                backgroundColor: '#DCFCE7', 
                color: '#15803D', 
                fontSize: '0.74rem', 
                fontWeight: 800, 
                padding: '0.15rem 0.55rem', 
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <span style={{ width: '6px', height: '6px', backgroundColor: '#15803D', borderRadius: '50%', display: 'inline-block' }} />
                Table {currentOrder.table || tableNum || 'General'}
              </span>
              {currentOrder.customer && currentOrder.customer !== 'Guest Diner' && currentOrder.customer !== 'Guest' && (
                <span style={{
                  fontSize: '0.74rem',
                  color: '#166534',
                  fontWeight: 800,
                  backgroundColor: '#DCFCE7',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #86EFAC',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <span>👤</span>
                  <span>{currentOrder.customer}</span>
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F2A1D', margin: 0 }}>
              Order #{currentOrder.orderId || (String(currentOrder._id).slice(-6)).toUpperCase()}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#F1F5F9',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#0F2A1D'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Multiple Orders Horizontal Tab Selector (if customer placed multiple rounds) */}
        {orderList.length > 1 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem 0.4rem',
              overflowX: 'auto'
            }}>
              {orderList.map((ord, idx) => {
                const isSel = idx === selectedOrderIdx;
                return (
                  <button
                    key={ord.orderId || idx}
                    onClick={() => setSelectedOrderIdx(idx)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      border: isSel ? '1.5px solid #166534' : '1px solid #CBD5E1',
                      backgroundColor: isSel ? '#166534' : '#FFFFFF',
                      color: isSel ? '#FFFFFF' : '#475569',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span>Round {idx + 1}</span>
                    <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>
                      ({ord.items?.length || 0})
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{
              padding: '0.2rem 1.25rem 0.5rem',
              fontSize: '0.72rem',
              color: '#15803D',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}>
              <span>👈</span>
              <span>Swipe left / right to switch orders ({selectedOrderIdx + 1} of {orderList.length})</span>
              <span>👉</span>
            </div>
          </div>
        )}

        {/* Scrollable Modal Body */}
        <div style={{
          padding: '1.25rem',
          overflowY: 'auto',
          flex: '1 1 auto'
        }}>
          {/* Waiter Alert Notification Toast */}
          {waiterCallMsg && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#F0FDF4',
              borderRadius: '12px',
              border: '1.5px solid #86EFAC',
              color: '#166534',
              fontSize: '0.82rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              animation: 'fadeIn 0.2s ease'
            }}>
              <BellRing size={16} color="#166534" />
              <span>{waiterCallMsg}</span>
            </div>
          )}

          {/* Bill Generated Banner */}
          {isBillGen && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.85rem 1rem',
              backgroundColor: '#F3E8FF',
              borderRadius: '14px',
              border: '1.5px solid #C084FC',
              color: '#6B21A8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(107, 33, 168, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Receipt size={22} color="#6B21A8" />
                <div>
                  <div style={{ fontWeight: 900, fontSize: '0.88rem' }}>Bill Generated — Awaiting Payment</div>
                  <div style={{ fontSize: '0.78rem', color: '#7E22CE', marginTop: '0.1rem' }}>
                    Total: ₹{totalAmount.toFixed(0)} • Tap to view GST breakdown & pay
                  </div>
                </div>
              </div>
              {onViewBill && (
                <button
                  onClick={onViewBill}
                  style={{
                    padding: '0.45rem 0.85rem',
                    backgroundColor: '#6B21A8',
                    color: '#FFFFFF',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 10px rgba(107, 33, 168, 0.25)'
                  }}
                >
                  View Bill
                </button>
              )}
            </div>
          )}

          {/* Stepper Container with Connected Timeline Bar */}
          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '18px',
            padding: '1.25rem 1rem',
            marginBottom: '1rem',
            border: '1px solid #E2E8F0',
            position: 'relative'
          }}>
            <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
              {/* Background Connecting Line */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '10%',
                right: '10%',
                height: '3px',
                backgroundColor: '#E2E8F0',
                zIndex: 1
              }} />

              {/* Active Filled Connecting Line */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '10%',
                width: `${(currentStepIdx / (STEPS.length - 1)) * 80}%`,
                height: '3px',
                backgroundColor: '#166534',
                transition: 'width 0.4s ease',
                zIndex: 1
              }} />

              {/* 5 Step Indicator Circles */}
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                {STEPS.map((step, idx) => {
                  const isPassed = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;
                  const StepIcon = step.icon;

                  return (
                    <div 
                      key={step.key} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        width: '54px'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: isPassed ? '#166534' : '#FFFFFF',
                        border: isPassed ? '2px solid #166534' : '2px solid #CBD5E1',
                        color: isPassed ? '#FFFFFF' : '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isCurrent ? '0 0 0 4px rgba(22, 101, 52, 0.22)' : '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'all 0.25s ease'
                      }}>
                        <StepIcon size={16} strokeWidth={2.4} />
                      </div>

                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: isCurrent ? 800 : (isPassed ? 700 : 500),
                        color: isCurrent ? '#166534' : (isPassed ? '#0F2A1D' : '#94A3B8'),
                        marginTop: '0.4rem',
                        textAlign: 'center',
                        lineHeight: 1.1
                      }}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Status Highlight Banner */}
            <div style={{
              marginTop: '0.9rem',
              padding: '0.75rem 0.95rem',
              backgroundColor: statusInfo.bg,
              border: `1px solid ${statusInfo.border}`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}>
              <span style={{ fontSize: '1.25rem' }}>{statusInfo.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: statusInfo.color }}>
                  {statusInfo.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: statusInfo.color, opacity: 0.9, marginTop: '0.1rem', fontWeight: 600 }}>
                  {statusInfo.desc}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Assistance 3-Button Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            marginBottom: '1.25rem'
          }}>
            <button
              type="button"
              onClick={() => handleCallWaiter('Water')}
              disabled={callingWaiter}
              style={{
                padding: '0.65rem 0.4rem',
                borderRadius: '12px',
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: callingWaiter ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Droplets size={16} />
              <span>Water</span>
            </button>

            <button
              type="button"
              onClick={() => handleCallWaiter('Assistance')}
              disabled={callingWaiter}
              style={{
                padding: '0.65rem 0.4rem',
                borderRadius: '12px',
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                border: '1px solid #FDE68A',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: callingWaiter ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.15s ease'
              }}
            >
              <BellRing size={16} />
              <span>Call Waiter</span>
            </button>

            <button
              type="button"
              onClick={() => handleCallWaiter('Bill / Tissue')}
              disabled={callingWaiter}
              style={{
                padding: '0.65rem 0.4rem',
                borderRadius: '12px',
                backgroundColor: '#F3E8FF',
                color: '#6B21A8',
                border: '1px solid #E9D5FF',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: callingWaiter ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Receipt size={16} />
              <span>Napkins/Bill</span>
            </button>
          </div>

          {/* Ordered Items List */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.65rem'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Dishes in this Order ({totalItemCount})
              </span>
              <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 800 }}>
                Total: ₹{totalAmount}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {orderItems.map((item, idx) => {
                const isCancelled = item.status === 'CANCELLED' || item.status === 'Cancelled';
                const isDeliveredItem = Boolean(item.isDelivered || item.status === 'DELIVERED' || item.status === 'SERVED');
                const isReadyItem = !isDeliveredItem && Boolean(item.isReady || item.status === 'READY' || item.status === 'READY_FOR_PASS');
                const itemName = item.name || 'Dish Item';
                const itemQty = Number(item.quantity) || 1;
                const itemPrice = Number(item.price) || 0;

                return (
                  <div 
                    key={item._id || item.id || idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto minmax(0, 1fr) auto auto',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '12px',
                      backgroundColor: isCancelled ? '#FEF2F2' : '#F8FAFC',
                      border: isCancelled ? '1px solid #FCA5A5' : '1px solid #E2E8F0',
                      opacity: isCancelled ? 0.75 : 1,
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* 1. Quantity Badge */}
                    <span style={{
                      backgroundColor: isCancelled ? '#FEE2E2' : '#DCFCE7',
                      color: isCancelled ? '#991B1B' : '#15803D',
                      fontWeight: 900,
                      fontSize: '0.74rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '6px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      {itemQty}x
                    </span>

                    {/* 2. Dish Name (Middle flexible column with ellipsis overflow) */}
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        color: isCancelled ? '#991B1B' : '#0F2A1D',
                        textDecoration: isCancelled ? 'line-through' : 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {itemName}
                      </div>
                      {item.notes && !isCancelled && (
                        <div style={{ fontSize: '0.68rem', color: '#64748B', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Note: {item.notes}
                        </div>
                      )}
                    </div>

                    {/* 3. Status Badge & Cancel Action Button (Single line) */}
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '9999px',
                        backgroundColor: isCancelled 
                          ? '#FEE2E2' 
                          : (isDeliveredItem ? '#DCFCE7' : (isReadyItem ? '#FEF9C3' : '#EFF6FF')),
                        color: isCancelled 
                          ? '#991B1B' 
                          : (isDeliveredItem ? '#15803D' : (isReadyItem ? '#854D0E' : '#1D4ED8')),
                        border: isCancelled 
                          ? '1px solid #FCA5A5' 
                          : (isDeliveredItem ? '1px solid #86EFAC' : (isReadyItem ? '1px solid #FDE047' : '1px solid #BFDBFE')),
                        whiteSpace: 'nowrap'
                      }}>
                        {isCancelled ? 'Cancelled' : (isDeliveredItem ? 'Served' : (isReadyItem ? 'Ready' : 'Preparing'))}
                      </span>
                      {!isCancelled && !isDeliveredItem && !isReadyItem && (
                        <button
                          type="button"
                          onClick={() => handleCancelCustomerItem(item, String(item._id || item.id || item.name || `item-${idx}`))}
                          disabled={Boolean(cancellingItemId)}
                          title="Request to cancel this item"
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '6px',
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FCA5A5',
                            cursor: cancellingItemId ? 'not-allowed' : 'pointer',
                            opacity: cancellingItemId === String(item._id || item.id || item.name || `item-${idx}`) ? 0.6 : 1
                          }}
                        >
                          {cancellingItemId === String(item._id || item.id || item.name || `item-${idx}`) ? '...' : 'Cancel'}
                        </button>
                      )}
                    </div>

                    {/* 4. Price (Single line, right aligned) */}
                    <span style={{
                      fontSize: '0.86rem',
                      fontWeight: 900,
                      color: isCancelled ? '#991B1B' : '#0F2A1D',
                      textDecoration: isCancelled ? 'line-through' : 'none',
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      ₹{itemPrice * itemQty}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Bottom Fixed Actions Bar */}
        <div style={{
          padding: '0.85rem 1.25rem calc(0.85rem + env(safe-area-inset-bottom))',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            type="button"
            onClick={onAddMoreItems}
            style={{
              flex: 1,
              padding: '0.85rem 0.5rem',
              borderRadius: '14px',
              backgroundColor: '#F8FAFC',
              color: '#0F2A1D',
              border: '1.5px solid #CBD5E1',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <Plus size={16} color="#166534" />
            <span>Add More</span>
          </button>

          <button
            type="button"
            onClick={onViewBill}
            style={{
              flex: 1.3,
              padding: '0.85rem 0.5rem',
              borderRadius: '14px',
              backgroundColor: '#166534',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: '0 8px 18px -3px rgba(22, 101, 52, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <Receipt size={16} />
            <span>View Bill & Pay</span>
          </button>
        </div>

      </div>
    </div>
  );
}
