import React from 'react';
import { UtensilsCrossed, Clock, Receipt, Sparkles, ShoppingBag } from 'lucide-react';

export default function CustomerBottomNav({
  activeTab,
  onSelectTab,
  cartCount = 0,
  cartTotal = 0,
  onOpenCart
}) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid #E2E8F0',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
      zIndex: 9900,
      padding: '0.4rem 1rem calc(0.4rem + env(safe-area-inset-bottom))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around'
    }}>
      {/* Tab 1: Menu */}
      <button
        onClick={() => onSelectTab('menu')}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: 'none',
          backgroundColor: 'transparent',
          color: activeTab === 'menu' ? '#166534' : '#64748B',
          cursor: 'pointer',
          padding: '0.35rem 0'
        }}
      >
        <UtensilsCrossed size={20} color={activeTab === 'menu' ? '#166534' : '#64748B'} />
        <span style={{ fontSize: '0.7rem', fontWeight: activeTab === 'menu' ? 800 : 600, marginTop: '0.2rem' }}>
          Menu
        </span>
      </button>

      {/* Tab 2: Orders */}
      <button
        onClick={() => onSelectTab('orders')}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: 'none',
          backgroundColor: 'transparent',
          color: activeTab === 'orders' ? '#166534' : '#64748B',
          cursor: 'pointer',
          padding: '0.35rem 0'
        }}
      >
        <Clock size={20} color={activeTab === 'orders' ? '#166534' : '#64748B'} />
        <span style={{ fontSize: '0.7rem', fontWeight: activeTab === 'orders' ? 800 : 600, marginTop: '0.2rem' }}>
          Live Order
        </span>
      </button>

      {/* Floating Cart Trigger Pill in Center if items in cart */}
      {cartCount > 0 && (
        <button
          onClick={onOpenCart}
          style={{
            transform: 'translateY(-12px)',
            backgroundColor: '#166534',
            color: '#FFFFFF',
            borderRadius: '9999px',
            padding: '0.55rem 1rem',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(22, 101, 52, 0.4)',
            cursor: 'pointer'
          }}
        >
          <ShoppingBag size={18} />
          <span style={{ fontSize: '0.82rem', fontWeight: 900 }}>{cartCount} Items</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 900, borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '0.5rem' }}>₹{cartTotal}</span>
        </button>
      )}

      {/* Tab 3: Bill */}
      <button
        onClick={() => onSelectTab('bill')}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: 'none',
          backgroundColor: 'transparent',
          color: activeTab === 'bill' ? '#166534' : '#64748B',
          cursor: 'pointer',
          padding: '0.35rem 0'
        }}
      >
        <Receipt size={20} color={activeTab === 'bill' ? '#166534' : '#64748B'} />
        <span style={{ fontSize: '0.7rem', fontWeight: activeTab === 'bill' ? 800 : 600, marginTop: '0.2rem' }}>
          Running Bill
        </span>
      </button>

      {/* Tab 4: More / Engagement */}
      <button
        onClick={() => onSelectTab('more')}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: 'none',
          backgroundColor: 'transparent',
          color: activeTab === 'more' ? '#166534' : '#64748B',
          cursor: 'pointer',
          padding: '0.35rem 0'
        }}
      >
        <Sparkles size={20} color={activeTab === 'more' ? '#166534' : '#64748B'} />
        <span style={{ fontSize: '0.7rem', fontWeight: activeTab === 'more' ? 800 : 600, marginTop: '0.2rem' }}>
          More & Rate
        </span>
      </button>
    </div>
  );
}
