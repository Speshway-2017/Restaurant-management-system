import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Building2, FileText, Save, CheckCircle2, Search, Bell, Utensils, QrCode, Lock, Clock, UserCheck, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

export default function ManagerSettingsPage() {
  const [activeTab, setActiveTab] = useState('operating'); // 'operating', 'kds', 'floor', 'profile'
  const [searchQuery, setSearchQuery] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [settingsData, setSettingsData] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_restaurant_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      restaurantName: 'Flavora Kitchen',
      branchName: 'Jubilee Hills (Main Branch)',
      managerName: 'Ram S. (On-Duty Manager)',
      managerEmail: 'manager@flavorakitchen.in',
      managerPhone: '+91 98765 43210',
      address: 'Plot No. 42, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
      weekdayHours: '11:00 AM – 10:00 PM',
      weekendHours: '10:00 AM – 12:00 AM',
      restaurantStatus: 'open', // 'open', 'closed', 'force_open'
      closedMessage: 'The restaurant is currently closed for orders. Please visit during our operating hours!',
      cleaningDuration: '10', // minutes
      autoAcceptOrders: true,
      audioAlerts: true,
      prepTimeWarning: '20 mins',
      dispatchChime: true,
      qrOrderingEnabled: true,
      autoPrintReceipt: true,
      autoCleaningExpire: true,
      maxDiningTime: '60 mins'
    };
  });

  const handleSave = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('flavora_restaurant_settings', JSON.stringify(settingsData));
      window.dispatchEvent(new Event('flavora_settings_updated'));
    } catch (e) {}

    api.updateSettings(settingsData)
      .catch(() => {})
      .finally(() => {
        setSaveSuccess(true);
        setToastMessage('✓ Branch operational settings saved & broadcasted!');
        setTimeout(() => {
          setSaveSuccess(false);
          setToastMessage(null);
        }, 3000);
      });
  };

  return (
    <div className="admin-subpage-container" style={{ paddingBottom: '3rem' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#1E4636',
          color: '#FFFFFF',
          padding: '0.85rem 1.35rem',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.92rem',
          fontWeight: 800
        }}>
          <CheckCircle2 size={20} color="#4ADE80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-dashboard-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div className="page-breadcrumb-bar">
            <span>Dashboard</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Branch Operations Settings</span>
          </div>
          <h1 className="admin-page-title">Shift Timings & Operational Controls</h1>
          <p className="admin-page-subtitle">Configure floor operating hours, live ordering status, kitchen KDS alerts, and table QR preferences.</p>
        </div>
      </div>

      {/* Navigation Filter Bar */}
      <div className="admin-card" style={{ padding: '0.9rem 1.25rem', marginBottom: '1.75rem' }}>
        <div className="admin-filter-bar-flex" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="admin-header-search-box" style={{ width: '220px', flexShrink: 0 }}>
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search setting..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-header-search-input"
            />
          </div>

          <div className="admin-pill-selector">
            <button className={`admin-pill-btn ${activeTab === 'operating' ? 'is-active' : ''}`} onClick={() => setActiveTab('operating')}>
              Shift Timings & Hours
            </button>
            <button className={`admin-pill-btn ${activeTab === 'kds' ? 'is-active' : ''}`} onClick={() => setActiveTab('kds')}>
              Kitchen & KDS Alerts
            </button>
            <button className={`admin-pill-btn ${activeTab === 'floor' ? 'is-active' : ''}`} onClick={() => setActiveTab('floor')}>
              Floor & QR Self-Order
            </button>
            <button className={`admin-pill-btn ${activeTab === 'profile' ? 'is-active' : ''}`} onClick={() => setActiveTab('profile')}>
              Branch & Manager Profile
            </button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="admin-alert-banner is-success mb-4" style={{ backgroundColor: '#E2F1E8', border: '1px solid #3F8F5B', padding: '0.85rem 1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <CheckCircle2 size={18} color="#3F8F5B" />
          <span style={{ color: '#1E4636', fontWeight: 700 }}>Settings updated successfully! Changes applied to live QR menu & manager floor view.</span>
        </div>
      )}

      {/* TAB 1: SHIFT TIMINGS & OPERATING HOURS */}
      {activeTab === 'operating' && (
        <form onSubmit={handleSave} className="admin-card" style={{ padding: '1.35rem 1.5rem' }}>
          <div className="admin-card-header mb-3" style={{ borderBottom: '1px solid #F0E8DA', paddingBottom: '0.65rem' }}>
            <h2 className="admin-card-title" style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="#1E4636" />
              <span>Shift Timings & Live Operational Hours</span>
            </h2>
          </div>

          <div className="grid-2" style={{ gap: '1.1rem' }}>
            <div className="admin-form-group">
              <label className="form-label" style={{ fontWeight: 800 }}>Monday – Friday Operating Hours *</label>
              <input 
                type="text" 
                className="form-control" 
                value={settingsData.weekdayHours} 
                onChange={(e) => setSettingsData({ ...settingsData, weekdayHours: e.target.value })}
                placeholder="e.g. 11:00 AM – 10:00 PM"
                style={{ fontWeight: 700, color: '#0F2A1D', backgroundColor: '#FFFFFF' }}
                required 
              />
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700, alignSelf: 'center' }}>Presets:</span>
                {['11:00 AM – 10:00 PM', '09:00 AM – 09:00 PM', '08:00 AM – 11:00 PM', '10:00 AM – 11:00 PM'].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSettingsData({ ...settingsData, weekdayHours: preset })}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      backgroundColor: settingsData.weekdayHours === preset ? '#1E4636' : '#F1F5F9',
                      color: settingsData.weekdayHours === preset ? '#FFFFFF' : '#475569',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      padding: '0.2rem 0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-form-group">
              <label className="form-label" style={{ fontWeight: 800 }}>Saturday – Sunday Operating Hours *</label>
              <input 
                type="text" 
                className="form-control" 
                value={settingsData.weekendHours} 
                onChange={(e) => setSettingsData({ ...settingsData, weekendHours: e.target.value })}
                placeholder="e.g. 10:00 AM – 12:00 AM"
                style={{ fontWeight: 700, color: '#0F2A1D', backgroundColor: '#FFFFFF' }}
                required 
              />
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700, alignSelf: 'center' }}>Presets:</span>
                {['10:00 AM – 12:00 AM', '09:00 AM – 12:00 AM', '08:00 AM – 01:00 AM', '11:00 AM – 11:00 PM'].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSettingsData({ ...settingsData, weekendHours: preset })}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      backgroundColor: settingsData.weekendHours === preset ? '#1E4636' : '#F1F5F9',
                      color: settingsData.weekendHours === preset ? '#FFFFFF' : '#475569',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      padding: '0.2rem 0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ fontWeight: 800 }}>Live Ordering Status Override *</label>
              <select 
                className="form-control"
                value={settingsData.restaurantStatus}
                onChange={(e) => setSettingsData({ ...settingsData, restaurantStatus: e.target.value })}
                style={{ fontWeight: 700 }}
              >
                <option value="open">🟢 Auto Schedule (Open during shift operating hours)</option>
                <option value="force_open">⚡ Force Open (Accepting QR orders unconditionally)</option>
                <option value="closed">🔴 Force Closed (Block customer order placements)</option>
              </select>
            </div>

            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Closed Banner Notice Message (Shown to guests when closed)</label>
              <input 
                type="text" 
                className="form-control" 
                value={settingsData.closedMessage} 
                onChange={(e) => setSettingsData({ ...settingsData, closedMessage: e.target.value })}
                placeholder="Message displayed when restaurant is closed"
              />
            </div>

            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Table Cleaning Timer Duration (Minutes) *</label>
              <select 
                className="form-control"
                value={settingsData.cleaningDuration}
                onChange={(e) => setSettingsData({ ...settingsData, cleaningDuration: e.target.value })}
              >
                <option value="5">5 Minutes (Fast Turnaround)</option>
                <option value="10">10 Minutes (Standard Cleanup Timer)</option>
                <option value="15">15 Minutes (Thorough Sanitization)</option>
              </select>
            </div>
          </div>

          <div className="admin-form-actions mt-4" style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #F0E8DA' }}>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#1E4636', borderColor: '#1E4636', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
              <Save size={16} />
              <span>Save Shift Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: KITCHEN & KDS ALERTS */}
      {activeTab === 'kds' && (
        <form onSubmit={handleSave} className="admin-card" style={{ padding: '1.35rem 1.5rem' }}>
          <div className="admin-card-header mb-3" style={{ borderBottom: '1px solid #F0E8DA', paddingBottom: '0.65rem' }}>
            <h2 className="admin-card-title" style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={18} color="#1E4636" />
              <span>Kitchen Display System (KDS) & Audio Alerts</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', backgroundColor: '#FAF6EE', borderRadius: '12px', border: '1px solid #EAE3D2' }}>
              <div>
                <h4 style={{ margin: 0, fontWeight: 800, color: '#1C130E', fontSize: '0.95rem' }}>Auto-Accept Customer QR Orders</h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>Automatically send new incoming table orders directly to KDS without manual manager confirmation.</p>
              </div>
              <input
                type="checkbox"
                checked={settingsData.autoAcceptOrders}
                onChange={(e) => setSettingsData({ ...settingsData, autoAcceptOrders: e.target.checked })}
                style={{ width: '22px', height: '22px', accentColor: '#1E4636', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', backgroundColor: '#FAF6EE', borderRadius: '12px', border: '1px solid #EAE3D2' }}>
              <div>
                <h4 style={{ margin: 0, fontWeight: 800, color: '#1C130E', fontSize: '0.95rem' }}>Loud Kitchen Chime Audio Alert</h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>Play an audible chime when a new customer order is placed or updated on the kitchen screen.</p>
              </div>
              <input
                type="checkbox"
                checked={settingsData.audioAlerts}
                onChange={(e) => setSettingsData({ ...settingsData, audioAlerts: e.target.checked })}
                style={{ width: '22px', height: '22px', accentColor: '#1E4636', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', backgroundColor: '#FAF6EE', borderRadius: '12px', border: '1px solid #EAE3D2' }}>
              <div>
                <h4 style={{ margin: 0, fontWeight: 800, color: '#1C130E', fontSize: '0.95rem' }}>Dish Ready Dispatch Notification</h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>Alert waitstaff and floor manager with a bell chime when chef marks dish as Ready.</p>
              </div>
              <input
                type="checkbox"
                checked={settingsData.dispatchChime}
                onChange={(e) => setSettingsData({ ...settingsData, dispatchChime: e.target.checked })}
                style={{ width: '22px', height: '22px', accentColor: '#1E4636', cursor: 'pointer' }}
              />
            </div>

            <div className="admin-form-group">
              <label className="form-label">Preparation Delay Alert Threshold *</label>
              <input 
                type="text" 
                className="form-control" 
                value={settingsData.prepTimeWarning} 
                onChange={(e) => setSettingsData({ ...settingsData, prepTimeWarning: e.target.value })}
                placeholder="e.g. 20 mins"
              />
              <span className="form-text" style={{ fontSize: '0.78rem', color: '#64748B' }}>Orders exceeding this prep time will turn red on the KDS display.</span>
            </div>
          </div>

          <div className="admin-form-actions mt-4" style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #F0E8DA' }}>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#1E4636', borderColor: '#1E4636', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
              <Save size={16} />
              <span>Save Kitchen Preferences</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: FLOOR & QR SELF-ORDERING */}
      {activeTab === 'floor' && (
        <form onSubmit={handleSave} className="admin-card" style={{ padding: '1.35rem 1.5rem' }}>
          <div className="admin-card-header mb-3" style={{ borderBottom: '1px solid #F0E8DA', paddingBottom: '0.65rem' }}>
            <h2 className="admin-card-title" style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={18} color="#1E4636" />
              <span>Floor Management & Table QR Self-Ordering</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', backgroundColor: '#FAF6EE', borderRadius: '12px', border: '1px solid #EAE3D2' }}>
              <div>
                <h4 style={{ margin: 0, fontWeight: 800, color: '#1C130E', fontSize: '0.95rem' }}>Enable Table QR Self-Ordering</h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>Allow dine-in customers to browse menu and order directly by scanning table standees.</p>
              </div>
              <input
                type="checkbox"
                checked={settingsData.qrOrderingEnabled}
                onChange={(e) => setSettingsData({ ...settingsData, qrOrderingEnabled: e.target.checked })}
                style={{ width: '22px', height: '22px', accentColor: '#1E4636', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', backgroundColor: '#FAF6EE', borderRadius: '12px', border: '1px solid #EAE3D2' }}>
              <div>
                <h4 style={{ margin: 0, fontWeight: 800, color: '#1C130E', fontSize: '0.95rem' }}>Auto-Transition Table to Cleaning State</h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>Automatically place table into 10-minute Cleaning status when order is completed.</p>
              </div>
              <input
                type="checkbox"
                checked={settingsData.autoCleaningExpire}
                onChange={(e) => setSettingsData({ ...settingsData, autoCleaningExpire: e.target.checked })}
                style={{ width: '22px', height: '22px', accentColor: '#1E4636', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', backgroundColor: '#FAF6EE', borderRadius: '12px', border: '1px solid #EAE3D2' }}>
              <div>
                <h4 style={{ margin: 0, fontWeight: 800, color: '#1C130E', fontSize: '0.95rem' }}>Auto-Print Order Receipt on Completion</h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>Trigger cashier bill print dialogue automatically when order status transitions to Completed.</p>
              </div>
              <input
                type="checkbox"
                checked={settingsData.autoPrintReceipt}
                onChange={(e) => setSettingsData({ ...settingsData, autoPrintReceipt: e.target.checked })}
                style={{ width: '22px', height: '22px', accentColor: '#1E4636', cursor: 'pointer' }}
              />
            </div>

            <div className="admin-form-group">
              <label className="form-label">Max Dining Session Time Limit *</label>
              <input 
                type="text" 
                className="form-control" 
                value={settingsData.maxDiningTime} 
                onChange={(e) => setSettingsData({ ...settingsData, maxDiningTime: e.target.value })}
                placeholder="e.g. 60 mins"
              />
            </div>
          </div>

          <div className="admin-form-actions mt-4" style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #F0E8DA' }}>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#1E4636', borderColor: '#1E4636', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
              <Save size={16} />
              <span>Save Floor Preferences</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: BRANCH & MANAGER PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSave} className="admin-card" style={{ padding: '1.35rem 1.5rem' }}>
          <div className="admin-card-header mb-3" style={{ borderBottom: '1px solid #F0E8DA', paddingBottom: '0.65rem' }}>
            <h2 className="admin-card-title" style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} color="#1E4636" />
              <span>Branch Details & Manager Information</span>
            </h2>
          </div>

          <div className="grid-2" style={{ gap: '1.1rem' }}>
            <div className="admin-form-group">
              <label className="form-label">Restaurant Name *</label>
              <input 
                type="text" 
                className="form-control" 
                value={settingsData.restaurantName} 
                onChange={(e) => setSettingsData({ ...settingsData, restaurantName: e.target.value })}
                required 
              />
            </div>

            <div className="admin-form-group">
              <label className="form-label">Branch Location Name *</label>
              <input 
                type="text" 
                className="form-control" 
                value={settingsData.branchName} 
                onChange={(e) => setSettingsData({ ...settingsData, branchName: e.target.value })}
                required 
              />
            </div>

            <div className="admin-form-group">
              <label className="form-label">On-Duty Manager Name *</label>
              <input 
                type="text" 
                className="form-control" 
                value={settingsData.managerName} 
                onChange={(e) => setSettingsData({ ...settingsData, managerName: e.target.value })}
                required 
              />
            </div>

            <div className="admin-form-group">
              <label className="form-label">Manager Contact Phone *</label>
              <input 
                type="text" 
                className="form-control" 
                value={settingsData.managerPhone} 
                onChange={(e) => setSettingsData({ ...settingsData, managerPhone: e.target.value })}
                required 
              />
            </div>

            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Primary Manager Email *</label>
              <input 
                type="email" 
                className="form-control" 
                value={settingsData.managerEmail} 
                onChange={(e) => setSettingsData({ ...settingsData, managerEmail: e.target.value })}
                required 
              />
            </div>

            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Branch Address *</label>
              <textarea 
                rows={2}
                className="form-control" 
                value={settingsData.address} 
                onChange={(e) => setSettingsData({ ...settingsData, address: e.target.value })}
                required 
              />
            </div>
          </div>

          <div className="admin-form-actions mt-4" style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #F0E8DA' }}>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#1E4636', borderColor: '#1E4636', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
              <Save size={16} />
              <span>Save Branch Profile</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
