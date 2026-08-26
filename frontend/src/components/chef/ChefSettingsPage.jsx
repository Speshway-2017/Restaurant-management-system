import React, { useState } from 'react';
import { Settings, Volume2, VolumeX, Clock, Bell, RefreshCw, CheckCircle2, Save, Flame, LayoutGrid } from 'lucide-react';

export default function ChefSettingsPage() {
  const [settings, setSettings] = useState({
    autoRefreshInterval: '4', // seconds
    chimeVolume: 'high', // 'low', 'medium', 'high', 'mute'
    overdueThreshold: '20', // minutes
    ticketLayout: 'grid', // 'grid', 'compact'
    autoCookingStatus: true,
    soundOnNewTicket: true
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="admin-subpage-container" style={{ paddingBottom: '3rem' }}>
      
      {/* Header */}
      <div className="admin-dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div className="page-breadcrumb-bar">
          <span>Chef</span>
          <span className="crumb-sep">›</span>
          <span className="crumb-current">Settings</span>
        </div>
        <h1 className="admin-page-title">Kitchen Display System (KDS) Settings</h1>
        <p className="admin-page-subtitle">Configure ticket refresh intervals, audio chime alerts, overdue warning thresholds, and layout preferences.</p>
      </div>

      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        padding: '1.75rem',
        border: '1px solid #F0EAE1',
        boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
        maxWidth: '800px'
      }}>
        {isSaved && (
          <div style={{ backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>KDS Settings saved successfully! Preferences applied to live pass.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Section 1: Audio & Chime Alerts */}
          <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: '#0F2A1D', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Volume2 size={18} color="#E07A3C" />
              <span>Audio Chime & Alert Notifications</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Audio Chime Volume</label>
                <select
                  value={settings.chimeVolume}
                  onChange={(e) => setSettings({ ...settings, chimeVolume: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
                >
                  <option value="high">🔊 High Volume (Kitchen Loudness)</option>
                  <option value="medium">🔉 Medium Volume</option>
                  <option value="low">🔈 Soft Volume</option>
                  <option value="mute">🔇 Mute All Audio Chimes</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Chime Sound Trigger</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="sound_new_ticket"
                    checked={settings.soundOnNewTicket}
                    onChange={(e) => setSettings({ ...settings, soundOnNewTicket: e.target.checked })}
                    style={{ accentColor: '#0F2A1D', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="sound_new_ticket" style={{ fontSize: '0.84rem', color: '#0F2A1D', fontWeight: 700, cursor: 'pointer' }}>
                    Play chime whenever a new order arrives from QR menu
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #E2E8F0' }} />

          {/* Section 2: KDS Pass Timers & Refresh */}
          <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: '#0F2A1D', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={18} color="#166534" />
              <span>Live Pass Auto-Sync & Overdue Timers</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Database Auto-Sync Frequency</label>
                <select
                  value={settings.autoRefreshInterval}
                  onChange={(e) => setSettings({ ...settings, autoRefreshInterval: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
                >
                  <option value="2">⚡ Every 2 Seconds (High Speed)</option>
                  <option value="4">🟢 Every 4 Seconds (Standard KDS)</option>
                  <option value="10">🐢 Every 10 Seconds</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Flame Red Overdue Warning Threshold</label>
                <select
                  value={settings.overdueThreshold}
                  onChange={(e) => setSettings({ ...settings, overdueThreshold: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
                >
                  <option value="15">🔥 15 Minutes (Strict Prep)</option>
                  <option value="20">🔥 20 Minutes (Standard Prep)</option>
                  <option value="30">🔥 30 Minutes (Slow Cooking Dishes)</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #E2E8F0' }} />

          {/* Submit Button */}
          <div style={{ textAlign: 'right' }}>
            <button
              type="submit"
              style={{
                padding: '0.7rem 1.6rem',
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
              <span>Save KDS Settings</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
