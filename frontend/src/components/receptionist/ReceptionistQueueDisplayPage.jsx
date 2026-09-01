import React, { useState, useEffect } from 'react';
import { Tv, Clock, Users, Sparkles, Volume2 } from 'lucide-react';
import { api } from '../../services/api';
import { useRestaurantBranding } from '../../context/RestaurantBrandingContext';

export default function ReceptionistQueueDisplayPage() {
  const { brandName, brandLogo } = useRestaurantBranding();
  const [waitlist, setWaitlist] = useState([]);
  const [currentTime, setCurrentTime] = useState('');

  const fetchQueueData = () => {
    api.getWaitlist().then(res => {
      if (res.success && res.data) {
        setWaitlist(res.data);
      }
    }).catch(() => {});
  };

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const calledTokens = waitlist.filter(w => w.status === 'CALLED');
  const waitingTokens = waitlist.filter(w => w.status === 'WAITING');

  const nowServing = calledTokens.length > 0 ? calledTokens[0] : null;
  const nextInQueue = waitingTokens.slice(0, 4);

  return (
    <div style={{
      backgroundColor: '#0F2A1D',
      color: '#FFFFFF',
      borderRadius: '24px',
      padding: '2.5rem',
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Background Accent Glow */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(224,122,60,0.2) 0%, rgba(15,42,29,0) 70%)',
        pointerEvents: 'none'
      }} />

      {/* Header Lockup */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={brandLogo} alt="Logo" onError={e => { e.target.src = '/logo.png'; }} style={{ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: '#FFF', padding: '4px' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#FFFFFF' }}>
              {brandName} Queue Display
            </h1>
            <span style={{ fontSize: '0.85rem', color: '#A3C2B3', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700 }}>
              Live Customer Reception Screen
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: 'rgba(255,255,255,0.08)', padding: '0.6rem 1.2rem', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.15)' }}>
          <Clock size={20} color="#E07A3C" />
          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.05em' }}>{currentTime || '14:35:00'}</span>
        </div>
      </div>

      {/* Center Main Stage Display */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', margin: '2rem 0' }}>
        
        {/* NOW SERVING (Prominent Call Out Box) */}
        <div style={{
          backgroundColor: 'rgba(224, 122, 60, 0.15)',
          border: '3px solid #E07A3C',
          borderRadius: '24px',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#E07A3C', color: '#FFFFFF', padding: '0.4rem 1.2rem', borderRadius: '20px', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            <Volume2 size={18} />
            <span>NOW SERVING</span>
          </div>

          {nowServing ? (
            <>
              <div style={{ fontSize: '5rem', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {nowServing.tokenNum}
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFEDD5', marginTop: '1rem' }}>
                {nowServing.guestName}
              </div>
              <div style={{ fontSize: '1rem', color: '#A3C2B3', marginTop: '0.3rem', fontWeight: 700 }}>
                👥 {nowServing.partySize} Guests • Please proceed to Host Desk
              </div>
            </>
          ) : (
            <div style={{ color: '#A3C2B3', fontSize: '1.2rem', fontWeight: 700, padding: '2rem' }}>
              Host Desk is ready to serve next guest.
            </div>
          )}
        </div>

        {/* NEXT IN QUEUE */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#A3C2B3', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            NEXT IN QUEUE
          </h3>

          {nextInQueue.length === 0 ? (
            <div style={{ color: '#64748B', fontSize: '0.95rem', fontWeight: 700, textAlign: 'center', padding: '2rem' }}>
              No upcoming tokens waiting.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {nextInQueue.map(token => (
                <div
                  key={token._id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '16px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ backgroundColor: '#E07A3C', color: '#FFFFFF', padding: '0.4rem 0.85rem', borderRadius: '10px', fontWeight: 900, fontSize: '1.2rem' }}>
                      {token.tokenNum}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFFFFF' }}>{token.guestName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#A3C2B3', fontWeight: 600 }}>👥 {token.partySize} Guests</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.78rem', color: '#FEF08A', fontWeight: 800 }}>Est. Wait</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FFFFFF' }}>{token.estimatedWaitMins} min</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Footer Banner */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#A3C2B3', fontSize: '0.85rem' }}>
        <span>Thank you for dining with Flavora Kitchen!</span>
        <span>Please listen for your token call or check your mobile SMS/WhatsApp.</span>
      </div>

    </div>
  );
}
