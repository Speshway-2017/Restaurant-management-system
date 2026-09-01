import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, Mail, CalendarDays, Heart, Sparkles, Plus, Edit, Check, X } from 'lucide-react';
import { api } from '../../services/api';

export default function ReceptionistGuestsPage() {
  const [guests, setGuests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [newPreferenceInput, setNewPreferenceInput] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchGuestsData = (query = '') => {
    api.getGuests(query).then(res => {
      const dataList = Array.isArray(res) ? res : (res && res.data ? res.data : []);
      setGuests(dataList);
    }).catch(err => console.warn('Fetch guests warning:', err.message));
  };

  useEffect(() => {
    fetchGuestsData(searchQuery);
  }, [searchQuery]);

  const handleAddPreference = async () => {
    if (!selectedGuest || !newPreferenceInput.trim()) return;
    const cleanPref = newPreferenceInput.trim();
    const updatedPrefs = [...(selectedGuest.preferences || []), cleanPref];

    try {
      const res = await api.updateGuestPreferences(selectedGuest._id, { preferences: updatedPrefs });
      if (res.success) {
        showToast(`Added preference "${cleanPref}" for ${selectedGuest.name}!`);
        setSelectedGuest(res.data);
        setNewPreferenceInput('');
        fetchGuestsData(searchQuery);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Toast Banner */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '25px',
          backgroundColor: '#0F2A1D',
          color: '#FFFFFF',
          padding: '0.85rem 1.4rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontWeight: 700,
          border: '1px solid #E07A3C'
        }}>
          <Sparkles size={18} color="#E07A3C" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '1.1rem 1.4rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
            Guest Profile Lookup & Recognition
          </h2>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
            Repeat customer recognition, known preferences & special occasion tagging
          </span>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', maxWidth: '320px', width: '100%' }}>
          <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by Name or Phone Number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.85rem 0.55rem 2.4rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.84rem', outline: 'none' }}
          />
        </div>
      </div>

      {/* Guest Roster Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.1rem' }}>
        {guests.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px dashed #CBD5E1', color: '#64748B' }}>
            <Users size={32} color="#94A3B8" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>No guest profiles found</div>
            <div style={{ fontSize: '0.78rem' }}>Search for another phone number or seat a walk-in guest</div>
          </div>
        ) : (
          guests.map(g => (
            <div
              key={g._id}
              onClick={() => setSelectedGuest(g)}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid #E2E8F0',
                padding: '1.2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0F2A1D' }}>{g.name}</h3>
                  <span style={{ fontSize: '0.76rem', color: '#64748B' }}>📞 {g.phone}</span>
                </div>

                <span style={{ fontSize: '0.7rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: '20px', backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' }}>
                  {g.visitCount > 1 ? `⭐ Returning Guest (${g.visitCount} Visits)` : '🆕 1st Visit'}
                </span>
              </div>

              {/* Preferences list */}
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Known Preferences</span>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                  {(g.preferences && g.preferences.length > 0 ? g.preferences : ['Window Seating', 'Standard']).map((p, idx) => (
                    <span key={idx} style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#F1F5F9', color: '#334155', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Special Occasion tags */}
              {g.specialOccasions && g.specialOccasions.length > 0 && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {g.specialOccasions.map((occ, idx) => (
                    <span key={idx} style={{ fontSize: '0.7rem', fontWeight: 800, backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                      🎉 {occ.occasion}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Guest Details & Preferences Modal */}
      {selectedGuest && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 24, 19, 0.65)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', maxWidth: '480px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ backgroundColor: '#0F2A1D', padding: '1.25rem', color: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>{selectedGuest.name} Profile</h3>
                <span style={{ fontSize: '0.74rem', color: '#A3C2B3' }}>📞 {selectedGuest.phone}</span>
              </div>
              <button onClick={() => setSelectedGuest(null)} style={{ border: 'none', background: 'transparent', color: '#FFF', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800 }}>VISIT COUNT</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F2A1D' }}>{selectedGuest.visitCount} Visits</div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800 }}>LAST VISIT</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F2A1D', marginTop: '0.2rem' }}>
                    {new Date(selectedGuest.lastVisitDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Add New Preference */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Add Customer Preference</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="e.g. Quiet corner table"
                    value={newPreferenceInput}
                    onChange={e => setNewPreferenceInput(e.target.value)}
                    style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none' }}
                  />
                  <button
                    onClick={handleAddPreference}
                    style={{ backgroundColor: '#0F2A1D', color: '#FFF', border: 'none', padding: '0.55rem 0.9rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Add
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button onClick={() => setSelectedGuest(null)} style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 700 }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
