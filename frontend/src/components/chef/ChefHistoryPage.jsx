import React, { useState } from 'react';
import {
  CheckCircle2,
  Search,
  Clock,
  Utensils,
  ChefHat,
  Filter,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { formatTableNumber } from '../../utils/orderUtils';

export default function ChefHistoryPage({
  ordersList = [],
  currentChefId = '',
  currentChefName = ''
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [scopeFilter, setScopeFilter] = useState('MY_ORDERS'); // 'MY_ORDERS' | 'ALL_KITCHEN'

  // Pagination state (10 orders per page, starting on page 1 showing latest 10 orders)
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, scopeFilter]);

  // Resolve current chef identity
  const sessionUser = React.useMemo(() => {
    try {
      const raw = sessionStorage.getItem('flavora_user_data') || localStorage.getItem('flavora_user_data');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }, []);

  const activeChefId = currentChefId || sessionUser?._id || sessionUser?.id || '';
  const activeChefName = currentChefName || sessionUser?.name || '';

  // Determine whether an order belongs to the currently logged in chef
  const isOrderMine = React.useCallback((ord) => {
    if (!ord) return false;
    const ordChefId = String(ord.chefId || '').trim();
    const ordChefName = String(ord.chefName || '').trim().toLowerCase();

    const myId = String(activeChefId || '').trim();
    const myName = String(activeChefName || '').trim().toLowerCase();

    // 1. Direct ID match
    if (myId && ordChefId && (ordChefId === myId || String(ordChefId) === String(myId))) {
      return true;
    }

    // 2. Name match (case-insensitive, ignoring "Chef " prefix if needed)
    if (myName && ordChefName) {
      if (ordChefName === myName) return true;
      const cleanOrd = ordChefName.replace(/^chef\s+/i, '').trim();
      const cleanMy = myName.replace(/^chef\s+/i, '').trim();
      if (cleanOrd && cleanMy && cleanOrd === cleanMy) return true;
    }

    return false;
  }, [activeChefId, activeChefName]);

  // Filter completed kitchen tickets
  const isOrderKitchenDone = (o) => {
    if (o.status === 'Ready' || o.status === 'Served' || o.status === 'Completed' || o.status === 'Paid') {
      return true;
    }
    const items = Array.isArray(o.items) ? o.items : [];
    if (items.length === 0) return false;
    return items.every(i => i && (i.isReady || i.status === 'READY' || i.isDelivered || i.status === 'SERVED' || i.status === 'DELIVERED'));
  };

  // All completed orders in the kitchen
  const allKitchenHistoryOrders = ordersList.filter(isOrderKitchenDone);

  // Completed orders prepared by THIS chef
  const myHistoryOrders = allKitchenHistoryOrders.filter(isOrderMine);

  // Active history orders based on scope selection
  const historyOrders = scopeFilter === 'MY_ORDERS' ? myHistoryOrders : allKitchenHistoryOrders;

  // Sort history orders newest first (most recent timestamp at the top)
  const sortedHistoryOrders = [...historyOrders].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.updatedAt || a.time || 0).getTime();
    const timeB = new Date(b.createdAt || b.updatedAt || b.time || 0).getTime();
    return timeB - timeA;
  });

  // Apply search & type filter
  const filteredOrders = sortedHistoryOrders.filter(ord => {
    // Type filter
    if (typeFilter !== 'ALL' && (ord.type || 'Dine-In').toUpperCase() !== typeFilter) {
      return false;
    }

    // Search filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const ordId = String(ord.orderId || ord.id || ord._id || '').toLowerCase();
    const tableStr = formatTableNumber(ord.table || ord.tableNumber).toLowerCase();
    const customerStr = String(ord.customer || ord.guestName || '').toLowerCase();
    const itemsStr = Array.isArray(ord.items) ? ord.items.map(i => (i.name || i.dishId || '').toLowerCase()).join(' ') : '';
    const chefStr = String(ord.chefName || '').toLowerCase();

    return ordId.includes(q) || tableStr.includes(q) || customerStr.includes(q) || itemsStr.includes(q) || chefStr.includes(q);
  });

  const totalOrders = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalOrders / ordersPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const indexOfLastOrder = validCurrentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const paginatedOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Calculate total dishes prepared count
  const totalDishesCooked = historyOrders.reduce((sum, ord) => {
    const items = Array.isArray(ord.items) ? ord.items : [];
    return sum + items.reduce((iSum, i) => iSum + Number(i.quantity || i.qty || 1), 0);
  }, 0);

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', paddingBottom: '3rem' }}>

      {/* ================= 1. HEADER & BREADCRUMBS ================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div>
          <div className="page-breadcrumb-bar" style={{ marginBottom: '0.35rem' }}>
            <span>Chef</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Orders History</span>
          </div>
          <h1 className="admin-page-title" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
            Orders History
          </h1>
          <p className="admin-page-subtitle" style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: '#64748B', fontWeight: 600 }}>
            {scopeFilter === 'MY_ORDERS' 
              ? `Orders accepted and dispatched by ${activeChefName || 'you'}.`
              : 'Archive of all completed kitchen orders across all stations.'}
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Chef Isolation Scope filter tabs */}
          <div style={{ display: 'flex', backgroundColor: '#FFFFFF', padding: '0.2rem', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <button
              type="button"
              onClick={() => setScopeFilter('MY_ORDERS')}
              style={{
                backgroundColor: scopeFilter === 'MY_ORDERS' ? '#0F2A1D' : 'transparent',
                color: scopeFilter === 'MY_ORDERS' ? '#FFFFFF' : '#475569',
                border: 'none',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              👨‍🍳 My Dispatched ({myHistoryOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('ALL_KITCHEN')}
              style={{
                backgroundColor: scopeFilter === 'ALL_KITCHEN' ? '#0F2A1D' : 'transparent',
                color: scopeFilter === 'ALL_KITCHEN' ? '#FFFFFF' : '#475569',
                border: 'none',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              🏢 All Kitchen ({allKitchenHistoryOrders.length})
            </button>
          </div>

          {/* Type filter tabs */}
          <div style={{ display: 'flex', backgroundColor: '#FFFFFF', padding: '0.2rem', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            {[
              { id: 'ALL', label: 'All Types' },
              { id: 'DINE-IN', label: 'Dine-In' }
            ].map(tf => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTypeFilter(tf.id)}
                style={{
                  backgroundColor: typeFilter === tf.id ? '#E07A3C' : 'transparent',
                  color: typeFilter === tf.id ? '#FFFFFF' : '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', width: '230px' }}>
            <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search ID, Table, Dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#0F2A1D',
                fontSize: '0.82rem',
                fontWeight: 700,
                outline: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* ================= 2. KPI SUMMARY CARDS ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.15rem 1.35rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>COMPLETED TICKETS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)', marginTop: '0.15rem' }}>
              {historyOrders.length} <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 700 }}>Tickets</span>
            </div>
          </div>
          <div style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '0.65rem', borderRadius: '12px' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.15rem 1.35rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL DISHES COOKED</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#166534', fontFamily: 'var(--font-heading)', marginTop: '0.15rem' }}>
              {totalDishesCooked} <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 700 }}>Dishes</span>
            </div>
          </div>
          <div style={{ backgroundColor: '#EFF6FF', color: '#2563EB', padding: '0.65rem', borderRadius: '12px' }}>
            <Utensils size={22} />
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.15rem 1.35rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DISPATCH RATE</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2563EB', fontFamily: 'var(--font-heading)', marginTop: '0.15rem' }}>
              100% <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 700 }}>Pass Efficiency</span>
            </div>
          </div>
          <div style={{ backgroundColor: '#FFF3EB', color: '#E07A3C', padding: '0.65rem', borderRadius: '12px' }}>
            <Sparkles size={22} />
          </div>
        </div>
      </div>

      {/* ================= 3. PROPERLY ALIGNED DATA TABLE CARD ================= */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F2A1D', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>
              {scopeFilter === 'MY_ORDERS' 
                ? (activeChefName ? `${activeChefName}'s Dispatched Tickets (${filteredOrders.length})` : `My Dispatched Tickets (${filteredOrders.length})`)
                : `All Kitchen Dispatched Log (${filteredOrders.length})`
              }
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {scopeFilter === 'MY_ORDERS' && (
              <span style={{ fontSize: '0.75rem', backgroundColor: '#DCFCE7', color: '#166534', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '6px', border: '1px solid #86EFAC' }}>
                👨‍🍳 Logged as {activeChefName || 'Chef'}
              </span>
            )}
            <span style={{ fontSize: '0.75rem', backgroundColor: '#EFF6FF', color: '#2563EB', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
              🟢 Live Kitchen Pass Active
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', fontSize: '0.72rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap', width: '130px' }}>TICKET ID</th>
                <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap', width: '90px' }}>TABLE</th>
                <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap', width: '130px' }}>CUSTOMER</th>
                <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap', width: '95px' }}>TIME</th>
                <th style={{ padding: '0.65rem 0.85rem', minWidth: '260px' }}>PREPARED DISHES</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', whiteSpace: 'nowrap', width: '120px' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                    <ChefHat size={44} color="#CBD5E1" style={{ display: 'block', margin: '0 auto 0.5rem auto' }} />
                    <div style={{ fontWeight: 800, color: '#0F2A1D', fontSize: '1rem' }}>
                      {scopeFilter === 'MY_ORDERS' ? 'No Dispatched Tickets For You Yet' : 'No History Tickets Found'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.25rem', maxWidth: '420px', margin: '0.25rem auto 0 auto' }}>
                      {searchQuery 
                        ? 'No matching tickets found for your search.' 
                        : scopeFilter === 'MY_ORDERS' 
                          ? `Tickets claimed, cooked, and completed by ${activeChefName || 'you'} in the Live Kitchen Orders will appear here.`
                          : 'Completed tickets dispatched from the kitchen will appear here automatically.'}
                    </div>
                    {scopeFilter === 'MY_ORDERS' && allKitchenHistoryOrders.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <button
                          type="button"
                          onClick={() => setScopeFilter('ALL_KITCHEN')}
                          style={{
                            backgroundColor: '#0F2A1D',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(15, 42, 29, 0.2)'
                          }}
                        >
                          View All Kitchen Tickets ({allKitchenHistoryOrders.length})
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedOrders.map(ord => {
                  const rawId = ord.orderId || ord.id || ord._id || 'ORD-101';
                  const ordId = `#${String(rawId).replace(/^#/, '')}`;
                  const tableDisplay = formatTableNumber(ord.table || ord.tableNumber);
                  const itemsList = Array.isArray(ord.items) ? ord.items : [];
                  const isMine = isOrderMine(ord);

                  return (
                    <tr
                      key={rawId}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        fontSize: '0.8rem',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                    >
                      {/* TICKET ID & CHEF TAG */}
                      <td style={{ padding: '0.55rem 0.85rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle', fontSize: '0.82rem' }}>
                        <div>{ordId}</div>
                        <div style={{ marginTop: '0.2rem' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            backgroundColor: isMine ? '#DCFCE7' : '#F1F5F9',
                            color: isMine ? '#166534' : '#64748B',
                            border: isMine ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}>
                            👨‍🍳 {isMine ? 'You' : (ord.chefName || 'Unassigned')}
                          </span>
                        </div>
                      </td>

                      {/* TABLE NUMBER */}
                      <td style={{ padding: '0.55rem 0.85rem', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 900, backgroundColor: '#F0FDF4', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '5px', border: '1px solid #BBF7D0' }}>
                          {tableDisplay}
                        </span>
                      </td>

                      {/* CUSTOMER NAME */}
                      <td style={{ padding: '0.55rem 0.85rem', fontWeight: 800, color: '#0F2A1D', whiteSpace: 'nowrap', verticalAlign: 'middle', fontSize: '0.8rem' }}>
                        {ord.customer || ord.guestName || 'Guest Diner'}
                      </td>

                      {/* TIME */}
                      <td style={{ padding: '0.55rem 0.85rem', color: '#475569', fontWeight: 700, whiteSpace: 'nowrap', verticalAlign: 'middle', fontSize: '0.78rem' }}>
                        {ord.time || '12:00 PM'}
                      </td>

                      {/* ITEMIZIED DISHES - SINGLE LINE HORIZONTALLY SCROLLABLE (HIDDEN SCROLLBAR) */}
                      <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', maxWidth: '380px' }}>
                        <div
                          className="no-scrollbar"
                          style={{
                            display: 'flex',
                            flexWrap: 'nowrap',
                            gap: '0.35rem',
                            alignItems: 'center',
                            overflowX: 'auto',
                            whiteSpace: 'nowrap',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none'
                          }}
                        >
                          {itemsList.map((i, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.73rem',
                                fontWeight: 700,
                                backgroundColor: '#F8FAFC',
                                color: '#0F2A1D',
                                border: '1px solid #E2E8F0',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}
                            >
                              <strong style={{ color: '#E07A3C' }}>{i.quantity || i.qty || 1}x</strong>
                              <span>{i.name || i.dishId}</span>
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* STATUS BADGE */}
                      <td style={{ padding: '0.55rem 0.85rem', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '0.7rem', backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle2 size={11} />
                          <span>Completed</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION CONTROL BAR (10 Tickets / Page) ================= */}
        {totalOrders > 0 && (
          <div style={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1.0rem 1.5rem',
            backgroundColor: '#FAFAFA',
            borderTop: '1px solid #E2E8F0'
          }}>
            <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 700 }}>
              Showing <strong>{indexOfFirstOrder + 1}</strong> to <strong>{Math.min(indexOfLastOrder, totalOrders)}</strong> of <strong>{totalOrders}</strong> History Tickets
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
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
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  style={{
                    backgroundColor: validCurrentPage === p ? '#E07A3C' : '#FFFFFF',
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
                type="button"
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
      </div>

    </div>
  );
}
