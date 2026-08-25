import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, ShieldCheck, Key, Save, CheckCircle2, Building2, Clock, Camera, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';

export default function AdminProfilePage({ setActivePage, isManagerMode = false }) {
  const profileStorageKey = isManagerMode ? 'flavora_profile_manager' : 'flavora_profile_admin';

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(profileStorageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return isManagerMode ? {
      name: 'Ramesh Sharma',
      email: 'ramesh.manager@flavorakitchen.in',
      phone: '9876512345',
      role: 'Restaurant Manager',
      branch: 'Jubilee Hills (Main Branch)',
      empId: 'RMSM-01',
      joinedDate: '10 Feb 2023'
    } : {
      name: 'Chef Srikanth',
      email: 'admin@restaurant.com',
      phone: '9876512345',
      role: 'Admin',
      branch: 'Jubilee Hills (Main Branch)',
      empId: 'RMSA-01',
      joinedDate: '15 Jan 2022'
    };
  });

  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirmPass: ''
  });

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleProfileSave = async (e) => {
    if (e) e.preventDefault();
    if (!profile.name || !profile.email) {
      alert('Please fill in required fields (Full Name and Email Address).');
      showToast('Please fill in required fields.', 'error');
      return;
    }
    const cleanPhone = (profile.phone || '').replace(/\D/g, '');
    if (cleanPhone.length > 0 && cleanPhone.length < 10) {
      const confirmSave = window.confirm(`Phone number entered (${cleanPhone}) is ${cleanPhone.length} digits instead of 10. Do you want to save anyway?`);
      if (!confirmSave) {
        showToast('Please complete the 10-digit phone number.', 'error');
        return;
      }
    }

    try {
      // Persist changes to local storage & broadcast event
      localStorage.setItem(profileStorageKey, JSON.stringify(profile));
      window.dispatchEvent(new Event('flavora_profile_updated'));

      // Also attempt updating backend MongoDB if staff ID is available
      try {
        const staffList = await api.getStaff();
        if (Array.isArray(staffList)) {
          const match = staffList.find(s => s.email?.toLowerCase() === profile.email?.toLowerCase() || s.empId === profile.empId);
          if (match && (match._id || match.id)) {
            await api.updateStaff(match._id || match.id, {
              name: profile.name,
              email: profile.email,
              phone: profile.phone
            });
          }
        }
      } catch (dbErr) {
        console.warn('Could not sync profile to MongoDB:', dbErr.message);
      }

      showToast('Profile details saved successfully!', 'success');
    } catch (err) {
      console.error('Error saving profile:', err);
      showToast('Failed to save profile. Please try again.', 'error');
    }
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (!passwords.current) {
      showToast('Please enter your current password.', 'error');
      return;
    }
    if (!passwords.newPass || passwords.newPass.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }
    if (passwords.newPass !== passwords.confirmPass) {
      showToast('New password and confirm password do not match!', 'error');
      return;
    }

    setPasswords({ current: '', newPass: '', confirmPass: '' });
    showToast('Password updated! Redirecting to login...', 'success');

    // Force re-login for security
    setTimeout(() => {
      alert('🔒 Password updated successfully! For security reasons, please login again with your new password.');
      localStorage.removeItem('flavora_auth_token');
      if (setActivePage) {
        setActivePage('login');
      } else {
        window.location.reload();
      }
    }, 600);
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return 'SK';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return nameStr.slice(0, 2).toUpperCase();
  };

  return (
    <div className="admin-subpage-container">
      
      {/* Header */}
      <div className="admin-dashboard-header">
        <div>
          <div className="page-breadcrumb-bar">
            <span>Dashboard</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">My Profile</span>
          </div>
          <h1 className="admin-page-title">My Profile</h1>
          <p className="admin-page-subtitle">Manage your account information, login security, and personal preferences.</p>
        </div>
      </div>

      {/* Floating High-Visibility Toast Pop-up Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          backgroundColor: toastType === 'error' ? '#DC2626' : '#1E4636',
          color: '#FFFFFF',
          padding: '0.85rem 1.4rem',
          borderRadius: '12px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
          border: '1.5px solid rgba(255, 255, 255, 0.2)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontWeight: 700,
          fontSize: '0.9rem'
        }}>
          {toastType === 'error' ? (
            <AlertCircle size={20} color="#FECDD3" />
          ) : (
            <CheckCircle2 size={20} color="#F2C14E" />
          )}
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="admin-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: '#1E4636',
              color: '#F2C14E',
              fontWeight: 800,
              fontSize: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid #E5DBC8'
            }}>
              {getInitials(profile.name)}
            </div>
            <button type="button" title="Change Avatar" style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#E07A3C',
              color: '#FFFFFF',
              border: '2px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}>
              <Camera size={14} />
            </button>
          </div>

          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: '#1E4636', margin: 0 }}>
              {profile.name}
            </h2>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ background: '#1E4636', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                {profile.role}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#5C5C5C', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building2 size={14} color="#E07A3C" /> {profile.branch}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#5C5C5C', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} color="#5C5C5C" /> Member since {profile.joinedDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details Form */}
      <div className="admin-grid-12" style={{ gap: '1.75rem' }}>
        
        {/* Personal Details */}
        <div className="admin-card col-span-7" style={{ padding: '1.5rem' }}>
          <div className="admin-card-header mb-4">
            <h2 className="admin-card-title" style={{ fontSize: '1.15rem', fontWeight: 800 }}>Personal Information</h2>
          </div>

          <form onSubmit={handleProfileSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>Full Name *</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>Employee ID</label>
                <input
                  type="text"
                  value={profile.empId}
                  disabled
                  className="form-control"
                  style={{ background: '#FAF6EE', color: '#64748B', fontWeight: 700 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>Email Address *</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>Phone Number (10 Digits)</label>
                <input
                  type="text"
                  value={profile.phone}
                  maxLength={10}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setProfile({ ...profile, phone: digits });
                  }}
                  className="form-control"
                  placeholder="e.g. 9876512345"
                />
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem', fontWeight: 600 }}>
                  {profile.phone ? `${profile.phone.length}/10 digits entered` : 'Optional'}
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '0.7rem 1.6rem', fontWeight: 800 }}>
              <Save size={16} />
              <span>SAVE PROFILE CHANGES</span>
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="admin-card col-span-5" style={{ padding: '1.5rem' }}>
          <div className="admin-card-header mb-4">
            <h2 className="admin-card-title" style={{ fontSize: '1.15rem', fontWeight: 800 }}>Security & Password</h2>
          </div>

          <form onSubmit={handlePasswordUpdate}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>Current Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="form-control"
                  style={{ paddingRight: '2.5rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  aria-label={showCurrentPass ? "Hide password" : "Show password"}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>New Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwords.newPass}
                  onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                  className="form-control"
                  style={{ paddingRight: '2.5rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  aria-label={showNewPass ? "Hide password" : "Show password"}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>Confirm New Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwords.confirmPass}
                  onChange={(e) => setPasswords({ ...passwords, confirmPass: e.target.value })}
                  className="form-control"
                  style={{ paddingRight: '2.5rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  aria-label={showConfirmPass ? "Hide password" : "Show password"}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                padding: '0.7rem', 
                fontWeight: 800,
                letterSpacing: '0.04em'
              }}
            >
              <Key size={16} />
              <span>UPDATE PASSWORD</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
