import React from 'react';
import { LogIn } from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Main Navigation Header */}
      <header className="navbar-header">
        <div className="navbar-container">
          {/* Brand Logo Image + Text */}
          <a href="#home" onClick={(e) => { e.preventDefault(); handleNavClick('home'); }} className="brand-logo-link">
            <img
              src="/logo.png"
              alt="Flavora Kitchen Logo"
              style={{ height: '42px', width: 'auto', display: 'block', objectFit: 'contain', borderRadius: '5px' }}
            />
            <div className="brand-text-logo">
              <span className="brand-favora">Flavora</span>
              <span className="brand-kitchen">Kitchen</span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav>
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

          {/* Highlighted Login CTA Button */}
          <div className="nav-actions">
            <button
              onClick={() => handleNavClick('login')}
              className="btn btn-book-now"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <LogIn size={16} />
              <span>LOGIN</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
