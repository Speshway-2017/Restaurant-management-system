import React, { useState } from 'react';
import {
  Utensils,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  PackageX,
  PackageCheck,
  RefreshCw
} from 'lucide-react';

export default function ChefInventoryPage({
  menuItems = [],
  outOfStockItems = [],
  handleToggleOutOfStock
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Extract unique categories
  const categories = ['ALL', ...Array.from(new Set(menuItems.map(item => item.category || 'General')))];

  // Out of stock items count
  const outCount = menuItems.filter(item => {
    const itemId = item._id || item.id;
    return outOfStockItems.includes(itemId) || outOfStockItems.includes(item.name);
  }).length;

  const inStockCount = menuItems.length - outCount;

  // Filter menu items by search and category
  const filteredMenuItems = menuItems.filter(item => {
    const itemId = item._id || item.id;
    const isOut = outOfStockItems.includes(itemId) || outOfStockItems.includes(item.name);

    // Category filter
    if (selectedCategory === 'OUT_OF_STOCK') {
      if (!isOut) return false;
    } else if (selectedCategory !== 'ALL') {
      if ((item.category || 'General') !== selectedCategory) return false;
    }

    // Search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (item.name || '').toLowerCase().includes(q) || (item.category || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', paddingBottom: '3rem' }}>
      
      {/* ================= 1. HEADER & BREADCRUMBS ================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div>
          <div className="page-breadcrumb-bar" style={{ marginBottom: '0.35rem' }}>
            <span>Chef</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Stock Manager</span>
          </div>
          <h1 className="admin-page-title" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
            Kitchen Item Availability Manager
          </h1>
          <p className="admin-page-subtitle" style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: '#64748B', fontWeight: 600 }}>
            Toggle dishes as "Out of Stock" to instantly update live QR customer ordering menus.
          </p>
        </div>

        {/* Real-time Search Box */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search dish by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.2rem',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#0F2A1D',
              fontSize: '0.82rem',
              fontWeight: 700,
              outline: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}
          />
        </div>
      </div>

      {/* ================= 2. KPI SUMMARY CARDS ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.15rem 1.35rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL MENU DISHES</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)', marginTop: '0.15rem' }}>
              {menuItems.length} <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 700 }}>Items</span>
            </div>
          </div>
          <div style={{ backgroundColor: '#EFF6FF', color: '#2563EB', padding: '0.65rem', borderRadius: '12px' }}>
            <Utensils size={22} />
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.15rem 1.35rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AVAILABLE IN STOCK</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#166534', fontFamily: 'var(--font-heading)', marginTop: '0.15rem' }}>
              {inStockCount} <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 700 }}>Active</span>
            </div>
          </div>
          <div style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '0.65rem', borderRadius: '12px' }}>
            <PackageCheck size={22} />
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.15rem 1.35rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OUT OF STOCK </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#DC2626', fontFamily: 'var(--font-heading)', marginTop: '0.15rem' }}>
              {outCount} <span style={{ fontSize: '0.85rem', color: '#DC2626', fontWeight: 700 }}>Disabled</span>
            </div>
          </div>
          <div style={{ backgroundColor: '#FEF2F2', color: '#DC2626', padding: '0.65rem', borderRadius: '12px' }}>
            <PackageX size={22} />
          </div>
        </div>
      </div>

      {/* ================= 3. CATEGORY FILTER TABS ================= */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.25rem', scrollbarWidth: 'none' }} className="no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            style={{
              backgroundColor: selectedCategory === cat ? '#0F2A1D' : '#FFFFFF',
              color: selectedCategory === cat ? '#FFFFFF' : '#475569',
              border: selectedCategory === cat ? '1.5px solid #0F2A1D' : '1px solid #E2E8F0',
              borderRadius: '9999px',
              padding: '0.45rem 1rem',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              boxShadow: selectedCategory === cat ? '0 4px 12px rgba(15, 42, 29, 0.15)' : 'none'
            }}
          >
            {cat === 'ALL' ? '🍽️ All Dishes' : cat}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setSelectedCategory('OUT_OF_STOCK')}
          style={{
            backgroundColor: selectedCategory === 'OUT_OF_STOCK' ? '#DC2626' : '#FFFFFF',
            color: selectedCategory === 'OUT_OF_STOCK' ? '#FFFFFF' : '#DC2626',
            border: selectedCategory === 'OUT_OF_STOCK' ? '1.5px solid #DC2626' : '1px solid #FCA5A5',
            borderRadius: '9999px',
            padding: '0.45rem 1rem',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
        >
          🔴 Out of Stock Only ({outCount})
        </button>
      </div>

      {/* ================= 4. MENU ITEMS STOCK GRID ================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.25rem'
      }}>
        {filteredMenuItems.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}>
            <Utensils size={48} color="#CBD5E1" style={{ display: 'block', margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D' }}>
              No Dishes Found
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
              No menu items match your selected filter or search query.
            </p>
          </div>
        ) : (
          filteredMenuItems.map(item => {
            const itemId = item._id || item.id;
            const isOut = outOfStockItems.includes(itemId) || outOfStockItems.includes(item.name);

            return (
              <div
                key={itemId}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: isOut ? '2px solid #FCA5A5' : '1px solid #E2E8F0',
                  boxShadow: isOut ? '0 8px 24px rgba(220, 38, 38, 0.08)' : '0 4px 16px rgba(0,0,0,0.03)',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Out of Stock Strip Badge */}
                {isOut && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    padding: '0.2rem 0.75rem',
                    borderBottomLeftRadius: '10px',
                    letterSpacing: '0.5px'
                  }}>
                    OUT OF STOCK
                  </div>
                )}

                {/* Card Top Information */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: isOut ? '#DC2626' : '#0F2A1D', fontFamily: 'var(--font-heading)', paddingRight: isOut ? '5rem' : '0' }}>
                      {item.name}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', backgroundColor: '#F1F5F9', color: '#475569', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
                      {item.category || 'General'}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#166534' }}>
                      ₹{item.price}
                    </span>
                  </div>
                </div>

                {/* Stock Status Action Button */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isOut ? '#DC2626' : '#22C55E',
                      display: 'inline-block'
                    }} />
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: isOut ? '#DC2626' : '#166534' }}>
                      {isOut ? 'Disabled on Menu' : 'Active on Menu'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleOutOfStock(itemId, item.name)}
                    style={{
                      backgroundColor: isOut ? '#DC2626' : '#F0FDF4',
                      color: isOut ? '#FFFFFF' : '#166534',
                      border: isOut ? 'none' : '1.5px solid #86EFAC',
                      borderRadius: '10px',
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.2s ease',
                      boxShadow: isOut ? '0 4px 12px rgba(220, 38, 38, 0.25)' : 'none'
                    }}
                  >
                    {isOut ? (
                      <>
                        <RefreshCw size={13} />
                        <span>Restore Stock</span>
                      </>
                    ) : (
                      <>
                        <PackageX size={13} />
                        <span>Mark Out of Stock</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
