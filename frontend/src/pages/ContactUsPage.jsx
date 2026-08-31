import React, { useState } from 'react';
import { 
  Mail, Phone, MapPin, Send, HelpCircle, CheckCircle2, 
  Clock, Zap, Award, ShieldCheck, Building2, Headphones, 
  Handshake, MessageCircle, ExternalLink, Shield, Sparkles, Check
} from 'lucide-react';

import { useRestaurantBranding } from '../context/RestaurantBrandingContext';

export default function ContactUsPage({ onOpenDemoModal }) {
  const { brandName } = useRestaurantBranding();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    restaurantName: '',
    phone: '',
    subject: 'Select a subject',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const randomTicket = 'FLV-' + Math.floor(100000 + Math.random() * 900000);
    setTicketId(randomTicket);
    setSubmitted(true);
  };

  return (
    <div className="contact-page-ref">
      
      {/* 1. Hero Section (Unified Page Hero System - Matches Blogs Page Height & Tab Size Exactly) */}
      <section className="page-hero-banner-unified">
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div className="page-hero-badge-unified">
            <Sparkles size={14} />
            <span>LET’S BUILD A BETTER TOMORROW</span>
          </div>

          <h1 className="page-hero-title-unified">
            We’re Here to Support Your Journey
          </h1>

          <p className="page-hero-subtitle-unified">
            Have questions about our Restaurant Management System? Our team is ready to help you with any inquiries, support needs, or partnership opportunities.
          </p>
        </div>
      </section>

      {/* 2. Top Quick Info Cards Row (4 Horizontal Cards) */}
      <div className="contact-quick-cards-wrapper">
        <div className="contact-quick-cards-grid">
          
          {/* Card 1: Our Office */}
          <div className="contact-quick-card">
            <div className="contact-quick-icon-box">
              <MapPin size={20} />
            </div>
            <div>
              <div className="contact-quick-card-title">Our Office</div>
              <div className="contact-quick-card-text">Hyderabad, Telangana</div>
              <div className="contact-quick-card-sub">Head Business Office</div>
            </div>
          </div>

          {/* Card 2: Call Us */}
          <div className="contact-quick-card">
            <div className="contact-quick-icon-box">
              <Phone size={20} />
            </div>
            <div>
              <div className="contact-quick-card-title">Call Us</div>
              <div className="contact-quick-card-text">+91 1800-352-8672</div>
              <div className="contact-quick-card-sub">Mon - Sat: 9am - 8pm IST</div>
            </div>
          </div>

          {/* Card 3: Email Us */}
          <div className="contact-quick-card">
            <div className="contact-quick-icon-box">
              <Mail size={20} />
            </div>
            <div>
              <div className="contact-quick-card-title">Email Us</div>
              <div className="contact-quick-card-text">support@flavorakitchen.in</div>
              <div className="contact-quick-card-sub">Typically replied within 2 hours</div>
            </div>
          </div>

          {/* Card 4: Live Chat */}
          <div className="contact-quick-card">
            <div className="contact-quick-icon-box">
              <MessageCircle size={20} />
            </div>
            <div>
              <div className="contact-quick-card-title">Live Chat</div>
              <div className="contact-quick-card-text">Available on our platform</div>
              <div className="contact-quick-card-sub">Instant 24/7 assistance</div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Main 2-Column Section */}
      <div className="contact-main-wrapper">
        <div className="contact-ref-main-grid">
          
          {/* Left Column: Send Us a Message Form */}
          <div className="contact-ref-form-card">
            <h2 className="contact-form-title">Send Us a Message</h2>
            <p className="contact-form-sub">
              Fill out the form and our team will get back to you soon.
            </p>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#FFF6E8', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-secondary)' }}>
                <CheckCircle2 size={54} style={{ color: 'var(--color-success)', margin: '0 auto 1rem auto' }} />
                <h3 className="contact-form-title" style={{ color: 'var(--color-primary)', fontSize: '1.4rem' }}>
                  Message Submitted!
                </h3>
                <p style={{ color: 'var(--color-neutral-700)', fontSize: '0.95rem', margin: '0.5rem 0 1.5rem 0' }}>
                  Thank you, <strong>{formData.fullName}</strong>. Your ticket reference is <strong>{ticketId}</strong>. Our team will contact you at <strong>{formData.phone}</strong> shortly.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <a 
                    href="https://wa.me/919876543210" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-secondary btn-md"
                  >
                    Instant WhatsApp Chat
                  </a>
                  <button 
                    onClick={() => setSubmitted(false)} 
                    className="btn btn-outline btn-md"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Row 1: Full Name | Email Address */}
                <div className="grid-2" style={{ gap: '1.25rem' }}>
                  <div>
                    <label className="contact-field-label">FULL NAME *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Enter your full name" 
                      className="contact-ref-input"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="contact-field-label">EMAIL ADDRESS *</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="Enter your email address" 
                      className="contact-ref-input"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                {/* Row 2: Restaurant Name | Phone Number */}
                <div className="grid-2" style={{ gap: '1.25rem' }}>
                  <div>
                    <label className="contact-field-label">RESTAURANT NAME *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Enter your restaurant name" 
                      className="contact-ref-input"
                      value={formData.restaurantName}
                      onChange={(e) => setFormData({...formData, restaurantName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="contact-field-label">PHONE NUMBER (10 DIGITS) *</label>
                    <input 
                      type="tel" 
                      required 
                      placeholder="e.g. 9876543210" 
                      maxLength={10}
                      className="contact-ref-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                    />
                  </div>
                </div>

                {/* Row 3: Subject Select */}
                <div>
                  <label className="contact-field-label">SUBJECT *</label>
                  <select 
                    className="contact-ref-input"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  >
                    <option value="Select a subject">Select a subject</option>
                    <option value="Demo & Onboarding">Demo & Software Onboarding</option>
                    <option value="Multi-Outlet Chain">Multi-Outlet Chain Enterprise Proposal</option>
                    <option value="Technical & POS Support">Technical & POS Support</option>
                    <option value="Billing & GST">Billing, Payments & GST Questions</option>
                    <option value="Partnership">Partnership & Integration Inquiry</option>
                  </select>
                </div>

                {/* Row 4: Message */}
                <div>
                  <label className="contact-field-label">MESSAGE *</label>
                  <textarea 
                    required
                    placeholder="Tell us how we can help you..." 
                    className="contact-ref-textarea"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  ></textarea>
                </div>

                {/* Captcha notice pill */}
                <div className="contact-captcha-pill">
                  <span>Protected by reCAPTCHA • Privacy & Terms apply</span>
                  <Shield size={16} style={{ color: 'var(--color-primary)' }} />
                </div>

                {/* Submit Button */}
                <button type="submit" className="contact-ref-btn-submit">
                  <Send size={16} />
                  <span>Send Message</span>
                </button>

              </form>
            )}
          </div>

          {/* Right Column: Stack of Cards */}
          <div className="contact-right-stack">
            
            {/* Card 1: Head Office Map Card */}
            <div className="contact-ref-map-card">
              <div className="contact-map-header">
                <Building2 size={22} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div className="contact-map-title">{brandName} Head Office</div>
                  <div className="contact-map-sub">Plot No. 42, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033, India</div>
                </div>
              </div>

              <div className="contact-map-visual">
                <img 
                  src="/carousel_3.png" 
                  alt="Map visual location" 
                  className="contact-map-visual-img"
                />
                <a 
                  href="https://maps.google.com/?q=Jubilee+Hills+Hyderabad" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="contact-map-btn-overlay"
                >
                  <span>Open in Maps</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Card 2: Urgent Assistance Callout Box */}
            <div className="contact-urgent-card">
              <div>
                <div className="contact-urgent-title">Need immediate assistance?</div>
                <div className="contact-urgent-sub">For urgent support or technical issues, reach out to our dedicated success team.</div>
              </div>
              <a 
                href="https://wa.me/919876543210" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="contact-urgent-chat-btn"
              >
                <MessageCircle size={16} />
                <span>Chat Now</span>
              </a>
            </div>

            {/* Card 3: Why Contact Us? Grid Card */}
            <div className="contact-why-card">
              <h3 className="contact-why-title">Why Contact Us?</h3>

              <div className="contact-why-grid">
                
                <div>
                  <div className="contact-why-item-title">
                    <Zap size={15} style={{ color: 'var(--color-secondary)' }} />
                    <span>Get Expert Guidance</span>
                  </div>
                  <div className="contact-why-item-desc">
                    Talk to our F&B management specialists for the best software solutions tailored for your kitchen.
                  </div>
                </div>

                <div>
                  <div className="contact-why-item-title">
                    <Award size={15} style={{ color: 'var(--color-secondary)' }} />
                    <span>Tailored Demo</span>
                  </div>
                  <div className="contact-why-item-desc">
                    See how our software fits your specific restaurant format (Dine-in, QSR, Bar, or Cafe).
                  </div>
                </div>

                <div>
                  <div className="contact-why-item-title">
                    <Handshake size={15} style={{ color: 'var(--color-secondary)' }} />
                    <span>Partnership Ops</span>
                  </div>
                  <div className="contact-why-item-desc">
                    Explore multi-outlet enterprise chain options, custom hardware setups, and API integrations.
                  </div>
                </div>

                <div>
                  <div className="contact-why-item-title">
                    <Clock size={15} style={{ color: 'var(--color-secondary)' }} />
                    <span>Ongoing Support</span>
                  </div>
                  <div className="contact-why-item-desc">
                    Dedicated onboarding managers and 24/7 emergency customer care ready to assist your team.
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}


