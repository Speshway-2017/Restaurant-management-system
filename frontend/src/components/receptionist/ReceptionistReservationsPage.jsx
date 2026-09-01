import React, { useState, useEffect } from 'react';
import {
  CalendarDays, Plus, Search, Clock, Users, Phone, CheckCircle2,
  XCircle, Send, AlertTriangle, Filter, ChevronLeft, ChevronRight, X, Sparkles
} from 'lucide-react';
import { api } from '../../services/api';

export default function ReceptionistReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [viewMode, setViewMode] = useState('DAY'); // 'DAY' or 'WEEK'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);

  // Modals
  const [isNewResvOpen, setIsNewResvOpen] = useState(false);
  const [selectedCheckInResv, setSelectedCheckInResv] = useState(null);
  const [checkInTableNo, setCheckInTableNo] = useState('');

  // New Reservation Form
  const [resvForm, setResvForm] = useState({
    guestName: '',
    phone: '',
    guests: 2,
    date: new Date().toISOString().split('T')[0],
    timeSlot: '19:30',
    tableNo: 'Unassigned',
    section: 'Main Dining',
    specialOccasion: 'None',
    notes: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchReservationsData = () => {
    Promise.all([
      api.getReceptionistReservations().catch(() => null),
      api.getFloorPlan().catch(() => null)
    ]).then(([resvRes, floorRes]) => {
      if (resvRes) {
        const resvList = Array.isArray(resvRes) ? resvRes : (resvRes.data || []);
        if (Array.isArray(resvList)) setReservations(resvList);
      }
      if (floorRes) {
        const tablesList = Array.isArray(floorRes) ? floorRes : (floorRes.data || []);
        if (Array.isArray(tablesList)) setTables(tablesList);
      }
    });
  };

  useEffect(() => {
    fetchReservationsData();
    const interval = setInterval(fetchReservationsData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    if (!resvForm.guestName || !resvForm.phone) {
      alert('Please enter guest name and phone number.');
      return;
    }

    // Reservation Conflict Check
    if (resvForm.tableNo !== 'Unassigned') {
      const conflict = reservations.find(r => r.date === resvForm.date && r.timeSlot === resvForm.timeSlot && r.tableNo === resvForm.tableNo && r.status !== 'Cancelled');
      if (conflict) {
        alert(`⚠️ RESERVATION CONFLICT DETECTED!\n\nTable ${resvForm.tableNo} is already reserved at ${resvForm.timeSlot} on ${resvForm.date} for ${conflict.guestName}. Please select another table or time slot.`);
        return;
      }
    }

    try {
      const res = await api.createReceptionistReservation(resvForm);
      if (res.success) {
        // Trigger notification
        await api.sendReceptionistNotification({
          type: 'BOOKING_CONFIRMATION',
          recipient: resvForm.phone,
          message: `Booking Confirmed! ${resvForm.guestName}, your table reservation for ${resvForm.guests} guests on ${resvForm.date} at ${resvForm.timeSlot} is confirmed at Flavora Kitchen. Ref: ${res.data.bookingId}`,
          channel: 'SMS/WhatsApp'
        }).catch(() => {});

        showToast(`📅 Reservation ${res.data.bookingId} created & confirmation sent to ${resvForm.phone}!`);
        setIsNewResvOpen(false);
        setResvForm({ guestName: '', phone: '', guests: 2, date: new Date().toISOString().split('T')[0], timeSlot: '19:30', tableNo: 'Unassigned', section: 'Main Dining', specialOccasion: 'None', notes: '' });
        fetchReservationsData();
      }
    } catch (err) {
      alert(`Error creating reservation: ${err.message}`);
    }
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCheckInResv) return;
    try {
      const res = await api.checkInReservation(selectedCheckInResv._id, checkInTableNo);
      if (res.success) {
        showToast(`🟢 Guest ${selectedCheckInResv.guestName} checked in at ${checkInTableNo || selectedCheckInResv.tableNo}!`);
        setSelectedCheckInResv(null);
        setCheckInTableNo('');
        fetchReservationsData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await api.updateReservationStatus(id, status);
      if (res.success) {
        showToast(`Reservation status updated to ${status}.`);
        fetchReservationsData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendConfirmation = async (phone, bookingId, guestName, date, timeSlot) => {
    try {
      await api.sendReceptionistNotification({
        type: 'BOOKING_CONFIRMATION',
        recipient: phone,
        message: `Reminder: Table reservation for ${guestName} on ${date} at ${timeSlot}. Ref: ${bookingId}. Flavora Kitchen awaits your arrival!`,
        channel: 'SMS/WhatsApp'
      });
      showToast(`📩 Confirmation / Reminder sent to ${phone}!`);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredReservations = reservations.filter(r => {
    const matchesSearch = (r.guestName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.phone || '').includes(searchQuery) ||
                          (r.bookingId || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = viewMode === 'DAY' ? r.date === selectedDate : true;
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesDate && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Toast Banner */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '25px',
          backgroundColor: '#0F2A1D',
          color: '#FFFFFF',
          padding: '0.85rem 1.4rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontWeight: 700,
          border: '1px solid #E07A3C'
        }}>
          <Sparkles size={18} color="#E07A3C" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '1.1rem 1.4rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
            Reservation Calendar & Management
          </h2>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
            Bookings, check-in flows, conflict resolution & confirmations
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Day / Week View Toggle */}
          <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '0.25rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
            <button
              onClick={() => setViewMode('DAY')}
              style={{ padding: '0.35rem 0.85rem', borderRadius: '8px', border: 'none', backgroundColor: viewMode === 'DAY' ? '#0F2A1D' : 'transparent', color: viewMode === 'DAY' ? '#FFFFFF' : '#475569', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode('WEEK')}
              style={{ padding: '0.35rem 0.85rem', borderRadius: '8px', border: 'none', backgroundColor: viewMode === 'WEEK' ? '#0F2A1D' : 'transparent', color: viewMode === 'WEEK' ? '#FFFFFF' : '#475569', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
            >
              All / Week View
            </button>
          </div>

          {/* Date Selector */}
          {viewMode === 'DAY' && (
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 700, outline: 'none' }}
            />
          )}

          <button
            onClick={() => setIsNewResvOpen(true)}
            style={{
              backgroundColor: '#1E4636',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '0.65rem 1.25rem',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={18} />
            <span> New Reservation</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['ALL', 'Confirmed', 'Checked_In', 'Seated', 'Completed', 'Cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: filterStatus === st ? '#E07A3C' : '#FFFFFF', color: filterStatus === st ? '#FFFFFF' : '#475569', cursor: 'pointer' }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
          <Search size={16} color="#64748B" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search guest or booking ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.85rem 0.5rem 2.2rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none' }}
          />
        </div>
      </div>

      {/* Reservations Roster */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filteredReservations.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px dashed #CBD5E1', color: '#64748B' }}>
            <CalendarDays size={32} color="#94A3B8" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>No reservations found for selected date/filter</div>
            <div style={{ fontSize: '0.78rem' }}>Click "+ New Reservation" to create a booking</div>
          </div>
        ) : (
          filteredReservations.map(resv => {
            const getStatusBadge = (st) => {
              if (st === 'Checked_In') return { bg: '#DCFCE7', color: '#166534', border: '#86EFAC' };
              if (st === 'Seated') return { bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD' };
              if (st === 'Cancelled') return { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' };
              return { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' };
            };
            const badge = getStatusBadge(resv.status);

            return (
              <div
                key={resv._id || resv.bookingId}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: `1.5px solid ${badge.border}`,
                  padding: '1.1rem 1.3rem',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                {/* Left Lockup */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
                  <div style={{ backgroundColor: '#1E4636', color: '#FFFFFF', padding: '0.5rem 0.8rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#A3C2B3' }}>TIME</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{resv.timeSlot}</div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0F2A1D', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{resv.guestName}</span>
                      <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>({resv.phone})</span>
                      <span style={{ fontSize: '0.7rem', color: '#166534', backgroundColor: '#DCFCE7', padding: '0.15rem 0.45rem', borderRadius: '6px', fontWeight: 800 }}>
                        {resv.bookingId}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, marginTop: '0.2rem' }}>
                      📅 {resv.date} • 👥 {resv.guests} Guests • Table: <span style={{ color: '#0F2A1D', fontWeight: 900 }}>{resv.tableNo}</span> • Section: {resv.section}
                    </div>

                    {resv.specialOccasion && resv.specialOccasion !== 'None' && (
                      <div style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 800, marginTop: '0.25rem' }}>
                        🎉 Occasion Tag: {resv.specialOccasion}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Status & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 900, padding: '0.3rem 0.75rem', borderRadius: '8px', backgroundColor: badge.bg, color: badge.color }}>
                    {resv.status}
                  </span>

                  <button
                    onClick={() => handleSendConfirmation(resv.phone, resv.bookingId, resv.guestName, resv.date, resv.timeSlot)}
                    title="Send SMS / WhatsApp Confirmation"
                    style={{ backgroundColor: '#F0FDF4', color: '#166534', border: '1px solid #86EFAC', padding: '0.5rem 0.85rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Send size={14} />
                    <span>Send SMS/WA</span>
                  </button>

                  {resv.status === 'Confirmed' && (
                    <button
                      onClick={() => { setSelectedCheckInResv(resv); setCheckInTableNo(resv.tableNo !== 'Unassigned' ? resv.tableNo : ''); }}
                      style={{ backgroundColor: '#0F2A1D', color: '#FFFFFF', border: 'none', padding: '0.5rem 0.95rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Check-In Guest
                    </button>
                  )}

                  {resv.status === 'Confirmed' && (
                    <button
                      onClick={() => handleStatusChange(resv._id, 'Cancelled')}
                      style={{ backgroundColor: '#FFF', color: '#DC2626', border: '1px solid #FCA5A5', padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ==================== CREATE RESERVATION MODAL ==================== */}
      {isNewResvOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 24, 19, 0.65)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', maxWidth: '520px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ backgroundColor: '#1E4636', padding: '1.25rem 1.5rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Create New Table Booking</h3>
              <button onClick={() => setIsNewResvOpen(false)} style={{ border: 'none', background: 'transparent', color: '#FFF', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateReservation} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Guest Name</label>
                  <input type="text" required placeholder="e.g. Ramana" value={resvForm.guestName} onChange={e => setResvForm({ ...resvForm, guestName: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Phone Number</label>
                  <input type="tel" maxLength={10} required placeholder="10-digit mobile" value={resvForm.phone} onChange={e => setResvForm({ ...resvForm, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Date</label>
                  <input type="date" required value={resvForm.date} onChange={e => setResvForm({ ...resvForm, date: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Time Slot</label>
                  <input type="time" required value={resvForm.timeSlot} onChange={e => setResvForm({ ...resvForm, timeSlot: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Party Size</label>
                  <select value={resvForm.guests} onChange={e => setResvForm({ ...resvForm, guests: Number(e.target.value) })} style={{ width: '100%', padding: '0.55rem 0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none' }}>
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n} Guests</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Assign Table (Optional)</label>
                  <select value={resvForm.tableNo} onChange={e => setResvForm({ ...resvForm, tableNo: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }}>
                    <option value="Unassigned">Unassigned (Auto)</option>
                    {tables.map(t => <option key={t.number} value={t.number}>{t.number} ({t.seats}s - {t.section})</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Special Occasion</label>
                  <select value={resvForm.specialOccasion} onChange={e => setResvForm({ ...resvForm, specialOccasion: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }}>
                    <option value="None">None</option>
                    <option value="Birthday">🎂 Birthday</option>
                    <option value="Anniversary">💍 Anniversary</option>
                    <option value="Celebration">🎉 Celebration</option>
                    <option value="Business">💼 Business</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsNewResvOpen(false)} style={{ padding: '0.65rem 1.2rem', borderRadius: '10px', border: '1px solid #CBD5E1', backgroundColor: '#FFF' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.65rem 1.4rem', borderRadius: '10px', border: 'none', backgroundColor: '#1E4636', color: '#FFF', fontWeight: 800 }}>Confirm & Send SMS</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CHECK-IN MODAL ==================== */}
      {selectedCheckInResv && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 24, 19, 0.65)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', maxWidth: '440px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ backgroundColor: '#0F2A1D', padding: '1.25rem', color: '#FFF', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Check-In Guest {selectedCheckInResv.guestName}</h3>
              <button onClick={() => setSelectedCheckInResv(null)} style={{ border: 'none', background: 'transparent', color: '#FFF', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCheckInSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Assign Seating Table</label>
                <select required value={checkInTableNo} onChange={e => setCheckInTableNo(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}>
                  <option value="">-- Select Table --</option>
                  {tables.map(t => <option key={t.number} value={t.number}>{t.number} ({t.seats} seats - {t.section} - {t.status})</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setSelectedCheckInResv(null)} style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFF' }}>Cancel</button>
                <button type="submit" disabled={!checkInTableNo} style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: 'none', backgroundColor: '#0F2A1D', color: '#FFF', fontWeight: 800 }}>Confirm Check-In</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
