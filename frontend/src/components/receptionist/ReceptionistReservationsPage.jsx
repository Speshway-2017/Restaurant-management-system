import React, { useState, useEffect } from 'react';
import {
  CalendarDays, Plus, Search, Clock, Users, Phone, CheckCircle2,
  XCircle, Send, AlertTriangle, Filter, ChevronLeft, ChevronRight, X, Sparkles,
  MapPin, Utensils, MessageSquare, Tag, Bell, ExternalLink, Calendar, Check,
  Armchair, Eye
} from 'lucide-react';
import { api } from '../../services/api';
import { onSocketEvent } from '../../services/socket';

export default function ReceptionistReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [viewMode, setViewMode] = useState('TODAY'); // 'TODAY', 'UPCOMING', 'ALL', 'CUSTOM'
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);
  const [newBookingAlert, setNewBookingAlert] = useState(null);

  // Modals
  const [isNewResvOpen, setIsNewResvOpen] = useState(false);
  const [selectedCheckInResv, setSelectedCheckInResv] = useState(null);
  const [checkInTableNo, setCheckInTableNo] = useState('');
  const [inspectResv, setInspectResv] = useState(null);
  const [assignTableResv, setAssignTableResv] = useState(null);
  const [selectedAssignTable, setSelectedAssignTable] = useState('');
  const [isAssigningTable, setIsAssigningTable] = useState(false);

  // New Reservation Form
  const [resvForm, setResvForm] = useState({
    guestName: '',
    phone: '',
    guests: 2,
    date: todayStr,
    timeSlot: '07:30 PM',
    tableNo: 'Unassigned',
    section: 'Main Dining',
    specialOccasion: 'None',
    notes: ''
  });

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // Audio not supported or autoplay blocked
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
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

  // Polling fallback
  useEffect(() => {
    fetchReservationsData();
    const interval = setInterval(fetchReservationsData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Real-time Socket & Window Event listeners for customer bookings
  useEffect(() => {
    const handleNewBooking = (booking) => {
      fetchReservationsData();
      playNotificationSound();
      setNewBookingAlert(booking);
      showToast(`🔔 New Table Booking! ${booking.guestName} booked for ${booking.guests} guests on ${booking.date} at ${booking.timeSlot}!`);
    };

    const unsubSocket = onSocketEvent('reservation_created', (data) => {
      const r = (data && data.reservation) ? data.reservation : data;
      if (r) handleNewBooking(r);
    });

    const handleCustomWindow = (e) => {
      if (e.detail) handleNewBooking(e.detail);
    };
    window.addEventListener('flavora_reservation_created', handleCustomWindow);

    return () => {
      if (typeof unsubSocket === 'function') unsubSocket();
      window.removeEventListener('flavora_reservation_created', handleCustomWindow);
    };
  }, []);

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    const cleanName = (resvForm.guestName || '').trim();
    const cleanPhone = (resvForm.phone || '').trim();

    if (!cleanName || !cleanPhone) {
      alert('Please enter guest name and phone number.');
      return;
    }

    if (cleanPhone.length < 10) {
      alert('Phone number must be exactly 10 digits.');
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
        setResvForm({ guestName: '', phone: '', guests: 2, date: todayStr, timeSlot: '07:30 PM', tableNo: 'Unassigned', section: 'Main Dining', specialOccasion: 'None', notes: '' });
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

  const handleAssignTableSubmit = async (e) => {
    e.preventDefault();
    if (!assignTableResv || !selectedAssignTable || isAssigningTable) return;
    setIsAssigningTable(true);
    try {
      const res = await api.updateReservationStatus(assignTableResv._id, assignTableResv.status, selectedAssignTable);
      if (res.success) {
        const resvNum = res.data?.bookingId || assignTableResv.bookingId || assignTableResv._id;
        showToast(`Confirmed Table ${selectedAssignTable} for reservation number ${resvNum}`);
        setAssignTableResv(null);
        setSelectedAssignTable('');
        fetchReservationsData();
        window.dispatchEvent(new Event('flavora_tables_updated'));
      }
    } catch (err) {
      alert(`Could not assign table: ${err.message}`);
    } finally {
      setIsAssigningTable(false);
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

  // Filter logic
  const filteredReservations = reservations.filter(r => {
    const matchesSearch = (r.guestName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.phone || '').includes(searchQuery) ||
                          (r.bookingId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.specialOccasion || '').toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDate = true;
    if (viewMode === 'TODAY') {
      matchesDate = r.date === todayStr;
    } else if (viewMode === 'UPCOMING') {
      matchesDate = r.date >= todayStr;
    } else if (viewMode === 'CUSTOM') {
      matchesDate = r.date === selectedDate;
    }

    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesDate && matchesStatus;
  });

  // Derived KPI counts
  const totalActiveCount = reservations.filter(r => r.status !== 'Cancelled').length;
  const todayBookingsCount = reservations.filter(r => r.date === todayStr && r.status !== 'Cancelled').length;
  const upcomingFutureCount = reservations.filter(r => r.date > todayStr && r.status !== 'Cancelled').length;
  const unassignedCount = reservations.filter(r => (!r.tableNo || r.tableNo === 'Unassigned') && r.status !== 'Cancelled').length;

  const getRelativeDateLabel = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr === todayStr) return 'Today';
    const tomorrowObj = new Date();
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrowStr = tomorrowObj.toISOString().split('T')[0];
    if (dateStr === tomorrowStr) return 'Tomorrow';
    return dateStr;
  };

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
          padding: '0.9rem 1.4rem',
          borderRadius: '14px',
          boxShadow: '0 12px 30px rgba(15, 42, 29, 0.35)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 700,
          fontSize: '0.88rem',
          border: '1.5px solid #E07A3C',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <Sparkles size={18} color="#E07A3C" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Alert for New Incoming Customer Online Booking */}
      {newBookingAlert && (
        <div style={{
          backgroundColor: '#ECFDF5',
          border: '1.5px solid #10B981',
          borderRadius: '16px',
          padding: '1rem 1.3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
              <Bell size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, backgroundColor: '#059669', color: '#FFF', padding: '0.15rem 0.5rem', borderRadius: '9999px', textTransform: 'uppercase' }}>
                  NEW ONLINE BOOKING
                </span>
                <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#065F46' }}>
                  {newBookingAlert.guestName} ({newBookingAlert.phone})
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '0.2rem' }}>
                📅 <strong>{newBookingAlert.date}</strong> at <strong>{newBookingAlert.timeSlot}</strong> • 👥 {newBookingAlert.guests} Guests • 📍 {newBookingAlert.section || 'Main Dining'}
                {newBookingAlert.specialOccasion && newBookingAlert.specialOccasion !== 'None' && ` • 🎉 ${newBookingAlert.specialOccasion}`}
              </div>
              {newBookingAlert.notes && (
                <div style={{ fontSize: '0.78rem', color: '#064E3B', fontWeight: 700, marginTop: '0.25rem', backgroundColor: '#D1FAE5', padding: '0.25rem 0.6rem', borderRadius: '6px', display: 'inline-block' }}>
                  📝 Special Request: "{newBookingAlert.notes}"
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={() => {
                setInspectResv(newBookingAlert);
                setNewBookingAlert(null);
              }}
              style={{
                backgroundColor: '#065F46',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Eye size={15} />
              <span>Review Details</span>
            </button>
            <button
              onClick={() => setNewBookingAlert(null)}
              style={{ background: 'transparent', border: 'none', color: '#059669', cursor: 'pointer', padding: '0.4rem' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ==================== 1. TOP STATS BAR ==================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem'
      }}>
        {/* Today's Bookings */}
        <div
          onClick={() => setViewMode('TODAY')}
          style={{
            backgroundColor: viewMode === 'TODAY' ? '#0F2A1D' : '#FFFFFF',
            color: viewMode === 'TODAY' ? '#FFFFFF' : '#0F2A1D',
            borderRadius: '18px',
            padding: '1.1rem 1.25rem',
            border: viewMode === 'TODAY' ? '2px solid #0F2A1D' : '1px solid #E2E8F0',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: viewMode === 'TODAY' ? '#A3C2B3' : '#64748B', textTransform: 'uppercase' }}>Today's Dining</span>
            <div style={{ backgroundColor: viewMode === 'TODAY' ? 'rgba(255,255,255,0.15)' : '#ECFDF5', padding: '0.4rem', borderRadius: '10px' }}>
              <CalendarDays size={18} color={viewMode === 'TODAY' ? '#86EFAC' : '#059669'} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>{todayBookingsCount}</div>
          <div style={{ fontSize: '0.74rem', color: viewMode === 'TODAY' ? '#86EFAC' : '#059669', fontWeight: 700, marginTop: '0.2rem' }}>
            Scheduled for today
          </div>
        </div>

        {/* Upcoming Future Bookings */}
        <div
          onClick={() => setViewMode('UPCOMING')}
          style={{
            backgroundColor: viewMode === 'UPCOMING' ? '#0F2A1D' : '#FFFFFF',
            color: viewMode === 'UPCOMING' ? '#FFFFFF' : '#0F2A1D',
            borderRadius: '18px',
            padding: '1.1rem 1.25rem',
            border: viewMode === 'UPCOMING' ? '2px solid #0F2A1D' : '1px solid #E2E8F0',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: viewMode === 'UPCOMING' ? '#A3C2B3' : '#64748B', textTransform: 'uppercase' }}>Upcoming Dates</span>
            <div style={{ backgroundColor: viewMode === 'UPCOMING' ? 'rgba(255,255,255,0.15)' : '#EFF6FF', padding: '0.4rem', borderRadius: '10px' }}>
              <Clock size={18} color={viewMode === 'UPCOMING' ? '#93C5FD' : '#2563EB'} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>{upcomingFutureCount}</div>
          <div style={{ fontSize: '0.74rem', color: viewMode === 'UPCOMING' ? '#93C5FD' : '#2563EB', fontWeight: 700, marginTop: '0.2rem' }}>
            Future customer bookings
          </div>
        </div>

        {/* Needs Table Assigned */}
        <div
          onClick={() => { setFilterStatus('ALL'); setSearchQuery(''); }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            padding: '1.1rem 1.25rem',
            border: unassignedCount > 0 ? '1.5px solid #FCD34D' : '1px solid #E2E8F0',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Unassigned Tables</span>
            <div style={{ backgroundColor: '#FEF3C7', padding: '0.4rem', borderRadius: '10px' }}>
              <Armchair size={18} color="#D97706" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#D97706', fontFamily: 'var(--font-heading)' }}>{unassignedCount}</div>
          <div style={{ fontSize: '0.74rem', color: '#D97706', fontWeight: 700, marginTop: '0.2rem' }}>
            {unassignedCount > 0 ? 'Assign table when ready' : 'All tables assigned'}
          </div>
        </div>

        {/* Total Active Bookings */}
        <div
          onClick={() => setViewMode('ALL')}
          style={{
            backgroundColor: viewMode === 'ALL' ? '#0F2A1D' : '#FFFFFF',
            color: viewMode === 'ALL' ? '#FFFFFF' : '#0F2A1D',
            borderRadius: '18px',
            padding: '1.1rem 1.25rem',
            border: viewMode === 'ALL' ? '2px solid #0F2A1D' : '1px solid #E2E8F0',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: viewMode === 'ALL' ? '#A3C2B3' : '#64748B', textTransform: 'uppercase' }}>Total Active</span>
            <div style={{ backgroundColor: viewMode === 'ALL' ? 'rgba(255,255,255,0.15)' : '#F1F5F9', padding: '0.4rem', borderRadius: '10px' }}>
              <Users size={18} color={viewMode === 'ALL' ? '#FFFFFF' : '#475569'} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>{totalActiveCount}</div>
          <div style={{ fontSize: '0.74rem', color: viewMode === 'ALL' ? '#CBD5E1' : '#64748B', fontWeight: 700, marginTop: '0.2rem' }}>
            Confirmed reservations
          </div>
        </div>
      </div>

      {/* ==================== 2. HEADER & ACTION CONTROLS ==================== */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '18px',
        padding: '1.1rem 1.4rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
            Customer Table Reservations
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Live customer bookings, full guest notes, occasion tags & table assignments
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* View Mode Pills */}
          <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '0.25rem', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
            <button
              onClick={() => setViewMode('TODAY')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: viewMode === 'TODAY' ? '#0F2A1D' : 'transparent',
                color: viewMode === 'TODAY' ? '#FFFFFF' : '#475569',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              Today
            </button>
            <button
              onClick={() => setViewMode('UPCOMING')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: viewMode === 'UPCOMING' ? '#0F2A1D' : 'transparent',
                color: viewMode === 'UPCOMING' ? '#FFFFFF' : '#475569',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              Upcoming ({upcomingFutureCount})
            </button>
            <button
              onClick={() => setViewMode('ALL')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: viewMode === 'ALL' ? '#0F2A1D' : 'transparent',
                color: viewMode === 'ALL' ? '#FFFFFF' : '#475569',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              All Dates
            </button>
            <button
              onClick={() => setViewMode('CUSTOM')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: viewMode === 'CUSTOM' ? '#0F2A1D' : 'transparent',
                color: viewMode === 'CUSTOM' ? '#FFFFFF' : '#475569',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              Pick Date
            </button>
          </div>

          {/* Date Selector for Pick Date view */}
          {viewMode === 'CUSTOM' && (
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', borderRadius: '10px', border: '1.5px solid #0F2A1D', fontSize: '0.82rem', fontWeight: 700, outline: 'none' }}
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
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(30, 70, 54, 0.2)'
            }}
          >
            <Plus size={18} />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* ==================== 3. FILTER & SEARCH BAR ==================== */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['ALL', 'Confirmed', 'Checked_In', 'Seated', 'Completed', 'Cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                fontSize: '0.76rem',
                fontWeight: 800,
                padding: '0.4rem 0.85rem',
                borderRadius: '10px',
                border: filterStatus === st ? '1.5px solid #E07A3C' : '1px solid #CBD5E1',
                backgroundColor: filterStatus === st ? '#E07A3C' : '#FFFFFF',
                color: filterStatus === st ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {st === 'ALL' ? 'All Statuses' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', maxWidth: '340px', width: '100%' }}>
          <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by name, phone, ref ID, notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.85rem 0.55rem 2.3rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.84rem', outline: 'none' }}
          />
        </div>
      </div>

      {/* ==================== 4. RESERVATIONS ROSTER ==================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredReservations.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px dashed #CBD5E1', color: '#64748B' }}>
            <CalendarDays size={38} color="#94A3B8" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F2A1D' }}>No table reservations found</div>
            <div style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>
              {viewMode === 'TODAY' ? 'No bookings scheduled for today. Check the "Upcoming" tab for future bookings!' : 'Try selecting another date, clearing filters, or create a new booking.'}
            </div>
            {viewMode === 'TODAY' && upcomingFutureCount > 0 && (
              <button
                onClick={() => setViewMode('UPCOMING')}
                style={{ marginTop: '1rem', backgroundColor: '#0F2A1D', color: '#FFF', border: 'none', padding: '0.55rem 1.1rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
              >
                View {upcomingFutureCount} Upcoming Future Bookings →
              </button>
            )}
          </div>
        ) : (
          filteredReservations.map(resv => {
            const getStatusBadge = (st) => {
              if (st === 'Checked_In') return { bg: '#DCFCE7', color: '#166534', border: '#86EFAC', label: 'Checked-In' };
              if (st === 'Seated') return { bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD', label: 'Seated' };
              if (st === 'Completed') return { bg: '#F1F5F9', color: '#334155', border: '#CBD5E1', label: 'Completed' };
              if (st === 'Cancelled') return { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', label: 'Cancelled' };
              return { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', label: 'Confirmed' };
            };
            const badge = getStatusBadge(resv.status);
            const dateBadgeLabel = getRelativeDateLabel(resv.date);
            const isUnassigned = !resv.tableNo || resv.tableNo === 'Unassigned';

            return (
              <div
                key={resv._id || resv.bookingId}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  border: `1.5px solid ${badge.border}`,
                  padding: '1.25rem 1.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.03)',
                  transition: 'box-shadow 0.15s ease'
                }}
              >
                {/* Top Row: Time, Date, Guest Name, Ref ID & Status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
                    {/* Time & Date Block */}
                    <div style={{
                      backgroundColor: '#0F2A1D',
                      color: '#FFFFFF',
                      padding: '0.6rem 0.95rem',
                      borderRadius: '14px',
                      textAlign: 'center',
                      minWidth: '92px'
                    }}>
                      <div style={{ fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', color: '#86EFAC', letterSpacing: '0.04em' }}>
                        {dateBadgeLabel}
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, lineHeight: 1.2 }}>
                        {resv.timeSlot}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#CBD5E1', marginTop: '0.15rem' }}>
                        {resv.date}
                      </div>
                    </div>

                    {/* Customer Identity Lockup */}
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#0F2A1D', display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                        <span>{resv.guestName}</span>
                        <a
                          href={`tel:${resv.phone}`}
                          style={{ fontSize: '0.82rem', color: '#2563EB', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Phone size={13} />
                          <span>{resv.phone}</span>
                        </a>
                        <span style={{ fontSize: '0.7rem', color: '#166534', backgroundColor: '#DCFCE7', padding: '0.18rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
                          {resv.bookingId}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#64748B', backgroundColor: '#F1F5F9', padding: '0.15rem 0.45rem', borderRadius: '6px', fontWeight: 700 }}>
                          🌐 Customer Booking
                        </span>
                      </div>

                      {/* Party & Table Info */}
                      <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700, marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                        <span>👥 <strong>{resv.guests} Guests</strong></span>
                        <span>•</span>
                        <span>📍 Preferred: <strong>{resv.section || 'Main Dining'}</strong></span>
                        <span>•</span>
                        <span>
                          Table:{' '}
                          {isUnassigned ? (
                            <span style={{ color: '#D97706', backgroundColor: '#FEF3C7', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
                              ⚠️ Unassigned
                            </span>
                          ) : (
                            <span style={{ color: '#0F2A1D', backgroundColor: '#F1F5F9', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 900 }}>
                              🪑 {resv.tableNo}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Inspect Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      padding: '0.35rem 0.85rem',
                      borderRadius: '8px',
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`
                    }}>
                      {badge.label}
                    </span>

                    <button
                      onClick={() => setInspectResv(resv)}
                      title="View Complete Customer Details"
                      style={{
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        borderRadius: '10px',
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        color: '#0F2A1D',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Eye size={15} />
                      <span>Full Details</span>
                    </button>
                  </div>
                </div>

                {/* Middle Row: Special Occasion & Customer Notes Callouts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {resv.specialOccasion && resv.specialOccasion !== 'None' && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.78rem',
                      color: '#991B1B',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FECACA',
                      padding: '0.3rem 0.7rem',
                      borderRadius: '8px',
                      width: 'fit-content',
                      fontWeight: 800
                    }}>
                      <span>🎉 Occasion / Purpose:</span>
                      <strong>{resv.specialOccasion}</strong>
                    </div>
                  )}

                  {/* Special Requests / Chef Notes provided by customer */}
                  {resv.notes ? (
                    <div style={{
                      backgroundColor: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      borderLeft: '4px solid #F59E0B',
                      borderRadius: '6px 10px 10px 6px',
                      padding: '0.55rem 0.85rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.55rem'
                    }}>
                      <MessageSquare size={16} color="#D97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Customer Special Request / Chef Notes:
                        </div>
                        <div style={{ fontSize: '0.86rem', color: '#78350F', fontWeight: 700, marginTop: '0.15rem', fontStyle: 'italic' }}>
                          "{resv.notes}"
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.74rem', color: '#94A3B8', fontStyle: 'italic' }}>
                      No special customer requests or dietary notes provided.
                    </div>
                  )}
                </div>

                {/* Bottom Row: Receptionist Quick Action Buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: '0.75rem',
                  flexWrap: 'wrap',
                  gap: '0.65rem'
                }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    {resv.createdAt && `Booked: ${new Date(resv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {/* Assign Table - Disappears once table is assigned */}
                    {isUnassigned && resv.status !== 'Cancelled' && resv.status !== 'Completed' && (
                      <button
                        onClick={() => {
                          setAssignTableResv(resv);
                          setSelectedAssignTable('');
                        }}
                        style={{
                          backgroundColor: '#FFF7ED',
                          color: '#C2410C',
                          border: '1.5px solid #FDBA74',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '10px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Armchair size={14} />
                        <span>Assign Table</span>
                      </button>
                    )}

                    {/* Send SMS / WhatsApp */}
                    <button
                      onClick={() => handleSendConfirmation(resv.phone, resv.bookingId, resv.guestName, resv.date, resv.timeSlot)}
                      title="Send WhatsApp or SMS Confirmation"
                      style={{
                        backgroundColor: '#F0FDF4',
                        color: '#166534',
                        border: '1px solid #86EFAC',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '10px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Send size={13} />
                      <span>Send SMS / WA</span>
                    </button>

                    {/* Check-In Guest */}
                    {resv.status === 'Confirmed' && (
                      <button
                        onClick={() => {
                          setSelectedCheckInResv(resv);
                          setCheckInTableNo(resv.tableNo !== 'Unassigned' ? resv.tableNo : '');
                        }}
                        style={{
                          backgroundColor: '#0F2A1D',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.45rem 1rem',
                          borderRadius: '10px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: '0 2px 8px rgba(15, 42, 29, 0.2)'
                        }}
                      >
                        <CheckCircle2 size={14} color="#86EFAC" />
                        <span>Check-In Guest</span>
                      </button>
                    )}

                    {/* Cancel Booking */}
                    {resv.status === 'Confirmed' && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Cancel reservation for ${resv.guestName}?`)) {
                            handleStatusChange(resv._id, 'Cancelled');
                          }
                        }}
                        style={{
                          backgroundColor: '#FFF',
                          color: '#DC2626',
                          border: '1px solid #FCA5A5',
                          padding: '0.45rem 0.75rem',
                          borderRadius: '10px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ==================== MODAL: FULL RESERVATION DETAILS ==================== */}
      {inspectResv && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 24, 19, 0.7)',
          backdropFilter: 'blur(5px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#0F2A1D',
              color: '#FFFFFF',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #0F2A1D 0%, #1E4636 100%)'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#86EFAC', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Customer Reservation Details
                </div>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.25rem', fontWeight: 900 }}>
                  {inspectResv.bookingId}
                </h3>
              </div>
              <button
                onClick={() => setInspectResv(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#FFF', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '1rem', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>Guest Name</span>
                  <span style={{ fontSize: '0.92rem', color: '#0F2A1D', fontWeight: 900 }}>{inspectResv.guestName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>Mobile Number</span>
                  <span style={{ fontSize: '0.92rem', color: '#2563EB', fontWeight: 800 }}>{inspectResv.phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>Dining Date & Time</span>
                  <span style={{ fontSize: '0.92rem', color: '#0F2A1D', fontWeight: 800 }}>{inspectResv.date} at {inspectResv.timeSlot}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>Party Size</span>
                  <span style={{ fontSize: '0.92rem', color: '#0F2A1D', fontWeight: 900 }}>👥 {inspectResv.guests} Guests</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>Preferred Zone</span>
                  <span style={{ fontSize: '0.92rem', color: '#0F2A1D', fontWeight: 800 }}>{inspectResv.section || 'Main Dining'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>Assigned Table</span>
                  <span style={{ fontSize: '0.92rem', color: inspectResv.tableNo === 'Unassigned' ? '#D97706' : '#0F2A1D', fontWeight: 900 }}>
                    {inspectResv.tableNo || 'Unassigned'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>Booking Status</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0F2A1D' }}>{inspectResv.status}</span>
                </div>
              </div>

              {/* Special Occasion */}
              {inspectResv.specialOccasion && inspectResv.specialOccasion !== 'None' && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '0.75rem 1rem' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#991B1B' }}>🎉 SPECIAL OCCASION</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#7F1D1D', marginTop: '0.15rem' }}>
                    {inspectResv.specialOccasion}
                  </div>
                </div>
              )}

              {/* Special Requests / Chef Notes */}
              <div style={{ backgroundColor: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '14px', padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#92400E' }}>📝 SPECIAL REQUESTS & CHEF NOTES</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#78350F', marginTop: '0.25rem', lineHeight: 1.4 }}>
                  {inspectResv.notes ? `"${inspectResv.notes}"` : 'No special requests provided by customer.'}
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setInspectResv(null)}
                  style={{ padding: '0.65rem 1.2rem', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 700 }}
                >
                  Close
                </button>
                {(!inspectResv.tableNo || inspectResv.tableNo === 'Unassigned') && (
                  <button
                    type="button"
                    onClick={() => {
                      const r = inspectResv;
                      setInspectResv(null);
                      setAssignTableResv(r);
                      setSelectedAssignTable('');
                    }}
                    style={{ padding: '0.65rem 1.2rem', borderRadius: '10px', border: 'none', backgroundColor: '#0F2A1D', color: '#FFF', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Assign Table
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ASSIGN TABLE ==================== */}
      {assignTableResv && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 24, 19, 0.7)', backdropFilter: 'blur(5px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '22px', maxWidth: '460px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ backgroundColor: '#0F2A1D', padding: '1.25rem 1.5rem', color: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Assign Table for {assignTableResv.guestName}</h3>
                <div style={{ fontSize: '0.76rem', color: '#A3C2B3', marginTop: '0.2rem' }}>
                  👥 Party: {assignTableResv.guests} Guests • 📍 Zone: {assignTableResv.section}
                </div>
              </div>
              <button onClick={() => setAssignTableResv(null)} style={{ border: 'none', background: 'transparent', color: '#FFF', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleAssignTableSubmit} style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.45rem' }}>Select Floor Plan Table</label>
                <select
                  required
                  value={selectedAssignTable}
                  onChange={e => setSelectedAssignTable(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
                >
                  <option value="">-- Choose Table from Floor Plan --</option>
                  {tables.map(t => {
                    const fits = t.seats >= assignTableResv.guests;
                    return (
                      <option key={t.number} value={t.number}>
                        {t.number} ({t.seats} seats - {t.section}) {fits ? '✓ Fits Party' : '(Smaller than party)'} [{t.status}]
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setAssignTableResv(null)} style={{ padding: '0.65rem 1.1rem', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 700 }}>Cancel</button>
                <button
                  type="submit"
                  disabled={!selectedAssignTable || isAssigningTable}
                  style={{
                    padding: '0.65rem 1.3rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#0F2A1D',
                    color: '#FFF',
                    fontWeight: 800,
                    cursor: (selectedAssignTable && !isAssigningTable) ? 'pointer' : 'not-allowed',
                    opacity: isAssigningTable ? 0.6 : 1
                  }}
                >
                  {isAssigningTable ? 'Assigning Table...' : 'Confirm Table Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramana"
                    value={resvForm.guestName}
                    onChange={e => setResvForm({ ...resvForm, guestName: e.target.value.replace(/[^a-zA-Z\s]/g, '') })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Phone Number</label>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    placeholder="10-digit mobile"
                    value={resvForm.phone}
                    onChange={e => setResvForm({ ...resvForm, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Date</label>
                  <input type="date" required value={resvForm.date} onChange={e => setResvForm({ ...resvForm, date: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Time Slot</label>
                  <select value={resvForm.timeSlot} onChange={e => setResvForm({ ...resvForm, timeSlot: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none' }}>
                    {['12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
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
                    <option value="Birthday Celebration">🎂 Birthday Celebration</option>
                    <option value="Anniversary">💍 Anniversary</option>
                    <option value="Romantic Date">🌹 Romantic Date</option>
                    <option value="Business Dinner">💼 Business Dinner</option>
                    <option value="Family Gathering">👨‍👩‍👧‍👦 Family Gathering</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Customer Notes / Requests</label>
                <textarea
                  rows={2}
                  placeholder="e.g. High chair needed, quiet corner, anniversary flower setup"
                  value={resvForm.notes}
                  onChange={e => setResvForm({ ...resvForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', resize: 'vertical' }}
                />
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
