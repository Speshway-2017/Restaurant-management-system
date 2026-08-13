import React, { useState } from 'react';
import { Table2, Plus, QrCode, Eye, CheckCircle2, Users, Clock, RefreshCw, Search } from 'lucide-react';

export default function AdminTablesPage() {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedQrTable, setSelectedQrTable] = useState(null);

  const tables = [
    { num: 'T-01', zone: 'Main Dining', cap: 4, status: 'Occupied', orderId: 'ORD-8938', amount: '₹1,450', elapsed: '38 mins', customer: 'Deepak J.' },
    { num: 'T-02', zone: 'Main Dining', cap: 2, status: 'Occupied', orderId: 'ORD-8943', amount: '₹540', elapsed: '14 mins', customer: 'Priya P.' },
    { num: 'T-03', zone: 'Main Dining', cap: 4, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-' },
    { num: 'T-04', zone: 'Main Dining', cap: 6, status: 'Occupied', orderId: 'ORD-8941', amount: '₹1,240', elapsed: '24 mins', customer: 'Ananya R.' },
    { num: 'T-05', zone: 'Window Section', cap: 2, status: 'Reserved', orderId: 'RES-104', amount: 'Pre-booked', elapsed: '7:30 PM', customer: 'Dr. Mehta' },
    { num: 'T-06', zone: 'Window Section', cap: 4, status: 'Cleaning', orderId: null, amount: '-', elapsed: '5 mins ago', customer: '-' },
    { num: 'T-07', zone: 'Window Section', cap: 4, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-' },
    { num: 'T-08', zone: 'Family Lounge', cap: 8, status: 'Occupied', orderId: 'ORD-8942', amount: '₹2,840', elapsed: '42 mins', customer: 'Amitabh S.' },
    { num: 'T-09', zone: 'Family Lounge', cap: 6, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-' },
    { num: 'T-10', zone: 'Patio Outdoor', cap: 4, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-' },
    { num: 'T-11', zone: 'Patio Outdoor', cap: 2, status: 'Reserved', orderId: 'RES-108', amount: 'Pre-booked', elapsed: '8:00 PM', customer: 'Kapoor Party' },
    { num: 'T-12', zone: 'Patio Outdoor', cap: 4, status: 'Occupied', orderId: 'ORD-8944', amount: '₹760', elapsed: '18 mins', customer: 'Rahul S.' },
  ];

  const filteredTables = tables.filter(t => selectedStatusFilter === 'All' || t.status === selectedStatusFilter);

  return (
    <div className="admin-subpage-container">
      
      {/* Header */}
      <div className="admin-dashboard-header">
        <div>
          <div className="page-breadcrumb-bar">
            <span>Dashboard</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Tables & Floor Plan</span>
          </div>
          <h1 className="admin-page-title">Tables & Floor Plan</h1>
          <p className="admin-page-subtitle">Real-time table occupancy map, QR code ordering sessions, and seating capacity.</p>
        </div>
        <div className="admin-header-actions">
          <button className="btn btn-outline" onClick={() => setSelectedQrTable(tables[0])}>
            <QrCode size={16} />
            <span>Generate Table QRs</span>
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            <span>Add New Table</span>
          </button>
        </div>
      </div>

      {/* Search Bar First, Then Filter Tabs & Summary Strip */}
      <div className="admin-card mb-3" style={{ padding: '0.65rem 1.25rem' }}>
        <div className="admin-filter-bar-flex">
          <div className="admin-header-search-box" style={{ width: '220px', flexShrink: 0 }}>
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search table no..."
              className="admin-header-search-input"
            />
          </div>

          <div className="admin-pill-selector">
            {['All', 'Occupied', 'Available', 'Reserved', 'Cleaning'].map((st) => (
              <button
                key={st}
                className={`admin-pill-btn ${selectedStatusFilter === st ? 'is-active' : ''}`}
                onClick={() => setSelectedStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="admin-table-summary-bar" style={{ margin: 0 }}>
            <div className="summary-pill is-occupied">
              <span className="pill-dot"></span>
              <span>18 Occupied (75%)</span>
            </div>
            <div className="summary-pill is-available">
              <span className="pill-dot"></span>
              <span>6 Available</span>
            </div>
            <div className="summary-pill is-reserved">
              <span className="pill-dot"></span>
              <span>2 Reserved</span>
            </div>
            <div className="summary-pill is-cleaning">
              <span className="pill-dot"></span>
              <span>1 Cleaning</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floor Plan Visual Grid */}
      <div className="admin-floor-plan-grid">
        {filteredTables.map((tbl) => (
          <div key={tbl.num} className={`admin-floor-table-card is-${tbl.status.toLowerCase()}`}>
            <div className="tbl-card-top">
              <div className="tbl-title-box">
                <span className="tbl-name">{tbl.num}</span>
                <span className="tbl-zone-badge">{tbl.zone}</span>
              </div>
              <span className={`tbl-status-badge is-${tbl.status.toLowerCase()}`}>
                {tbl.status}
              </span>
            </div>

            <div className="tbl-card-body">
              <div className="tbl-meta-item">
                <Users size={14} />
                <span>Cap: {tbl.cap} Seats</span>
              </div>
              {tbl.status === 'Occupied' && (
                <>
                  <div className="tbl-meta-item">
                    <Clock size={14} />
                    <span>Seated: {tbl.elapsed}</span>
                  </div>
                  <div className="tbl-order-info">
                    <span className="ord-id">{tbl.orderId}</span>
                    <span className="ord-amt">{tbl.amount}</span>
                  </div>
                </>
              )}
            </div>

            <div className="tbl-card-footer">
              <button 
                className="tbl-action-btn"
                onClick={() => setSelectedQrTable(tbl)}
                title="View Table QR"
              >
                <QrCode size={14} />
                <span>QR Code</span>
              </button>
              {tbl.status === 'Occupied' && (
                <button className="tbl-action-btn is-primary">
                  <Eye size={14} />
                  <span>View Order</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Modal */}
      {selectedQrTable && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedQrTable(null)}>
          <div className="admin-modal-card text-center" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Table QR Code — {selectedQrTable.num}</h3>
              <button className="admin-modal-close" onClick={() => setSelectedQrTable(null)}>×</button>
            </div>
            <div className="admin-modal-body flex-col items-center" style={{ padding: '1.5rem' }}>
              <div className="qr-box-frame">
                <QrCode size={160} color="#1E4636" />
                <div className="qr-tbl-text">{selectedQrTable.num} • Scan to Order</div>
              </div>
              <p className="text-xs text-muted mt-3">
                Customers scanning this QR code will automatically connect to {selectedQrTable.num} session.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedQrTable(null)}>Close</button>
              <button className="btn btn-primary">Print Table Tent</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
