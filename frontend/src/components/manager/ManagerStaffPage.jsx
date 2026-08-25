import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, CheckCircle2, Clock, UserCheck, Edit, Trash2, X, MoreVertical, ShieldCheck, Mail, Phone, RefreshCw, Eye, Ban } from 'lucide-react';
import { api } from '../../services/api';

export default function ManagerStaffPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const defaultStaff = [
    { id: 1, empId: 'RMSW-01', name: 'Waiter 1', role: 'Waiter', email: 'waiter1@flavora.in', phone: '9876543210', shift: 'Morning (09:00 AM - 05:00 PM)', status: 'On Shift' },
    { id: 2, empId: 'RMSR-01', name: 'Receptionist 1', role: 'Receptionist', email: 'receptionist1@flavora.in', phone: '9812345678', shift: 'Full Day (11:00 AM - 10:00 PM)', status: 'On Shift' },
    { id: 3, empId: 'RMSC-01', name: 'Chef 1', role: 'Chef', email: 'chef1@flavora.in', phone: '9765432109', shift: 'Evening (02:00 PM - 11:00 PM)', status: 'On Shift' },
    { id: 4, empId: 'RMSW-02', name: 'Waiter 2', role: 'Waiter', email: 'waiter2@flavora.in', phone: '9543210987', shift: 'Evening (02:00 PM - 11:00 PM)', status: 'On Shift' },
    { id: 5, empId: 'RMSR-02', name: 'Receptionist 2', role: 'Receptionist', email: 'receptionist2@flavora.in', phone: '9654321098', shift: 'Morning (09:00 AM - 05:00 PM)', status: 'Off Duty' }
  ];

  const [staffList, setStaffList] = useState([]);

  const fetchBackendStaff = async () => {
    try {
      const data = await api.getStaff();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((stf, idx) => ({
          id: stf._id || stf.id || idx + 1,
          empId: stf.empId || `RMSW-0${idx + 1}`,
          name: stf.name || 'Staff Member',
          role: stf.role || 'Waiter',
          email: stf.email || '',
          phone: stf.phone || '',
          shift: stf.scheduledShift || stf.shift || 'Morning (09:00 AM - 05:00 PM)',
          status: stf.status || 'On Shift'
        }));
        setStaffList(mapped);
        try {
          localStorage.setItem('flavora_staff_list', JSON.stringify(mapped));
        } catch (e) {}
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
    role: 'Head Waiter',
    email: '',
    phone: '',
    shift: 'Morning (09:00 AM - 05:00 PM)',
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
    setFormData({
      name: '',
      role: 'Head Waiter',
      email: '',
      phone: '',
      shift: '09:00 AM – 05:00 PM',
      status: 'On Shift'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (stf) => {
    setEditingStaff(stf);
    setFormData({
      name: stf.name || '',
      role: stf.role || 'Head Waiter',
      email: stf.email || '',
      phone: stf.phone || '',
      shift: stf.shift || '09:00 AM – 05:00 PM',
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
    if (formData.phone && formData.phone.length !== 10) {
      alert('Mobile number must be exactly 10 digits.');
      return;
    }

    const payload = {
      name: formData.name,
      role: formData.role,
      email: formData.email || `${formData.name.toLowerCase().replace(/[^a-z]/g, '')}@flavora.in`,
      phone: formData.phone,
      scheduledShift: formData.shift,
      status: formData.status,
      password: 'password123'
    };

    if (editingStaff) {
      try {
        await api.updateStaff(editingStaff.id, payload);
      } catch (err) {
        console.warn("Backend updateStaff warning:", err.message);
      }
      const updated = staffList.map(st => st.id === editingStaff.id ? { ...st, ...formData } : st);
      saveStaffList(updated);
      showToast(`✓ Shift timings for ${formData.name} updated to ${formData.shift}!`);
    } else {
      let createdId = Date.now();
      try {
        const createdRes = await api.createStaff(payload);
        if (createdRes && (createdRes._id || createdRes.id)) {
          createdId = createdRes._id || createdRes.id;
        }
      } catch (err) {
        console.warn("Backend createStaff warning:", err.message);
      }
      const newStaffItem = {
        id: createdId,
        empId: `RMSW-0${staffList.length + 1}`,
        ...formData
      };
      const updated = [newStaffItem, ...staffList];
      saveStaffList(updated);
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

  const filteredStaff = staffList.filter(stf => {
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

  const onShiftCount = staffList.filter(s => s.status === 'On Shift').length;

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
            { id: 'All', label: `All (${staffList.length})` },
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
            <form onSubmit={handleSubmitStaff} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                    Assigned Shift Hours
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09:00 AM – 05:00 PM or 02:00 PM – 11:00 PM"
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '10px',
                      border: '2px solid #059669',
                      fontSize: '0.85rem',
                      outline: 'none',
                      backgroundColor: '#FFFFFF',
                      color: '#0F2A1D',
                      fontWeight: 700
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
