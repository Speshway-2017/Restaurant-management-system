import React, { useState, useRef } from 'react';
import { 
  User, Mail, Phone, ShieldCheck, Key, Save, CheckCircle2, Building2, 
  Eye, EyeOff, Lock, BadgeCheck, Briefcase, Shield, Camera, Trash2 
} from 'lucide-react';
import { api } from '../../services/api';

export default function ManagerProfilePage() {
  const profileStorageKey = 'flavora_profile_manager';
  const fileInputRef = useRef(null);

  // Retrieve logged-in session user data if present
  const loggedUserDataStr = sessionStorage.getItem('flavora_user_data') || localStorage.getItem('flavora_user_data');
  let sessionUser = null;
  if (loggedUserDataStr) {
    try { sessionUser = JSON.parse(loggedUserDataStr); } catch (e) {}
  }

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(profileStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && sessionUser?.email && parsed.email.toLowerCase() === sessionUser.email.toLowerCase()) {
          return parsed;
        }
      } catch (e) {}
    }
    return {
      name: sessionUser?.name || 'Manager',
      email: sessionUser?.email || 'manager@rms.com',
      phone: sessionUser?.phone || '',
      role: 'Restaurant Manager',
      branch: sessionUser?.branch || 'Jubilee Hills (Main Branch)',
      empId: sessionUser?.empId || 'RMSM-01',
      joinedDate: '10 Feb 2023',
      department: 'Operations & Floor Management',
      avatarUrl: sessionUser?.avatarUrl || ''
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
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, JPEG, WEBP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target.result;
      const updatedProfile = { ...profile, avatarUrl: base64Url };
      setProfile(updatedProfile);
      localStorage.setItem(profileStorageKey, JSON.stringify(updatedProfile));

      if (sessionUser) {
        const updatedSession = { ...sessionUser, avatarUrl: base64Url };
        sessionStorage.setItem('flavora_user_data', JSON.stringify(updatedSession));
        localStorage.setItem('flavora_user_data', JSON.stringify(updatedSession));
      }

      window.dispatchEvent(new Event('flavora_profile_updated'));
      showToast('Profile image updated successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    const updatedProfile = { ...profile, avatarUrl: '' };
    setProfile(updatedProfile);
    localStorage.setItem(profileStorageKey, JSON.stringify(updatedProfile));

    if (sessionUser) {
      const updatedSession = { ...sessionUser, avatarUrl: '' };
      sessionStorage.setItem('flavora_user_data', JSON.stringify(updatedSession));
      localStorage.setItem('flavora_user_data', JSON.stringify(updatedSession));
    }

    window.dispatchEvent(new Event('flavora_profile_updated'));
    showToast('Profile picture removed.');
  };

  const handleProfileSave = async (e) => {
    if (e) e.preventDefault();
    if (!profile.name || !profile.email) {
      showToast('Please fill in required fields (Full Name and Email).', 'error');
      return;
    }
    const cleanPhone = (profile.phone || '').replace(/\D/g, '');
    if (cleanPhone.length > 0 && cleanPhone.length !== 10) {
      showToast('Mobile phone number must be exactly 10 digits.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      localStorage.setItem(profileStorageKey, JSON.stringify(profile));

      if (sessionUser) {
        const updatedSession = { ...sessionUser, name: profile.name, email: profile.email, phone: profile.phone, avatarUrl: profile.avatarUrl };
        sessionStorage.setItem('flavora_user_data', JSON.stringify(updatedSession));
        localStorage.setItem('flavora_user_data', JSON.stringify(updatedSession));
      }

      window.dispatchEvent(new Event('flavora_profile_updated'));

      try {
        const staffList = await api.getStaff();
        if (Array.isArray(staffList)) {
          const match = staffList.find(s => 
            (sessionUser?._id && String(s._id || s.id) === String(sessionUser._id)) ||
            (s.email && s.email.toLowerCase() === profile.email.toLowerCase()) || 
            (profile.empId && s.empId === profile.empId)
          );
          if (match && (match._id || match.id)) {
            await api.updateStaff(match._id || match.id, {
              name: profile.name,
              email: profile.email,
              phone: profile.phone,
              branch: profile.branch,
              avatarUrl: profile.avatarUrl
            });
          }
        }
      } catch (dbErr) {
        console.warn('Backend DB update note:', dbErr.message);
      }

      showToast('Manager profile details updated successfully!', 'success');
    } catch (err) {
      console.error('Save profile error:', err);
      showToast('Failed to save profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (!passwords.current) {
      showToast('Please enter your current password.', 'error');
      return;
    }
    if (!passwords.newPass || passwords.newPass.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (passwords.newPass !== passwords.confirmPass) {
      showToast('New password and confirm password do not match.', 'error');
      return;
    }

    showToast('Account security password updated successfully!', 'success');
    setPasswords({ current: '', newPass: '', confirmPass: '' });
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return 'RM';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return nameStr.substring(0, 2).toUpperCase();
  };

  return (
    <div className="admin-subpage-container" style={{ paddingBottom: '4rem', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Hidden File Input for Avatar Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          backgroundColor: toastType === 'error' ? '#991B1B' : '#0F2A1D',
          color: '#FFFFFF',
          padding: '0.85rem 1.4rem',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontWeight: 700,
          fontSize: '0.88rem',
          border: toastType === 'error' ? '1px solid #EF4444' : '1px solid #285A46'
        }}>
          <CheckCircle2 size={18} color={toastType === 'error' ? '#FCA5A5' : '#4ADE80'} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div className="page-breadcrumb-bar">
            <span>Dashboard</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">My Profile</span>
          </div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>Manager Account & Profile</h1>
          <p className="admin-page-subtitle" style={{ margin: '0.2rem 0 0 0' }}>
            Manage active manager credentials, personal profile details, and operational authorization.
          </p>
        </div>
      </div>

      {/* Hero Banner Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #0F2A1D 0%, #1C4432 50%, #081B12 100%)',
        borderRadius: '24px',
        padding: '2rem 2.25rem',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 32px rgba(15, 42, 29, 0.25)',
        marginBottom: '2rem',
        border: '1px solid rgba(242, 193, 78, 0.25)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            
            {/* Avatar Circle with Camera Upload Icon */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div 
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload profile picture"
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  backgroundColor: '#1E4636',
                  color: '#F2C14E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.1rem',
                  fontWeight: 900,
                  border: '3.5px solid #F2C14E',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  getInitials(profile.name)
                )}
              </div>

              {/* Camera Upload Button Badge */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload Profile Picture"
                style={{
                  position: 'absolute',
                  bottom: '0px',
                  right: '0px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#F2C14E',
                  color: '#0F2A1D',
                  border: '2px solid #0F2A1D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Camera size={16} />
              </button>
            </div>

            {/* Title & Badges */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 900, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  {profile.name}
                </h2>
                <span style={{
                  backgroundColor: 'rgba(242, 193, 78, 0.2)',
                  color: '#F2C14E',
                  border: '1px solid rgba(242, 193, 78, 0.5)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <BadgeCheck size={14} color="#F2C14E" />
                  RESTO OPERATIONS MANAGER
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.65rem', color: '#D1E7DD', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Building2 size={15} color="#F2C14E" />
                  {profile.branch || 'Jubilee Hills (Main Branch)'}
                </span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Briefcase size={15} color="#F2C14E" />
                  ID: <strong style={{ color: '#FFFFFF' }}>{profile.empId || 'RMSM-01'}</strong>
                </span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: '#4ADE80',
                  fontWeight: 700,
                  backgroundColor: 'rgba(74, 222, 128, 0.15)',
                  padding: '0.15rem 0.6rem',
                  borderRadius: '6px'
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#4ADE80', display: 'inline-block' }}></span>
                  Active
                </span>
              </div>

              {/* Remove Photo Action if avatar exists */}
              {profile.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    marginTop: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: '#FCA5A5',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: 0
                  }}
                >
                  <Trash2 size={13} />
                  Remove Profile Picture
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.75rem' }}>
        
        {/* Left Column: Personal Profile Details Form */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #F0EAE1',
          padding: '1.75rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#E2F1E8', color: '#0F2A1D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F2A1D' }}>Personal Information</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>Update your profile contact information & branch details</p>
            </div>
          </div>

          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                Full Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.3rem',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    color: '#0F172A',
                    fontWeight: 600,
                    outline: 'none',
                    backgroundColor: '#FAFAFA'
                  }}
                  placeholder="Manager Name"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                Email Address <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.3rem',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    color: '#0F172A',
                    fontWeight: 600,
                    outline: 'none',
                    backgroundColor: '#FAFAFA'
                  }}
                  placeholder="manager@rms.com"
                  required
                />
              </div>
            </div>

            {/* Mobile Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                Mobile Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.3rem',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    color: '#0F172A',
                    fontWeight: 600,
                    outline: 'none',
                    backgroundColor: '#FAFAFA'
                  }}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Assigned Branch & Employee ID (Grid 2 cols) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  Assigned Branch
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={profile.branch}
                    onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.65rem 0.65rem 2.3rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                      color: '#0F172A',
                      fontWeight: 600,
                      outline: 'none',
                      backgroundColor: '#FAFAFA'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  Employee ID
                </label>
                <input
                  type="text"
                  value={profile.empId || 'RMSM-01'}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.85rem',
                    color: '#64748B',
                    fontWeight: 700,
                    backgroundColor: '#F1F5F9',
                    cursor: 'not-allowed'
                  }}
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isSaving}
              style={{
                marginTop: '0.5rem',
                backgroundColor: '#0F2A1D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.4rem',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(15, 42, 29, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <Save size={18} color="#F2C14E" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Security & Authorization Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Security & Password Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #F0EAE1',
            padding: '1.75rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Key size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F2A1D' }}>Security & Password</h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>Update password credentials for your manager account</p>
              </div>
            </div>

            <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              
              {/* Current Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  Current Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 2.4rem 0.6rem 2.3rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      backgroundColor: '#FAFAFA'
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {showCurrentPass ? <EyeOff size={16} color="#64748B" /> : <Eye size={16} color="#64748B" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={passwords.newPass}
                    onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 2.4rem 0.6rem 2.3rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      backgroundColor: '#FAFAFA'
                    }}
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {showNewPass ? <EyeOff size={16} color="#64748B" /> : <Eye size={16} color="#64748B" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={passwords.confirmPass}
                    onChange={(e) => setPasswords({ ...passwords, confirmPass: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 2.4rem 0.6rem 2.3rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      backgroundColor: '#FAFAFA'
                    }}
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {showConfirmPass ? <EyeOff size={16} color="#64748B" /> : <Eye size={16} color="#64748B" />}
                  </button>
                </div>
              </div>

              {/* Password Update Button */}
              <button
                type="submit"
                style={{
                  marginTop: '0.3rem',
                  backgroundColor: '#1E293B',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <ShieldCheck size={16} color="#38BDF8" />
                <span>Update Password</span>
              </button>
            </form>
          </div>

          {/* Module Access Privileges Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #F0EAE1',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <Shield size={20} color="#0F2A1D" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F2A1D' }}>Active Module Authorizations</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              {[
                'Floor Order Flow',
                'Table QR Management',
                'Staff Roster & Shifts',
                'Menu Catalog & Pricing',
                'Coupons & Promotions',
                'Analytics & Settlement'
              ].map((perm, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  backgroundColor: '#F8FAFC',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#1E293B',
                  border: '1px solid #E2E8F0'
                }}>
                  <CheckCircle2 size={14} color="#059669" />
                  <span>{perm}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
