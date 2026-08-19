import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Utensils, Heart,
  CheckCircle2, Sparkles, Tag, Flame, Clock, QrCode, Calendar, LogIn, Image, Zap, ShieldCheck,
  Award, ArrowRight, Play, Compass, ChefHat, Eye
} from 'lucide-react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';
import MagneticButton from '../components/MagneticButton';
import InfiniteSlider from '../components/InfiniteSlider';
import KineticCenterBuild from '../components/KineticCenterBuild';
import Cta2 from '../components/Cta2';

export default function HomePage({ setActivePage, onOpenDemoModal }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, isHovered: false });

  // Default menu highlights
  const [menuHighlights, setMenuHighlights] = useState([
    { id: 1, name: 'Paneer Tikka Angara', category: 'Starters', price: 340, origPrice: '₹420', isVeg: true, desc: 'Cottage cheese marinated in Kashmiri chili & tandoori spices.', img: '/hero_dish_1.png', bestseller: true },
    { id: 2, name: 'Murgh Malai Kabab', category: 'Starters', price: 420, origPrice: '₹500', isVeg: false, desc: 'Tender chicken breast infused with cream, cheese, and cardamom.', img: '/carousel_2.png' },
    { id: 3, name: 'Dal Makhani Gold', category: 'Main Course', price: 380, origPrice: '₹460', isVeg: true, desc: 'Slow-cooked black lentils simmered overnight with white butter.', img: '/carousel_1.png', bestseller: true },
    { id: 4, name: 'Hyderabadi Dum Biryani', category: 'Main Course', price: 490, origPrice: '₹580', isVeg: false, desc: 'Aromatic basmati rice layered with spiced marinated lamb.', img: '/hero_dish_2.png', bestseller: true },
    { id: 5, name: 'Saffron Shahi Tukda', category: 'Desserts', price: 260, origPrice: '₹320', isVeg: true, desc: 'Crispy fried bread soaked in saffron rabri topped with pistachios.', img: '/tandoor_oven.png' },
    { id: 6, name: 'Mango Lassi Delight', category: 'Beverages', price: 180, origPrice: '₹220', isVeg: true, desc: 'Thick churned yogurt blended with Alphonsa mango pulp.', img: '/carousel_3.png' }
  ]);

  useEffect(() => {
    api.getMenuItems()
      .then((data) => {
        if (data && data.length > 0) {
          const formatted = data
            .filter(item => item.isAvailable !== false)
            .map(item => ({
              id: item._id || item.id,
              name: item.name,
              category: item.category || 'Main Course',
              price: item.price,
              origPrice: `₹${Math.round(item.price * 1.25)}`,
              isVeg: item.isVeg !== undefined ? item.isVeg : true,
              desc: item.desc || '',
              img: item.img || '/hero_dish_2.png',
              bestseller: item.isBestseller
            }));
          if (formatted.length > 0) {
            setMenuHighlights(formatted);
          }
        }
      })
      .catch((err) => {
        console.log('HomePage API fallback active:', err.message);
      });
  }, []);

  const heroSlides = [
    {
      badge: 'EXPLORE FINE DINING',
      title: 'Your Go-To Spot For Great Food And Good Times',
      subtitle: 'Hand-milled spices, slow-cooked clay tandoori kebabs, and authentic royal flavors served in a luxury ambient atmosphere.',
      btnText: 'Explore Full Menu',
      mainDishImg: '/hero_dish_1.png',
      card1: { title: 'Paneer Tikka Angara', tag: '🔥 Chef Special', img: '/hero_dish_1.png' },
      card2: { title: 'Royal Malai Kebab', tag: '✨ Top Bestseller', img: '/carousel_2.png' },
      action: () => setActivePage('menu')
    },
    {
      badge: 'AUTHENTIC DUM RECIPES',
      title: 'Experience Royal Dum Biryani & Tandoori Delights',
      subtitle: 'Crafted with age-old recipes, aromatic Kashmiri spices & pure desi ghee cooked slow on dum for unforgettable aroma.',
      btnText: 'Order Dum Biryani',
      mainDishImg: '/hero_dish_2.png',
      card1: { title: 'Hyderabadi Dum Biryani', tag: '👑 Signature Dish', img: '/hero_dish_2.png' },
      card2: { title: 'Tandoori Feast Platter', tag: '🔥 Clay Roast', img: '/carousel_1.png' },
      action: () => setActivePage('menu')
    },
    {
      badge: 'DIGITAL 5-TAP QR DINING',
      title: 'Instant QR Ordering & Smart UPI Payments',
      subtitle: 'Scan table QR code, browse high-res dish photos, customize orders, and enjoy 15-minute prep times with zero waiting.',
      btnText: 'Experience QR Menu',
      mainDishImg: '/carousel_2.png',
      card1: { title: 'Instant QR Dining', tag: '⚡ 15-Min Prep', img: '/carousel_2.png' },
      card2: { title: 'Clay Tandoori Naan', tag: '🌿 Freshly Baked', img: '/tandoor_oven.png' },
      action: () => setActivePage('menu')
    }
  ];

  const specialCombos = [
    {
      title: 'Royal Biryani Feast Combo',
      desc: '1 Full Chicken Dum Biryani + 2 Butter Naan + 1 Paneer Tikka + Gulab Jamun + Soft Drinks.',
      price: 890,
      origPrice: '₹1,250',
      tag: 'BEST VALUE (30% OFF)',
      img: '/hero_dish_2.png',
      isVeg: false
    },
    {
      title: 'Tandoori Kebab Platter Special',
      desc: 'Assorted Murgh Malai Kabab, Tandoori Chicken, Paneer Angara & Mint Chutney.',
      price: 760,
      origPrice: '₹980',
      tag: 'CHEF SPECIAL',
      img: '/carousel_1.png',
      isVeg: false
    },
    {
      title: 'Dal Makhani & Shahi Thali',
      desc: 'Dal Makhani Gold + Paneer Butter Masala + Saffron Rice + 3 Butter Rotis + Lassi.',
      price: 640,
      origPrice: '₹820',
      tag: 'PURE VEG ROYAL',
      img: '/hero_dish_1.png',
      isVeg: true
    }
  ];

  const marqueeBadges = [
    "🔥 Live Clay Tandoor Ovens",
    "🍛 Authentic Hyderabadi Dum Biryani",
    "🏆 Voted #1 Fine Dining in Jubilee Hills",
    "⚡ 15-Minute Prep Guarantee",
    "📱 1-Tap QR Code Table Ordering",
    "🥗 Fresh Organic Kashmiri Spices",
    "👑 500,000+ Happy Diners Served"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
    }, 6500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const activeSlideObj = heroSlides[currentSlide];

  const handleDishMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateY = (x / (rect.width / 2)) * 22;
    const rotateX = -(y / (rect.height / 2)) * 22;
    setTilt({ rotateX, rotateY, isHovered: true });
  };

  const handleDishMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, isHovered: false });
  };

  const filteredMenuItems = activeCategory === 'all'
    ? menuHighlights
    : menuHighlights.filter(item => {
        const cat = (item.category || '').toLowerCase();
        const sel = activeCategory.toLowerCase();
        if (sel === 'starters') return cat.includes('starter');
        if (sel === 'main-course' || sel === 'mains') return cat.includes('main') || cat.includes('curry') || cat.includes('biryani');
        if (sel === 'curries') return cat.includes('curry') || cat.includes('curries');
        if (sel === 'biryani') return cat.includes('biryani');
        if (sel === 'breads') return cat.includes('bread') || cat.includes('roti') || cat.includes('naan');
        if (sel === 'south-indian') return cat.includes('south');
        if (sel === 'desserts') return cat.includes('dessert') || cat.includes('sweet');
        if (sel === 'beverages') return cat.includes('beverage') || cat.includes('drink') || cat.includes('lassi');
        return cat === sel;
      });

  return (
    <div className="homepage-wrapper" style={{ backgroundColor: '#FFFDF8', color: '#1A202C' }}>

      {/* ================= 1. HERO SLIDER SECTION (VIBRANT RMS PALETTE + 3D PARALLAX) ================= */}
      <section className="ref-hero-wrapper" style={{ minHeight: '92vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', backgroundColor: '#FFFDF8' }}>
        
        {/* Background Glowing Halos */}
        <div className="hero-ambient-blob hero-blob-1" style={{ background: 'radial-gradient(circle, rgba(255, 138, 0, 0.22), transparent 70%)' }} />
        <div className="hero-ambient-blob hero-blob-2" style={{ background: 'radial-gradient(circle, rgba(15, 42, 29, 0.18), transparent 70%)' }} />
        
        <div className="ref-hero-container" style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '3rem', alignItems: 'center' }}>
          
          {/* Left Column: Kinetic Typography & Actions */}
          <div style={{ position: 'relative', zIndex: 3 }}>
            <span className="ref-hero-badge" style={{ marginBottom: '1.25rem', display: 'inline-flex', alignItems: 'center', backgroundColor: '#EBF4F0', color: '#0F2A1D', border: '1px solid #C2E2D2' }}>
              <span className="live-pulse-dot" style={{ backgroundColor: '#FF8A00' }} />
              <Sparkles size={14} style={{ marginRight: '0.4rem', color: '#FF8A00' }} />
              {activeSlideObj.badge}
            </span>
            
            <h1 className="ref-hero-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.25rem', color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
              <KineticCenterBuild
                phrases={heroSlides.map(s => s.title)}
                activePhraseIndex={currentSlide}
              />
            </h1>

            <p className="ref-hero-subtitle" style={{ fontSize: '1.1rem', color: '#4A5568', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '560px' }}>
              {activeSlideObj.subtitle}
            </p>

            <Cta2
              primaryText={activeSlideObj.btnText}
              secondaryText="Our Heritage"
              onPrimaryClick={activeSlideObj.action}
              onSecondaryClick={() => setActivePage('about')}
              style={{ marginBottom: '2.5rem' }}
            />

            {/* Elevated Trust Badges Bar */}
            <div className="hero-trust-bar" style={{ backgroundColor: '#F0F7F3', border: '1px solid #D5E8DD' }}>
              <div className="hero-trust-item">
                <Zap size={16} color="#FF8A00" />
                <span style={{ color: '#0F2A1D', fontWeight: 600 }}>15-Min Dine-In Prep</span>
              </div>
              <div className="hero-trust-divider" style={{ backgroundColor: '#CBDCD2' }} />
              <div className="hero-trust-item">
                <ShieldCheck size={16} color="#0F2A1D" />
                <span style={{ color: '#0F2A1D', fontWeight: 600 }}>100% Clay Tandoor</span>
              </div>
              <div className="hero-trust-divider" style={{ backgroundColor: '#CBDCD2' }} />
              <div className="hero-trust-item">
                <Award size={16} color="#FF8A00" />
                <span style={{ color: '#0F2A1D', fontWeight: 600 }}>Authentic Dum Recipes</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Parallax Stage & Glass Dish Cards (NO RATING BADGES ON IMAGES) */}
          <div 
            className="ref-hero-dish-stage"
            onMouseMove={handleDishMouseMove}
            onMouseLeave={handleDishMouseLeave}
            style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', perspective: '1000px' }}
          >
            {/* Sunburst Halo */}
            <div className="dish-stage-halo" style={{ background: 'radial-gradient(circle, rgba(255, 138, 0, 0.28), transparent 70%)' }} />

            {/* Floating Glassmorphic Dish Card 1 (NO RATING BADGE) */}
            <div 
              style={{
                position: 'absolute',
                top: '4%',
                left: '-4%',
                zIndex: 10,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                padding: '0.75rem 1.1rem',
                borderRadius: '16px',
                boxShadow: '0 14px 35px rgba(0, 0, 0, 0.12)',
                border: '1.5px solid rgba(255, 255, 255, 0.9)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transform: tilt.isHovered ? 'translateZ(40px)' : 'translateZ(0px)',
                transition: 'transform 0.2s ease'
              }}
            >
              <img src={activeSlideObj.card1.img} alt="Dish" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0F2A1D' }}>{activeSlideObj.card1.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#E07A3C', fontWeight: 700 }}>{activeSlideObj.card1.tag}</div>
              </div>
            </div>

            {/* Floating Glassmorphic Dish Card 2 (NO RATING BADGE) */}
            <div 
              style={{
                position: 'absolute',
                bottom: '6%',
                right: '-3%',
                zIndex: 10,
                background: 'rgba(15, 42, 29, 0.94)',
                backdropFilter: 'blur(12px)',
                color: '#FFFFFF',
                padding: '0.75rem 1.1rem',
                borderRadius: '16px',
                boxShadow: '0 14px 35px rgba(15, 42, 29, 0.3)',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transform: tilt.isHovered ? 'translateZ(40px)' : 'translateZ(0px)',
                transition: 'transform 0.2s ease'
              }}
            >
              <img src={activeSlideObj.card2.img} alt="Dish" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#FFFFFF' }}>{activeSlideObj.card2.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#F2C14E', fontWeight: 700 }}>{activeSlideObj.card2.tag}</div>
              </div>
            </div>

            {/* Main Interactive 3D Parallax Dish Image */}
            <img
              src={activeSlideObj.mainDishImg}
              alt="Featured Dish"
              className={`ref-hero-main-img ${tilt.isHovered ? 'is-tilt-active' : ''}`}
              style={{
                width: '100%',
                maxWidth: '460px',
                height: 'auto',
                objectFit: 'contain',
                zIndex: 5,
                filter: 'drop-shadow(0 32px 55px rgba(15, 42, 29, 0.24))',
                transform: tilt.isHovered
                  ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(1.1)`
                  : 'rotateX(0deg) rotateY(0deg) scale(1)',
                transition: tilt.isHovered ? 'transform 0.08s ease-out' : 'transform 0.5s ease-out'
              }}
            />
          </div>

        </div>

        {/* Slide Pagination Indicator Pills */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '0.6rem' }}>
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              style={{
                width: idx === currentSlide ? '36px' : '10px',
                height: '10px',
                borderRadius: '5px',
                background: idx === currentSlide ? '#FF8A00' : 'rgba(15, 42, 29, 0.2)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ================= 2. LIVE MARQUEE BADGES SLIDER (DEEP OBSIDIAN EMERALD) ================= */}
      <section style={{ backgroundColor: '#0A2318', padding: '1.1rem 0', color: '#FFFFFF', overflow: 'hidden', borderTop: '2px solid #FF8A00' }}>
        <InfiniteSlider gap={36} speed={28} speedOnHover={0}>
          {marqueeBadges.map((badge, bIdx) => (
            <div 
              key={bIdx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.92rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                color: '#FF8A00',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{badge}</span>
              <span style={{ opacity: 0.35, color: '#FFFFFF' }}>•</span>
            </div>
          ))}
        </InfiniteSlider>
      </section>

      {/* ================= 3. OUR STORY & HERITAGE (LUXURY RMS FRESH MINT TINT) ================= */}
      <section style={{ backgroundColor: '#F0F7F3', padding: '6rem 1.5rem', borderTop: '1px solid #D8EADF' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.12em', color: '#E07A3C', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                OUR STORY & LEGACY
              </div>

              <h2 className="text-h1" style={{ fontSize: '2.5rem', color: '#0F2A1D', marginBottom: '1.75rem', fontFamily: 'var(--font-heading)', lineHeight: 1.25 }}>
                A Journey of Authentic Flavors & Modern Hospitality
              </h2>

              <p className="text-body" style={{ color: '#4A5568', fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                Flavora Kitchen brings the rich, authentic culinary traditions of India to your dining table. Founded in <strong>Jubilee Hills, Hyderabad in 2017</strong>, our master chefs infuse age-old recipes with Kashmiri spices, clay-tandoor roasting, and modern digital dining convenience.
              </p>

              <p className="text-body" style={{ color: '#4A5568', fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '2rem' }}>
                From royal dum biryanis to slow-simmered Dal Makhani Gold, every dish is prepared fresh to order with pure desi ghee and hand-milled spices.
              </p>

              <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '2.5rem', borderTop: '1px solid rgba(15, 42, 29, 0.12)', paddingTop: '1.75rem' }}>
                <div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>2017</div>
                  <div style={{ fontSize: '0.8rem', color: '#718096', textTransform: 'uppercase', fontWeight: 700 }}>Year Founded</div>
                </div>
                <div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#E07A3C', fontFamily: 'var(--font-heading)' }}>500K+</div>
                  <div style={{ fontSize: '0.8rem', color: '#718096', textTransform: 'uppercase', fontWeight: 700 }}>Happy Diners</div>
                </div>
                <div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#2E7D32', fontFamily: 'var(--font-heading)' }}>50+</div>
                  <div style={{ fontSize: '0.8rem', color: '#718096', textTransform: 'uppercase', fontWeight: 700 }}>Royal Dishes</div>
                </div>
              </div>

              <MagneticButton onClick={() => setActivePage('about')} variant="default">
                <span>Read Full Story</span>
                <ArrowRight size={16} />
              </MagneticButton>
            </div>

            <div style={{ position: 'relative' }}>
              <div 
                style={{
                  position: 'absolute',
                  inset: '-12px',
                  background: 'linear-gradient(135deg, rgba(255, 138, 0, 0.25), rgba(15, 42, 29, 0.18))',
                  borderRadius: '24px',
                  filter: 'blur(22px)',
                  zIndex: 1
                }}
              />
              <img
                src="/chef_plating.png"
                alt="Chef Plating Food in Kitchen"
                style={{
                  position: 'relative',
                  zIndex: 2,
                  width: '100%',
                  maxHeight: '460px',
                  objectFit: 'cover',
                  borderRadius: '20px',
                  boxShadow: '0 22px 45px rgba(15, 42, 29, 0.18)',
                  border: '2px solid rgba(255, 255, 255, 0.9)'
                }}
              />
            </div>

          </div>
        </div>
      </section>

      {/* ================= 4. SPECIAL COMBOS & CHEF DEALS (NO RATING BADGES ON IMAGES) ================= */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '6rem 1.5rem', borderTop: '1px solid #EAEAEA' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.12em', color: '#E07A3C', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
              EXCLUSIVE DEALS & COMBOS
            </span>
            <h2 className="text-h1" style={{ fontSize: '2.5rem', color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
              Chef Special Culinary Combos
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {specialCombos.map((offer, idx) => (
              <ProductCard
                key={idx}
                id={offer.title}
                title={offer.title}
                image={offer.img}
                price={offer.price}
                originalPrice={offer.origPrice}
                badge={offer.tag}
                isVeg={offer.isVeg}
                desc={offer.desc}
                category="Chef Combo Deal"
                onAddToCart={onOpenDemoModal}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================= 5. CURATED CULINARY SELECTION ================= */}
      <section style={{ backgroundColor: '#FFFDF8', padding: '6rem 1.5rem', borderTop: '1px solid #F0F4F2' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.12em', color: '#E07A3C', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
              OUR SIGNATURE MENU
            </span>
            <h2 className="text-h1" style={{ fontSize: '2.5rem', color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
              Explore Curated Culinary Selection
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', overflowX: 'auto', marginBottom: '3rem', paddingBottom: '0.5rem' }}>
            {[
              { id: 'all', label: 'All Dishes' },
              { id: 'starters', label: 'Starters' },
              { id: 'main-course', label: 'Main Course' },
              { id: 'curries', label: 'Curries' },
              { id: 'biryani', label: 'Biryani' },
              { id: 'breads', label: 'Breads' },
              { id: 'south-indian', label: 'South Indian' },
              { id: 'desserts', label: 'Desserts' },
              { id: 'beverages', label: 'Beverages' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '0.65rem 1.4rem',
                  borderRadius: '9999px',
                  border: '1.5px solid',
                  borderColor: activeCategory === cat.id ? '#0F2A1D' : 'rgba(15, 42, 29, 0.15)',
                  backgroundColor: activeCategory === cat.id ? '#0F2A1D' : '#FFFFFF',
                  color: activeCategory === cat.id ? '#FFFFFF' : '#0F2A1D',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: activeCategory === cat.id ? '0 4px 14px rgba(15, 42, 29, 0.2)' : 'none'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid of SmoothUI Product Cards (NO RATING BADGES ON IMAGES) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '2rem' }}>
            {filteredMenuItems.map((item, idx) => (
              <ProductCard
                key={idx}
                id={item.id || item.name}
                title={item.name}
                image={item.img}
                price={item.price}
                originalPrice={item.origPrice}
                badge={item.bestseller ? 'Bestseller' : item.isVeg ? 'Veg Special' : 'Chef Choice'}
                isVeg={item.isVeg}
                desc={item.desc}
                category={item.category}
                onAddToCart={() => setActivePage('menu')}
              />
            ))}
          </div>

          {/* View Full Menu CTA */}
          <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
            <MagneticButton onClick={() => setActivePage('menu')} variant="default" style={{ padding: '0.9rem 2.2rem', fontSize: '1rem' }}>
              <span>View Entire Menu (50+ Items)</span>
              <ArrowRight size={18} />
            </MagneticButton>
          </div>

        </div>
      </section>

      {/* ================= 6. TESTIMONIALS INFINITE MARQUEE (SMOOTH UI) ================= */}
      <section style={{ backgroundColor: '#F0F7F3', padding: '6rem 1.5rem', borderTop: '1px solid #D8EADF' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.12em', color: '#E07A3C', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
              GUEST FEEDBACK & REVIEWS
            </span>
            <h2 className="text-h1" style={{ fontSize: '2.5rem', color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
              Loved by 500,000+ Guests & Resto Partners
            </h2>
          </div>

          {/* SmoothUI Infinite Marquee Carousel Banner */}
          <InfiniteSlider gap={24} speed={35} speedOnHover={0}>
            <div className="card" style={{ width: '380px', padding: '1.75rem', borderRadius: '16px', background: '#FFFFFF', border: '1px solid rgba(15, 42, 29, 0.08)', margin: 0, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' }}>
              <p className="text-body" style={{ color: '#4A5568', fontStyle: 'italic', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                "The instant QR menu transformed our Friday night table turnaround. Guests love ordering appetizers directly without waiting for waiters."
              </p>
              <div style={{ fontWeight: 800, color: '#0F2A1D', fontSize: '0.95rem' }}>Chef Ranveer Brar</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>Culinary Director, Mumbai</div>
            </div>

            <div className="card" style={{ width: '380px', padding: '1.75rem', borderRadius: '16px', background: '#FFFFFF', border: '1px solid rgba(15, 42, 29, 0.08)', margin: 0, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' }}>
              <p className="text-body" style={{ color: '#4A5568', fontStyle: 'italic', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                "KDS dark mode display in the kitchen eliminated all ticket lost issues. Food reaches guests in less than 12 minutes!"
              </p>
              <div style={{ fontWeight: 800, color: '#0F2A1D', fontSize: '0.95rem' }}>Ananya Sen</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>Operations Manager, Bengaluru</div>
            </div>

            <div className="card" style={{ width: '380px', padding: '1.75rem', borderRadius: '16px', background: '#FFFFFF', border: '1px solid rgba(15, 42, 29, 0.08)', margin: 0, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' }}>
              <p className="text-body" style={{ color: '#4A5568', fontStyle: 'italic', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                "Automated CGST/SGST 5% billing and Razorpay UPI settlements save our accounting team 15 hours every week."
              </p>
              <div style={{ fontWeight: 800, color: '#0F2A1D', fontSize: '0.95rem' }}>Vikram Malhotra</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>Restaurant Owner, Delhi NCR</div>
            </div>

            <div className="card" style={{ width: '380px', padding: '1.75rem', borderRadius: '16px', background: '#FFFFFF', border: '1px solid rgba(15, 42, 29, 0.08)', margin: 0, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' }}>
              <p className="text-body" style={{ color: '#4A5568', fontStyle: 'italic', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                "Hyderabadi Dum Biryani and clay tandoor starters bring 400+ guests every single weekend to our flagship branch."
              </p>
              <div style={{ fontWeight: 800, color: '#0F2A1D', fontSize: '0.95rem' }}>Priya Verma</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>General Manager, Hyderabad</div>
            </div>
          </InfiniteSlider>
        </div>
      </section>

      {/* ================= 7. BOTTOM MAGNETIC CTA FOOTER BANNER ================= */}
      <section style={{ backgroundColor: '#0A2318', padding: '6rem 1.5rem', textAlign: 'center', color: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', left: '30%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255, 138, 0, 0.18), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '750px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.12em', color: '#FF8A00', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'block' }}>
            READY FOR AN UNFORGETTABLE DINING EXPERIENCE?
          </span>

          <h2 className="text-h1" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', color: '#FFFFFF', fontFamily: 'var(--font-heading)', lineHeight: 1.2, marginBottom: '1.25rem' }}>
            Book Your Table or Order Instant QR Dining Today
          </h2>

          <p style={{ fontSize: '1.05rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Join 500,000+ happy diners enjoying authentic tandoori craftsmanship, royal dum biryani, and fast digital service.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <MagneticButton onClick={() => setActivePage('menu')} variant="secondary" style={{ padding: '0.9rem 2rem', fontSize: '0.95rem' }}>
              <span>Get Started</span>
              <ArrowRight size={17} />
            </MagneticButton>

            <MagneticButton onClick={() => setActivePage('features')} variant="outline" style={{ borderColor: '#FFFFFF', color: '#FFFFFF', padding: '0.9rem 1.8rem', fontSize: '0.95rem' }}>
              <span>Learn More</span>
            </MagneticButton>

            <MagneticButton onClick={() => setActivePage('contact')} variant="default" style={{ backgroundColor: '#142F24', borderColor: '#142F24', padding: '0.9rem 1.8rem', fontSize: '0.95rem' }}>
              <span>Contact Us</span>
            </MagneticButton>
          </div>
        </div>
      </section>

    </div>
  );
}
