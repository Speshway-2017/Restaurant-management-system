import React, { useState } from 'react';
import { X, CheckCircle2, Calendar, Phone, Mail, Building, MapPin, Send } from 'lucide-react';

export default function DemoModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    restaurant: '',
    city: '',
    preferredDate: '',
    preferredTime: 'Morning (10 AM - 1 PM)'
  });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-neutral-200)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar size={22} style={{ color: 'var(--color-secondary)' }} />
            <h3 className="text-h2" style={{ color: 'var(--color-primary)', fontSize: '1.3rem' }}>
              Schedule Free On-Site / Virtual Demo
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-700)' }}>
            <X size={22} />
          </button>
        </div>

        {submitted ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <CheckCircle2 size={52} style={{ color: 'var(--color-success)', margin: '0 auto 1rem auto' }} />
            <h4 className="text-h2" style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
              Demo Booking Confirmed!
            </h4>
            <p className="text-body" style={{ color: 'var(--color-neutral-700)', marginBottom: '1.5rem' }}>
              Thank you <strong>{formData.name}</strong>. Our regional onboarding expert for <strong>{formData.city || 'your area'}</strong> will reach out on <strong>{formData.phone}</strong> to confirm your slot.
            </p>
            <button onClick={onClose} className="btn btn-primary">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Chef Sanjay Kapoor"
                className="form-input" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input 
                  type="tel" 
                  required
                  placeholder="+91 98765 43210"
                  className="form-input" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Restaurant Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Royal Punjab Diner"
                  className="form-input" 
                  value={formData.restaurant}
                  onChange={(e) => setFormData({...formData, restaurant: e.target.value})}
                />
              </div>
            </div>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Bengaluru"
                  className="form-input" 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Time Slot</label>
                <select 
                  className="form-select"
                  value={formData.preferredTime}
                  onChange={(e) => setFormData({...formData, preferredTime: e.target.value})}
                >
                  <option>Morning (10 AM - 1 PM)</option>
                  <option>Afternoon (2 PM - 5 PM)</option>
                  <option>Evening (6 PM - 9 PM)</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-secondary btn-lg" style={{ width: '100%' }}>
                <Send size={18} />
                <span>Confirm Demo Booking</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
