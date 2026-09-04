import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, CheckCircle2, Clock, UserCheck, Edit, Trash2, X, MoreVertical, ShieldCheck, Mail, Phone, RefreshCw, Eye, EyeOff, Ban } from 'lucide-react';
import { api } from '../../services/api';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [showStaffPassword, setShowStaffPassword] = useState(false);

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

  useEffect(() => {
    fetchBackendStaff();
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
      localStorage.setItem('flavora_staff_list', JSON.stringify(newList));
    } catch (e) {}
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setShowStaffPassword(false);
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
    const parsedTimes = parseShiftTo24(stf.shift || '09:00 AM – 05:00 PM');
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
    // Only validate phone when creating a new staff member and phone is entered
    if (!editingStaff && formData.phone) {
      const digitsOnly = String(formData.phone).replace(/[^0-9]/g, '');
      if (digitsOnly.length > 0 && digitsOnly.length < 10) {
        alert('Mobile number must be at least 10 digits.');
        return;
      }
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

    const broadcastShiftChange = (updatedMember) => {
      try {
        const channel = new BroadcastChannel('flavora_staff_channel');
        channel.postMessage({ type: 'STAFF_SHIFT_UPDATED', staff: updatedMember });
        channel.close();
      } catch (e) {}

      window.dispatchEvent(new CustomEvent('STAFF_SHIFT_UPDATED', { detail: updatedMember }));
      localStorage.setItem('flavora_staff_shift_event', JSON.stringify({ timestamp: Date.now(), staff: updatedMember }));
    };

    if (editingStaff) {
      let backendUpdatedMember = null;
      try {
        const res = await api.updateStaff(editingStaff.id, payload);
        if (res) backendUpdatedMember = res;
      } catch (err) {
        console.warn("Backend updateStaff warning:", err.message);
      }
      const updatedItem = {
        ...editingStaff,
        ...formData,
        shift: computedShift,
        scheduledShift: computedShift
      };
      const updated = staffList.map(st => st.id === editingStaff.id ? updatedItem : st);
      saveStaffList(updated);
      broadcastShiftChange(backendUpdatedMember || updatedItem);
      showToast('Staff shift updated successfully.');
    } else {
      let createdItem = null;
      try {
        const createdRes = await api.createStaff(payload);
        if (createdRes) createdItem = createdRes;
      } catch (err) {
        console.warn("Backend createStaff warning:", err.message);
      }
      const newStaffItem = {
        id: createdItem ? (createdItem._id || createdItem.id) : Date.now(),
        empId: createdItem ? createdItem.empId : `RMSW-0${staffList.length + 1}`,
        ...formData,
        shift: computedShift
      };
      const updated = [newStaffItem, ...staffList];
      saveStaffList(updated);
      broadcastShiftChange(newStaffItem);
      showToast(`✓ New staff member ${formData.name} saved to MongoDB!`);
    }
    setIsAddModalOpen(false);
    fetchBackendStaff();
  };

  const handleDeleteStaff = async (stfId, stfName) => {
    if (window.confirm(`Are you sure you want to remove ${stfName} from staff roster?`)) {
      try {
        await api.deleteStaff(stfId);
      } catch (err) {
        console.warn("Backend deleteStaff warning:", err.message);
      }
      const updated = staffList.filter(st => st.id !== stfId);
      saveStaffList(updated);
      showToast(`Staff member ${stfName} removed from MongoDB.`);
      setOpenMenuId(null);
      fetchBackendStaff();
    }
  };

  const handleToggleStatus = async (stfId) => {
    const target = staffList.find(st => st.id === stfId);
    if (!target) return;
    const nextStatus = target.status === 'On Shift' ? 'Off Duty' : 'On Shift';
    try {
      await api.updateStaff(stfId, { status: nextStatus });
    } catch (err) {
      console.warn("Backend updateStaff status warning:", err.message);
    }
    const updated = staffList.map(st => st.id === stfId ? { ...st, status: nextStatus } : st);
    saveStaffList(updated);
    showToast(`${target.name} status updated to ${nextStatus} in MongoDB!`);
    setOpenMenuId(null);
    fetchBackendStaff();
  };

  const handleToggleBlockStaff = async (stfId, stfName) => {
    const target = staffList.find(st => st.id === stfId);
    if (!target) return;
    const isCurrentlyBlocked = target.status === 'Blocked' || target.isBlocked;
    const nextStatus = isCurrentlyBlocked ? 'Off Duty' : 'Blocked';
    try {
      await api.updateStaff(stfId, { status: nextStatus, isBlocked: !isCurrentlyBlocked });
    } catch (err) {
      console.warn("Backend updateStaff block status warning:", err.message);
    }
    const updated = staffList.map(st => st.id === stfId ? { ...st, status: nextStatus, isBlocked: !isCurrentlyBlocked } : st);
    saveStaffList(updated);
    showToast(isCurrentlyBlocked ? `🟢 ${stfName} has been unblocked!` : `🚫 ${stfName} has been blocked!`);
    setOpenMenuId(null);
    fetchBackendStaff();
  };

  const nonManagerStaff = staffList.filter(stf => {
    const r = String(stf.role || '').toLowerCase();
    return !r.includes('manager') && !r.includes('admin');
  });

  const filteredStaff = nonManagerStaff.filter(stf => {
    const matchesSearch = !searchQuery || 
      (stf.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stf.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stf.phone || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'All' || 
      (roleFilter === 'On Shift' && stf.status === 'On Shift') ||
      (roleFilter === 'Waiters' && (stf.role.toLowerCase().includes('waiter') || stf.role.toLowerCase().includes('steward'))) ||
      (roleFilter === 'Receptionists' && (stf.role.toLowerCase().includes('receptionist') || stf.role.toLowerCase().includes('cashier'))) ||
      (roleFilter === 'Chefs' && stf.role.toLowerCase().includes('chef'));

    return matchesSearch && matchesRole;
  });

  const onShiftCount = nonManagerStaff.filter(s => s.status === 'On Shift').length;

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

      {/* ================= PAGE HEADER & ADD STAFF BUTTON ================= */}
      <div className="admin-dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div className="page-breadcrumb-bar">
            <span>Dashboard</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Floor Staff & Shifts</span>
          </div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>Shift Attendance & Floor Roster</h1>
          <p className="admin-page-subtitle" style={{ margin: '0.2rem 0 0 0' }}>Track waiter shifts, kitchen station duties, and active floor staff attendance.</p>
        </div>

        {/* Action Button: + Add Staff */}
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
            boxShadow: '0 4px 14px rgba(15, 42, 29, 0.2)',
            transition: 'all 0.2s ease'
          }}
        >
          <Plus size={18} color="#F2C14E" />
          <span>Add New Staff</span>
        </button>
      </div>

      {/* ================= CONTROLS & FILTER BAR ================= */}
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
            { id: 'All', label: `All (${nonManagerStaff.length})` },
            { id: 'On Shift', label: `On Shift (${onShiftCount})` },
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
                color: roleFilter === st.id ? '#FFFFFF' : '#64748B',
                transition: 'all 0.15s ease'
              }}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= STAFF ROSTER TABLE ================= */}
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
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                  <Users size={36} color="#CBD5E1" style={{ display: 'block', margin: '0 auto 0.5rem auto' }} />
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#475569' }}>No staff members found</div>
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>Try adjusting your search query or role filter.</p>
                </td>
              </tr>
            ) : (
              filteredStaff.map((st, index) => (
                <tr 
                  key={st.id} 
                  style={{ 
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FDFBF7',
                    borderBottom: '1px solid #F4EFEA',
                    fontSize: '0.86rem',
                    position: 'relative',
                    zIndex: openMenuId === st.id ? 50 : 1
                  }}
                >
                  {/* Name & Emp ID */}
                  <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 800, color: '#0F2A1D', fontSize: '0.9rem' }}>{st.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, fontFamily: 'monospace' }}>{st.empId || `RMSW-0${st.id}`}</div>
                  </td>

                  {/* Role Badge */}
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

                  {/* Contact Info */}
                  <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'middle' }}>
                    {st.email && <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={12} color="#94A3B8" /> {st.email}</div>}
                    {st.phone && <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}><Phone size={12} color="#94A3B8" /> +91 {st.phone}</div>}
                  </td>

                  {/* Assigned Shift */}
                  <td style={{ padding: '0.85rem 1.25rem', color: '#334155', fontWeight: 600, verticalAlign: 'middle' }}>
                    {st.shift}
                  </td>

                  {/* Actions Dropdown Menu */}
                  <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center', verticalAlign: 'middle', position: 'relative' }}>
                    <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(openMenuId === st.id ? null : st.id)}
                        style={{
                          backgroundColor: '#F8F6F0',
                          border: '1px solid #EAE3D2',
                          borderRadius: '8px',
                          width: '34px',
                          height: '34px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <MoreVertical size={16} color="#1C130E" />
                      </button>

                      {openMenuId === st.id && (
                        <>
                          <div style={{ position: 'fixed', inset: 0, zIndex: 9998, cursor: 'default' }} onClick={() => setOpenMenuId(null)} />
                          <div style={{
                            position: 'absolute',
                            right: '50%',
                            transform: 'translateX(50%)',
                            top: '40px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '12px',
                            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
                            border: '1px solid #EAE3D2',
                            padding: '0.4rem',
                            zIndex: 9999,
                            minWidth: '160px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem'
                          }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(st)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                border: 'none',
                                background: 'transparent',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: '#1E4636',
                                cursor: 'pointer'
                              }}
                            >
                              <Clock size={14} color="#1E4636" />
                              <span>Edit Shift Timings</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleBlockStaff(st.id, st.name)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                border: 'none',
                                background: 'transparent',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: (st.status === 'Blocked' || st.isBlocked) ? '#166534' : '#DC2626',
                                cursor: 'pointer'
                              }}
                            >
                              <Ban size={14} color={(st.status === 'Blocked' || st.isBlocked) ? '#166534' : '#DC2626'} />
                              <span>{(st.status === 'Blocked' || st.isBlocked) ? 'Unblock Staff' : 'Block Staff'}</span>
                            </button>

                            <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '0.2rem 0' }} />

                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(st.id, st.name)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                border: 'none',
                                background: 'transparent',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: '#DC2626',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={14} color="#DC2626" />
                              <span>Remove Staff</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= ADD / EDIT STAFF MODAL ================= */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 24, 19, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
            border: '1px solid #EAE3D2',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#0F2A1D',
              padding: '1.25rem 1.5rem',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                  {editingStaff ? 'Edit Staff Shift Timings & Details' : 'Add New Staff Member'}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.76rem', color: '#A3C2B3' }}>
                  {editingStaff ? 'Update employee assigned shift hours & operational duties' : 'Add a new waiter, chef, or floor staff member'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#FFFFFF', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmitStaff} autoComplete="off" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>
                  Full Name <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingStaff)}
                  placeholder="e.g. Suresh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    backgroundColor: editingStaff ? '#F1F5F9' : '#F8FAFC',
                    cursor: editingStaff ? 'not-allowed' : 'text'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>
                    Role / Position
                  </label>
                  <select
                    disabled={Boolean(editingStaff)}
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      backgroundColor: editingStaff ? '#F1F5F9' : '#FFFFFF',
                      cursor: editingStaff ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="Waiter">Waiter</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Chef">Chef</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>
                    Mobile Number (10 Digits)
                  </label>
                  <input
                    type="text"
                    disabled={Boolean(editingStaff)}
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                    autoComplete="off"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      backgroundColor: editingStaff ? '#F1F5F9' : '#F8FAFC',
                      cursor: editingStaff ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  disabled={Boolean(editingStaff)}
                  placeholder="e.g. name@flavora.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    backgroundColor: editingStaff ? '#F1F5F9' : '#F8FAFC',
                    cursor: editingStaff ? 'not-allowed' : 'text'
                  }}
                />
              </div>

              {!editingStaff && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>
                    Account Login Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showStaffPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter login password for new staff member"
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      autoComplete="new-password"
                      style={{
                        width: '100%',
                        padding: '0.6rem 2.5rem 0.6rem 0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.85rem',
                        outline: 'none',
                        backgroundColor: '#F8FAFC',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.2rem'
                      }}
                    >
                      {showStaffPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Dedicated Full-Width Assigned Shift Hours Section */}
              <div style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F2A1D', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={16} color="#059669" />
                    <span>Assigned Shift Hours</span>
                  </label>
                  <span style={{ fontSize: '0.74rem', color: '#166534', backgroundColor: '#DCFCE7', padding: '0.15rem 0.55rem', borderRadius: '6px', fontWeight: 800, border: '1px solid #86EFAC' }}>
                    🕒 {format24to12(formData.shiftStart || '09:00')} – {format24to12(formData.shiftEnd || '17:00')}
                  </span>
                </div>

                {/* Clock Time Pickers (Start & End Time) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Start Time</span>
                    <input
                      type="time"
                      required
                      value={formData.shiftStart || '09:00'}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        const formattedShift = `${format24to12(newStart)} – ${format24to12(formData.shiftEnd || '17:00')}`;
                        setFormData({ ...formData, shiftStart: newStart, shift: formattedShift });
                      }}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        border: '1.5px solid #059669',
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        color: '#0F2A1D',
                        outline: 'none',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>End Time</span>
                    <input
                      type="time"
                      required
                      value={formData.shiftEnd || '17:00'}
                      onChange={(e) => {
                        const newEnd = e.target.value;
                        const formattedShift = `${format24to12(formData.shiftStart || '09:00')} – ${format24to12(newEnd)}`;
                        setFormData({ ...formData, shiftEnd: newEnd, shift: formattedShift });
                      }}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        border: '1.5px solid #059669',
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        color: '#0F2A1D',
                        outline: 'none',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Quick Shift Presets */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, marginRight: '0.2rem' }}>Quick Presets:</span>
                  {[
                    { label: 'Morning (9am - 5pm)', start: '09:00', end: '17:00' },
                    { label: 'Full Day (11am - 10pm)', start: '11:00', end: '22:00' },
                    { label: 'Evening (2pm - 10pm)', start: '14:00', end: '22:00' }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          shiftStart: preset.start,
                          shiftEnd: preset.end,
                          shift: `${format24to12(preset.start)} – ${format24to12(preset.end)}`
                        });
                      }}
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.22rem 0.55rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: formData.shiftStart === preset.start && formData.shiftEnd === preset.end ? '#1E4636' : '#FFFFFF',
                        color: formData.shiftStart === preset.start && formData.shiftEnd === preset.end ? '#FFFFFF' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.4rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#0F2A1D',
                    color: '#FFFFFF',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(15, 42, 29, 0.2)'
                  }}
                >
                  {editingStaff ? 'Save Shift Changes' : 'Add Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
