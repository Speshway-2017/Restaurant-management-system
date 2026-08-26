import React, { useState, useEffect, useRef } from 'react';
import { User, CheckCircle2, Camera, ShieldCheck, Mail, Phone, Clock, Award, Building2, Trash2, Upload } from 'lucide-react';
import { api } from '../../services/api';

export default function WaiterProfilePage() {
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_waiter_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return {
      name: 'Waiter Venky',
      empId: 'RMSW-01',
      role: 'Waiter',
      email: 'waiter@flavorakitchen.in',
      phone: '+91 98765 88990',
      shift: '09:00 AM – 06:00 PM (Morning Shift)',
      avatarUrl: ''
    };
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // Check local storage avatar first
      const localAvatar = localStorage.getItem('flavora_waiter_avatar');
      if (localAvatar) {
        setProfile(prev => ({ ...prev, avatarUrl: localAvatar }));
      }

      const staffList = await api.getStaff();
      if (staffList && staffList.length > 0) {
        const waiterUser = staffList.find(s => s.role === 'Waiter' || s.email === 'waiter@flavorakitchen.in' || s.empId === 'WSM-01' || s.empId === 'RMSW-01');
        if (waiterUser) {
          setProfile(prev => {
            const updated = {
              ...prev,
              id: waiterUser._id || waiterUser.id,
              name: waiterUser.name || prev.name,
              email: waiterUser.email || prev.email,
              phone: waiterUser.phone || prev.phone,
              empId: waiterUser.empId || prev.empId,
              avatarUrl: localAvatar || waiterUser.avatarUrl || prev.avatarUrl
            };
            localStorage.setItem('flavora_waiter_profile', JSON.stringify(updated));
            return updated;
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Please select an image smaller than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Image = event.target.result;
        const updatedProfile = { ...profile, avatarUrl: base64Image };
        setProfile(updatedProfile);
        try {
          localStorage.setItem('flavora_waiter_avatar', base64Image);
          localStorage.setItem('flavora_waiter_profile', JSON.stringify(updatedProfile));
          window.dispatchEvent(new Event('flavora_waiter_profile_updated'));
        } catch (err) {}
        setSuccessMsg('Profile photo updated successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    const updatedProfile = { ...profile, avatarUrl: '' };
    setProfile(updatedProfile);
    try {
      localStorage.removeItem('flavora_waiter_avatar');
      localStorage.setItem('flavora_waiter_profile', JSON.stringify(updatedProfile));
      window.dispatchEvent(new Event('flavora_waiter_profile_updated'));
    } catch (err) {}
    setSuccessMsg('Profile photo removed.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      localStorage.setItem('flavora_waiter_profile', JSON.stringify(profile));
      if (profile.avatarUrl) {
        localStorage.setItem('flavora_waiter_avatar', profile.avatarUrl);
      }
      if (profile.id) {
        await api.updateStaff(profile.id, {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          avatarUrl: profile.avatarUrl
        }).catch(() => {});
      }
      window.dispatchEvent(new Event('flavora_waiter_profile_updated'));
      setSuccessMsg('Profile details updated successfully!');
    } catch (err) {
      setSuccessMsg('Profile saved to local station state.');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="admin-dashboard-container" style={{ width: '100%', boxSizing: 'border-box', paddingBottom: '3rem' }}>
      
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* ================= 1. PAGE HEADER ================= */}
      <div className="admin-dashboard-header" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="page-breadcrumb-bar">
            <span>Waiter</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">My Profile</span>
          </div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            My Profile
          </h1>
          <p className="admin-page-subtitle" style={{ margin: '0.2rem 0 0 0' }}>
            Account Credentials, Shift Duties & Photo Upload
          </p>
        </div>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #86EFAC', color: '#166534', padding: '0.85rem 1.25rem', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.88rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(22, 101, 52, 0.08)' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ================= 2. PROFILE CARD & EDIT FORM ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* LEFT DISPLAY CARD */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '1.75rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', textAlign: 'center' }}>
          
          {/* Avatar Container with Camera Badge Overlay */}
          <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 1.25rem auto' }}>
            <div 
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title="Click to Upload Profile Photo"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: '#1E4636',
                color: '#FFFFFF',
                fontSize: '2.2rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                cursor: 'pointer',
                border: '3px solid #FFFFFF',
                boxShadow: '0 8px 24px rgba(30, 70, 54, 0.25)',
                transition: 'transform 0.2s ease'
              }}
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Waiter Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile.name ? profile.name.slice(0, 2).toUpperCase() : 'WV'
              )}
            </div>

            {/* Camera Overlay Badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title="Upload New Photo"
              style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#E07A3C',
                color: '#FFFFFF',
                border: '2px solid #FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(224, 122, 60, 0.4)'
              }}
            >
              <Camera size={16} />
            </button>
          </div>

          <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.3rem', fontWeight: 900, color: '#0F2A1D' }}>
            {profile.name}
          </h2>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#E07A3C', backgroundColor: '#FFF3EB', padding: '0.25rem 0.75rem', borderRadius: '20px', display: 'inline-block', marginBottom: '1.25rem' }}>
            {profile.empId} • {profile.role}
          </span>

          {/* Action Photo Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{
                backgroundColor: '#0F2A1D',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Upload size={14} />
              <span>Upload Photo</span>
            </button>

            {profile.avatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                style={{
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FCA5A5',
                  padding: '0.45rem 0.8rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Trash2 size={14} />
                <span>Remove</span>
              </button>
            )}
          </div>

          <div style={{ textAlign: 'left', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={16} color="#0F2A1D" />
              <span>{profile.email}</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={16} color="#0F2A1D" />
              <span>{profile.phone}</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="#0F2A1D" />
              <span>{profile.shift}</span>
            </div>
          </div>
        </div>

        {/* RIGHT EDIT FORM */}
        <form onSubmit={handleSubmit} style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '1.75rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D' }}>
            Edit Staff Profile Details           </h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.4rem' }}>Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
              style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.4rem' }}>Email Address</label>
            <input
              type="email"
              value={profile.email}
              onChange={e => setProfile({ ...profile, email: e.target.value })}
              style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.4rem' }}>Phone Number</label>
            <input
              type="text"
              value={profile.phone}
              onChange={e => setProfile({ ...profile, phone: e.target.value })}
              style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              backgroundColor: '#0F2A1D',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.7rem 1.6rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(15, 42, 29, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <CheckCircle2 size={16} />
            <span>{saving ? 'Saving...' : 'Update Account'}</span>
          </button>
        </form>
      </div>

    </div>
  );
}
