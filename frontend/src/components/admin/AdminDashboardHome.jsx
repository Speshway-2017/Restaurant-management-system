import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, ShoppingBag, DollarSign, Users, Table2, Clock,
  CheckCircle2, AlertCircle, ChefHat, Eye, ArrowUpRight, Plus, Utensils,
  Calendar, Download, RefreshCw, ChevronRight, Filter, Sparkles, AlertTriangle
} from 'lucide-react';

export default function AdminDashboardHome({ setActiveTab }) {
  const [dateRange, setDateRange] = useState('Today');
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);

  // Realistic Restaurant Metric KPIs
  const kpiData = [
    {
      id: 'orders',
      label: "Today's Orders",
      value: "142",
      change: "+8.5%",
      trend: "up",
      subtext: "18 active in kitchen",
      badgeColor: "#E07A3C",
      accentBg: "rgba(224, 122, 60, 0.08)"
    },
    {
      id: 'tables',
      label: "Active Tables",
      value: "18 / 24",
      change: "75%",
      trend: "up",
      subtext: "6 available • 2 reserved",
      badgeColor: "#F2C14E",
      accentBg: "rgba(242, 193, 78, 0.12)"
    },
    {
      id: 'pending',
      label: "Pending Orders",
      value: "5",
      change: "Requires Action",
      trend: "alert",
      subtext: "Avg kitchen time: 14m",
      badgeColor: "#C0392B",
      accentBg: "rgba(192, 57, 43, 0.08)"
    },
    {
      id: 'aov',
      label: "Avg Order Value (AOV)",
      value: "₹595",
      change: "+3.8%",
      trend: "up",
      subtext: "Highest: Table 04 (₹2,840)",
      badgeColor: "#3F8F5B",
      accentBg: "rgba(63, 143, 91, 0.08)"
    },
    {
      id: 'sales',
      label: "Total Revenue Generated",
      value: "₹14,82,560",
      change: "+18.4%",
      trend: "up",
      subtext: "All-time total sales generated",
      badgeColor: "#1E4636",
      accentBg: "rgba(30, 70, 54, 0.08)"
    }
  ];

  // Semantic Order Status Overview Counts
  const orderStatuses = [
    { label: 'Placed', count: 4, color: '#4A7FB5', bg: 'rgba(74, 127, 181, 0.12)' },
    { label: 'Accepted', count: 6, color: '#E07A3C', bg: 'rgba(224, 122, 60, 0.12)' },
    { label: 'Preparing', count: 8, color: '#C4632C', bg: 'rgba(196, 99, 44, 0.12)' },
    { label: 'Ready', count: 3, color: '#3F8F5B', bg: 'rgba(63, 143, 91, 0.12)' },
    { label: 'Served', count: 115, color: '#5C5C5C', bg: 'rgba(92, 92, 92, 0.12)' },
    { label: 'Cancelled', count: 6, color: '#C0392B', bg: 'rgba(192, 57, 43, 0.12)' }
  ];

  // Live Kitchen Orders Summary
  const liveKitchenOrders = [
    { id: 'ORD-8941', table: 'T-04', items: 'Hyderabad Dum Biryani (x2), Paneer Tikka', amount: '₹1,240', time: '8 mins ago', status: 'Preparing', statusColor: '#C4632C' },
    { id: 'ORD-8942', table: 'T-08', items: 'Butter Chicken (x1), Garlic Naan (x4), Lassi', amount: '₹980', time: '12 mins ago', status: 'Accepted', statusColor: '#E07A3C' },
    { id: 'ORD-8943', table: 'T-02', items: 'Masala Dosa (x3), Filter Coffee (x3)', amount: '₹540', time: '4 mins ago', status: 'Placed', statusColor: '#4A7FB5' },
    { id: 'ORD-8944', table: 'T-12', items: 'Dal Makhani, Jeera Rice, Tandoori Roti (x6)', amount: '₹760', time: '16 mins ago', status: 'Ready', statusColor: '#3F8F5B' },
  ];

  // Table Occupancy Floor Plan Snapshot
  const tableSnapshot = [
    { num: 'T-01', cap: 4, status: 'occupied', orderId: 'ORD-8938', elapsed: '38m' },
    { num: 'T-02', cap: 2, status: 'occupied', orderId: 'ORD-8943', elapsed: '14m' },
    { num: 'T-03', cap: 4, status: 'available', orderId: null, elapsed: '-' },
    { num: 'T-04', cap: 6, status: 'occupied', orderId: 'ORD-8941', elapsed: '24m' },
    { num: 'T-05', cap: 2, status: 'reserved', orderId: 'RES-104', elapsed: '7:30 PM' },
    { num: 'T-06', cap: 4, status: 'cleaning', orderId: null, elapsed: '5m' },
    { num: 'T-07', cap: 4, status: 'available', orderId: null, elapsed: '-' },
    { num: 'T-08', cap: 8, status: 'occupied', orderId: 'ORD-8942', elapsed: '42m' },
  ];

  // Recent Orders Data Table
  const recentOrders = [
    { id: 'ORD-8944', table: 'Table 12', customer: 'Rahul Sharma', items: 3, total: '₹760', payment: 'UPI (Paid)', status: 'Ready', time: '11:42 AM' },
    { id: 'ORD-8943', table: 'Table 02', customer: 'Priya Patel', items: 4, total: '₹540', payment: 'Pending', status: 'Placed', time: '11:38 AM' },
    { id: 'ORD-8942', table: 'Table 08', customer: 'Amitabh Sen', items: 5, total: '₹980', payment: 'Card (Paid)', status: 'Accepted', time: '11:30 AM' },
    { id: 'ORD-8941', table: 'Table 04', customer: 'Ananya Roy', items: 3, total: '₹1,240', payment: 'UPI (Paid)', status: 'Preparing', time: '11:22 AM' },
    { id: 'ORD-8940', table: 'Table 06', customer: 'Vikram Malhotra', items: 6, total: '₹1,850', payment: 'Cash (Paid)', status: 'Served', time: '11:10 AM' },
    { id: 'ORD-8939', table: 'Takeaway', customer: 'Suresh Kumar', items: 2, total: '₹420', payment: 'UPI (Paid)', status: 'Served', time: '10:55 AM' },
  ];

  // Top Performing Indian Menu Items
  const topMenuItems = [
    { name: 'Special Chicken Dum Biryani', category: 'Main Course', orders: 48, revenue: '₹18,240', rating: '4.9 ★', img: '/hero_dish_2.png' },
    { name: 'Amritsari Paneer Tikka', category: 'Starters', orders: 36, revenue: '₹11,520', rating: '4.8 ★', img: '/carousel_2.png' },
    { name: 'Classic Butter Chicken', category: 'Main Course', orders: 32, revenue: '₹14,080', rating: '4.9 ★', img: '/carousel_3.png' },
    { name: 'Hyderabadi Veg Biryani', category: 'Main Course', orders: 28, revenue: '₹8,960', rating: '4.7 ★', img: '/carousel_1.png' },
    { name: 'Ghee Roast Masala Dosa', category: 'South Indian', orders: 25, revenue: '₹4,500', rating: '4.8 ★', img: '/hero_dish_2.png' },
  ];

  // Recent Audit Activity Log
  const activityLog = [
    { time: '11:42 AM', action: 'Order ORD-8944 marked as Ready by Chef Kumar', type: 'order' },
    { time: '11:38 AM', action: 'New order ORD-8943 received for Table 02 (₹540)', type: 'new' },
    { time: '11:30 AM', action: 'Table 08 bill generated & settled via Card', type: 'payment' },
    { time: '11:15 AM', action: 'Menu item "Paneer Tikka" price updated to ₹320', type: 'menu' },
    { time: '10:45 AM', action: 'Shift check-in confirmed for Waiter Ramesh', type: 'staff' },
  ];

  return (
    <div className="admin-dashboard-container">

      {/* ================= PAGE HEADER ================= */}
      <div className="admin-dashboard-header">
        <div>
          <div className="page-breadcrumb-bar">
            <span>Admin</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Dashboard Overview</span>
          </div>
          <h1 className="admin-page-title">Dashboard Overview</h1>
          <p className="admin-page-subtitle">
            Real-time performance metrics and live restaurant operations.
          </p>
        </div>
      </div>

      {/* ================= 1. KPI CARDS SECTION ================= */}
      <div className="admin-kpi-grid">
        {kpiData.map((kpi) => (
          <div key={kpi.id} className={`admin-kpi-card ${kpi.id === 'sales' ? 'is-revenue-card' : ''}`}>
            <div className="admin-kpi-header">
              <span className="admin-kpi-label">{kpi.label}</span>
              <div 
                className="admin-kpi-icon-badge" 
                style={{ backgroundColor: kpi.accentBg, color: kpi.badgeColor }}
              >
                {kpi.id === 'sales' && <DollarSign size={16} />}
                {kpi.id === 'orders' && <ShoppingBag size={16} />}
                {kpi.id === 'tables' && <Table2 size={16} />}
                {kpi.id === 'pending' && <AlertCircle size={16} />}
                {kpi.id === 'aov' && <TrendingUp size={16} />}
              </div>
            </div>

            <div className="admin-kpi-value-row">
              <span className="admin-kpi-value">{kpi.value}</span>
              <span className={`admin-kpi-trend-tag ${kpi.trend === 'alert' ? 'is-alert' : ''}`}>
                {kpi.trend === 'up' && <TrendingUp size={13} />}
                {kpi.trend === 'alert' && <AlertTriangle size={13} />}
                <span>{kpi.change}</span>
              </span>
            </div>

            <div className="admin-kpi-footer">
              <span>{kpi.subtext}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ================= 2. SALES OVERVIEW CHART ================= */}
      <div className="admin-grid-12">
        
        {/* Sales & Orders Hourly Trend Chart (12 Cols Full Width) */}
        <div className="admin-card col-span-12">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">Sales & Revenue Trend</h2>
              <p className="admin-card-subtitle">Hourly revenue generation vs order volume today</p>
            </div>
            <div className="admin-chart-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#1E4636' }}></span>
                <span>Revenue (₹)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#E07A3C' }}></span>
                <span>Orders Count</span>
              </div>
            </div>
          </div>

          {/* Interactive SVG Bar Visualization */}
          <div className="admin-chart-container">
            <svg viewBox="0 0 1000 220" className="admin-svg-chart">
              {/* Grid Lines */}
              <line x1="40" y1="30" x2="960" y2="30" stroke="#F0E8DA" strokeDasharray="4 4" />
              <line x1="40" y1="80" x2="960" y2="80" stroke="#F0E8DA" strokeDasharray="4 4" />
              <line x1="40" y1="130" x2="960" y2="130" stroke="#F0E8DA" strokeDasharray="4 4" />
              <line x1="40" y1="180" x2="960" y2="180" stroke="#E5DBC8" />

              {/* Y-Axis Labels */}
              <text x="30" y="34" fontSize="10" fill="#9A9A9A" textAnchor="end">₹25k</text>
              <text x="30" y="84" fontSize="10" fill="#9A9A9A" textAnchor="end">₹15k</text>
              <text x="30" y="134" fontSize="10" fill="#9A9A9A" textAnchor="end">₹5k</text>
              <text x="30" y="184" fontSize="10" fill="#9A9A9A" textAnchor="end">₹0</text>

              {/* Hourly Data Bars (8 AM - 10 PM) */}
              {[
                { time: '8 AM', rev: 35, ord: 12, height: 25 },
                { time: '10 AM', rev: 55, ord: 18, height: 45 },
                { time: '12 PM', rev: 140, ord: 42, height: 115 },
                { time: '2 PM', rev: 165, ord: 48, height: 140 },
                { time: '4 PM', rev: 70, ord: 22, height: 55 },
                { time: '6 PM', rev: 95, ord: 30, height: 75 },
                { time: '8 PM', rev: 190, ord: 54, height: 155 },
                { time: '10 PM', rev: 130, ord: 38, height: 105 }
              ].map((bar, i) => {
                const x = 85 + i * 114;
                const barY = 180 - bar.height;
                return (
                  <g key={i} className="chart-bar-group">
                    {/* Primary Forest Green Revenue Bar */}
                    <rect 
                      x={x - 18} 
                      y={barY} 
                      width="36" 
                      height={bar.height} 
                      rx="6" 
                      fill="#1E4636" 
                      className="chart-bar-rect"
                    />
                    {/* Secondary Turmeric Accent Dot */}
                    <circle cx={x} cy={barY - 8} r="4" fill="#E07A3C" />
                    <text x={x} y="200" fontSize="11" fill="#5C5C5C" textAnchor="middle" fontWeight="600">
                      {bar.time}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="admin-chart-footer-stats">
            <div className="stat-pill">
              <span className="stat-label">Peak Hour:</span>
              <span className="stat-val">8:00 PM - 9:00 PM (₹19,200)</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">Lunch vs Dinner:</span>
              <span className="stat-val">Lunch 42% • Dinner 58%</span>
            </div>
          </div>
        </div>

      </div>

      {/* ================= 3. LIVE KITCHEN QUEUE & FLOOR PLAN SNAPSHOT ================= */}
      <div className="admin-grid-12">

        {/* Live Kitchen Queue (7 Cols) */}
        <div className="admin-card col-span-7">
          <div className="admin-card-header">
            <div className="admin-card-title-with-icon">
              <ChefHat size={20} color="#1E4636" />
              <div>
                <h2 className="admin-card-title">Live Kitchen Queue</h2>
                <p className="admin-card-subtitle">Active kitchen order tickets</p>
              </div>
            </div>

            <button 
              className="admin-link-btn"
              onClick={() => setActiveTab('orders')}
            >
              <span>View Kitchen KDS</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="admin-live-orders-grid">
            {liveKitchenOrders.map((ord) => (
              <div key={ord.id} className="admin-live-order-ticket">
                <div className="ticket-header">
                  <div className="ticket-id-tag">
                    <span className="ticket-table">{ord.table}</span>
                    <span className="ticket-id">{ord.id}</span>
                  </div>
                  <span 
                    className="ticket-status-pill"
                    style={{ backgroundColor: `${ord.statusColor}18`, color: ord.statusColor, border: `1px solid ${ord.statusColor}40` }}
                  >
                    {ord.status}
                  </span>
                </div>

                <div className="ticket-items">{ord.items}</div>

                <div className="ticket-footer">
                  <span className="ticket-time">
                    <Clock size={13} />
                    {ord.time}
                  </span>
                  <span className="ticket-amount">{ord.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floor Plan Snapshot (5 Cols) */}
        <div className="admin-card col-span-5">
          <div className="admin-card-header">
            <div className="admin-card-title-with-icon">
              <Table2 size={20} color="#1E4636" />
              <div>
                <h2 className="admin-card-title">Tables & Floor Plan</h2>
                <p className="admin-card-subtitle">Table occupancy status</p>
              </div>
            </div>

            <button 
              className="admin-link-btn"
              onClick={() => setActiveTab('tables')}
            >
              <span>Floor Map</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Quick Status Legend Bar */}
          <div className="admin-table-legend-bar">
            <span className="legend-chip is-occupied">18 Occupied</span>
            <span className="legend-chip is-available">6 Available</span>
            <span className="legend-chip is-reserved">2 Reserved</span>
            <span className="legend-chip is-cleaning">1 Cleaning</span>
          </div>

          {/* Mini Table Grid */}
          <div className="admin-mini-table-grid">
            {tableSnapshot.map((tbl) => (
              <div 
                key={tbl.num} 
                className={`admin-table-mini-card is-${tbl.status}`}
              >
                <div className="tbl-num">{tbl.num}</div>
                <div className="tbl-cap">{tbl.cap} Seats</div>
                <div className="tbl-status-tag">{tbl.status}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ================= 4. RECENT ORDERS DATA TABLE ================= */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">Recent Restaurant Orders</h2>
            <p className="admin-card-subtitle">Real-time order logs and payment status</p>
          </div>

          <button 
            className="btn btn-outline"
            onClick={() => setActiveTab('orders')}
          >
            <span>View All Orders</span>
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Table</th>
                <th>Customer</th>
                <th>Items Count</th>
                <th>Total Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Time</th>
                <th text-align="right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((ord) => (
                <tr key={ord.id}>
                  <td className="font-semibold" style={{ color: '#1E4636' }}>{ord.id}</td>
                  <td>{ord.table}</td>
                  <td>{ord.customer}</td>
                  <td>{ord.items} Items</td>
                  <td className="font-semibold">{ord.total}</td>
                  <td>
                    <span className={`payment-chip ${ord.payment.includes('Paid') ? 'is-paid' : 'is-pending'}`}>
                      {ord.payment}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge-unified is-${ord.status.toLowerCase()}`}>
                      {ord.status}
                    </span>
                  </td>
                  <td style={{ color: '#5C5C5C', fontSize: '0.82rem' }}>{ord.time}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="admin-icon-action-btn"
                      onClick={() => setSelectedOrderModal(ord)}
                      title="View Details"
                    >
                      <Eye size={15} color="#1E4636" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= 5. MENU PERFORMANCE & QUICK ACTIONS ================= */}
      <div className="admin-grid-12">

        {/* Top Menu Items (7 Cols) */}
        <div className="admin-card col-span-7">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">Top Performing Menu Items</h2>
              <p className="admin-card-subtitle">Highest volume and revenue generators</p>
            </div>
            <button 
              className="admin-link-btn"
              onClick={() => setActiveTab('menu-mgmt')}
            >
              <span>Menu Manager</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="admin-menu-perf-list">
            {topMenuItems.map((item, index) => (
              <div key={item.name} className="admin-menu-perf-row">
                <span className="rank-num">#{index + 1}</span>
                <img src={item.img} alt={item.name} className="menu-item-thumb" />
                <div className="menu-item-info">
                  <div className="menu-item-name">{item.name}</div>
                  <div className="menu-item-cat">{item.category} • {item.rating}</div>
                </div>
                <div className="menu-item-stats">
                  <div className="menu-orders-cnt">{item.orders} Orders</div>
                  <div className="menu-revenue">{item.revenue}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Admin Actions & Activity Stream (5 Cols) */}
        <div className="admin-card col-span-5">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">Quick Actions & Activity</h2>
              <p className="admin-card-subtitle">Shortcuts and audit stream</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="admin-quick-actions-grid">
            <button className="quick-action-btn" onClick={() => setActiveTab('menu-mgmt')}>
              <Plus size={16} color="#1E4636" />
              <span>Add Menu Item</span>
            </button>

            <button className="quick-action-btn" onClick={() => setActiveTab('tables')}>
              <Plus size={16} color="#1E4636" />
              <span>Add Table</span>
            </button>

            <button className="quick-action-btn" onClick={() => setActiveTab('staff-accounts')}>
              <Plus size={16} color="#1E4636" />
              <span>Add Staff</span>
            </button>

            <button className="quick-action-btn" onClick={() => setActiveTab('coupons')}>
              <Plus size={16} color="#E07A3C" />
              <span>Create Coupon</span>
            </button>
          </div>

          {/* Activity Timeline */}
          <div className="admin-activity-timeline">
            <div className="timeline-title">Audit Activity Stream</div>
            {activityLog.map((log, i) => (
              <div key={i} className="timeline-item">
                <span className="timeline-time">{log.time}</span>
                <span className="timeline-text">{log.action}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ================= ORDER DETAILS MODAL ================= */}
      {selectedOrderModal && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrderModal(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Order Details — {selectedOrderModal.id}</h3>
                <p className="admin-modal-sub">{selectedOrderModal.table} • {selectedOrderModal.customer}</p>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedOrderModal(null)}>
                ×
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="modal-info-row">
                <span>Status:</span>
                <strong className={`status-badge-unified is-${selectedOrderModal.status.toLowerCase()}`}>
                  {selectedOrderModal.status}
                </strong>
              </div>
              <div className="modal-info-row">
                <span>Payment:</span>
                <strong>{selectedOrderModal.payment}</strong>
              </div>
              <div className="modal-info-row">
                <span>Time Placed:</span>
                <span>Today at {selectedOrderModal.time}</span>
              </div>

              <div className="modal-divider"></div>

              <div className="modal-items-summary">
                <div className="modal-item-line">
                  <span>Special Chicken Dum Biryani (x2)</span>
                  <span>₹760</span>
                </div>
                <div className="modal-item-line">
                  <span>Butter Naan (x4)</span>
                  <span>₹240</span>
                </div>
                <div className="modal-item-line">
                  <span>Sweet Lassi (x2)</span>
                  <span>₹240</span>
                </div>
              </div>

              <div className="modal-divider"></div>

              <div className="modal-bill-breakdown">
                <div className="bill-row">
                  <span>Subtotal:</span>
                  <span>₹1,240</span>
                </div>
                <div className="bill-row">
                  <span>GST (5% Restaurant):</span>
                  <span>₹62</span>
                </div>
                <div className="bill-row font-bold text-lg" style={{ color: '#1E4636' }}>
                  <span>Total Amount:</span>
                  <span>₹1,302</span>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedOrderModal(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedOrderModal(null)}>
                Print Invoice / KDS
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
