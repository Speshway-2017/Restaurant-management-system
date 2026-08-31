import React, { useState, useEffect } from 'react';
import { Utensils, Search, CheckCircle2, XCircle, Sparkles, Filter } from 'lucide-react';
import { api } from '../../services/api';

export default function ManagerMenuPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  const [menuItems, setMenuItems] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_dishes');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 1, name: 'Zafrani Mutton Dum Biryani', category: 'Royal Biryani', price: 680, available: true, isVeg: false },
      { id: 2, name: 'Royal Hyd Chicken Dum Biryani', category: 'Royal Biryani', price: 480, available: true, isVeg: false },
      { id: 3, name: 'Tandoori Afghani Murgh (Half)', category: 'Non-Veg Starters', price: 380, available: true, isVeg: false },
      { id: 4, name: 'Paneer Tikka Angara', category: 'Veg Starters', price: 320, available: true, isVeg: true },
      { id: 5, name: 'Butter Naan Basket', category: 'Breads & Naans', price: 90, available: true, isVeg: true }
    ];
  });

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await api.getMenuItems();
        if (Array.isArray(data) && data.length > 0) {
          setMenuItems(data);
          try {
            localStorage.setItem('flavora_dishes', JSON.stringify(data));
          } catch (e) {}
        }
      } catch (e) {}
    };
    fetchMenu();
  }, []);

  const [outOfStockItems, setOutOfStockItems] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_out_of_stock_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const handleStockUpdate = () => {
      try {
        const saved = localStorage.getItem('flavora_out_of_stock_items');
        if (saved) setOutOfStockItems(JSON.parse(saved));
      } catch (e) { }
    };
    window.addEventListener('flavora_menu_updated', handleStockUpdate);
    window.addEventListener('storage', handleStockUpdate);
    return () => {
      window.removeEventListener('flavora_menu_updated', handleStockUpdate);
      window.removeEventListener('storage', handleStockUpdate);
    };
  }, []);

  const handleToggleStockStatus = (id, name) => {
    const isCurrentlyOut = outOfStockItems.includes(id) || outOfStockItems.includes(name);
    let nextList = [];
    if (isCurrentlyOut) {
      nextList = outOfStockItems.filter(i => i !== id && i !== name);
    } else {
      nextList = [...outOfStockItems, id, name];
    }
    setOutOfStockItems(nextList);
    try {
      localStorage.setItem('flavora_out_of_stock_items', JSON.stringify(nextList));
      window.dispatchEvent(new Event('flavora_menu_updated'));
    } catch (e) { }
  };

  const categoriesList = ['All', ...Array.from(new Set(menuItems.map(i => i.category || 'General')))];

  const filteredItems = menuItems.filter(item => {
    const matchesCat = selectedCat === 'All' || item.category === selectedCat;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (item.name || '').toLowerCase().includes(q) || (item.category || '').toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  // Group items category-wise
  const groupedByCategory = filteredItems.reduce((acc, dish) => {
    const cat = dish.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(dish);
    return acc;
  }, {});

  const categoryKeys = Object.keys(groupedByCategory);

  return (
    <div className="admin-subpage-container" style={{ paddingBottom: '3rem' }}>
      
      <div className="admin-dashboard-header">
        <div>
          <div className="page-breadcrumb-bar">
            <span>Dashboard</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Menu Item Availability</span>
          </div>
          <h1 className="admin-page-title">Gourmet Menu Stock Control</h1>
          <p className="admin-page-subtitle">Manage live kitchen dish availability and mark items in-stock or out-of-stock.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        border: '1px solid #F0EAE1',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {categoriesList.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCat(cat)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: selectedCat === cat ? '#1E4636' : '#F1F5F9',
                color: selectedCat === cat ? '#FFFFFF' : '#475569',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search dish or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '2.4rem',
              paddingRight: '1rem',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Category-Wise Grouped View */}
      {categoryKeys.length === 0 ? (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #F0EAE1', padding: '3rem', textAlign: 'center' }}>
          <Utensils size={40} color="#CBD5E1" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1E293B', fontWeight: 800 }}>No dishes found</h3>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.88rem' }}>Try adjusting your category filter or search query.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {categoryKeys.map(catName => {
            const dishes = groupedByCategory[catName];
            const inStockCount = dishes.filter(d => {
              const dId = d._id || d.id;
              return d.available !== false && d.isAvailable !== false && !outOfStockItems.includes(dId) && !outOfStockItems.includes(d.name);
            }).length;
            const outOfStockCount = dishes.length - inStockCount;

            return (
              <div key={catName} style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #F0EAE1', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                {/* Category Header */}
                <div style={{
                  backgroundColor: '#FAF6EE',
                  padding: '0.85rem 1.25rem',
                  borderBottom: '1px solid #F0EAE1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#1E4636', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Utensils size={14} color="#FFFFFF" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: '#1C130E' }}>
                      {catName}
                    </h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', backgroundColor: '#E2E8F0', padding: '0.15rem 0.55rem', borderRadius: '9999px' }}>
                      {dishes.length} {dishes.length === 1 ? 'Dish' : 'Dishes'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', backgroundColor: '#DCFCE7', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                      🟢 {inStockCount} In Stock
                    </span>
                    {outOfStockCount > 0 && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#DC2626', backgroundColor: '#FEE2E2', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                        🔴 {outOfStockCount} Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Category Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F0EAE1', fontSize: '0.75rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', backgroundColor: '#FFFFFF' }}>
                      <th style={{ padding: '0.75rem 1.25rem' }}>Dish Name</th>
                      <th style={{ padding: '0.75rem 1.25rem' }}>Type</th>
                      <th style={{ padding: '0.75rem 1.25rem' }}>Price</th>
                      <th style={{ padding: '0.75rem 1.25rem' }}>Kitchen Status</th>
                      <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>Toggle Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dishes.map(dish => {
                      const dishId = dish._id || dish.id;
                      const isOutInStore = outOfStockItems.includes(dishId) || outOfStockItems.includes(dish.name);
                      const isAvailable = dish.available !== false && dish.isAvailable !== false && !isOutInStore;

                      return (
                        <tr key={dishId} style={{ borderBottom: '1px solid #F1F5F9', fontSize: '0.88rem' }}>
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#0F2A1D' }}>{dish.name}</td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: dish.isVeg ? '#166534' : '#DC2626', backgroundColor: dish.isVeg ? '#DCFCE7' : '#FEE2E2', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                              {dish.isVeg ? '🌿 Veg' : '🍗 Non-Veg'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 900, color: '#0F2A1D' }}>₹{dish.price}</td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              backgroundColor: isAvailable ? '#DCFCE7' : '#FEE2E2',
                              color: isAvailable ? '#166534' : '#DC2626',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px'
                            }}>
                              {isAvailable ? '🟢 Available' : '🔴 Out of Stock'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleStockStatus(dishId, dish.name)}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: isAvailable ? '#FEF2F2' : '#F0FDF4',
                                color: isAvailable ? '#DC2626' : '#166534',
                                fontWeight: 800,
                                fontSize: '0.76rem',
                                cursor: 'pointer'
                              }}
                            >
                              {isAvailable ? 'Mark Out of Stock' : 'Make Available'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
