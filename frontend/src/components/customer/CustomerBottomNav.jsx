import React from 'react';
import { UtensilsCrossed, Clock, Receipt, Sparkles } from 'lucide-react';

export default function CustomerBottomNav({
  activeTab,
  onSelectTab,
  activeOrderCount = 0
}) {
  return (
    <div className="customer-bottom-nav">
      {/* Tab 1: Menu */}
      <button
        onClick={() => onSelectTab('menu')}
        className="customer-bottom-nav-tab"
        style={{
          color: activeTab === 'menu' ? '#166534' : '#64748B'
        }}
      >
        <UtensilsCrossed size={20} color={activeTab === 'menu' ? '#166534' : '#64748B'} />
        <span className="customer-bottom-nav-label" style={{ fontWeight: activeTab === 'menu' ? 800 : 600 }}>
          Menu
        </span>
      </button>

      {/* Tab 2: Orders */}
      <button
        onClick={() => onSelectTab('orders')}
        className="customer-bottom-nav-tab"
        style={{
          color: activeTab === 'orders' ? '#166534' : '#64748B'
        }}
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <Clock size={20} color={activeTab === 'orders' ? '#166534' : '#64748B'} />
          {activeOrderCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-9px',
              backgroundColor: '#166534',
              color: '#FFFFFF',
              fontSize: '0.62rem',
              fontWeight: 900,
              minWidth: '16px',
              height: '16px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              border: '1.5px solid #FFFFFF',
              boxShadow: '0 2px 5px rgba(22, 101, 52, 0.25)'
            }}>
              {activeOrderCount}
            </span>
          )}
        </div>
        <span className="customer-bottom-nav-label" style={{ fontWeight: activeTab === 'orders' ? 800 : 600 }}>
          Live Order
        </span>
      </button>

      {/* Tab 3: Bill */}
      <button
        onClick={() => onSelectTab('bill')}
        className="customer-bottom-nav-tab"
        style={{
          color: activeTab === 'bill' ? '#166534' : '#64748B'
        }}
      >
        <Receipt size={20} color={activeTab === 'bill' ? '#166534' : '#64748B'} />
        <span className="customer-bottom-nav-label" style={{ fontWeight: activeTab === 'bill' ? 800 : 600 }}>
          Running Bill
        </span>
      </button>

      {/* Tab 4: More / Engagement */}
      <button
        onClick={() => onSelectTab('more')}
        className="customer-bottom-nav-tab"
        style={{
          color: activeTab === 'more' ? '#166534' : '#64748B'
        }}
      >
        <Sparkles size={20} color={activeTab === 'more' ? '#166534' : '#64748B'} />
        <span className="customer-bottom-nav-label" style={{ fontWeight: activeTab === 'more' ? 800 : 600 }}>
          More & Rate
        </span>
      </button>
    </div>
  );
}


