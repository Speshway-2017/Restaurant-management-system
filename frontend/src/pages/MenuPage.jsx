import React, { useState } from 'react';
import { Utensils, Search, Plus, Minus, Trash2, ShoppingBag, CheckCircle2, ArrowRight, QrCode, Sparkles } from 'lucide-react';

export default function MenuPage({ onOpenDemoModal }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState({});

  const menuItems = [
    { id: 1, name: 'Paneer Tikka Angara', category: 'starters', price: 340, isVeg: true, desc: 'Cottage cheese marinated in Kashmiri chili and tandoori spices.', img: '/hero_dish_1.png' },
    { id: 2, name: 'Murgh Malai Kabab', category: 'starters', price: 420, isVeg: false, desc: 'Tender chicken breast infused with cream, cheese, and cardamom.', img: '/carousel_3.png' },
    { id: 3, name: 'Tandoori Murgh Full', category: 'starters', price: 560, isVeg: false, desc: 'Whole chicken marinated in mustard oil & spices roasted in clay tandoori oven.', img: '/tandoor_oven.png' },
    { id: 4, name: 'Dal Makhani Gold', category: 'mains', price: 380, isVeg: true, desc: 'Slow-cooked black lentils simmered overnight with white butter and cream.', img: '/carousel_2.png' },
    { id: 5, name: 'Paneer Butter Masala', category: 'mains', price: 390, isVeg: true, desc: 'Soft cottage cheese cubes in rich tomato cashew gravy.', img: '/hero_dish_1.png' },
    { id: 6, name: 'Butter Chicken Special', category: 'mains', price: 480, isVeg: false, desc: 'Charcoal-grilled chicken simmered in rich buttery tomato gravy.', img: '/hero_dish_2.png' },
    { id: 7, name: 'Hyderabadi Dum Biryani (Chicken)', category: 'biryani', price: 490, isVeg: false, desc: 'Aromatic basmati rice layered with spiced marinated chicken cooked on dum.', img: '/hero_dish_2.png' },
    { id: 8, name: 'Hyderabadi Veg Dum Biryani', category: 'biryani', price: 420, isVeg: true, desc: 'Garden fresh vegetables layered with saffron rice and fragrant biryani spices.', img: '/carousel_2.png' },
    { id: 9, name: 'Garlic Butter Naan', category: 'breads', price: 90, isVeg: true, desc: 'Fresh clay tandoori bread brushed with melted butter & chopped garlic.', img: '/carousel_1.png' },
    { id: 10, name: 'Butter Tandoori Roti', category: 'breads', price: 50, isVeg: true, desc: 'Whole wheat flatbread baked fresh in clay tandoori oven.', img: '/tandoor_oven.png' },
    { id: 11, name: 'Saffron Shahi Tukda', category: 'desserts', price: 260, isVeg: true, desc: 'Crispy fried bread soaked in saffron rabri topped with pistachios.', img: '/chef_plating.png' },
    { id: 12, name: 'Gulab Jamun with Ice Cream', category: 'desserts', price: 220, isVeg: true, desc: 'Hot khoya dumplings served with cold vanilla bean ice cream.', img: '/carousel_3.png' },
    { id: 13, name: 'Mango Lassi Delight', category: 'beverages', price: 180, isVeg: true, desc: 'Thick churned sweet yogurt blended with Alphonsa mango pulp.', img: '/hero_dish_1.png' },
    { id: 14, name: 'Masala Butter Milk', category: 'beverages', price: 120, isVeg: true, desc: 'Refreshing churned buttermilk infused with roasted cumin, green chili & mint.', img: '/carousel_2.png' },
  ];

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

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesVeg = vegOnly ? item.isVeg : true;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesVeg && matchesSearch;
  });

  const totalCartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalCartPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menuItems.find(m => m.id === Number(id));
    return sum + (item ? item.price * qty : 0);
  }, 0);

  return (
    <div className="menu-page" style={{ position: 'relative', paddingBottom: totalCartCount > 0 ? '6rem' : '0' }}>
      {/* Hero Banner (Unified Page Hero System) */}
      <section className="page-hero-banner-unified">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="page-hero-badge-unified">
            <Utensils size={14} />
            <span>DIGITAL QR MENU & SPECIALTIES</span>
          </div>

          <h1 className="page-hero-title-unified">
            Curated Culinary Menu
          </h1>

          <p className="page-hero-subtitle-unified">
            Browse dish photos, customize your order, add items to cart, and enjoy instant table QR dining with zero waiting.
          </p>
        </div>
      </section>

      {/* Filter & Search Bar Section */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-neutral-200)' }}>
        <div className="section" style={{ padding: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '280px', flexGrow: 1, maxWidth: '420px' }}>
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

            {/* Veg Toggle Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#FAF3E6', padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-neutral-300)' }}>
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

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', marginTop: '1.5rem', paddingBottom: '0.5rem' }}>
            {[
              { id: 'all', label: 'All Items' },
              { id: 'starters', label: 'Tandoori Starters' },
              { id: 'mains', label: 'Main Course' },
              { id: 'biryani', label: 'Hyderabadi Biryani' },
              { id: 'breads', label: 'Tandoori Breads' },
              { id: 'desserts', label: 'Royal Desserts' },
              { id: 'beverages', label: 'Beverages' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1.5px solid',
                  borderColor: selectedCategory === cat.id ? '#0B1B14' : 'var(--color-neutral-200)',
                  backgroundColor: selectedCategory === cat.id ? '#0B1B14' : '#FFFFFF',
                  color: selectedCategory === cat.id ? '#FFFFFF' : 'var(--color-neutral-800)',
                  fontWeight: '600',
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

      {/* Menu Cards Grid with Images & Add/Delete Cart Options */}
      <section style={{ backgroundColor: '#FAF3E6', padding: '3.5rem 1.5rem 6rem 1.5rem' }}>
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
                  <div key={item.id} className="menu-card-enhanced">
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
                            <span className="menu-card-price-pill">₹{item.price}</span>
                          </div>
                        </div>
                      </div>

                      <p className="menu-card-desc">{item.desc}</p>
                    </div>

                    {/* Action Bar: Add to Cart vs Qty Controls + Delete Option */}
                    <div className="menu-card-action-bar">
                      {qty === 0 ? (
                        <button 
                          onClick={() => handleAddToCart(item.id)} 
                          className="btn-add-cart"
                        >
                          <ShoppingBag size={15} />
                          <span>Add to Cart</span>
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%' }}>
                          {/* Quantity Adjuster */}
                          <div className="cart-qty-controls">
                            <button 
                              onClick={() => handleDecreaseQty(item.id)} 
                              className="btn-qty-step"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} />
                            </button>
                            
                            <span className="qty-counter-num">{qty}</span>

                            <button 
                              onClick={() => handleAddToCart(item.id)} 
                              className="btn-qty-step"
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          {/* 1-Click Delete Button */}
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="btn-delete-item"
                            title="Delete from cart"
                            aria-label="Delete item from cart"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
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
                {totalCartCount} {totalCartCount === 1 ? 'Item' : 'Items'} Added
              </div>
              <div style={{ fontSize: '0.82rem', color: '#A3B8AD' }}>
                Total Amount: <span style={{ color: '#FF8A00', fontWeight: '800', fontSize: '0.95rem' }}>₹{totalCartPrice}</span>
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
              onClick={onOpenDemoModal}
              className="ref-hero-cta-btn"
              style={{ padding: '0.65rem 1.4rem', fontSize: '0.88rem' }}
            >
              <span>View Cart & Pay</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

