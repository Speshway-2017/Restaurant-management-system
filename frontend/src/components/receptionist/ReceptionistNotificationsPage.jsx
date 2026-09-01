import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, Clock, Send } from 'lucide-react';

export default function ReceptionistNotificationsPage() {
  const notifications = [
    { id: 1, type: 'ALERT', title: 'Reservation Arriving Soon', desc: 'Ramana booking for T-08 is scheduled in 15 minutes (19:30).', time: 'Just Now' },
    { id: 2, type: 'SUCCESS', title: 'Table Ready for Seating', desc: 'Waiter completed cleaning T-04! Table is now Available.', time: '5 mins ago' },
    { id: 3, type: 'SMS', title: 'SMS Notification Sent', desc: 'Booking confirmation SMS & WhatsApp delivered to Ramesh V. (+91 98765 88990).', time: '12 mins ago' },
    { id: 4, type: 'WARNING', title: 'Token W-019 Expiration Notice', desc: 'Token W-019 called 10 minutes ago. Expiry window ending soon.', time: '20 mins ago' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.1rem 1.4rem', border: '1px solid #E2E8F0' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
          Reception Notification Center
        </h2>
        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
          Real-time system event notifications & customer message logs
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {notifications.map(n => (
          <div
            key={n.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '1.1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}
          >
            <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: n.type === 'ALERT' ? '#FEF3C7' : n.type === 'SUCCESS' ? '#DCFCE7' : '#EFF6FF' }}>
              {n.type === 'ALERT' ? <AlertTriangle size={20} color="#D97706" /> : n.type === 'SUCCESS' ? <CheckCircle2 size={20} color="#166534" /> : <Send size={20} color="#2563EB" />}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F2A1D' }}>{n.title}</h4>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>{n.time}</span>
              </div>
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.82rem', color: '#475569' }}>{n.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
