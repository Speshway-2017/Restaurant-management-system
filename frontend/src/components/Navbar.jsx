import React, { useState } from 'react';
import { LogIn, Menu, X, Sparkles } from 'lucide-react';
import MagneticButton from './MagneticButton';
import { useRestaurantBranding } from '../context/RestaurantBrandingContext';

export default function Navbar({ activePage, setActivePage }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { branding, brandName, brandLogo } = useRestaurantBranding();

  const isBannerVisible = !isDismissed && branding && branding.announcementEnabled !== false && Boolean(branding.announcementMessage || branding.messageText || branding.message || branding.announcementBadge || branding.badgeText);
  const bannerBg = branding?.announcementBg || branding?.bannerBg || branding?.backgroundColor || '#1E4636';
  const bannerTextColor = branding?.announcementTextColor || branding?.bannerTextColor || branding?.textColor || '#FFFFFF';
  const bannerBadge = branding?.announcementBadge || branding?.badgeText || 'PROMO OFFER';
  const bannerMsg = branding?.announcementMessage || branding?.messageText || branding?.message || '';
  const bannerBtn = branding?.announcementButtonText || branding?.ctaText || branding?.buttonLabel || '';
  const bannerTarget = branding?.announcementTarget || branding?.buttonTargetTab || 'offer';

  const nameParts = brandName.trim().split(' ');
  const firstNamePart = nameParts[0] || 'Flavora';
  const restNamePart = nameParts.slice(1).join(' ');

  const navItems = [
    { id: 'home', label: 'HOME' },
    { id: 'about', label: 'ABOUT US' },
    { id: 'features', label: 'FEATURES' },
    { id: 'gallery', label: 'GALLERY' },
    { id: 'blogs', label: 'BLOGS' },
    { id: 'menu', label: 'MENU' },
    { id: 'offer', label: 'OFFER' },
    { id: 'contact', label: 'CONTACT US' },
  ];

  const resolveTargetPage = (target) => {
    if (!target) return 'offer';
    const clean = String(target).toLowerCase().trim();
    if (clean === 'offers' || clean === 'offer' || clean === 'deal' || clean === 'deals') return 'offer';
    if (clean === 'blog' || clean === 'blogs') return 'blogs';
    if (clean === 'galleries' || clean === 'gallery') return 'gallery';
    if (clean === 'feature' || clean === 'features') return 'features';
    if (clean === 'contacts' || clean === 'contact') return 'contact';
    if (clean === 'menus' || clean === 'menu') return 'menu';
    if (clean === 'home') return 'home';
    return clean;
  };

  const handleNavClick = (pageId) => {
    const targetPage = resolveTargetPage(pageId);
    setActivePage(targetPage);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Main Navigation Header */}
      <header 
        className="navbar-header"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 99999,
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid #EAE3D2',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}
      >
        <div className="navbar-container">
          {/* Brand Logo Image + Text */}
          <a href="#home" onClick={(e) => { e.preventDefault(); handleNavClick('home'); }} className="brand-logo-link">
            <img
              src={brandLogo}
              alt={`${brandName} Logo`}
              onError={(e) => { e.target.src = '/logo.png'; }}
              style={{ height: '32px', width: 'auto', display: 'block', objectFit: 'contain', borderRadius: '4px' }}
            />
            <div className="brand-text-logo" style={{ display: 'flex', gap: '0.2rem', fontSize: '1.15rem' }}>
              <span className="brand-favora">{firstNamePart}</span>
              {restNamePart && <span className="brand-kitchen">{restNamePart}</span>}
            </div>
          </a>

          {/* Navigation Links (Desktop) */}
          <nav className="desktop-nav">
            <ul className="nav-links">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`nav-link ${activePage === item.id ? 'active' : ''}`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right Actions & Mobile Hamburger */}
          <div className="nav-actions">
            {activePage !== 'menu' && (
              <MagneticButton
                onClick={() => handleNavClick('login')}
                variant="secondary"
                style={{ padding: '0.45rem 1.1rem', fontSize: '0.82rem' }}
              >
                <LogIn size={15} />
                <span>LOGIN</span>
              </MagneticButton>
            )}

            <button
              className="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={22} color="#FFFFFF" /> : <Menu size={22} color="#FFFFFF" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <ul className="mobile-nav-list">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`mobile-nav-link ${activePage === item.id ? 'active' : ''}`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      {/* Sticky Top Promo Announcement Bar (Appears below Navbar on all landing pages) */}
      {isBannerVisible && (
        <div
          className="global-promo-sticky-banner"
          style={{
            position: 'fixed',
            top: '49px',
            left: 0,
            right: 0,
            width: '100%',
            zIndex: 99998,
            backgroundColor: bannerBg,
            color: bannerTextColor,
            padding: '0.45rem 1.25rem',
            fontSize: '0.84rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexGrow: 1, flexWrap: 'wrap', textAlign: 'center' }}>
            {bannerBadge && (
              <span
                style={{
                  backgroundColor: '#F2C14E',
                  color: '#0F2A1D',
                  padding: '0.15rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.12)'
                }}
              >
                {bannerBadge}
              </span>
            )}

            <span style={{ lineHeight: '1.4' }}>{bannerMsg}</span>

            {bannerBtn && (
              <button
                type="button"
                onClick={() => {
                  if (bannerTarget) {
                    handleNavClick(bannerTarget);
                  }
                }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.4)',
                  padding: '0.2rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.color = bannerBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = '#FFFFFF'; }}
              >
                <span>{bannerBtn}</span>
                <Sparkles size={12} />
              </button>
            )}
          </div>

          {/* Red Dismiss (Cross) Button at the end */}
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            title="Dismiss Announcement"
            aria-label="Dismiss Announcement"
            style={{
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#DC2626'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#EF4444'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <X size={14} color="#FFFFFF" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </>
  );
}
