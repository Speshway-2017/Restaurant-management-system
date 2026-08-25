import React, { useState } from 'react';
import { LogIn, Menu, X } from 'lucide-react';
import MagneticButton from './MagneticButton';

export default function Navbar({ activePage, setActivePage }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
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
              src="/logo.png"
              alt="Flavora Kitchen Logo"
              style={{ height: '42px', width: 'auto', display: 'block', objectFit: 'contain', borderRadius: '5px' }}
            />
            <div className="brand-text-logo" style={{ display: 'flex', gap: '0.3rem' }}>
              <span className="brand-favora">Flavora</span>
              <span className="brand-kitchen">Kitchen</span>
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
    </>
  );
}
