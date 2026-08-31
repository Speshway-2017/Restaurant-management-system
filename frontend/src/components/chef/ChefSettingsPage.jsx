import React, { useState, useEffect } from 'react';
import {
  Settings,
  Volume2,
  VolumeX,
  Clock,
  Bell,
  RefreshCw,
  CheckCircle2,
  Save,
  Flame,
  LayoutGrid,
  Monitor,
  Sparkles,
  RotateCcw,
  Sliders,
  Radio,
  Zap,
  Check
} from 'lucide-react';

export default function ChefSettingsPage() {
  const DEFAULT_SETTINGS = {
    autoRefreshInterval: '4', // seconds
    chimeVolume: 'high', // 'high', 'medium', 'low', 'mute'
    overdueThreshold: '20', // minutes
    ticketLayout: 'grid', // 'grid', 'compact'
    autoCookingStatus: true,
    soundOnNewTicket: true,
    autoMarkOrderReady: true,
    highContrastMode: false,
    fontSize: 'standard',
    flashOverdueTickets: true
  };

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_chef_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);

  // Play pleasant Web Audio API KDS Chime
  const handlePlayTestChime = () => {
    setIsPlayingTestSound(true);
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      const volumeLevel = settings.chimeVolume === 'high' ? 0.2 : (settings.chimeVolume === 'medium' ? 0.1 : 0.05);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(volumeLevel, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.log('Audio playback not supported', e);
    }

    setTimeout(() => setIsPlayingTestSound(false), 500);
  };

  const updateAndSaveSetting = (newPartialSettings) => {
    const updated = { ...settings, ...newPartialSettings };
    setSettings(updated);
    try {
      localStorage.setItem('flavora_chef_settings', JSON.stringify(updated));
      window.dispatchEvent(new Event('flavora_settings_updated'));
    } catch (e) { }
  };

  const handleSubmit = (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    try {
      localStorage.setItem('flavora_chef_settings', JSON.stringify(settings));
      window.dispatchEvent(new Event('flavora_settings_updated'));
    } catch (err) {
      console.error('Error saving settings:', err);
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem('flavora_chef_settings', JSON.stringify(DEFAULT_SETTINGS));
      window.dispatchEvent(new Event('flavora_settings_updated'));
    } catch (e) { }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="admin-subpage-container" style={{ width: '100%', boxSizing: 'border-box', paddingBottom: '3rem' }}>

      {/* ================= 1. HEADER LOCKUP ================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div>
          <div className="page-breadcrumb-bar" style={{ marginBottom: '0.35rem' }}>
            <span>Chef</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Settings</span>
          </div>
          <h1 className="admin-page-title" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
            KDS Settings
          </h1>
          <p className="admin-page-subtitle" style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: '#64748B', fontWeight: 600 }}>
            Customize audio chime volume, auto-sync intervals, overdue timers, and display layout density.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleResetDefaults}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '12px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#475569',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <RotateCcw size={15} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#0F2A1D',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 14px rgba(15, 42, 29, 0.25)'
            }}
          >
            <Save size={16} />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {isSaved && (
        <div style={{
          backgroundColor: '#DCFCE7',
          color: '#166534',
          border: '1.5px solid #86EFAC',
          padding: '0.85rem 1.25rem',
          borderRadius: '14px',
          marginBottom: '1.5rem',
          fontSize: '0.88rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.12)'
        }}>
          <CheckCircle2 size={20} />
          <span>Kitchen preferences saved! Real-time settings applied to KDS Pass.</span>
        </div>
      )}

      {/* ================= 2. SETTINGS CARDS GRID ================= */}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>

        {/* SECTION 1: AUDIO CHIME & ALERTS */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.65rem', border: '1.5px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: '#FFF3EB', color: '#E07A3C', padding: '0.55rem', borderRadius: '12px' }}>
                <Volume2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
                  Audio Chime & Sound Alerts
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                  Kitchen loud chime volume & order notifications
                </span>
              </div>
            </div>

            {/* Chime Volume */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.5rem' }}>
                Kitchen Chime Audio Volume
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {[
                  { id: 'high', label: '🔊 Loud', desc: 'Kitchen Loud' },
                  { id: 'medium', label: '🔉 Medium', desc: 'Standard' },
                  { id: 'low', label: '🔈 Soft', desc: 'Quiet' },
                  { id: 'mute', label: '🔇 Mute', desc: 'Silent' }
                ].map(vol => (
                  <button
                    key={vol.id}
                    type="button"
                    onClick={() => updateAndSaveSetting({ chimeVolume: vol.id })}
                    style={{
                      backgroundColor: settings.chimeVolume === vol.id ? '#0F2A1D' : '#F8FAFC',
                      color: settings.chimeVolume === vol.id ? '#FFFFFF' : '#475569',
                      border: settings.chimeVolume === vol.id ? '1.5px solid #0F2A1D' : '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '0.6rem 0.3rem',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>{vol.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Test Sound Button */}
            <div style={{ marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={handlePlayTestChime}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '10px',
                  border: '1.5px solid #E07A3C',
                  backgroundColor: isPlayingTestSound ? '#FFF3EB' : '#FFFFFF',
                  color: '#E07A3C',
                  fontSize: '0.82rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <Volume2 size={16} />
                <span>{isPlayingTestSound ? 'Playing Chime Test...' : 'Test Audio Chime Sound'}</span>
              </button>
            </div>

            {/* New Ticket Audio Checkbox */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F2A1D' }}>Chime on New Order</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Play loud chime when QR ticket arrives</div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundOnNewTicket}
                onChange={(e) => updateAndSaveSetting({ soundOnNewTicket: e.target.checked })}
                style={{ accentColor: '#0F2A1D', width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: LIVE SYNC & OVERDUE TIMERS */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.65rem', border: '1.5px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '0.55rem', borderRadius: '12px' }}>
                <Clock size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
                  Auto-Sync & Overdue Timers
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                  Real-time database refresh & preparation warnings
                </span>
              </div>
            </div>

            {/* Auto Refresh Select */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.4rem' }}>
                KDS Database Auto-Sync Speed
              </label>
              <select
                value={settings.autoRefreshInterval}
                onChange={(e) => updateAndSaveSetting({ autoRefreshInterval: e.target.value })}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '0.85rem', fontWeight: 800, color: '#0F2A1D', outline: 'none' }}
              >
                <option value="2">⚡ Every 2 Seconds (High Velocity Sync)</option>
                <option value="4">🟢 Every 4 Seconds (Standard KDS Sync)</option>
                <option value="10">🐢 Every 10 Seconds (Power Saver Sync)</option>
              </select>
            </div>

            {/* Overdue Warning Threshold */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.4rem' }}>
                Flame Red Overdue Warning Threshold
              </label>
              <select
                value={settings.overdueThreshold}
                onChange={(e) => updateAndSaveSetting({ overdueThreshold: e.target.value })}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '0.85rem', fontWeight: 800, color: '#0F2A1D', outline: 'none' }}
              >
                <option value="15">🔥 15 Minutes (Strict Fast Casual Prep)</option>
                <option value="20">🔥 20 Minutes (Standard Dining Prep)</option>
                <option value="30">🔥 30 Minutes (Slow Cooking / Fine Dining)</option>
              </select>
            </div>

            {/* Flash Overdue Checkbox */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F2A1D' }}>Flame Red Urgent Pulse</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Pulse order border red when prep exceeds limit</div>
              </div>
              <input
                type="checkbox"
                checked={settings.flashOverdueTickets}
                onChange={(e) => updateAndSaveSetting({ flashOverdueTickets: e.target.checked })}
                style={{ accentColor: '#0F2A1D', width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: DISPLAY LAYOUT & DENSITY */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.65rem', border: '1.5px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: '#EFF6FF', color: '#2563EB', padding: '0.55rem', borderRadius: '12px' }}>
                <Monitor size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
                  Display Layout & Automation
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                  Kitchen screen layout density & dispatch rules
                </span>
              </div>
            </div>

            {/* Layout Grid density */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.4rem' }}>
                KDS Card Grid Density
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => updateAndSaveSetting({ ticketLayout: 'grid' })}
                  style={{
                    backgroundColor: settings.ticketLayout === 'grid' ? '#0F2A1D' : '#F8FAFC',
                    color: settings.ticketLayout === 'grid' ? '#FFFFFF' : '#475569',
                    border: settings.ticketLayout === 'grid' ? '1.5px solid #0F2A1D' : '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '0.65rem',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <LayoutGrid size={16} />
                  <span>Standard Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateAndSaveSetting({ ticketLayout: 'compact' })}
                  style={{
                    backgroundColor: settings.ticketLayout === 'compact' ? '#0F2A1D' : '#F8FAFC',
                    color: settings.ticketLayout === 'compact' ? '#FFFFFF' : '#475569',
                    border: settings.ticketLayout === 'compact' ? '1.5px solid #0F2A1D' : '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '0.65rem',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Sliders size={16} />
                  <span>Compact Grid</span>
                </button>
              </div>
            </div>

            {/* Auto Mark Order Ready Checkbox */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F2A1D' }}>Auto-Dispatch when All Checked</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Mark order ready when all items are checked</div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoMarkOrderReady}
                onChange={(e) => updateAndSaveSetting({ autoMarkOrderReady: e.target.checked })}
                style={{ accentColor: '#0F2A1D', width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            {/* High Contrast Mode Checkbox */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F2A1D' }}>High Contrast Kitchen Text</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Bold high-visibility text for kitchen environment</div>
              </div>
              <input
                type="checkbox"
                checked={settings.highContrastMode}
                onChange={(e) => updateAndSaveSetting({ highContrastMode: e.target.checked })}
                style={{ accentColor: '#0F2A1D', width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

      </form>

    </div>
  );
}
