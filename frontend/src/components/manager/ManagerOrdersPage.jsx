import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, CheckCircle2, Clock, XCircle, AlertCircle, ChefHat, Eye, RefreshCw, MoreVertical, Printer, X } from 'lucide-react';
import { api } from '../../services/api';
import { clearTableSessionStorage } from '../../utils/orderUtils';

export default function ManagerOrdersPage() {
  const [activeStatusFilter, setActiveStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [selectedOrderTicketModal, setSelectedOrderTicketModal] = useState(null);

  const [ordersList, setOrdersList] = useState([]);

  const fetchBackendOrders = async () => {
    try {
      const backendData = await api.getOrders();
      if (Array.isArray(backendData)) {
        const mapped = backendData.map(o => ({
          id: o.orderId || o._id,
          table: o.table || 'Takeaway',
          type: o.type || 'Dine-In',
          customer: o.customer || 'Guest',
          phone: o.phone || '',
          originalTotal: o.originalTotal || o.originalAmount || o.total || 0,
          originalAmount: o.originalAmount || o.originalTotal || o.total || 0,
          couponCode: o.couponCode || '',
          discountAmount: Number(o.discountAmount || 0),
          finalAmount: o.finalAmount !== undefined ? Number(o.finalAmount) : Number(o.total || 0),
          tip: Number(o.tip || o.tipAmount || 0),
          tipAmount: Number(o.tipAmount || o.tip || 0),
          paymentMethod: o.paymentMethod || 'UPI / QR',
          total: o.finalAmount !== undefined ? Number(o.finalAmount) : Number(o.total || 0),
          payment: o.payment || 'Pending',
          status: o.status || 'Placed',
          time: o.time || 'Just now',
          items: o.items || []
        }));

        setOrdersList(mapped);
      }
    } catch (err) {
      console.warn("Backend orders fetch error:", err);
    }
  };

  useEffect(() => {
    fetchBackendOrders();
    const interval = setInterval(fetchBackendOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (ord, newStatus) => {
    try {
      // 1. Update local orders list state & localStorage immediately
      const updatedOrders = ordersList.map(o => o.id === ord.id ? { ...o, status: newStatus } : o);
      setOrdersList(updatedOrders);
      try {
        localStorage.setItem('flavora_manager_orders', JSON.stringify(updatedOrders));
      } catch (e) {}

      if (selectedOrder && selectedOrder.id === ord.id) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }

      // 2. Update order status in backend MongoDB database
      try {
        await api.updateOrderStatus(ord.id || ord._id, newStatus, ord);
      } catch (e) {
        console.warn("Backend update order status notice:", e.message);
      }

      // 3. If status is Completed, transition table status to Cleaning for 10 minutes
      if (newStatus === 'Completed') {
        const digits = String(ord.table || '').replace(/[^0-9]/g, '');
        const cleanNum = digits ? String(parseInt(digits, 10)) : '';

        // Check if other active dine-in orders exist for this table
        const remainingActiveOrders = updatedOrders.filter(o => {
          if (o.id === ord.id) return false;
          if (o.status === 'Completed' || o.status === 'Cancelled') return false;
          const oDigits = String(o.table || '').replace(/[^0-9]/g, '');
          const oClean = oDigits ? String(parseInt(oDigits, 10)) : '';
          return oClean && cleanNum && oClean === cleanNum;
        });

        if (remainingActiveOrders.length > 0) {
          // Other active orders exist -> Table MUST REMAIN Occupied
          const latestActive = remainingActiveOrders[remainingActiveOrders.length - 1];
          try {
            const savedTables = localStorage.getItem('flavora_tables');
            if (savedTables) {
              const parsed = JSON.parse(savedTables);
              if (Array.isArray(parsed)) {
                const updatedTables = parsed.map(tbl => {
                  const tDigits = String(tbl.num || tbl.number || '').replace(/[^0-9]/g, '');
                  if (tDigits && cleanNum && String(parseInt(tDigits, 10)) === cleanNum) {
                    return {
                      ...tbl,
                      status: 'Occupied',
                      orderId: latestActive.id,
                      customer: latestActive.customer || 'Guest Diner',
                      guest: latestActive.customer || 'Guest Diner',
                      amount: latestActive.total || tbl.amount
                    };
                  }
                  return tbl;
                });
                localStorage.setItem('flavora_tables', JSON.stringify(updatedTables));
                window.dispatchEvent(new Event('flavora_tables_updated'));
              }
            }
          } catch (e) {}
          alert(`Order ${ord.id} completed. ${ord.table || 'Table'} remains Occupied because active order ${latestActive.id} is still in progress.`);
        } else {
          // No other active orders exist -> Release table to Cleaning for 10 minutes
          try {
            const dbTables = await api.getTables();
            if (Array.isArray(dbTables)) {
              const matchedTbl = dbTables.find(t => {
                const tNum = String(t.number || t.name || '').replace(/[^0-9]/g, '');
                return tNum && cleanNum && String(parseInt(tNum, 10)) === cleanNum;
              });
              if (matchedTbl) {
                await api.updateTableStatus(matchedTbl._id || matchedTbl.id, 'Cleaning', '');
              }
            }
          } catch (err) {
            console.warn("Could not update backend table status:", err);
          }

          // Clear local storage order keys & update flavora_tables to Cleaning
          try {
            if (ord.table) {
              clearTableSessionStorage(ord.table);
            }

            const savedTables = localStorage.getItem('flavora_tables');
            const cleaningExpiration = Date.now() + 10 * 60 * 1000;
            let tablesToUpdate = savedTables ? JSON.parse(savedTables) : [];

            if (Array.isArray(tablesToUpdate) && tablesToUpdate.length > 0) {
              tablesToUpdate = tablesToUpdate.map(tbl => {
                const tDigits = String(tbl.num || tbl.number || '').replace(/[^0-9]/g, '');
                if (tDigits && cleanNum && String(parseInt(tDigits, 10)) === cleanNum) {
                  return { ...tbl, status: 'Cleaning', cleaningUntil: cleaningExpiration, guest: '-', orderId: null, customer: '-', amount: '-' };
                }
                return tbl;
              });
              localStorage.setItem('flavora_tables', JSON.stringify(tablesToUpdate));
              window.dispatchEvent(new Event('flavora_tables_updated'));
              window.dispatchEvent(new Event('storage'));
            }
          } catch (e) {}

          alert(`🎉 Order ${ord.id} marked as Completed! All orders completed for ${ord.table || 'Table'}. Table status set to Cleaning.`);
        }
      }
    } catch (err) {
      console.error("Order status update failed:", err);
      alert(`Order ${ord.id} status updated to ${newStatus}`);
    }
  };

  const filteredOrders = ordersList.filter(ord => {
    const matchesStatus = activeStatusFilter === 'All' || ord.status === activeStatusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (ord.id || '').toLowerCase().includes(q) || (ord.table || '').toLowerCase().includes(q) || (ord.customer || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="admin-subpage-container" style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', paddingBottom: '3rem' }}>
      
      {/* Header */}
      <div className="admin-dashboard-header">
        <div>
          <div className="page-breadcrumb-bar">
            <span>Dashboard</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Real-Time Orders Management</span>
          </div>
          <h1 className="admin-page-title">Live Kitchen & Table Orders</h1>
          <p className="admin-page-subtitle">Track, accept, prepare, and complete customer orders across dining zones.</p>
        </div>
        <button 
          type="button" 
          className="btn btn-outline"
          onClick={fetchBackendOrders}
        >
          <RefreshCw size={16} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        border: '1px solid #F0EAE1',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {['All', 'Placed', 'Accepted', 'Preparing', 'Ready', 'Served', 'Completed'].map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setActiveStatusFilter(st)}
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: activeStatusFilter === st ? '#1E4636' : '#F1F5F9',
                color: activeStatusFilter === st ? '#FFFFFF' : '#475569',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '260px', minWidth: '180px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search order ID, table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '2.4rem',
              paddingRight: '1rem',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* ================= COMPACT LUXURY ORDERS TABLE ================= */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #F0EAE1',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        overflowX: 'auto',
        boxSizing: 'border-box',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)'
      }}>
        <table style={{ width: '100%', maxWidth: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#1C130E', color: '#FAF6EE', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.7rem 0.75rem', borderTopLeftRadius: '15px', whiteSpace: 'nowrap' }}>ORDER ID</th>
              <th style={{ padding: '0.7rem 0.75rem', whiteSpace: 'nowrap' }}>TABLE & TYPE</th>
              <th style={{ padding: '0.7rem 0.75rem', whiteSpace: 'nowrap' }}>CUSTOMER</th>
              <th style={{ padding: '0.7rem 0.75rem' }}>ITEMS ORDERED</th>
              <th style={{ padding: '0.7rem 0.75rem', whiteSpace: 'nowrap' }}>TOTAL</th>
              <th style={{ padding: '0.7rem 0.75rem', whiteSpace: 'nowrap' }}>STATUS</th>
              <th style={{ padding: '0.7rem 0.75rem', textAlign: 'center', borderTopRightRadius: '15px', whiteSpace: 'nowrap' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>No orders found</div>
                  <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '0.2rem' }}>Try adjusting your search query or filter options.</p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((ord, index) => {
                const isCompleted = ord.status === 'Completed';
                const itemsList = ord.items || [];
                const visibleItems = itemsList.slice(0, 2);
                const remainingCount = itemsList.length - 2;

                return (
                  <tr 
                    key={ord.id} 
                    style={{ 
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FDFBF7',
                      borderBottom: '1px solid #F4EFEA',
                      position: 'relative',
                      zIndex: openActionMenuId === ord.id ? 50 : 1,
                      transition: 'background-color 0.15s ease'
                    }}
                    className="order-table-row-hover"
                  >
                    {/* 1. ORDER ID (SINGLE LINE, NO WRAPPING) */}
                    <td style={{ padding: '0.65rem 0.75rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span style={{ 
                        fontSize: '0.82rem', 
                        fontWeight: 900, 
                        color: '#1C130E',
                        backgroundColor: '#F5F0E8',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        border: '1px solid #EAE3D2',
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap',
                        display: 'inline-block'
                      }}>
                        #{ord.id}
                      </span>
                    </td>

                    {/* 2. TABLE & TYPE (SINGLE LINE, NO WRAPPING) */}
                    <td style={{ padding: '0.65rem 0.75rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                        <span style={{ 
                          fontSize: '0.78rem', 
                          fontWeight: 800, 
                          color: '#92400E', 
                          backgroundColor: '#FFF5ED', 
                          padding: '0.2rem 0.55rem', 
                          borderRadius: '6px',
                          border: '1px solid #FDE68A',
                          whiteSpace: 'nowrap'
                        }}>
                          🪑 {ord.table}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>
                          ({ord.type || 'Dine-In'})
                        </span>
                      </div>
                    </td>

                    {/* 3. CUSTOMER */}
                    <td style={{ padding: '0.65rem 0.75rem', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1C130E' }}>
                        {ord.customer || 'Guest Diner'}
                      </span>
                    </td>

                    {/* 4. ITEMS ORDERED (RESPONSIVE FLEX WRAPPING) */}
                    <td style={{ padding: '0.65rem 0.75rem', verticalAlign: 'middle', maxWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {visibleItems.map((it, idx) => (
                          <span 
                            key={idx} 
                            style={{ 
                              backgroundColor: '#FFFFFF', 
                              color: '#2D231E', 
                              padding: '0.18rem 0.45rem', 
                              borderRadius: '6px', 
                              fontSize: '0.74rem', 
                              fontWeight: 700, 
                              border: '1px solid #E8E2D5',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <span>{it.name}</span>
                            <span style={{ 
                              backgroundColor: '#7A1C1C', 
                              color: '#FFFFFF', 
                              fontSize: '0.64rem', 
                              fontWeight: 800, 
                              padding: '0.02rem 0.32rem', 
                              borderRadius: '9999px' 
                            }}>
                              x{it.quantity || it.qty || 1}
                            </span>
                          </span>
                        ))}

                        {remainingCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedOrderTicketModal(ord)}
                            style={{
                              backgroundColor: '#F1F5F9',
                              color: '#475569',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '0.18rem 0.45rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                            title="Click to view all ordered dishes"
                          >
                            +{remainingCount} more
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 5. TOTAL BILL */}
                    <td style={{ padding: '0.65rem 0.75rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      {(() => {
                        const isPaid = ord.status === 'Completed' || ord.status === 'Paid' || ord.payment === 'Paid' || ord.payment === 'Completed';
                        const displayPaidVal = Number(ord.finalAmount ?? ord.total ?? 0);
                        const origVal = Number(ord.originalTotal ?? ord.originalAmount ?? 0);
                        const discVal = Number(ord.discountAmount ?? 0);
                        const couponName = ord.couponCode || '';
                        const tipVal = Number(ord.tip ?? ord.tipAmount ?? 0);

                        const hasOriginal = Boolean(origVal > 0 && origVal > displayPaidVal);
                        const actualDiscount = discVal > 0 ? discVal : (origVal > displayPaidVal ? origVal - displayPaidVal : 0);
                        const hasDiscount = Boolean(actualDiscount > 0);
                        const hasTip = Boolean(tipVal > 0);

                        return (
                          <div>
                            <div style={{ fontSize: '0.96rem', fontWeight: 900, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span>₹{displayPaidVal}</span>
                              {isPaid && (
                                <span style={{ fontSize: '0.66rem', backgroundColor: '#DCFCE7', color: '#166534', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #86EFAC' }}>
                                  ✓ PAID
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    {/* 6. STATUS */}
                    <td style={{ padding: '0.65rem 0.75rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        backgroundColor: isCompleted ? '#ECFDF5' : ord.status === 'Preparing' ? '#FEFCE8' : '#EFF6FF',
                        color: isCompleted ? '#047857' : ord.status === 'Preparing' ? '#A16207' : '#1D4ED8',
                        border: `1px solid ${isCompleted ? '#A7F3D0' : ord.status === 'Preparing' ? '#FEF08A' : '#BFDBFE'}`
                      }}>
                        <span>{isCompleted ? '✅' : ord.status === 'Preparing' ? '🍳' : '🔵'}</span>
                        <span>{ord.status}</span>
                      </span>
                    </td>

                    {/* 7. ACTIONS (THREE-DOTS DROPDOWN MENU - CENTERED) */}
                    <td style={{ padding: '0.65rem 0.75rem', verticalAlign: 'middle', textAlign: 'center', position: 'relative', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => setOpenActionMenuId(openActionMenuId === ord.id ? null : ord.id)}
                          style={{
                            backgroundColor: '#F8F6F0',
                            border: '1px solid #EAE3D2',
                            borderRadius: '8px',
                            width: '34px',
                            height: '34px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title="Order Options"
                        >
                          <MoreVertical size={16} color="#1C130E" />
                        </button>

                        {/* Dropdown Options Popup */}
                        {openActionMenuId === ord.id && (
                          <>
                            {/* Backdrop overlay to close menu when clicking outside */}
                            <div 
                              style={{ position: 'fixed', inset: 0, zIndex: 9998, cursor: 'default' }} 
                              onClick={() => setOpenActionMenuId(null)} 
                            />

                            <div style={{
                              position: 'absolute',
                              right: '50%',
                              transform: 'translateX(50%)',
                              top: '40px',
                              backgroundColor: '#FFFFFF',
                              borderRadius: '12px',
                              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
                              border: '1px solid #EAE3D2',
                              padding: '0.4rem',
                              zIndex: 9999,
                              minWidth: '150px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.2rem'
                            }}>
                            {/* View Details Option */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrderTicketModal(ord);
                                setOpenActionMenuId(null);
                              }}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.45rem 0.75rem',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: '#1C130E',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                              className="dropdown-menu-item-hover"
                            >
                              <Eye size={14} color="#1E4636" />
                              <span>View Order</span>
                            </button>

                            {/* Step-by-Step Status Progression Options */}
                            {ord.status === 'Placed' && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateStatus(ord, 'Accepted');
                                  setOpenActionMenuId(null);
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.75rem', borderRadius: '6px', border: 'none', backgroundColor: '#F0FDF4', color: '#166534', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}
                              >
                                <span>✅ Accept Order</span>
                              </button>
                            )}

                            {ord.status === 'Accepted' && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateStatus(ord, 'Preparing');
                                  setOpenActionMenuId(null);
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.75rem', borderRadius: '6px', border: 'none', backgroundColor: '#FEFCE8', color: '#A16207', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}
                              >
                                <span>🍳 Start Preparing</span>
                              </button>
                            )}

                            {ord.status === 'Preparing' && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateStatus(ord, 'Ready');
                                  setOpenActionMenuId(null);
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.75rem', borderRadius: '6px', border: 'none', backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}
                              >
                                <span>🔔 Mark Ready</span>
                              </button>
                            )}

                            {ord.status === 'Ready' && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateStatus(ord, 'Served');
                                  setOpenActionMenuId(null);
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.75rem', borderRadius: '6px', border: 'none', backgroundColor: '#F3E8FF', color: '#6B21A8', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}
                              >
                                <span>🍱 Mark Served</span>
                              </button>
                            )}

                          </div>
                        </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= ORDER TICKET DETAIL MODAL ================= */}
      {selectedOrderTicketModal && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrderTicketModal(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', borderRadius: '18px', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ backgroundColor: '#1C130E', color: '#FFFFFF', padding: '1.1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#FFFFFF' }}>
                  Order #{selectedOrderTicketModal.id}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#D8CEBC', fontWeight: 700 }}>
                  🪑 {selectedOrderTicketModal.table} • {selectedOrderTicketModal.type || 'Dine-In'}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedOrderTicketModal(null)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem' }}>
              <div style={{ marginBottom: '1rem', paddingBottom: '0.85rem', borderBottom: '1px dashed #EAE3D2', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.76rem', color: '#786C60', fontWeight: 700 }}>CUSTOMER</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1C130E' }}>{selectedOrderTicketModal.customer || 'Guest Diner'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.76rem', color: '#786C60', fontWeight: 700 }}>STATUS</div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: selectedOrderTicketModal.status === 'Completed' ? '#047857' : '#D97706' }}>
                    {selectedOrderTicketModal.status}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.05em', color: '#92400E', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                ALL ORDERED DISHES ({selectedOrderTicketModal.items ? selectedOrderTicketModal.items.length : 0})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', maxHeight: '220px', overflowY: 'auto' }}>
                {selectedOrderTicketModal.items && selectedOrderTicketModal.items.map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: '#FDFBF7', borderRadius: '8px', border: '1px solid #F0EAE1' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1C130E' }}>{it.name}</span>
                    <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#7A1C1C', backgroundColor: '#FFEBEE', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                      x{it.quantity || it.qty || 1}
                    </span>
                  </div>
                ))}
              </div>

              {/* Complete Financial & Payment Breakdown in Manager Ticket View Modal */}
              <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '2px solid #EAE3D2', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.84rem' }}>
                {(() => {
                  const orig = Number(selectedOrderTicketModal.originalTotal ?? selectedOrderTicketModal.originalAmount ?? selectedOrderTicketModal.total ?? 0);
                  const disc = Number(selectedOrderTicketModal.discountAmount ?? 0);
                  const finalNet = Number(selectedOrderTicketModal.finalAmount ?? selectedOrderTicketModal.total ?? 0);
                  const code = selectedOrderTicketModal.couponCode || '';
                  const tip = Number(selectedOrderTicketModal.tip ?? selectedOrderTicketModal.tipAmount ?? 0);

                  const subtotal = orig > 0 ? orig : (disc > 0 ? finalNet + disc : finalNet);

                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontWeight: 700 }}>
                        <span>Subtotal (Without Discount):</span>
                        <span>₹{subtotal}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: disc > 0 ? '#DC2626' : '#64748B', fontWeight: 800 }}>
                        <span>Coupon Discount Applied:</span>
                        <span>{disc > 0 ? `-₹${disc} (${code || 'Coupon'})` : '₹0 (No Coupon)'}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontWeight: 900, fontSize: '0.95rem', paddingTop: '0.35rem', borderTop: '1px solid #EAE3D2' }}>
                        <span>Food Revenue (Net Paid):</span>
                        <span>₹{finalNet}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: tip > 0 ? '#EA580C' : '#64748B', fontWeight: 800 }}>
                        <span>Customer Tip Collected:</span>
                        <span>{tip > 0 ? `+₹${tip}` : '₹0 (No Tip)'}</span>
                      </div>

                      {tip > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1C130E', fontWeight: 900, fontSize: '0.95rem', paddingTop: '0.35rem', borderTop: '1px dashed #CBD5E1' }}>
                          <span>Total Collected from Diner:</span>
                          <span style={{ color: '#166534' }}>₹{finalNet + tip}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1C130E', fontWeight: 800, paddingTop: '0.35rem', borderTop: '1px solid #EAE3D2' }}>
                        <span>Payment Method:</span>
                        <span>{selectedOrderTicketModal.paymentMethod || 'UPI / QR'}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ padding: '1rem 1.25rem', backgroundColor: '#FAF6EE', borderTop: '1px solid #EAE3D2', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {selectedOrderTicketModal.status === 'Placed' && (
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateStatus(selectedOrderTicketModal, 'Accepted');
                    setSelectedOrderTicketModal(null);
                  }}
                  style={{ backgroundColor: '#166534', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '0.5rem 1.1rem', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Accept Order
                </button>
              )}
              {selectedOrderTicketModal.status === 'Accepted' && (
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateStatus(selectedOrderTicketModal, 'Preparing');
                    setSelectedOrderTicketModal(null);
                  }}
                  style={{ backgroundColor: '#B45309', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '0.5rem 1.1rem', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Start Preparing
                </button>
              )}
              {selectedOrderTicketModal.status === 'Preparing' && (
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateStatus(selectedOrderTicketModal, 'Ready');
                    setSelectedOrderTicketModal(null);
                  }}
                  style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '0.5rem 1.1rem', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Mark Ready
                </button>
              )}
              {selectedOrderTicketModal.status === 'Ready' && (
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateStatus(selectedOrderTicketModal, 'Served');
                    setSelectedOrderTicketModal(null);
                  }}
                  style={{ backgroundColor: '#6B21A8', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '0.5rem 1.1rem', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Mark Served
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedOrderTicketModal(null)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#1C130E',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '0.5rem 1.1rem',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Close Ticket
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
