import React, { useState, useEffect } from 'react';
import { Ticket, Percent, Sparkles, Tag, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../../services/api';

export default function ManagerCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = async () => {
    try {
      const dbCoupons = await api.getCoupons();
      let managerCoupons = [];

      if (Array.isArray(dbCoupons) && dbCoupons.length > 0) {
        managerCoupons = dbCoupons.map(c => {
          const isPercent = c.discount <= 100 && c.discount > 0;
          return {
            id: c._id || c.id,
            code: c.code,
            type: isPercent ? 'Percentage' : 'Flat Amount',
            discount: isPercent ? `${c.discount}% OFF` : `₹${c.discount} FLAT OFF`,
            minBill: `₹${c.minOrder || 0}`,
            maxDiscount: c.maxDiscount ? `₹${c.maxDiscount}` : null,
            status: c.isActive !== false ? 'Active' : 'Inactive',
            expiry: c.validTill && c.validTill !== 'Never' ? c.validTill : 'Never'
          };
        });
      }

      // Check local storage coupons added by admin
      try {
        const saved = localStorage.getItem('flavora_coupons');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            parsed.forEach(localC => {
              if (localC.code && !managerCoupons.some(ex => ex.code.toUpperCase() === localC.code.toUpperCase())) {
                managerCoupons.push({
                  id: localC.id || localC.code,
                  code: localC.code,
                  type: localC.type || 'Flat Amount',
                  discount: localC.discount || (localC.discountVal ? (localC.type === 'Percentage' ? `${localC.discountVal}% OFF` : `₹${localC.discountVal} FLAT OFF`) : 'PROMO'),
                  minBill: localC.minOrder ? (String(localC.minOrder).startsWith('₹') ? localC.minOrder : `₹${localC.minOrder}`) : '₹0',
                  maxDiscount: localC.maxDisc ? (String(localC.maxDisc).startsWith('₹') ? localC.maxDisc : `₹${localC.maxDisc}`) : null,
                  status: localC.status || (localC.isActive !== false ? 'Active' : 'Inactive'),
                  expiry: localC.expiry || 'Never'
                });
              }
            });
          }
        }
      } catch (e) {}

      setCoupons(managerCoupons);
    } catch (err) {
      console.warn("Could not fetch database coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
    window.addEventListener('flavora_coupons_updated', fetchCoupons);
    window.addEventListener('storage', fetchCoupons);
    return () => {
      window.removeEventListener('flavora_coupons_updated', fetchCoupons);
      window.removeEventListener('storage', fetchCoupons);
    };
  }, []);

  return (
    <div className="admin-subpage-container" style={{ paddingBottom: '3rem' }}>
      <div className="admin-dashboard-header">
        <div>
          <div className="page-breadcrumb-bar">
            <span>Dashboard</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Active Coupons & Discounts</span>
          </div>
          <h1 className="admin-page-title">Active Promotional Discounts</h1>
          <p className="admin-page-subtitle">View active promo codes created by admin available for cashier and table checkout billing.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
          Loading active coupons from database...
        </div>
      ) : coupons.length === 0 ? (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '3rem', border: '1px solid #F0EAE1', textAlign: 'center' }}>
          <Ticket size={44} color="#CBD5E1" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1E293B', fontWeight: 800 }}>No Active Coupons Found</h3>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.88rem' }}>No promotional coupons have been created by the Admin yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {coupons.map((c, i) => (
            <div key={i} style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '1.25rem', border: '1px solid #F0EAE1', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1E4636', backgroundColor: '#F8F6F0', padding: '0.35rem 0.85rem', borderRadius: '8px', border: '1px dashed #1E4636', letterSpacing: '0.5px' }}>
                    {c.code}
                  </span>
                  <span style={{
                    backgroundColor: c.status === 'Active' ? '#DCFCE7' : '#F1F5F9',
                    color: c.status === 'Active' ? '#166534' : '#64748B',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '9999px'
                  }}>
                    {c.status}
                  </span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2A1D', marginBottom: '0.35rem' }}>{c.discount}</div>
                <div style={{ fontSize: '0.84rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
                  <div><strong>Min Order Value:</strong> {c.minBill}</div>
                  {c.maxDiscount && <div><strong>Max Discount:</strong> {c.maxDiscount}</div>}
                  {c.expiry && c.expiry !== 'Never' && <div><strong>Valid Till:</strong> {c.expiry}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
