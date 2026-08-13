import React, { useState } from 'react';
import { CalendarDays, Plus, Search, CheckCircle2, Clock, Users, Phone } from 'lucide-react';

export default function AdminReservationsPage() {
  const [tab, setTab] = useState('Today');

  const reservations = [
    { id: 'RES-104', name: 'Dr. Mehta', phone: '+91 98765 00112', guests: 4, date: 'Today', time: '7:30 PM', table: 'T-05', status: 'Confirmed', notes: 'Anniversary celebration' },
    { id: 'RES-108', name: 'Kapoor Family', phone: '+91 98123 99887', guests: 6, date: 'Today', time: '8:00 PM', table: 'T-11', status: 'Confirmed', notes: 'High chair required' },
    { id: 'RES-110', name: 'Vikram Sethi', phone: '+91 99887 11223', guests: 2, date: 'Today', time: '8:30 PM', table: 'T-02', status: 'Seated', notes: 'Window table requested' },
    { id: 'RES-112', name: 'Sunita Reddy', phone: '+91 97766 44556', guests: 8, date: 'Tomorrow', time: '1:30 PM', table: 'T-08', status: 'Confirmed', notes: 'Corporate lunch' },
  ];

  return (
    <div className="admin-subpage-container">
      <div className="admin-dashboard-header">
        <div>
          <div className="page-breadcrumb-bar">
            <span>Admin</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Table Reservations</span>
          </div>
          <h1 className="admin-page-title">Table Reservations</h1>
          <p className="admin-page-subtitle">Manage guest bookings, pre-assigned tables, and special requests.</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} />
          <span>New Reservation</span>
        </button>
      </div>

      <div className="admin-card mb-3" style={{ padding: '0.65rem 1.25rem' }}>
        <div className="admin-filter-bar-flex">
          <div className="admin-header-search-box" style={{ width: '260px', flexShrink: 0 }}>
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search guest or booking ID..."
              className="admin-header-search-input"
            />
          </div>

          <div className="admin-pill-selector">
            {['Today', 'Upcoming', 'Past History', 'Cancelled'].map((t) => (
              <button
                key={t}
                className={`admin-pill-btn ${tab === t ? 'is-active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Guest Name</th>
                <th>Phone</th>
                <th>Guests</th>
                <th>Date & Time</th>
                <th>Assigned Table</th>
                <th>Special Notes</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((res) => (
                <tr key={res.id}>
                  <td className="font-semibold" style={{ color: '#1E4636' }}>{res.id}</td>
                  <td className="font-semibold">{res.name}</td>
                  <td>{res.phone}</td>
                  <td>{res.guests} Guests</td>
                  <td>{res.date} at {res.time}</td>
                  <td><span className="tbl-chip">{res.table}</span></td>
                  <td className="text-xs text-muted">{res.notes}</td>
                  <td>
                    <span className={`status-badge-unified is-${res.status.toLowerCase()}`}>
                      {res.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-sm btn-outline">Seat Guest</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
