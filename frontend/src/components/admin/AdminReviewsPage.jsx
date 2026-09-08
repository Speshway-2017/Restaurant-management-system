import React, { useState, useEffect } from 'react';
import {
  Star, Search, CheckCircle2, Globe, Eye, EyeOff, Trash2, RefreshCw,
  MessageSquare, ThumbsUp, Sparkles, Filter, Award, TrendingUp, AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'featured', '5star', '4star', 'low'
  const [toastMsg, setToastMsg] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await api.getFeedbacks();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load customer feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleToggleLanding = async (id, currentVal) => {
    setTogglingId(id);
    const nextVal = !currentVal;
    try {
      await api.toggleFeedbackLanding(id, nextVal);
      setReviews(prev =>
        prev.map(r => (r._id === id ? { ...r, showOnLanding: nextVal } : r))
      );
      showToast(
        nextVal
          ? '✓ Review is now featured on the public Landing Page!'
          : 'Review removed from the public Landing Page.'
      );
      window.dispatchEvent(new Event('flavora_landing_reviews_updated'));
    } catch (err) {
      showToast('Failed to update landing page display status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this customer review?')) return;
    try {
      await api.deleteFeedback(id);
      setReviews(prev => prev.filter(r => r._id !== id));
      showToast('Review permanently deleted');
      window.dispatchEvent(new Event('flavora_landing_reviews_updated'));
    } catch (err) {
      showToast('Failed to delete review', 'error');
    }
  };

  // Metrics calculations
  const totalCount = reviews.length;
  const featuredCount = reviews.filter(r => r.showOnLanding).length;
  const avgRating = totalCount > 0
    ? (reviews.reduce((acc, r) => acc + (Number(r.overallRating) || 5), 0) / totalCount).toFixed(1)
    : '5.0';
  const fiveStarCount = reviews.filter(r => (Number(r.overallRating) || 5) === 5).length;
  const fiveStarPct = totalCount > 0 ? Math.round((fiveStarCount / totalCount) * 100) : 100;

  // Filter & search logic
  const filteredReviews = reviews.filter(r => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q ||
      (r.customerName && r.customerName.toLowerCase().includes(q)) ||
      (r.comments && r.comments.toLowerCase().includes(q)) ||
      (r.table && r.table.toLowerCase().includes(q)) ||
      (r.orderId && r.orderId.toLowerCase().includes(q));

    if (!matchesQuery) return false;

    const ratingVal = Number(r.overallRating) || 5;
    if (filterTab === 'featured') return r.showOnLanding;
    if (filterTab === '5star') return ratingVal === 5;
    if (filterTab === '4star') return ratingVal === 4;
    if (filterTab === 'low') return ratingVal <= 3;
    return true;
  });

  const renderStars = (val, size = 16) => {
    return (
      <div style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={size}
            color={star <= val ? '#F59E0B' : '#CBD5E1'}
            fill={star <= val ? '#F59E0B' : 'transparent'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="admin-subpage-container" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Toast notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 99999,
          backgroundColor: toastMsg.type === 'error' ? '#EF4444' : '#166534',
          color: '#FFFFFF',
          padding: '0.85rem 1.35rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          fontWeight: 700,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'fadeInUp 0.2s ease'
        }}>
          {toastMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-dashboard-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="page-breadcrumb-bar" style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '0.35rem' }}>
            <span>Admin</span>
            <span className="crumb-sep" style={{ margin: '0 0.4rem' }}>›</span>
            <span className="crumb-current" style={{ color: '#166534', fontWeight: 700 }}>Customer Reviews</span>
          </div>
          <h1 className="admin-page-title" style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0F2A1D', margin: 0 }}>
            Customer Reviews & Feedback
          </h1>
          <p className="admin-page-subtitle" style={{ fontSize: '0.88rem', color: '#64748B', marginTop: '0.25rem' }}>
            Moderate customer ratings and control which reviews appear on the public website landing page.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          disabled={loading}
          className="btn btn-outline"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.15rem',
            borderRadius: '12px',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #CBD5E1',
            color: '#1E293B',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
          <span>Refresh Reviews</span>
        </button>
      </div>

      {/* Metric Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.75rem'
      }}>
        {/* Card 1: Average Rating */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '1.35rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            backgroundColor: '#FEF3C7',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Star size={26} fill="#D97706" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Average Rating
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F2A1D', lineHeight: 1.1 }}>
              {avgRating} <span style={{ fontSize: '0.95rem', color: '#64748B', fontWeight: 600 }}>/ 5.0</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 700, marginTop: '0.2rem' }}>
              From {totalCount} verified diners
            </div>
          </div>
        </div>

        {/* Card 2: Featured on Landing Page */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '1.35rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            backgroundColor: '#DCFCE7',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Globe size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Public on Landing
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#166534', lineHeight: 1.1 }}>
              {featuredCount} <span style={{ fontSize: '0.95rem', color: '#64748B', fontWeight: 600 }}>Active</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 700, marginTop: '0.2rem' }}>
              Shown in website marquee
            </div>
          </div>
        </div>

        {/* Card 3: 5-Star Ratio */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '1.35rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Award size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              5-Star Satisfaction
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1E3A8A', lineHeight: 1.1 }}>
              {fiveStarPct}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: 700, marginTop: '0.2rem' }}>
              {fiveStarCount} five-star ratings
            </div>
          </div>
        </div>

        {/* Card 4: Total Reviews */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '1.35rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            backgroundColor: '#F3E8FF',
            color: '#7E22CE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <MessageSquare size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Feedbacks
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#581C87', lineHeight: 1.1 }}>
              {totalCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#7E22CE', fontWeight: 700, marginTop: '0.2rem' }}>
              Post-bill submissions
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '18px',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        border: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Search input */}
        <div style={{
          position: 'relative',
          width: '320px',
          maxWidth: '100%'
        }}>
          <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by customer, notes, or table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.4rem',
              borderRadius: '12px',
              border: '1.5px solid #CBD5E1',
              fontSize: '0.88rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All (${totalCount})` },
            { id: 'featured', label: `Featured on Landing (${featuredCount})` },
            { id: '5star', label: `5 Stars (${fiveStarCount})` },
            { id: '4star', label: '4 Stars' },
            { id: 'low', label: 'Needs Attention (≤3★)' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setFilterTab(p.id)}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '10px',
                border: filterTab === p.id ? '2px solid #166534' : '1px solid #CBD5E1',
                backgroundColor: filterTab === p.id ? '#F0FDF4' : '#FFFFFF',
                color: filterTab === p.id ? '#166534' : '#475569',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
          <RefreshCw size={36} className="spin-icon" color="#166534" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748B', fontWeight: 600 }}>Loading customer reviews from database...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
          <MessageSquare size={48} color="#CBD5E1" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.5rem' }}>
            No Reviews Found
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.88rem', maxWidth: '400px', margin: '0 auto' }}>
            {searchQuery || filterTab !== 'all'
              ? 'No reviews match your current search and filter criteria.'
              : 'Customer ratings submitted after bill payments will appear here in real-time.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem' }}>
          {filteredReviews.map((rev) => {
            const isFeatured = Boolean(rev.showOnLanding);
            const isProcessing = togglingId === rev._id;
            const dateFormatted = rev.createdAt
              ? new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Recent';

            return (
              <div
                key={rev._id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '1.35rem',
                  boxShadow: isFeatured ? '0 8px 25px -4px rgba(22, 101, 52, 0.12)' : '0 4px 15px rgba(0,0,0,0.03)',
                  border: isFeatured ? '2px solid #86EFAC' : '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  {/* Card Header: Guest Info & Rating */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: '#F0FDF4',
                        color: '#166534',
                        fontWeight: 900,
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #BBF7D0'
                      }}>
                        {(rev.customerName || 'G')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F2A1D', fontSize: '0.98rem' }}>
                          {rev.customerName || 'Guest Diner'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', gap: '0.5rem' }}>
                          <span>Table {rev.table || 'Dine-In'}</span>
                          <span>•</span>
                          <span>{dateFormatted}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {renderStars(Number(rev.overallRating) || 5, 16)}
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D97706', marginTop: '2px' }}>
                        {Number(rev.overallRating) || 5}.0 Stars
                      </div>
                    </div>
                  </div>

                  {/* Rating Breakdown Sub-metrics */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '10px',
                    marginBottom: '0.9rem',
                    fontSize: '0.72rem',
                    color: '#475569',
                    fontWeight: 700
                  }}>
                    <span>Taste: <strong style={{ color: '#0F2A1D' }}>{rev.foodRating || 5}★</strong></span>
                    <span>•</span>
                    <span>Service: <strong style={{ color: '#0F2A1D' }}>{rev.serviceRating || 5}★</strong></span>
                    <span>•</span>
                    <span>Ambience: <strong style={{ color: '#0F2A1D' }}>{rev.ambienceRating || 5}★</strong></span>
                  </div>

                  {/* Review comment */}
                  <div style={{
                    fontSize: '0.88rem',
                    color: '#334155',
                    fontStyle: rev.comments ? 'italic' : 'normal',
                    lineHeight: 1.5,
                    marginBottom: '1.25rem',
                    backgroundColor: '#FAFAFA',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    borderLeft: '3px solid #166534',
                    minHeight: '48px'
                  }}>
                    {rev.comments ? `"${rev.comments}"` : <span style={{ color: '#94A3B8' }}>No written feedback provided.</span>}
                  </div>
                </div>

                {/* Card Footer: Moderation Action Bar */}
                <div style={{
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}>
                  {/* Landing Page Status Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleToggleLanding(rev._id, isFeatured)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '10px',
                        border: isFeatured ? '1.5px solid #166534' : '1.5px solid #CBD5E1',
                        backgroundColor: isFeatured ? '#166534' : '#FFFFFF',
                        color: isFeatured ? '#FFFFFF' : '#475569',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.15s ease'
                      }}
                      title="Toggle visibility on website landing page marquee"
                    >
                      {isFeatured ? <Eye size={14} /> : <EyeOff size={14} />}
                      <span>{isFeatured ? 'Displayed on Landing' : 'Show on Landing'}</span>
                    </button>

                    {isFeatured && (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        backgroundColor: '#DCFCE7',
                        color: '#15803D',
                        padding: '0.2rem 0.45rem',
                        borderRadius: '6px'
                      }}>
                        LIVE
                      </span>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev._id)}
                    style={{
                      padding: '0.45rem',
                      borderRadius: '8px',
                      backgroundColor: '#FEE2E2',
                      border: 'none',
                      color: '#DC2626',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Delete review"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
