import React from 'react';
import { BarChart3, Download, Calendar, TrendingUp, DollarSign, Users, Award } from 'lucide-react';

export default function AdminAnalyticsPage() {
  return (
    <div className="admin-subpage-container">
      <div className="admin-dashboard-header">
        <div>
          <div className="page-breadcrumb-bar">
            <span>Admin</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Reports & Business Analytics</span>
          </div>
          <h1 className="admin-page-title">Reports & Business Analytics</h1>
          <p className="admin-page-subtitle">Deep insights into sales growth, peak dining hours, and profitability.</p>
        </div>
        <div className="admin-header-actions">
          <button className="btn btn-outline">
            <Download size={15} />
            <span>Export Excel</span>
          </button>
          <button className="btn btn-primary">
            <Download size={15} />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      <div className="admin-grid-12">
        <div className="admin-card col-span-6">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Monthly Revenue Trend (2026)</h2>
          </div>
          <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '1rem', padding: '1rem 0' }}>
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((m, idx) => (
              <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '100%', height: `${(idx + 3) * 18}px`, backgroundColor: idx === 7 ? '#E07A3C' : '#1E4636', borderRadius: '4px' }}></div>
                <span className="text-xs text-muted">{m}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card col-span-6">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Category Revenue Breakdown</h2>
          </div>
          <div className="admin-status-breakdown-list">
            <div className="status-row-item">
              <span>Main Course (Biryani & Gravies)</span>
              <strong>₹4,85,000 (52%)</strong>
            </div>
            <div className="status-row-item">
              <span>Starters & Tandoor</span>
              <strong>₹2,10,000 (22%)</strong>
            </div>
            <div className="status-row-item">
              <span>South Indian Special Tiffin</span>
              <strong>₹1,35,000 (15%)</strong>
            </div>
            <div className="status-row-item">
              <span>Desserts & Beverages</span>
              <strong>₹1,02,000 (11%)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
