import React, { useState, useEffect } from 'react';
import { Utensils, Search, Plus, Minus, Trash2, ShoppingBag, CheckCircle2, QrCode, Sparkles, ChevronDown, ChefHat, Send } from 'lucide-react';
import { api } from '../services/api';
import MenuDishStrip from '../components/MenuDishStrip';
import ExposureSlider from '../components/ExposureSlider';
import { findItemInCatalog, calculateCartTotal } from '../utils/menuRegistry';

export default function MenuPage({ onOpenDemoModal }) {
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
  // Dynamic Table number initialized strictly from QR code parameter (?table=...) or stored scan (No default T-01)
  const [tableNum, setTableNum] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tableParam = urlParams.get('table');
      if (tableParam) {
        const upper = tableParam.toUpperCase();
        localStorage.setItem('flavora_scanned_table', upper);
        return upper;
      }
      return localStorage.getItem('flavora_scanned_table') || '';
    } catch (e) {
      return '';
    }
  });
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [chefNotes, setChefNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState(null);

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

  const [menuItems, setMenuItems] = useState([
    { id: 1, name: 'Paneer Tikka Angara', category: 'Starters', price: 340, isVeg: true, desc: 'Cottage cheese marinated in Kashmiri chili and tandoori spices.', img: '/hero_dish_1.png', available: true },
    { id: 2, name: 'Murgh Malai Kabab', category: 'Starters', price: 420, isVeg: false, desc: 'Tender chicken breast infused with cream, cheese, and cardamom.', img: '/carousel_3.png', available: true },
    { id: 3, name: 'Tandoori Murgh Full', category: 'Starters', price: 560, isVeg: false, desc: 'Whole chicken marinated in mustard oil & spices roasted in clay tandoori oven.', img: '/tandoor_oven.png', available: true },
    { id: 4, name: 'Dal Makhani Gold', category: 'Main Course', price: 380, isVeg: true, desc: 'Slow-cooked black lentils simmered overnight with white butter and cream.', img: '/carousel_2.png', available: true },
    { id: 5, name: 'Paneer Butter Masala', category: 'Main Course', price: 390, isVeg: true, desc: 'Soft cottage cheese cubes in rich tomato cashew gravy.', img: '/hero_dish_1.png', available: true },
    { id: 6, name: 'Butter Chicken Special', category: 'Main Course', price: 480, isVeg: false, desc: 'Charcoal-grilled chicken simmered in rich buttery tomato gravy.', img: '/hero_dish_2.png', available: true },
    { id: 7, name: 'Hyderabadi Dum Biryani (Chicken)', category: 'Biryani', price: 490, isVeg: false, desc: 'Aromatic basmati rice layered with spiced marinated chicken cooked on dum.', img: '/hero_dish_2.png', available: true },
    { id: 8, name: 'Hyderabadi Veg Dum Biryani', category: 'Biryani', price: 420, isVeg: true, desc: 'Garden fresh vegetables layered with saffron rice and fragrant biryani spices.', img: '/carousel_2.png', available: true },
    { id: 9, name: 'Garlic Butter Naan', category: 'Breads', price: 90, isVeg: true, desc: 'Fresh clay tandoori bread brushed with melted butter & chopped garlic.', img: '/carousel_1.png', available: true },
    { id: 10, name: 'Butter Tandoori Roti', category: 'Breads', price: 50, isVeg: true, desc: 'Whole wheat flatbread baked fresh in clay tandoori oven.', img: '/tandoor_oven.png', available: true },
    { id: 11, name: 'Saffron Shahi Tukda', category: 'Desserts', price: 260, isVeg: true, desc: 'Crispy fried bread soaked in saffron rabri topped with pistachios.', img: '/chef_plating.png', available: true },
    { id: 12, name: 'Gulab Jamun with Ice Cream', category: 'Desserts', price: 220, isVeg: true, desc: 'Hot khoya dumplings served with cold vanilla bean ice cream.', img: '/carousel_3.png', available: true },
    { id: 13, name: 'Mango Lassi Delight', category: 'Beverages', price: 180, isVeg: true, desc: 'Thick churned sweet yogurt blended with Alphonsa mango pulp.', img: '/hero_dish_1.png', available: true },
    { id: 14, name: 'Masala Butter Milk', category: 'Beverages', price: 120, isVeg: true, desc: 'Refreshing churned buttermilk infused with roasted cumin, green chili & mint.', img: '/carousel_2.png', available: true },
  ]);

  // Read ?table= query parameter from URL (e.g. ?table=T-03)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableParam = urlParams.get('table');
    if (tableParam) {
      setTableNum(tableParam.toUpperCase());
    }
  }, []);

  useEffect(() => {
    const loadMenu = () => {
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
            setMenuItems(parsed.map(item => ({
              id: item._id || item.id,
              name: item.name,
              category: item.category || 'Main Course',
              price: item.price,
              isVeg: item.isVeg !== undefined ? item.isVeg : true,
              available: item.available !== undefined ? item.available : (item.isAvailable !== undefined ? item.isAvailable : true),
              bestseller: item.bestseller !== undefined ? item.bestseller : (item.isBestseller !== undefined ? item.isBestseller : false),
              desc: item.desc || '',
              prepTime: item.prepTime || '15 mins',
              spice: item.spiceLevel || item.spice || 'Medium',
              img: item.img || '/hero_dish_2.png'
            })));
          }
        } catch (e) {}
      }

      // Fetch from API database and merge local availability status
      api.getMenuItems()
        .then((data) => {
          if (data && data.length > 0) {
            setMenuItems(data.map(item => {
              const nameKey = (item.name || '').toLowerCase().trim();
              const localOverride = localDishesMap[nameKey];
              const isAvail = localOverride ? (localOverride.available !== undefined ? localOverride.available : localOverride.isAvailable) : (item.isAvailable !== undefined ? item.isAvailable : true);
              const isBest = localOverride ? (localOverride.bestseller !== undefined ? localOverride.bestseller : localOverride.isBestseller) : (item.isBestseller !== undefined ? item.isBestseller : item.bestseller);

              return {
                id: item._id || item.id,
                name: item.name,
                category: item.category || 'Main Course',
                price: item.price,
                isVeg: item.isVeg !== undefined ? item.isVeg : true,
                available: isAvail !== false,
                bestseller: isBest,
                desc: item.desc || '',
                prepTime: item.prepTime || '15 mins',
                spice: item.spiceLevel || item.spice || 'Medium',
                img: item.img || '/hero_dish_2.png'
              };
            }));
          }
        })
        .catch((err) => {
          console.log('Using local fallback menu on MenuPage:', err.message);
        });
    };

    loadMenu();
    window.addEventListener('flavora_dishes_updated', loadMenu);
    return () => window.removeEventListener('flavora_dishes_updated', loadMenu);
  }, []);



  const matchCategory = (itemCategory, selectedCat) => {
    if (selectedCat === 'all') return true;
    const catLower = (itemCategory || '').toLowerCase();
    const selLower = selectedCat.toLowerCase();
    if (selLower === 'starters') return catLower.includes('starter');
    if (selLower === 'mains' || selLower === 'main course' || selLower === 'main-course') {
      return catLower.includes('main') || catLower.includes('biryani') || catLower.includes('curry');
    }
    if (selLower === 'curries') return catLower.includes('curry') || catLower.includes('curries');
    if (selLower === 'biryani') return catLower.includes('biryani');
    if (selLower === 'breads') return catLower.includes('bread') || catLower.includes('roti') || catLower.includes('naan');
    if (selLower === 'desserts') return catLower.includes('dessert') || catLower.includes('sweet');
    if (selLower === 'beverages') return catLower.includes('beverage') || catLower.includes('drink');
    if (selLower === 'southindian') return catLower.includes('south');
    return catLower === selLower;
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = matchCategory(item.category, selectedCategory);
    const matchesVeg = vegOnly ? item.isVeg : true;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesVeg && matchesSearch;
  });

  const totalCartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalCartPrice = calculateCartTotal(cart, menuItems);

  // Submit Order to Chef & Manager Backend
  const handleSendOrderToChefAndManager = async (e) => {
    e.preventDefault();
    if (totalCartCount === 0) return;

    setIsSubmittingOrder(true);
    const orderItems = Object.entries(cart).map(([id, qty]) => {
      const dish = findItemInCatalog(id, menuItems);
      return {
        dishId: id,
        name: dish ? dish.name : id,
        qty,
        price: dish ? dish.price : 0
      };
    });

    const orderPayload = {
      orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      tableNumber: tableNum,
      guestName: guestName.trim() || 'Guest Diner',
      items: orderItems,
      totalAmount: totalCartPrice,
      chefNotes: chefNotes.trim(),
      orderType: 'Dine-In QR Order',
      status: 'Pending'
    };

    try {
      await api.createOrder(orderPayload);
    } catch (err) {
      console.warn('Simulated backend order dispatch:', err.message);
    } finally {
      setIsSubmittingOrder(false);
      setIsCheckoutModalOpen(false);
      setCart({});
      setGuestName('');
      setChefNotes('');
      setOrderSuccessMsg({
        table: tableNum,
        orderId: orderPayload.orderId,
        total: totalCartPrice
      });
    }
  };

  const CATEGORY_MAP = [
    { key: 'Starters', icon: '🥗', match: (c) => c.includes('starter') },
    { key: 'Main Course', icon: '🍲', match: (c) => c.includes('main') || c.includes('curry') },
    { key: 'Biryani', icon: '🍚', match: (c) => c.includes('biryani') },
    { key: 'Breads', icon: '🫓', match: (c) => c.includes('bread') || c.includes('roti') || c.includes('naan') },
    { key: 'South Indian', icon: '🥞', match: (c) => c.includes('south') },
    { key: 'Desserts', icon: '🍨', match: (c) => c.includes('dessert') || c.includes('sweet') },
    { key: 'Beverages', icon: '🥤', match: (c) => c.includes('beverage') || c.includes('drink') }
  ];

  const getNormalizedCategory = (cat) => {
    const c = (cat || '').toLowerCase().trim();
    for (const group of CATEGORY_MAP) {
      if (group.match(c)) return group.key;
    }
    return cat || 'Main Course';
  };

  // Group filtered dishes by category
  const groupedDishes = CATEGORY_MAP.map(group => {
    const itemsInGroup = filteredItems.filter(item => getNormalizedCategory(item.category) === group.key);
    return {
      key: group.key,
      icon: group.icon,
      items: itemsInGroup
    };
  }).filter(group => group.items.length > 0);

  const knownKeys = new Set(CATEGORY_MAP.map(g => g.key));
  const unknownItems = filteredItems.filter(item => !knownKeys.has(getNormalizedCategory(item.category)));
  if (unknownItems.length > 0) {
    groupedDishes.push({
      key: 'Chef Specials',
      icon: '✨',
      items: unknownItems
    });
  }

  return (
    <div className="menu-page" style={{ position: 'relative', backgroundColor: '#FFFDF8', color: '#1A202C', paddingBottom: totalCartCount > 0 ? '6rem' : '0' }}>

      {/* Success Alert Banner */}
      {orderSuccessMsg && (
        <div style={{ backgroundColor: '#DCFCE7', border: '1.5px solid #22C55E', color: '#166534', padding: '1rem 1.5rem', margin: '1.5rem auto', maxWidth: '800px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
          <CheckCircle2 size={28} color="#22C55E" style={{ margin: '0 auto 0.5rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#166534' }}>
            🎉 Order Sent to Kitchen & Manager!
          </h3>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>
            Order <strong>#{orderSuccessMsg.orderId}</strong> for <strong>{orderSuccessMsg.table}</strong> has been transmitted. Total: <strong>₹{orderSuccessMsg.total}</strong>
          </p>
          <button className="btn btn-outline" onClick={() => setOrderSuccessMsg(null)} style={{ marginTop: '0.75rem', padding: '0.35rem 1rem', fontSize: '0.8rem', backgroundColor: '#FFFFFF' }}>
            Dismiss
          </button>
        </div>
      )}

      {/* ================= 1. EDITORIAL PAGE HERO SECTION ================= */}
      <section style={{ backgroundColor: '#FAF6EE', padding: '1.25rem 1.5rem 1.25rem 1.5rem', textAlign: 'center', borderBottom: '1px solid #EAE3D2' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontFamily: "var(--font-heading), 'Poppins', 'Inter', sans-serif", fontWeight: 800, color: '#1E4636', margin: '0 0 0.75rem 0', lineHeight: 1.15 }}>
            Dive Into Delicious Meal Dishes
          </h1>

          {/* Dynamic Single Source of Truth Horizontal Dish Strip */}
          <MenuDishStrip menuItems={menuItems} />

        </div>
      </section>

      {/* ================= 2. SEARCH & CATEGORY FILTER BAR ================= */}
      <section style={{ backgroundColor: '#FAF6EE', padding: '1.5rem 1.5rem 2rem 1.5rem', borderBottom: '1px dashed #E2D7C5' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', flexGrow: 1, maxWidth: '380px', minWidth: '260px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input 
              type="text" 
              placeholder="Search dishes, ingredients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                paddingLeft: '2.6rem',
                paddingRight: '1rem',
                borderRadius: '9999px',
                border: '1.5px solid #D8CEBC',
                backgroundColor: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          {/* Category Filter Pills & Veg Only Toggle Switch in a Single Line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexGrow: 1, minWidth: 0 }}>
            
            {/* Category Filter Pills Horizontal Track */}
            <div 
              style={{ 
                display: 'flex', 
                gap: '0.6rem', 
                overflowX: 'auto', 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                flexWrap: 'nowrap',
                flexGrow: 1,
                minWidth: 0,
                WebkitOverflowScrolling: 'touch' 
              }}
              className="no-scrollbar"
            >
              {[
                { id: 'all', label: 'All Dishes' },
                { id: 'starters', label: 'Starters' },
                { id: 'mains', label: 'Main Course' },
                { id: 'curries', label: 'Curries' },
                { id: 'biryani', label: 'Biryani' },
                { id: 'breads', label: 'Breads' },
                { id: 'southindian', label: 'South Indian' },
                { id: 'desserts', label: 'Desserts' },
                { id: 'beverages', label: 'Beverages' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '9999px',
                    border: '1.5px solid',
                    borderColor: selectedCategory === cat.id ? '#1E4636' : '#D8CEBC',
                    backgroundColor: selectedCategory === cat.id ? '#1E4636' : '#FFFFFF',
                    color: selectedCategory === cat.id ? '#FFFFFF' : '#1E4636',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Veg Only Toggle Switch (Single Line) */}
            <div 
              onClick={() => setVegOnly(!vegOnly)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', backgroundColor: 'transparent', padding: '0.3rem 0.5rem', cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}
            >
              <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #166534', borderRadius: '3px', position: 'relative', flexShrink: 0 }}>
                <span style={{ position: 'absolute', inset: '2.5px', backgroundColor: '#166534', borderRadius: '50%' }}></span>
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#1E4636', whiteSpace: 'nowrap' }}>Veg Only</span>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setVegOnly(!vegOnly); }}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '14px',
                  border: '1.5px solid #000000',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
                  backgroundColor: vegOnly ? '#166534' : '#CBD5E1',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
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
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ================= 3. ALL DISHES EDITORIAL LIST GROUPED BY CATEGORY ================= */}
      <section style={{ backgroundColor: '#FAF6EE', padding: '2rem 1.5rem 1.5rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Centered Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#EBF4F0', marginBottom: '0.5rem' }}>
              <Sparkles size={18} color="#1E4636" />
            </div>
            <h2 style={{ fontSize: '2.2rem', fontFamily: "var(--font-heading), 'Poppins', 'Inter', sans-serif", fontWeight: 800, color: '#1E4636', margin: 0 }}>
              Flavora Culinary Special Menu
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.92rem', marginTop: '0.3rem' }}>
              Hand-crafted gourmet recipes, clay-roasted kebabs, and authentic royal flavors.
            </p>
          </div>

          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px dashed #D8CEBC' }}>
              <Utensils size={40} style={{ color: '#94A3B8', marginBottom: '1rem' }} />
              <h3 style={{ color: '#1E4636', fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>No dishes found</h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Try adjusting your search query or category filter.</p>
            </div>
          ) : (
            <div>
              {groupedDishes.map(group => (
                <div key={group.key} style={{ marginBottom: '2rem' }}>
                  
                  {/* Category Alignment Section Title Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', borderBottom: '2px solid #EAE3D2', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>{group.icon}</span>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1E4636', margin: 0, fontFamily: "var(--font-heading), 'Poppins', sans-serif" }}>
                      {group.key}
                    </h3>
                  </div>

                  {/* 2-Column Clean Grid of Aligned Dish Rows under this Category */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem 3rem' }}>
                    {group.items.map(item => {
                      const qty = cart[item.id] || 0;
                      const isAvailable = item.available !== false;

                      return (
                        <div 
                          key={item.id} 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.25rem',
                            paddingBottom: '1.25rem',
                            borderBottom: '1px dashed #E2D7C5',
                            position: 'relative'
                          }}
                        >
                          {/* Left: Thumbnail Image */}
                          <div style={{ width: '72px', height: '72px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                            <img 
                              src={item.img} 
                              alt={item.name} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isAvailable ? 1 : 0.6 }}
                            />
                            {!isAvailable && (
                              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#FFFFFF', backgroundColor: '#DC2626', padding: '2px 5px', borderRadius: '4px' }}>OFFLINE</span>
                              </div>
                            )}
                          </div>

                          {/* Middle: Dish Info */}
                          <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                              {/* Veg / Non-Veg Indicator */}
                              <span style={{ display: 'inline-block', width: '14px', height: '14px', border: `2px solid ${item.isVeg ? '#166534' : '#DC2626'}`, borderRadius: '3px', position: 'relative', flexShrink: 0 }}>
                                <span style={{ position: 'absolute', inset: '2px', backgroundColor: item.isVeg ? '#166534' : '#DC2626', borderRadius: '50%' }}></span>
                              </span>
                              
                              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F2A1D', margin: 0, fontFamily: "var(--font-heading), 'Poppins', 'Inter', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.name}
                              </h3>

                              {item.bestseller && (
                                <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '9999px', border: '1px solid #FCD34D' }}>
                                  ⭐ Bestseller
                                </span>
                              )}
                            </div>

                            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 0.35rem 0', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {item.desc || 'Prepared fresh with premium ingredients & hand-ground spices.'}
                            </p>

                            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                              ⏱️ {item.prepTime || '15 mins'} • {item.spice || 'Medium'}
                            </div>
                          </div>

                          {/* Right: Price & Interactive Action */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1E4636' }}>
                              ₹{item.price}
                            </span>

                            {!isAvailable ? (
                              <button
                                type="button"
                                disabled
                                style={{
                                  backgroundColor: '#CBD5E1',
                                  color: '#64748B',
                                  cursor: 'not-allowed',
                                  opacity: 0.85,
                                  border: '1px solid #94A3B8',
                                  boxShadow: 'none',
                                  fontWeight: 700,
                                  fontSize: '0.78rem',
                                  padding: '0.35rem 0.85rem',
                                  borderRadius: '8px'
                                }}
                              >
                                Out of Stock
                              </button>
                            ) : qty > 0 ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#1E4636', color: '#FFFFFF', padding: '0.2rem 0.5rem', borderRadius: '8px' }}>
                                <button 
                                  type="button"
                                  onClick={() => handleDecreaseQty(item.id)}
                                  style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                                >
                                  <Minus size={14} />
                                </button>
                                <span style={{ fontWeight: 800, fontSize: '0.88rem', minWidth: '18px', textAlign: 'center' }}>{qty}</span>
                                <button 
                                  type="button"
                                  onClick={() => handleAddToCart(item.id)}
                                  style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddToCart(item.id)}
                                style={{
                                  backgroundColor: '#1E4636',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '0.45rem 1.25rem',
                                  fontWeight: 800,
                                  fontSize: '0.82rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  letterSpacing: '0.04em',
                                  boxShadow: '0 2px 8px rgba(30, 70, 54, 0.25)',
                                  transition: 'transform 0.15s ease'
                                }}
                              >
                                <span>ADD</span>
                              </button>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* ================= 4. OUR CULTURE & CULINARY ARTISTRY EXPOSURE STUDIO ================= */}
      <section style={{ backgroundColor: '#FAF6EE', padding: '1.5rem 1.5rem 2rem 1.5rem', borderTop: '1px dashed #E2D7C5' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          
          <h2 style={{ fontSize: '2rem', fontFamily: "var(--font-heading), 'Poppins', 'Inter', sans-serif", fontWeight: 800, color: '#1E4636', marginBottom: '1rem' }}>
            Our Culture & Kitchen Artistry
          </h2>

          {/* SmoothUI Exposure Slider Studio */}
          <ExposureSlider />

        </div>
      </section>

      {/* ================= 5. CHEF TESTIMONIAL BANNER ================= */}
      <section style={{ backgroundColor: '#FAF6EE', padding: '0 1.5rem 2.5rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ backgroundColor: '#E07A3C', borderRadius: '24px', padding: '2.5rem 2rem', color: '#FFFFFF', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', alignItems: 'center', boxShadow: '0 15px 35px rgba(224, 122, 60, 0.25)' }}>
            <div>
              <p style={{ fontSize: '1.25rem', fontFamily: "var(--font-heading), 'Poppins', 'Inter', sans-serif", fontStyle: 'italic', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                "I love Flavora because it allows us to show our diners how authentic clay-tandoor dishes and hand-milled spices transform dining into a royal celebration. Every order is a source of pride."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <img src="/chef_plating.png" alt="Executive Chef" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #FFFFFF', objectFit: 'cover' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Executive Chef Srikanth</div>
                  <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>Master Culinary Director • Flavora Group</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <img src="/hero_dish_1.png" alt="Dish 1" style={{ width: '100%', height: '120px', borderRadius: '16px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }} />
              <img src="/hero_dish_2.png" alt="Dish 2" style={{ width: '100%', height: '120px', borderRadius: '16px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }} />
              <img src="/carousel_1.png" alt="Dish 3" style={{ width: '100%', height: '120px', borderRadius: '16px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }} />
              <img src="/tandoor_oven.png" alt="Dish 4" style={{ width: '100%', height: '120px', borderRadius: '16px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Small Floating View Cart Button at Bottom-Right (Appears when dishes added) */}
      {totalCartCount > 0 && (
        <button
          type="button"
          onClick={() => setIsCheckoutModalOpen(true)}
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
          <Send size={16} />
        </button>
      )}

      {/* ================= 7. CHECKOUT MODAL FOR TABLE ORDERING ================= */}
      {isCheckoutModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsCheckoutModalOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflow: 'hidden' }}>
          <div 
            className="admin-modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: '500px', 
              width: '100%', 
              maxHeight: '90vh', 
              display: 'flex', 
              flexDirection: 'column', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
              margin: 'auto'
            }}
          >
            <div className="admin-modal-header" style={{ backgroundColor: '#0F2A1D', color: '#FFFFFF', flexShrink: 0, padding: '1.1rem 1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ChefHat size={22} color="#FF8A00" />
                <h3 className="admin-modal-title" style={{ color: '#FFFFFF', fontSize: '1.1rem' }}>
                  {tableNum ? `Send Order — Table ${tableNum}` : 'Review Cart & Send Order'}
                </h3>
              </div>
              <button className="admin-modal-close" onClick={() => setIsCheckoutModalOpen(false)} style={{ color: '#FFFFFF' }}>×</button>
            </div>

            <form onSubmit={handleSendOrderToChefAndManager} style={{ padding: '1.4rem', overflowY: 'auto', flexGrow: 1, WebkitOverflowScrolling: 'touch' }}>
              
              {/* Order Items Summary */}
              <div style={{ backgroundColor: '#FAF6EE', padding: '0.9rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid #EAE3D2' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{tableNum ? `SELECTED DISHES (TABLE ${tableNum}):` : 'SELECTED DISHES IN YOUR CART:'}</span>
                  <span style={{ color: '#166534', backgroundColor: '#EBF4F0', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.72rem' }}>
                    {totalCartCount} {totalCartCount === 1 ? 'Dish' : 'Dishes'}
                  </span>
                </div>

                {Object.entries(cart).map(([id, qty]) => {
                  const dish = findItemInCatalog(id, menuItems);
                  return dish ? (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.86rem', color: '#334155', marginBottom: '0.4rem', borderBottom: '1px dashed #E2D7C5', paddingBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexGrow: 1 }}>
                        <span style={{ fontWeight: 800, color: '#0F2A1D' }}>{dish.name}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        {/* Quantity Adjuster inside Modal */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#1E4636', color: '#FFFFFF', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                          <button 
                            type="button"
                            onClick={() => handleDecreaseQty(dish.id || id)}
                            style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '1px' }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ fontWeight: 800, fontSize: '0.8rem', minWidth: '16px', textAlign: 'center' }}>{qty}</span>
                          <button 
                            type="button"
                            onClick={() => handleAddToCart(dish.id || id)}
                            style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '1px' }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span style={{ fontWeight: 800, color: '#1E4636', minWidth: '60px', textAlign: 'right' }}>₹{dish.price * qty}</span>
                      </div>
                    </div>
                  ) : null;
                })}

                <div style={{ paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.05rem', color: '#FF8A00' }}>
                  <span>Total Amount:</span>
                  <span>₹{totalCartPrice}</span>
                </div>
              </div>

              {/* Table Number Input Field (Pre-filled if scanned, editable) */}
              <div className="admin-form-group mb-3">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Table Number {tableNum ? `(Scanned: Table ${tableNum})` : '(Optional / Enter Table)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. T-04 or Table 4"
                  value={tableNum}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setTableNum(val);
                    localStorage.setItem('flavora_scanned_table', val);
                  }}
                  className="form-control"
                  style={{ fontWeight: 700, color: '#1E4636' }}
                />
              </div>

              {/* Guest Name Input */}
              <div className="admin-form-group mb-3">
                <label className="form-label" style={{ fontWeight: 700 }}>Your Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Deepak J."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="form-control"
                />
              </div>

              {/* Instructions for Chef */}
              <div className="admin-form-group mb-4">
                <label className="form-label" style={{ fontWeight: 700 }}>Special Cooking Instructions for Chef</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Less spicy, extra butter, no green chilis..."
                  value={chefNotes}
                  onChange={(e) => setChefNotes(e.target.value)}
                  className="form-control"
                  style={{ fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsCheckoutModalOpen(false)}>Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSubmittingOrder}
                  className="btn btn-primary" 
                  style={{ backgroundColor: '#FF8A00', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}
                >
                  <Send size={16} />
                  <span>{isSubmittingOrder ? 'Transmitting...' : 'Confirm & Transmit Order'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
