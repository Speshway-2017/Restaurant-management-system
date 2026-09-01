import React, { useState, useEffect } from 'react';
import {
  Settings, ShieldCheck, Bell, Smartphone, Clock, Save, Sparkles,
  MessageSquare, Volume2, Monitor, RefreshCw, CheckCircle2, Sliders,
  Zap, Table2, Users, AlertCircle, PhoneCall
} from 'lucide-react';
import { api } from '../../services/api';

export default function ReceptionistSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Form State
  const [tokenExpiryWindowMins, setTokenExpiryWindowMins] = useState(15);
  const [autoNoShowMins, setAutoNoShowMins] = useState(10);
  const [avgWaitPerPartyMins, setAvgWaitPerPartyMins] = useState(8);
  const [maxQueueCapacity, setMaxQueueCapacity] = useState(30);

  const [autoSmsEnabled, setAutoSmsEnabled] = useState(true);
  const [whatsappAlertsEnabled, setWhatsappAlertsEnabled] = useState(true);
  const [resvReminderEnabled, setResvReminderEnabled] = useState(true);
  const [smsTemplate, setSmsTemplate] = useState('Hi {GUEST_NAME}, your table at Flavora Kitchen is READY! Please proceed to the reception counter.');

  const [cleaningTurnoverMins, setCleaningTurnoverMins] = useState(10);
  const [autoMergeSuggestion, setAutoMergeSuggestion] = useState(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(3);

  const [soundChimeEnabled, setSoundChimeEnabled] = useState(true);
  const [autoAdvanceTokens, setAutoAdvanceTokens] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getSettings().then(res => {
      if (res && res.data) {
        const d = res.data;
        if (d.tokenExpiryWindowMins) setTokenExpiryWindowMins(d.tokenExpiryWindowMins);
        if (d.autoSmsEnabled !== undefined) setAutoSmsEnabled(d.autoSmsEnabled);
        if (d.whatsappAlertsEnabled !== undefined) setWhatsappAlertsEnabled(d.whatsappAlertsEnabled);
        if (d.cleaningTurnoverMins) setCleaningTurnoverMins(d.cleaningTurnoverMins);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        tokenExpiryWindowMins,
        autoSmsEnabled,
        whatsappAlertsEnabled,
        cleaningTurnoverMins
      }).catch(() => {});

      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3500);
    } catch (err) {
      alert(`Error saving settings: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '1000px', boxSizing: 'border-box' }}>
      
      {/* Toast Notification */}
      {saveToast && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '25px',
          backgroundColor: '#0F2A1D',
          color: '#FFFFFF',
          padding: '0.9rem 1.5rem',
          borderRadius: '14px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 700,
          border: '1.5px solid #E07A3C'
        }}>
          <Sparkles size={20} color="#E07A3C" />
          <span>✓ Receptionist Host Desk settings updated successfully!</span>
        </div>
      )}

      {/* Hero Header */}
      <div style={{
        backgroundColor: '#0F2A1D',
        borderRadius: '24px',
        padding: '1.75rem 2rem',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: '0 10px 30px rgba(15, 42, 29, 0.2)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ backgroundColor: '#E07A3C', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 900, padding: '0.2rem 0.65rem', borderRadius: '20px', letterSpacing: '0.04em' }}>
              HOST CONTROL SUITE
            </span>
            <span style={{ color: '#A3C2B3', fontSize: '0.82rem', fontWeight: 600 }}>• Reception System Preferences</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#FFFFFF' }}>
            Receptionist & Host Desk Settings
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.88rem', color: '#C8E6D7', fontWeight: 500 }}>
            Configure live waitlist expiry rules, SMS/WhatsApp notification triggers, table turnover timers, and station audio alerts.
          </p>
        </div>

        <button
          onClick={handleSave}
          style={{
            backgroundColor: '#E07A3C',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '16px',
            padding: '0.85rem 1.6rem',
            fontSize: '0.92rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: '0 8px 20px rgba(224, 122, 60, 0.25)'
          }}
        >
          <Save size={18} />
          <span>Save Preferences</span>
        </button>
      </div>

      {/* Main Settings Grid */}
      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.5rem' }}>
        
        {/* CARD 1: WAITLIST QUEUE RULES */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '1.6rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#FFEDD5', padding: '0.6rem', borderRadius: '14px' }}>
              <Clock size={22} color="#C2410C" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D' }}>
                Waitlist Queue & Token Expiry Rules
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Expiration windows & wait time estimation</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>
                Called Token Expiration Window (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={tokenExpiryWindowMins}
                onChange={e => setTokenExpiryWindowMins(Number(e.target.value))}
                style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                Called tokens automatically flag for expiry/no-show after this time window.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>
                  Auto No-Show Window
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={autoNoShowMins}
                  onChange={e => setAutoNoShowMins(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                  Grace period after calling
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>
                  Avg. Wait / Party
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={avgWaitPerPartyMins}
                  onChange={e => setAvgWaitPerPartyMins(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                  Minutes per queue token
                </span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>
                Maximum Active Queue Capacity
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={maxQueueCapacity}
                onChange={e => setMaxQueueCapacity(Number(e.target.value))}
                style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                Stop issuing new tokens when active waiting list hits this threshold.
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: GUEST NOTIFICATIONS & MESSAGING */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '1.6rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#DCFCE7', padding: '0.6rem', borderRadius: '14px' }}>
              <Smartphone size={22} color="#166534" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D' }}>
                Guest Alerts & SMS Triggers
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Automated SMS & WhatsApp notifications</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2A1D' }}>Automated SMS Confirmation</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Send instant SMS when waitlist token is issued</div>
              </div>
              <input
                type="checkbox"
                checked={autoSmsEnabled}
                onChange={e => setAutoSmsEnabled(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#0F2A1D' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2A1D' }}>WhatsApp "Table Ready" Alert</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Send WhatsApp notification when token is CALLED</div>
              </div>
              <input
                type="checkbox"
                checked={whatsappAlertsEnabled}
                onChange={e => setWhatsappAlertsEnabled(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#0F2A1D' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2A1D' }}>Reservation Reminder SMS</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Send reminder 2 hours prior to reservation time</div>
              </div>
              <input
                type="checkbox"
                checked={resvReminderEnabled}
                onChange={e => setResvReminderEnabled(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#0F2A1D' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>
                Custom "Table Ready" Message Template
              </label>
              <textarea
                rows="3"
                value={smsTemplate}
                onChange={e => setSmsTemplate(e.target.value)}
                style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none', resize: 'vertical' }}
              />
            </div>

          </div>
        </div>

        {/* CARD 3: FLOOR PLAN & TURNOVER TIMERS */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '1.6rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#DBEAFE', padding: '0.6rem', borderRadius: '14px' }}>
              <Table2 size={22} color="#1E40AF" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D' }}>
                Floor Plan & Table Turnover Rules
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Busser cleaning timers & auto-merge settings</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>
                Busser Cleaning Turnover Timer (Minutes)
              </label>
              <input
                type="number"
                min="2"
                max="30"
                value={cleaningTurnoverMins}
                onChange={e => setCleaningTurnoverMins(Number(e.target.value))}
                style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                Tables in "Cleaning" status auto-expire to "Available" after this duration.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2A1D' }}>Large Party Table Merge Suggestions</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Auto-calculate adjacent table combinations for parties &gt; single table capacity</div>
              </div>
              <input
                type="checkbox"
                checked={autoMergeSuggestion}
                onChange={e => setAutoMergeSuggestion(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#0F2A1D' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>
                Live Floor Plan Auto-Refresh (Seconds)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={refreshIntervalSec}
                onChange={e => setRefreshIntervalSec(Number(e.target.value))}
                style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* CARD 4: HOST DESK DISPLAY & SOUND */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '1.6rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#FEF9C3', padding: '0.6rem', borderRadius: '14px' }}>
              <Volume2 size={22} color="#A16207" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D' }}>
                Host Desk Station Preferences
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Tablet sound chimes & screen behaviors</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2A1D' }}>Sound Chime on New Token</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Play audio chime when a walk-in token or online queue request arrives</div>
              </div>
              <input
                type="checkbox"
                checked={soundChimeEnabled}
                onChange={e => setSoundChimeEnabled(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#0F2A1D' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2A1D' }}>Auto-Advance Queue Tokens</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Automatically notify next token when a table becomes Available</div>
              </div>
              <input
                type="checkbox"
                checked={autoAdvanceTokens}
                onChange={e => setAutoAdvanceTokens(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#0F2A1D' }}
              />
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
