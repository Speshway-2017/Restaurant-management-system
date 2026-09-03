import React from 'react';
import { Search, Utensils, UtensilsCrossed, Plus, Minus, ShoppingBag, Sparkles, Clock, QrCode, CheckCircle2, ChevronRight } from 'lucide-react';
import { resolveDishImageUrl } from '../../utils/menuRegistry';
import MenuDishStrip from '../MenuDishStrip';

export default function CustomerMobileMenuView({
  brandName,
  tableNum,
  menuItems,
  filteredItems,
  groupedDishes,
  dynamicCategories,
  selectedCategory,
  setSelectedCategory,
  vegOnly,
  setVegOnly,
  searchQuery,
  setSearchQuery,
  priceFilter,
  setPriceFilter,
  spiceFilter,
  setSpiceFilter,
  cart,
  totalCartCount,
  totalCartPrice,
  handleAddToCart,
  handleDecreaseQty,
  setSelectedDishForDetail,
  setIsCheckoutModalOpen,
  setIsCustomerOrdersModalOpen,
  setIsCategoryDrawerOpen,
  activeTableSession = null,
  outOfStockItems = [],
  placedTableOrders = [],
  isClosedNow = false,
  statusDetails = {}
}) {
  return (
    <div className="customer-mobile-menu-page" style={{ position: 'relative', backgroundColor: '#F8FAFC', color: '#0F172A', paddingBottom: '5rem', minHeight: '100vh' }}>
      
      {/* 1. Mobile Fixed Seated Table Top Header Bar */}
      {tableNum && (
        <div
          className="customer-seated-bar"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 990,
            height: '46px',
            backgroundColor: '#0F2A1D',
            color: '#FFFFFF',
            padding: '0 0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(15, 42, 29, 0.22)'
          }}
        >
          {/* Left: Table badge & active guest session label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, overflow: 'hidden' }}>
            <span style={{ backgroundColor: '#E07A3C', color: '#FFFFFF', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {activeTableSession && Array.isArray(activeTableSession.mergedTableNums) && activeTableSession.mergedTableNums.length > 0
                ? `Table ${tableNum} + ${activeTableSession.mergedTableNums.join(', ')}`
                : `Table ${tableNum}`}
            </span>
            
          </div>

          {/* Right: Orders & Cart button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {placedTableOrders.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCustomerOrdersModalOpen(true)}
                style={{
                  backgroundColor: '#F2C14E',
                  color: '#0F2A1D',
                  border: 'none',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <ShoppingBag size={12} />
                <span>Orders ({placedTableOrders.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCheckoutModalOpen(true)}
              style={{
                backgroundColor: '#B91C1C',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                boxShadow: '0 2px 8px rgba(185, 28, 28, 0.4)'
              }}
            >
              <ShoppingBag size={13} />
              <span>Cart {totalCartCount > 0 ? `(${totalCartCount})` : ''}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Restaurant Closed Banner */}
      {isClosedNow && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FCA5A5', padding: '0.75rem 1rem', margin: '0.75rem 0.85rem 0 0.85rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Clock size={20} color="#DC2626" />
          <div style={{ fontSize: '0.8rem', color: '#991B1B', fontWeight: 700 }}>
            {statusDetails.closedMessage || 'Restaurant is currently closed for ordering.'}
          </div>
        </div>
      )}

     

      {/* 4. Search & Filter Bar */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '0.85rem', borderBottom: '1px solid #E2E8F0', sticky: 'top', top: tableNum ? '46px' : 0, zIndex: 980 }}>
        {/* Search Input */}
        <div style={{ position: 'relative', width: '100%', marginBottom: '0.65rem' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            type="text"
            placeholder="Search dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '40px',
              paddingLeft: '2.4rem',
              paddingRight: '1rem',
              borderRadius: '9999px',
              border: '1.5px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              fontSize: '0.86rem',
              fontWeight: 600,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Scrollable Category Pill Chips */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            paddingBottom: '0.2rem'
          }}
          className="no-scrollbar"
        >
          {/* Veg Only Toggle Switch (Without text) */}
          <div
            onClick={() => setVegOnly(!vegOnly)}
            title={vegOnly ? "Showing Veg Only dishes (Click to show all)" : "Click to filter Veg Only dishes"}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
              padding: '0.35rem 0.65rem',
              borderRadius: '16px',
              border: '1px solid #CBD5E1',
              cursor: 'pointer',
              userSelect: 'none',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              height: '30px',
              boxSizing: 'border-box'
            }}
          >
            {/* Horizontal Pill Track */}
            <div
              style={{
                width: '46px',
                height: '16px',
                borderRadius: '10px',
                backgroundColor: vegOnly ? '#DCFCE7' : '#E2E8F0',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                transition: 'background-color 0.25s ease'
              }}
            >
              {/* Sliding Green Veg Square Knob */}
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '7px',
                  border: '2px solid #166534',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  position: 'absolute',
                  top: '-2px',
                  left: vegOnly ? '24px' : '-2px',
                  transition: 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Center Green Dot */}
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#166534'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Categories */}
          {(dynamicCategories || []).map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: isActive ? '#1E4636' : '#F1F5F9',
                  color: isActive ? '#FFFFFF' : '#334155',
                  border: `1.5px solid ${isActive ? '#1E4636' : '#E2E8F0'}`,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 800 : 600,
                  flexShrink: 0,
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(30, 70, 54, 0.25)' : 'none'
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Dishes Grouped by Category */}
      <section style={{ padding: '1rem 0.85rem' }}>
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
            <Utensils size={36} color="#94A3B8" style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E4636', margin: '0 0 0.25rem 0' }}>No dishes found</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>Try clearing filters or search query.</p>
          </div>
        ) : (
          (groupedDishes || []).map(group => (
            <div key={group.key} style={{ marginBottom: '1.5rem' }}>
              
              {/* Category Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem', paddingBottom: '0.35rem', borderBottom: '2px solid #E2E8F0' }}>
                <span style={{ fontSize: '1.2rem' }}>{group.icon}</span>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E4636', margin: 0, fontFamily: "var(--font-heading), 'Poppins', sans-serif" }}>
                  {group.key}
                </h2>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, marginLeft: 'auto', backgroundColor: '#F1F5F9', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                  {group.items.length} items
                </span>
              </div>

              {/* Mobile Dish Card List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {group.items.map(item => {
                  const qty = cart[item.id] || 0;
                  const itemId = item._id || item.id;
                  const isOutInStore = outOfStockItems.includes(itemId) || outOfStockItems.includes(item.name);
                  const isAvailable = item.available !== false && item.isAvailable !== false && !isOutInStore;

                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        padding: '0.85rem',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        border: '1px solid #F1F5F9',
                        position: 'relative'
                      }}
                    >
                      {/* Left Image Thumbnail */}
                      <div
                        onClick={() => setSelectedDishForDetail(item)}
                        style={{
                          width: '76px',
                          height: '76px',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          position: 'relative',
                          backgroundColor: '#F8FAFC',
                          cursor: 'pointer'
                        }}
                      >
                        <img
                          src={resolveDishImageUrl(item)}
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/hero_dish_2.png';
                          }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isAvailable ? 1 : 0.6 }}
                        />
                        {!isAvailable && (
                          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.58rem', fontWeight: 900, color: '#FFFFFF', backgroundColor: '#DC2626', padding: '2px 4px', borderRadius: '4px' }}>OFFLINE</span>
                          </div>
                        )}
                      </div>

                      {/* Middle Dish Info */}
                      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem', flexWrap: 'wrap' }}>
                          {/* Veg/Non-Veg Dot */}
                          <span style={{ display: 'inline-block', width: '12px', height: '12px', border: `2px solid ${item.isVeg ? '#166534' : '#DC2626'}`, borderRadius: '3px', position: 'relative', flexShrink: 0 }}>
                            <span style={{ position: 'absolute', inset: '2px', backgroundColor: item.isVeg ? '#166534' : '#DC2626', borderRadius: '50%' }}></span>
                          </span>

                          <h3
                            onClick={() => setSelectedDishForDetail(item)}
                            style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0F2A1D', margin: 0, lineHeight: 1.25, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}
                          >
                            {item.name}
                          </h3>

                          {item.bestseller && (
                            <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '0.6rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '9999px', border: '1px solid #FCD34D' }}>
                              ⭐ Best
                            </span>
                          )}
                        </div>

                        <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 0.3rem 0', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.desc || 'Prepared fresh with authentic royal spices.'}
                        </p>

                        <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
                          ⏱️ {item.prepTime || '15 mins'} • {item.spice || 'Medium'}
                        </div>
                      </div>

                      {/* Right Price & Add Action */}
                      <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#1E4636' }}>
                          ₹{item.price}
                        </span>

                        {!isAvailable ? (
                          <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, backgroundColor: '#E2E8F0', padding: '0.25rem 0.55rem', borderRadius: '6px' }}>
                            Unavailable
                          </span>
                        ) : !tableNum ? (
                          <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700, backgroundColor: '#F1F5F9', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
                            Scan QR
                          </span>
                        ) : qty > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#1E4636', color: '#FFFFFF', padding: '0.2rem 0.45rem', borderRadius: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleDecreaseQty(item.id)}
                              style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '1px' }}
                            >
                              <Minus size={13} />
                            </button>
                            <span style={{ fontWeight: 800, fontSize: '0.82rem', minWidth: '16px', textAlign: 'center' }}>{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(item.id)}
                              style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '1px' }}
                            >
                              <Plus size={13} />
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
                              padding: '0.35rem 0.95rem',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(30, 70, 54, 0.25)'
                            }}
                          >
                            ADD
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ))
        )}
      </section>

      {/* Floating Category Drawer Button */}
      <button
        type="button"
        onClick={() => setIsCategoryDrawerOpen(true)}
        aria-label="Open Menu Categories"
        className="customer-floating-menu-btn"
      >
        <UtensilsCrossed size={24} strokeWidth={2.4} color="#FFFFFF" />
      </button>

    </div>
  );
}
