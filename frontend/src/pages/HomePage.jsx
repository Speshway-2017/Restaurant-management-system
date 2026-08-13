import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Utensils, Star, Heart,
  CheckCircle2, Sparkles, Tag, Flame, Clock, QrCode, Calendar, LogIn, Image, Zap, ShieldCheck
} from 'lucide-react';

export default function HomePage({ setActivePage, onOpenDemoModal }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, isHovered: false });

  const handleDishMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateY = (x / (rect.width / 2)) * 25;
    const rotateX = -(y / (rect.height / 2)) * 25;
    setTilt({ rotateX, rotateY, isHovered: true });
  };

  const handleDishMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, isHovered: false });
  };

  const heroSlides = [
    {
      badge: 'WELCOME TO OUR RESTAURANT',
      title: (
        <>
          Your <span style={{ color: '#FF8A00' }}>Go-To</span> Spot For Great <span style={{ color: '#FF8A00' }}>Food</span> And Good <span style={{ color: '#FF8A00' }}>Times</span>
        </>
      ),
      subtitle: 'Join Us for Delicious Meals and Memorable Moments!',
      btnText: 'Order Now',
      mainDishImg: '/hero_dish_1.png',
      tag1: '🥗 Fresh Organic',
      tag2: '🔥 Chef Special',
      card1: { title: 'Salad Special', rating: '5.0', img: '/hero_dish_1.png' },
      card2: { title: 'Good For Health', rating: '5.0', img: '/carousel_2.png' },
      action: () => setActivePage('menu')
    },
    {
      badge: 'AUTHENTIC INDIAN CUISINE',
      title: (
        <>
          Experience <span style={{ color: '#FF8A00' }}>Royal</span> Dum Biryani & <span style={{ color: '#FF8A00' }}>Tandoori</span> Delights
        </>
      ),
      subtitle: 'Crafted with age-old recipes, aromatic Kashmiri spices & pure ghee.',
      btnText: 'Explore Menu',
      mainDishImg: '/hero_dish_2.png',
      tag1: '🌶️ Kashmiri Spices',
      tag2: '✨ Pure Ghee Dum',
      card1: { title: 'Royal Dum Biryani', rating: '5.0', img: '/hero_dish_2.png' },
      card2: { title: 'Tandoori Feast', rating: '4.9', img: '/carousel_1.png' },
      action: () => setActivePage('menu')
    },
    {
      badge: 'DIGITAL 5-TAP QR DINING',
      title: (
        <>
          Instant <span style={{ color: '#FF8A00' }}>QR Ordering</span> & Smart <span style={{ color: '#FF8A00' }}>UPI Payments</span>
        </>
      ),
      subtitle: 'Seamless 360° restaurant technology for fast, hassle-free dining.',
      btnText: 'Explore QR Dining',
      mainDishImg: '/carousel_2.png',
      tag1: '📱 5-Tap Order',
      tag2: '💳 Instant UPI',
      card1: { title: 'Chef Special', rating: '4.9', img: '/chef_plating.png' },
      card2: { title: 'Quick Service', rating: '5.0', img: '/carousel_3.png' },
      action: () => setActivePage('features')
    }
  ];

  const specialOffers = [
    { title: 'Royal Tandoori Feast', tag: '20% OFF TODAY', price: '₹999', origPrice: '₹1250', desc: 'Paneer Tikka, Murgh Malai Kabab, Butter Naan x2 & Dal Makhani', img: '/hero_dish_1.png', isVeg: false },
    { title: 'Shahi Biryani Combo', tag: 'WEEKEND SPECIAL', price: '₹649', origPrice: '₹799', desc: 'Hyderabadi Dum Biryani + Mirchi Salan + Gulab Jamun + Mango Lassi', img: '/hero_dish_2.png', isVeg: false },
    { title: 'Chef Special Thali', tag: 'BESTSELLER', price: '₹450', origPrice: '₹550', desc: 'Paneer Butter Masala, Dal Tadka, Jeera Rice, Rotis & Phirni', img: '/chef_plating.png', isVeg: true }
  ];

  const menuHighlights = [
    { name: 'Paneer Tikka Angara', category: 'Starters', price: '₹340', isVeg: true, desc: 'Cottage cheese marinated in Kashmiri chili and tandoori spices.', img: '/hero_dish_1.png' },
    { name: 'Murgh Malai Kabab', category: 'Starters', price: '₹420', isVeg: false, desc: 'Tender chicken breast infused with cream, cheese, and cardamom.', img: '/carousel_2.png' },
    { name: 'Dal Makhani Gold', category: 'Main Course', price: '₹380', isVeg: true, desc: 'Slow-cooked black lentils simmered overnight with white butter.', img: '/carousel_1.png' },
    { name: 'Hyderabadi Dum Biryani', category: 'Main Course', price: '₹490', isVeg: false, desc: 'Aromatic basmati rice layered with spiced marinated lamb.', img: '/hero_dish_2.png' },
    { name: 'Saffron Shahi Tukda', category: 'Desserts', price: '₹260', isVeg: true, desc: 'Crispy fried bread soaked in saffron rabri topped with pistachios.', img: '/tandoor_oven.png' },
    { name: 'Mango Lassi Delight', category: 'Beverages', price: '₹180', isVeg: true, desc: 'Thick churned yogurt blended with Alphonsa mango pulp.', img: '/carousel_3.png' }
  ];

  const galleryImages = [
    { src: '/carousel_1.png', title: 'Luxury Dining Hall' },
    { src: '/carousel_2.png', title: 'Gourmet Indian Spread' },
    { src: '/carousel_3.png', title: 'Kitchen Pass & Chef Prep' },
    { src: '/chef_plating.png', title: 'Plating Artistry' },
    { src: '/tandoor_oven.png', title: 'Clay Tandoori Oven' },
    { src: '/chef_1.png', title: 'Executive Chef Vikram' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
  };

  const activeSlideObj = heroSlides[currentSlide];

  return (
    <div className="homepage-wrapper">
      {/* 1. HERO SLIDER SECTION (Breathtaking Luxury Layout) */}
      <section className="ref-hero-wrapper">
        {/* Background Ambient Glowing Blobs */}
        <div className="hero-ambient-blob hero-blob-1"></div>
        <div className="hero-ambient-blob hero-blob-2"></div>

        <div className="ref-hero-container">
          {/* Left Column: Content */}
          <div>
            <span className="ref-hero-badge">
              <span className="live-pulse-dot"></span>
              <Sparkles size={14} style={{ marginRight: '0.4rem' }} />
              {activeSlideObj.badge}
            </span>
            
            <h1 className="ref-hero-title">
              {activeSlideObj.title}
            </h1>

            <p className="ref-hero-subtitle">
              {activeSlideObj.subtitle}
            </p>

            <div>
              <button onClick={activeSlideObj.action} className="ref-hero-cta-btn">
                <span>{activeSlideObj.btnText}</span>
                <span style={{ fontSize: '1.1rem' }}>→</span>
              </button>
            </div>

            {/* Elevated Trust Badges Bar */}
            <div className="hero-trust-bar">
              <div className="hero-trust-item">
                <Zap size={15} color="#FF8A00" />
                <span>15-Min Dine-In Prep</span>
              </div>
              <div className="hero-trust-divider"></div>
              <div className="hero-trust-item">
                <Star size={15} fill="#FF8A00" color="#FF8A00" />
                <span>4.9/5 Rating (2.4k+ Reviews)</span>
              </div>
              <div className="hero-trust-divider"></div>
              <div className="hero-trust-item">
                <ShieldCheck size={15} color="#1E4636" />
                <span>100% Authentic</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Floating Dish Stage */}
          <div 
            className="ref-hero-dish-stage"
            onMouseMove={handleDishMouseMove}
            onMouseLeave={handleDishMouseLeave}
          >
            {/* Ambient Sunburst Glow Halo */}
            <div className="dish-stage-halo"></div>

            {/* Floating Sparkle Micro Particles */}
            <div className="floating-sparkle-particle sparkle-1">✨</div>
            <div className="floating-sparkle-particle sparkle-2">🔥</div>
            <div className="floating-sparkle-particle sparkle-3">🌿</div>

            <img
              src={activeSlideObj.mainDishImg}
              alt="Featured Dish"
              className={`ref-hero-main-img ${tilt.isHovered ? 'is-tilt-active' : ''}`}
              style={
                tilt.isHovered
                  ? {
                      transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(1.12)`,
                      filter: 'drop-shadow(0 40px 60px rgba(255, 138, 0, 0.48))',
                      transition: 'transform 0.08s ease-out, filter 0.2s ease-out'
                    }
                  : {}
              }
            />
          </div>
        </div>

        {/* Slide Pagination Dots (Old Clean Style) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              style={{
                width: idx === currentSlide ? '32px' : '10px',
                height: '10px',
                borderRadius: '5px',
                background: idx === currentSlide ? '#FF8A00' : 'rgba(0, 0, 0, 0.15)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 2. OUR STORY SECTION */}
      <section style={{ backgroundColor: '#FAF3E6', padding: '5.5rem 1.5rem' }}>
        <div className="section" style={{ padding: 0 }}>
          <div className="grid-2" style={{ alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                OUR STORY
              </div>

              <h2 className="text-h1" style={{ fontSize: '2.5rem', color: 'var(--color-primary-dark)', marginBottom: '1.75rem', fontFamily: 'var(--font-heading)' }}>
                A Journey of Flavors
              </h2>

              <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                Flavora Kitchen brings the rich, authentic flavors of India to your table. Founded on a passion for traditional spices and modern culinary techniques, our chefs craft every dish to be an unforgettable experience.
              </p>

              <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '2rem' }}>
                From the bustling streets of Delhi to the royal kitchens of Hyderabad, our menu is a celebration of India's diverse culinary heritage, served in a sophisticated, elegant setting.
              </p>

              <button
                onClick={() => setActivePage('about')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-neutral-900)',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>Read more about us</span>
                <span style={{ fontSize: '1.1rem' }}>›</span>
              </button>
            </div>

            <div style={{ textAlign: 'right' }}>
              <img
                src="/chef_plating.png"
                alt="Chef Plating Food in Kitchen"
                style={{
                  width: '100%',
                  maxHeight: '420px',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid rgba(0, 0, 0, 0.08)'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. SPECIAL OFFERS SECTION */}
      <section id="offer-section" style={{ backgroundColor: '#FFFFFF', padding: '5rem 1.5rem', borderTop: '1px solid var(--color-neutral-200)' }}>
        <div className="section" style={{ padding: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              CHEF SPECIAL COMBOS
            </div>
            <h2 className="text-h1" style={{ color: 'var(--color-primary-dark)' }}>
              Exclusive Culinary Offers
            </h2>
          </div>

          <div className="grid-3">
            {specialOffers.map((offer, idx) => (
              <div key={idx} className="menu-card-enhanced" style={{ borderTop: '3.5px solid #FF8A00' }}>
                <div>
                  {/* Compact Header Row: Thumbnail Dish Icon + Tag + Title */}
                  <div className="menu-card-header-compact">
                    <img 
                      src={offer.img} 
                      alt={offer.title} 
                      className="menu-card-thumb-icon"
                    />

                    <div className="menu-card-header-info">
                      <div className="menu-card-tag-row">
                        <span className={offer.isVeg ? 'veg-dot' : 'nonveg-dot'}></span>
                        <span style={{ fontSize: '0.72rem', color: '#FF8A00', fontWeight: '800', background: 'rgba(255, 138, 0, 0.12)', padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                          {offer.tag}
                        </span>
                      </div>

                      <div className="menu-card-title-row">
                        <h3 className="menu-card-title">{offer.title}</h3>
                      </div>
                    </div>
                  </div>

                  <p className="menu-card-desc">{offer.desc}</p>
                </div>

                <div className="menu-card-action-bar">
                  <div>
                    <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FF8A00' }}>{offer.price}</span>
                    <span style={{ fontSize: '0.85rem', color: '#94A3B8', textDecoration: 'line-through', marginLeft: '0.4rem', fontWeight: '600' }}>{offer.origPrice}</span>
                  </div>
                  <button onClick={onOpenDemoModal} className="btn-add-cart" style={{ padding: '0.45rem 1.1rem', fontSize: '0.82rem' }}>
                    <span>Claim Deal</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. MENU HIGHLIGHTS SECTION */}
      <section id="menu-section" className="section">
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            EXPLORE OUR DISHES
          </div>
          <h2 className="text-h1" style={{ color: 'var(--color-primary-dark)' }}>
            Curated Culinary Selection
          </h2>
        </div>

        <div className="grid-3">
          {menuHighlights.map((item, idx) => (
            <div key={idx} className="menu-card-enhanced">
              {/* Compact Header Row: Thumbnail Dish Icon + Title + Price */}
              <div>
                <div className="menu-card-header-compact">
                  <img 
                    src={item.img} 
                    alt={item.name} 
                    className="menu-card-thumb-icon"
                  />

                  <div className="menu-card-header-info">
                    <div className="menu-card-tag-row">
                      <span className={item.isVeg ? 'veg-dot' : 'nonveg-dot'}></span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>
                        {item.category}
                      </span>
                    </div>

                    <div className="menu-card-title-row">
                      <h3 className="menu-card-title">{item.name}</h3>
                      <span className="menu-card-price-pill">{item.price}</span>
                    </div>
                  </div>
                </div>

                <p className="menu-card-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. GALLERY SECTION */}
      <section id="gallery-section" style={{ backgroundColor: '#FAF3E6', padding: '5rem 1.5rem', borderTop: '1px solid var(--color-neutral-200)' }}>
        <div className="section" style={{ padding: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              RESTAURANT ATMOSPHERE
            </div>
            <h2 className="text-h1" style={{ color: 'var(--color-primary-dark)' }}>
              Photo Gallery
            </h2>
          </div>

          <div className="grid-3">
            {galleryImages.map((img, idx) => (
              <div key={idx} className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                <img
                  src={img.src}
                  alt={img.title}
                  style={{ width: '100%', height: '220px', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                />
                <div style={{ padding: '1rem', background: '#FFFFFF', textAlign: 'center', fontWeight: '600', color: 'var(--color-primary-dark)', fontSize: '0.9rem' }}>
                  {img.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. REVIEWS & TESTIMONIALS SECTION */}
      <section id="reviews-section" style={{ backgroundColor: '#FFFFFF', padding: '5rem 1.5rem', borderTop: '1px solid var(--color-neutral-200)' }}>
        <div className="section" style={{ padding: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              GUEST FEEDBACK
            </div>
            <h2 className="text-h1" style={{ color: 'var(--color-primary-dark)' }}>
              Loved by 500+ Indian Restaurants & Guests
            </h2>
          </div>

          <div className="grid-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.2rem', color: 'var(--color-accent)', marginBottom: '1rem' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
              </div>
              <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontStyle: 'italic', marginBottom: '1.25rem' }}>
                "The instant QR menu transformed our Friday night table turnaround. Guests love ordering appetizers directly without waiting for waiters."
              </p>
              <div style={{ fontWeight: '700', color: 'var(--color-primary)' }}>Chef Ranveer Brar</div>
              <div className="text-caption">Culinary Director, Mumbai</div>
            </div>

            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.2rem', color: 'var(--color-accent)', marginBottom: '1rem' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
              </div>
              <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontStyle: 'italic', marginBottom: '1.25rem' }}>
                "KDS dark mode display in the kitchen eliminated all ticket lost issues. Food reaches guests in less than 12 minutes!"
              </p>
              <div style={{ fontWeight: '700', color: 'var(--color-primary)' }}>Ananya Sen</div>
              <div className="text-caption">Operations Manager, Bengaluru</div>
            </div>

            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.2rem', color: 'var(--color-accent)', marginBottom: '1rem' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
              </div>
              <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontStyle: 'italic', marginBottom: '1.25rem' }}>
                "Automated CGST/SGST 5% billing and Razorpay UPI settlements save our accounting team 15 hours every week."
              </p>
              <div style={{ fontWeight: '700', color: 'var(--color-primary)' }}>Vikram Malhotra</div>
              <div className="text-caption">Restaurant Owner, Delhi NCR</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
