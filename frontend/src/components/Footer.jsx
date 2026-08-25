import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Clock, Facebook, Linkedin, Twitter, Youtube } from 'lucide-react';

export default function Footer({ setActivePage }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_restaurant_settings');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    const handleSettingsSync = () => {
      try {
        const saved = localStorage.getItem('flavora_restaurant_settings');
        setSettings(saved ? JSON.parse(saved) : {});
      } catch (e) {}
    };
    window.addEventListener('flavora_settings_updated', handleSettingsSync);
    return () => window.removeEventListener('flavora_settings_updated', handleSettingsSync);
  }, []);

  const handleNavClick = (pageId) => {
    if (setActivePage) setActivePage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusInfo = () => {
    const statusOverride = settings.restaurantStatus || 'open';
    if (statusOverride === 'closed') {
      return { label: '🔴 CLOSED NOW', bg: '#451A1A', color: '#FCA5A5', border: '#7F1D1D' };
    }
    if (statusOverride === 'force_open') {
      return { label: '🟢 OPEN NOW', bg: '#064E3B', color: '#6EE7B7', border: '#047857' };
    }

    const now = new Date();
    const day = now.getDay();
    const isWeekend = (day === 0 || day === 6);
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const openMin = isWeekend ? 600 : 660; // 10:00 AM (600) vs 11:00 AM (660)
    const closeMin = isWeekend ? 1440 : 1320; // 12:00 AM (1440) vs 10:00 PM (1320)

    const isOpen = currentMins >= openMin && currentMins < closeMin;
    return isOpen
      ? { label: '🟢 OPEN NOW', bg: '#064E3B', color: '#6EE7B7', border: '#047857' }
      : { label: '🔴 CLOSED NOW', bg: '#451A1A', color: '#FCA5A5', border: '#7F1D1D' };
  };

  const statusInfo = getStatusInfo();

  return (
    <footer className="footer-redesign">
      <div className="footer-container">
        {/* Top 4-Column Grid */}
        <div className="footer-grid">
          {/* Column 1: Brand Info & Socials */}
          <div className="footer-col brand-col">
            <div className="footer-brand-header">
              <img 
                src="/logo.png" 
                alt="Flavora Kitchen Logo" 
                className="footer-logo-img"
              />
              <div className="footer-brand-title">
                <span style={{ color: 'var(--color-secondary)' }}>Flavora </span>
                <span style={{ color: '#FFFFFF' }}>Kitchen</span>
              </div>
            </div>

            <p className="footer-bio">
              A next-generation restaurant management platform designed to help F&B businesses streamline operations, improve efficiency, and drive growth.
            </p>

            <div className="footer-socials">
              <a href="#facebook" onClick={(e) => e.preventDefault()} aria-label="Facebook" className="social-icon-btn">
                <Facebook size={17} />
              </a>
              <a href="#linkedin" onClick={(e) => e.preventDefault()} aria-label="LinkedIn" className="social-icon-btn">
                <Linkedin size={17} />
              </a>
              <a href="#twitter" onClick={(e) => e.preventDefault()} aria-label="Twitter" className="social-icon-btn">
                <Twitter size={17} />
              </a>
              <a href="#youtube" onClick={(e) => e.preventDefault()} aria-label="YouTube" className="social-icon-btn">
                <Youtube size={17} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links (Navbar Pages) */}
          <div className="footer-col">
            <h4 className="footer-col-title">QUICK LINKS</h4>
            <ul className="footer-link-list">
              <li><button onClick={() => handleNavClick('home')}>Home</button></li>
              <li><button onClick={() => handleNavClick('about')}>About Us</button></li>
              <li><button onClick={() => handleNavClick('features')}>Features</button></li>
              <li><button onClick={() => handleNavClick('gallery')}>Gallery</button></li>
              <li><button onClick={() => handleNavClick('blogs')}>Blogs</button></li>
            </ul>
          </div>

          {/* Column 3: Explore Pages (Navbar Pages) */}
          <div className="footer-col">
            <h4 className="footer-col-title">EXPLORE</h4>
            <ul className="footer-link-list">
              <li><button onClick={() => handleNavClick('menu')}>Menu</button></li>
              <li><button onClick={() => handleNavClick('offer')}>Offer</button></li>
              <li><button onClick={() => handleNavClick('contact')}>Contact Us</button></li>
              <li><button onClick={() => handleNavClick('login')}>Login</button></li>
            </ul>
          </div>

          {/* Column 4: Contact Us & Timings */}
          <div className="footer-col contact-col">
            <h4 className="footer-col-title">CONTACT US & TIMINGS</h4>
            <ul className="footer-contact-list">
              <li>
                <Phone size={16} className="contact-icon" style={{ flexShrink: 0 }} />
                <span>+91 40 2355 7890</span>
              </li>
              <li>
                <Mail size={16} className="contact-icon" style={{ flexShrink: 0 }} />
                <span>contact@flavorakitchen.in</span>
              </li>
              <li>
                <MapPin size={16} className="contact-icon" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Plot No. 42, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033</span>
              </li>
              <li style={{ alignItems: 'flex-start', marginTop: '0.4rem' }}>
                <Clock size={16} className="contact-icon" style={{ marginTop: '3px', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ fontSize: '0.84rem' }}>
                    <strong style={{ color: '#F2C14E' }}>Mon – Fri:</strong> {settings.weekdayHours || '11:00 AM – 10:00 PM'}
                  </div>
                  <div style={{ fontSize: '0.84rem' }}>
                    <strong style={{ color: '#F2C14E' }}>Sat – Sun:</strong> {settings.weekendHours || '10:00 AM – 12:00 AM'}
                  </div>
                  <div style={{ marginTop: '0.35rem' }}>
                    <span style={{
                      backgroundColor: statusInfo.bg,
                      color: statusInfo.color,
                      border: `1px solid ${statusInfo.border}`,
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      letterSpacing: '0.03em',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div className="copyright-text">
            © 2026 Flavora Kitchen. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
