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
      } catch (e) {}

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
        await api.updateTableStatus(dbTable.id, newStatus).catch(() => {});
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

        {/* Live Clock Showcase */}
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
          {liveOrders.length > 0 ? (
            liveOrders.map((ord, idx) => {
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
                      🍲 {itemsCount} Items
                    </div>
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
