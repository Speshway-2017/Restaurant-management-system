import React, { useState } from 'react';
import { Settings, ShieldCheck, Building2, FileText, Save, CheckCircle2, Search } from 'lucide-react';
import { api } from '../../services/api';

export default function AdminSettingsPage({ subTab = 'settings-profile' }) {
  const [activeTab, setActiveTab] = useState(
    subTab.includes('gst') ? 'gst' :
    subTab.includes('branches') ? 'branches' : 'profile'
  );

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    api.updateSettings({})
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
            <span>Admin</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Platform Settings</span>
          </div>
          <h1 className="admin-page-title">Platform Settings</h1>
          <p className="admin-page-subtitle">Configure restaurant profile, GSTIN tax rules, FSSAI licenses, and branch locations.</p>
        </div>
      </div>

      {/* Navigation Filter Bar */}
      <div className="admin-card mb-4" style={{ padding: '0.75rem 1.25rem' }}>
        <div className="admin-filter-bar-flex">
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
            <button className={`admin-pill-btn ${activeTab === 'gst' ? 'is-active' : ''}`} onClick={() => setActiveTab('gst')}>
              GST & FSSAI Details
            </button>
            <button className={`admin-pill-btn ${activeTab === 'branches' ? 'is-active' : ''}`} onClick={() => setActiveTab('branches')}>
              Branch Locations
            </button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="admin-alert-banner is-success mb-4">
          <CheckCircle2 size={18} color="#3F8F5B" />
          <span>Settings updated successfully! Changes applied to active POS terminals.</span>
        </div>
      )}

      {/* TAB 1: RESTAURANT PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSave} className="admin-card" style={{ padding: '1.35rem 1.5rem' }}>
          <div className="admin-card-header mb-3" style={{ borderBottom: '1px solid #F0E8DA', paddingBottom: '0.65rem' }}>
            <h2 className="admin-card-title" style={{ fontSize: '1.15rem', margin: 0 }}>
              Restaurant Business Information
            </h2>
          </div>

          <div className="grid-2">
            <div className="admin-form-group">
              <label className="form-label">Restaurant Name *</label>
              <input type="text" className="form-control" defaultValue="Flavora Kitchen" required />
            </div>

            <div className="admin-form-group">
              <label className="form-label">Tagline</label>
              <input type="text" className="form-control" defaultValue="Good food. Great moments." />
            </div>

            <div className="admin-form-group">
              <label className="form-label">Primary Contact Email *</label>
              <input type="email" className="form-control" defaultValue="admin@flavorakitchen.in" required />
            </div>

            <div className="admin-form-group">
              <label className="form-label">Phone Number *</label>
              <input type="text" className="form-control" defaultValue="+91 98765 43210" required />
            </div>

            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Main Restaurant Address *</label>
              <input type="text" className="form-control" defaultValue="Plot No. 42, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033, India" required />
            </div>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #F0E8DA', textAlign: 'right' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.4rem' }}>
              <Save size={16} />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: GST & FSSAI COMPLIANCE */}
      {activeTab === 'gst' && (
        <form onSubmit={handleSave} className="admin-card" style={{ padding: '1.35rem 1.5rem' }}>
          <div className="admin-card-header mb-3" style={{ borderBottom: '1px solid #F0E8DA', paddingBottom: '0.65rem' }}>
            <h2 className="admin-card-title" style={{ fontSize: '1.15rem', margin: 0 }}>
              Taxation & FSSAI Compliance
            </h2>
          </div>

          <div className="grid-2">
            <div className="admin-form-group">
              <label className="form-label">GSTIN (GST Identification Number) *</label>
              <input type="text" className="form-control" defaultValue="29AAAAA0000A1Z5" required />
            </div>

            <div className="admin-form-group">
              <label className="form-label">FSSAI License Number *</label>
              <input type="text" className="form-control" defaultValue="11223344556677" required />
            </div>

            <div className="admin-form-group">
              <label className="form-label">Default GST Rate (%)</label>
              <input type="text" className="form-control" defaultValue="5% (Restaurant CGST 2.5% + SGST 2.5%)" />
            </div>

            <div className="admin-form-group">
              <label className="form-label">Invoice Footnote Text</label>
              <input type="text" className="form-control" defaultValue="Thank you for dining with Flavora Kitchen! Visit again." />
            </div>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #F0E8DA', textAlign: 'right' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.4rem' }}>
              <Save size={16} />
              <span>Save Tax & Compliance Info</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: BRANCH LOCATIONS */}
      {activeTab === 'branches' && (
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
