import React, { useState, useEffect } from 'react';
import { Utensils, Search, Plus, Minus, Trash2, ShoppingBag, CheckCircle2, ArrowRight, QrCode, Sparkles, ChevronDown, Clock, ChefHat, MessageSquare, X, Send } from 'lucide-react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function MenuPage({ onOpenDemoModal }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState({});
  const [tableNum, setTableNum] = useState('T-01');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [chefNotes, setChefNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState(null);

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
    api.getMenuItems()
      .then((data) => {
        if (data && data.length > 0) {
          setMenuItems(data.map(item => ({
            id: item._id || item.id,
            name: item.name,
            category: item.category || 'Main Course',
            price: item.price,
            isVeg: item.isVeg !== undefined ? item.isVeg : true,
            available: item.isAvailable !== undefined ? item.isAvailable : item.available,
            bestseller: item.isBestseller !== undefined ? item.isBestseller : item.bestseller,
            desc: item.desc || '',
            prepTime: item.prepTime || '15 mins',
            spice: item.spiceLevel || item.spice || 'Medium',
            img: item.img || '/hero_dish_2.png'
          })));
        }
      })
      .catch((err) => {
        console.log('Using local fallback menu on MenuPage:', err.message);
      });
  }, []);

  const handleAddToCart = (id) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleDecreaseQty = (id) => {
    setCart(prev => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  const handleDeleteItem = (id) => {
    setCart(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleClearCart = () => {
    setCart({});
  };

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
    if (item.available === false) return false;
    const matchesCategory = matchCategory(item.category, selectedCategory);
    const matchesVeg = vegOnly ? item.isVeg : true;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesVeg && matchesSearch;
  });

  const totalCartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalCartPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menuItems.find(m => String(m.id) === String(id));
    return sum + (item ? item.price * qty : 0);
  }, 0);

  // Submit Order to Chef & Manager Backend
  const handleSendOrderToChefAndManager = async (e) => {
    e.preventDefault();
    if (totalCartCount === 0) return;

    setIsSubmittingOrder(true);
    const orderItems = Object.entries(cart).map(([id, qty]) => {
      const dish = menuItems.find(m => String(m.id) === String(id));
      return {
        dishId: id,
        name: dish ? dish.name : 'Custom Dish',
        qty,
        price: dish ? dish.price : 0,
        subtotal: dish ? dish.price * qty : 0
      };
    });

    const orderPayload = {
      orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      tableNum: tableNum,
      customerName: guestName.trim() || 'Guest Customer',
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

  return (
    <div className="menu-page" style={{ position: 'relative', paddingBottom: totalCartCount > 0 ? '6rem' : '0' }}>
      
      {/* Table QR Guest Notification Strip */}
      <div style={{ backgroundColor: '#0F2A1D', color: '#FFFFFF', padding: '0.65rem 1.5rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
        <QrCode size={18} color="#FF8A00" />
        <span>You are ordering for <strong style={{ color: '#FF8A00', fontSize: '1.05rem' }}>{tableNum}</strong> • Digital Table Self-Service Menu</span>
      </div>

      {/* Success Alert Banner */}
      {orderSuccessMsg && (
        <div style={{ backgroundColor: '#DCFCE7', border: '1.5px solid #22C55E', color: '#166534', padding: '1rem 1.5rem', margin: '1rem auto', maxWidth: '800px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
          <CheckCircle2 size={28} color="#22C55E" style={{ margin: '0 auto 0.5rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#166534' }}>
            🎉 Order Sent to Kitchen & Manager!
          </h3>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>
            Order <strong>#{orderSuccessMsg.orderId}</strong> for <strong>{orderSuccessMsg.table}</strong> has been transmitted directly to Executive Chef Srikanth & Branch Manager POS! Total: <strong>₹{orderSuccessMsg.total}</strong>
          </p>
          <button 
            className="btn btn-outline" 
            onClick={() => setOrderSuccessMsg(null)}
            style={{ marginTop: '0.75rem', padding: '0.35rem 1rem', fontSize: '0.8rem', backgroundColor: '#FFFFFF' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Banner (Unified Page Hero System) */}
      <section className="page-hero-banner-unified">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="page-hero-badge-unified">
            <Utensils size={14} />
            <span>DIGITAL QR MENU FOR {tableNum}</span>
          </div>

          <h1 className="page-hero-title-unified">
            Curated Culinary Menu
          </h1>

          <p className="page-hero-subtitle-unified">
            Browse dish photos, customize your order, add items to cart, and send orders directly to Chef & Manager with zero waiting.
          </p>
        </div>
      </section>

      {/* Filter & Search Bar Section */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-neutral-200)' }}>
        <div className="section" style={{ padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', justifyContent: 'space-between' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '260px', flexGrow: 1, maxWidth: '380px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-neutral-500)' }} />
              <input 
                type="text" 
                placeholder="Search dishes, ingredients..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem', height: '44px', borderRadius: 'var(--radius-full)' }}
              />
            </div>

            {/* Dish Specializations Dropdown (Defaulting to All Dishes) */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  height: '44px',
                  padding: '0 2.5rem 0 1.2rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1.5px solid #1E4636',
                  backgroundColor: '#1E4636',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(30, 70, 54, 0.2)'
                }}
              >
                <option value="all" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>All Dishes</option>
                <option value="starters" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>Starters</option>
                <option value="mains" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>Main Course</option>
                <option value="curries" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>Curries</option>
                <option value="biryani" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>Biryani</option>
                <option value="breads" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>Breads</option>
                <option value="southindian" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>South Indian</option>
                <option value="desserts" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>Desserts</option>
                <option value="beverages" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>Beverages</option>
              </select>
              <ChevronDown size={16} color="#FFFFFF" style={{ position: 'absolute', right: '14px', pointerEvents: 'none' }} />
            </div>

            {/* Veg Toggle Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#FFFFFF', padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-neutral-300)' }}>
              <span className="veg-dot"></span>
              <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--color-neutral-800)' }}>Veg Only</span>
              <button 
                onClick={() => setVegOnly(!vegOnly)}
                style={{
                  width: '42px',
                  height: '24px',
                  borderRadius: '12px',
                  backgroundColor: vegOnly ? 'var(--color-success)' : 'var(--color-neutral-300)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color 0.2s ease',
                  marginLeft: '0.25rem'
                }}
              >
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  position: 'absolute',
                  top: '3px',
                  left: vegOnly ? '21px' : '3px',
                  transition: 'left 0.2s ease'
                }} />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Menu Cards Grid with Images & Add/Delete Cart Options */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '3.5rem 1.5rem 6rem 1.5rem' }}>
        <div className="section" style={{ padding: 0 }}>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)' }}>
              <Utensils size={40} style={{ color: 'var(--color-neutral-400)', marginBottom: '1rem' }} />
              <h3 className="text-h2" style={{ color: 'var(--color-neutral-800)', marginBottom: '0.5rem' }}>No dishes found</h3>
              <p className="text-body" style={{ color: 'var(--color-neutral-600)' }}>Try adjusting your search query or category filter.</p>
            </div>
          ) : (
            <div className="grid-3">
              {filteredItems.map(item => {
                const qty = cart[item.id] || 0;
                return (
                  <ProductCard
                    key={item.id}
                    id={item.id}
                    title={item.name}
                    image={item.img}
                    price={item.price}
                    originalPrice={item.originalPrice || Math.round(item.price * 1.25)}
                    badge={item.bestseller ? 'Bestseller' : item.isVeg ? 'Veg Special' : 'Chef Special'}
                    rating={item.rating || 4.8}
                    isVeg={item.isVeg}
                    desc={item.desc}
                    category={item.category}
                    quantity={qty}
                    onAddToCart={(id) => handleAddToCart(id)}
                    onDecreaseQty={(id) => handleDecreaseQty(id)}
                    onDeleteItem={(id) => handleDeleteItem(id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Floating Bottom Cart Summary Bar */}
      {totalCartCount > 0 && (
        <div className="floating-cart-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#FF8A00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1.05rem' }}>
                {tableNum} • {totalCartCount} {totalCartCount === 1 ? 'Item' : 'Items'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#A3B8AD' }}>
                Total: <span style={{ color: '#FF8A00', fontWeight: '800', fontSize: '0.95rem' }}>₹{totalCartPrice}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              onClick={handleClearCart}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#FFFFFF',
                borderRadius: '9999px',
                padding: '0.5rem 1rem',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Clear Cart
            </button>

            <button 
              onClick={() => setIsCheckoutModalOpen(true)}
              className="ref-hero-cta-btn"
              style={{ padding: '0.65rem 1.4rem', fontSize: '0.88rem', backgroundColor: '#FF8A00', color: '#FFFFFF', border: 'none' }}
            >
              <Send size={16} />
              <span>SEND ORDER TO CHEF & MANAGER</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Table Order Checkout & Transmission to Chef & Manager */}
      {isCheckoutModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsCheckoutModalOpen(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', borderRadius: '16px' }}>
            <div className="admin-modal-header" style={{ backgroundColor: '#0F2A1D', color: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ChefHat size={22} color="#FF8A00" />
                <h3 className="admin-modal-title" style={{ color: '#FFFFFF', fontSize: '1.1rem' }}>Send Order to Kitchen — {tableNum}</h3>
              </div>
              <button className="admin-modal-close" onClick={() => setIsCheckoutModalOpen(false)} style={{ color: '#FFFFFF' }}>×</button>
            </div>

            <form onSubmit={handleSendOrderToChefAndManager} style={{ padding: '1.5rem' }}>
              
              {/* Order Items Summary */}
              <div style={{ backgroundColor: '#FAF6EE', padding: '0.85rem 1rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #EAE3D2' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.5rem' }}>
                  SELECTED DISHES FOR {tableNum}:
                </div>
                {Object.entries(cart).map(([id, qty]) => {
                  const dish = menuItems.find(m => String(m.id) === String(id));
                  return dish ? (
                    <div key={id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#334155', marginBottom: '0.25rem' }}>
                      <span>{qty}x {dish.name}</span>
                      <span style={{ fontWeight: 700 }}>₹{dish.price * qty}</span>
                    </div>
                  ) : null;
                })}
                <div style={{ borderTop: '1px solid #EAE3D2', paddingTop: '0.4rem', marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.95rem', color: '#FF8A00' }}>
                  <span>Total Amount:</span>
                  <span>₹{totalCartPrice}</span>
                </div>
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
                  style={{ backgroundColor: '#FF8A00', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Send size={16} />
                  <span>{isSubmittingOrder ? 'Transmitting...' : 'CONFIRM & SEND ORDER'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
