import React, { useState, useEffect } from 'react';
import {
  TrendingUp, ShoppingBag, DollarSign, Users, Table2, Clock,
  CheckCircle2, AlertCircle, Eye, Plus, Utensils, X,
  ChevronRight, Sparkles, ShieldCheck, Ticket, UserCheck, Bell, RefreshCw,
  ArrowUpRight, ArrowDownRight, Layers, LayoutGrid, Check, Search, Calendar, Receipt,
  MessageSquare, Flame, CheckSquare, CornerDownRight
} from 'lucide-react';
import { api } from '../../services/api';

export default function WaiterDashboardHome({ onNavigateTab }) {
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);
  const [activeOrderFilter, setActiveOrderFilter] = useState('All');
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [activeOrders, setActiveOrders] = useState([]);
  const [tablesList, setTablesList] = useState([]);
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [dismissedUpsells, setDismissedUpsells] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch waiter dashboard data (tables, orders, assistance requests, menu)
  const fetchWaiterData = async () => {
    try {
      const [dbTables, dbOrders, dbAssistance, dbMenu] = await Promise.all([
        api.getTables().catch(() => []),
        api.getOrders().catch(() => []),
        api.getAssistanceRequests().catch(() => []),
        api.getMenuItems().catch(() => [])
      ]);

      setTablesList(dbTables || []);
      setActiveOrders(dbOrders || []);
      setAssistanceRequests(dbAssistance || []);
      setMenuItems(dbMenu || []);
    } catch (e) {
      console.error('Failed to fetch waiter dashboard data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
      fetchWaiterData();
      window.dispatchEvent(new Event('flavora_orders_updated'));
      window.dispatchEvent(new Event('flavora_tables_updated'));
    } catch (e) {
      console.error('Failed to deliver ready dishes', e);
    }
  };

  const handleUpdateAssistanceStatus = async (id, status) => {
    try {
      await api.updateAssistanceStatus(id, status);
      fetchWaiterData();
    } catch (e) {
      console.error('Failed to update assistance status', e);
    }
  };

  const handleAddUpsellToOrder = async (order, menuItem) => {
    try {
      const existingItems = Array.isArray(order.items) ? order.items : [];
      const updatedItems = [
        ...existingItems,
        {
          id: menuItem._id || menuItem.id || `item-${Date.now()}`,
          name: menuItem.name || menuItem.title,
          price: Number(menuItem.price) || 0,
          quantity: 1,
          status: 'PLACED',
          isReady: false,
          isDelivered: false
        }
      ];

      const newTotal = updatedItems.reduce((sum, i) => sum + ((i.price || 0) * (i.quantity || 1)), 0);

      await api.updateOrderStatus(order.orderId || order._id || order.id, order.status, {
        items: updatedItems,
        total: newTotal,
        finalAmount: newTotal
      });

      fetchWaiterData();
      window.dispatchEvent(new Event('flavora_orders_updated'));
    } catch (e) {
      console.error('Failed to add upsell item to order', e);
    }
  };

  // Calculations for Waiter KPIs
  const liveOrders = activeOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled');
  const pendingOrders = activeOrders.filter(o => o.status === 'Placed' || o.status === 'Preparing');
  const occupiedTablesCount = tablesList.filter(t => t.status === 'Occupied' || t.isOccupied).length;
  const totalAssignedCount = tablesList.length;

  const activeAssistance = assistanceRequests.filter(a => a.status === 'NEW' || a.status === 'ACKNOWLEDGED');

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
      value: `${occupiedTablesCount} / ${totalAssignedCount} Tables`,
      change: `↗ ${occupiedTablesCount} Occupied`,
      isPositive: true,
      isHighlighted: false,
      badgeColor: "#283593",
      accentBg: "#E8EAF6",
      icon: Layers
    },
    {
      id: 'customer_requests',
      label: "CUSTOMER REQUESTS",
      value: `${activeAssistance.length} Requests`,
      change: activeAssistance.length > 0 ? "⚡ Needs Response" : "0 Pending",
      isPositive: false,
      isHighlighted: false,
      badgeColor: "#C2410C",
      accentBg: "#FFEDD5",
      icon: Bell
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

  // Collect all orders with ready items
  const readyPickupOrders = liveOrders.filter(o => {
    const itemsList = Array.isArray(o.items) ? o.items : [];
    const readyCount = itemsList.filter(i => (i.status === 'READY' || i.isReady) && i.status !== 'DELIVERED' && !i.isDelivered).length;
    return o.status === 'Ready' || readyCount > 0;
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
            Manage assigned tables, live orders, assistance requests, and service activities.
          </p>
        </div>
      </div>

      {/* ================= 2. FOUR KPI CARDS (STRICT 4-COLUMN GRID) ================= */}
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
                justify: 'space-between'
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
            onClick={() => onNavigateTab && onNavigateTab('waiter-orders')}
            style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Receipt size={14} />
            <span>Billing & Payments</span>
          </button>
        </div>
      </div>

      {/* ================= 4. REAL-TIME CUSTOMER ASSISTANCE REQUESTS ================= */}
      {activeAssistance.length > 0 && (
        <div style={{
          backgroundColor: '#FFF7ED',
          border: '1.5px solid #FDBA74',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 15px rgba(224, 122, 60, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={18} color="#C2410C" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#9A3412' }}>
                CUSTOMER ASSISTANCE REQUESTS ({activeAssistance.length})
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', backgroundColor: '#FFEDD5', color: '#C2410C', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 800 }}>
              Live Alerts
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {activeAssistance.map((ast) => (
              <div
                key={ast._id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  border: '1px solid #FED7AA',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.6rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#0F2A1D', fontWeight: 900 }}>Table {ast.table}</strong>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: ast.status === 'NEW' ? '#DC2626' : '#D97706', backgroundColor: ast.status === 'NEW' ? '#FEE2E2' : '#FEF3C7', padding: '0.15rem 0.45rem', borderRadius: '5px' }}>
                      {ast.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#C2410C', fontWeight: 800, marginTop: '0.25rem' }}>
                    "{ast.requestType}" {ast.note ? `- ${ast.note}` : ''}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                    {new Date(ast.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {ast.status === 'NEW' && (
                    <button
                      onClick={() => handleUpdateAssistanceStatus(ast._id, 'ACKNOWLEDGED')}
                      style={{ flex: 1, backgroundColor: '#EA580C', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '0.4rem', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateAssistanceStatus(ast._id, 'RESOLVED')}
                    style={{ flex: 1, backgroundColor: '#166534', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '0.4rem', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    ✓ Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 5. READY FOR PICKUP DEDICATED SECTION ================= */}
      {readyPickupOrders.length > 0 && (
        <div style={{
          backgroundColor: '#F0FDF4',
          border: '1.5px solid #86EFAC',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 15px rgba(22, 101, 52, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} color="#166534" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#166534' }}>
                READY FOR PICKUP ({readyPickupOrders.length} ORDERS)
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', backgroundColor: '#DCFCE7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 800 }}>
              Pass Counter Ready
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {readyPickupOrders.map((ord) => {
              const rawItems = Array.isArray(ord.items) ? ord.items : [];
              const readyItems = rawItems.filter(i => (i.status === 'READY' || i.isReady) && !i.isDelivered && i.status !== 'DELIVERED');

              return (
                <div
                  key={ord._id || ord.id || ord.orderId}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    border: '1px solid #BBF7D0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.6rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.98rem', color: '#0F2A1D', fontWeight: 900 }}>Table {ord.table}</strong>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#166534', backgroundColor: '#DCFCE7', padding: '0.15rem 0.45rem', borderRadius: '5px' }}>
                        {ord.orderId || ord.id}
                      </span>
                    </div>

                    <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {readyItems.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '0.78rem', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <CheckCircle2 size={13} color="#166534" />
                          <span>{item.quantity || item.qty || 1}x {item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <button
                      onClick={() => onNavigateTab && onNavigateTab('waiter-orders')}
                      style={{ flex: 1, backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.45rem', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      View Order
                    </button>
                    <button
                      onClick={() => handleDeliverReadyDishes(ord)}
                      style={{ flex: 1, backgroundColor: '#166534', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '0.45rem', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Mark Served
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= 6. RECENT ORDERS GRID ================= */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem 1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Table2 size={18} color="#E07A3C" />
              <span>Assigned Table Orders</span>
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
              const rawItems = Array.isArray(ord.items) ? ord.items : [];
              const itemsList = rawItems.filter(i => {
                if (!i) return false;
                if (typeof i === 'string') return true;
                const s = String(i.status || '').toUpperCase().trim();
                return s !== 'CANCELLED';
              });
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
                      View Order
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: '1 / -1', padding: '2rem 1rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px border-dashed #CBD5E1' }}>
              <ShoppingBag size={32} color="#CBD5E1" style={{ marginBottom: '0.4rem' }} />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F2A1D' }}>No Active Floor Orders</h4>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem' }}>Database has zero active orders. New QR orders will appear here automatically.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
