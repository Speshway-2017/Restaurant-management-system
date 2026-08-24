import React, { useState, useEffect } from 'react';
import { Tag, Sparkles, Flame, Clock, Gift, CheckCircle2, ArrowRight, Search, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import MagneticButton from '../components/MagneticButton';
import { findItemInCatalog, calculateCartTotal } from '../utils/menuRegistry';

export default function OffersPage({ onOpenDemoModal }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleClearCart = () => {
    updateCartState({});
  };

  const deals = [
    {
      id: 'deal-1',
      title: 'Royal Tandoori Feast',
      category: 'Royal Feasts',
      badge: '20% OFF TODAY',
      price: 999,
      originalPrice: 1250,
      badgeColor: '#FF8A00',
      desc: 'Paneer Tikka Angara, Murgh Malai Kabab, Butter Naan x2, Dal Makhani & Gulab Jamun.',
      validity: 'Valid on Dine-In & Takeaway',
      image: '/hero_dish_1.png',
      isVeg: false
    },
    {
      id: 'deal-2',
      title: 'Shahi Biryani Combo',
      category: 'Chef Combos',
      badge: 'WEEKEND SPECIAL',
      price: 649,
      originalPrice: 799,
      badgeColor: '#E07A3C',
      desc: 'Hyderabadi Dum Biryani + Mirchi Ka Salan + Double Ka Meetha + Mango Lassi.',
      validity: 'Valid Fri – Sun',
      image: '/hero_dish_2.png',
      isVeg: false
    },
    {
      id: 'deal-3',
      title: 'Chef Special Thali',
      category: 'Veg Specials',
      badge: 'BESTSELLER',
      price: 450,
      originalPrice: 550,
      badgeColor: '#2E7D32',
      desc: 'Paneer Butter Masala, Dal Tadka, Jeera Rice, Tandoori Rotis x3, Phirni & Salad.',
      validity: 'Available Lunch Hours (12 PM – 3:30 PM)',
      image: '/chef_plating.png',
      isVeg: true
    },
    {
      id: 'deal-4',
      title: 'Family Feast Platter (Serves 4)',
      category: 'Royal Feasts',
      badge: 'FAMILY SAVER',
      price: 1799,
      originalPrice: 2200,
      badgeColor: '#FF8A00',
      desc: 'Full Tandoori Murgh, 2x Biryani Pots, Assorted Naan Basket, Dal Makhani & Dessert Platter.',
      validity: 'Valid Daily All Hours',
      image: '/carousel_2.png',
      isVeg: false
    },
    {
      id: 'deal-5',
      title: 'Monsoon Chai & Pakora Perk',
      category: 'Time-Limited',
      badge: 'AFTERNOON DEAL',
      price: 249,
      originalPrice: 320,
      badgeColor: '#E07A3C',
      desc: 'Hot Masala Chai x2 with Paneer & Onion Pakora Platter + Mint Chutney.',
      validity: 'Valid 4 PM – 6:30 PM',
      image: '/tandoor_oven.png',
      isVeg: true
    },
    {
      id: 'deal-6',
      title: 'First QR Order Bonus',
      category: 'Chef Combos',
      badge: '15% FLAT DISCOUNT',
      price: 399,
      originalPrice: 499,
      badgeColor: '#2E7D32',
      desc: 'Scan table QR code and pay via UPI to unlock instant 15% discount on total bill.',
      validity: 'Valid for New Guests',
      image: '/carousel_3.png',
      isVeg: true
    }
  ];

  const totalCartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalCartPrice = calculateCartTotal(cart, deals);

  return (
    <div className="offers-page" style={{ position: 'relative', paddingBottom: totalCartCount > 0 ? '6rem' : '0', backgroundColor: '#FFFDF8' }}>
      {/* Hero Banner (Unified Page Hero System) */}
      <section className="page-hero-banner-unified">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="page-hero-badge-unified">
            <Tag size={14} />
            <span>EXCLUSIVES & CHEF COMBOS</span>
          </div>

          <h1 className="page-hero-title-unified">
            Special Offers & Deals
          </h1>

          <p className="page-hero-subtitle-unified">
            Enjoy handcrafted chef combo feasts, weekend thali specials, and exclusive discounts at Flavora Kitchen.
          </p>
        </div>
      </section>

      {/* Filter & Search Bar Section (Menu Page Properties) */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderBottom: '1px solid #EAEAEA' }}>
        <div className="section" style={{ padding: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '280px', flexGrow: 1, maxWidth: '420px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#718096' }} />
              <input 
                type="text" 
                placeholder="Search deals, combos, discount codes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem', height: '44px', borderRadius: '9999px' }}
              />
            </div>

            {/* Veg Only Toggle Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => setVegOnly(!vegOnly)}>
              <div 
                style={{ 
                  width: '42px', 
                  height: '24px', 
                  borderRadius: '12px', 
                  backgroundColor: vegOnly ? '#2E7D32' : '#E2E8F0',
                  padding: '2px',
                  transition: 'background-color 0.25s ease'
                }}
              >
                <div 
                  style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    backgroundColor: '#FFFFFF',
                    transform: vegOnly ? 'translateX(18px)' : 'translateX(0)',
                    transition: 'transform 0.25s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                  }} 
                />
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: '700', color: vegOnly ? '#2E7D32' : '#4A5568' }}>
                Pure Veg Deals Only
              </span>
            </div>

          </div>

          {/* Category Filter Pills (Menu Page Style) */}
          <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', marginTop: '1.25rem', paddingBottom: '0.25rem' }}>
            {[
              { id: 'all', label: 'All Deals' },
              { id: 'Royal Feasts', label: 'Royal Feasts' },
              { id: 'Chef Combos', label: 'Chef Combos' },
              { id: 'Veg Specials', label: 'Veg Specials' },
              { id: 'Time-Limited', label: 'Time-Limited' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '9999px',
                  border: '1.5px solid',
                  borderColor: selectedCategory === cat.id ? '#0F2A1D' : '#E2E8F0',
                  backgroundColor: selectedCategory === cat.id ? '#0F2A1D' : '#FFFFFF',
                  color: selectedCategory === cat.id ? '#FFFFFF' : '#0F2A1D',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* Offers Grid with SmoothUI Product Cards */}
      <section style={{ padding: '2rem 1.5rem 2.5rem 1.5rem', backgroundColor: '#F0F7F3' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          {filteredDeals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#718096' }}>
              <Tag size={48} color="#A0AEC0" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.2rem', color: '#0F2A1D', fontWeight: 800 }}>No special deals match your search</h3>
              <p style={{ fontSize: '0.9rem', marginTop: '0.4rem' }}>Try searching for another combo or clear the pure veg filter.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '2rem' }}>
              {filteredDeals.map(deal => (
                <ProductCard
                  key={deal.id}
                  id={deal.id}
                  title={deal.title}
                  image={deal.image}
                  price={deal.price}
                  originalPrice={deal.originalPrice}
                  badge={deal.badge}
                  isVeg={deal.isVeg}
                  desc={`${deal.desc} • ${deal.validity}`}
                  category={deal.category}
                  quantity={cart[deal.id] || 0}
                  onAddToCart={handleAddToCart}
                  onDecreaseQty={handleDecreaseQty}
                  onDeleteItem={handleDeleteItem}
                />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* Floating Bottom Cart Bar (Identical to Menu Page) */}
      {totalCartCount > 0 && (
        <div 
          style={{ 
            position: 'fixed', 
            bottom: '1.5rem', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 900,
            backgroundColor: '#0F2A1D',
            color: '#FFFFFF',
            borderRadius: '9999px',
            padding: '0.75rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            boxShadow: '0 12px 32px rgba(15, 42, 29, 0.4)',
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
            maxWidth: '92%',
            width: '460px',
            backdropFilter: 'blur(12px)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexGrow: 1 }}>
            <div 
              style={{ 
                backgroundColor: '#FF8A00', 
                color: '#FFFFFF', 
                fontWeight: '800', 
                borderRadius: '50%', 
                width: '32px', 
                height: '32px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.88rem' 
              }}
            >
              {totalCartCount}
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#A3D4B5', textTransform: 'uppercase', fontWeight: 700 }}>Total Cart</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF' }}>₹{totalCartPrice}</div>
            </div>
          </div>

          <button 
            type="button" 
            onClick={handleClearCart} 
            style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Clear
          </button>

          <MagneticButton 
            onClick={onOpenDemoModal} 
            variant="secondary"
            style={{ padding: '0.6rem 1.4rem', fontSize: '0.88rem' }}
          >
            <span>Claim Deals</span>
            <ArrowRight size={16} />
          </MagneticButton>
        </div>
      )}
    </div>
  );
}
