import React from 'react';

export default function ChefHistoryPage({ ordersList }) {
  const servedOrders = ordersList.filter(o => o.status === 'Served' || o.status === 'Completed');

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '20px',
      padding: '1.5rem',
      border: '1px solid #F0EAE1',
      boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
        Completed & Served Kitchen Tickets History
      </h3>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.85rem 1.25rem' }}>TICKET ID</th>
              <th style={{ padding: '0.85rem 1.25rem' }}>LOCATION / TABLE</th>
              <th style={{ padding: '0.85rem 1.25rem' }}>TIME</th>
              <th style={{ padding: '0.85rem 1.25rem' }}>PREPARED DISHES</th>
              <th style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {servedOrders.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8' }}>
                  No tickets dispatched yet today.
                </td>
              </tr>
            ) : (
              servedOrders.map(ord => (
                <tr key={ord.id} style={{ borderBottom: '1px solid #F1F5F9', fontSize: '0.85rem' }}>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#0F2A1D', fontFamily: 'monospace' }}>
                    {ord.id}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#166534' }}>
                    {ord.table}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#475569' }}>
                    {ord.time}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#0F2A1D', fontWeight: 600 }}>
                    {ord.items.map(i => `${i.quantity || 1}x ${i.name}`).join(', ')}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.74rem', backgroundColor: '#DCFCE7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 800 }}>
                      ✅ Dispatched
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
