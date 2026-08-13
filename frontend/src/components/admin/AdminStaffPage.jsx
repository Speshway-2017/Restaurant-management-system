import React, { useState } from 'react';
import { Users, Plus, ShieldCheck, Clock, CheckCircle2, Search } from 'lucide-react';

export default function AdminStaffPage({ subTab = 'staff-accounts' }) {
  const [activeTab, setActiveTab] = useState(subTab === 'staff-shifts' ? 'shifts' : 'accounts');

  const staffMembers = [
    { id: 'STF-01', name: 'Chef Srikanth', role: 'Resto Manager', phone: '+91 98765 12345', status: 'On Shift', ordersHandled: 48, rating: '4.9 ★' },
    { id: 'STF-02', name: 'Rajesh Kumar', role: 'Head Chef', phone: '+91 98123 54321', status: 'On Shift', ordersHandled: 82, rating: '4.8 ★' },
    { id: 'STF-03', name: 'Ramesh Verma', role: 'Senior Waiter', phone: '+91 99887 23456', status: 'On Shift', ordersHandled: 34, rating: '4.9 ★' },
    { id: 'STF-04', name: 'Sunil Gowda', role: 'Cashier', phone: '+91 97766 34567', status: 'On Shift', ordersHandled: 142, rating: '4.7 ★' },
    { id: 'STF-05', name: 'Pooja Nair', role: 'Hostess', phone: '+91 96655 45678', status: 'Off Duty', ordersHandled: 18, rating: '4.8 ★' },
  ];

  return (
    <div className="admin-subpage-container">
      <div className="admin-dashboard-header">
        <div>
          <div className="page-breadcrumb-bar">
            <span>Dashboard</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Staff Management</span>
          </div>
          <h1 className="admin-page-title">Staff Management</h1>
          <p className="admin-page-subtitle">Accounts, role permissions, shift attendance, and staff performance.</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} />
          <span>Add Staff Member</span>
        </button>
      </div>

      <div className="admin-card mb-3" style={{ padding: '0.65rem 1.25rem' }}>
        <div className="admin-filter-bar-flex">
          <div className="admin-header-search-box" style={{ width: '260px', flexShrink: 0 }}>
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search staff name or role..."
              className="admin-header-search-input"
            />
          </div>

          <div className="admin-pill-selector">
            <button
              className={`admin-pill-btn ${activeTab === 'accounts' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('accounts')}
            >
              Accounts & Roles
            </button>
            <button
              className={`admin-pill-btn ${activeTab === 'shifts' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('shifts')}
            >
              Shifts & Attendance Log
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'accounts' ? (
        <div className="admin-card">
          <div className="admin-table-wrapper">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Staff Name</th>
                  <th>Role</th>
                  <th>Phone Number</th>
                  <th>Orders Handled</th>
                  <th>Rating</th>
                  <th>Duty Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.map((stf) => (
                  <tr key={stf.id}>
                    <td className="font-semibold" style={{ color: '#1E4636' }}>{stf.id}</td>
                    <td className="font-semibold">{stf.name}</td>
                    <td><span className="role-badge">{stf.role}</span></td>
                    <td>{stf.phone}</td>
                    <td>{stf.ordersHandled} Orders</td>
                    <td style={{ color: '#E07A3C', fontWeight: '700' }}>{stf.rating}</td>
                    <td>
                      <span className={`status-badge-unified ${stf.status === 'On Shift' ? 'is-served' : 'is-cancelled'}`}>
                        {stf.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-sm btn-outline">Edit Role</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Today's Shift Attendance</h2>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Check-In Time</th>
                  <th>Scheduled Shift</th>
                  <th>Hours Logged</th>
                  <th>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.map((stf) => (
                  <tr key={stf.id}>
                    <td className="font-semibold">{stf.name}</td>
                    <td>{stf.role}</td>
                    <td>10:00 AM</td>
                    <td>10:00 AM - 7:00 PM</td>
                    <td>4h 30m</td>
                    <td><span className="status-badge-unified is-ready">On Time</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
