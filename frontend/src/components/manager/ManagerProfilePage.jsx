import React from 'react';
import { UserCheck, Shield, Mail, Phone, Building2 } from 'lucide-react';

export default function ManagerProfilePage() {
  const currentManager = JSON.parse(localStorage.getItem('flavora_logged_user') || '{"name":"Manager Ram","role":"manager","email":"manager@flavora.com"}');

  return (
    <div className="admin-subpage-container" style={{ paddingBottom: '3rem' }}>
      <div className="admin-dashboard-header">
        <div>
          <div className="page-breadcrumb-bar">
            <span>Dashboard</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">My Account & Profile</span>
          </div>
          <h1 className="admin-page-title">Manager Profile & Account</h1>
          <p className="admin-page-subtitle">View active manager credentials and branch access authorization.</p>
        </div>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '1.5rem', border: '1px solid #F0EAE1', maxWidth: '540px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#1E4636', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900 }}>
            {currentManager.name ? currentManager.name.charAt(0) : 'M'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F2A1D' }}>{currentManager.name || 'Manager Ram'}</h2>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, backgroundColor: '#FFF5ED', color: '#92400E', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
              OPERATIONS MANAGER
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', color: '#475569' }}>
          <div><strong>Email:</strong> {currentManager.email || 'manager@flavora.com'}</div>
          <div><strong>Branch:</strong> Jubilee Hills Flagship (RMSM-01)</div>
          <div><strong>Access Privilege:</strong> Shift Operations, Order Flow, Table QR Management</div>
        </div>
      </div>
    </div>
  );
}
