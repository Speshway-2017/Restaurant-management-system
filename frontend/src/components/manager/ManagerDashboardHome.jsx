import React, { useState } from 'react';
import {
  TrendingUp, ShoppingBag, DollarSign, Users, Table2, Clock,
  CheckCircle2, AlertCircle, ChefHat, Eye, Plus, Utensils,
  ChevronRight, Sparkles, ShieldCheck, Ticket, UserCheck, Bell, RefreshCw
} from 'lucide-react';

export default function ManagerDashboardHome({ setActiveTab }) {
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);

  // Tailored Manager Operational KPIs
  const managerKpis = [
    {
      id: 'shift_sales',
      label: "Today's Shift Revenue",
      value: "₹4,82,400",
      change: "+12.4%",
      subtext: "Shift 1 & 2 Sales Total",
      badgeColor: "#1E4636",
      accentBg: "rgba(30, 70, 54, 0.08)",
      icon: DollarSign
    },
    {
      id: 'active_orders',
      label: "Live Floor Orders",
      value: "18",
      change: "Active",
      subtext: "12 Diners • 6 Takeaway",
      badgeColor: "#E07A3C",
      accentBg: "rgba(224, 122, 60, 0.08)",
      icon: ShoppingBag
    },
    {
      id: 'staff_duty',
      label: "Staff On-Duty",
      value: "12 / 14",
      change: "Active Shift",
      subtext: "8 Waiters • 4 Chefs Logged In",
      badgeColor: "#283593",
      accentBg: "rgba(40, 53, 147, 0.08)",
      icon: Users
    },
    {
      id: 'discounts_issued',
      label: "Coupons Approved",
      value: "14",
      change: "Today",
      subtext: "₹2,450 Discount Redeemed",
      badgeColor: "#E07A3C",
      accentBg: "rgba(224, 122, 60, 0.08)",
      icon: Ticket
    }
  ];

  // Manager Staff Attendance Snapshot
  const staffShiftLogs = [
    { empId: 'RMSM-01', name: 'Ramesh Sharma', role: 'Resto Manager', checkIn: '09:00 AM', status: 'On Duty', hours: '5h 15m', shift: 'Morning Shift' },
    { empId: 'RMSC-01', name: 'Chef Sanjeev Kumar', role: 'Head Chef', checkIn: '09:30 AM', status: 'In Kitchen', hours: '4h 45m', shift: 'Morning Shift' },
    { empId: 'RMSW-04', name: 'Priya Verma', role: 'Sr. Waiter', checkIn: '10:00 AM', status: 'On Floor', hours: '4h 15m', shift: 'Morning Shift' },
    { empId: 'RMSW-08', name: 'Amit Singh', role: 'Captain', checkIn: '10:15 AM', status: 'On Floor', hours: '4h 00m', shift: 'Morning Shift' },
  ];

  // Manager Live Orders Overview
  const activeOrders = [
    { id: 'ORD-9012', table: 'Table 04', items: 'Hyderabad Dum Biryani (x2), Lassi', total: '₹1,240', status: 'Preparing', time: '8 mins ago', waiter: 'Priya V.' },
    { id: 'ORD-9013', table: 'Table 08', items: 'Butter Chicken (x1), Naan (x4)', total: '₹980', status: 'Accepted', time: '12 mins ago', waiter: 'Amit S.' },
    { id: 'ORD-9014', table: 'Table 02', items: 'Masala Dosa (x3), Coffee (x3)', total: '₹540', status: 'Placed', time: '4 mins ago', waiter: 'Priya V.' },
    { id: 'ORD-9015', table: 'Table 12', items: 'Dal Makhani, Jeera Rice, Rotis', total: '₹760', status: 'Ready', time: '15 mins ago', waiter: 'Amit S.' },
  ];

  return (
    <div className="admin-dashboard-container">

      {/* ================= PAGE HEADER ================= */}
      <div className="admin-dashboard-header">
        <div>
          <div className="page-breadcrumb-bar">
            <span>Manager Portal</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Shift Overview</span>
          </div>
          <h1 className="admin-page-title">Manager Operations Dashboard</h1>
          <p className="admin-page-subtitle">
            Real-time floor oversight, staff shift logs, live order flow, and manager approvals.
          </p>
        </div>
      </div>

      {/* ================= 1. TAILORED KPI CARDS SECTION ================= */}
      <div className="admin-kpi-grid">
        {managerKpis.map((kpi) => {
          const IconComp = kpi.icon;
          return (
            <div key={kpi.id} className="admin-kpi-card">
              <div className="admin-kpi-header">
                <span className="admin-kpi-label">{kpi.label}</span>
                <div 
                  className="admin-kpi-icon-badge" 
                  style={{ backgroundColor: kpi.accentBg, color: kpi.badgeColor }}
                >
                  <IconComp size={16} />
                </div>
              </div>

              <div className="admin-kpi-value-row">
                <span className="admin-kpi-value">{kpi.value}</span>
                <span className="admin-kpi-trend-tag">
                  <TrendingUp size={13} />
                  <span>{kpi.change}</span>
                </span>
              </div>

              <div className="admin-kpi-footer">
                <span>{kpi.subtext}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= 2. QUICK MANAGER ACTIONS (3 COLORFUL BUTTONS) ================= */}
      <div className="admin-card mb-4" style={{ padding: '1.25rem' }}>
        <div className="admin-card-header" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 className="admin-card-title">Manager Quick Actions</h2>
            <p className="admin-card-subtitle">Operational shortcuts & approval overrides</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
          <button 
            onClick={() => setActiveTab('manager-orders')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.8rem 0.6rem',
              borderRadius: '10px',
              backgroundColor: '#E2F1E8',
              border: '1.5px solid #A3D4B5',
              color: '#1E4636',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(30, 70, 54, 0.08)'
            }}
          >
            <ShoppingBag size={16} color="#1E4636" />
            <span>Manage Orders & Floor</span>
          </button>

          <button 
            onClick={() => setActiveTab('manager-staff')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.8rem 0.6rem',
              borderRadius: '10px',
              backgroundColor: '#E8EAF6',
              border: '1.5px solid #C5CAE9',
              color: '#283593',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(40, 53, 147, 0.08)'
            }}
          >
            <UserCheck size={16} color="#283593" />
            <span>Staff Shift Attendance</span>
          </button>

          <button 
            onClick={() => setActiveTab('manager-coupons')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.8rem 0.6rem',
              borderRadius: '10px',
              backgroundColor: '#FFF3E0',
              border: '1.5px solid #FFE0B2',
              color: '#E07A3C',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(224, 122, 60, 0.08)'
            }}
          >
            <Ticket size={16} color="#E07A3C" />
            <span>Approve Coupon & Discount</span>
          </button>
        </div>
      </div>

      {/* ================= 3. ACTIVE FLOOR ORDERS STREAM ================= */}
      <div className="admin-card mb-4">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">Live Floor & Kitchen Orders</h2>
            <p className="admin-card-subtitle">Active orders currently being served or prepared</p>
          </div>
          <button 
            onClick={() => setActiveTab('manager-orders')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              backgroundColor: '#1E4636',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.82rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <span>All Orders</span>
            <ChevronRight size={15} color="#F2C14E" />
          </button>
        </div>

        <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="admin-data-table" style={{ minWidth: '850px' }}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Table</th>
                <th>Items Ordered</th>
                <th>Waitstaff</th>
                <th>Total</th>
                <th>Status</th>
                <th>Time</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.map((ord) => (
                <tr key={ord.id}>
                  <td className="font-semibold" style={{ color: '#1E4636' }}>{ord.id}</td>
                  <td className="font-semibold">{ord.table}</td>
                  <td>{ord.items}</td>
                  <td>{ord.waiter}</td>
                  <td className="font-semibold">{ord.total}</td>
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

      {/* ================= 4. STAFF SHIFT ATTENDANCE TRACKER ================= */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">Staff Shift Logs & Active Duty</h2>
            <p className="admin-card-subtitle">Real-time attendance logs for current shift</p>
          </div>
        </div>

        <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="admin-data-table" style={{ minWidth: '850px' }}>
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Staff Name</th>
                <th>Role</th>
                <th>Shift</th>
                <th>Check-In Time</th>
                <th>Logged Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {staffShiftLogs.map((stf) => (
                <tr key={stf.empId}>
                  <td className="font-semibold" style={{ color: '#E07A3C' }}>{stf.empId}</td>
                  <td className="font-semibold">{stf.name}</td>
                  <td>{stf.role}</td>
                  <td>{stf.shift}</td>
                  <td>{stf.checkIn}</td>
                  <td>{stf.hours}</td>
                  <td>
                    <span className="status-badge-unified is-ready">
                      ● {stf.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrderModal && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrderModal(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Order Summary — {selectedOrderModal.id}</h3>
                <p className="admin-modal-sub">{selectedOrderModal.table} • Waiter: {selectedOrderModal.waiter}</p>
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
                <span>Items:</span>
                <span>{selectedOrderModal.items}</span>
              </div>
              <div className="modal-info-row">
                <span>Time:</span>
                <span>{selectedOrderModal.time}</span>
              </div>
              <div className="modal-divider"></div>
              <div className="modal-bill-breakdown">
                <div className="bill-row font-bold text-lg" style={{ color: '#1E4636' }}>
                  <span>Total Amount:</span>
                  <span>{selectedOrderModal.total}</span>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedOrderModal(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedOrderModal(null)}>
                Print Ticket
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
