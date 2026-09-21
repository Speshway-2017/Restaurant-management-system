import React, { useState, useEffect, useMemo } from 'react';
import {
  Table2, Users, Clock, CalendarDays, Plus, UserPlus, Phone, Sparkles,
  AlertTriangle, CheckCircle2, ChevronRight, Search, Eye, ArrowRight, RefreshCw, Send, X,
  UtensilsCrossed, Zap, Bell, Check, Bookmark, Layers, Filter, ArrowRightLeft, GitMerge, Split,
  UserMinus, Monitor, Maximize2, ShieldCheck, UserCheck, Trash2, ArrowUpRight
} from 'lucide-react';
import { api } from '../../services/api';
import { groupTablesForFloorPlan, getSuitableAvailableTables } from '../../utils/floorPlanUtils';
import { onSocketEvent } from '../../services/socket';

const formatTableNum = (numStr) => {
  if (!numStr) return 'T-01';
  let str = String(numStr).trim();
  while (str.toUpperCase().startsWith('T-') || (str.toUpperCase().startsWith('T') && str.length > 1 && !isNaN(str.slice(1)))) {
    if (str.toUpperCase().startsWith('T-')) {
      str = str.slice(2);
    } else if (str.toUpperCase().startsWith('T')) {
      str = str.slice(1);
    }
  }
  if (str.toUpperCase().startsWith('T-')) {
    return str.toUpperCase();
  }
  return `T-${str}`;
};

export default function ReceptionistDesktopDashboard({ onNavigate }) {
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
  const [toastMessage, setToastMessage] = useState(null);

  // Filters & Selection
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);

  // Action Modals
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isSeatWaitlistModalOpen, setIsSeatWaitlistModalOpen] = useState(false);
  const [selectedWaitlistToken, setSelectedWaitlistToken] = useState(null);

  // Form states
  const [walkInForm, setWalkInForm] = useState({
    partySize: 4,
    guestName: '',
    phone: '',
    preferredSection: 'Main Dining',
    specialOccasion: 'None',
    notes: '',
    selectedTableNum: ''
  });

  const [waitlistForm, setWaitlistForm] = useState({
    guestName: '',
    phone: '',
    partySize: 2,
    preferredSection: 'Main Dining',
    specialOccasion: 'None',
    notes: ''
  });

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

  const [targetTransferTableNum, setTargetTransferTableNum] = useState('');
  const [selectedMergeTableNums, setSelectedMergeTableNums] = useState([]);
  const [seatWaitlistTableNum, setSeatWaitlistTableNum] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchDesktopDashboardData = () => {
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
    fetchDesktopDashboardData();
    const interval = setInterval(fetchDesktopDashboardData, 4000);

    const unsubResv = onSocketEvent('reservation_created', () => fetchDesktopDashboardData());
    const unsubStatus = onSocketEvent('table_status_changed', () => fetchDesktopDashboardData());
    const unsubWait = onSocketEvent('waitlist_updated', () => fetchDesktopDashboardData());

    const handleWindowResv = () => fetchDesktopDashboardData();
    window.addEventListener('flavora_reservation_created', handleWindowResv);

    return () => {
      clearInterval(interval);
      if (typeof unsubResv === 'function') unsubResv();
      if (typeof unsubStatus === 'function') unsubStatus();
      if (typeof unsubWait === 'function') unsubWait();
      window.removeEventListener('flavora_reservation_created', handleWindowResv);
    };
  }, []);

  const sections = ['All', 'Main Dining', 'Window Section', 'Family Lounge', 'Patio Outdoor'];
  const statuses = ['All', 'Available', 'Occupied', 'Reserved', 'Billing', 'Cleaning'];

  // Group physical tables for floor plan cards
  const displayCardItems = useMemo(() => {
    const grouped = groupTablesForFloorPlan(floorPlanTables);
    return grouped.filter(item => {
      const matchesSection = selectedSection === 'All' || item.section === selectedSection;
      const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        String(item.number || item.primaryTableNumber).toLowerCase().includes(q) ||
        (item.guestName && item.guestName.toLowerCase().includes(q)) ||
        (item.section && item.section.toLowerCase().includes(q));
      return matchesSection && matchesStatus && matchesSearch;
    });
  }, [floorPlanTables, selectedSection, selectedStatus, searchQuery]);

  // Operations: Walk-In Seating
  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    if (!walkInForm.selectedTableNum) {
      alert('Please select a table to seat the walk-in party!');
      return;
    }
    try {
      const res = await api.seatWalkIn(walkInForm);
      if (res) {
        showToast(`🎉 Party seated successfully at Table ${walkInForm.selectedTableNum}!`);
        setIsWalkInModalOpen(false);
        setWalkInForm({
          partySize: 4,
          guestName: '',
          phone: '',
          preferredSection: 'Main Dining',
          specialOccasion: 'None',
          notes: '',
          selectedTableNum: ''
        });
        fetchDesktopDashboardData();
        window.dispatchEvent(new Event('flavora_tables_updated'));
      }
    } catch (err) {
      alert(`Walk-in error: ${err.message}`);
    } finally {
      setIsWalkInModalOpen(false);
    }
  };

  // Operations: Create Waitlist Token
  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!waitlistForm.guestName || !waitlistForm.phone) {
      alert('Please provide Guest Name and Phone Number');
      return;
    }
    try {
      const res = await api.createWaitlistToken(waitlistForm);
      if (res) {
        const tokenVal = res.tokenNumber || res.tokenNum || 'Queue Token';
        showToast(`✅ Waitlist token created! #${tokenVal}`);
        setIsWaitlistModalOpen(false);
        setWaitlistForm({
          guestName: '',
          phone: '',
          partySize: 2,
          preferredSection: 'Main Dining',
          specialOccasion: 'None',
          notes: ''
        });
        fetchDesktopDashboardData();
      }
    } catch (err) {
      alert(`Waitlist error: ${err.message}`);
    } finally {
      setIsWaitlistModalOpen(false);
    }
  };

  // Operations: Create Reservation
  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    if (!resvForm.guestName || !resvForm.phone) {
      alert('Please fill out Guest Name and Phone Number');
      return;
    }
    try {
      const res = await api.createReceptionistReservation(resvForm);
      if (res) {
        showToast(`📅 Reservation confirmed for ${resvForm.guestName}!`);
        setIsReservationModalOpen(false);
        setResvForm({
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
        fetchDesktopDashboardData();
      }
    } catch (err) {
      alert(`Reservation error: ${err.message}`);
    } finally {
      setIsReservationModalOpen(false);
    }
  };

  // Operations: Call Waitlist Guest
  const handleCallWaitlist = async (id, guestName) => {
    try {
      const res = await api.callWaitlistToken(id);
      if (res) {
        showToast(`📢 Alert sent to ${guestName}! Status set to CALLED.`);
        fetchDesktopDashboardData();
      }
    } catch (err) {
      alert(`Failed to call guest: ${err.message}`);
    }
  };

  // Operations: Seat Waitlist Guest
  const handleSeatWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWaitlistToken || !seatWaitlistTableNum) return;
    try {
      const res = await api.seatWaitlistToken(selectedWaitlistToken._id, seatWaitlistTableNum);
      if (res) {
        showToast(`🎉 Waitlist token seated at Table ${seatWaitlistTableNum}!`);
        setIsSeatWaitlistModalOpen(false);
        setSelectedWaitlistToken(null);
        setSeatWaitlistTableNum('');
        fetchDesktopDashboardData();
        window.dispatchEvent(new Event('flavora_tables_updated'));
      }
    } catch (err) {
      alert(`Seating error: ${err.message}`);
    } finally {
      setIsSeatWaitlistModalOpen(false);
      setSelectedWaitlistToken(null);
    }
  };

  // Operations: Check-In Reservation
  const handleCheckInReservation = async (resv) => {
    if (!resv || !resv.tableNo || resv.tableNo === 'Unassigned') return;
    try {
      const res = await api.checkInReservation(resv._id, resv.tableNo);
      if (res) {
        showToast(`✅ Checked-in ${resv.guestName} at Table ${resv.tableNo}!`);
        fetchDesktopDashboardData();
        window.dispatchEvent(new Event('flavora_tables_updated'));
      }
    } catch (err) {
      alert(`Check-in error: ${err.message}`);
    }
  };

  // Operations: Vacate Table
  const handleVacateTable = async (tableNum) => {
    if (!window.confirm(`Are you sure you want to vacate Table ${tableNum}?`)) return;
    try {
      const res = await api.vacateTable(tableNum);
      if (res) {
        showToast(`🧹 Table ${tableNum} marked as cleaning/available!`);
        setSelectedTable(null);
        fetchDesktopDashboardData();
      }
    } catch (err) {
      alert(`Vacate error: ${err.message}`);
    }
  };

  // Operations: Transfer Table
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTable || !targetTransferTableNum) return;
    const primaryNum = selectedTable.primaryTableNumber || selectedTable.number;
    try {
      const res = await api.transferTable(primaryNum, targetTransferTableNum);
      if (res) {
        showToast(`🔀 Session transferred from Table ${primaryNum} to Table ${targetTransferTableNum}!`);
        setIsTransferModalOpen(false);
        setSelectedTable(null);
        setTargetTransferTableNum('');
        fetchDesktopDashboardData();
      }
    } catch (err) {
      alert(`Transfer error: ${err.message}`);
    } finally {
      setIsTransferModalOpen(false);
    }
  };

  // Operations: Merge Tables
  const handleMergeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTable || selectedMergeTableNums.length === 0) return;
    const primaryNum = selectedTable.primaryTableNumber || selectedTable.number;
    try {
      const res = await api.mergeTables(primaryNum, selectedMergeTableNums);
      if (res) {
        showToast(`🔗 Merged Table ${primaryNum} with ${selectedMergeTableNums.join(', ')}!`);
        setIsMergeModalOpen(false);
        setSelectedTable(null);
        setSelectedMergeTableNums([]);
        fetchDesktopDashboardData();
      }
    } catch (err) {
      alert(`Merge error: ${err.message}`);
    } finally {
      setIsMergeModalOpen(false);
    }
  };

  // Operations: Split Tables
  const handleSplitSubmit = async (tableNum) => {
    if (!window.confirm(`Split merged combo on Table ${tableNum}?`)) return;
    try {
      const res = await api.splitTables(tableNum);
      if (res.success) {
        showToast(`✂️ Table ${tableNum} combo split into individual tables!`);
        setSelectedTable(null);
        fetchDesktopDashboardData();
      }
    } catch (err) {
      alert(`Split error: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '25px',
          backgroundColor: '#0F2A1D',
          color: '#FFFFFF',
          padding: '0.85rem 1.4rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontWeight: 700,
          border: '1.5.px solid #E07A3C'
        }}>
          <Sparkles size={18} color="#E07A3C" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Desktop Command Center Header */}
      <div style={{
        backgroundColor: '#0F2A1D',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        boxShadow: '0 10px 25px rgba(15,42,29,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#1E4636',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            <Monitor size={24} color="#E07A3C" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                Receptionist Desktop Command Center
              </h1>
              <span style={{
                backgroundColor: 'rgba(224, 122, 60, 0.2)',
                color: '#E07A3C',
                border: '1px solid #E07A3C',
                fontSize: '0.68rem',
                fontWeight: 900,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                letterSpacing: '0.05em'
              }}>
                DESKTOP LIVE
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#A3B899', margin: '0.25rem 0 0 0' }}>
              Real-time floor plan layout, table operations, token queue & reservations dashboard
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsWalkInModalOpen(true)}
            style={{
              backgroundColor: '#E07A3C',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.82rem',
              padding: '0.6rem 1.1rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(224, 122, 60, 0.3)'
            }}
          >
            <UserPlus size={16} />
            <span>Seat Walk-In</span>
          </button>

          <button
            onClick={() => setIsWaitlistModalOpen(true)}
            style={{
              backgroundColor: '#2E6F40',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.82rem',
              padding: '0.6rem 1.1rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Clock size={16} />
            <span>Add Waitlist</span>
          </button>

          <button
            onClick={() => setIsReservationModalOpen(true)}
            style={{
              backgroundColor: '#1E4636',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.82rem',
              padding: '0.6rem 1.1rem',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <CalendarDays size={16} />
            <span>New Booking</span>
          </button>

          <button
            onClick={fetchDesktopDashboardData}
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: '#FFFFFF',
              padding: '0.6rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Refresh Data"
          >
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* KPI Stats Bar Strip - Single Line Desktop Alignment */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
        gap: '0.85rem'
      }}>
        <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '0.85rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', minWidth: 0 }}>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Available</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2E6F40', margin: '0.15rem 0 0 0' }}>{kpis.available}</p>
          </div>
          <div style={{ backgroundColor: '#EBF7EE', padding: '0.5rem', borderRadius: '10px', color: '#2E6F40', flexShrink: 0 }}>
            <Table2 size={20} />
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '0.85rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', minWidth: 0 }}>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Occupied</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#E07A3C', margin: '0.15rem 0 0 0' }}>{kpis.occupied}</p>
          </div>
          <div style={{ backgroundColor: '#FDF2E9', padding: '0.5rem', borderRadius: '10px', color: '#E07A3C', flexShrink: 0 }}>
            <Users size={20} />
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '0.85rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', minWidth: 0 }}>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Reserved</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2563EB', margin: '0.15rem 0 0 0' }}>{kpis.reserved}</p>
          </div>
          <div style={{ backgroundColor: '#EFF6FF', padding: '0.5rem', borderRadius: '10px', color: '#2563EB', flexShrink: 0 }}>
            <Bookmark size={20} />
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '0.85rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', minWidth: 0 }}>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Wait Queue</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#7C3AED', margin: '0.15rem 0 0 0' }}>{waitlistQueue.length}</p>
          </div>
          <div style={{ backgroundColor: '#F3E8FF', padding: '0.5rem', borderRadius: '10px', color: '#7C3AED', flexShrink: 0 }}>
            <Clock size={20} />
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '0.85rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', minWidth: 0 }}>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Bookings</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0D9488', margin: '0.15rem 0 0 0' }}>{reservations.length}</p>
          </div>
          <div style={{ backgroundColor: '#CCFBF1', padding: '0.5rem', borderRadius: '10px', color: '#0D9488', flexShrink: 0 }}>
            <CalendarDays size={20} />
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '0.85rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', minWidth: 0 }}>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Cleaning</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#64748B', margin: '0.15rem 0 0 0' }}>{kpis.cleaning || 0}</p>
          </div>
          <div style={{ backgroundColor: '#F1F5F9', padding: '0.5rem', borderRadius: '10px', color: '#64748B', flexShrink: 0 }}>
            <UtensilsCrossed size={20} />
          </div>
        </div>
      </div>

      {/* ROW 3: Waitlist Queue & Today's Bookings in a Single Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.25rem'
      }}>
        {/* LEFT CARD: Live Waitlist Queue */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          borderRadius: '16px',
          padding: '1.25rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', marginBottom: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="#7C3AED" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2A1D', margin: 0 }}>Live Waitlist Queue</h3>
            </div>
            <span style={{ backgroundColor: '#F3E8FF', color: '#7C3AED', fontSize: '0.72rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
              {waitlistQueue.length} Waiting
            </span>
          </div>

          {waitlistQueue.length === 0 ? (
            <div style={{ padding: '1.2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem', border: '1.5px dashed #E2E8F0', borderRadius: '10px' }}>
              No guests currently in wait queue.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '200px', overflowY: 'auto' }}>
              {waitlistQueue.map(w => (
                <div
                  key={w._id}
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, backgroundColor: '#F3E8FF', color: '#7C3AED', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        #{w.tokenNumber}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F2A1D' }}>{w.guestName}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.2rem' }}>
                      👥 {w.partySize} Guests | 📍 {w.preferredSection || 'Any'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <button
                      onClick={() => handleCallWaitlist(w._id, w.guestName)}
                      style={{
                        backgroundColor: '#FFF7ED',
                        color: '#E07A3C',
                        border: '1px solid #FFEDD5',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.3rem 0.6rem',
                        cursor: 'pointer'
                      }}
                    >
                      Call
                    </button>

                    <button
                      onClick={() => {
                        setSelectedWaitlistToken(w);
                        setIsSeatWaitlistModalOpen(true);
                      }}
                      style={{
                        backgroundColor: '#2E6F40',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.3rem 0.6rem',
                        cursor: 'pointer'
                      }}
                    >
                      Seat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT CARD: Today's Bookings */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          borderRadius: '16px',
          padding: '1.25rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', marginBottom: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarDays size={18} color="#0D9488" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2A1D', margin: 0 }}>Today's Bookings</h3>
            </div>
            <span style={{ backgroundColor: '#CCFBF1', color: '#0D9488', fontSize: '0.72rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
              {reservations.length} Reserved
            </span>
          </div>

          {reservations.length === 0 ? (
            <div style={{ padding: '1.2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem', border: '1.5px dashed #E2E8F0', borderRadius: '10px' }}>
              No upcoming table bookings scheduled.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '200px', overflowY: 'auto' }}>
              {reservations.map(r => (
                <div
                  key={r._id}
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F2A1D' }}>{r.guestName}</span>
                      <span style={{ fontSize: '0.68rem', backgroundColor: '#EFF6FF', color: '#2563EB', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {r.timeSlot || '19:30'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.2rem' }}>
                      👥 {r.guests || r.partySize || 2} Guests | Table: {r.tableNo || 'Unassigned'}
                    </div>
                  </div>

                  {(!r.tableNo || r.tableNo === 'Unassigned') ? (
                    <button
                      onClick={() => onNavigate ? onNavigate('receptionist-reservations') : null}
                      style={{
                        backgroundColor: '#FFF7ED',
                        color: '#C2410C',
                        border: '1px solid #FDBA74',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '0.35rem 0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      Assign Table
                    </button>
                  ) : (r.status === 'Checked_In' || r.status === 'CHECKED_IN' || r.status === 'Seated' || r.status === 'Completed') ? (
                    <span
                      style={{
                        backgroundColor: '#DCFCE7',
                        color: '#15803D',
                        border: '1px solid #86EFAC',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '0.35rem 0.65rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <UserCheck size={12} color="#15803D" /> Checked-In
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCheckInReservation(r)}
                      style={{
                        backgroundColor: '#0F2A1D',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '0.35rem 0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <UserCheck size={12} /> Check-In
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ROW 4: Full-Width Interactive Floor Plan Matrix */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderRadius: '16px',
        padding: '1.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        minHeight: '480px',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box'
      }}>

        {/* Controls Bar: Section & Status Pills + Search */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingBottom: '1rem',
          marginBottom: '1rem',
          borderBottom: '1px solid #E2E8F0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginRight: '0.2rem' }}>Section:</span>
            {sections.map(sec => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: selectedSection === sec ? '#0F2A1D' : '#FFFFFF',
                  color: selectedSection === sec ? '#FFFFFF' : '#475569',
                  cursor: 'pointer'
                }}
              >
                {sec}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search table or guest..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '0.4rem 0.6rem 0.4rem 2rem',
                  fontSize: '0.78rem',
                  width: '200px',
                  outline: 'none'
                }}
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                padding: '0.4rem 0.6rem',
                fontSize: '0.78rem',
                outline: 'none',
                fontWeight: 700,
                color: '#0F2A1D'
              }}
            >
              {statuses.map(st => (
                <option key={st} value={st}>Status: {st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Interactive Table Grid */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#0F2A1D' }} />
            <p style={{ marginTop: '0.5rem', fontWeight: 700 }}>Loading Floor Plan Matrix...</p>
          </div>
        ) : displayCardItems.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', border: '2px dashed #E2E8F0', borderRadius: '12px' }}>
            <Table2 size={36} color="#94A3B8" />
            <p style={{ fontWeight: 800, fontSize: '0.95rem', margin: '0.5rem 0 0 0' }}>No tables match current filters</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '1rem',
            flex: 1
          }}>
            {displayCardItems.map(item => {
              const isMergedCombo = item.isMergedMaster;
              const isSelected = selectedTable && (selectedTable._id === item._id || selectedTable.primaryTableNumber === item.primaryTableNumber);

              let cardBg = '#F0FDF4';
              let borderColor = '#BBF7D0';
              let badgeBg = '#2E6F40';
              let badgeText = '#FFFFFF';

              if (item.status === 'Occupied') {
                cardBg = '#FFF7ED';
                borderColor = '#FFEDD5';
                badgeBg = '#E07A3C';
              } else if (item.status === 'Reserved') {
                cardBg = '#EFF6FF';
                borderColor = '#BFDBFE';
                badgeBg = '#2563EB';
              } else if (item.status === 'Cleaning') {
                cardBg = '#F8FAFC';
                borderColor = '#E2E8F0';
                badgeBg = '#64748B';
              }

              return (
                <div
                  key={item._id || item.primaryTableNumber || item.number}
                  onClick={() => setSelectedTable(isSelected ? null : item)}
                  style={{
                    backgroundColor: cardBg,
                    border: isSelected ? '2px solid #0F2A1D' : `1.5px solid ${borderColor}`,
                    borderRadius: '14px',
                    padding: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isSelected ? '0 6px 18px rgba(15,42,29,0.15)' : '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                        {item.section || 'Main'}
                      </span>
                      <span style={{
                        backgroundColor: badgeBg,
                        color: badgeText,
                        fontSize: '0.62rem',
                        fontWeight: 900,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '9999px',
                        textTransform: 'uppercase'
                      }}>
                        {item.status}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2A1D', margin: '0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {formatTableNum(item.primaryTableNumber || item.number)}
                      {isMergedCombo && (
                        <span style={{ fontSize: '0.6rem', backgroundColor: '#312E81', color: '#E0E7FF', padding: '0.1rem 0.3rem', borderRadius: '4px', fontFamily: 'monospace' }}>
                          MERGED
                        </span>
                      )}
                    </h3>

                    <div style={{ fontSize: '0.75rem', color: '#475569', margin: '0.3rem 0' }}>
                      👥 {item.capacity} Seats
                    </div>

                    {(item.status !== 'Available' || item.guestName || item.activeSession?.guestName || item.reservation?.guestName) && (() => {
                      const dinerName = item.reservation?.guestName 
                        || item.activeSession?.guestName 
                        || item.guestName 
                        || item.originalTable?.reservation?.guestName 
                        || item.originalTable?.activeSession?.guestName 
                        || item.originalTable?.guestName 
                        || item.reservedBy;
                      if (!dinerName && item.status === 'Available') return null;
                      return (
                        <div style={{ fontSize: '0.74rem', color: '#E07A3C', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.2rem' }}>
                          👤 {dinerName || 'Valued Guest'}
                        </div>
                      );
                    })()}
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    {item.status === 'Available' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setWalkInForm(prev => ({ ...prev, selectedTableNum: String(item.number) }));
                          setIsWalkInModalOpen(true);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.4rem',
                          backgroundColor: '#2E6F40',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <UserPlus size={12} /> Seat Here
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVacateTable(item.primaryTableNumber || item.number);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.4rem',
                          backgroundColor: '#DC2626',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <Trash2 size={12} /> Vacate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Table Drawer Control Bar */}
        {selectedTable && (
          <div style={{
            marginTop: '1rem',
            backgroundColor: '#0F2A1D',
            color: '#FFFFFF',
            borderRadius: '14px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 8px 25px rgba(15,42,29,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Table {formatTableNum(selectedTable.primaryTableNumber || selectedTable.number)} Selected
                  <span style={{ fontSize: '0.68rem', backgroundColor: selectedTable.status === 'Occupied' ? '#E07A3C' : selectedTable.status === 'Reserved' ? '#2563EB' : 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: '9999px', textTransform: 'uppercase' }}>
                    {selectedTable.status}
                  </span>
                </h4>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: '#A3B899' }}>
                  Section: {selectedTable.section} | Capacity: {selectedTable.capacity || selectedTable.seats} Guests
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setIsTransferModalOpen(true)}
                  style={{
                    backgroundColor: '#1E4636',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <ArrowRightLeft size={14} /> Transfer
                </button>

                {selectedTable.isMergedMaster ? (
                  <button
                    onClick={() => handleSplitSubmit(selectedTable.primaryTableNumber || selectedTable.number)}
                    style={{
                      backgroundColor: '#D97706',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Split size={14} /> Split
                  </button>
                ) : (
                  <button
                    onClick={() => setIsMergeModalOpen(true)}
                    style={{
                      backgroundColor: '#1E4636',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <GitMerge size={14} /> Merge
                  </button>
                )}

                <button
                  onClick={() => handleVacateTable(selectedTable.primaryTableNumber || selectedTable.number)}
                  style={{
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Trash2 size={14} /> Vacate
                </button>

                <button onClick={() => setSelectedTable(null)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', marginLeft: '0.5rem' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Reserved Person / Active Guest Details Card */}
            {(selectedTable.guestName || selectedTable.activeSession?.guestName || selectedTable.reservation?.guestName || selectedTable.status === 'Reserved' || selectedTable.status === 'Occupied') && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#E07A3C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {selectedTable.status === 'Reserved' ? 'RESERVED PERSON DETAILS' : 'ACTIVE DINING GUEST'}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#FFFFFF', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  👤 {selectedTable.activeSession?.guestName || selectedTable.reservation?.guestName || selectedTable.guestName || 'Valued Guest'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#A3B899', marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  <span>📞 {selectedTable.activeSession?.phone || selectedTable.reservation?.phone || selectedTable.phone || 'No phone'}</span>
                  <span>👥 {selectedTable.activeSession?.partySize || selectedTable.reservation?.guests || selectedTable.capacity || selectedTable.seats || 2} Guests</span>
                  <span>🎉 Occasion: {selectedTable.activeSession?.specialOccasion || selectedTable.reservation?.specialOccasion || 'Standard Dining'}</span>
                  {selectedTable.reservation?.timeSlot && <span>🕒 Slot: {selectedTable.reservation.timeSlot}</span>}
                </div>
                {(selectedTable.activeSession?.notes || selectedTable.reservation?.notes) && (
                  <div style={{ fontSize: '0.74rem', color: '#FFFFFF', backgroundColor: 'rgba(224, 122, 60, 0.2)', padding: '0.35rem 0.6rem', borderRadius: '6px', marginTop: '0.4rem', border: '1px solid rgba(224,122,60,0.3)' }}>
                    📝 Customer Request: "{selectedTable.activeSession?.notes || selectedTable.reservation?.notes}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: WALK-IN SEATING MODAL */}
      {isWalkInModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} color="#E07A3C" /> Seat Walk-In Guest Party
              </h3>
              <button onClick={() => setIsWalkInModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.25rem' }}>Guest Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={walkInForm.guestName}
                  onChange={e => setWalkInForm({ ...walkInForm, guestName: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.25rem' }}>Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={walkInForm.phone}
                    onChange={e => setWalkInForm({ ...walkInForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.25rem' }}>Party Size</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={walkInForm.partySize}
                    onChange={e => setWalkInForm({ ...walkInForm, partySize: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.25rem' }}>Select Available Table</label>
                <select
                  required
                  value={walkInForm.selectedTableNum}
                  onChange={e => setWalkInForm({ ...walkInForm, selectedTableNum: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', fontWeight: 700 }}
                >
                  <option value="">-- Choose Available Table ({walkInForm.partySize}+ Seats) --</option>
                  {getSuitableAvailableTables(floorPlanTables, walkInForm.partySize).map(t => (
                    <option key={t._id || t.number} value={t.primaryTableNumber || t.number}>
                      {t.isMergedGroup ? `Merged Combo: ${t.displayNumber}` : `Table ${formatTableNum(t.displayNumber)}`} ({t.section || 'Main'}, {t.seats} Seats)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsWalkInModalOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#64748B', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: '#E07A3C', color: '#FFFFFF', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Seat Guest Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: WAITLIST MODAL */}
      {isWaitlistModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} color="#7C3AED" /> Add Guest to Waitlist
              </h3>
              <button onClick={() => setIsWaitlistModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleWaitlistSubmit} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.25rem' }}>Guest Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anita Verma"
                  value={waitlistForm.guestName}
                  onChange={e => setWaitlistForm({ ...waitlistForm, guestName: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.25rem' }}>Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={waitlistForm.phone}
                    onChange={e => setWaitlistForm({ ...waitlistForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.25rem' }}>Party Size</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={waitlistForm.partySize}
                    onChange={e => setWaitlistForm({ ...waitlistForm, partySize: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsWaitlistModalOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#64748B', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: '#7C3AED', color: '#FFFFFF', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Generate Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESERVATION MODAL */}
      {isReservationModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarDays size={20} color="#0D9488" /> Create Table Reservation
              </h3>
              <button onClick={() => setIsReservationModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReservationSubmit} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.25rem' }}>Guest Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikramaditya Singh"
                  value={resvForm.guestName}
                  onChange={e => setResvForm({ ...resvForm, guestName: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.25rem' }}>Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={resvForm.phone}
                    onChange={e => setResvForm({ ...resvForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.25rem' }}>Time Slot</label>
                  <input
                    type="time"
                    required
                    value={resvForm.timeSlot}
                    onChange={e => setResvForm({ ...resvForm, timeSlot: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsReservationModalOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#64748B', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: '#0D9488', color: '#FFFFFF', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: TRANSFER MODAL */}
      {isTransferModalOpen && selectedTable && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', maxWidth: '380px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F2A1D', margin: 0 }}>
                Transfer Table {formatTableNum(selectedTable.primaryTableNumber || selectedTable.number)}
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.25rem' }}>Select Target Table</label>
                <select
                  required
                  value={targetTransferTableNum}
                  onChange={e => setTargetTransferTableNum(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', fontWeight: 700 }}
                >
                  <option value="">-- Choose Target Table --</option>
                  {floorPlanTables.filter(t => t.status === 'Available' && String(t.number) !== String(selectedTable.number)).map(t => (
                    <option key={t._id || t.number} value={t.number}>
                      Table {formatTableNum(t.number)} ({t.section || 'Main'}, {t.capacity} Seats)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#64748B', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: '#0F2A1D', color: '#FFFFFF', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: SEAT WAITLIST GUEST MODAL */}
      {isSeatWaitlistModalOpen && selectedWaitlistToken && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', maxWidth: '380px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F2A1D', margin: 0 }}>
                Seat Token #{selectedWaitlistToken.tokenNumber}
              </h3>
              <button onClick={() => setIsSeatWaitlistModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSeatWaitlistSubmit} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <p style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '0.5rem' }}>
                  Guest: <strong style={{ color: '#0F2A1D' }}>{selectedWaitlistToken.guestName}</strong> ({selectedWaitlistToken.partySize} Guests)
                </p>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.25rem' }}>Select Table</label>
                <select
                  required
                  value={seatWaitlistTableNum}
                  onChange={e => setSeatWaitlistTableNum(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', fontWeight: 700 }}
                >
                  <option value="">-- Choose Available Table ({selectedWaitlistToken?.partySize || 1}+ Seats) --</option>
                  {getSuitableAvailableTables(floorPlanTables, selectedWaitlistToken?.partySize || 1).map(t => (
                    <option key={t._id || t.number} value={t.primaryTableNumber || t.number}>
                      {t.isMergedGroup ? `Merged Combo: ${t.displayNumber}` : `Table ${formatTableNum(t.displayNumber)}`} ({t.section || 'Main'}, {t.seats} Seats)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsSeatWaitlistModalOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#64748B', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: '#2E6F40', color: '#FFFFFF', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Confirm Seating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
