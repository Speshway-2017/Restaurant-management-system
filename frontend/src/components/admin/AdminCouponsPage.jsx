import React, { useState } from 'react';
import { Ticket, Plus, Tag, Gift, Users, CheckCircle2 } from 'lucide-react';

export default function AdminCouponsPage() {
  const coupons = [
    { code: 'FLAVORA20', type: 'Percentage', discount: '20% OFF', minOrder: '₹500', maxDisc: '₹150', usages: 142, status: 'Active', expiry: '31 Aug 2026' },
    { code: 'WELCOME100', type: 'Flat Amount', discount: '₹100 OFF', minOrder: '₹400', maxDisc: '₹100', usages: 389, status: 'Active', expiry: '31 Dec 2026' },
    { code: 'BIRYANI50', type: 'Flat Amount', discount: '₹50 OFF', minOrder: '₹300', maxDisc: '₹50', usages: 88, status: 'Active', expiry: '15 Aug 2026' },
    { code: 'FESTIVE30', type: 'Percentage', discount: '30% OFF', minOrder: '₹1,000', maxDisc: '₹300', usages: 54, status: 'Expired', expiry: '01 Aug 2026' },
  ];

  return (
    <div className="admin-subpage-container">
      <div className="admin-dashboard-header">
        <div>
          <div className="page-breadcrumb-bar">
            <span>Admin</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Loyalty & Promo Coupons</span>
          </div>
          <h1 className="admin-page-title">Loyalty & Promo Coupons</h1>
          <p className="admin-page-subtitle">Configure discount codes, customer reward points, and seasonal campaigns.</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} />
          <span>Create Coupon Code</span>
        </button>
      </div>

      <div className="admin-card mb-4">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Active Promo Coupons</h2>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Discount Rule</th>
                <th>Min Order Value</th>
                <th>Max Discount</th>
                <th>Total Usages</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.code}>
                  <td className="font-semibold" style={{ color: '#E07A3C' }}>{c.code}</td>
                  <td className="font-semibold">{c.discount} ({c.type})</td>
                  <td>{c.minOrder}</td>
                  <td>{c.maxDisc}</td>
                  <td>{c.usages} times</td>
                  <td>{c.expiry}</td>
                  <td>
                    <span className={`status-badge-unified ${c.status === 'Active' ? 'is-ready' : 'is-cancelled'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-sm btn-outline">Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
