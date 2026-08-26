import React, { useState, useEffect } from 'react';
import {
  TrendingUp, ShoppingBag, DollarSign, Users, Table2, Clock,
  CheckCircle2, AlertCircle, ChefHat, Eye, Plus, Utensils, X,
  ChevronRight, Sparkles, ShieldCheck, Ticket, UserCheck, Bell, RefreshCw,
  ArrowUpRight, ArrowDownRight, Layers, LayoutGrid, Check, Search, Calendar
} from 'lucide-react';
import { api } from '../../services/api';

export default function ManagerDashboardHome({ setActiveTab }) {
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);
  const [activeOrderFilter, setActiveOrderFilter] = useState('All');
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [quickActionFilter, setQuickActionFilter] = useState('All Actions');
  const [activityFilter, setActivityFilter] = useState('All');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);



  // Manager Live Orders & Tables State
  const [activeOrders, setActiveOrders] = useState([]);
  const [tablesList, setTablesList] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [staffShiftLogs, setStaffShiftLogs] = useState([]);

  const allQuickActions = [
    {
      id: 'qa_orders',
      title: 'Live Floor Orders',
      desc: `${(activeOrders || []).length} Active • KDS Status`,
      category: 'Floor & Orders',
      targetTab: 'manager-orders',
      icon: ShoppingBag,
      iconBg: '#DCFCE7',
      iconColor: '#15803D',
      titleColor: '#166534',
      borderColor: '#BBF7D0',
      shadow: '0 4px 14px rgba(22, 101, 52, 0.06)'
    },
    {
      id: 'qa_tables',
      title: 'Table & QR Standees',
      desc: 'View, Paste & Print QRs',
      category: 'Floor & Orders',
      targetTab: 'tables',
      icon: Table2,
      iconBg: '#FFEDD5',
      iconColor: '#C2410C',
      titleColor: '#9A3412',
      borderColor: '#FED7AA',
      shadow: '0 4px 14px rgba(224, 122, 60, 0.06)'
    },
    {
      id: 'qa_staff',
      title: 'Staff Attendance Logs',
      desc: 'Staff Logged On Duty',
      category: 'Staff & Offers',
      targetTab: 'manager-staff',
      icon: UserCheck,
      iconBg: '#E0E7FF',
      iconColor: '#3730A3',
      titleColor: '#312E81',
      borderColor: '#C7D2FE',
      shadow: '0 4px 14px rgba(40, 53, 147, 0.06)'
    },
    {
      id: 'qa_coupons',
      title: 'Approve Coupons',
      desc: 'Active Coupons & Offers',
      category: 'Staff & Offers',
      targetTab: 'manager-coupons',
      icon: Ticket,
      iconBg: '#FEF3C7',
      iconColor: '#B45309',
      titleColor: '#92400E',
      borderColor: '#FDE68A',
      shadow: '0 4px 14px rgba(180, 83, 9, 0.06)'
    },
    {
      id: 'qa_menu',
      title: 'Menu & Item Stock',
      desc: 'Active Dishes & Prices',
      category: 'Menu & Setup',
      targetTab: 'manager-menu',
      icon: Utensils,
      iconBg: '#F3E8FF',
      iconColor: '#7E22CE',
      titleColor: '#6B21A8',
      borderColor: '#E9D5FF',
      shadow: '0 4px 14px rgba(126, 34, 206, 0.06)'
    },
    {
      id: 'qa_reports',
      title: 'Shift Reports & Analytics',
      desc: 'Z-Report & Revenue',
      category: 'Floor & Orders',
      targetTab: 'manager-reports',
      icon: TrendingUp,
      iconBg: '#E0F2FE',
      iconColor: '#0369A1',
      titleColor: '#075985',
      borderColor: '#BAE6FD',
      shadow: '0 4px 14px rgba(3, 105, 161, 0.06)'
    },
    {
      id: 'qa_settings',
      title: 'Branch & KDS Settings',
      desc: 'Jubilee Hills Config',
      category: 'Menu & Setup',
      targetTab: 'manager-settings',
      icon: ShieldCheck,
      iconBg: '#F1F5F9',
      iconColor: '#334155',
      titleColor: '#1E293B',
      borderColor: '#CBD5E1',
      shadow: '0 4px 14px rgba(51, 65, 85, 0.06)'
    },
    {
      id: 'qa_profile',
      title: 'My Profile & Security',
      desc: 'Manager Account Logs',
      category: 'Staff & Offers',
      targetTab: 'manager-profile',
      icon: Users,
      iconBg: '#FFE4E6',
      iconColor: '#BE123C',
      titleColor: '#9F1239',
      borderColor: '#FECDD3',
      shadow: '0 4px 14px rgba(190, 18, 60, 0.06)'
    }
  ];

  const filteredQuickActions = allQuickActions.filter(a => quickActionFilter === 'All Actions' || a.category === quickActionFilter);

  // Live time ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);



  const filteredActivities = recentActivities.filter(a => {
    if (activityFilter === 'All') return true;
    if (activityFilter === 'Orders') return a.type === 'order_placed' || a.type === 'kitchen_prep' || a.type === 'order_ready';
    if (activityFilter === 'Tables') return a.type === 'table_clean' || a.type === 'bill_paid';
    if (activityFilter === 'Payments') return a.type === 'bill_paid' || a.type === 'coupon_applied';
    return true;
  });

  // Dynamic Shift Revenue, Order Count, and Occupancy calculations
  const totalShiftRevenueNum = activeOrders.reduce((sum, ord) => {
    const p = Number(String(ord.total || 0).replace(/[^0-9.]/g, ''));
    return sum + (isNaN(p) ? 0 : p);
  }, 0);

  const formattedShiftRevenue = `₹${totalShiftRevenueNum.toLocaleString('en-IN')}`;

  const occupiedTablesCount = tablesList.filter(t => t.status === 'Occupied').length;
  const totalTablesCount = tablesList.length;
  const occupancyPercentage = totalTablesCount > 0 ? Math.round((occupiedTablesCount / totalTablesCount) * 100) : 0;

  const totalStaffCount = staffShiftLogs.length;
  const onDutyStaffCount = staffShiftLogs.filter(s => 
    s.status === 'On Duty' || s.status === 'Active' || s.status === 'In Kitchen' || s.status === 'On Floor'
  ).length;

  const staffPresentPct = totalStaffCount > 0 
    ? Math.round((onDutyStaffCount / totalStaffCount) * 100)
    : 0;

  const staffDisplayValue = `${onDutyStaffCount} / ${totalStaffCount}`;
  const staffDisplayChange = `${staffPresentPct}% Present`;

  const managerKpis = [
    {
      id: 'shift_sales',
      label: "Today's Shift Revenue",
      value: formattedShiftRevenue,
      change: totalShiftRevenueNum > 0 ? "Live Revenue" : "0 Today",
      isPositive: true,
      isHighlighted: true,
      subtext: totalShiftRevenueNum > 0 ? `Calculated from ${activeOrders.length} live orders` : "Awaiting first QR order",
      badgeColor: "#1E4636",
      accentBg: "#E8F5E9",
      icon: DollarSign
    },
    {
      id: 'active_orders',
      label: "Live Floor Orders",
      value: `${activeOrders.length} Orders`,
      change: activeOrders.length > 0 ? "Active Now" : "No Orders",
      isPositive: true,
      isHighlighted: false,
      subtext: `${activeOrders.length} QR Dine-In Orders`,
      badgeColor: "#E07A3C",
      accentBg: "#FFF3E0",
      icon: ShoppingBag
    },
    {
      id: 'staff_duty',
      label: "Staff On-Duty",
      value: staffDisplayValue,
      change: staffDisplayChange,
      isPositive: true,
      isHighlighted: false,
      subtext: "Waiters & Chefs Logged In",
      badgeColor: "#283593",
      accentBg: "#E8EAF6",
      icon: Users
    },
    {
      id: 'floor_occupancy',
      label: "Floor Table Occupancy",
      value: `${occupiedTablesCount} / ${totalTablesCount} Tables`,
      change: `${occupancyPercentage}% Occupied`,
      isPositive: true,
      isHighlighted: false,
      subtext: `${totalTablesCount - occupiedTablesCount} Tables Available For Guests`,
      badgeColor: "#00796B",
      accentBg: "#E0F2F1",
      icon: Table2
    }
  ];

  // Sync Live Backend Tables & Real Customer Orders
  useEffect(() => {
    const syncDashboardData = () => {
      const resolveTableLabel = (ord) => {
        const raw = ord.table || ord.tableNumber || ord.tableId;
        if (!raw) return 'Table 01';
        const str = String(raw).trim();
        if (str.toLowerCase().startsWith('table')) return str;
        const digits = str.replace(/[^0-9]/g, '');
        return digits ? `Table ${digits.padStart(2, '0')}` : str;
      };

      const extractDigits = (val) => {
        if (!val) return '';
        const d = String(val).replace(/[^0-9]/g, '');
        return d ? String(parseInt(d, 10)) : '';
      };

      // Fetch live tables and orders strictly from DB
      Promise.all([
        api.getTables().catch(() => []),
        api.getOrders().catch(() => [])
      ]).then(([dbTables, dbOrders]) => {
        let mergedOrdersList = [];
        if (Array.isArray(dbOrders) && dbOrders.length > 0) {
          mergedOrdersList = dbOrders.map(ord => ({
            id: ord.orderId || ord._id,
            table: resolveTableLabel(ord),
            zone: 'Main Dining',
            customer: ord.customer || ord.guestName || 'Guest Diner',
            items: Array.isArray(ord.items) ? ord.items.map(i => `${i.name || i.dishId} (x${i.quantity || i.qty || 1})`).join(', ') : (ord.items || 'Special Dish'),
            total: `₹${ord.total !== undefined ? ord.total : (ord.totalAmount || 0)}`,
            status: ord.status || 'Placed',
            time: 'Just Now',
            waiter: 'QR Self-Order'
          }));
        }

        setActiveOrders(mergedOrdersList);

        const activeOrdersOnly = mergedOrdersList.filter(o => o && o.status !== 'Completed' && o.status !== 'Cancelled' && o.status !== 'Paid');

        const baseTables = (dbTables || []).map(dbT => {
          const cleanT = extractDigits(dbT.number || dbT.name);
          const activeOrd = activeOrdersOnly.find(o => {
            const oTableClean = extractDigits(o.table || o.tableNumber);
            return oTableClean && cleanT && oTableClean === cleanT;
          });

          if (activeOrd) {
            const guestNameVal = activeOrd.customer || activeOrd.guestName || 'Guest Diner';
            const amtVal = (activeOrd.total !== undefined && activeOrd.total !== null) ? `₹${activeOrd.total}` : (activeOrd.totalAmount ? `₹${activeOrd.totalAmount}` : '₹0');
            return {
              num: dbT.number || dbT.name || `T-${cleanT}`,
              cap: dbT.seats || 4,
              status: (activeOrd.status === 'Bill Generated' || activeOrd.payment === 'Awaiting Payment') ? 'Bill Generated' : 'Occupied',
              guest: guestNameVal,
              customer: guestNameVal,
              amount: amtVal,
              orderId: activeOrd.id || activeOrd.orderId || 'ORD-ACTIVE',
              zone: dbT.section || 'Main Dining'
            };
          }

          return {
            num: dbT.number || dbT.name || `T-${cleanT}`,
            cap: dbT.seats || 4,
            status: dbT.status || 'Available',
            guest: '-',
            customer: '-',
            amount: '-',
            orderId: null,
            zone: dbT.section || 'Main Dining'
          };
        });

        setTablesList(baseTables);

        // Generate dynamic activity feed from orders
        const generatedActivities = mergedOrdersList.map((ord, idx) => ({
          id: `act-live-${idx}`,
          orderId: ord.id,
          type: ord.status === 'Completed' ? 'table_clean' : 'order_placed',
          table: ord.table,
          zone: ord.zone,
          title: ord.status === 'Completed' ? `Order #${ord.id} Completed` : `Order #${ord.id} (${ord.status || 'Placed'})`,
          status: ord.status || 'Placed',
          details: ord.items || 'Customer order details',
          amount: ord.total,
          time: ord.time,
          actor: ord.customer,
          icon: ShoppingBag,
          iconBg: ord.status === 'Completed' ? '#ECFDF5' : '#FFF3E0',
          iconColor: ord.status === 'Completed' ? '#047857' : '#E07A3C',
          badgeBg: ord.status === 'Completed' ? '#ECFDF5' : '#FEF3C7',
          badgeColor: ord.status === 'Completed' ? '#047857' : '#B45309'
        }));
        setRecentActivities(generatedActivities);
      }).catch(() => {
        setTablesList(defaultFloorTables);
      });
    };

    syncDashboardData();
    window.addEventListener('flavora_tables_updated', syncDashboardData);
    window.addEventListener('flavora_cart_updated', syncDashboardData);
    window.addEventListener('storage', syncDashboardData);
    const interval = setInterval(syncDashboardData, 3000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('flavora_tables_updated', syncDashboardData);
      window.removeEventListener('flavora_cart_updated', syncDashboardData);
      window.removeEventListener('storage', syncDashboardData);
    };
  }, []);

  // Staff Shift Logs (Fetched dynamically from database API)
  useEffect(() => {
    const fetchStaffLogs = async () => {
      try {
        const staff = await api.getStaff();
        if (Array.isArray(staff) && staff.length > 0) {
          const mapped = staff.map((st, idx) => ({
            empId: st.empId || st.staffId || `RMSW-0${idx + 1}`,
            name: st.name || st.fullName || 'Staff Member',
            role: st.role || st.designation || 'Staff',
            shift: st.shift || 'Morning Shift',
            checkIn: st.checkInTime || '09:00 AM',
            hours: st.loggedHours || 'Active',
            status: st.status || 'On Duty'
          }));
          setStaffShiftLogs(mapped);
        } else {
          setStaffShiftLogs([]);
        }
      } catch (e) {
        setStaffShiftLogs([]);
      }
    };
    fetchStaffLogs();
  }, []);

  const filteredOrders = activeOrders.filter(o => {
    const isLive = o && o.status !== 'Completed' && o.status !== 'Cancelled';
    if (!isLive) return false;
    return activeOrderFilter === 'All' || o.status === activeOrderFilter;
  });

  return (
    <div className="admin-dashboard-container" style={{ width: '100%', boxSizing: 'border-box' }}>

      {/* ================= 1. BREADCRUMBS & PAGE HEADER ================= */}
      <div className="admin-dashboard-header" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="page-breadcrumb-bar">
            <span>Manager</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Dashboard Overview</span>
          </div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            Dashboard Overview
          </h1>
          <p className="admin-page-subtitle" style={{ margin: '0.2rem 0 0 0' }}>
            Real-time platform performance and business insights.
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



      {/* ================= 2. FOUR-COLUMN OPERATIONAL METRICS SHOWCASE ================= */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', 
          gap: '1rem', 
          marginBottom: '1.5rem' 
        }}
      >
        {managerKpis.map((kpi) => {
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

                <div 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    backgroundColor: isPrimary ? '#E07A3C' : kpi.accentBg,
                    color: isPrimary ? '#FFFFFF' : kpi.badgeColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <IconComp size={16} />
                </div>
              </div>

              {/* Row 2: Main Value Number */}
              <div style={{ marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: isPrimary ? '#FFFFFF' : '#0F2A1D', fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>
                  {kpi.value}
                </span>
              </div>

              {/* Row 3: Status Trend Pill (consistently aligned on bottom row across all 4 cards) */}
              <div>
                <span 
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: isPrimary ? '#F2C14E' : (kpi.isPositive ? '#166534' : '#DC2626'),
                    backgroundColor: isPrimary ? 'rgba(242, 193, 78, 0.15)' : (kpi.isPositive ? '#F0FDF4' : '#FEF2F2'),
                    padding: '0.12rem 0.45rem',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  {kpi.isPositive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  <span>{kpi.change}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= 3. TWO-COLUMN SPLIT: FLOOR MAP & QUICK COMMANDS ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '1.75rem', alignItems: 'stretch' }}>

        {/* LEFT COLUMN: LIVE FLOOR LAYOUT SNAPSHOT */}
        <div 
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #F0EAE1',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1C130E', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', fontFamily: 'var(--font-heading)' }}>
                  <LayoutGrid size={19} color="#7A1C1C" />
                  <span>Live Dining Floor Layout Overview</span>
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                  Real-time table statuses for Jubilee Hills Main Floor.
                </p>
              </div>

              <button 
                onClick={() => setActiveTab('manager-tables')}
                style={{
                  backgroundColor: '#1E4636',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>Manage All Tables</span>
                <ChevronRight size={15} color="#F2C14E" />
              </button>
            </div>

            {/* Table Cards 4 per row grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.65rem' }}>
              {tablesList.map((tbl) => {
                const isOccupied = tbl.status === 'Occupied';
                const isAvailable = tbl.status === 'Available';
                const isCleaning = tbl.status === 'Cleaning';
                const isReserved = tbl.status === 'Reserved';

                let bg = '#F8FAFC';
                let border = '#CBD5E1';
                let text = '#475569';
                let dot = '#94A3B8';

                if (isOccupied) {
                  bg = '#FEF2F2';
                  border = '#FCA5A5';
                  text = '#991B1B';
                  dot = '#DC2626';
                } else if (isAvailable) {
                  bg = '#F0FDF4';
                  border = '#86EFAC';
                  text = '#166534';
                  dot = '#16A34A';
                } else if (isCleaning) {
                  bg = '#FFF7ED';
                  border = '#FFEDD5';
                  text = '#C2410C';
                  dot = '#EA580C';
                } else if (isReserved) {
                  bg = '#FEFCE8';
                  border = '#FDE047';
                  text = '#854D0E';
                  dot = '#CA8A04';
                }

                return (
                  <div 
                    key={tbl.num}
                    style={{
                      backgroundColor: bg,
                      border: `1.5px solid ${border}`,
                      borderRadius: '12px',
                      padding: '0.6rem 0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 900, fontSize: '0.84rem', color: text }}>{tbl.num}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: text, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: dot }} />
                        {tbl.status}
                      </span>
                    </div>

                    {isOccupied ? (
                      <div style={{ marginTop: '0.3rem', paddingTop: '0.3rem', borderTop: '1px dashed #FCA5A5' }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#991B1B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          👤 {tbl.customer && tbl.customer !== '-' ? tbl.customer : (tbl.guest && tbl.guest !== '-' ? tbl.guest : 'Guest Diner')}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.15rem', fontSize: '0.7rem', color: '#7F1D1D', fontWeight: 800 }}>
                          <span>{tbl.orderId || 'ORD-ACTIVE'}</span>
                          <span style={{ color: '#991B1B', fontWeight: 900 }}>{tbl.amount && tbl.amount !== '-' ? tbl.amount : ''}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem', fontWeight: 600 }}>
                        {tbl.cap || 4} Seats • {tbl.zone || 'Main Dining'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: QUICK COMMAND LAUNCH TILES */}
        <div 
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #F0EAE1',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ marginBottom: '1.1rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1C130E', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', fontFamily: 'var(--font-heading)' }}>
                <Sparkles size={19} color="#7A1C1C" />
                <span>Manager Command Hub</span>
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Instant access to manager tools & quick actions.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {allQuickActions.slice(0, 4).map((action) => {
                const IconComp = action.icon;
                return (
                  <div 
                    key={action.id}
                    onClick={() => setActiveTab(action.targetTab)}
                    style={{
                      backgroundColor: '#FDFBF7',
                      border: `1px solid ${action.borderColor}`,
                      borderRadius: '12px',
                      padding: '0.75rem 0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div 
                      style={{ 
                        backgroundColor: action.iconBg, 
                        color: action.iconColor, 
                        padding: '0.55rem', 
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <IconComp size={17} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.84rem', color: action.titleColor, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{action.title}</span>
                        <ChevronRight size={14} color={action.titleColor} opacity={0.6} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.1rem', fontWeight: 600 }}>
                        {action.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '0.85rem', backgroundColor: '#FAF6EE', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #EAE3D2', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#1C130E', fontWeight: 800 }}>
              Need Help? Contact Admin Support Team
            </span>
          </div>
        </div>

      </div>

      {/* ================= 4. LIVE FLOOR & KITCHEN ORDERS STREAM ================= */}
      <div 
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #F0EAE1',
          overflow: 'hidden',
          marginBottom: '1.75rem',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)'
        }}
      >
        {/* Header Bar */}
        <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#FFFFFF', borderBottom: '1px solid #F0EAE1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1C130E', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', fontFamily: 'var(--font-heading)' }}>
              <ShoppingBag size={19} color="#7A1C1C" />
              <span>Live Floor & Kitchen Orders Stream</span>
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
              Active table orders being served or prepared in real-time.
            </p>
          </div>

          {/* Filter Status Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['All', 'Placed', 'Preparing', 'Ready', 'Accepted'].map((st) => (
              <button
                key={st}
                onClick={() => setActiveOrderFilter(st)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  border: activeOrderFilter === st ? 'none' : '1px solid #CBD5E1',
                  backgroundColor: activeOrderFilter === st ? '#1E4636' : '#F1F5F9',
                  color: activeOrderFilter === st ? '#FFFFFF' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#1C130E', color: '#FAF6EE', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>ORDER ID</th>
              <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>TABLE & ZONE</th>
              <th style={{ padding: '0.65rem 0.85rem' }}>ITEMS ORDERED</th>
              <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>CUSTOMER</th>
              <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>TOTAL</th>
              <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>STATUS</th>
              <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>TIME</th>
              <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>TICKET</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: '#94A3B8' }}>
                  <ShoppingBag size={32} color="#CBD5E1" style={{ display: 'block', margin: '0 auto 0.5rem auto' }} />
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#475569' }}>No live active orders currently</div>
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>New active QR table orders will appear here in real-time.</p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((ord, index) => {
                const isCompleted = ord.status === 'Completed';
                const itemsStr = String(ord.items || '');
                const itemsList = itemsStr ? itemsStr.split(',').map(i => i.trim()) : [];
                const visibleItems = itemsList.slice(0, 2);
                const remainingCount = itemsList.length - 2;

                return (
                  <tr 
                    key={ord.id} 
                    style={{ 
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FDFBF7',
                      borderBottom: '1px solid #F4EFEA',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {/* ORDER ID */}
                    <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span style={{ 
                        fontSize: '0.82rem', 
                        fontWeight: 900, 
                        color: '#1C130E',
                        backgroundColor: '#F5F0E8',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        border: '1px solid #EAE3D2',
                        fontFamily: 'monospace',
                        display: 'inline-block'
                      }}>
                        #{ord.id}
                      </span>
                    </td>

                    {/* TABLE & ZONE */}
                    <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ 
                          fontSize: '0.78rem', 
                          fontWeight: 800, 
                          color: '#92400E', 
                          backgroundColor: '#FFF5ED', 
                          padding: '0.2rem 0.55rem', 
                          borderRadius: '6px',
                          border: '1px solid #FDE68A'
                        }}>
                          🪑 {ord.table}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>
                          ({ord.zone || 'Main Dining'})
                        </span>
                      </div>
                    </td>

                    {/* ITEMS ORDERED (STRICT SINGLE LINE) */}
                    <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', maxWidth: '360px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'nowrap', overflow: 'hidden' }}>
                        {visibleItems.map((it, idx) => (
                          <span 
                            key={idx} 
                            style={{ 
                              backgroundColor: '#FFFFFF', 
                              color: '#2D231E', 
                              padding: '0.15rem 0.45rem', 
                              borderRadius: '6px', 
                              fontSize: '0.74rem', 
                              fontWeight: 700, 
                              border: '1px solid #E8E2D5',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {it}
                          </span>
                        ))}
                        {remainingCount > 0 && (
                          <span style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', fontSize: '0.71rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                            +{remainingCount} more
                          </span>
                        )}
                      </div>
                    </td>

                    {/* CUSTOMER */}
                    <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1C130E' }}>
                        {ord.customer || 'Guest Diner'}
                      </span>
                    </td>

                    {/* TOTAL */}
                    <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#1C130E' }}>
                        {ord.total}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        fontSize: '0.73rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        backgroundColor: isCompleted ? '#ECFDF5' : ord.status === 'Preparing' ? '#FEFCE8' : ord.status === 'Ready' ? '#EFF6FF' : '#FFF7ED',
                        color: isCompleted ? '#047857' : ord.status === 'Preparing' ? '#A16207' : ord.status === 'Ready' ? '#1D4ED8' : '#C2410C',
                        border: `1px solid ${isCompleted ? '#A7F3D0' : ord.status === 'Preparing' ? '#FEF08A' : ord.status === 'Ready' ? '#BFDBFE' : '#FFEDD5'}`
                      }}>
                        <span>{isCompleted ? '✅' : ord.status === 'Preparing' ? '🍳' : ord.status === 'Ready' ? '🔔' : '🔵'}</span>
                        <span>{ord.status}</span>
                      </span>
                    </td>

                    {/* TIME */}
                    <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap', fontSize: '0.76rem', color: '#64748B', fontWeight: 700 }}>
                      {ord.time}
                    </td>

                    {/* TICKET ACTION */}
                    <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button 
                        onClick={() => setSelectedOrderModal(ord)}
                        style={{
                          backgroundColor: '#FAF6EE',
                          border: '1px solid #EAE3D2',
                          borderRadius: '8px',
                          padding: '0.3rem 0.65rem',
                          cursor: 'pointer',
                          color: '#1E4636',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.76rem',
                          fontWeight: 800
                        }}
                      >
                        <Eye size={13} color="#1E4636" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= 5. RECENT LIVE OPERATIONS & ACTIVITY FEED ================= */}
      <div 
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #F0EAE1',
          overflow: 'hidden',
          marginBottom: '1.75rem',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)'
        }}
      >
        {/* Header Bar */}
        <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#FFFFFF', borderBottom: '1px solid #F0EAE1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1C130E', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', fontFamily: 'var(--font-heading)' }}>
              <Clock size={19} color="#1E4636" />
              <span>Recent Live Operations & Activity Stream</span>
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
              Real-time audit log of customer QR orders, table status changes, and floor events.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['All', 'Orders', 'Tables', 'Payments'].map((actCat) => (
              <button
                key={actCat}
                onClick={() => setActivityFilter(actCat)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  border: activityFilter === actCat ? 'none' : '1px solid #CBD5E1',
                  backgroundColor: activityFilter === actCat ? '#1E4636' : '#F1F5F9',
                  color: activityFilter === actCat ? '#FFFFFF' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {actCat}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Table */}
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#1C130E', color: '#FAF6EE', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>TABLE & EVENT</th>
              <th style={{ padding: '0.65rem 0.85rem' }}>EVENT DETAILS</th>
              <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>AMOUNT / ACTOR</th>
              <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>TIME</th>
              <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredActivities.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: '#94A3B8' }}>
                  <Clock size={32} color="#CBD5E1" style={{ display: 'block', margin: '0 auto 0.5rem auto' }} />
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#475569' }}>No recent activity recorded</div>
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>Live QR orders & table changes will stream here dynamically.</p>
                </td>
              </tr>
            ) : (
              filteredActivities.map((act, index) => {
                const detailsStr = String(act.details || '');
                const detailItems = detailsStr ? detailsStr.split(',').map(d => d.trim()) : [];
                const visibleDetails = detailItems.slice(0, 2);
                const extraCount = detailItems.length - 2;

                return (
                  <tr 
                    key={act.id} 
                    style={{ 
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FDFBF7',
                      borderBottom: '1px solid #F4EFEA',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {/* TABLE & EVENT */}
                    <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ 
                          fontSize: '0.76rem', 
                          fontWeight: 800, 
                          color: '#92400E', 
                          backgroundColor: '#FFF5ED', 
                          padding: '0.15rem 0.5rem', 
                          borderRadius: '6px',
                          border: '1px solid #FDE68A'
                        }}>
                          🪑 {act.table}
                        </span>
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1C130E' }}>
                          {act.title}
                        </span>
                        <span style={{ backgroundColor: act.badgeBg || '#FEF3C7', color: act.badgeColor || '#B45309', fontSize: '0.68rem', fontWeight: 800, padding: '0.08rem 0.4rem', borderRadius: '4px' }}>
                          {act.zone}
                        </span>
                      </div>
                    </td>

                    {/* EVENT DETAILS (STRICT SINGLE LINE) */}
                    <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', maxWidth: '360px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'nowrap', overflow: 'hidden' }}>
                        {visibleDetails.map((dt, idx) => (
                          <span 
                            key={idx} 
                            style={{ 
                              backgroundColor: '#FFFFFF', 
                              color: '#2D231E', 
                              padding: '0.15rem 0.45rem', 
                              borderRadius: '6px', 
                              fontSize: '0.74rem', 
                              fontWeight: 700, 
                              border: '1px solid #E8E2D5',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {dt}
                          </span>
                        ))}
                        {extraCount > 0 && (
                          <span style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', fontSize: '0.71rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                            +{extraCount} more
                          </span>
                        )}
                      </div>
                    </td>

                    {/* AMOUNT / ACTOR */}
                    <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#1C130E' }}>
                        {act.amount !== '-' ? act.amount : ''}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>
                        By {act.actor}
                      </div>
                    </td>

                    {/* TIME */}
                    <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap', fontSize: '0.76rem', color: '#64748B', fontWeight: 700 }}>
                      {act.time}
                    </td>

                    {/* ACTION */}
                    <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button 
                        onClick={() => {
                          const realOrd = activeOrders.find(o => String(o.id) === String(act.orderId) || String(o.id) === String(act.id.replace('act-live-', '')));
                          setSelectedOrderModal(realOrd || { id: act.orderId || act.id, table: act.table, customer: act.actor, total: act.amount, items: act.details, status: act.status || 'Placed' });
                        }}
                        style={{
                          backgroundColor: '#FAF6EE',
                          border: '1px solid #EAE3D2',
                          borderRadius: '8px',
                          padding: '0.3rem 0.65rem',
                          cursor: 'pointer',
                          color: '#1E4636',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.76rem',
                          fontWeight: 800
                        }}
                      >
                        <Eye size={13} color="#1E4636" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= ORDER DETAILS MODAL ================= */}
      {selectedOrderModal && (
        <div 
          onClick={() => setSelectedOrderModal(null)}
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(15, 42, 29, 0.65)', 
            backdropFilter: 'blur(4px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 9999, 
            padding: '1rem' 
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              backgroundColor: '#FFFFFF', 
              borderRadius: '20px', 
              width: '100%', 
              maxWidth: '520px', 
              overflow: 'hidden', 
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)', 
              border: '1px solid #E2E8F0' 
            }}
          >
            {/* Header Banner */}
            <div 
              style={{ 
                backgroundColor: '#0F2A1D', 
                padding: '1.25rem 1.5rem', 
                color: '#FFFFFF', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>
                  Order Ticket — {selectedOrderModal.id}
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#A3D4B5', fontWeight: 600 }}>
                  {selectedOrderModal.table} ({selectedOrderModal.zone || 'Main Dining'}) • Waiter: {selectedOrderModal.waiter || 'QR Self-Order'}
                </p>
              </div>

              <button 
                onClick={() => setSelectedOrderModal(null)} 
                style={{ 
                  background: 'rgba(255,255,255,0.12)', 
                  border: 'none', 
                  color: '#FFFFFF', 
                  cursor: 'pointer', 
                  padding: '0.4rem', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Ticket Body Content */}
            <div style={{ padding: '1.5rem' }}>
              
              {/* Status & Customer Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.1rem' }}>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Order Status
                  </div>
                  <div style={{ marginTop: '0.35rem' }}>
                    {(() => {
                      const liveMatch = activeOrders.find(o => String(o.id) === String(selectedOrderModal.id));
                      const currentStatus = liveMatch ? liveMatch.status : (selectedOrderModal.status || 'Placed');
                      const isCompleted = currentStatus === 'Completed';

                      return (
                        <span 
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            backgroundColor: isCompleted ? '#ECFDF5' : currentStatus === 'Ready' ? '#EFF6FF' : currentStatus === 'Preparing' ? '#FEFCE8' : '#FFF7ED',
                            color: isCompleted ? '#047857' : currentStatus === 'Ready' ? '#1D4ED8' : currentStatus === 'Preparing' ? '#A16207' : '#C2410C',
                            border: `1px solid ${isCompleted ? '#A7F3D0' : currentStatus === 'Ready' ? '#BFDBFE' : currentStatus === 'Preparing' ? '#FEF08A' : '#FFEDD5'}`
                          }}
                        >
                          <span>{isCompleted ? '✅' : currentStatus === 'Preparing' ? '🍳' : currentStatus === 'Ready' ? '🔔' : '🔵'}</span>
                          <span>{currentStatus}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Customer Name
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F2A1D', marginTop: '0.35rem' }}>
                    {selectedOrderModal.customer || 'Guest Diner'}
                  </div>
                </div>
              </div>

              {/* Items List Box */}
              <div style={{ marginBottom: '1.1rem', backgroundColor: '#F8FAFC', padding: '1rem 1.1rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                  Items Ordered
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F2A1D', lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {selectedOrderModal.items}
                </div>
              </div>

              {/* Total Amount Payable */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.35rem', padding: '0.9rem 1.15rem', backgroundColor: '#F0FDF4', borderRadius: '14px', border: '1.5px solid #86EFAC' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total Bill Amount
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 600, marginTop: '0.1rem' }}>
                    Placed: {selectedOrderModal.time || 'Just Now'}
                  </div>
                </div>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#166534', fontFamily: 'var(--font-heading)' }}>
                  {selectedOrderModal.total}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={() => setSelectedOrderModal(null)} 
                  style={{ 
                    flex: 1, 
                    backgroundColor: '#FFFFFF', 
                    color: '#475569', 
                    border: '1.5px solid #CBD5E1', 
                    padding: '0.7rem', 
                    borderRadius: '12px', 
                    fontWeight: 800, 
                    fontSize: '0.86rem', 
                    cursor: 'pointer' 
                  }}
                >
                  Close
                </button>
                <button 
                  onClick={() => { alert(`Printing KDS Kitchen Ticket for ${selectedOrderModal.id}`); setSelectedOrderModal(null); }} 
                  style={{ 
                    flex: 2, 
                    backgroundColor: '#0F2A1D', 
                    color: '#FFFFFF', 
                    border: 'none', 
                    padding: '0.7rem', 
                    borderRadius: '12px', 
                    fontWeight: 800, 
                    fontSize: '0.86rem', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <span>Print Kitchen Ticket</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================= 5. STAFF SHIFT ATTENDANCE TRACKER ================= */}
      <div 
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #F0EAE1',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#FFFFFF', borderBottom: '1px solid #F0EAE1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1C130E', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', fontFamily: 'var(--font-heading)' }}>
              <UserCheck size={19} color="#283593" />
              <span>Staff Duty Logs & Shift Roster</span>
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
              Real-time attendance logs and active shift durations for logged-in team members.
            </p>
          </div>

          <button 
            onClick={() => setActiveTab('manager-staff')}
            style={{
              backgroundColor: '#1E4636',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span>Manage Staff Roster</span>
            <ChevronRight size={15} color="#F2C14E" />
          </button>
        </div>

        {/* Staff Table */}
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#1C130E', color: '#FAF6EE', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>EMP ID</th>
              <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>STAFF NAME</th>
              <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>ROLE</th>
              <th style={{ padding: '0.65rem 0.85rem' }}>SHIFT</th>
              <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>CHECK-IN TIME</th>
              <th style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>LOGGED DURATION</th>
              <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', whiteSpace: 'nowrap' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {staffShiftLogs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: '#94A3B8' }}>
                  <UserCheck size={32} color="#CBD5E1" style={{ display: 'block', margin: '0 auto 0.5rem auto' }} />
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#475569' }}>No active staff members logged in</div>
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>Added staff members will appear here in real-time.</p>
                </td>
              </tr>
            ) : (
              staffShiftLogs.map((stf, index) => (
                <tr 
                  key={stf.empId} 
                  style={{ 
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FDFBF7',
                    borderBottom: '1px solid #F4EFEA',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <span style={{ 
                      fontSize: '0.82rem', 
                      fontWeight: 900, 
                      color: '#1C130E',
                      backgroundColor: '#F5F0E8',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      border: '1px solid #EAE3D2',
                      fontFamily: 'monospace',
                      display: 'inline-block'
                    }}>
                      {stf.empId}
                    </span>
                  </td>
                  <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap', fontWeight: 800, color: '#1C130E', fontSize: '0.84rem' }}>
                    {stf.name}
                  </td>
                  <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap', color: '#475569', fontSize: '0.78rem', fontWeight: 700 }}>
                    {stf.role}
                  </td>
                  <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', color: '#64748B', fontSize: '0.76rem', fontWeight: 600 }}>
                    {stf.shift}
                  </td>
                  <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap', color: '#334155', fontSize: '0.76rem', fontWeight: 700 }}>
                    {stf.checkIn}
                  </td>
                  <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap', fontWeight: 800, color: '#166534', fontSize: '0.8rem' }}>
                    {stf.hours}
                  </td>
                  <td style={{ padding: '0.55rem 0.85rem', verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <span style={{ 
                      backgroundColor: '#ECFDF5', 
                      color: '#047857', 
                      border: '1px solid #A7F3D0',
                      padding: '0.2rem 0.55rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.73rem', 
                      fontWeight: 800, 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      ● {stf.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
