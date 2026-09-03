import React, { useState, useEffect } from 'react';
import {
  Table2, Users, Clock, CalendarDays, Plus, UserPlus, Phone, Sparkles,
  AlertTriangle, CheckCircle2, ChevronRight, Search, Eye, ArrowRight, RefreshCw, Send, X,
  UtensilsCrossed, Zap, Bell, Check, Bookmark, Layers, Filter
} from 'lucide-react';
import { api } from '../../services/api';
import { groupTablesForFloorPlan } from '../../utils/floorPlanUtils';

export default function ReceptionistDashboardHome({ onNavigate }) {
  const [kpis, setKpis] = useState({
    available: 0,
    occupied: 0,
    reserved: 0,
    waiting: 0,
    upcoming: 0,
    cleaning: 0
  });

  const [floorPlanTables, setFloorPlanTables] = useState([]);
  const [waitlistQueue, setWaitlistQueue] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Walk-in Form state
  const [walkInForm, setWalkInForm] = useState({
    partySize: 4,
    guestName: '',
    phone: '',
    preferredSection: 'Main Dining',
    specialOccasion: 'None',
    notes: '',
    selectedTableNum: ''
  });

  // Waitlist Form state
  const [waitlistForm, setWaitlistForm] = useState({
    guestName: '',
    phone: '',
    partySize: 2,
    preferredSection: 'Main Dining',
    specialOccasion: 'None',
    notes: ''
  });

  // Reservation Form state
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

  const fetchDashboardData = () => {
    Promise.all([
      api.getReceptionistKPIs().catch(() => null),
      api.getFloorPlan().catch(() => null),
      api.getWaitlist().catch(() => null),
      api.getReceptionistReservations().catch(() => null)
    ]).then(([kpiRes, floorRes, waitRes, resvRes]) => {
      if (kpiRes) {
        const kpiData = kpiRes.data || kpiRes;
        if (typeof kpiData === 'object' && !Array.isArray(kpiData)) setKpis(kpiData);
      }
      if (floorRes) {
        const floorData = Array.isArray(floorRes) ? floorRes : (floorRes.data || []);
        if (Array.isArray(floorData)) setFloorPlanTables(floorData);
      }
      if (waitRes) {
        const waitData = Array.isArray(waitRes) ? waitRes : (waitRes.data || []);
        if (Array.isArray(waitData)) {
          setWaitlistQueue(waitData.filter(w => w.status === 'WAITING' || w.status === 'CALLED'));
        }
      }
      if (resvRes) {
        const resvData = Array.isArray(resvRes) ? resvRes : (resvRes.data || []);
        if (Array.isArray(resvData)) setReservations(resvData);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalTablesCount = floorPlanTables.length || 1;
  const occupancyPercentage = Math.round(((kpis.occupied || 0) / totalTablesCount) * 100);

  const suitableAvailableTables = floorPlanTables.filter(t => t.status === 'Available' && t.seats >= Number(walkInForm.partySize));

  // Smart Combination Algorithm for Large Parties
  const findOptimalCombo = (partySize) => {
    const reqSeats = Number(partySize) || 1;
    const available = floorPlanTables.filter(t => t.status === 'Available');

    // 1. If a single table fits the party size, use single table
    const singleFit = available
      .filter(t => t.seats >= reqSeats)
      .sort((a, b) => a.seats - b.seats)[0];

    if (singleFit) {
      return {
        isMergeNeeded: false,
        primaryTable: singleFit.number,
        mergedTableNums: [],
        allTables: [singleFit],
        totalCapacity: singleFit.seats
      };
    }

    // 2. Otherwise find smallest valid combination of available tables sum >= partySize
    const sorted = [...available].sort((a, b) => b.seats - a.seats);
    let currentSum = 0;
    const combo = [];

    for (const tbl of sorted) {
      combo.push(tbl);
      currentSum += tbl.seats;
      if (currentSum >= reqSeats) break;
    }

    if (currentSum >= reqSeats && combo.length > 1) {
      return {
        isMergeNeeded: true,
        primaryTable: combo[0].number,
        mergedTableNums: combo.slice(1).map(t => t.number),
        allTables: combo,
        totalCapacity: currentSum
      };
    }

    return {
      isMergeNeeded: false,
      primaryTable: '',
      mergedTableNums: [],
      allTables: [],
      totalCapacity: currentSum,
      insufficient: true
    };
  };

  const walkInCombo = findOptimalCombo(walkInForm.partySize);

  const handleSeatWalkInSubmit = async (e) => {
    e.preventDefault();
    
    let targetPrimary = walkInForm.selectedTableNum;
    let targetMerged = [];

    if (walkInCombo.isMergeNeeded && (!targetPrimary || targetPrimary === 'COMBO')) {
      targetPrimary = walkInCombo.primaryTable;
      targetMerged = walkInCombo.mergedTableNums;
    }

    if (!targetPrimary) {
      alert('Please select a table or combination to seat the guest.');
      return;
    }

    try {
      const payload = {
        ...walkInForm,
        tableNum: targetPrimary,
        mergedTableNums: targetMerged
      };
      const res = await api.seatWalkIn(payload);
      if (res.success) {
        const msg = targetMerged.length > 0 
          ? `🔗 Merged tables ${[targetPrimary, ...targetMerged].join(' + ')} seated for ${walkInForm.guestName || 'Guest'}!`
          : `🟢 ${walkInForm.guestName || 'Guest'} seated at Table ${targetPrimary}!`;
        showToast(msg);
        setIsWalkInModalOpen(false);
        setWalkInForm({ partySize: 4, guestName: '', phone: '', preferredSection: 'Main Dining', specialOccasion: 'None', notes: '', selectedTableNum: '' });
        fetchDashboardData();
        window.dispatchEvent(new CustomEvent('STAFF_SHIFT_UPDATED'));
        window.dispatchEvent(new Event('flavora_tables_updated'));
      }
    } catch (err) {
      alert(`Error seating guest: ${err.message}`);
    }
  };

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!waitlistForm.guestName || !waitlistForm.phone) {
      alert('Please enter guest name and phone number.');
      return;
    }
    try {
      const res = await api.createWaitlistToken(waitlistForm);
      const resData = res?.data || res;
      if (resData) {
        const tokenNum = resData.tokenNum || resData.data?.tokenNum || '';
        const waitMins = resData.estimatedWaitMins || resData.data?.estimatedWaitMins || 15;
        showToast(`🎟️ Token ${tokenNum} issued for ${waitlistForm.guestName}! Est. wait ${waitMins} mins.`);
        setIsWaitlistModalOpen(false);
        setWaitlistForm({ guestName: '', phone: '', partySize: 2, preferredSection: 'Main Dining', specialOccasion: 'None', notes: '' });
        fetchDashboardData();
      }
    } catch (err) {
      alert(`Error issuing token: ${err.message}`);
    }
  };

  const handleCallToken = async (tokenId, tokenNum) => {
    try {
      const res = await api.callWaitlistToken(tokenId);
      if (res) {
        showToast(`📣 Token ${tokenNum} is now CALLED! Notification triggered.`);
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateReservationSubmit = async (e) => {
    e.preventDefault();
    if (!resvForm.guestName || !resvForm.phone) {
      alert('Please enter guest name and phone number.');
      return;
    }
    try {
      const res = await api.createReceptionistReservation(resvForm);
      const resData = res?.data || res;
      if (resData) {
        const bookingId = resData.bookingId || resData.data?.bookingId || '';
        showToast(`📅 Reservation ${bookingId} created for ${resvForm.guestName}!`);
        setIsReservationModalOpen(false);
        setResvForm({ guestName: '', phone: '', guests: 2, date: new Date().toISOString().split('T')[0], timeSlot: '19:30', tableNo: 'Unassigned', section: 'Main Dining', specialOccasion: 'None', notes: '' });
        fetchDashboardData();
      }
    } catch (err) {
      alert(`Error creating reservation: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', boxSizing: 'border-box' }}>

      {/* Toast Banner */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '25px',
          backgroundColor: '#0F2A1D',
          color: '#FFFFFF',
          padding: '0.85rem 1.4rem',
          borderRadius: '14px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontWeight: 700,
          border: '1.5px solid #E07A3C'
        }}>
          <Sparkles size={18} color="#E07A3C" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================== 2. KPI STATS CARDS GRID ==================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
        gap: '0.85rem',
        width: '100%'
      }}>

        {/* Available Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.1rem 1rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Available</span>
            <div style={{ backgroundColor: '#DCFCE7', padding: '0.4rem', borderRadius: '10px' }}>
              <Table2 size={16} color="#166534" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>{kpis.available || 0}</div>
          <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 700, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <CheckCircle2 size={12} />
            <span>Ready to seat</span>
          </div>
        </div>

        {/* Occupied Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.1rem 1rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Occupied</span>
            <div style={{ backgroundColor: '#FEE2E2', padding: '0.4rem', borderRadius: '10px' }}>
              <Users size={16} color="#991B1B" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>{kpis.occupied || 0}</div>
          <div style={{ fontSize: '0.7rem', color: '#991B1B', fontWeight: 700, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <UtensilsCrossed size={12} />
            <span>Dining guests</span>
          </div>
        </div>

        {/* Reserved Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.1rem 1rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reserved</span>
            <div style={{ backgroundColor: '#DBEAFE', padding: '0.4rem', borderRadius: '10px' }}>
              <CalendarDays size={16} color="#1E40AF" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>{kpis.reserved || 0}</div>
          <div style={{ fontSize: '0.7rem', color: '#1E40AF', fontWeight: 700, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <Bookmark size={12} />
            <span>Booked today</span>
          </div>
        </div>

        {/* Waiting Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.1rem 1rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Waitlist</span>
            <div style={{ backgroundColor: '#FFEDD5', padding: '0.4rem', borderRadius: '10px' }}>
              <Clock size={16} color="#C2410C" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>{kpis.waiting || 0}</div>
          <div style={{ fontSize: '0.7rem', color: '#C2410C', fontWeight: 700, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <Zap size={12} />
            <span>Queue tokens</span>
          </div>
        </div>

        {/* Upcoming Bookings Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.1rem 1rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Upcoming</span>
            <div style={{ backgroundColor: '#FEF9C3', padding: '0.4rem', borderRadius: '10px' }}>
              <UserPlus size={16} color="#A16207" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>{kpis.upcoming || 0}</div>
          <div style={{ fontSize: '0.7rem', color: '#A16207', fontWeight: 700, marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Today's bookings
          </div>
        </div>

        {/* Cleaning Turnover Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.1rem 1rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cleaning</span>
            <div style={{ backgroundColor: '#F3E8FF', padding: '0.4rem', borderRadius: '10px' }}>
              <RefreshCw size={16} color="#6B21A8" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>{kpis.cleaning || 0}</div>
          <div style={{ fontSize: '0.7rem', color: '#6B21A8', fontWeight: 700, marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Busser turnover
          </div>
        </div>

      </div>

 {/* ==================== 3. TOUCH QUICK ACTIONS BAR ==================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.1rem'
      }}>
        <button
          onClick={() => setIsWalkInModalOpen(true)}
          style={{
            backgroundColor: '#0F2A1D',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '20px',
            padding: '1.2rem 1.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(15, 42, 29, 0.18)',
            transition: 'transform 0.15s ease, boxShadow 0.15s ease'
          }}
        >
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '0.7rem', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={24} color="#86EFAC" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '1.02rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}> Walk-in Seating</div>
            <div style={{ fontSize: '0.74rem', color: '#A3C2B3', marginTop: '0.1rem' }}>Seat walk-in customer</div>
          </div>
        </button>

        <button
          onClick={() => {
            setWaitlistForm({ guestName: '', phone: '', partySize: 2, preferredSection: 'Main Dining', specialOccasion: 'None', notes: '' });
            setIsWaitlistModalOpen(true);
          }}
          style={{
            backgroundColor: '#E07A3C',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '20px',
            padding: '1.2rem 1.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(224, 122, 60, 0.22)',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '0.7rem', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} color="#FFFFFF" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '1.02rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}> Issue Wait Token</div>
            <div style={{ fontSize: '0.74rem', color: '#FFEDD5', marginTop: '0.1rem' }}>Add guest to queue</div>
          </div>
        </button>

        <button
          onClick={() => setIsReservationModalOpen(true)}
          style={{
            backgroundColor: '#1E4636',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '20px',
            padding: '1.2rem 1.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(30, 70, 54, 0.18)'
          }}
        >
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '0.7rem', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarDays size={24} color="#FEF08A" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '1.02rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}> New Booking</div>
            <div style={{ fontSize: '0.74rem', color: '#A3C2B3', marginTop: '0.1rem' }}>Book future reservation</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('receptionist-guests')}
          style={{
            backgroundColor: '#FFFFFF',
            color: '#0F2A1D',
            border: '1.5px solid #CBD5E1',
            borderRadius: '20px',
            padding: '1.2rem 1.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ backgroundColor: '#F1F5F9', padding: '0.7rem', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} color="#0F2A1D" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '1.02rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>Guest Profile Lookup</div>
            <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.1rem' }}>Repeat visits & tags</div>
          </div>
        </button>
      </div>
      {/* ==================== 4. LIVE FLOOR MINI OVERVIEW ==================== */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '1.6rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
              Live Floor Plan & Seating Status
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
              Real-time table status updates from MongoDB database
            </span>
          </div>

          <button
            onClick={() => onNavigate('receptionist-floor-plan')}
            style={{
              backgroundColor: '#0F2A1D',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '0.55rem 1.1rem',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span>Full Floor Plan View</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Tables Cards Grid */}
        {floorPlanTables.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B', fontSize: '0.88rem' }}>
            Loading floor plan tables from database...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
            gap: '1rem'
          }}>
            {groupTablesForFloorPlan(floorPlanTables).slice(0, 10).map((item) => {
              const isAvailable = item.status === 'Available';
              const isOccupied = item.status === 'Occupied';
              const isReserved = item.status === 'Reserved';
              const isCleaning = item.status === 'Cleaning';
              const isMerged = item.isMergedGroup;

              let borderCol = '#E2E8F0';
              let badgeBg = '#DCFCE7';
              let badgeText = '#166534';
              if (isOccupied) { borderCol = '#FCA5A5'; badgeBg = '#FEE2E2'; badgeText = '#991B1B'; }
              if (isReserved) { borderCol = '#93C5FD'; badgeBg = '#DBEAFE'; badgeText = '#1E40AF'; }
              if (isCleaning) { borderCol = '#FDE68A'; badgeBg = '#FEF3C7'; badgeText = '#92400E'; }

              return (
                <div
                  key={item.displayId}
                  style={{
                    backgroundColor: '#FAFAFA',
                    borderRadius: '16px',
                    padding: '1rem',
                    border: `2px solid ${borderCol}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    gap: '0.6rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2A1D' }}>{item.displayNumber}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '6px', backgroundColor: badgeBg, color: badgeText }}>
                      {item.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                    👥 {item.seats} Seats • {item.section || 'Main'}
                  </div>

                  {isMerged && (
                    <div style={{ fontSize: '0.68rem', color: '#C2410C', fontWeight: 800, backgroundColor: '#FFEDD5', padding: '0.2rem 0.4rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Layers size={12} />
                      <span>🔗 Merged</span>
                    </div>
                  )}

                  {item.activeSession ? (
                    <div style={{ fontSize: '0.72rem', color: '#0F2A1D', fontWeight: 800, backgroundColor: '#FFFFFF', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                      👤 {item.activeSession.guestName}
                    </div>
                  ) : isAvailable ? (
                    <button
                      onClick={() => {
                        setWalkInForm(prev => ({ ...prev, selectedTableNum: item.primaryTableNumber || item.number }));
                        setIsWalkInModalOpen(true);
                      }}
                      style={{
                        backgroundColor: '#0F2A1D',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.35rem 0.6rem',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'center'
                      }}
                    >
                      Seat Here
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================== 5. SPLIT VIEW: LIVE WAITLIST QUEUE + UPCOMING RESERVATIONS ==================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

        {/* LEFT: LIVE WAITLIST QUEUE */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '1.6rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ backgroundColor: '#FFEDD5', padding: '0.5rem', borderRadius: '12px' }}>
                <Clock size={20} color="#E07A3C" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D' }}>
                  Live Waitlist Queue
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Next guests waiting in line</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('receptionist-waitlist')}
              style={{ background: 'none', border: 'none', color: '#E07A3C', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              View Queue →
            </button>
          </div>

          {waitlistQueue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '16px', fontSize: '0.85rem' }}>
              🎉 No guests currently waiting in queue.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {waitlistQueue.slice(0, 4).map((item) => (
                <div key={item._id || item.tokenNum} style={{ backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ backgroundColor: '#0F2A1D', color: '#FFFFFF', fontWeight: 900, fontSize: '0.9rem', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.tokenNum}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F2A1D' }}>{item.guestName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                        👥 {item.partySize} Guests • {item.phone}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {item.status === 'WAITING' ? (
                      <button
                        onClick={() => handleCallToken(item._id, item.tokenNum)}
                        style={{ backgroundColor: '#E07A3C', color: '#FFFFFF', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        📣 Call
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#15803D', backgroundColor: '#DCFCE7', padding: '0.35rem 0.65rem', borderRadius: '8px' }}>
                        CALLED 🔔
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: TODAY'S UPCOMING RESERVATIONS */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '1.6rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ backgroundColor: '#DBEAFE', padding: '0.5rem', borderRadius: '12px' }}>
                <CalendarDays size={20} color="#1E40AF" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D' }}>
                  Today's Bookings
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Upcoming reservations for today</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('receptionist-reservations')}
              style={{ background: 'none', border: 'none', color: '#1E40AF', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              All Bookings →
            </button>
          </div>

          {reservations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '16px', fontSize: '0.85rem' }}>
              📅 No reservations scheduled for today.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {reservations.slice(0, 4).map((resv) => (
                <div key={resv._id || resv.bookingId} style={{ backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F2A1D' }}>{resv.guestName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                      🕒 {resv.timeSlot} • 👥 {resv.guests} Guests • Table: {resv.tableNo || 'Unassigned'}
                    </div>
                  </div>

                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1E40AF', backgroundColor: '#DBEAFE', padding: '0.35rem 0.65rem', borderRadius: '8px' }}>
                    {resv.status || 'Confirmed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ==================== MODAL: WALK-IN SEATING ==================== */}
      {isWalkInModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 42, 29, 0.6)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '540px', padding: '2rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0F2A1D' }}>Seat Walk-in Guest</h3>
              <button onClick={() => setIsWalkInModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748B" /></button>
            </div>

            <form onSubmit={handleSeatWalkInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Guest Name</label>
                <input type="text" placeholder="e.g. Rahul Sharma" value={walkInForm.guestName} onChange={e => setWalkInForm({ ...walkInForm, guestName: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Phone Number</label>
                  <input type="tel" maxLength={10} placeholder="10-digit mobile" value={walkInForm.phone} onChange={e => setWalkInForm({ ...walkInForm, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })} style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Party Size</label>
                  <input type="number" min="1" max="20" value={walkInForm.partySize} onChange={e => setWalkInForm({ ...walkInForm, partySize: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none' }} />
                </div>
              </div>

              {/* Combine Tables Suggestion Box when Party Size exceeds single table capacity */}
              {walkInCombo.isMergeNeeded ? (
                <div style={{ backgroundColor: '#FFF5ED', border: '1.5px solid #FDBA74', borderRadius: '16px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#C2410C', fontWeight: 900, fontSize: '0.92rem' }}>
                    <Sparkles size={18} color="#E07A3C" />
                    <span>COMBINE TABLES SUGGESTION ({walkInForm.partySize} Guests)</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#7C2D12', fontWeight: 600 }}>
                    No single table can accommodate {walkInForm.partySize} guests. Combine these available tables:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {walkInCombo.allTables.map(t => (
                      <span key={t.number} style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EA580C', color: '#C2410C', fontSize: '0.84rem', fontWeight: 900, padding: '0.35rem 0.75rem', borderRadius: '10px', boxShadow: '0 2px 6px rgba(224, 122, 60, 0.15)' }}>
                        Table {t.number} • {t.seats} seats
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#9A3412', fontWeight: 800, marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Combined Capacity: <strong>{walkInCombo.totalCapacity} Seats</strong></span>
                    <span>Party Size: <strong>{walkInForm.partySize} Guests</strong></span>
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Select Available Table</label>
                  <select required value={walkInForm.selectedTableNum} onChange={e => setWalkInForm({ ...walkInForm, selectedTableNum: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none', backgroundColor: '#FFFFFF' }}>
                    <option value="">-- Choose Available Table --</option>
                    {suitableAvailableTables.map(t => (
                      <option key={t.number} value={t.number}>Table {t.number} ({t.seats} Seats - {t.section || 'Main'})</option>
                    ))}
                  </select>
                </div>
              )}

              <button type="submit" style={{ backgroundColor: walkInCombo.isMergeNeeded ? '#E07A3C' : '#0F2A1D', color: '#FFFFFF', border: 'none', padding: '0.85rem', borderRadius: '12px', fontWeight: 900, fontSize: '0.92rem', cursor: 'pointer', marginTop: '0.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                {walkInCombo.isMergeNeeded ? `🔗 Merge & Seat ${walkInForm.partySize} Guests` : 'Confirm Walk-in Seating'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ISSUE WAITLIST TOKEN ==================== */}
      {isWaitlistModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 42, 29, 0.6)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '540px', padding: '2rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0F2A1D' }}>Issue Waitlist Queue Token</h3>
              <button onClick={() => {
                setWaitlistForm({ guestName: '', phone: '', partySize: 2, preferredSection: 'Main Dining', specialOccasion: 'None', notes: '' });
                setIsWaitlistModalOpen(false);
              }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748B" /></button>
            </div>

            <form onSubmit={handleWaitlistSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Guest Name</label>
                <input type="text" required placeholder="Guest full name" value={waitlistForm.guestName} onChange={e => setWaitlistForm({ ...waitlistForm, guestName: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Mobile Number</label>
                  <input type="tel" maxLength={10} required placeholder="10-digit mobile" value={waitlistForm.phone} onChange={e => setWaitlistForm({ ...waitlistForm, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })} style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Party Size</label>
                  <input type="number" min="1" max="20" value={waitlistForm.partySize} onChange={e => setWaitlistForm({ ...waitlistForm, partySize: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none' }} />
                </div>
              </div>

              <button type="submit" style={{ backgroundColor: '#E07A3C', color: '#FFFFFF', border: 'none', padding: '0.8rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                Generate Token & Send SMS
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: NEW RESERVATION ==================== */}
      {isReservationModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 42, 29, 0.6)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '540px', padding: '2rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0F2A1D' }}>Create New Reservation</h3>
              <button onClick={() => setIsReservationModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748B" /></button>
            </div>

            <form onSubmit={handleCreateReservationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Guest Name</label>
                <input type="text" required value={resvForm.guestName} onChange={e => setResvForm({ ...resvForm, guestName: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Mobile Number</label>
                  <input type="tel" maxLength={10} required placeholder="10-digit mobile" value={resvForm.phone} onChange={e => setResvForm({ ...resvForm, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })} style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Number of Guests</label>
                  <input type="number" min="1" value={resvForm.guests} onChange={e => setResvForm({ ...resvForm, guests: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Booking Date</label>
                  <input type="date" value={resvForm.date} onChange={e => setResvForm({ ...resvForm, date: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Time Slot</label>
                  <input type="time" value={resvForm.timeSlot} onChange={e => setResvForm({ ...resvForm, timeSlot: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none' }} />
                </div>
              </div>

              <button type="submit" style={{ backgroundColor: '#1E4636', color: '#FFFFFF', border: 'none', padding: '0.8rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                Save & Confirm Booking
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
