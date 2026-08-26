import React from 'react';

export default function ChefInventoryPage({
  menuItems,
  outOfStockItems,
  handleToggleOutOfStock
}) {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '20px',
      padding: '1.5rem',
      border: '1px solid #F0EAE1',
      boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
            86'd Kitchen Item Availability Manager
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
            Toggle dishes as "Out of Stock" to instantly disable customer ordering on live QR menus.
          </p>
        </div>

        <div style={{ backgroundColor: '#FEF2F2', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid #FCA5A5', fontSize: '0.8rem', color: '#DC2626', fontWeight: 800 }}>
          🔴 {outOfStockItems.length} Dishes Currently Out of Stock
        </div>
      </div>

      {/* Menu Items Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '1rem'
      }}>
        {menuItems.length === 0 ? (
          <div style={{ color: '#94A3B8', padding: '2rem', textAlign: 'center', gridColumn: 'span 3' }}>
            Loading menu items from database...
          </div>
        ) : (
          menuItems.map(item => {
            const itemId = item._id || item.id;
            const isOut = outOfStockItems.includes(itemId) || outOfStockItems.includes(item.name);

            return (
              <div
                key={itemId}
                style={{
                  backgroundColor: isOut ? '#FEF2F2' : '#F8FAFC',
                  border: isOut ? '1px solid #FCA5A5' : '1px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: isOut ? '#DC2626' : '#0F2A1D' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>
                    {item.category} • ₹{item.price}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleOutOfStock(itemId, item.name)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isOut ? '#DC2626' : '#166534',
                    color: '#FFFFFF',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: isOut ? '0 4px 12px rgba(220, 38, 38, 0.3)' : 'none'
                  }}
                >
                  {isOut ? '🔴 86\'d (Out)' : '🟢 In Stock'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
