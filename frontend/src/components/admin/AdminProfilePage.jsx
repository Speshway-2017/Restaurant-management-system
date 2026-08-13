import React, { useState } from 'react';
import { User, Mail, Phone, ShieldCheck, Key, Save, CheckCircle2, Building2, Clock, Camera } from 'lucide-react';

export default function AdminProfilePage() {
  const [profile, setProfile] = useState({
    name: 'Chef Srikanth',
    email: 'admin@restaurant.com',
    phone: '+91 98765 12345',
    role: 'Resto Manager',
    branch: 'Jubilee Hills (Main Branch)',
    empId: 'FLV-EMP-101',
    joinedDate: '15 Jan 2022'
  });

  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirmPass: ''
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleProfileSave = (e) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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

      {saveSuccess && (
        <div className="admin-card mb-3" style={{ background: '#F0FDF4', borderColor: '#BBF7D0', padding: '0.85rem 1.25rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} color="#166534" />
          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Profile details updated successfully!</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="admin-card mb-4" style={{ padding: '1.5rem' }}>
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
              SK
            </div>
            <button title="Change Avatar" style={{
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
      <div className="admin-grid-12" style={{ gap: '1.5rem' }}>
        
        {/* Personal Details */}
        <div className="admin-card col-span-7">
          <div className="admin-card-header mb-4">
            <h2 className="admin-card-title">Personal Information</h2>
          </div>

          <form onSubmit={handleProfileSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label className="form-label">Employee ID</label>
                <input
                  type="text"
                  value={profile.empId}
                  disabled
                  className="form-control"
                  style={{ background: '#FAF6EE', color: '#9A9A9A' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="form-control"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Save Profile Changes</span>
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="admin-card col-span-5">
          <div className="admin-card-header mb-4">
            <h2 className="admin-card-title">Security & Password</h2>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); }}>
            <div className="mb-3">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="form-control"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwords.newPass}
                onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                className="form-control"
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwords.confirmPass}
                onChange={(e) => setPasswords({ ...passwords, confirmPass: e.target.value })}
                className="form-control"
              />
            </div>

            <button type="submit" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
              <Key size={16} />
              <span>Update Password</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
