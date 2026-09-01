import React, { useState, useEffect, useRef } from 'react';
import {
  User, CheckCircle2, Camera, ShieldCheck, Mail, Phone, Clock,
  Award, Building2, Trash2, Upload, Save, Sparkles, Heart
} from 'lucide-react';
import { api } from '../../services/api';

export default function ReceptionistProfilePage() {
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_profile_receptionist');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      name: 'Reception Desk',
      empId: 'HST-01',
      role: 'Host Desk',
      email: 'reception@flavorakitchen.in',
      phone: '+91 98765 43210',
      shift: '09:00 AM – 06:00 PM (Front Desk)',
      emergencyContact: '+91 91234 56789',
      avatarUrl: ''
    };
  });

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchStaffFromDb = () => {
    const savedAvatar = localStorage.getItem('flavora_receptionist_avatar');
    if (savedAvatar) {
      setProfile(prev => ({ ...prev, avatarUrl: savedAvatar }));
    }

    api.getStaff().then(staffList => {
      if (Array.isArray(staffList) && staffList.length > 0) {
        const recInDb = staffList.find(s => s.role === 'Receptionist' || s.role === 'Host' || (s.empId && (s.empId.startsWith('HST') || s.empId.startsWith('RMSR'))));
        if (recInDb) {
          setProfile(prev => {
            const updated = {
              ...prev,
              id: recInDb._id || recInDb.id,
              name: recInDb.name || prev.name,
              email: recInDb.email || prev.email,
              phone: recInDb.phone || prev.phone,
              empId: recInDb.empId || prev.empId,
              shift: recInDb.scheduledShift || recInDb.shift || prev.shift,
              avatarUrl: savedAvatar || recInDb.avatarUrl || prev.avatarUrl
            };
            localStorage.setItem('flavora_profile_receptionist', JSON.stringify(updated));
            return updated;
          });
        }
      }
    }).catch(() => {});
  };

  useEffect(() => {
    fetchStaffFromDb();

    window.addEventListener('STAFF_SHIFT_UPDATED', fetchStaffFromDb);
    const handleStorage = (e) => {
      if (e.key === 'flavora_staff_shift_event' || e.key === 'flavora_staff_list') {
        fetchStaffFromDb();
      }
    };
    window.addEventListener('storage', handleStorage);

    let channel = null;
    try {
      channel = new BroadcastChannel('flavora_staff_channel');
      channel.onmessage = (e) => {
        if (e.data && e.data.type === 'STAFF_SHIFT_UPDATED') {
          fetchStaffFromDb();
        }
      };
    } catch (e) {}

    return () => {
      window.removeEventListener('STAFF_SHIFT_UPDATED', fetchStaffFromDb);
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.close();
    };
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Please select an image file smaller than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Image = event.target.result;
        const updatedProfile = { ...profile, avatarUrl: base64Image };
        setProfile(updatedProfile);
        try {
          localStorage.setItem('flavora_receptionist_avatar', base64Image);
          localStorage.setItem('flavora_profile_receptionist', JSON.stringify(updatedProfile));
          window.dispatchEvent(new Event('flavora_profile_updated'));
        } catch (err) {}
        showToast('📷 Profile photo uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    const updatedProfile = { ...profile, avatarUrl: '' };
    setProfile(updatedProfile);
    try {
      localStorage.removeItem('flavora_receptionist_avatar');
      localStorage.setItem('flavora_profile_receptionist', JSON.stringify(updatedProfile));
      window.dispatchEvent(new Event('flavora_profile_updated'));
    } catch (err) {}
    showToast('Profile photo removed.');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      localStorage.setItem('flavora_profile_receptionist', JSON.stringify(profile));
      if (profile.avatarUrl) {
        localStorage.setItem('flavora_receptionist_avatar', profile.avatarUrl);
      }
      window.dispatchEvent(new Event('flavora_profile_updated'));

      if (profile.id) {
        await api.updateStaff(profile.id, {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          avatarUrl: profile.avatarUrl
        }).catch(() => {});
      }

      showToast('✓ Profile details saved successfully!');
    } catch (err) {
      showToast('✓ Saved to local station state.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return 'RD';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return nameStr.slice(0, 2).toUpperCase();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px' }}>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          backgroundColor: '#0F2A1D',
          color: '#FFFFFF',
          padding: '0.85rem 1.4rem',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontWeight: 700,
          border: '1px solid #E07A3C',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
        }}>
          <Sparkles size={18} color="#E07A3C" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        padding: '1.25rem 1.6rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
            Receptionist Profile & Photo Management
          </h2>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
            Account Credentials, Shift Duties & Profile Photo Upload
          </span>
        </div>

        <span style={{ fontSize: '0.78rem', fontWeight: 900, padding: '0.4rem 0.9rem', borderRadius: '20px', backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' }}>
          🟢 Active Front Desk Duty
        </span>
      </div>

      {/* Main Grid: Avatar Card + Profile Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
        
        {/* LEFT COLUMN: AVATAR & PHOTO UPLOAD CARD */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '2rem 1.5rem',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
        }}>
          {/* Avatar container with camera badge */}
          <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title="Click to Upload Profile Photo"
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: '#0F2A1D',
                color: '#FFFFFF',
                fontSize: '2.4rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                lineHeight: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                border: '4px solid #FFFFFF',
                boxShadow: '0 10px 25px rgba(15, 42, 29, 0.25)',
                transition: 'transform 0.2s ease'
              }}
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Receptionist Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', lineHeight: 1 }}>
                  {getInitials(profile.name)}
                </span>
              )}
            </div>

            {/* Camera Overlay Badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title="Upload New Photo"
              style={{
                position: 'absolute',
                bottom: '0px',
                right: '0px',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#E07A3C',
                color: '#FFFFFF',
                border: '3px solid #FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                zIndex: 10
              }}
            >
              <Camera size={18} style={{ display: 'block', margin: 'auto' }} />
            </button>
          </div>

          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0F2A1D' }}>{profile.name}</h3>
          <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, marginTop: '0.2rem' }}>
            ID: {profile.empId || 'HST-01'} • Front Desk
          </span>

          <div style={{ width: '100%', height: '1px', backgroundColor: '#F1F5F9', margin: '1.25rem 0' }} />

          {/* Photo Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%' }}>
            {profile.avatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '12px',
                  border: '1px solid #FCA5A5',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <Trash2 size={15} />
                <span>Remove Photo</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: EDIT PROFILE FORM */}
        <form onSubmit={handleSaveProfile} style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '2rem', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D' }}>
            Account Credentials & Duty Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Full Name</label>
              <input type="text" required value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Employee ID</label>
              <input type="text" readOnly value={profile.empId} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '0.85rem', outline: 'none', color: '#64748B' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Email Address</label>
              <input type="email" required value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Phone Number</label>
              <input type="text" required value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>
                Assigned Shift Hours
              </label>
              <input
                type="text"
                readOnly
                value={profile.shift}
                title="Shift hours are managed and assigned by the Restaurant Manager"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  fontSize: '0.85rem',
                  outline: 'none',
                  color: '#64748B',
                  cursor: 'not-allowed',
                  fontWeight: 700
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Emergency Contact Number</label>
              <input type="text" value={profile.emergencyContact} onChange={e => setProfile({ ...profile, emergencyContact: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              backgroundColor: '#0F2A1D',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.8rem 1.6rem',
              borderRadius: '14px',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer',
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}
          >
            <Save size={18} />
            <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </form>

      </div>
    </div>
  );
}
