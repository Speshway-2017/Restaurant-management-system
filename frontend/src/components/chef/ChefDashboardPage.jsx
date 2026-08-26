import React from 'react';
import {
  ChefHat, Clock, CheckCircle2, AlertCircle, Flame, Utensils, CheckSquare, Square, Check, Eye
} from 'lucide-react';

export default function ChefKdsPassPage({
  activeKdsOrders,
  getElapsedMins,
  checkedDishItems,
  handleToggleItemCheck,
  handleUpdateStatus,
  handleMarkAllItemsReadyForOrder,
  showToast,
  setSelectedTicketModal
}) {
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
  const getItemCheckedMap = (order) => {
    if (!order) return {};
    const rawTable = order.table || order.tableNumber || '';
    const cleanTableNum = String(rawTable).replace(/^Table\s+/i, '').trim();
    const orderIdClean = order.orderId ? String(order.orderId).replace(/^#/i, '').trim() : '';
    const idClean = order.id ? String(order.id).replace(/^#/i, '').trim() : '';

    const mapFromStorage = (
      checkedDishItems[order.orderId] ||
      checkedDishItems[`#${order.orderId}`] ||
      checkedDishItems[orderIdClean] ||
      checkedDishItems[`#${orderIdClean}`] ||
      checkedDishItems[order.id] ||
      checkedDishItems[`#${order.id}`] ||
      checkedDishItems[idClean] ||
      checkedDishItems[`#${idClean}`] ||
      checkedDishItems[order._id] ||
      checkedDishItems[order.table] ||
      checkedDishItems[cleanTableNum] ||
      checkedDishItems[`Table ${cleanTableNum}`] ||
      {}
    );

    const merged = { ...mapFromStorage };
    if (Array.isArray(order.items)) {
      order.items.forEach((it, idx) => {
        if (it.isReady || it.status === 'READY' || it.isDelivered || it.status === 'DELIVERED') merged[idx] = true;
      });
    }
    return merged;
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
      gap: '1.25rem'
    }}>
      {activeKdsOrders.map(ord => {
        const elapsedMins = getElapsedMins(ord.createdAt);
        const isOverdue = elapsedMins > 20;
        const isWarning = elapsedMins >= 10 && elapsedMins <= 20;
        
        const totalItemsCount = Array.isArray(ord.items) ? ord.items.length : 0;
        const orderCheckedMap = getItemCheckedMap(ord);
        const checkedCount = Object.keys(orderCheckedMap).filter(k => orderCheckedMap[k]).length;
        
        const isAllChecked = totalItemsCount > 0 && checkedCount === totalItemsCount;
        const isPartialChecked = checkedCount > 0 && checkedCount < totalItemsCount;
        const isReady = ord.status === 'Ready' || isAllChecked;

        return (
          <div
            key={ord.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              border: isReady 
                ? '2px solid #22C55E' 
                : (isPartialChecked ? '2px solid #F59E0B' : (isOverdue ? '2px solid #EF4444' : '1px solid #E2E8F0')),
              boxShadow: isOverdue ? '0 8px 30px rgba(239, 68, 68, 0.15)' : '0 6px 20px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden'
            }}
          >
            {/* Ticket Card Header */}
            <div style={{
              backgroundColor: isReady 
                ? '#DCFCE7' 
                : (isPartialChecked ? '#FEF3C7' : (isOverdue ? '#FEE2E2' : '#F8FAFC')),
              padding: '0.85rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #E2E8F0'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
                    {ord.table}
                  </span>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#0F2A1D', color: '#FFFFFF', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                    {ord.type}
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.15rem' }}>
                  Ticket {ord.id} • {ord.time}
                </div>
              </div>

              {/* Prep Timer & Readiness Badge */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                <div style={{
                  backgroundColor: isReady ? '#166534' : (isOverdue ? '#DC2626' : (isWarning ? '#D97706' : '#059669')),
                  color: '#FFFFFF',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontFamily: 'monospace'
                }}>
                  <Clock size={12} />
                  <span>{elapsedMins}m elapsed</span>
                </div>

                {isPartialChecked && !isReady && (
                  <span style={{ fontSize: '0.68rem', backgroundColor: '#D97706', color: '#FFFFFF', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 900 }}>
                    🟠 Partial Ready ({checkedCount}/{totalItemsCount})
                  </span>
                )}
              </div>
            </div>

            {/* Ticket Body: Itemized Dish List */}
            <div style={{ padding: '1rem 1.15rem', flex: 1 }}>
              {/* Chef Notes Callout */}
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  DISHES TO PREPARE ({checkedCount}/{totalItemsCount} READY)
                </span>
                {checkedCount > 0 && checkedCount < totalItemsCount && (
                  <span style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 800 }}>
                    {totalItemsCount - checkedCount} Still Cooking
                  </span>
                )}
              </div>

              {/* Dish List with Checkbox Strikeout & Readiness Status Pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {ord.items.map((item, idx) => {
                  const isChecked = Boolean(orderCheckedMap[idx]);

                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleItemCheck(ord.id, idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.8rem',
                        backgroundColor: isChecked ? '#DCFCE7' : '#FFF7ED',
                        borderRadius: '10px',
                        border: isChecked ? '1.5px solid #86EFAC' : '1.5px solid #FED7AA',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {isChecked ? (
                          <CheckCircle2 size={18} color="#166534" />
                        ) : (
                          <Flame size={18} color="#EA580C" />
                        )}
                        <span style={{
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          color: isChecked ? '#166534' : '#0F2A1D',
                          textDecoration: isChecked ? 'line-through' : 'none'
                        }}>
                          <strong style={{ color: isChecked ? '#15803D' : '#E07A3C', marginRight: '0.4rem' }}>{item.quantity || item.qty || 1}x</strong>
                          {item.name}
                        </span>
                      </div>

                      <div>
                        {isChecked ? (
                          <span style={{ fontSize: '0.7rem', backgroundColor: '#166534', color: '#FFFFFF', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                            🟢 READY
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', backgroundColor: '#EA580C', color: '#FFFFFF', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                            🔥 COOKING
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ticket Footer Action Controls */}
            <div style={{ padding: '0.85rem 1.15rem', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {ord.status === 'Placed' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(ord.id, 'Preparing')}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#E07A3C',
                    color: '#FFFFFF',
                    fontSize: '0.84rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(224, 122, 60, 0.3)'
                  }}
                >
                  <Flame size={16} />
                  <span>🔥 Start Cooking Ticket</span>
                </button>
              )}

              {ord.status === 'Preparing' && (
                <>
                  {isPartialChecked && (
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateStatus(ord.id, 'Preparing');
                        if (showToast) showToast(`🟡 Ticket ${ord.id}: ${checkedCount}/${totalItemsCount} Items Ready! Remaining ${totalItemsCount - checkedCount} items still cooking.`);
                      }}
                      style={{
                        flex: 1,
                        padding: '0.65rem',
                        borderRadius: '10px',
                        border: '1px solid #F59E0B',
                        backgroundColor: '#FEF3C7',
                        color: '#B45309',
                        fontSize: '0.82rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                      title="Keep remaining unselected items cooking"
                    >
                      <Clock size={15} color="#B45309" />
                      <span>Ready ({checkedCount}/{totalItemsCount}) • {totalItemsCount - checkedCount} Cooking</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (handleMarkAllItemsReadyForOrder) {
                        handleMarkAllItemsReadyForOrder(ord.id);
                      } else {
                        handleUpdateStatus(ord.id, 'Ready');
                      }
                    }}
                    style={{
                      flex: isPartialChecked ? 'none' : 1,
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: '#166534',
                      color: '#FFFFFF',
                      fontSize: '0.84rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 12px rgba(22, 101, 52, 0.4)'
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{isAllChecked ? '✅ Ticket Ready for Pass' : '⚡ Mark ALL Ready'}</span>
                  </button>
                </>
              )}

              {ord.status === 'Ready' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(ord.id, 'Served')}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '10px',
                    border: '1px solid #86EFAC',
                    backgroundColor: '#DCFCE7',
                    color: '#166534',
                    fontSize: '0.84rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Check size={16} />
                  <span>Dispatched / Served</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedTicketModal(ord)}
                title="View Full Ticket Details"
                style={{
                  padding: '0.65rem',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#0F2A1D',
                  cursor: 'pointer'
                }}
              >
                <Eye size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
