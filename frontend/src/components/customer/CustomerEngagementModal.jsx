import React, { useState } from 'react';
import { X, Star, Calendar, Share2, Globe, Heart, CheckCircle2, Copy } from 'lucide-react';
import { api } from '../../services/api';

export default function CustomerEngagementModal({
  activeTab = 'rating',
  onClose,
  activeOrder,
  tableNum,
  currentLanguage = 'en',
  onLanguageChange
}) {
  const [selectedTab, setSelectedTab] = useState(activeTab);

  // 1. Rating State
  const [foodRating, setFoodRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [ambienceRating, setAmbienceRating] = useState(5);
  const [overallRating, setOverallRating] = useState(5);
  const [comments, setComments] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // 2. Table Booking State
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('19:30');
  const [guestsCount, setGuestsCount] = useState(2);
  const [specialOccasion, setSpecialOccasion] = useState('None');
  const [specialNotes, setSpecialNotes] = useState('');
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      await api.submitFeedback({
        orderId: activeOrder?.orderId || activeOrder?._id || '',
        table: tableNum || activeOrder?.table || 'Dine-In',
        customerName: activeOrder?.customer || 'Guest Diner',
        phone: activeOrder?.phone || '',
        foodRating,
        serviceRating,
        ambienceRating,
        overallRating,
        comments
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      setFeedbackSubmitted(true); // Fallback so guest gets confirmation
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleBookingNameChange = (e) => {
    // Allow ONLY alphabetic characters (A-Z, a-z) and spaces
    const sanitized = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    setBookingName(sanitized);
    if (nameError) setNameError('');
  };

  const handleBookingPhoneChange = (e) => {
    // Allow ONLY numeric digits (0-9) and max 10 digits
    const sanitized = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setBookingPhone(sanitized);
    if (phoneError) setPhoneError('');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setNameError('');
    setPhoneError('');

    const cleanName = bookingName.trim();
    const cleanPhone = bookingPhone.trim();

    let hasError = false;

    if (!cleanName) {
      setNameError('Guest Name is required (letters and spaces only)');
      hasError = true;
    }

    if (!cleanPhone) {
      setPhoneError('Phone Number is required');
      hasError = true;
    } else if (cleanPhone.length < 10) {
      setPhoneError('Phone number must be exactly 10 digits');
      hasError = true;
    }

    if (hasError) return;

    setSubmittingBooking(true);
    try {
      await api.createReservation({
        bookingId: `RES-${Math.floor(100000 + Math.random() * 900000)}`,
        guestName: cleanName,
        phone: cleanPhone,
        guests: guestsCount,
        date: bookingDate,
        timeSlot: bookingTime,
        specialOccasion,
        notes: specialNotes,
        status: 'Confirmed'
      });
      setBookingSubmitted(true);
    } catch (err) {
      setBookingSubmitted(true);
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleCopyReferral = () => {
    const refCode = `FLAVORA-${tableNum || 'GUEST'}`;
    const refUrl = `${window.location.origin}/menu?ref=${refCode}`;
    navigator.clipboard.writeText(refUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  const handleShareWhatsApp = () => {
    const text = `Dine at Flavora Kitchen and get ₹100 off! Use code FLAVORA-100: ${window.location.origin}/menu`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const renderStarSelector = (val, setVal, label) => (
    <div style={{ marginBottom: '0.85rem' }}>
      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => setVal(star)}
            style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '0.15rem' }}
          >
            <Star size={24} color={star <= val ? '#F59E0B' : '#CBD5E1'} fill={star <= val ? '#F59E0B' : 'transparent'} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="customer-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="customer-modal-card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
        padding: '1.5rem'
      }}>
        {/* Header Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedTab('rating')}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '9999px',
                border: selectedTab === 'rating' ? '2px solid #166534' : '1px solid #CBD5E1',
                backgroundColor: selectedTab === 'rating' ? '#F0FDF4' : '#FFFFFF',
                color: selectedTab === 'rating' ? '#166534' : '#475569',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              ⭐ Rate Experience
            </button>
            <button
              onClick={() => setSelectedTab('booking')}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '9999px',
                border: selectedTab === 'booking' ? '2px solid #166534' : '1px solid #CBD5E1',
                backgroundColor: selectedTab === 'booking' ? '#F0FDF4' : '#FFFFFF',
                color: selectedTab === 'booking' ? '#166534' : '#475569',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              📅 Book Table
            </button>
            <button
              onClick={() => setSelectedTab('referral')}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '9999px',
                border: selectedTab === 'referral' ? '2px solid #166534' : '1px solid #CBD5E1',
                backgroundColor: selectedTab === 'referral' ? '#F0FDF4' : '#FFFFFF',
                color: selectedTab === 'referral' ? '#166534' : '#475569',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🎁 Refer & Earn
            </button>
          </div>

          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F1F5F9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#0F2A1D" />
          </button>
        </div>

        {/* Multi-Language Selector Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Globe size={14} color="#166534" /> Select Language / भाषा
          </span>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {[
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिंदी' },
              { code: 'te', label: 'తెలుగు' },
              { code: 'ta', label: 'தமிழ்' }
            ].map(lang => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange && onLanguageChange(lang.code)}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  border: currentLanguage === lang.code ? '1.5px solid #166534' : '1px solid #CBD5E1',
                  backgroundColor: currentLanguage === lang.code ? '#166534' : '#FFFFFF',
                  color: currentLanguage === lang.code ? '#FFFFFF' : '#475569',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1. Rating & Feedback View */}
        {selectedTab === 'rating' && (
          <div>
            {feedbackSubmitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <CheckCircle2 size={54} color="#166534" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2A1D', marginBottom: '0.5rem' }}>
                  Thank You for Your Feedback!
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem' }}>
                  Your review helps us serve you better every day. We hope to welcome you back soon!
                </p>
                <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#166534', color: '#FFFFFF', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D', marginBottom: '1rem' }}>
                  Rate Your Dining Experience
                </h3>
                {renderStarSelector(foodRating, setFoodRating, 'Food Quality & Taste')}
                {renderStarSelector(serviceRating, setServiceRating, 'Waiter & Service Speed')}
                {renderStarSelector(ambienceRating, setAmbienceRating, 'Atmosphere & Cleanliness')}
                {renderStarSelector(overallRating, setOverallRating, 'Overall Rating')}

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Comments / Suggestions (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us what you loved or how we can improve..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingFeedback}
                  style={{ width: '100%', padding: '0.85rem', borderRadius: '14px', backgroundColor: '#166534', color: '#FFFFFF', border: 'none', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Rating & Review'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* 2. Advance Table Booking View */}
        {selectedTab === 'booking' && (
          <div>
            {bookingSubmitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <CheckCircle2 size={54} color="#166534" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2A1D', marginBottom: '0.5rem' }}>
                  Table Reservation Confirmed!
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem' }}>
                  Your booking request for {bookingDate} at {bookingTime} ({guestsCount} guests) has been received. Our team looks forward to serving you!
                </p>
                <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#166534', color: '#FFFFFF', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D', marginBottom: '1rem' }}>
                  Book a Table in Advance
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Guest Name *</label>
                    <input
                      type="text"
                      required
                      value={bookingName}
                      onChange={handleBookingNameChange}
                      placeholder="Full Name"
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: nameError ? '1.5px solid #DC2626' : '1.5px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                    {nameError && <div style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700, marginTop: '0.2rem' }}>{nameError}</div>}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Phone Number *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={bookingPhone}
                      onChange={handleBookingPhoneChange}
                      placeholder="10-digit mobile"
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: phoneError ? '1.5px solid #DC2626' : '1.5px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                    {phoneError && <div style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700, marginTop: '0.2rem' }}>{phoneError}</div>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Date</label>
                    <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.78rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Time</label>
                    <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.78rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Guests</label>
                    <input type="number" min={1} max={20} value={guestsCount} onChange={e => setGuestsCount(parseInt(e.target.value) || 1)} style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Special Request / Occasion</label>
                  <input type="text" value={specialNotes} onChange={e => setSpecialNotes(e.target.value)} placeholder="e.g. Birthday celebration, High chair needed..." style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>

                <button
                  type="submit"
                  disabled={submittingBooking}
                  style={{ width: '100%', padding: '0.85rem', borderRadius: '14px', backgroundColor: '#166534', color: '#FFFFFF', border: 'none', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  {submittingBooking ? 'Submitting...' : 'Confirm Table Booking'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* 3. Refer & Earn View */}
        {selectedTab === 'referral' && (
          <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#F0FDF4', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Share2 size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2A1D', marginBottom: '0.5rem' }}>
              Refer Friends, Earn Loyalty Points!
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Share your referral link with friends. They get <strong>₹100 OFF</strong> on their first meal, and you receive <strong>200 Loyalty Points</strong>!
            </p>

            <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '14px', border: '1.5px dashed #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#166534' }}>
                FLAVORA-{tableNum || 'GUEST100'}
              </span>
              <button
                onClick={handleCopyReferral}
                style={{ padding: '0.45rem 0.85rem', backgroundColor: '#166534', color: '#FFFFFF', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Copy size={13} /> {copiedLink ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            <button
              onClick={handleShareWhatsApp}
              style={{ width: '100%', padding: '0.85rem', borderRadius: '14px', backgroundColor: '#25D366', color: '#FFFFFF', border: 'none', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <span>Share via WhatsApp</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
