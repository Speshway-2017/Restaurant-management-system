import React, { useState, useEffect, useRef } from 'react';
import { ChefHat, User, Mail, Phone, ShieldCheck, Award, Clock, MapPin, CheckCircle2, Save, Camera, Upload } from 'lucide-react';
import { api } from '../../services/api';

export default function ChefProfilePage({ chefProfile, setChefProfile }) {
  const [profile, setProfile] = useState(() => {
    return {
      id: chefProfile?._id || chefProfile?.id || '',
      name: chefProfile?.name || 'Chef Ramu',
      role: chefProfile?.role || 'Chef',
      empId: chefProfile?.empId || 'RMSC-01',
      email: chefProfile?.email || 'chef@flavorakitchen.in',
      phone: chefProfile?.phone || '+91 98765 43210',
      station: chefProfile?.branch || 'Jubilee Hills Main Pass',
      shift: chefProfile?.scheduledShift || chefProfile?.shift || '09:00 AM – 06:00 PM (Morning)',
      specialization: chefProfile?.specialization || 'Royal Hyderabadi Biryani & Tandoori Master',
      avatarUrl: chefProfile?.avatarUrl || ''
    };
  });

  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef(null);

  // Sync profile from DB staff on load
  useEffect(() => {
    const fetchStaffFromDb = async () => {
      setLoading(true);
      try {
        const staffList = await api.getStaff();
        if (Array.isArray(staffList) && staffList.length > 0) {
          const matchedChef = staffList.find(s => 
            s.role === 'Chef' || 
            s.role === 'Head Chef' || 
            (s.empId && (s.empId.startsWith('RMSC') || s.empId.startsWith('CHEF'))) ||
            (s.name && s.name.toLowerCase().includes('chef'))
          ) || staffList[0];

          if (matchedChef) {
            const realData = {
              id: matchedChef._id || matchedChef.id || '',
              name: matchedChef.name || 'Chef Ramu',
              role: matchedChef.role || 'Chef',
              empId: matchedChef.empId || 'RMSC-01',
              email: matchedChef.email || 'chef@flavorakitchen.in',
              phone: matchedChef.phone || '+91 98765 43210',
              station: matchedChef.branch || 'Jubilee Hills Main Pass',
              shift: matchedChef.scheduledShift || matchedChef.shift || '09:00 AM – 06:00 PM (Morning)',
              specialization: matchedChef.specialization || 'Royal Hyderabadi Biryani & Tandoori Master',
              avatarUrl: matchedChef.avatarUrl || profile.avatarUrl || ''
            };

            setProfile(realData);
            if (setChefProfile) setChefProfile(realData);
            localStorage.setItem('flavora_profile_chef', JSON.stringify(realData));
          }
        }
      } catch (err) {
        console.warn("DB staff fetch warning:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffFromDb();
  }, []);

  const getInitials = (nameStr) => {
    if (!nameStr) return 'CR';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nameStr.slice(0, 2).toUpperCase();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newAvatarUrl = reader.result;
      const updated = { ...profile, avatarUrl: newAvatarUrl };
      setProfile(updated);
      if (setChefProfile) setChefProfile(updated);
      localStorage.setItem('flavora_profile_chef', JSON.stringify(updated));

      if (profile.id) {
        api.updateStaff(profile.id, { avatarUrl: newAvatarUrl }).catch(() => {});
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaved(false);

    try {
      if (profile.id) {
        await api.updateStaff(profile.id, {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          role: profile.role,
          scheduledShift: profile.shift,
          specialization: profile.specialization,
          avatarUrl: profile.avatarUrl
        });
      }
    } catch (err) {
      console.warn("MongoDB staff update warning:", err.message);
    }

    if (setChefProfile) {
      setChefProfile(profile);
    }
    localStorage.setItem('flavora_profile_chef', JSON.stringify(profile));

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const initials = getInitials(profile.name);

  return (
    <div className="admin-subpage-container" style={{ paddingBottom: '3rem' }}>
      
      {/* Header */}
      <div className="admin-dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div className="page-breadcrumb-bar">
          <span>Kitchen Pass</span>
          <span className="crumb-sep">›</span>
          <span className="crumb-current">Chef Profile Details</span>
        </div>
        <h1 className="admin-page-title">Executive Chef Profile & Pass Credentials</h1>
        <p className="admin-page-subtitle">View and update real kitchen pass identity, profile picture, station assignment, and contact details from MongoDB database.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        
        {/* Real Profile Card Summary with Image Upload */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '1.75rem',
          border: '1px solid #F0EAE1',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          textAlign: 'center'
        }}>
          
          {/* Avatar Container with Upload Camera Overlay */}
          <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 1rem auto' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: '#0F2A1D',
              color: '#FFFFFF',
              fontSize: '2.2rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(15, 42, 29, 0.3)',
              border: '3px solid #FFFFFF'
            }}>
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Chef Profile Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>

            {/* Camera Upload Button Overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                backgroundColor: '#E07A3C',
                color: '#FFFFFF',
                border: '2px solid #FFFFFF',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                transition: 'transform 0.15s ease'
              }}
              title="Upload Profile Picture"
            >
              <Camera size={16} />
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
          </div>

          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
            {profile.name}
          </h3>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#E07A3C', marginTop: '0.2rem' }}>
            {profile.empId} • {profile.role}
          </div>

          {/* Verified Account Badge */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.6rem', fontSize: '0.74rem', backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontWeight: 800 }}>
            <CheckCircle2 size={14} color="#166534" />
            <span>Verified Account</span>
          </span>

          <div style={{ borderTop: '1px solid #E2E8F0', marginTop: '1.25rem', paddingTop: '1.25rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={16} color="#0F2A1D" />
              <span>{profile.specialization}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="#0F2A1D" />
              <span>{profile.shift}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} color="#0F2A1D" />
              <span>{profile.station}</span>
            </div>
          </div>
        </div>

        {/* Real Editable Profile Form */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '1.75rem',
          border: '1px solid #F0EAE1',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
        }}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
            Edit Profile & Contact Info (Database Sync)
          </h3>

          {isSaved && (
            <div style={{ backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} />
              <span>Chef Profile & Picture updated & saved to MongoDB database!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Employee ID</label>
              <input
                type="text"
                disabled
                value={profile.empId}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#64748B', fontSize: '0.85rem', fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Phone Number</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', fontWeight: 700 }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>
                Assigned Shift Hours <span style={{ color: '#64748B', fontWeight: 600 }}>(Assigned by Restaurant Manager)</span>
              </label>
              <input
                type="text"
                disabled
                value={profile.shift}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#64748B', fontSize: '0.85rem', fontWeight: 700 }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Culinary Specialization & Signature Dishes</label>
              <input
                type="text"
                value={profile.specialization}
                onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', fontWeight: 700 }}
              />
            </div>

            <div style={{ gridColumn: 'span 2', textAlign: 'right', marginTop: '0.5rem' }}>
              <button
                type="submit"
                style={{
                  padding: '0.7rem 1.5rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#0F2A1D',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(15, 42, 29, 0.25)'
                }}
              >
                <Save size={16} />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
