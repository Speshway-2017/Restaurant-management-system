import React, { useState, useEffect } from 'react';
import { Users, Plus, ShieldCheck, Clock, CheckCircle2, Search, Trash2, X, UserCheck, Shield, Eye, EyeOff, MoreVertical, Ban, Utensils, ClipboardList, ChefHat } from 'lucide-react';
import { api } from '../../services/api';

export default function AdminStaffPage({ subTab = 'staff-accounts' }) {
  const isManagerMode = subTab === 'staff-shifts';
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'waiter', 'receptionist', 'chef', 'shifts'
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveActionMenuId(null);
      setMenuPosition(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const defaultAdminStaff = [];
  const defaultManagerStaff = [];

  const [staffMembers, setStaffMembers] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    documentUrl: '',
    branch: 'Jubilee Hills (Main Branch)',
    role: isManagerMode ? 'Waiter' : 'Manager'
  });

  const fetchStaff = () => {
    Promise.all([
      api.getStaff().catch(() => []),
      api.getOrders().catch(() => [])
    ]).then(([data, fetchedOrders]) => {
      if (data && data.length > 0) {
        const roleCounters = {};
        setStaffMembers(data.map((stf) => {
          const role = stf.role || (isManagerMode ? 'Waiter' : 'Manager');
          let prefix = 'RMSM';
          if (role.toLowerCase().includes('waiter')) prefix = 'RMSW';
          else if (role.toLowerCase().includes('receptionist')) prefix = 'RMSR';
          else if (role.toLowerCase().includes('chef')) prefix = 'RMSC';
          else if (role.toLowerCase().includes('admin')) prefix = 'RMSA';

          roleCounters[prefix] = (roleCounters[prefix] || 0) + 1;
          const numStr = String(roleCounters[prefix]).padStart(2, '0');
          const formattedId = (stf.empId && stf.empId.startsWith(prefix)) ? stf.empId : `${prefix}-${numStr}`;

          // Calculate exact orders handled dynamically from MongoDB orders collection
          const sId = String(stf._id || stf.id || '').toLowerCase();
          const eId = String(formattedId).toLowerCase();
          const sEmail = String(stf.email || '').toLowerCase();
          const sName = String(stf.name || '').toLowerCase();
          const isManagerRole = role.toLowerCase().includes('manager') || role.toLowerCase().includes('admin');

          let realOrdersHandled = 0;
          if (Array.isArray(fetchedOrders) && fetchedOrders.length > 0) {
            const explicitMatches = fetchedOrders.filter(ord => {
              const oWaiterId = String(ord.waiterId || ord.staffId || ord.createdBy || ord.userId || ord.managerId || '').toLowerCase();
              const oWaiterName = String(ord.waiterName || ord.waiter || ord.takenBy || ord.serverName || ord.server || ord.managerName || '').toLowerCase();
              const oEmail = String(ord.email || ord.waiterEmail || ord.managerEmail || '').toLowerCase();

              if (sId && oWaiterId === sId) return true;
              if (eId && oWaiterId === eId) return true;
              if (sEmail && oEmail && oEmail === sEmail) return true;
              if (sName && oWaiterName && (oWaiterName.includes(sName) || sName.includes(oWaiterName))) return true;
              return false;
            }).length;

            if (explicitMatches > 0) {
              realOrdersHandled = explicitMatches;
            } else if (isManagerRole) {
              // For Managers overseeing floor operations, count all live branch floor orders
              realOrdersHandled = fetchedOrders.length;
            }
          }

          return {
            id: formattedId,
            dbId: stf._id || stf.id,
            name: stf.name,
            email: stf.email || '',
            role: role,
            phone: stf.phone || '+91 98000 00000',
            documentUrl: stf.documentUrl || '',
            status: stf.status || 'Active',
            ordersHandled: (stf.ordersHandled && Number(stf.ordersHandled) > 0) ? Number(stf.ordersHandled) : realOrdersHandled,
            rating: '4.9 ★',
            checkInTime: stf.checkInTime || '09:45 AM',
            checkOutTime: stf.checkOutTime || '07:15 PM',
            scheduledShift: stf.scheduledShift || '10:00 AM - 07:00 PM',
            hoursLogged: stf.hoursLogged || '9h 30m',
            attendanceStatus: stf.attendanceStatus || 'On Time'
          };
        }));
      }
    }).catch((err) => {
      console.log('Error fetching staff list:', err.message);
    });
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      documentUrl: '',
      branch: 'Jubilee Hills (Main Branch)',
      role: isManagerMode ? 'Waiter' : 'Manager'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (stf) => {
    setEditingStaff(stf);
    setFormData({
      name: stf.name || '',
      email: stf.email || '',
      password: '',
      phone: stf.phone || '',
      documentUrl: stf.documentUrl || '',
      branch: stf.branch || 'Jubilee Hills (Main Branch)',
      role: stf.role || (isManagerMode ? 'Waiter' : 'Manager')
    });
    setIsAddModalOpen(true);
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert('Please fill in required fields (Name, Email).');
      return;
    }

    if (formData.phone && formData.phone.length !== 10) {
      alert('Mobile Phone number must be exactly 10 digits.');
      return;
    }

    if (editingStaff) {
      const updatePayload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        documentUrl: formData.documentUrl,
        role: formData.role
      };
      if (formData.password) {
        updatePayload.password = formData.password;
      }

      try {
        if (editingStaff.dbId) {
          await api.updateStaff(editingStaff.dbId, updatePayload);
        }
        showToast(`Staff member "${formData.name}" updated successfully!`);
        fetchStaff();
      } catch (err) {
        console.warn('Update staff error:', err.message);
        setStaffMembers(staffMembers.map(s => s.id === editingStaff.id ? { ...s, ...updatePayload } : s));
        showToast(`Staff member "${formData.name}" updated locally!`);
      }
    } else {
      if (!formData.password) {
        alert('Please enter account password for new staff member.');
        return;
      }
      const role = formData.role || 'Waiter';
      let prefix = 'RMSW';
      if (role === 'Receptionist') prefix = 'RMSR';
      else if (role === 'Chef') prefix = 'RMSC';
      else if (role === 'Manager') prefix = 'RMSM';

      const roleCount = staffMembers.filter(s => s.role === role).length;
      const formattedEmpId = `${prefix}-${String(roleCount + 1).padStart(2, '0')}`;

      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || '+91 98000 00000',
        documentUrl: formData.documentUrl || '',
        branch: formData.branch,
        role: role,
        empId: formattedEmpId
      };

      try {
        await api.createStaff(payload);
        showToast(`New ${role} "${formData.name}" (${formattedEmpId}) saved to Database!`);
        await fetchStaff();
        setIsAddModalOpen(false);
        setEditingStaff(null);
        setFormData({
          name: '',
          email: '',
          password: '',
          phone: '',
          documentUrl: '',
          branch: 'Jubilee Hills (Main Branch)',
          role: isManagerMode ? 'Waiter' : 'Manager'
        });
      } catch (err) {
        console.error('API create staff error:', err.message);
        alert(`Failed to save staff member to Database: ${err.message}`);
        return;
      }
    }
  };

  const handleToggleSuspendStaff = async (stfItem) => {
    const isCurrentlySuspended = stfItem.status === 'Suspended' || stfItem.status === 'Inactive';
    const newStatus = isCurrentlySuspended ? 'Active' : 'Suspended';
    const displayId = typeof stfItem === 'object' ? stfItem.id : stfItem;
    const targetId = typeof stfItem === 'object' ? (stfItem.dbId || stfItem.id) : stfItem;

    setStaffMembers(staffMembers.map(s => (s.id === displayId || s.dbId === targetId) ? { ...s, status: newStatus } : s));
    showToast(`Staff (${displayId}) account ${isCurrentlySuspended ? 'reactivated' : 'suspended'}!`);

    if (targetId) {
      try {
        await api.updateStaff(targetId, { status: newStatus });
      } catch (err) {
        console.warn('Update staff status API error:', err.message);
      }
    }
  };

  const handleDeleteStaff = async (stfItem) => {
    const displayId = typeof stfItem === 'object' ? stfItem.id : stfItem;
    const targetId = typeof stfItem === 'object' ? (stfItem.dbId || stfItem.id) : stfItem;

    if (window.confirm(`Are you sure you want to delete staff account (${displayId})?`)) {
      setStaffMembers(staffMembers.filter(s => s.id !== displayId && s.dbId !== targetId));
      showToast(`Staff member (${displayId}) deleted.`);

      if (targetId) {
        try {
          await api.deleteStaff(targetId);
        } catch (err) {
          console.warn('Delete staff API error:', err.message);
        }
      }
    }
  };

  const visibleStaff = staffMembers.filter(stf => {
    const roleNorm = (stf.role || '').toLowerCase().trim();
    const isManagerRole = roleNorm.includes('manager') && !roleNorm.includes('admin');
    const isOperationalRole = ['waiter', 'receptionist', 'chef', 'head chef'].includes(roleNorm);

    if (!isManagerMode) {
      return isManagerRole;
    }
    return isOperationalRole;
  });

  const filteredStaff = visibleStaff.filter(stf => {
    const matchesSearch = stf.name.toLowerCase().includes(search.toLowerCase()) || 
                          stf.role.toLowerCase().includes(search.toLowerCase()) ||
                          (stf.email && stf.email.toLowerCase().includes(search.toLowerCase()));
    
    if (activeTab === 'shifts') return matchesSearch;
    if (activeTab === 'waiter') return matchesSearch && stf.role.toLowerCase() === 'waiter';
    if (activeTab === 'receptionist') return matchesSearch && stf.role.toLowerCase() === 'receptionist';
    if (activeTab === 'chef') return matchesSearch && stf.role.toLowerCase() === 'chef';
    return matchesSearch;
  });

  const getRoleBadge = (role) => {
    if (role === 'Waiter') {
      return (
        <span style={{ backgroundColor: '#E3F2FD', color: '#1565C0', padding: '0.25rem 0.65rem', borderRadius: '6px', fontWeight: '800', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <Utensils size={13} /> Waiter
        </span>
      );
    }
    if (role === 'Receptionist') {
      return (
        <span style={{ backgroundColor: '#F3E5F5', color: '#7B1FA2', padding: '0.25rem 0.65rem', borderRadius: '6px', fontWeight: '800', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <ClipboardList size={13} /> Receptionist
        </span>
      );
    }
    if (role === 'Chef') {
      return (
        <span style={{ backgroundColor: '#FFF3E0', color: '#E65100', padding: '0.25rem 0.65rem', borderRadius: '6px', fontWeight: '800', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <ChefHat size={13} /> Chef
        </span>
      );
    }
    return (
      <span style={{ backgroundColor: '#E2F1E8', color: '#1E4636', padding: '0.25rem 0.65rem', borderRadius: '6px', fontWeight: '800', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
        👑 {role}
      </span>
    );
  };

  return (
    <div className="admin-subpage-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#1E4636',
          color: '#FFFFFF',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          fontSize: '0.88rem'
        }}>
          <CheckCircle2 size={18} color="#F2C14E" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-dashboard-header">
        <div>
          <div className="page-breadcrumb-bar">
            <span>Dashboard</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Staff Management</span>
          </div>
          <h1 className="admin-page-title">Staff Management</h1>
          <p className="admin-page-subtitle">
            {isManagerMode 
              ? 'Add & manage branch staff members (Waiters, Receptionists, Chefs), shift schedules, and operational logs.'
              : 'Add & manage branch Managers, access permissions, and operational shifts.'}
          </p>
        </div>
        
        {/* ADD STAFF MEMBER BUTTON */}
        <button 
          className="btn btn-primary"
          onClick={handleOpenAddModal}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#1E4636' }}
        >
          <Plus size={16} />
          <span>{isManagerMode ? 'Add Staff Member' : 'Add Manager'}</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="admin-card mb-3" style={{ padding: '0.65rem 1.25rem' }}>
        <div className="admin-filter-bar-flex">
          <div className="admin-header-search-box" style={{ width: '280px', flexShrink: 0 }}>
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              placeholder={isManagerMode ? "Search staff name or role..." : "Search manager name or email..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-header-search-input"
            />
          </div>

          <div className="admin-pill-selector" style={{ gap: '0.4rem' }}>
            <button
              className={`admin-pill-btn ${activeTab === 'all' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              {isManagerMode ? `All Staff (${visibleStaff.length})` : `All Managers (${visibleStaff.length})`}
            </button>

            {isManagerMode && (
              <>
                <button
                  className={`admin-pill-btn ${activeTab === 'waiter' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('waiter')}
                >
                  Waiters ({visibleStaff.filter(s => s.role === 'Waiter').length})
                </button>
                <button
                  className={`admin-pill-btn ${activeTab === 'receptionist' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('receptionist')}
                >
                  Receptionists ({visibleStaff.filter(s => s.role === 'Receptionist').length})
                </button>
                <button
                  className={`admin-pill-btn ${activeTab === 'chef' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('chef')}
                >
                  Chefs ({visibleStaff.filter(s => s.role === 'Chef').length})
                </button>
              </>
            )}

            <button
              className={`admin-pill-btn ${activeTab === 'shifts' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('shifts')}
            >
              Shift Logs
            </button>
          </div>
        </div>
      </div>

      {/* Staff Accounts Table */}
      {activeTab !== 'shifts' ? (
        <div className="admin-card">
          <div className="admin-table-wrapper" style={{ overflowX: 'auto', paddingBottom: activeActionMenuId ? '80px' : '0.5rem' }}>
            <table className="admin-data-table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Staff Name</th>
                  <th>Email & Contact</th>
                  <th>Assigned Role</th>
                  <th>Orders Handled</th>
                  <th>Performance</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                      <Users size={36} color="#CBD5E1" style={{ marginBottom: '0.5rem' }} />
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>No staff members found</div>
                      <div style={{ fontSize: '0.8rem' }}>Try clearing your search or add a new staff member.</div>
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((stf) => (
                    <tr key={stf.id}>
                      <td className="font-mono text-sm" style={{ fontWeight: 700, color: '#1E4636' }}>{stf.id}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0F2A1D' }}>{stf.name}</div>
                      </td>
                      <td>
                        <div>{stf.email || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{stf.phone}</div>
                      </td>
                      <td>
                        {getRoleBadge(stf.role)}
                      </td>
                      <td style={{ fontWeight: 700 }}>{stf.ordersHandled} Orders</td>
                      <td style={{ color: '#FF8A00', fontWeight: 700 }}>{stf.rating}</td>
                      <td>
                        <span className={`status-badge-unified ${(stf.status === 'Suspended' || stf.status === 'Inactive') ? 'is-cancelled' : 'is-ready'}`}>
                          {stf.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeActionMenuId === stf.id) {
                              setActiveActionMenuId(null);
                              setMenuPosition(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuPosition({
                                top: rect.bottom + 4,
                                right: window.innerWidth - rect.right,
                                staff: stf
                              });
                              setActiveActionMenuId(stf.id);
                            }
                          }}
                          style={{
                            background: activeActionMenuId === stf.id ? '#F0E8DA' : 'none',
                            border: 'none',
                            padding: '0.45rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#1E4636'
                          }}
                          title="Actions Menu"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Shift Logs Table */
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Staff Today's Shift Logs</h2>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Role</th>
                  <th>Check-In Time</th>
                  <th>Logout / Check-Out Time</th>
                  <th>Scheduled Shift</th>
                  <th>Hours Logged</th>
                  <th>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((stf) => (
                  <tr key={stf.id}>
                    <td className="font-semibold">{stf.name}</td>
                    <td>
                      {getRoleBadge(stf.role)}
                    </td>
                    <td style={{ color: '#1E4636', fontWeight: '700' }}>{stf.checkInTime || '10:00 AM'}</td>
                    <td style={{ color: '#E07A3C', fontWeight: '700' }}>{stf.checkOutTime || '07:00 PM'}</td>
                    <td>{stf.scheduledShift || '10:00 AM - 07:00 PM'}</td>
                    <td style={{ fontWeight: '700' }}>{stf.hoursLogged || '9h 00m'}</td>
                    <td>
                      <span className={`status-badge-unified ${stf.attendanceStatus === 'Completed' ? 'is-served' : 'is-ready'}`}>
                        {stf.attendanceStatus || 'On Time'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Fixed Action Popup Overlay */}
      {activeActionMenuId && menuPosition && menuPosition.staff && (
        <div style={{
          position: 'fixed',
          top: `${menuPosition.top}px`,
          right: `${menuPosition.right}px`,
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
          border: '1px solid #E5DBC8',
          zIndex: 999999,
          minWidth: '140px',
          overflow: 'hidden',
          padding: '0.35rem 0',
          animation: 'fadeIn 0.15s ease-in-out'
        }}>
          {/* Suspend / Reactivate Option */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const target = menuPosition.staff;
              setActiveActionMenuId(null);
              setMenuPosition(null);
              if (target) handleToggleSuspendStaff(target);
            }}
            style={{
              width: '100%',
              padding: '0.55rem 0.95rem',
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: (menuPosition.staff?.status === 'Suspended' || menuPosition.staff?.status === 'Inactive') ? '#27AE60' : '#D35400',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Ban size={14} color={(menuPosition.staff?.status === 'Suspended' || menuPosition.staff?.status === 'Inactive') ? '#27AE60' : '#D35400'} />
            <span>{(menuPosition.staff?.status === 'Suspended' || menuPosition.staff?.status === 'Inactive') ? 'Reactivate' : 'Suspend'}</span>
          </button>

          {/* Delete Option */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const target = menuPosition.staff;
              setActiveActionMenuId(null);
              setMenuPosition(null);
              if (target) handleDeleteStaff(target);
            }}
            style={{
              width: '100%',
              padding: '0.55rem 0.95rem',
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#C0392B',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Trash2 size={14} color="#C0392B" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* ================= ADD / EDIT STAFF MODAL DIALOG ================= */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '540px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#0B1B14',
              color: '#FFFFFF',
              padding: '1.1rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShieldCheck size={22} color="#FF8A00" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                    {editingStaff 
                      ? `Edit ${formData.role} Details` 
                      : (isManagerMode ? 'Add New Staff Member' : 'Add New Restaurant Manager')}
                  </h3>
                  <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.76rem', color: '#E2E8F0' }}>
                    {isManagerMode 
                      ? 'Register Waiter, Receptionist, or Chef for your branch operations' 
                      : 'Create a Manager account with management portal access'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateStaff} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto' }} autoComplete="off">
              
              {/* STAFF ROLE SELECTION (WAITER, RECEPTIONIST, CHEF) */}
              <div className="admin-form-group mb-3">
                <label className="form-label" style={{ fontWeight: 700 }}>Select Staff Role *</label>
                <div style={{ display: 'grid', gridTemplateColumns: isManagerMode ? 'repeat(3, 1fr)' : '1fr', gap: '0.6rem' }}>
                  {isManagerMode ? [
                    { id: 'Waiter', label: '🍽️ Waiter', desc: 'Table Service & Orders' },
                    { id: 'Receptionist', label: '📋 Receptionist', desc: 'Host & Reservations' },
                    { id: 'Chef', label: '👨‍🍳 Chef', desc: 'Kitchen & KDS Prep' }
                  ].map(r => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setFormData({ ...formData, role: r.id })}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: '10px',
                        border: '2px solid',
                        borderColor: formData.role === r.id ? '#1E4636' : '#E2E8F0',
                        backgroundColor: formData.role === r.id ? '#1E4636' : '#FFFFFF',
                        color: formData.role === r.id ? '#FFFFFF' : '#0F2A1D',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: formData.role === r.id ? '0 4px 12px rgba(30, 70, 54, 0.25)' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{r.label}</div>
                      <div style={{ fontSize: '0.68rem', opacity: 0.85, marginTop: '2px' }}>{r.desc}</div>
                    </button>
                  )) : (
                    <div style={{ backgroundColor: '#E2F1E8', padding: '0.75rem 1rem', borderRadius: '8px', color: '#1E4636', fontWeight: '800' }}>
                      👑 Restaurant Manager (L2 Admin Access)
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-form-group mb-3">
                <label className="form-label" style={{ fontWeight: 700 }}>Staff Member Full Name *</label>
                <input
                  type="text"
                  name="new_staff_full_name"
                  className="form-control"
                  placeholder="e.g. Raju Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoComplete="off"
                  required
                />
              </div>

              <div className="admin-form-group mb-3">
                <label className="form-label" style={{ fontWeight: 700 }}>Staff Login Email *</label>
                <input
                  type="email"
                  name="new_staff_login_email"
                  className="form-control"
                  placeholder="staff@flavorakitchen.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mb-3">
                <div className="admin-form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Account Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="new_staff_password"
                      className="form-control"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      style={{ paddingRight: '2.5rem' }}
                      autoComplete="new-password"
                      required={!editingStaff}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.2rem'
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Mobile Phone (10 Digits)</label>
                  <input
                    type="text"
                    name="new_staff_phone"
                    className="form-control"
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({ ...formData, phone: cleanVal });
                    }}
                    autoComplete="off"
                  />
                  <span style={{ fontSize: '0.75rem', color: formData.phone.length === 10 ? '#2E7D32' : '#718096', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                    {formData.phone.length}/10 digits entered {formData.phone.length === 10 && '✓'}
                  </span>
                </div>
              </div>

              {/* Cloudinary Document / ID Upload Field */}
              <div className="admin-form-group mb-4">
                <label className="form-label" style={{ fontWeight: 700 }}>📄 Staff ID Proof / Document (Cloudinary)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        if (event.target?.result) {
                          showToast('Uploading document to Cloudinary...');
                          try {
                            const res = await api.uploadImage(event.target.result, 'staff_documents');
                            if (res && res.url) {
                              setFormData(prev => ({ ...prev, documentUrl: res.url }));
                              showToast('Document uploaded to Cloudinary!');
                            }
                          } catch (err) {
                            console.warn('Cloudinary document upload failed:', err.message);
                          }
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="form-control"
                  style={{ padding: '0.4rem 0.75rem' }}
                />
                {formData.documentUrl && (
                  <div style={{ fontSize: '0.78rem', color: '#1E4636', marginTop: '0.35rem', fontWeight: 700 }}>
                    ☁️ Cloudinary URL: <a href={formData.documentUrl} target="_blank" rel="noreferrer" style={{ color: '#FF8A00', textDecoration: 'underline' }}>View Uploaded Document</a>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn"
                  style={{ backgroundColor: '#F1F5F9', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#1E4636', color: '#FFFFFF', padding: '0.65rem 1.4rem' }}
                >
                  {editingStaff ? 'Save Changes' : (isManagerMode ? `Add ${formData.role}` : 'Add Manager')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
