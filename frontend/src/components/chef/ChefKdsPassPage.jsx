import React from 'react';
import { formatTableNumber } from '../../utils/orderUtils';
import {
  ChefHat, Clock, CheckCircle2, AlertCircle, Flame, Utensils, CheckSquare, Square, Check, Eye
} from 'lucide-react';

export default function ChefKdsPassPage({
  activeKdsOrders,
  getElapsedMins,
  checkedDishItems,
  handleToggleItemCheck,
  handleUpdateStatus,
  setSelectedTicketModal
}) {
  const [kdsSettings, setKdsSettings] = React.useState(() => {
    try {
      const saved = localStorage.getItem('flavora_chef_settings');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('flavora_chef_settings');
        if (saved) setKdsSettings(JSON.parse(saved));
      } catch (e) { }
    };
    window.addEventListener('flavora_settings_updated', handleUpdate);
    return () => window.removeEventListener('flavora_settings_updated', handleUpdate);
  }, []);

  const overdueLimit = Number(kdsSettings.overdueThreshold) || 20;
  const isCompact = kdsSettings.ticketLayout === 'compact';
  const isHighContrast = Boolean(kdsSettings.highContrastMode);

  if (activeKdsOrders.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '4rem 2rem',
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        maxWidth: '600px',
        margin: '2rem auto'
      }}>
        <ChefHat size={54} color="#CBD5E1" style={{ display: 'block', margin: '0 auto 1rem auto' }} />
        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
          No Active Tickets in Kitchen Queue
        </h3>
        <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
          All orders have been prepared and dispatched. New QR orders will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isCompact ? 'repeat(auto-fill, minmax(210px, 1fr))' : 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: isCompact ? '0.75rem' : '1.25rem'
    }}>
      {activeKdsOrders.map(ord => {
        const elapsedMins = getElapsedMins(ord.createdAt);
        const isOverdue = elapsedMins > overdueLimit;
        const isWarning = elapsedMins >= Math.floor(overdueLimit / 2) && elapsedMins <= overdueLimit;
        const isReady = ord.status === 'Ready';

        return (
          <div
            key={ord.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: isCompact ? '12px' : '18px',
              border: isHighContrast ? '2px solid #000000' : (isReady ? '2px solid #22C55E' : (isOverdue ? '2px solid #EF4444' : '1px solid #E2E8F0')),
              boxShadow: isOverdue ? '0 8px 30px rgba(239, 68, 68, 0.15)' : '0 6px 20px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden'
            }}
          >
            {/* Ticket Card Header */}
            <div style={{
              backgroundColor: isReady ? '#DCFCE7' : (isOverdue ? '#FEE2E2' : '#F8FAFC'),
              padding: isCompact ? '0.5rem 0.75rem' : '0.85rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #E2E8F0'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: isCompact ? '0.95rem' : '1.1rem', fontWeight: 900, color: isHighContrast ? '#000000' : '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
                    {formatTableNumber(ord.table || ord.tableNumber)}
                  </span>
                  <span style={{ fontSize: '0.68rem', backgroundColor: '#0F2A1D', color: '#FFFFFF', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>
                    {ord.type}
                  </span>
                </div>
                <div style={{ fontSize: isCompact ? '0.68rem' : '0.74rem', color: isHighContrast ? '#000000' : '#64748B', marginTop: '0.1rem', fontWeight: isHighContrast ? 800 : 600 }}>
                  Ticket {ord.id} • {ord.time}
                </div>
              </div>

              {/* Prep Timer Badge */}
              <div style={{
                backgroundColor: isReady ? '#166534' : (isOverdue ? '#DC2626' : (isWarning ? '#D97706' : '#059669')),
                color: '#FFFFFF',
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontFamily: 'monospace'
              }}>
                <Clock size={13} />
                <span>{elapsedMins}m elapsed</span>
              </div>
            </div>

            {/* Ticket Body: Itemized Dish List */}
            <div style={{ padding: '1rem 1.15rem', flex: 1 }}>
              {/* Guest / Waiter Notes Callout */}
              {ord.notes && (
                <div style={{
                  backgroundColor: '#FFF3EB',
                  border: '1px solid #FDBA74',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  marginBottom: '0.85rem',
                  fontSize: '0.78rem',
                  color: '#C2410C',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.4rem'
                }}>
                  <AlertCircle size={14} color="#EA580C" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#EA580C' }}>Chef Note:</strong> {ord.notes}
                  </div>
                </div>
              )}

              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', marginBottom: '0.5rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                DISHES TO PREPARE ({ord.items.length})
              </div>

              {/* Dish List with Checkbox Strikeout & Status Badges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {ord.items.map((item, idx) => {
                  const cleanId = String(ord.id || ord.orderId || '').replace(/^#/i, '').trim();
                  const isOrderReadyOverall = ord.status === 'Ready' || ord.status === 'Served' || ord.status === 'Completed' || ord.status === 'Paid';
                  const isDelivered = item.isDelivered || item.status === 'SERVED' || item.status === 'DELIVERED';
                  const isCheckedInMap = Boolean(checkedDishItems[ord.id]?.[idx] || checkedDishItems[cleanId]?.[idx] || checkedDishItems[`#${cleanId}`]?.[idx]);
                  const isReady = !isDelivered && (isOrderReadyOverall || item.isReady || item.status === 'READY' || isCheckedInMap);
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => !isDelivered && handleToggleItemCheck(ord.id, idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.75rem',
                        backgroundColor: isDelivered ? '#F1F5F9' : (isReady ? '#F0FDF4' : '#F8FAFC'),
                        borderRadius: '8px',
                        border: isDelivered ? '1px solid #CBD5E1' : (isReady ? '1.5px solid #86EFAC' : '1px solid #E2E8F0'),
                        cursor: isDelivered ? 'default' : 'pointer',
                        opacity: isDelivered ? 0.65 : 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {isDelivered ? (
                          <CheckCircle2 size={17} color="#64748B" />
                        ) : isReady ? (
                          <CheckSquare size={17} color="#166534" />
                        ) : (
                          <Square size={17} color="#94A3B8" />
                        )}
                        <span style={{
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          color: isDelivered ? '#64748B' : (isReady ? '#166534' : '#0F2A1D'),
                          textDecoration: isDelivered ? 'line-through' : 'none'
                        }}>
                          <strong style={{ color: isDelivered ? '#64748B' : '#E07A3C', marginRight: '0.4rem' }}>{item.quantity || item.qty || 1}x</strong>
                          {item.name}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 900,
                          backgroundColor: isDelivered ? '#E2E8F0' : (isReady ? '#BBF7D0' : '#FFEDD5'),
                          color: isDelivered ? '#475569' : (isReady ? '#166534' : '#C2410C'),
                          padding: '0.15rem 0.45rem',
                          borderRadius: '5px'
                        }}>
                          {isDelivered ? '✓ SERVED' : (isReady ? '✓ READY' : 'PREPARING')}
                        </span>

                        {item.price && (
                          <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                            ₹{item.price * (item.quantity || 1)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ticket Footer Action Controls */}
            <div style={{ padding: '0.85rem 1.15rem', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '0.6rem' }}>
              {(ord.status === 'Placed' || ord.status === 'NEW' || !ord.status) ? (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(ord.id, 'Preparing')}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#E07A3C',
                    color: '#FFFFFF',
                    fontSize: '0.86rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 4px 12px rgba(224, 122, 60, 0.35)'
                  }}
                >
                  <Flame size={18} />
                  <span>🔥 Start Cooking</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(ord.id, 'Ready')}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#166534',
                    color: '#FFFFFF',
                    fontSize: '0.86rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 4px 12px rgba(22, 101, 52, 0.4)'
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>✅ Mark Ready for Pass</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedTicketModal(ord)}
                title="View Full Ticket Details"
                style={{
                  padding: '0.7rem',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#0F2A1D',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Eye size={18} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
