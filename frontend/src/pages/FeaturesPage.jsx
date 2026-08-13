import React, { useState } from 'react';
import { 
  QrCode, CreditCard, Calendar, Clock, ChefHat, Tag, Bell,
  CheckCircle2, Sparkles, Search, ArrowRight, Zap, ShieldCheck, Receipt, Users
} from 'lucide-react';

export default function FeaturesPage({ setActivePage, onOpenDemoModal }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const featuresList = [
    {
      id: 'qr-ordering',
      badge: 'DIGITAL TABLE MENU',
      title: 'Instant 5-Tap QR Code Menu & Table Ordering',
      description: 'Guests simply scan the QR code located on their dining table to instantly open our high-definition digital menu on their phone. Browse dish photos with Veg/Non-Veg indicators, customize spice levels or add extra toppings, and place orders directly to the kitchen without waiting for a waiter.',
      image: '/hero_dish_1.png',
      overlayBadge: '⚡ Zero App Download Required',
      color: '#E07A3C',
      badgeBg: 'rgba(224, 122, 60, 0.12)',
      highlights: [
        'Instant Table QR Scan',
        'FSSAI Veg/Non-Veg Badges',
        'Custom Spice Levels & Add-ons',
        'Multi-Language Support',
        'Special Cooking Notes'
      ],
      btnText: 'Explore Menu',
      btnAction: () => setActivePage('menu')
    },
    {
      id: 'payments',
      badge: 'CHECKOUT & BILLING',
      title: 'Contactless UPI Payments & Instant WhatsApp Invoices',
      description: 'Dine without checkout friction. Guests can scan the table QR code to view their itemized GST tax invoice, split the bill with friends, and pay instantly via Google Pay, PhonePe, Paytm, or Cards. Digital receipts are sent directly to their WhatsApp and SMS.',
      image: '/carousel_2.png',
      overlayBadge: '💳 100% Secure Razorpay UPI',
      color: '#3F8F5B',
      badgeBg: 'rgba(63, 143, 91, 0.12)',
      highlights: [
        'UPI, GPay & PhonePe Scan & Pay',
        '5% CGST / SGST Tax Invoices',
        'WhatsApp & SMS Receipts',
        'Group Split Billing',
        'Zero Checkout Delay'
      ],
      btnText: 'Contactless Checkout',
      btnAction: onOpenDemoModal
    },
    {
      id: 'table-booking',
      badge: 'HOST & SEATING',
      title: 'Smart 24/7 Table Reservations & Wait-Queue Tokens',
      description: 'Never worry about weekend dining rushes. Reserve your favorite table online 24/7 with instant WhatsApp confirmations. For walk-in guests during peak hours, digital wait-queue tokens keep you updated on estimated wait times on your phone while you relax.',
      image: '/carousel_1.png',
      overlayBadge: '📅 24/7 Online Table Reservations',
      color: '#4A7FB5',
      badgeBg: 'rgba(74, 127, 181, 0.12)',
      highlights: [
        'Instant WhatsApp Confirmation',
        'Digital Queue Tokens',
        'Live Estimated Wait Times',
        'Preferred Table Selection',
        'Birthday & Special Occasion Setup'
      ],
      btnText: 'Book Table Now',
      btnAction: onOpenDemoModal
    },
    {
      id: 'live-tracking',
      badge: 'TABLE ASSISTANCE',
      title: 'Real-Time Order Tracking & One-Tap Waiter Call',
      description: 'Track your meal prep in real-time as it moves from order acceptance to kitchen cooking and table pass delivery. Need extra water, extra cutlery, or napkins? Use the one-tap Call Waiter button on your phone to alert staff immediately.',
      image: '/chef_plating.png',
      overlayBadge: '⏱️ Live Prep Status Tracking',
      color: '#C4632C',
      badgeBg: 'rgba(196, 99, 44, 0.12)',
      highlights: [
        'Live Prep Status Bar',
        'One-Tap "Call Waiter" Button',
        'Mid-Meal Quick Re-Ordering',
        'Instant Water/Cutlery Request',
        '1-5 Star Meal Feedback'
      ],
      btnText: 'Learn Table Assistance',
      btnAction: onOpenDemoModal
    },
    {
      id: 'kitchen-kds',
      badge: 'KITCHEN PASS TECH',
      title: 'High-Contrast Digital Kitchen Display System (KDS)',
      description: 'Engineered for fast 15-minute meal preparation. Incoming orders are instantly routed to station tablet screens (Tandoor, Main Curry, Starters, Bar). Station chefs can toggle out-of-stock items in real-time to ensure seamless pass operations.',
      image: '/tandoor_oven.png',
      overlayBadge: '👨‍🍳 15-Min Fast Meal Preparation',
      color: '#1E4636',
      badgeBg: 'rgba(30, 70, 54, 0.12)',
      highlights: [
        'Station-Wise Order Routing',
        'Real-Time Out-of-Stock Toggle',
        'Staggered Starter & Main Delivery',
        'Kitchen Pass Audio Alerts',
        'Zero Stainless-Steel Glare'
      ],
      btnText: 'See KDS Technology',
      btnAction: onOpenDemoModal
    },
    {
      id: 'combos-deals',
      badge: 'OFFERS & REWARDS',
      title: 'Curated Chef Special Combos & Digital Loyalty Rewards',
      description: 'Enjoy exclusive dining perks every day. From discounted Royal Tandoori Feasts and weekend Biryani combos to earned digital loyalty points on every order redeemable for complimentary desserts and birthday treats.',
      image: '/carousel_3.png',
      overlayBadge: '🎁 Earn Free Dessert Points',
      color: '#6B46C1',
      badgeBg: 'rgba(107, 70, 193, 0.12)',
      highlights: [
        'Daily Chef Combo Deals',
        'Automatic Coupon Discounts',
        'Earn Loyalty Points on Meals',
        'Birthday Free Treats',
        'Exclusive Weekend Specials'
      ],
      btnText: 'View Special Offers',
      btnAction: () => setActivePage('offer')
    }
  ];

  // Category & search filter
  const filteredFeatures = featuresList.filter(feat => {
    const matchesCategory = selectedCategory === 'all' || feat.id === selectedCategory;
    const matchesQuery = !searchQuery.trim() || 
      feat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feat.highlights.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="features-page-wrapper">
      {/* 1. HERO HEADER */}
      <section className="page-hero-banner-unified">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="page-hero-badge-unified">
            <Sparkles size={14} />
            <span>EXCELLENCE IN DINING & TECHNOLOGY</span>
          </div>

          <h1 className="page-hero-title-unified">
            Explore <span style={{ color: 'var(--color-secondary)' }}>Flavora Kitchen</span> Features
          </h1>

          <p className="page-hero-subtitle-unified">
            Experience our 5-tap table QR code ordering, contactless UPI payments, smart table reservations, real-time order tracking, and exclusive chef combos through interactive visual showcases.
          </p>
        </div>
      </section>

      <div className="section" style={{ paddingTop: '3.5rem' }}>
        {/* 2. SEARCH & MODULE FILTER BAR */}
        <div className="feature-search-box">
          <Search size={18} className="feature-search-icon" />
          <input
            type="text"
            placeholder="Search features with images (e.g., QR, UPI, Booking, KDS, Combos)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="feature-search-input"
          />
        </div>

        {/* 3. VISUAL FEATURE SHOWCASE CARDS (ALTERNATING 2-COLUMN LAYOUT) */}
        <div>
          {filteredFeatures.map((item, index) => {
            const isReverse = index % 2 === 1; // Alternate image left/right

            const imageCol = (
              <div className="feature-img-wrapper" key="img">
                <img src={item.image} alt={item.title} />
                <div className="feature-img-overlay-badge">
                  <span>{item.overlayBadge}</span>
                </div>
              </div>
            );

            const textCol = (
              <div className="feature-content-col" key="text">
                <span className="feature-category-pill" style={{ backgroundColor: item.badgeBg, color: item.color }}>
                  {item.badge}
                </span>

                <h2 className="feature-card-title">{item.title}</h2>

                <p className="feature-card-description">{item.description}</p>

                {/* Highlight Chip Tags */}
                <div className="feature-tags-grid">
                  {item.highlights.map((tag, tIdx) => (
                    <span key={tIdx} className="feature-tag-chip">
                      <CheckCircle2 size={14} style={{ color: item.color }} />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>

                <button 
                  onClick={item.btnAction} 
                  className="ref-hero-cta-btn"
                  style={{
                    background: `linear-gradient(135deg, ${item.color} 0%, #1C2A22 100%)`,
                    boxShadow: `0 8px 20px ${item.badgeBg}`,
                    fontSize: '0.9rem',
                    padding: '0.7rem 1.8rem'
                  }}
                >
                  <span>{item.btnText}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            );

            return (
              <div key={item.id} className="feature-showcase-card">
                {isReverse ? [textCol, imageCol] : [imageCol, textCol]}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}



