import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, ShoppingBag, DollarSign, Users, Clock,
  CheckCircle2, AlertCircle, Eye, ArrowUpRight, Plus, RefreshCw,
  ChevronRight, Filter, AlertTriangle, Building2, CreditCard, ArrowRight,
  UserCheck, ShieldAlert, FileText, Check, AlertOctagon, HelpCircle,
  Boxes, Flame, UtensilsCrossed
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminDashboardHome({ setActiveTab }) {
  const [chartTimeRange, setChartTimeRange] = useState('30 Days');
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [inventoryAlerts, setInventoryAlerts] = useState(() => {
    const saved = localStorage.getItem('flavora_inventory_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter(i => Number(i.stockQty) <= Number(i.minLevel));
      } catch (e) {}
    }
    return [
      { id: 'INV-02', name: 'Fresh Paneer (Cottage Cheese)', category: 'Dairy', stockQty: 4, unit: 'kg', minLevel: 10, supplier: 'Amul Dairy Distributor' },
      { id: 'INV-03', name: 'Amul Fresh Butter (500g)', category: 'Dairy', stockQty: 2, unit: 'kg', minLevel: 8, supplier: 'Amul Dairy Distributor' }
    ];
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [fetchedOrders, fetchedStaff] = await Promise.all([
        api.getOrders().catch(() => []),
        api.getStaff().catch(() => [])
      ]);
      setOrders(fetchedOrders || []);
      setStaff(fetchedStaff || []);
    } catch (err) {
      console.warn('Dashboard data load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate Dynamic Revenue & Order Totals from DB
  const dbRevenueTotal = orders.reduce((sum, ord) => {
    const amt = Number(ord.totalAmount || ord.total || ord.amount || 0);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  const totalRevenueDisplay = dbRevenueTotal > 0 
    ? `₹${(dbRevenueTotal / 100000).toFixed(2)} L` 
    : "₹14.82 L";

  const totalOrdersDisplay = orders.length > 0 
    ? orders.length.toLocaleString('en-IN') 
    : "18,642";

  // 1. KPI Cards Definition
  const kpiCards = [
    {
      id: 'total-revenue',
      title: 'Total Revenue',
      value: totalRevenueDisplay,
      badge: '↑ 18.4%',
      subtext: '+14.2% vs last month',
      trend: 'up',
      description: 'Overall revenue generated',
      variantClass: 'is-revenue-card',
      icon: DollarSign
    },
    {
      id: 'active-restaurants',
      title: 'Active Restaurants',
      value: '24',
      badge: '↑ 3 this month',
      subtext: 'Across all active cities',
      trend: 'up',
      description: 'Currently active restaurants',
      variantClass: 'is-active-card',
      iconBg: '#E8F8F5',
      iconColor: '#2E7D32',
      icon: Building2
    },
    {
      id: 'total-orders',
      title: 'Total Orders',
      value: totalOrdersDisplay,
      badge: '↑ 12.8%',
      subtext: 'Real-time POS routing',
      trend: 'up',
      description: 'Orders across all restaurants',
      variantClass: 'is-orders-card',
      iconBg: '#FFF3E0',
      iconColor: '#E07A3C',
      icon: ShoppingBag
    },
    {
      id: 'pending-settlements',
      title: 'Pending Settlements',
      value: '₹3.24 L',
      badge: 'Requires attention',
      subtext: 'Payout action required',
      trend: 'warning',
      description: 'Amount awaiting settlement',
      variantClass: 'is-warning-card',
      iconBg: '#FEF2F2',
      iconColor: '#DC2626',
      icon: AlertTriangle
    }
  ];

  // 2. Sales & Revenue Trend Hourly / Period Bars
  const timeRangeFilterOptions = ['Today', '7 Days', '30 Days', '3 Months', '1 Year'];

  const chartDataMap = {
    'Today': [
      { label: '8 AM', revenue: 35000, orders: 42, height: 40 },
      { label: '10 AM', revenue: 55000, orders: 68, height: 60 },
      { label: '12 PM', revenue: 145000, orders: 180, height: 130 },
      { label: '2 PM', revenue: 168000, orders: 210, height: 150 },
      { label: '4 PM', revenue: 72000, orders: 95, height: 75 },
      { label: '6 PM', revenue: 98000, orders: 120, height: 95 },
      { label: '8 PM', revenue: 195000, orders: 245, height: 165 },
      { label: '10 PM', revenue: 132000, orders: 160, height: 120 }
    ],
    '7 Days': [
      { label: 'Mon', revenue: 185000, orders: 220, height: 85 },
      { label: 'Tue', revenue: 210000, orders: 260, height: 100 },
      { label: 'Wed', revenue: 195000, orders: 240, height: 90 },
      { label: 'Thu', revenue: 240000, orders: 295, height: 115 },
      { label: 'Fri', revenue: 310000, orders: 380, height: 145 },
      { label: 'Sat', revenue: 385000, orders: 470, height: 170 },
      { label: 'Sun', revenue: 360000, orders: 440, height: 160 }
    ],
    '30 Days': [
      { label: 'Week 1', revenue: 3450000, orders: 4200, height: 110 },
      { label: 'Week 2', revenue: 3850000, orders: 4750, height: 130 },
      { label: 'Week 3', revenue: 4120000, orders: 5100, height: 145 },
      { label: 'Week 4', revenue: 4400000, orders: 5400, height: 160 }
    ],
    '3 Months': [
      { label: 'Month 1', revenue: 12400000, orders: 15200, height: 120 },
      { label: 'Month 2', revenue: 13800000, orders: 16800, height: 140 },
      { label: 'Month 3', revenue: 14820000, orders: 18642, height: 165 }
    ],
    '1 Year': [
      { label: 'Q1', revenue: 32500000, orders: 41000, height: 110 },
      { label: 'Q2', revenue: 38200000, orders: 48000, height: 135 },
      { label: 'Q3', revenue: 41800000, orders: 52500, height: 150 },
      { label: 'Q4', revenue: 46500000, orders: 58000, height: 170 }
    ]
  };

  const activeBars = chartDataMap[chartTimeRange] || chartDataMap['30 Days'];

  // 3. Top Performing Restaurants Data
  const topRestaurants = [
    { name: 'Jubilee Hills (Main Branch)', revenue: '₹4.82 L', orders: '1,248', growth: '+18.2%' },
    { name: 'Banjara Hills Branch', revenue: '₹3.91 L', orders: '1,052', growth: '+14.6%' },
    { name: 'Madhapur Branch', revenue: '₹3.24 L', orders: '894', growth: '+11.8%' },
    { name: 'Gachibowli Branch', revenue: '₹2.15 L', orders: '610', growth: '+9.4%' },
    { name: 'Hitech City Branch', revenue: '₹1.70 L', orders: '480', growth: '+7.2%' }
  ];

  // 4. Recent Transactions Data
  const recentTransactions = [
    { txnId: 'TXN1024', restaurant: 'Jubilee Hills (Main)', amount: '₹2,840', status: 'Paid', date: 'Aug 20, 2026' },
    { txnId: 'TXN1023', restaurant: 'Banjara Hills Branch', amount: '₹1,240', status: 'Paid', date: 'Aug 20, 2026' },
    { txnId: 'TXN1022', restaurant: 'Madhapur Branch', amount: '₹860', status: 'Pending', date: 'Aug 20, 2026' },
    { txnId: 'TXN1021', restaurant: 'Jubilee Hills (Main)', amount: '₹3,420', status: 'Paid', date: 'Aug 19, 2026' },
    { txnId: 'TXN1020', restaurant: 'Gachibowli Branch', amount: '₹1,950', status: 'Paid', date: 'Aug 19, 2026' }
  ];

  return (
    <div className="admin-dashboard-container">

      {/* ================= 1. DASHBOARD HEADER ================= */}
      <div className="admin-dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div className="page-breadcrumb-bar">
            <span>Admin</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Dashboard Overview</span>
          </div>
          <h1 className="admin-page-title">Dashboard Overview</h1>
          <p className="admin-page-subtitle">
            Real-time platform performance and business insights.
          </p>
        </div>
      </div>

      {/* ================= 2. REPLACE / UPDATE KPI CARDS ================= */}
      <div className="admin-kpi-grid">
        {kpiCards.map((kpi) => {
          const IconComp = kpi.icon;
          return (
            <div 
              key={kpi.id} 
              className={`admin-kpi-card ${kpi.variantClass}`}
            >
              <div className="admin-kpi-header">
                <span className="admin-kpi-label">{kpi.title}</span>
                <div 
                  className="admin-kpi-icon-badge" 
                  style={{ backgroundColor: kpi.iconBg, color: kpi.iconColor }}
                >
                  <IconComp size={18} />
                </div>
              </div>

              <div className="admin-kpi-value-row">
                <span className="admin-kpi-value">{kpi.value}</span>
                <span 
                  className={`admin-kpi-trend-tag ${kpi.trend === 'warning' ? 'is-alert' : ''}`}
                >
                  {kpi.trend === 'up' && <TrendingUp size={13} />}
                  {kpi.trend === 'warning' && <AlertTriangle size={13} />}
                  <span>{kpi.badge}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= 3. SALES & REVENUE TREND CHART ================= */}
      <div className="admin-card mb-4" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
        <div className="admin-card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="admin-card-title">Sales & Revenue Trend</h2>
            <p className="admin-card-subtitle">Platform revenue growth, volume, and period statistics</p>
          </div>

          {/* Time Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', background: '#F5EFE6', padding: '0.25rem', borderRadius: '8px' }}>
            {timeRangeFilterOptions.map((range) => (
              <button
                key={range}
                onClick={() => setChartTimeRange(range)}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: 'none',
                  background: chartTimeRange === range ? '#1E4636' : 'transparent',
                  color: chartTimeRange === range ? '#FFFFFF' : '#5C5C5C',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic SVG Bar Chart */}
        <div className="admin-chart-container" style={{ marginTop: '1.25rem' }}>
          <svg viewBox="0 0 1000 220" className="admin-svg-chart">
            <line x1="40" y1="30" x2="960" y2="30" stroke="#F0E8DA" strokeDasharray="4 4" />
            <line x1="40" y1="80" x2="960" y2="80" stroke="#F0E8DA" strokeDasharray="4 4" />
            <line x1="40" y1="130" x2="960" y2="130" stroke="#F0E8DA" strokeDasharray="4 4" />
            <line x1="40" y1="180" x2="960" y2="180" stroke="#E5DBC8" />

            <text x="30" y="34" fontSize="10" fill="#9A9A9A" textAnchor="end">₹50 L</text>
            <text x="30" y="84" fontSize="10" fill="#9A9A9A" textAnchor="end">₹30 L</text>
            <text x="30" y="134" fontSize="10" fill="#9A9A9A" textAnchor="end">₹10 L</text>
            <text x="30" y="184" fontSize="10" fill="#9A9A9A" textAnchor="end">₹0</text>

            {activeBars.map((bar, i) => {
              const totalCount = activeBars.length;
              const spacing = 880 / (totalCount + 1);
              const x = 70 + (i + 1) * spacing;
              const barY = 180 - bar.height;
              return (
                <g key={i} className="chart-bar-group">
                  <rect 
                    x={x - 18} 
                    y={barY} 
                    width="36" 
                    height={bar.height} 
                    rx="6" 
                    fill="#1E4636" 
                    className="chart-bar-rect"
                  />
                  <circle cx={x} cy={barY - 8} r="4" fill="#E07A3C" />
                  <text x={x} y="200" fontSize="11" fill="#5C5C5C" textAnchor="middle" fontWeight="700">
                    {bar.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="admin-chart-footer-stats" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <div className="stat-pill">
            <span className="stat-label">Selected Period:</span>
            <span className="stat-val">{chartTimeRange}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Period Revenue:</span>
            <span className="stat-val" style={{ color: '#1E4636' }}>
              ₹{activeBars.reduce((s, b) => s + b.revenue, 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Period Orders:</span>
            <span className="stat-val" style={{ color: '#E07A3C' }}>
              {activeBars.reduce((s, b) => s + b.orders, 0).toLocaleString('en-IN')} orders
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Growth Rate:</span>
            <span className="stat-val" style={{ color: '#3F8F5B' }}>↑ 18.4% YoY</span>
          </div>
        </div>
      </div>

      {/* ================= 4. PAYMENT & SETTLEMENTS OVERVIEW ================= */}
      <div className="admin-card mb-4" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
        <div className="admin-card-header mb-3" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 className="admin-card-title" style={{ fontSize: '1.1rem', fontWeight: 800 }}>Payment & Settlements</h2>
            <p className="admin-card-subtitle">Financial reconciliation summary across platform</p>
          </div>
          <button 
            className="btn btn-sm"
            onClick={() => setActiveTab && setActiveTab('payments')}
            style={{
              background: 'linear-gradient(135deg, #1E4636 0%, #0F2A1D 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.82rem',
              boxShadow: '0 4px 12px rgba(30, 70, 54, 0.25)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s ease'
            }}
          >
            <span>View Settlements</span>
            <span style={{ color: '#F2C14E', fontWeight: 900 }}>→</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ padding: '1rem', background: '#FAF6EE', borderRadius: '10px', border: '1px solid #EAE3D2' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>Total Collected</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1E4636', marginTop: '0.2rem' }}>₹18.42 L</div>
          </div>

          <div style={{ padding: '1rem', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
            <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 700 }}>Settled</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#166534', marginTop: '0.2rem' }}>₹15.18 L</div>
          </div>

          <div style={{ padding: '1rem', background: '#FEF9C3', borderRadius: '10px', border: '1px solid #FEF08A' }}>
            <div style={{ fontSize: '0.78rem', color: '#854D0E', fontWeight: 700 }}>Pending</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#854D0E', marginTop: '0.2rem' }}>₹3.24 L</div>
          </div>

          <div style={{ padding: '1rem', background: '#FEF2F2', borderRadius: '10px', border: '1px solid #FCA5A5' }}>
            <div style={{ fontSize: '0.78rem', color: '#991B1B', fontWeight: 700 }}>Refunds</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#991B1B', marginTop: '0.2rem' }}>₹42,800</div>
          </div>
        </div>
      </div>

      {/* ================= 6. TOP SELLING DISHES & INVENTORY ALERTS ================= */}
      <div className="admin-grid-12" style={{ marginBottom: '1.75rem' }}>
        
        {/* Top Selling Dishes (6 cols) */}
        <div className="admin-card col-span-6" style={{ padding: '1.5rem' }}>
          <div className="admin-card-header mb-3" style={{ justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Flame size={18} color="#E07A3C" />
                <h2 className="admin-card-title" style={{ fontSize: '1.1rem', fontWeight: 800 }}>Top Selling Dishes</h2>
              </div>
              <p className="admin-card-subtitle">Highest volume dishes sold across all partner restaurants</p>
            </div>
            <button 
              className="btn btn-sm"
              onClick={() => setActiveTab && setActiveTab('menu-mgmt')}
              style={{
                background: 'linear-gradient(135deg, #1E4636 0%, #0F2A1D 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.82rem',
                boxShadow: '0 4px 12px rgba(30, 70, 54, 0.25)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s ease'
              }}
            >
              <span>View Menu</span>
              <span style={{ color: '#F2C14E', fontWeight: 900 }}>→</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem' }}>
            {[
              { name: 'Hyderabad Dum Biryani', category: 'Main Course', sold: '1,480 portions', revenue: '₹4.44 L', tag: '🔥 Bestseller', tagBg: '#FEF9C3', tagColor: '#854D0E' },
              { name: 'Special Butter Chicken', category: 'Main Course', sold: '1,210 portions', revenue: '₹3.87 L', tag: '🔥 Trending', tagBg: '#F0FDF4', tagColor: '#166534' },
              { name: 'Paneer Butter Masala', category: 'Vegetarian', sold: '980 portions', revenue: '₹2.94 L', tag: 'Popular', tagBg: '#E2F1E8', tagColor: '#1E4636' },
              { name: 'Garlic Butter Naan', category: 'Breads', sold: '2,450 portions', revenue: '₹1.47 L', tag: 'High Volume', tagBg: '#E3F2FD', tagColor: '#1565C0' },
              { name: 'Special Mango Lassi', category: 'Beverages', sold: '1,120 portions', revenue: '₹1.12 L', tag: 'Top Drink', tagBg: '#FFF3E0', tagColor: '#E65100' }
            ].map((dish, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0.95rem', background: '#FAF6EE', borderRadius: '10px', border: '1px solid #EAE3D2' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1E4636', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>{dish.name}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px', background: dish.tagBg, color: dish.tagColor }}>
                      {dish.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px', fontWeight: 600 }}>
                    {dish.category} • {dish.sold}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1E4636' }}>
                  {dish.revenue}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Inventory Alerts (6 cols) */}
        <div className="admin-card col-span-6" style={{ padding: '1.5rem' }}>
          <div className="admin-card-header mb-3" style={{ justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Boxes size={18} color="#C4632C" />
                <h2 className="admin-card-title" style={{ fontSize: '1.1rem', fontWeight: 800 }}>Inventory Stock Alerts</h2>
              </div>
              <p className="admin-card-subtitle">Real-time raw ingredient reorder thresholds</p>
            </div>
            <button 
              className="btn btn-sm"
              onClick={() => setActiveTab && setActiveTab('inventory')}
              style={{
                background: 'linear-gradient(135deg, #E07A3C 0%, #C4632C 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.82rem',
                boxShadow: '0 4px 12px rgba(224, 122, 60, 0.25)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s ease'
              }}
            >
              <span>Manage Inventory</span>
              <span style={{ color: '#FFFFFF', fontWeight: 900 }}>→</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem' }}>
            {inventoryAlerts.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#166534', background: '#F0FDF4', borderRadius: '10px', fontWeight: 700 }}>
                <CheckCircle2 size={24} color="#166534" style={{ marginBottom: '0.4rem' }} />
                <div>All raw ingredients are adequately stocked above minimum levels!</div>
              </div>
            ) : (
              inventoryAlerts.map((inv, idx) => (
                <div key={inv.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0.95rem', background: '#FEF2F2', borderRadius: '10px', border: '1px solid #FCA5A5' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertTriangle size={14} color="#DC2626" />
                      <span>{inv.name}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#7F1D1D', marginTop: '2px', fontWeight: 600 }}>
                      Category: {inv.category} • Supplier: {inv.supplier}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#DC2626' }}>
                      {inv.stockQty} {inv.unit}
                    </div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#991B1B' }}>
                      (Min: {inv.minLevel} {inv.unit})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
