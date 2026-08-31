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

export default function ChefHistoryPage({ ordersList = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Filter completed kitchen tickets
  const historyOrders = ordersList.filter(o => {
    if (o.status === 'Ready' || o.status === 'Served' || o.status === 'Completed' || o.status === 'Paid') {
      return true;
    }
    const items = Array.isArray(o.items) ? o.items : [];
    if (items.length === 0) return false;
    return items.every(i => i && (i.isReady || i.status === 'READY' || i.isDelivered || i.status === 'SERVED' || i.status === 'DELIVERED'));
  });

  // Apply search & type filter
  const filteredOrders = historyOrders.filter(ord => {
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

    return ordId.includes(q) || tableStr.includes(q) || customerStr.includes(q) || itemsStr.includes(q);
  });

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
            Archive of orders prepared by the kitchen and dispatched to pass.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Type filter tabs */}
          <div style={{ display: 'flex', backgroundColor: '#FFFFFF', padding: '0.2rem', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            {[
              { id: 'ALL', label: 'All Orders' },
              { id: 'DINE-IN', label: 'Dine-In' },
              { id: 'TAKEAWAY', label: 'Takeaway' }
            ].map(tf => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTypeFilter(tf.id)}
                style={{
                  backgroundColor: typeFilter === tf.id ? '#0F2A1D' : 'transparent',
                  color: typeFilter === tf.id ? '#FFFFFF' : '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.45rem 0.85rem',
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
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F2A1D' }}>
            Shift Dispatched History Log ({filteredOrders.length})
          </div>
          <span style={{ fontSize: '0.75rem', backgroundColor: '#DCFCE7', color: '#166534', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '6px', border: '1px solid #86EFAC' }}>
            🟢 Live Kitchen Pass Active
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', fontSize: '0.72rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap', width: '120px' }}>TICKET ID</th>
                <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap', width: '90px' }}>TABLE</th>
                <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap', width: '130px' }}>CUSTOMER</th>
                <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap', width: '95px' }}>TIME</th>
                <th style={{ padding: '0.65rem 0.85rem', minWidth: '260px' }}>PREPARED DISHES</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', whiteSpace: 'nowrap', width: '120px' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                    <ChefHat size={40} color="#CBD5E1" style={{ display: 'block', margin: '0 auto 0.5rem auto' }} />
                    <div style={{ fontWeight: 800, color: '#0F2A1D', fontSize: '0.95rem' }}>No History Tickets Found</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                      {searchQuery ? 'No matching tickets for your search.' : 'Dispatched tickets from the live kitchen will appear here automatically.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(ord => {
                  const rawId = ord.orderId || ord.id || ord._id || 'ORD-101';
                  const ordId = `#${String(rawId).replace(/^#/, '')}`;
                  const tableDisplay = formatTableNumber(ord.table || ord.tableNumber);
                  const itemsList = Array.isArray(ord.items) ? ord.items : [];

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
                      {/* TICKET ID */}
                      <td style={{ padding: '0.55rem 0.85rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle', fontSize: '0.82rem' }}>
                        {ordId}
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
      </div>

    </div>
  );
}
