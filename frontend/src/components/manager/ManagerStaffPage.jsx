import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, CheckCircle2, Clock, UserCheck, Edit, Trash2, X, MoreVertical,
  ShieldCheck, Mail, Phone, RefreshCw, Eye, EyeOff, Ban, AlertCircle, Calendar, Filter,
  Flame, Utensils, Award
} from 'lucide-react';
import { api } from '../../services/api';
import { onSocketEvent } from '../../services/socket';

const format24to12 = (time24) => {
  if (!time24) return '';
  const [hStr, mStr] = String(time24).split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const hFormatted = String(h).padStart(2, '0');
  return `${hFormatted}:${m} ${ampm}`;
};

const parseShiftTo24 = (shiftStr) => {
  if (!shiftStr) return { start: '09:00', end: '17:00' };
  const parts = String(shiftStr).split(/[-–—]/);
  if (parts.length < 2) return { start: '09:00', end: '17:00' };

  const parseSingle = (str, fallback) => {
    const trimmed = (str || '').trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return fallback;
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = (match[3] || '').toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  };

  return {
    start: parseSingle(parts[0], '09:00'),
    end: parseSingle(parts[1], '17:00')
  };
};

export default function ManagerStaffPage() {
  const [activeTabSection, setActiveTabSection] = useState('availability'); // 'availability', 'history', 'roster'
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [viewingStaff, setViewingStaff] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [phoneWarning, setPhoneWarning] = useState('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };
    if (openMenuId !== null) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuId]);

  // Monthly Attendance State for Viewing Staff Modal
  const [monthlyHistoryList, setMonthlyHistoryList] = useState([]);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);

  const getLast30DaysIst = () => {
    const dates = [];
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const optionsDate = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
      const optionsFullDate = { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' };
      const parts = new Intl.DateTimeFormat('en-CA', optionsDate).format(d); // YYYY-MM-DD
      const displayDate = new Intl.DateTimeFormat('en-GB', optionsFullDate).format(d); // 05 Oct 2026
      dates.push({ dateStr: parts, displayDate });
    }
    return dates;
  };

  useEffect(() => {
    if (viewingStaff) {
      setIsLoadingMonthly(true);
      const stId = viewingStaff.id || viewingStaff._id || viewingStaff.staffId;
      api.getStaffAttendanceHistory({ staffId: stId })
        .then(res => {
          const fetchedHistory = res?.history || res?.records || [];
          const last30Days = getLast30DaysIst();

          const full30DaysList = last30Days.map(day => {
            const match = fetchedHistory.find(h => h.date === day.dateStr);
            if (match) {
              return {
                ...match,
                displayDate: day.displayDate
              };
            }
            return {
              id: `${stId}_${day.dateStr}`,
              date: day.dateStr,
              displayDate: day.displayDate,
              sessions: [],
              loginTimeFormatted: '—',
              logoutTimeFormatted: '—',
              durationFormatted: '0m',
              totalDurationMinutes: 0,
              status: 'offline'
            };
          });

          setMonthlyHistoryList(full30DaysList);
        })
        .catch(err => {
          console.warn('Failed to fetch monthly attendance history:', err.message);
        })
        .finally(() => {
          setIsLoadingMonthly(false);
        });
    } else {
      setMonthlyHistoryList([]);
    }
  }, [viewingStaff]);

  // Staff Availability State
  const [availabilitySummary, setAvailabilitySummary] = useState({
    totalStaff: 0,
    availableChefs: 0,
    availableWaiters: 0,
    offlineStaff: 0
  });
  const [currentAvailabilityList, setCurrentAvailabilityList] = useState([]);
  const [availabilityFilter, setAvailabilityFilter] = useState('All'); // 'All', 'available', 'offline', 'chef', 'waiter'

  // Attendance History State
  const [historyList, setHistoryList] = useState([]);
  const [historyFilters, setHistoryFilters] = useState({
    date: '', // Default to all dates so all staff attendance session details are displayed
    role: 'All',
    status: 'All',
    search: ''
  });
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const getSessionUser = () => {
    const raw = sessionStorage.getItem('flavora_user_data') || localStorage.getItem('flavora_user_data');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return null;
  };
  const sessionUser = getSessionUser();
  const managerAccountKey = sessionUser?._id || sessionUser?.id || sessionUser?.email || 'manager';

  const [staffList, setStaffList] = useState([]);

  const fetchBackendStaff = async () => {
    try {
      const data = await api.getStaff();
      if (Array.isArray(data)) {
        const mapped = data.map((stf, idx) => ({
          id: stf._id || stf.id || idx + 1,
          empId: stf.empId || `RMSW-0${idx + 1}`,
          name: stf.name || 'Staff Member',
          role: stf.role || 'Waiter',
          email: stf.email || '',
          phone: stf.phone || '',
          shift: stf.scheduledShift || stf.shift || '09:00 AM – 05:00 PM',
          status: stf.status || 'On Shift'
        }));
        setStaffList(mapped);
      }
    } catch (err) {
      console.warn("Backend staff fetch notice:", err.message);
    }
  };

  const fetchCurrentAvailability = async () => {
    try {
      const res = await api.getStaffAvailabilityCurrent();
      if (res && res.success) {
        setAvailabilitySummary(res.summary || {
          totalStaff: 0,
          availableChefs: 0,
          availableWaiters: 0,
          offlineStaff: 0
        });
        setCurrentAvailabilityList(res.staff || []);
      }
    } catch (err) {
      console.warn("Failed to fetch staff availability:", err.message);
    }
  };

  const fetchAttendanceHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.getStaffAttendanceHistory({
        date: historyFilters.date,
        role: historyFilters.role,
        status: historyFilters.status,
        search: historyFilters.search
      });
      if (res && res.success) {
        setHistoryList(res.history || []);
      }
    } catch (err) {
      console.warn("Failed to fetch attendance history:", err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchBackendStaff();
    fetchCurrentAvailability();
    fetchAttendanceHistory();
  }, [managerAccountKey]);

  useEffect(() => {
    fetchAttendanceHistory();
  }, [historyFilters.date, historyFilters.role, historyFilters.status, historyFilters.search]);

  // Real-Time Socket Listener for Staff Availability & Attendance Events
  useEffect(() => {
    const handleStaffUpdate = (payload) => {
      console.log('⚡ Socket event received: staff availability updated', payload);
      fetchCurrentAvailability();
      fetchAttendanceHistory();
      if (payload && payload.staffName) {
        showToast(`🔔 Staff Status Update: ${payload.staffName} is now ${payload.status.toUpperCase()}`);
      }
    };

    const unsub1 = onSocketEvent('staffAvailabilityUpdated', handleStaffUpdate);
    const unsub2 = onSocketEvent('staff_attendance_updated', handleStaffUpdate);

    return () => {
      if (unsub1) unsub1();
      if (unsub2) unsub2();
    };
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    role: 'Waiter',
    email: '',
    password: '',
    phone: '',
    shiftStart: '09:00',
    shiftEnd: '17:00',
    shift: '09:00 AM – 05:00 PM',
    status: 'On Shift'
  });

  const saveStaffList = (newList) => {
    setStaffList(newList);
    try {
      localStorage.setItem(`flavora_staff_list_${managerAccountKey}`, JSON.stringify(newList));
    } catch (e) {}
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setShowStaffPassword(false);
    setPhoneWarning('');
    setFormData({
      name: '',
      role: 'Waiter',
      email: '',
      password: '',
      phone: '',
      shiftStart: '09:00',
      shiftEnd: '17:00',
      shift: '09:00 AM – 05:00 PM',
      status: 'On Shift'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (stf) => {
    setEditingStaff(stf);
    setShowStaffPassword(false);
    setPhoneWarning('');
    const parsedTimes = parseShiftTo24(stf.shift || '11:00 AM – 10:00 PM');
    setFormData({
      name: stf.name || '',
      role: stf.role || 'Waiter',
      email: stf.email || '',
      password: '',
      phone: stf.phone || '',
      shiftStart: parsedTimes.start,
      shiftEnd: parsedTimes.end,
      shift: stf.shift || `${format24to12(parsedTimes.start)} – ${format24to12(parsedTimes.end)}`,
      status: stf.status || 'On Shift'
    });
    setOpenMenuId(null);
    setIsAddModalOpen(true);
  };

  const handlePhoneChange = async (rawValue) => {
    const cleanDigits = String(rawValue || '').replace(/[^0-9]/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, phone: cleanDigits }));

    if (cleanDigits.length < 10) {
      setPhoneWarning('');
      return;
    }

    const currentId = editingStaff?.id || editingStaff?._id;
    const localMatch = staffList.find(st => {
      const stId = st.id || st._id;
      if (currentId && String(stId) === String(currentId)) return false;
      const stDigits = String(st.phone || '').replace(/[^0-9]/g, '');
      return stDigits.slice(-10) === cleanDigits;
    });

    if (localMatch) {
      setPhoneWarning(`⚠️ Mobile number already exists`);
      return;
    }

    setIsCheckingPhone(true);
    try {
      const res = await api.checkStaffPhone(cleanDigits, currentId || '');
      if (res && res.exists) {
        setPhoneWarning(`⚠️ Mobile number already exists`);
      } else {
        setPhoneWarning('');
      }
    } catch (err) {
      console.warn("Phone check error:", err.message);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleSubmitStaff = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter staff name.');
      return;
    }
    if (!editingStaff && (!formData.password || !formData.password.trim())) {
      alert('Please enter account login password for the staff member.');
      return;
    }

    if (formData.phone) {
      const digitsOnly = String(formData.phone).replace(/[^0-9]/g, '');
      if (digitsOnly.length > 0 && digitsOnly.length < 10) {
        alert('Mobile number must be at least 10 digits.');
        return;
      }

      if (phoneWarning) {
        alert(phoneWarning.replace(/^[⚠️\s]+/, ''));
        return;
      }

      try {
        const currentId = editingStaff?.id || editingStaff?._id;
        const res = await api.checkStaffPhone(digitsOnly, currentId || '');
        if (res && res.exists) {
          const warnMsg = `Mobile number ${formData.phone} already exists in database`;
          setPhoneWarning(`⚠️ ${warnMsg}`);
          alert(warnMsg);
          return;
        }
      } catch (err) { }
    }

    const computedShift = `${format24to12(formData.shiftStart)} – ${format24to12(formData.shiftEnd)}`;
    const payload = {
      name: formData.name,
      role: formData.role,
      email: formData.email || `${formData.name.toLowerCase().replace(/[^a-z]/g, '')}@flavora.in`,
      phone: formData.phone,
      scheduledShift: computedShift,
      shift: computedShift,
      checkInTime: format24to12(formData.shiftStart),
      checkOutTime: format24to12(formData.shiftEnd),
      status: formData.status,
      password: formData.password || 'password123'
    };

    if (editingStaff) {
      try {
        await api.updateStaff(editingStaff.id, payload);
      } catch (err) {
        alert(err.message || 'Failed to update staff in database.');
        return;
      }
      showToast('Staff member updated successfully.');
    } else {
      try {
        await api.createStaff(payload);
      } catch (err) {
        alert(err.message || 'Failed to save staff member.');
        return;
      }
      showToast(`✓ New staff member ${formData.name} saved to database!`);
    }
    setIsAddModalOpen(false);
    fetchBackendStaff();
    fetchCurrentAvailability();
  };

  const handleDeleteStaff = async (stfId, stfName) => {
    if (window.confirm(`Are you sure you want to remove ${stfName} from staff roster?`)) {
      try {
        await api.deleteStaff(stfId);
      } catch (err) { }
      showToast(`Staff member ${stfName} removed.`);
      setOpenMenuId(null);
      fetchBackendStaff();
      fetchCurrentAvailability();
    }
  };

  const rosterStaffList = staffList.filter(stf => {
    const r = String(stf.role || '').toLowerCase();
    return !r.includes('admin') && !r.includes('manager');
  });

  const filteredStaffRoster = rosterStaffList.filter(stf => {
    const matchesSearch = !searchQuery || 
      (stf.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stf.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stf.phone || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'All' || 
      (roleFilter === 'Waiters' && stf.role.toLowerCase().includes('waiter')) ||
      (roleFilter === 'Receptionists' && (stf.role.toLowerCase().includes('receptionist') || stf.role.toLowerCase().includes('host'))) ||
      (roleFilter === 'Chefs' && stf.role.toLowerCase().includes('chef'));

    return matchesSearch && matchesRole;
  });

  const filteredAvailabilityList = currentAvailabilityList.filter(stf => {
    const r = String(stf.role || stf.normRole || '').toLowerCase();
    if (r.includes('manager') || r.includes('admin')) return false;
    if (availabilityFilter === 'available') return stf.status === 'available';
    if (availabilityFilter === 'offline') return stf.status === 'offline';
    if (availabilityFilter === 'chef') return stf.normRole === 'chef';
    if (availabilityFilter === 'waiter') return stf.normRole === 'waiter';
    if (availabilityFilter === 'receptionist') return stf.normRole === 'receptionist';
    return true;
  });

  const visibleHistoryList = historyList.filter(s => {
    const r = String(s.role || '').toLowerCase();
    return !r.includes('manager') && !r.includes('admin');
  });

  return (
    <div className="admin-subpage-container" style={{ paddingBottom: '3rem' }}>
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#0F2A1D',
          color: '#FFFFFF',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          zIndex: 99999,
          fontSize: '0.85rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          border: '1px solid #285A46'
        }}>
          <CheckCircle2 size={16} color="#4ADE80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= PAGE HEADER & NAVIGATION TABS ================= */}
      <div className="admin-dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div className="page-breadcrumb-bar">
            <span>Dashboard</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Staff Attendance & Availability</span>
          </div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>Staff Availability & Duty Tracking</h1>
          <p className="admin-page-subtitle" style={{ margin: '0.2rem 0 0 0' }}>Real-time Chef & Waiter login/logout status, active working hours, and shift history logs.</p>
        </div>

        {/* Action Button: + Add Staff */}
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={fetchCurrentAvailability}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#0F2A1D',
              border: '1px solid #CBD5E1',
              borderRadius: '12px',
              padding: '0.65rem 1rem',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
            title="Refresh availability"
          >
            <RefreshCw size={16} color="#0F2A1D" />
            <span>Sync Status</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            style={{
              backgroundColor: '#0F2A1D',
              color: '#FFFFFF',
              border: '1px solid #285A46',
              borderRadius: '12px',
              padding: '0.65rem 1.25rem',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(15, 42, 29, 0.2)'
            }}
          >
            <Plus size={18} color="#F2C14E" />
            <span>Add New Staff</span>
          </button>
        </div>
      </div>

      {/* ================= SUMMARY CARDS (STAFF AVAILABILITY OVERVIEW) ================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* TOTAL STAFF */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.1rem 1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase' }}>TOTAL STAFF</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#475569" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F2A1D' }}>
            {availabilitySummary.totalStaff}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem', fontWeight: 600 }}>Registered Roster Staff</div>
        </div>

        {/* AVAILABLE CHEFS */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #BBF7D0', padding: '1.1rem 1.25rem', boxShadow: '0 2px 10px rgba(22, 101, 52, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#166534', letterSpacing: '0.04em', textTransform: 'uppercase' }}>AVAILABLE CHEFS</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={18} color="#15803D" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {availabilitySummary.availableChefs}
            <span style={{ fontSize: '0.75rem', backgroundColor: '#22C55E', color: '#FFFFFF', padding: '0.1rem 0.5rem', borderRadius: '9999px', fontWeight: 800 }}>
              ● LIVE ON DUTY
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#15803D', marginTop: '0.2rem', fontWeight: 600 }}>Active Kitchen KDS Staff</div>
        </div>

        {/* AVAILABLE WAITERS */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #BFDBFE', padding: '1.1rem 1.25rem', boxShadow: '0 2px 10px rgba(29, 78, 216, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#1E40AF', letterSpacing: '0.04em', textTransform: 'uppercase' }}>AVAILABLE WAITERS</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={18} color="#1D4ED8" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {availabilitySummary.availableWaiters}
            <span style={{ fontSize: '0.75rem', backgroundColor: '#3B82F6', color: '#FFFFFF', padding: '0.1rem 0.5rem', borderRadius: '9999px', fontWeight: 800 }}>
              ● FLOOR ACTIVE
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#1D4ED8', marginTop: '0.2rem', fontWeight: 600 }}>Serving Dining Guests</div>
        </div>

        {/* OFFLINE STAFF */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.1rem 1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase' }}>OFFLINE STAFF</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} color="#94A3B8" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#475569' }}>
            {availabilitySummary.offlineStaff}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem', fontWeight: 600 }}>Logged Out / Shift Rest</div>
        </div>
      </div>

      {/* ================= MAIN NAVIGATION TABS ================= */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '2px solid #E2E8F0',
        marginBottom: '1.25rem'
      }}>
        <button
          onClick={() => setActiveTabSection('availability')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 800,
            fontSize: '0.9rem',
            border: 'none',
            borderBottom: activeTabSection === 'availability' ? '3px solid #0F2A1D' : '3px solid transparent',
            color: activeTabSection === 'availability' ? '#0F2A1D' : '#64748B',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <UserCheck size={18} />
          <span>Real-Time Staff Availability</span>
        </button>

        <button
          onClick={() => setActiveTabSection('history')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 800,
            fontSize: '0.9rem',
            border: 'none',
            borderBottom: activeTabSection === 'history' ? '3px solid #0F2A1D' : '3px solid transparent',
            color: activeTabSection === 'history' ? '#0F2A1D' : '#64748B',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Calendar size={18} />
          <span>Attendance Session History</span>
        </button>

        <button
          onClick={() => setActiveTabSection('roster')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 800,
            fontSize: '0.9rem',
            border: 'none',
            borderBottom: activeTabSection === 'roster' ? '3px solid #0F2A1D' : '3px solid transparent',
            color: activeTabSection === 'roster' ? '#0F2A1D' : '#64748B',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Users size={18} />
          <span>Staff Roster & Account Shifts</span>
        </button>
      </div>

      {/* ================= TAB 1: REAL-TIME STAFF AVAILABILITY ================= */}
      {activeTabSection === 'availability' && (
        <div>
          {/* Filter Bar */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F2A1D' }}>
              CURRENT STAFF STATUS LOG
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {[
                { id: 'All', label: 'All Staff' },
                { id: 'available', label: '🟢 Available Now' },
                { id: 'offline', label: '⚪ Offline' },
                { id: 'chef', label: '👨‍🍳 Chefs' },
                { id: 'waiter', label: '🤵 Waiters' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setAvailabilityFilter(f.id)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    backgroundColor: availabilityFilter === f.id ? '#0F2A1D' : '#F1F5F9',
                    color: availabilityFilter === f.id ? '#FFFFFF' : '#64748B'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Availability Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {filteredAvailabilityList.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', color: '#64748B' }}>
                <UserCheck size={36} color="#CBD5E1" style={{ display: 'block', margin: '0 auto 0.5rem auto' }} />
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>No staff members match this filter</div>
              </div>
            ) : (
              filteredAvailabilityList.map(st => {
                const isAvailable = st.status === 'available';
                return (
                  <div
                    key={st.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1.5px solid ' + (isAvailable ? '#BBF7D0' : '#E2E8F0'),
                      padding: '1.1rem 1.25rem',
                      boxShadow: isAvailable ? '0 4px 16px rgba(34, 197, 94, 0.06)' : '0 2px 8px rgba(0,0,0,0.02)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F2A1D' }}>{st.name}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', fontFamily: 'monospace' }}>{st.empId || 'RMS-01'}</div>
                      </div>
                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        backgroundColor: isAvailable ? '#DCFCE7' : '#F1F5F9',
                        color: isAvailable ? '#15803D' : '#64748B',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        border: '1px solid ' + (isAvailable ? '#86EFAC' : '#CBD5E1'),
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: isAvailable ? '#22C55E' : '#94A3B8' }} />
                        {isAvailable ? 'Available' : 'Offline'}
                      </span>
                    </div>

                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>Role:</span>
                        <span style={{ fontWeight: 800, color: '#0F2A1D' }}>{st.role}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>Check IN:</span>
                        <span style={{ fontWeight: 800, color: isAvailable ? '#15803D' : '#334155' }}>
                          {st.loginTimeFormatted || '—'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>Check OUT:</span>
                        <span style={{ fontWeight: 800, color: '#475569' }}>
                          {isAvailable ? 'Currently Active' : (st.logoutTimeFormatted || '—')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #E2E8F0', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>Logged Today:</span>
                        <span style={{ fontWeight: 800, color: '#0F2A1D', fontFamily: 'monospace' }}>
                          {st.totalWorkingHoursToday || '0m'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: ATTENDANCE SESSION HISTORY ================= */}
      {activeTabSection === 'history' && (
        <div>
          {/* History Filters */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Date Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', marginBottom: '0.2rem' }}>DATE (IST)</label>
                <input
                  type="date"
                  value={historyFilters.date}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, date: e.target.value }))}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Role Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', marginBottom: '0.2rem' }}>ROLE</label>
                <select
                  value={historyFilters.role}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, role: e.target.value }))}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    outline: 'none',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <option value="All">All Roles</option>
                  <option value="Chef">Chefs</option>
                  <option value="Waiter">Waiters</option>
                  <option value="Receptionist">Receptionists</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', marginBottom: '0.2rem' }}>STATUS</label>
                <select
                  value={historyFilters.status}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, status: e.target.value }))}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    outline: 'none',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="available">Available (Active)</option>
                  <option value="offline">Offline (Completed)</option>
                </select>
              </div>

              {/* Search Staff Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', marginBottom: '0.2rem' }}>SEARCH NAME</label>
                <input
                  type="text"
                  placeholder="Search staff name..."
                  value={historyFilters.search}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, search: e.target.value }))}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              onClick={fetchAttendanceHistory}
              style={{
                backgroundColor: '#0F2A1D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginTop: 'auto'
              }}
            >
              <RefreshCw size={14} />
              <span>Apply Filters</span>
            </button>
          </div>

          {/* Attendance History Table */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#1C130E', color: '#FAF6EE', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>DATE (IST)</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>STAFF MEMBER</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>ROLE</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>LOGIN (IN)</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>LOGOUT (OUT)</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>TOTAL DURATION</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>SESSION STATUS</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingHistory ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      <RefreshCw size={24} className="spin" style={{ display: 'block', margin: '0 auto 0.5rem auto' }} />
                      <span>Loading attendance history...</span>
                    </td>
                  </tr>
                ) : visibleHistoryList.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                      <Calendar size={36} color="#CBD5E1" style={{ display: 'block', margin: '0 auto 0.5rem auto' }} />
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#475569' }}>No attendance sessions recorded for this date/filter</div>
                      <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>Staff IN/OUT logs will appear automatically when staff members check in.</p>
                    </td>
                  </tr>
                ) : (
                  visibleHistoryList.map((item, index) => {
                    const isAvailable = item.status === 'available';
                    const hasMultipleSessions = Array.isArray(item.sessions) && item.sessions.length > 0;
                    return (
                      <tr key={item.id || index} style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FDFBF7', borderBottom: '1px solid #F4EFEA', fontSize: '0.86rem' }}>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#334155', verticalAlign: 'top' }}>
                          {item.displayDate || item.date}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 800, color: '#0F2A1D' }}>{item.staffName}</div>
                          {item.empId && <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>{item.empId}</div>}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'top' }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: 800, backgroundColor: '#F1F5F9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                            {String(item.role || '').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#15803D', verticalAlign: 'top' }}>
                          {hasMultipleSessions ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              {item.sessions.map((s, sIdx) => (
                                <div key={sIdx}>{s.loginTimeFormatted}</div>
                              ))}
                            </div>
                          ) : (
                            item.loginTimeFormatted || '—'
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: isAvailable ? '#2563EB' : '#475569', verticalAlign: 'top' }}>
                          {hasMultipleSessions ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              {item.sessions.map((s, sIdx) => (
                                <div key={sIdx} style={{ color: s.isCurrentlyActive ? '#2563EB' : '#475569' }}>
                                  {s.logoutTimeFormatted}
                                </div>
                              ))}
                            </div>
                          ) : (
                            item.logoutTimeFormatted || '—'
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#0F2A1D', fontFamily: 'monospace', verticalAlign: 'top' }}>
                          {item.durationFormatted}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'top' }}>
                          <span style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            backgroundColor: isAvailable ? '#DCFCE7' : '#F1F5F9',
                            color: isAvailable ? '#15803D' : '#64748B',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            border: '1px solid ' + (isAvailable ? '#86EFAC' : '#CBD5E1')
                          }}>
                            {isAvailable ? '● Available (Active)' : '⚪ Offline (Ended)'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: STAFF ROSTER & SHIFTS ================= */}
      {activeTabSection === 'roster' && (
        <div>
          {/* Controls & Filter Bar */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #F0EAE1',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', minWidth: '260px', flex: 1, maxWidth: '400px' }}>
              <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search staff by name, role, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem 0.55rem 2.2rem',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.82rem',
                  outline: 'none',
                  backgroundColor: '#F8FAFC'
                }}
              />
            </div>

            {/* Role Filter Pills */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {[
                { id: 'All', label: `All (${rosterStaffList.length})` },
                { id: 'Waiters', label: 'Waiters' },
                { id: 'Receptionists', label: 'Receptionists' },
                { id: 'Chefs', label: 'Chefs' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setRoleFilter(st.id)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    backgroundColor: roleFilter === st.id ? '#0F2A1D' : '#F1F5F9',
                    color: roleFilter === st.id ? '#FFFFFF' : '#64748B'
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Staff Roster Table */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #F0EAE1', overflow: 'visible', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#1C130E', color: '#FAF6EE', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1.25rem', borderTopLeftRadius: '16px' }}>STAFF NAME</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>ROLE</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>CONTACT INFO</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>ASSIGNED SHIFT</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'center', borderTopRightRadius: '16px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaffRoster.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                      <Users size={36} color="#CBD5E1" style={{ display: 'block', margin: '0 auto 0.5rem auto' }} />
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#475569' }}>No staff members found</div>
                    </td>
                  </tr>
                ) : (
                  filteredStaffRoster.map((st, index) => (
                    <tr 
                      key={st.id} 
                      style={{ 
                        backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FDFBF7',
                        borderBottom: '1px solid #F4EFEA',
                        fontSize: '0.86rem',
                        position: 'relative'
                      }}
                    >
                      <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 800, color: '#0F2A1D', fontSize: '0.9rem' }}>{st.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, fontFamily: 'monospace' }}>{st.empId || `RMSW-0${st.id}`}</div>
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'middle' }}>
                        <span style={{
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          backgroundColor: '#FFF5ED',
                          color: '#92400E',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          border: '1px solid #FDE68A'
                        }}>
                          {st.role}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'middle' }}>
                        {st.email && <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={12} color="#94A3B8" /> {st.email}</div>}
                        {st.phone && <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}><Phone size={12} color="#94A3B8" /> +91 {st.phone}</div>}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', color: '#334155', fontWeight: 600, verticalAlign: 'middle' }}>
                        {st.shift}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center', verticalAlign: 'middle', position: 'relative' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === st.id ? null : st.id);
                            }}
                            style={{
                              backgroundColor: openMenuId === st.id ? '#0F2A1D' : '#F1F5F9',
                              color: openMenuId === st.id ? '#FFFFFF' : '#475569',
                              border: '1px solid #CBD5E1',
                              borderRadius: '8px',
                              width: '34px',
                              height: '34px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}
                            title="Staff Actions"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openMenuId === st.id && (
                            <div style={{
                              position: 'absolute',
                              right: 0,
                              top: 'calc(100% + 4px)',
                              backgroundColor: '#FFFFFF',
                              borderRadius: '12px',
                              boxShadow: '0 10px 30px rgba(15, 42, 29, 0.18)',
                              border: '1px solid #E2E8F0',
                              minWidth: '180px',
                              zIndex: 9999,
                              overflow: 'hidden',
                              padding: '0.4rem 0',
                              textAlign: 'left'
                            }}>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleOpenEditModal(st);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.6rem 0.9rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.6rem',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  color: '#1E293B',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Edit size={14} color="#2563EB" />
                                <span>Edit Shift Hours</span>
                              </button>

                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setViewingStaff(st);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.6rem 0.9rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.6rem',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  color: '#1E293B',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Eye size={14} color="#059669" />
                                <span>View All Details</span>
                              </button>

                              <div style={{ borderTop: '1px solid #F1F5F9', margin: '0.3rem 0' }} />

                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleDeleteStaff(st.id, st.name);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.6rem 0.9rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.6rem',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  color: '#DC2626',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Trash2 size={14} color="#DC2626" />
                                <span>Remove Staff</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= ADD / EDIT STAFF MODAL ================= */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '1px solid #EAE3D2',
            position: 'relative'
          }}>
            <button
              onClick={() => setIsAddModalOpen(false)}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <X size={20} color="#64748B" />
            </button>

            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: 900, color: '#0F2A1D' }}>
              {editingStaff ? 'Edit Staff Shift & Role' : 'Add New Staff Member'}
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.8rem', color: '#64748B' }}>
              Configure account login details and assigned work shift hours.
            </p>

            <form onSubmit={handleSubmitStaff}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Ramesh Kumar"
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                      STAFF ROLE *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="Waiter">Waiter / Steward</option>
                      <option value="Chef">Chef / Line Cook</option>
                      <option value="Head Chef">Head Chef</option>
                      <option value="Receptionist">Receptionist / Cashier</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                      MOBILE NUMBER (10 Digits)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="9876543210"
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
                    />
                    {phoneWarning && <div style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700, marginTop: '0.25rem' }}>{phoneWarning}</div>}
                  </div>
                </div>

                {!editingStaff && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                      ACCOUNT PASSWORD *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter login password..."
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                      SHIFT START TIME
                    </label>
                    <input
                      type="time"
                      value={formData.shiftStart}
                      onChange={(e) => setFormData(prev => ({ ...prev, shiftStart: e.target.value }))}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                      SHIFT END TIME
                    </label>
                    <input
                      type="time"
                      value={formData.shiftEnd}
                      onChange={(e) => setFormData(prev => ({ ...prev, shiftEnd: e.target.value }))}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ backgroundColor: '#F1F5F9', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '10px', fontSize: '0.86rem', fontWeight: 800, cursor: 'pointer', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#0F2A1D', color: '#FFFFFF', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '10px', fontSize: '0.86rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  {editingStaff ? 'Save Changes' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW STAFF DETAILS MODAL (WITH 1-MONTH ATTENDANCE LOG) ================= */}
      {viewingStaff && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1.25rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '760px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.75rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
            border: '1px solid #EAE3D2',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => setViewingStaff(null)}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', border: 'none', background: 'none', cursor: 'pointer', zIndex: 10 }}
            >
              <X size={22} color="#64748B" />
            </button>

            {/* Header Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                backgroundColor: '#0F2A1D',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                fontWeight: 900
              }}>
                {viewingStaff.name ? viewingStaff.name.slice(0, 2).toUpperCase() : 'ST'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0F2A1D' }}>
                    {viewingStaff.name}
                  </h3>
                  <span style={{ fontWeight: 800, backgroundColor: '#FFF5ED', color: '#92400E', padding: '0.15rem 0.65rem', borderRadius: '6px', border: '1px solid #FDE68A', fontSize: '0.76rem' }}>
                    {viewingStaff.role}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                  {viewingStaff.empId || `RMS-${String(viewingStaff.id).slice(-4)}`} • {viewingStaff.shift || '09:00 AM – 05:00 PM'}
                </div>
              </div>
            </div>

            {/* Profile Info Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem', backgroundColor: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '14px', border: '1px solid #E2E8F0', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Email: </span>
                <span style={{ fontWeight: 800, color: '#334155' }}>{viewingStaff.email || '—'}</span>
              </div>
              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Mobile: </span>
                <span style={{ fontWeight: 800, color: '#334155' }}>{viewingStaff.phone ? `+91 ${viewingStaff.phone}` : '—'}</span>
              </div>
            </div>

            {/* 1-Month Attendance Log Title & Badges */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F2A1D', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={18} color="#0F2A1D" />
                <span>1-Month Attendance Log (Past 30 Days)</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#F1F5F9', color: '#475569', padding: '0.25rem 0.6rem', borderRadius: '8px' }}>
                Total 30 Days Report
              </span>
            </div>

            {/* Scrollable 30-Day Table */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '340px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', fontSize: '0.84rem' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                  <tr style={{ backgroundColor: '#1C130E', color: '#FAF6EE', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>DATE (IST)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>IN → OUT SESSIONS</th>
                    <th style={{ padding: '0.75rem 1rem' }}>LOGGED HOURS</th>
                    <th style={{ padding: '0.75rem 1rem' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingMonthly ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
                        <RefreshCw size={22} className="spin" style={{ display: 'block', margin: '0 auto 0.4rem auto' }} />
                        <span>Fetching 1-month attendance log...</span>
                      </td>
                    </tr>
                  ) : monthlyHistoryList.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                        No attendance records found for this period
                      </td>
                    </tr>
                  ) : (
                    monthlyHistoryList.map((item, idx) => {
                      const isAvailable = item.status === 'available';
                      const hasSessions = Array.isArray(item.sessions) && item.sessions.length > 0;
                      return (
                        <tr key={item.id || idx} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FDFBF7', borderBottom: '1px solid #F4EFEA' }}>
                          <td style={{ padding: '0.7rem 1rem', fontWeight: 700, color: '#334155', verticalAlign: 'top' }}>
                            {item.displayDate || item.date}
                          </td>
                          <td style={{ padding: '0.7rem 1rem', fontWeight: 800, color: '#15803D', verticalAlign: 'top' }}>
                            {hasSessions ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {item.sessions.map((s, sIdx) => (
                                  <div key={sIdx} style={{ fontSize: '0.8rem', color: s.isCurrentlyActive ? '#2563EB' : '#15803D' }}>
                                    {s.loginTimeFormatted} – {s.logoutTimeFormatted}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: '#94A3B8', fontWeight: 600 }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '0.7rem 1rem', fontWeight: 800, color: '#0F2A1D', fontFamily: 'monospace', verticalAlign: 'top' }}>
                            {item.durationFormatted || '0m'}
                          </td>
                          <td style={{ padding: '0.7rem 1rem', verticalAlign: 'top' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              backgroundColor: isAvailable ? '#DCFCE7' : (hasSessions ? '#F1F5F9' : '#F8FAFC'),
                              color: isAvailable ? '#15803D' : (hasSessions ? '#475569' : '#94A3B8'),
                              padding: '0.15rem 0.55rem',
                              borderRadius: '9999px',
                              border: '1px solid ' + (isAvailable ? '#86EFAC' : '#CBD5E1')
                            }}>
                              {isAvailable ? '● Available' : (hasSessions ? '⚪ Offline' : 'Rest / Off')}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer Controls */}
            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  const target = viewingStaff;
                  setViewingStaff(null);
                  handleOpenEditModal(target);
                }}
                style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0.6rem 1.1rem', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 800, cursor: 'pointer', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Edit size={14} color="#2563EB" />
                <span>Edit Shift</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingStaff(null)}
                style={{ backgroundColor: '#0F2A1D', color: '#FFFFFF', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
