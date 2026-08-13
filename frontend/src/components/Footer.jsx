import React from 'react';
import { Phone, Mail, MapPin, Clock, Facebook, Linkedin, Twitter, Youtube } from 'lucide-react';

export default function Footer({ setActivePage }) {
  const handleNavClick = (pageId) => {
    if (setActivePage) setActivePage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

          {/* Column 4: Contact Us */}
          <div className="footer-col contact-col">
            <h4 className="footer-col-title">CONTACT US</h4>
            <ul className="footer-contact-list">
              <li>
                <Phone size={16} className="contact-icon" />
                <span>+91 40 2355 7890</span>
              </li>
              <li>
                <Mail size={16} className="contact-icon" />
                <span>contact@flavorakitchen.in</span>
              </li>
              <li>
                <MapPin size={16} className="contact-icon" />
                <span>Hyderabad, Telangana, India</span>
              </li>
              <li>
                <Clock size={16} className="contact-icon" />
                <span>Mon - Sun: 10:00 AM - 11:00 PM</span>
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
