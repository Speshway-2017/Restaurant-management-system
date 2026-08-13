import React, { useState } from 'react';
import { ShoppingBag, Search, Filter, Clock, CheckCircle2, Eye, Printer, ChevronRight, AlertCircle } from 'lucide-react';

export default function AdminOrdersPage() {
  const [activeStatusFilter, setActiveStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const ordersList = [
    { id: 'ORD-8944', table: 'Table 12', type: 'Dine-In', customer: 'Rahul Sharma', phone: '+91 98765 43210', items: 'Dal Makhani, Jeera Rice, Tandoori Roti (x6)', total: '₹760', status: 'Ready', payment: 'Paid (UPI)', time: '11:42 AM' },
    { id: 'ORD-8943', table: 'Table 02', type: 'Dine-In', customer: 'Priya Patel', phone: '+91 98123 45678', items: 'Masala Dosa (x3), Filter Coffee (x3)', total: '₹540', status: 'Placed', payment: 'Pending', time: '11:38 AM' },
    { id: 'ORD-8942', table: 'Table 08', type: 'Dine-In', customer: 'Amitabh Sen', phone: '+91 99887 76655', items: 'Butter Chicken (x1), Garlic Naan (x4), Lassi', total: '₹980', status: 'Accepted', payment: 'Paid (Card)', time: '11:30 AM' },
    { id: 'ORD-8941', table: 'Table 04', type: 'Dine-In', customer: 'Ananya Roy', phone: '+91 97766 55443', items: 'Hyderabad Dum Biryani (x2), Paneer Tikka', total: '₹1,240', status: 'Preparing', payment: 'Paid (UPI)', time: '11:22 AM' },
    { id: 'ORD-8940', table: 'Table 06', type: 'Dine-In', customer: 'Vikram Malhotra', phone: '+91 96655 44332', items: 'Chicken Tikka Masala, Rice, Garlic Naan', total: '₹1,850', status: 'Served', payment: 'Paid (Cash)', time: '11:10 AM' },
    { id: 'ORD-8939', table: 'Takeaway', type: 'Takeaway', customer: 'Suresh Kumar', phone: '+91 95544 33221', items: 'Paneer Butter Masala, Roti (x4)', total: '₹420', status: 'Served', payment: 'Paid (UPI)', time: '10:55 AM' },
    { id: 'ORD-8938', table: 'Table 01', type: 'Dine-In', customer: 'Deepak Joshi', phone: '+91 94433 22110', items: 'Veg Thali (x2), Fresh Lime Soda', total: '₹680', status: 'Cancelled', payment: 'Refunded', time: '10:30 AM' },
  ];

  const filteredOrders = ordersList.filter((ord) => {
    const matchesStatus = activeStatusFilter === 'All' || ord.status === activeStatusFilter;
    const matchesSearch = ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ord.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ord.table.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="admin-subpage-container">
      
      {/* Header */}
      <div className="admin-dashboard-header">
        <div>
          <div className="page-breadcrumb-bar">
            <span>Admin</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Orders Management</span>
          </div>
          <h1 className="admin-page-title">Orders Management</h1>
          <p className="admin-page-subtitle">Track, accept, and manage real-time dine-in & takeaway orders.</p>
        </div>
        <button className="btn btn-primary">
          <ShoppingBag size={16} />
          <span>New Manual Order</span>
        </button>
      </div>

      {/* Search Bar First, Then Filter Tabs */}
      <div className="admin-card mb-3" style={{ padding: '0.65rem 1.25rem' }}>
        <div className="admin-filter-bar-flex">
          <div className="admin-header-search-box" style={{ width: '280px', flexShrink: 0 }}>
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search by Order ID, customer, table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-header-search-input"
            />
          </div>

          <div className="admin-pill-selector">
            {['All', 'Placed', 'Accepted', 'Preparing', 'Ready', 'Served', 'Cancelled'].map((st) => (
              <button
                key={st}
                className={`admin-pill-btn ${activeStatusFilter === st ? 'is-active' : ''}`}
                onClick={() => setActiveStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Data Table */}
      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Type / Table</th>
                <th>Customer & Phone</th>
                <th>Order Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Time</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((ord) => (
                <tr key={ord.id}>
                  <td className="font-semibold" style={{ color: '#1E4636' }}>{ord.id}</td>
                  <td>
                    <div>
                      <div className="font-semibold">{ord.table}</div>
                      <div className="text-xs text-muted">{ord.type}</div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="font-semibold">{ord.customer}</div>
                      <div className="text-xs text-muted">{ord.phone}</div>
                    </div>
                  </td>
                  <td className="max-w-xs truncate">{ord.items}</td>
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
                  <td className="text-xs text-muted">{ord.time}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="admin-action-btn-group">
                      <button className="admin-icon-action-btn" onClick={() => setSelectedOrder(ord)} title="View Detail">
                        <Eye size={15} color="#1E4636" />
                      </button>
                      <button className="admin-icon-action-btn" title="Print KDS Slip">
                        <Printer size={15} color="#E07A3C" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal Drawer */}
      {selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Order #{selectedOrder.id}</h3>
                <p className="admin-modal-sub">{selectedOrder.table} • {selectedOrder.customer}</p>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="modal-info-row">
                <span>Items:</span>
                <strong>{selectedOrder.items}</strong>
              </div>
              <div className="modal-info-row">
                <span>Status:</span>
                <span className={`status-badge-unified is-${selectedOrder.status.toLowerCase()}`}>{selectedOrder.status}</span>
              </div>
              <div className="modal-info-row">
                <span>Payment Method:</span>
                <span>{selectedOrder.payment}</span>
              </div>
              <div className="modal-info-row">
                <span>Time Placed:</span>
                <span>{selectedOrder.time}</span>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedOrder(null)}>Close</button>
              <button className="btn btn-primary">Update Status</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
