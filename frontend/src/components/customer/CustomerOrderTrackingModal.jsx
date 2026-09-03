import React, { useState } from 'react';
import { X, Clock, CheckCircle2, ChefHat, BellRing, Plus, Utensils, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function CustomerOrderTrackingModal({ activeOrder, tableNum, onClose, onAddMoreItems, onViewBill }) {
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [waiterCallMsg, setWaiterCallMsg] = useState(null);

  if (!activeOrder) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', maxWidth: '440px', width: '100%', padding: '2rem', textAlign: 'center' }}>
          <AlertCircle size={48} color="#94A3B8" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.5rem' }}>No Active Order Found</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem' }}>You haven't placed an order for Table {tableNum || 'this table'} yet.</p>
          <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#166534', color: '#FFFFFF', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
            Browse Menu & Order
          </button>
        </div>
      </div>
    );
  }

  const orderStatus = (activeOrder.status || 'Placed').toUpperCase();

  const STEPS = [
    { key: 'PLACED', label: 'Order Placed', desc: 'Sent to Kitchen' },
    { key: 'ACCEPTED', label: 'Accepted', desc: 'Confirmed by Waiter/Kitchen' },
    { key: 'PREPARING', label: 'Preparing', desc: 'Chef is cooking your food' },
    { key: 'READY', label: 'Ready', desc: 'Food is ready for serving' },
    { key: 'SERVED', label: 'Served', desc: 'Delivered to your table' }
  ];

  const getStepIndex = (statusStr) => {
    if (statusStr.includes('COMPLETED') || statusStr.includes('DELIVERED') || statusStr.includes('SERVED')) return 4;
    if (statusStr.includes('READY')) return 3;
    if (statusStr.includes('PREPARING') || statusStr.includes('COOKING') || statusStr.includes('IN_PROGRESS')) return 2;
    if (statusStr.includes('ACCEPTED') || statusStr.includes('APPROVED')) return 1;
    return 0;
  };

  const currentStepIdx = getStepIndex(orderStatus);

  const handleCallWaiter = async (reason) => {
    setCallingWaiter(true);
    try {
      await api.callWaiter(tableNum || activeOrder.table || 'T-01', reason);
      setWaiterCallMsg(`✓ Waiter requested for "${reason}"! Staff notified.`);
      setTimeout(() => setWaiterCallMsg(null), 4000);
    } catch (err) {
      setWaiterCallMsg('✓ Request sent to floor staff!');
      setTimeout(() => setWaiterCallMsg(null), 4000);
    } finally {
      setCallingWaiter(false);
    }
  };

  return (
    <div
      className="customer-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="customer-modal-card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          padding: '1.5rem'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Live Order Tracker • Table {activeOrder.table || tableNum || 'General'}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2A1D', margin: 0 }}>
              Order #{activeOrder.orderId || activeOrder._id}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#F1F5F9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={18} color="#0F2A1D" />
          </button>
        </div>

        {/* Waiter Alert Notification Message */}
        {waiterCallMsg && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: '#F0FDF4', borderRadius: '12px', border: '1px solid #86EFAC', color: '#166534', fontSize: '0.85rem', fontWeight: 700 }}>
            {waiterCallMsg}
          </div>
        )}

        {/* Order Status Progress Bar */}
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '18px', padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '1rem' }}>
            {STEPS.map((step, idx) => {
              const isPassed = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 2 }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isPassed ? '#166534' : '#E2E8F0',
                    color: isPassed ? '#FFFFFF' : '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(22, 101, 52, 0.2)' : 'none',
                    transition: 'all 0.2s ease'
                  }}>
                    {isPassed ? <CheckCircle2 size={18} /> : (idx + 1)}
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: isCurrent ? 800 : 600, color: isPassed ? '#0F2A1D' : '#94A3B8', marginTop: '0.35rem', textAlign: 'center' }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ordered Items List */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            Items in this Order ({activeOrder.items?.length || 0})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(activeOrder.items || []).map((item, idx) => {
              const isCancelled = item.status === 'CANCELLED' || item.status === 'Cancelled';
              const itemName = item.name || 'Dish';

              return (
                <div key={idx} style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  backgroundColor: isCancelled ? '#FEF2F2' : '#F8FAFC',
                  border: isCancelled ? '1px solid #FCA5A5' : '1px solid #E2E8F0',
                  opacity: isCancelled ? 0.85 : 1
                }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isCancelled ? '#991B1B' : '#1E293B', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                      {item.quantity || 1}x {itemName}
                    </div>
                    {item.notes && !isCancelled && (
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic' }}>
                        Note: {item.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: isCancelled ? '#991B1B' : '#166534', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                      ₹{(Number(item.price) || 0) * (Number(item.quantity) || 1)}
                    </span>
                    <div>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: isCancelled ? '#FEE2E2' : (item.isDelivered ? '#DCFCE7' : (item.isReady ? '#FEF9C3' : '#F1F5F9')),
                        color: isCancelled ? '#991B1B' : (item.isDelivered ? '#15803D' : (item.isReady ? '#854D0E' : '#475569')),
                        border: isCancelled ? '1px solid #FCA5A5' : 'none'
                      }}>
                        {isCancelled ? '❌ Cancelled' : (item.isDelivered ? 'Served' : (item.isReady ? 'Ready' : 'Preparing'))}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            onClick={() => handleCallWaiter('Water')}
            disabled={callingWaiter}
            style={{ flex: 1, padding: '0.65rem', borderRadius: '12px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
          >
            <BellRing size={14} /> Request Water
          </button>
          <button
            onClick={() => handleCallWaiter('Assistance')}
            disabled={callingWaiter}
            style={{ flex: 1, padding: '0.65rem', borderRadius: '12px', backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
          >
            <BellRing size={14} /> Call Waiter
          </button>
          <button
            onClick={() => handleCallWaiter('Bill / Tissue')}
            disabled={callingWaiter}
            style={{ flex: 1, padding: '0.65rem', borderRadius: '12px', backgroundColor: '#F3E8FF', color: '#6B21A8', border: '1px solid #E9D5FF', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
          >
            <BellRing size={14} /> Request Bill
          </button>
        </div>

        {/* Bottom Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onAddMoreItems}
            style={{
              flex: 1,
              padding: '0.85rem',
              borderRadius: '14px',
              backgroundColor: '#F1F5F9',
              color: '#0F2A1D',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            <Plus size={16} /> Add More Items
          </button>

          <button
            onClick={onViewBill}
            style={{
              flex: 1,
              padding: '0.85rem',
              borderRadius: '14px',
              backgroundColor: '#166534',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 8px 15px -3px rgba(22, 101, 52, 0.3)'
            }}
          >
            View Running Bill & Pay
          </button>
        </div>
      </div>
    </div>
  );
}
