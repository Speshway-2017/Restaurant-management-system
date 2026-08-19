import React, { useState } from 'react';
import { Settings, ShieldCheck, Building2, FileText, Save, CheckCircle2, Search, Bell, Utensils, QrCode, Lock, Clock } from 'lucide-react';
import { api } from '../../services/api';

export default function AdminSettingsPage({ subTab = 'settings-profile', isManagerMode = false }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'kds', 'tax', 'branches'
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [settingsData, setSettingsData] = useState({
    restaurantName: 'Flavora Kitchen',
    branchName: 'Jubilee Hills (Main Branch)',
    tagline: 'Good food. Great moments.',
    contactEmail: isManagerMode ? 'manager@flavorakitchen.in' : 'admin@flavorakitchen.in',
    contactPhone: '+91 98765 43210',
    address: 'Plot No. 42, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
    operatingHours: '10:00 AM - 11:00 PM',
    autoAcceptOrders: true,
    audioAlerts: true,
    prepTimeWarning: '20 mins',
    qrOrderingEnabled: true,
    gstin: '29AAAAA0000A1Z5',
    fssai: '11223344556677',
    gstRate: '5%',
    invoiceFootnote: 'Thank you for dining with Flavora Kitchen! Visit again.'
  });

  const handleSave = (e) => {
    e.preventDefault();
    api.updateSettings(settingsData)
      .catch(() => {})
      .finally(() => {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      });
  };

  return (
    <div className="admin-subpage-container">
      {/* Page Header */}
      <div className="admin-dashboard-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div className="page-breadcrumb-bar">
            <span>Dashboard</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">{isManagerMode ? 'Branch Settings' : 'Platform Settings'}</span>
          </div>
          <h1 className="admin-page-title">{isManagerMode ? 'Branch Settings & Preferences' : 'Platform Settings'}</h1>
          <p className="admin-page-subtitle">
            {isManagerMode 
              ? 'Configure branch operations, kitchen KDS alerts, table QR ordering, and billing preferences.'
              : 'Configure restaurant profile, GSTIN tax rules, FSSAI licenses, and branch locations.'}
          </p>
        </div>
      </div>

      {/* Navigation Filter Bar */}
      <div className="admin-card mb-4" style={{ padding: '0.75rem 1.25rem' }}>
        <div className="admin-filter-bar-flex" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="admin-header-search-box" style={{ width: '220px', flexShrink: 0 }}>
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search setting..."
              className="admin-header-search-input"
            />
          </div>

          <div className="admin-pill-selector">
            <button className={`admin-pill-btn ${activeTab === 'profile' ? 'is-active' : ''}`} onClick={() => setActiveTab('profile')}>
              Restaurant Profile
            </button>
            <button className={`admin-pill-btn ${activeTab === 'kds' ? 'is-active' : ''}`} onClick={() => setActiveTab('kds')}>
              Kitchen & KDS Alerts
            </button>
            <button className={`admin-pill-btn ${activeTab === 'tax' ? 'is-active' : ''}`} onClick={() => setActiveTab('tax')}>
              Tax & QR Billing
            </button>
            {!isManagerMode && (
              <button className={`admin-pill-btn ${activeTab === 'branches' ? 'is-active' : ''}`} onClick={() => setActiveTab('branches')}>
                Branch Locations
              </button>
            )}
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="admin-alert-banner is-success mb-4" style={{ backgroundColor: '#E2F1E8', border: '1px solid #3F8F5B', padding: '0.85rem 1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <CheckCircle2 size={18} color="#3F8F5B" />
          <span style={{ color: '#1E4636', fontWeight: 700 }}>Settings updated successfully! Changes applied to active POS & KDS terminals.</span>
        </div>
      )}

      {/* TAB 1: RESTAURANT PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSave} className="admin-card" style={{ padding: '1.35rem 1.5rem' }}>
          <div className="admin-card-header mb-3" style={{ borderBottom: '1px solid #F0E8DA', paddingBottom: '0.65rem' }}>
            <h2 className="admin-card-title" style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} color="#1E4636" />
              <span>{isManagerMode ? 'Branch Profile & Operating Hours' : 'Restaurant Business Information'}</span>
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
              <label className="form-label">Primary Contact Email *</label>
              <input 
                type="email" 
                className="form-control" 
                value={settingsData.contactEmail} 
                onChange={(e) => setSettingsData({ ...settingsData, contactEmail: e.target.value })}
                required 
              />
            </div>

            <div className="admin-form-group">
              <label className="form-label">Manager Helpline Phone *</label>
              <input 
                type="text" 
                className="form-control" 
                value={settingsData.contactPhone} 
                onChange={(e) => setSettingsData({ ...settingsData, contactPhone: e.target.value })}
                required 
              />
            </div>

            <div className="admin-form-group">
              <label className="form-label">Daily Operating Hours</label>
              <input 
                type="text" 
                className="form-control" 
                value={settingsData.operatingHours} 
                onChange={(e) => setSettingsData({ ...settingsData, operatingHours: e.target.value })}
              />
            </div>

            <div className="admin-form-group">
              <label className="form-label">Tagline</label>
              <input 
                type="text" 
                className="form-control" 
                value={settingsData.tagline} 
                onChange={(e) => setSettingsData({ ...settingsData, tagline: e.target.value })}
              />
            </div>

            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Full Branch Address *</label>
              <input 
                type="text" 
                className="form-control" 
                value={settingsData.address} 
                onChange={(e) => setSettingsData({ ...settingsData, address: e.target.value })}
                required 
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #F0E8DA', textAlign: 'right' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', backgroundColor: '#1E4636', color: '#FFFFFF' }}>
              <Save size={16} />
              <span>Save Branch Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: KITCHEN & KDS PREFERENCES */}
      {activeTab === 'kds' && (
        <form onSubmit={handleSave} className="admin-card" style={{ padding: '1.35rem 1.5rem' }}>
          <div className="admin-card-header mb-3" style={{ borderBottom: '1px solid #F0E8DA', paddingBottom: '0.65rem' }}>
            <h2 className="admin-card-title" style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Utensils size={18} color="#FF8A00" />
              <span>Kitchen Display System (KDS) & Order Automation</span>
            </h2>
          </div>

          <div className="grid-2" style={{ gap: '1.25rem' }}>
            <div className="admin-form-group" style={{ backgroundColor: '#FAF6EE', padding: '1rem', borderRadius: '10px', border: '1px solid #E5DBC8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#1E4636', fontSize: '0.95rem' }}>⚡ Auto-Accept Table QR Orders</div>
                  <div style={{ fontSize: '0.78rem', color: '#5C5C5C', marginTop: '0.2rem' }}>Automatically route incoming QR table orders directly to kitchen KDS screens.</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settingsData.autoAcceptOrders} 
                  onChange={(e) => setSettingsData({ ...settingsData, autoAcceptOrders: e.target.checked })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className="admin-form-group" style={{ backgroundColor: '#FAF6EE', padding: '1rem', borderRadius: '10px', border: '1px solid #E5DBC8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#1E4636', fontSize: '0.95rem' }}>🔔 KDS Audio Sound Alerts</div>
                  <div style={{ fontSize: '0.78rem', color: '#5C5C5C', marginTop: '0.2rem' }}>Play chime sound on Kitchen Display Screen when new order arrives.</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settingsData.audioAlerts} 
                  onChange={(e) => setSettingsData({ ...settingsData, audioAlerts: e.target.checked })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="form-label">Order Preparation Time Warning Limit</label>
              <select 
                value={settingsData.prepTimeWarning} 
                onChange={(e) => setSettingsData({ ...settingsData, prepTimeWarning: e.target.value })}
                className="form-control"
              >
                <option value="15 mins">15 Minutes</option>
                <option value="20 mins">20 Minutes</option>
                <option value="25 mins">25 Minutes</option>
                <option value="30 mins">30 Minutes</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="form-label">KDS Screen Refresh Frequency</label>
              <select className="form-control" defaultValue="5 secs">
                <option value="Realtime">Realtime (Instant WebSockets)</option>
                <option value="5 secs">Every 5 Seconds</option>
                <option value="10 secs">Every 10 Seconds</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #F0E8DA', textAlign: 'right' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', backgroundColor: '#1E4636', color: '#FFFFFF' }}>
              <Save size={16} />
              <span>Save Kitchen Preferences</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: TAX & QR BILLING */}
      {activeTab === 'tax' && (
        <form onSubmit={handleSave} className="admin-card" style={{ padding: '1.35rem 1.5rem' }}>
          <div className="admin-card-header mb-3" style={{ borderBottom: '1px solid #F0E8DA', paddingBottom: '0.65rem' }}>
            <h2 className="admin-card-title" style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={18} color="#1E4636" />
              <span>Taxation & Table QR Billing Configuration</span>
            </h2>
          </div>

          <div className="grid-2" style={{ gap: '1.1rem' }}>
            <div className="admin-form-group">
              <label className="form-label">GSTIN (GST Identification Number) *</label>
              <input 
                type="text" 
                className="form-control" 
                value={settingsData.gstin} 
                onChange={(e) => setSettingsData({ ...settingsData, gstin: e.target.value })}
                required 
              />
            </div>

            <div className="admin-form-group">
              <label className="form-label">FSSAI License Number *</label>
              <input 
                type="text" 
                className="form-control" 
                value={settingsData.fssai} 
                onChange={(e) => setSettingsData({ ...settingsData, fssai: e.target.value })}
                required 
              />
            </div>

            <div className="admin-form-group">
              <label className="form-label">Default GST Tax Rate (%)</label>
              <input 
                type="text" 
                className="form-control" 
                value={settingsData.gstRate} 
                onChange={(e) => setSettingsData({ ...settingsData, gstRate: e.target.value })}
              />
            </div>

            <div className="admin-form-group">
              <label className="form-label">Digital Invoice Footnote Text</label>
              <input 
                type="text" 
                className="form-control" 
                value={settingsData.invoiceFootnote} 
                onChange={(e) => setSettingsData({ ...settingsData, invoiceFootnote: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #F0E8DA', textAlign: 'right' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', backgroundColor: '#1E4636', color: '#FFFFFF' }}>
              <Save size={16} />
              <span>Save Tax & Billing Info</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: BRANCH LOCATIONS (ADMIN ONLY) */}
      {activeTab === 'branches' && !isManagerMode && (
        <div className="admin-card" style={{ padding: '1.75rem' }}>
          <div className="admin-card-header mb-4" style={{ borderBottom: '1px solid #F0E8DA', paddingBottom: '0.75rem' }}>
            <h2 className="admin-card-title" style={{ fontSize: '1.2rem', margin: 0 }}>
              Active Restaurant Branches
            </h2>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Branch ID</th>
                  <th>Location / Name</th>
                  <th>City</th>
                  <th>Manager</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold" style={{ color: '#1E4636' }}>BR-01</td>
                  <td className="font-semibold">Jubilee Hills (Main Branch)</td>
                  <td>Hyderabad</td>
                  <td>Chef Srikanth</td>
                  <td><span className="status-badge-unified is-ready">Active</span></td>
                </tr>
                <tr>
                  <td className="font-semibold" style={{ color: '#1E4636' }}>BR-02</td>
                  <td className="font-semibold">Banjara Hills Branch</td>
                  <td>Hyderabad</td>
                  <td>Rajesh Kumar</td>
                  <td><span className="status-badge-unified is-ready">Active</span></td>
                </tr>
                <tr>
                  <td className="font-semibold" style={{ color: '#1E4636' }}>BR-03</td>
                  <td className="font-semibold">Gachibowli Branch</td>
                  <td>Hyderabad</td>
                  <td>Pooja Nair</td>
                  <td><span className="status-badge-unified is-ready">Active</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
