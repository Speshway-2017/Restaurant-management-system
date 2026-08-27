import React, { useState } from 'react';
import {
  Settings, Bell, Volume2, RefreshCw, CheckCircle2, Sliders, Shield,
  Sparkles, Clock, Smartphone, CreditCard, LayoutGrid, Sun, Lock,
  Printer, VolumeX, Check, RotateCcw, Monitor, Utensils, Hash, Trash2
} from 'lucide-react';

export default function WaiterSettingsPage() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_waiter_settings');
      return saved ? JSON.parse(saved) : {
        // Notifications & Audio
        audioAlerts: true,
        chimeTone: 'bell',
        volume: 85,
        popupNotifications: true,
        vibrateOnAlert: true,

        // Table & Floor Plan
        highlightCleaningTables: true,
        autoCleanDuration: '5',
        defaultZoneFilter: 'All',
        showCustomerNames: true,

        // POS & Order Sync
        autoRefreshInterval: '2',
        defaultPaymentMethod: 'UPI',
        enableTipInput: true,
        autoPrintKot: false,

        // Display & Theme
        viewDensity: 'comfortable',
        colorTheme: 'light',

        // Security & Station
        autoLogoutMinutes: '30',
        requirePaymentPin: false
      };
    } catch (e) {
      return {
        audioAlerts: true,
        chimeTone: 'bell',
        volume: 85,
        popupNotifications: true,
        vibrateOnAlert: true,
        highlightCleaningTables: true,
        autoCleanDuration: '5',
        defaultZoneFilter: 'All',
        showCustomerNames: true,
        autoRefreshInterval: '2',
        defaultPaymentMethod: 'UPI',
        enableTipInput: true,
        autoPrintKot: false,
        viewDensity: 'comfortable',
        colorTheme: 'light',
        autoLogoutMinutes: '30',
        requirePaymentPin: false
      };
    }
  });

  const [successMsg, setSuccessMsg] = useState(null);
  const [playingTestAudio, setPlayingTestAudio] = useState(false);

  const handleSave = (e) => {
    if (e) e.preventDefault();
    try {
      localStorage.setItem('flavora_waiter_settings', JSON.stringify(settings));
      setSuccessMsg('Waiter Station preferences saved & applied live!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  const handleResetDefaults = () => {
    const defaultState = {
      audioAlerts: true,
      chimeTone: 'bell',
      volume: 85,
      popupNotifications: true,
      vibrateOnAlert: true,
      highlightCleaningTables: true,
      autoCleanDuration: '5',
      defaultZoneFilter: 'All',
      showCustomerNames: true,
      autoRefreshInterval: '2',
      defaultPaymentMethod: 'UPI',
      enableTipInput: true,
      autoPrintKot: false,
      viewDensity: 'comfortable',
      colorTheme: 'light',
      autoLogoutMinutes: '30',
      requirePaymentPin: false
    };
    setSettings(defaultState);
    localStorage.setItem('flavora_waiter_settings', JSON.stringify(defaultState));
    setSuccessMsg('Settings reset to system defaults!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleTestSound = () => {
    setPlayingTestAudio(true);
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = settings.chimeTone === 'beep' ? 'square' : 'sine';
      osc.frequency.setValueAtTime(settings.chimeTone === 'gong' ? 320 : 880, audioCtx.currentTime);
      gain.gain.setValueAtTime((settings.volume / 100) * 0.3, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {}
    setTimeout(() => setPlayingTestAudio(false), 500);
  };

  return (
    <div className="admin-dashboard-container" style={{ width: '100%', boxSizing: 'border-box', paddingBottom: '3rem' }}>
      
      {/* ================= 1. PAGE HEADER ================= */}
      <div className="admin-dashboard-header" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="page-breadcrumb-bar">
            <span>Waiter</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Settings</span>
          </div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            Station Settings
          </h1>
          <p className="admin-page-subtitle" style={{ margin: '0.2rem 0 0 0' }}>
            Configure Audio Chimes, Table Lifecycle Alerts, POS Sync & Station Preferences
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={handleResetDefaults}
            style={{
              backgroundColor: '#F1F5F9',
              color: '#475569',
              border: '1px solid #CBD5E1',
              padding: '0.6rem 1.1rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <RotateCcw size={15} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            style={{
              backgroundColor: '#0F2A1D',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.6rem 1.3rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 14px rgba(15, 42, 29, 0.2)'
            }}
          >
            <Check size={16} />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #86EFAC', color: '#166534', padding: '0.85rem 1.25rem', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.88rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(22, 101, 52, 0.08)' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ================= 2. MAIN SETTINGS GRID ================= */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* SECTION A: AUDIO & NOTIFICATIONS */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0F2A1D', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={18} color="#E07A3C" />
              <span>Audio Chimes & Notification Alerts</span>
            </h3>
            <span style={{ fontSize: '0.74rem', backgroundColor: '#FFF3EB', color: '#E07A3C', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '6px' }}>
              KDS Sound & Toasts
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            
            {/* Audio Alert Toggle */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 800, color: '#0F2A1D', fontSize: '0.9rem' }}>
                <span>🔔 Kitchen Ready Audio Chimes</span>
                <input
                  type="checkbox"
                  checked={settings.audioAlerts}
                  onChange={e => setSettings({ ...settings, audioAlerts: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#E07A3C', cursor: 'pointer' }}
                />
              </label>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                Play loud audible chime when kitchen marks order Ready.
              </p>
            </div>

            {/* Popup Notifications Banner */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 800, color: '#0F2A1D', fontSize: '0.9rem' }}>
                <span>💬 On-Screen Toast Banners</span>
                <input
                  type="checkbox"
                  checked={settings.popupNotifications}
                  onChange={e => setSettings({ ...settings, popupNotifications: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#E07A3C', cursor: 'pointer' }}
                />
              </label>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                Show instant popup alert when customer places new table order.
              </p>
            </div>

            {/* Chime Tone Selector */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F2A1D' }}>Chime Sound Tone</label>
                <button
                  type="button"
                  onClick={handleTestSound}
                  style={{
                    backgroundColor: '#E07A3C',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {playingTestAudio ? '🔊 Playing...' : '▶ Test Sound'}
                </button>
              </div>
              <select
                value={settings.chimeTone}
                onChange={e => setSettings({ ...settings, chimeTone: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
              >
                <option value="bell">🔔 Classic Restaurant Bell</option>
                <option value="chime">🎵 Soft Melodic Chime</option>
                <option value="beep">📟 Digital POS Beep</option>
                <option value="gong">🥁 Kitchen Gong Alert</option>
              </select>
            </div>

            {/* Volume Control */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F2A1D' }}>Alert Chime Volume ({settings.volume}%)</label>
                <Volume2 size={16} color="#E07A3C" />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.volume}
                onChange={e => setSettings({ ...settings, volume: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#E07A3C', cursor: 'pointer' }}
              />
            </div>

          </div>
        </div>

        {/* SECTION B: TABLE LIFECYCLE & FLOOR PLAN */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0F2A1D', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Utensils size={18} color="#283593" />
              <span>Table Floor Plan & Lifecycle Rules</span>
            </h3>
            <span style={{ fontSize: '0.74rem', backgroundColor: '#E8EAF6', color: '#283593', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '6px' }}>
              Seating & Cleaning
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            
            {/* Highlight Cleaning State */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 800, color: '#0F2A1D', fontSize: '0.9rem' }}>
                <span>🧹 Highlight Cleaning Tables</span>
                <input
                  type="checkbox"
                  checked={settings.highlightCleaningTables}
                  onChange={e => setSettings({ ...settings, highlightCleaningTables: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#283593', cursor: 'pointer' }}
                />
              </label>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                Pulse yellow glow on tables awaiting waiter table bussing & cleaning.
              </p>
            </div>

            {/* Auto-Clean Reset Timer */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.4rem' }}>
                Auto-Reset Cleaning State
              </label>
              <select
                value={settings.autoCleanDuration}
                onChange={e => setSettings({ ...settings, autoCleanDuration: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
              >
                <option value="2">⚡ 2 Minutes (Fast Turnaround)</option>
                <option value="5">🟢 5 Minutes (Standard Clean)</option>
                <option value="10">🐢 10 Minutes (Deep Clean)</option>
                <option value="manual">🛑 Manual Reset Only</option>
              </select>
            </div>

            {/* Default Zone Filter */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.4rem' }}>
                Default Floor Zone Display
              </label>
              <select
                value={settings.defaultZoneFilter}
                onChange={e => setSettings({ ...settings, defaultZoneFilter: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
              >
                <option value="All">🏢 All Dining Zones</option>
                <option value="Main Dining">🍽️ Main Dining Hall</option>
                <option value="Window Section">🪟 Window Section</option>
                <option value="Family Lounge">🛋️ Family Lounge</option>
                <option value="Patio Outdoor">🌿 Patio Outdoor</option>
              </select>
            </div>

            {/* Show Customer Names */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 800, color: '#0F2A1D', fontSize: '0.9rem' }}>
                <span>👤 Show Guest Diner Names</span>
                <input
                  type="checkbox"
                  checked={settings.showCustomerNames}
                  onChange={e => setSettings({ ...settings, showCustomerNames: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#283593', cursor: 'pointer' }}
                />
              </label>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                Display guest diner names on floor plan table cards.
              </p>
            </div>

          </div>
        </div>

        {/* SECTION C: POS & ORDER SYNC SETTINGS */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0F2A1D', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={18} color="#166534" />
              <span>POS Billing & Live Database Refresh</span>
            </h3>
            <span style={{ fontSize: '0.74rem', backgroundColor: '#DCFCE7', color: '#166534', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '6px' }}>
              Payment & Database
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            
            {/* Database Sync Frequency */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.4rem' }}>
                Database Auto-Sync Frequency
              </label>
              <select
                value={settings.autoRefreshInterval}
                onChange={e => setSettings({ ...settings, autoRefreshInterval: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
              >
                <option value="1">⚡ 1 Second (Real-Time Live Sync)</option>
                <option value="2">🟢 2 Seconds (Standard Speed)</option>
                <option value="5">🐢 5 Seconds (Battery Saver)</option>
              </select>
            </div>

            {/* Default Payment Method */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.4rem' }}>
                Default Payment Method Pre-select
              </label>
              <select
                value={settings.defaultPaymentMethod}
                onChange={e => setSettings({ ...settings, defaultPaymentMethod: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
              >
                <option value="UPI">📱 Instant Dynamic UPI QR Code</option>
                <option value="Card">💳 Credit / Debit Card Terminal</option>
                <option value="Cash">💵 Cash Settlement Drop</option>
              </select>
            </div>

            {/* Tip Entry Option */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 800, color: '#0F2A1D', fontSize: '0.9rem' }}>
                <span>💰 Enable Manual Tip Input</span>
                <input
                  type="checkbox"
                  checked={settings.enableTipInput}
                  onChange={e => setSettings({ ...settings, enableTipInput: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#166534', cursor: 'pointer' }}
                />
              </label>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                Allow entering staff gratuity tips on checkout payment screen.
              </p>
            </div>

            {/* Auto Print KOT */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 800, color: '#0F2A1D', fontSize: '0.9rem' }}>
                <span>🖨️ Auto-Request KOT Receipt Print</span>
                <input
                  type="checkbox"
                  checked={settings.autoPrintKot}
                  onChange={e => setSettings({ ...settings, autoPrintKot: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#166534', cursor: 'pointer' }}
                />
              </label>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                Trigger thermal receipt print prompt when order bill is generated.
              </p>
            </div>

          </div>
        </div>

        {/* SECTION D: STATION SECURITY & SYSTEM */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0F2A1D', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} color="#0F2A1D" />
              <span>Station Security & Power Management</span>
            </h3>
            <span style={{ fontSize: '0.74rem', backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '6px' }}>
              Shift Security
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            
            {/* Auto Logout Minutes */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.4rem' }}>
                Inactivity Station Auto-Lock
              </label>
              <select
                value={settings.autoLogoutMinutes}
                onChange={e => setSettings({ ...settings, autoLogoutMinutes: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
              >
                <option value="15">🔒 15 Minutes Inactivity</option>
                <option value="30">🔒 30 Minutes Inactivity</option>
                <option value="60">🔒 60 Minutes Inactivity</option>
                <option value="never">🔓 Never Auto-Lock</option>
              </select>
            </div>

            {/* Payment PIN Confirmation */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 800, color: '#0F2A1D', fontSize: '0.9rem' }}>
                <span>🔑 Require Staff PIN for Refunds</span>
                <input
                  type="checkbox"
                  checked={settings.requirePaymentPin}
                  onChange={e => setSettings({ ...settings, requirePaymentPin: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#0F2A1D', cursor: 'pointer' }}
                />
              </label>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                Require waiter employee ID verification before order cancellation.
              </p>
            </div>

          </div>
        </div>

        {/* BOTTOM FLOATING SAVE BAR */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={handleResetDefaults}
            style={{
              backgroundColor: '#F1F5F9',
              color: '#475569',
              border: '1px solid #CBD5E1',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Reset All
          </button>

          <button
            type="submit"
            style={{
              backgroundColor: '#0F2A1D',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '12px',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(15, 42, 29, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Check size={18} />
            <span>Save & Apply Settings</span>
          </button>
        </div>

      </form>
    </div>
  );
}
