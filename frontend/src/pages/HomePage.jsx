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
import { findItemInCatalog, calculateCartTotal } from '../utils/menuRegistry';

export default function HomePage({ setActivePage, onOpenDemoModal }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, isHovered: false });

  // Persistent shared cart state across pages
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_active_cart');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const updateCartState = (newCart) => {
    setCart(newCart);
    try {
      localStorage.setItem('flavora_active_cart', JSON.stringify(newCart));
      window.dispatchEvent(new Event('flavora_cart_updated'));
    } catch (e) {}
  };

  useEffect(() => {
    const handleCartSync = () => {
      try {
        const saved = localStorage.getItem('flavora_active_cart');
        setCart(saved ? JSON.parse(saved) : {});
      } catch (e) {}
    };
    window.addEventListener('flavora_cart_updated', handleCartSync);
    return () => window.removeEventListener('flavora_cart_updated', handleCartSync);
  }, []);

  const handleAddToCart = (id) => {
    const updated = { ...cart, [id]: (cart[id] || 0) + 1 };
    updateCartState(updated);
  };

  const handleDecreaseQty = (id) => {
    const current = cart[id] || 0;
    let updated;
    if (current <= 1) {
      updated = { ...cart };
      delete updated[id];
    } else {
      updated = { ...cart, [id]: current - 1 };
    }
    updateCartState(updated);
  };

  const handleDeleteItem = (id) => {
    const updated = { ...cart };
    delete updated[id];
    updateCartState(updated);
  };

  // Default menu highlights
  const [menuHighlights, setMenuHighlights] = useState([
    { id: 1, name: 'Paneer Tikka Angara', category: 'Starters', price: 340, origPrice: '₹420', isVeg: true, desc: 'Cottage cheese marinated in Kashmiri chili & tandoori spices.', img: '/hero_dish_1.png', bestseller: true },
    { id: 2, name: 'Murgh Malai Kabab', category: 'Starters', price: 420, origPrice: '₹500', isVeg: false, desc: 'Tender chicken breast infused with cream, cheese, and cardamom.', img: '/carousel_2.png' },
    { id: 3, name: 'Dal Makhani Gold', category: 'Main Course', price: 380, origPrice: '₹460', isVeg: true, desc: 'Slow-cooked black lentils simmered overnight with white butter.', img: '/carousel_1.png', bestseller: true },
    { id: 4, name: 'Hyderabadi Dum Biryani', category: 'Main Course', price: 490, origPrice: '₹580', isVeg: false, desc: 'Aromatic basmati rice layered with spiced marinated lamb.', img: '/hero_dish_2.png', bestseller: true },
    { id: 5, name: 'Saffron Shahi Tukda', category: 'Desserts', price: 260, origPrice: '₹320', isVeg: true, desc: 'Crispy fried bread soaked in saffron rabri topped with pistachios.', img: '/tandoor_oven.png' },
    { id: 6, name: 'Mango Lassi Delight', category: 'Beverages', price: 180, origPrice: '₹220', isVeg: true, desc: 'Thick churned yogurt blended with Alphonsa mango pulp.', img: '/carousel_3.png' }
  ]);

  const totalCartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalCartPrice = calculateCartTotal(cart, menuHighlights);

  useEffect(() => {
    const loadHighlights = () => {
      const savedLocal = localStorage.getItem('flavora_dishes');
      let localDishesMap = {};
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal);
          if (parsed && parsed.length > 0) {
            parsed.forEach(item => {
              const nameKey = (item.name || '').toLowerCase().trim();
              localDishesMap[nameKey] = item;
            });
            setMenuHighlights(parsed.map(item => ({
              id: item._id || item.id,
              name: item.name,
              category: item.category || 'Main Course',
              price: item.price,
              origPrice: item.origPrice || `₹${Math.round(item.price * 1.25)}`,
              isVeg: item.isVeg !== undefined ? item.isVeg : true,
              available: item.available !== undefined ? item.available : (item.isAvailable !== undefined ? item.isAvailable : true),
              desc: item.desc || '',
              img: item.img || '/hero_dish_2.png',
              bestseller: item.bestseller !== undefined ? item.bestseller : (item.isBestseller !== undefined ? item.isBestseller : false)
            })));
          }
        } catch (e) {}
      }

      // Fetch from API database and merge local availability status
      api.getMenuItems()
        .then((data) => {
          if (data && data.length > 0) {
            const formatted = data.map(item => {
              const nameKey = (item.name || '').toLowerCase().trim();
              const localOverride = localDishesMap[nameKey];
              const isAvail = localOverride ? (localOverride.available !== undefined ? localOverride.available : localOverride.isAvailable) : (item.isAvailable !== undefined ? item.isAvailable : true);
              const isBest = localOverride ? (localOverride.bestseller !== undefined ? localOverride.bestseller : localOverride.isBestseller) : (item.isBestseller !== undefined ? item.isBestseller : item.bestseller);

              return {
                id: item._id || item.id,
                name: item.name,
                category: item.category || 'Main Course',
                price: item.price,
                origPrice: `₹${Math.round(item.price * 1.25)}`,
                isVeg: item.isVeg !== undefined ? item.isVeg : true,
                available: isAvail !== false,
                desc: item.desc || '',
                img: item.img || '/hero_dish_2.png',
                bestseller: isBest
              };
            });
            if (formatted.length > 0) {
              setMenuHighlights(formatted);
            }
          }
        })
        .catch((err) => {
          console.log('HomePage API fallback active:', err.message);
        });
    };

    loadHighlights();
    window.addEventListener('flavora_dishes_updated', loadHighlights);
    return () => window.removeEventListener('flavora_dishes_updated', loadHighlights);
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

  const defaultCombosList = [
    {
      id: 'Royal Biryani Feast Combo',
      title: 'Royal Biryani Feast Combo',
      desc: '1 Full Chicken Dum Biryani + 2 Butter Naan + 1 Paneer Tikka + Gulab Jamun + Soft Drinks.',
      price: 890,
      origPrice: '₹1,250',
      tag: 'BEST VALUE (30% OFF)',
      img: '/hero_dish_2.png',
      isVeg: false,
      available: true
    },
    {
      id: 'Tandoori Kebab Platter Special',
      title: 'Tandoori Kebab Platter Special',
      desc: 'Assorted Murgh Malai Kabab, Tandoori Chicken, Paneer Angara & Mint Chutney.',
      price: 760,
      origPrice: '₹980',
      tag: 'CHEF SPECIAL',
      img: '/carousel_1.png',
      isVeg: false,
      available: true
    },
    {
      id: 'Dal Makhani & Shahi Thali',
      title: 'Dal Makhani & Shahi Thali',
      desc: 'Dal Makhani Gold + Paneer Butter Masala + Saffron Rice + 3 Butter Rotis + Lassi.',
      price: 640,
      origPrice: '₹820',
      tag: 'PURE VEG ROYAL',
      img: '/hero_dish_1.png',
      isVeg: true,
      available: true
    },
    {
      id: 'Family Royal Celebration Feast',
      title: 'Family Royal Celebration Feast',
      desc: '2 Full Dum Biryanis + 4 Garlic Naans + Paneer Tikka + Gulab Jamun Platter + Beverages.',
      price: 1150,
      origPrice: '₹1,490',
      tag: 'FAMILY COMBO (25% OFF)',
      img: '/carousel_2.png',
      isVeg: false,
      available: true
    }
  ];

  const [specialCombos, setSpecialCombos] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_combos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(c => c.available !== false);
        }
      }
    } catch (e) {}
    return defaultCombosList;
  });

  useEffect(() => {
    const loadDynamicCombos = () => {
      try {
        const saved = localStorage.getItem('flavora_combos');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSpecialCombos(parsed.filter(c => c.available !== false));
            return;
          }
        }
      } catch (e) {}
      setSpecialCombos(defaultCombosList);
    };

    loadDynamicCombos();
    window.addEventListener('flavora_combos_updated', loadDynamicCombos);
    window.addEventListener('flavora_dishes_updated', loadDynamicCombos);
    return () => {
      window.removeEventListener('flavora_combos_updated', loadDynamicCombos);
      window.removeEventListener('flavora_dishes_updated', loadDynamicCombos);
    };
  }, []);

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

  const filteredMenuItems = menuHighlights.filter(item => {
    if (vegOnly && !item.isVeg) return false;
    const cat = (item.category || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    const isBiryani = cat.includes('biryani') || name.includes('biryani');

    if (activeCategory === 'biryani') return isBiryani;
    if (activeCategory === 'specials') return !isBiryani;

    // For 'all' on Home page, include Biryanis and Chef Special highlights
    return isBiryani || item.bestseller || !isBiryani;
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
      <section style={{ backgroundColor: '#F0F7F3', padding: '3.5rem 1.5rem', borderTop: '1px solid #D8EADF' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
            
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.12em', color: '#E07A3C', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                OUR STORY & LEGACY
              </div>

              <h2 className="text-h1" style={{ fontSize: '2.3rem', color: '#0F2A1D', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)', lineHeight: 1.25 }}>
                A Journey of Authentic Flavors & Modern Hospitality
              </h2>

              <p className="text-body" style={{ color: '#4A5568', fontSize: '1rem', lineHeight: '1.7', marginBottom: '1.25rem' }}>
                Flavora Kitchen brings the rich, authentic culinary traditions of India to your dining table. Founded in <strong>Jubilee Hills, Hyderabad in 2017</strong>, our master chefs infuse age-old recipes with Kashmiri spices, clay-tandoor roasting, and modern digital dining convenience.
              </p>

              <p className="text-body" style={{ color: '#4A5568', fontSize: '1rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>
                From royal dum biryanis to slow-simmered Dal Makhani Gold, every dish is prepared fresh to order with pure desi ghee and hand-milled spices.
              </p>

              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.75rem', borderTop: '1px solid rgba(15, 42, 29, 0.12)', paddingTop: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>2017</div>
                  <div style={{ fontSize: '0.78rem', color: '#718096', textTransform: 'uppercase', fontWeight: 700 }}>Year Founded</div>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#E07A3C', fontFamily: 'var(--font-heading)' }}>500K+</div>
                  <div style={{ fontSize: '0.78rem', color: '#718096', textTransform: 'uppercase', fontWeight: 700 }}>Happy Diners</div>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#2E7D32', fontFamily: 'var(--font-heading)' }}>50+</div>
                  <div style={{ fontSize: '0.78rem', color: '#718096', textTransform: 'uppercase', fontWeight: 700 }}>Royal Dishes</div>
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
                  inset: '-10px',
                  background: 'linear-gradient(135deg, rgba(255, 138, 0, 0.25), rgba(15, 42, 29, 0.18))',
                  borderRadius: '24px',
                  filter: 'blur(20px)',
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
                  maxHeight: '400px',
                  objectFit: 'cover',
                  borderRadius: '20px',
                  boxShadow: '0 18px 40px rgba(15, 42, 29, 0.18)',
                  border: '2px solid rgba(255, 255, 255, 0.9)'
                }}
              />
            </div>

          </div>
        </div>
      </section>

      {/* ================= 4. SPECIAL COMBOS & CHEF DEALS (NO RATING BADGES ON IMAGES) ================= */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '2.5rem 1.5rem 2rem 1.5rem', borderTop: '1px solid #EAEAEA' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.12em', color: '#E07A3C', textTransform: 'uppercase', marginBottom: '0.35rem', display: 'block' }}>
              EXCLUSIVE DEALS & COMBOS
            </span>
            <h2 className="text-h1" style={{ fontSize: '2.3rem', color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
              Chef Special Culinary Combos
            </h2>
          </div>

          <div className="chef-combos-grid">
            {specialCombos.map((offer, idx) => {
              const comboKey = offer.id || offer.title;
              const qty = cart[comboKey] || 0;
              return (
                <ProductCard
                  key={idx}
                  id={comboKey}
                  title={offer.title}
                  image={offer.img}
                  price={offer.price}
                  originalPrice={offer.origPrice}
                  badge={offer.tag}
                  isVeg={offer.isVeg}
                  desc={offer.desc}
                  category="Chef Combo Deal"
                  quantity={qty}
                  onAddToCart={() => handleAddToCart(comboKey)}
                  onDecreaseQty={() => handleDecreaseQty(comboKey)}
                  onDeleteItem={() => handleDeleteItem(comboKey)}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= 5. CURATED CULINARY SELECTION ================= */}
      <section style={{ backgroundColor: '#FFFDF8', padding: '2rem 1.5rem 1.75rem 1.5rem', borderTop: '1px solid #F0F4F2' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.12em', color: '#E07A3C', textTransform: 'uppercase', marginBottom: '0.35rem', display: 'block' }}>
              OUR SIGNATURE MENU
            </span>
            <h2 className="text-h1" style={{ fontSize: '2.3rem', color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
              Explore Curated Culinary Selection
            </h2>
          </div>

          {/* Category Filter Pills (Biryanis & Chef Specials Only) */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'nowrap', width: '100%', maxWidth: '100%', overflowX: 'auto', marginBottom: '1.5rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="no-scrollbar">
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', flexWrap: 'nowrap', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="no-scrollbar">
              {[
                { id: 'all', label: '✨ All Highlights' },
                { id: 'biryani', label: '🍚 Royal Biryanis' },
                { id: 'specials', label: '🔥 Chef Specials' }
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
                    flexShrink: 0,
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: activeCategory === cat.id ? '0 4px 14px rgba(15, 42, 29, 0.2)' : 'none'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Veg Only Toggle Switch (Single Line) */}
            <div 
              onClick={() => setVegOnly(!vegOnly)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                backgroundColor: 'transparent',
                padding: '0.4rem 0.6rem',
                cursor: 'pointer',
                userSelect: 'none',
                flexShrink: 0
              }}
            >
              <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #166534', borderRadius: '3px', position: 'relative', flexShrink: 0 }}>
                <span style={{ position: 'absolute', inset: '2.5px', backgroundColor: '#166534', borderRadius: '50%' }}></span>
              </span>
              <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#1E4636', whiteSpace: 'nowrap' }}>Veg Only</span>
              <div 
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '14px',
                  border: '1.5px solid #000000',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
                  backgroundColor: vegOnly ? '#166534' : '#E2E8F0',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  marginLeft: '0.25rem',
                  flexShrink: 0
                }}
              >
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  position: 'absolute',
                  top: '1.5px',
                  left: vegOnly ? '21px' : '2px',
                  transition: 'left 0.2s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Render ONLY Royal Biryanis & Chef Specials on Home Page */}
          {(() => {
            const HOME_GROUPS = [
              {
                key: 'Royal Dum Biryanis',
                icon: '🍚',
                match: (item) => (item.category || '').toLowerCase().includes('biryani') || (item.name || '').toLowerCase().includes('biryani')
              },
              {
                key: 'Chef Special Delicacies',
                icon: '🔥',
                match: (item) => !(item.category || '').toLowerCase().includes('biryani') && !(item.name || '').toLowerCase().includes('biryani')
              }
            ];

            const homeSections = HOME_GROUPS.map(grp => {
              const matchedItems = filteredMenuItems.filter(grp.match).slice(0, 4);
              return {
                key: grp.key,
                icon: grp.icon,
                items: matchedItems
              };
            }).filter(grp => grp.items.length > 0);

            return homeSections.map((group) => (
              <div key={group.key} style={{ marginBottom: '2.5rem' }}>
                
                {/* Category Alignment Section Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', borderBottom: '2px solid rgba(15, 42, 29, 0.12)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>{group.icon}</span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F2A1D', margin: 0, fontFamily: "var(--font-heading)" }}>
                    {group.key}
                  </h3>
                </div>

                {/* Grid of Dishes for this Category (4 Cards Per Row on Desktop) */}
                <div className="chef-combos-grid">
                  {group.items.map((item, idx) => {
                    const itemKey = item.id || item.name;
                    const qty = cart[itemKey] || 0;
                    return (
                      <ProductCard
                        key={idx}
                        id={itemKey}
                        title={item.name}
                        image={item.img}
                        price={item.price}
                        originalPrice={item.origPrice}
                        badge={item.bestseller ? 'Bestseller' : item.isVeg ? 'Veg Special' : 'Chef Choice'}
                        isVeg={item.isVeg}
                        available={item.available}
                        isAvailable={item.available}
                        bestseller={item.bestseller}
                        isBestseller={item.bestseller}
                        desc={item.desc}
                        category={item.category}
                        quantity={qty}
                        onAddToCart={() => handleAddToCart(itemKey)}
                        onDecreaseQty={() => handleDecreaseQty(itemKey)}
                        onDeleteItem={() => handleDeleteItem(itemKey)}
                      />
                    );
                  })}
                </div>

              </div>
            ));
          })()}

          {/* View Full Menu CTA */}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <MagneticButton onClick={() => setActivePage('menu')} variant="default" style={{ padding: '0.9rem 2.2rem', fontSize: '1rem' }}>
              <span>View Entire Menu (50+ Items)</span>
              <ArrowRight size={18} />
            </MagneticButton>
          </div>

        </div>
      </section>

      {/* ================= 6. TESTIMONIALS INFINITE MARQUEE (SMOOTH UI) ================= */}
      <section style={{ backgroundColor: '#F0F7F3', padding: '2rem 1.5rem 2.25rem 1.5rem', borderTop: '1px solid #D8EADF' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.12em', color: '#E07A3C', textTransform: 'uppercase', marginBottom: '0.35rem', display: 'block' }}>
              GUEST FEEDBACK & REVIEWS
            </span>
            <h2 className="text-h1" style={{ fontSize: '2.3rem', color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
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

      {/* Small Floating View Cart Button at Bottom-Right (Appears when dishes added) */}
      {totalCartCount > 0 && (
        <button
          onClick={() => setActivePage('menu')}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#FF8A00',
            color: '#FFFFFF',
            padding: '0.65rem 1.25rem',
            borderRadius: '9999px',
            boxShadow: '0 8px 24px rgba(255, 138, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            border: '2px solid #FFFFFF',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '0.88rem',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), boxShadow 0.2s ease',
            animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 138, 0, 0.55)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 138, 0, 0.45)';
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>🛒</span>
          <span>View Cart ({totalCartCount})</span>
          <span style={{ opacity: 0.85, fontWeight: 700 }}>• ₹{totalCartPrice}</span>
          <ArrowRight size={16} />
        </button>
      )}

    </div>
  );
}
