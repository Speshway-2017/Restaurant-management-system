import React, { useState, useEffect } from 'react';
import {
  TrendingUp, ShoppingBag, DollarSign, Users, Table2, Clock,
  CheckCircle2, AlertCircle, Eye, Plus, Utensils, X,
  ChevronRight, Sparkles, ShieldCheck, Ticket, UserCheck, Bell, RefreshCw,
  ArrowUpRight, ArrowDownRight, Layers, LayoutGrid, Check, Search, Calendar, Receipt
} from 'lucide-react';
import { api } from '../../services/api';

export default function WaiterDashboardHome({ onNavigateTab }) {
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);
  const [activeOrderFilter, setActiveOrderFilter] = useState('All');
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [activeOrders, setActiveOrders] = useState([]);
  const [tablesList, setTablesList] = useState([]);

  const handleTableStatusChange = async (tableNum, newStatus) => {
    try {
      setTablesList(prev => prev.map(t => {
        const tNum = t.num || t.number || `T-${String(t.id || 1).padStart(2, '0')}`;
        if (tNum === tableNum) {
          return { ...t, status: newStatus };
        }
        return t;
      }));

      let savedTables = [];
      try {
        const raw = localStorage.getItem('flavora_tables');
        if (raw) savedTables = JSON.parse(raw);
      } catch (e) { }

      let updated = false;
      const updatedList = savedTables.map(t => {
        const tNum = t.num || t.number || `T-${String(t.id || 1).padStart(2, '0')}`;
        if (tNum === tableNum) {
          updated = true;
          return { ...t, status: newStatus };
        }
        return t;
      });

      if (!updated) {
        updatedList.push({ num: tableNum, status: newStatus, zone: 'Main Dining', cap: 4 });
      }

      localStorage.setItem('flavora_tables', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('flavora_tables_updated'));

      const dbTable = tablesList.find(t => (t.num || t.number) === tableNum);
      if (dbTable && dbTable.id) {
        await api.updateTableStatus(dbTable.id, newStatus).catch(() => { });
      }
    } catch (e) {
      console.error('Failed to change table status', e);
    }
  };

  // Live time ticker matching Manager Dashboard
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch waiter orders and tables
  useEffect(() => {
    const fetchWaiterData = async () => {
      try {
        const [dbTables, dbOrders] = await Promise.all([
          api.getTables().catch(() => []),
          api.getOrders().catch(() => [])
        ]);

        setTablesList(dbTables || []);
        setActiveOrders(dbOrders || []);
      } catch (e) {
        console.error('Failed to fetch waiter dashboard data', e);
      }
    };

    fetchWaiterData();
    const interval = setInterval(fetchWaiterData, 4000);
    window.addEventListener('flavora_orders_updated', fetchWaiterData);
    window.addEventListener('flavora_tables_updated', fetchWaiterData);
    window.addEventListener('storage', fetchWaiterData);

    return () => {
      clearInterval(interval);
      window.removeEventListener('flavora_orders_updated', fetchWaiterData);
      window.removeEventListener('flavora_tables_updated', fetchWaiterData);
      window.removeEventListener('storage', fetchWaiterData);
    };
  }, []);

  const handleDeliverReadyDishes = async (order) => {
    const rawItems = Array.isArray(order.items) ? order.items : [];
    const itemsToDeliver = rawItems.filter(i => (i.status === 'READY' || i.isReady) && i.status !== 'DELIVERED' && !i.isDelivered);
    if (itemsToDeliver.length === 0) return;

    const targetItemIds = itemsToDeliver.map((i, idx) => i._id || i.id || i.itemId || idx);
    const targetOrderId = order._id || order.id || order.orderId;

    try {
      await api.updateOrderItemStatus(targetOrderId, targetItemIds, 'DELIVERED');
    } catch (e) { }

    const updatedOrders = activeOrders.map(o => {
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

    setActiveOrders(updatedOrders);
    try {
      localStorage.setItem('flavora_manager_orders', JSON.stringify(updatedOrders));
      window.dispatchEvent(new Event('flavora_orders_updated'));
      window.dispatchEvent(new Event('flavora_tables_updated'));
    } catch (e) { }
  };

  // Calculations for Waiter KPIs
  const liveOrders = activeOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled');
  const pendingOrders = activeOrders.filter(o => o.status === 'Placed' || o.status === 'Preparing');
  const totalSalesNum = activeOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
  const formattedSales = `₹${totalSalesNum.toLocaleString('en-IN')}`;

  const occupiedTablesCount = tablesList.filter(t => t.status === 'Occupied' || t.isOccupied).length;
  const assignedCount = occupiedTablesCount;
  const totalAssignedCount = tablesList.length;

  const waiterKpis = [
    {
      id: 'total_orders',
      label: "TOTAL ORDERS",
      value: `${activeOrders.length} Orders`,
      change: activeOrders.length > 0 ? "↗ Today's Orders" : "0 Orders",
      isPositive: true,
      isHighlighted: true,
      badgeColor: "#1E4636",
      accentBg: "#E8F5E9",
      icon: ShoppingBag
    },
    {
      id: 'my_active_orders',
      label: "MY ACTIVE ORDERS",
      value: `${liveOrders.length} Orders`,
      change: liveOrders.length > 0 ? "↗ Active Now" : "0 Active",
      isPositive: true,
      isHighlighted: false,
      badgeColor: "#E07A3C",
      accentBg: "#FFF3E0",
      icon: ShoppingBag
    },
    {
      id: 'assigned_tables',
      label: "ASSIGNED TABLES",
      value: `${assignedCount} / ${totalAssignedCount} Tables`,
      change: `↗ ${assignedCount} Active`,
      isPositive: true,
      isHighlighted: false,
      badgeColor: "#283593",
      accentBg: "#E8EAF6",
      icon: Layers
    },
    {
      id: 'pending_orders',
      label: "PENDING ORDERS",
      value: `${pendingOrders.length} Orders`,
      change: pendingOrders.length > 0 ? "↗ Needs Attention" : "0 Pending",
      isPositive: false,
      isHighlighted: false,
      badgeColor: "#00796B",
      accentBg: "#E0F2F1",
      icon: Clock
    }
  ];

  const filteredOrdersList = liveOrders.filter(o => {
    if (activeOrderFilter === 'All') return true;
    if (activeOrderFilter === 'Ready') {
      const itemsList = Array.isArray(o.items) ? o.items : [];
      const readyCount = itemsList.filter(i => (i.status === 'READY' || i.isReady) && i.status !== 'DELIVERED' && !i.isDelivered).length;
      return o.status === 'Ready' || readyCount > 0;
    }
    return o.status === activeOrderFilter;
  });

  return (
    <div className="admin-dashboard-container" style={{ width: '100%', boxSizing: 'border-box' }}>

      {/* ================= 1. PAGE HEADER ================= */}
      <div className="admin-dashboard-header" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="page-breadcrumb-bar">
            <span>Waiter</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Dashboard Overview</span>
          </div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            Dashboard Overview
          </h1>
          <p className="admin-page-subtitle" style={{ margin: '0.2rem 0 0 0' }}>
            Manage your assigned tables, orders, and service activities.
          </p>
        </div>
      </div>

      {/* ================= 2. FOUR KPI CARDS IN EXACTLY ONE ROW (STRICT 4-COLUMN GRID) ================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        {waiterKpis.map((kpi) => {
          const IconComp = kpi.icon;
          const isPrimary = kpi.isHighlighted;

          return (
            <div
              key={kpi.id}
              style={{
                backgroundColor: isPrimary ? '#0F2A1D' : '#FFFFFF',
                background: isPrimary
                  ? 'linear-gradient(135deg, #0F2A1D 0%, #1E4636 100%)'
                  : '#FFFFFF',
                borderRadius: '14px',
                padding: '0.95rem 1.15rem',
                border: isPrimary ? '1.5px solid #285A46' : '1px solid #E2E8F0',
                boxShadow: isPrimary
                  ? '0 6px 20px rgba(15, 42, 29, 0.15)'
                  : '0 2px 10px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.74rem', color: isPrimary ? '#C8E6C9' : '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {kpi.label}
                </span>

                <div style={{
                  backgroundColor: isPrimary ? '#E07A3C' : kpi.accentBg,
                  color: isPrimary ? '#FFFFFF' : kpi.badgeColor,
                  width: '32px',
                  height: '32px',
                  borderRadius: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.95rem'
                }}>
                  <IconComp size={17} />
                </div>
              </div>

              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: isPrimary ? '#FFFFFF' : '#0F2A1D', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                {kpi.value}
              </div>

              <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: isPrimary ? '#A7F3D0' : '#166534',
                  backgroundColor: isPrimary ? 'rgba(255, 255, 255, 0.12)' : '#F0FDF4',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {kpi.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= 3. QUICK ACTIONS TOOLBAR ================= */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        padding: '1rem 1.25rem',
        border: '1px solid #E2E8F0',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="#E07A3C" />
          <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F2A1D' }}>Quick Actions:</span>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigateTab && onNavigateTab('waiter-tables')}
            style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Table2 size={14} />
            <span>View My Tables</span>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('waiter-orders')}
            style={{ backgroundColor: '#FEFCE8', border: '1px solid #FDE047', color: '#854D0E', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ShoppingBag size={14} />
            <span>View Active Orders</span>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('waiter-history')}
            style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Receipt size={14} />
            <span>Order History</span>
          </button>
        </div>
      </div>

      {/* ================= 4. MY ACTIVE TABLES & ORDERS SECTION ================= */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem 1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Table2 size={18} color="#E07A3C" />
              <span>Recent Orders </span>
            </h3>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
              Real-time assigned seating and order status tracking
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: '#F8FAFC', padding: '0.25rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            {['All', 'Placed', 'Preparing', 'Ready'].map(filterKey => (
              <button
                key={filterKey}
                onClick={() => setActiveOrderFilter(filterKey)}
                style={{
                  backgroundColor: activeOrderFilter === filterKey ? '#0F2A1D' : 'transparent',
                  color: activeOrderFilter === filterKey ? '#FFFFFF' : '#64748B',
                  border: 'none',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '7px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {filterKey}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {filteredOrdersList.length > 0 ? (
            filteredOrdersList.map((ord, idx) => {
              const rawTable = ord.table || ord.tableNumber || '01';
              const cleanTableNum = String(rawTable).replace(/^Table\s+/i, '');
              const itemsList = Array.isArray(ord.items) ? ord.items : [];
              const totalCount = itemsList.length;
              const readyItems = itemsList.filter(i => (i.status === 'READY' || i.isReady) && i.status !== 'DELIVERED' && !i.isDelivered);
              const deliveredItems = itemsList.filter(i => i.status === 'DELIVERED' || i.isDelivered);
              const readyCount = readyItems.length;
              const deliveredCount = deliveredItems.length;

              let badgeText = ord.status;
              if (totalCount > 0 && deliveredCount === totalCount) badgeText = '✓ Fully Delivered';
              else if (deliveredCount > 0) badgeText = `⚡ Partial (${deliveredCount}/${totalCount})`;
              else if (readyCount > 0) badgeText = `🔔 ${readyCount} Ready`;

              const isReadyBadge = readyCount > 0;
              const isDeliveredBadge = totalCount > 0 && deliveredCount === totalCount;

              return (
                <div
                  key={ord._id || ord.id || idx}
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F2A1D' }}>
                        Table {cleanTableNum}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        backgroundColor: isDeliveredBadge ? '#DCFCE7' : (isReadyBadge ? '#EEF2FF' : '#FFF3EB'),
                        color: isDeliveredBadge ? '#166534' : (isReadyBadge ? '#283593' : '#E07A3C'),
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px'
                      }}>
                        {badgeText}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginBottom: '0.2rem' }}>
                      👤 {ord.customer || 'Guest Diner'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600, marginBottom: '0.4rem' }}>
                      🍲 {totalCount} Items {readyCount > 0 ? `(${readyCount} Ready to Serve)` : ''}
                    </div>

                    {readyCount > 0 && (
                      <div style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '10px', padding: '0.6rem 0.75rem', marginBottom: '0.65rem' }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#166534', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Bell size={13} color="#166534" />
                          <span>PREPARED TO SERVE ({readyCount}):</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '110px', overflowY: 'auto' }}>
                          {readyItems.map((item, iIdx) => (
                            <div key={iIdx} style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                              <span><strong style={{ color: '#166534', marginRight: '0.3rem' }}>{item.quantity || item.qty || 1}x</strong> {item.name || item.dishId}</span>
                              <span style={{ fontSize: '0.65rem', backgroundColor: '#166534', color: '#FFFFFF', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 900 }}>
                                READY
                              </span>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeliverReadyDishes(ord)}
                          style={{
                            marginTop: '0.5rem',
                            width: '100%',
                            backgroundColor: '#166534',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '0.45rem',
                            borderRadius: '7px',
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem',
                            boxShadow: '0 2px 6px rgba(22, 101, 52, 0.2)'
                          }}
                        >
                          <Check size={13} />
                          <span>Serve {readyCount} Prepared Dish{readyCount > 1 ? 'es' : ''}</span>
                        </button>
                      </div>
                    )}

                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#166534', fontFamily: 'var(--font-heading)' }}>
                      ₹{ord.total || 0}
                    </div>
                  </div>

                  <div style={{ marginTop: '0.85rem', display: 'flex' }}>
                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab('waiter-orders')}
                      style={{ width: '100%', backgroundColor: '#0F2A1D', color: '#FFFFFF', border: 'none', padding: '0.55rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Orders
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: '1 / -1', padding: '2rem 1rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px border-dashed #CBD5E1' }}>
              <ShoppingBag size={32} color="#CBD5E1" style={{ marginBottom: '0.4rem' }} />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F2A1D' }}>No Active Floor Orders</h4>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem' }}>Database has zero orders. New QR orders will appear here automatically.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
