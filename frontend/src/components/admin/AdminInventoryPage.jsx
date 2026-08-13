import React, { useState } from 'react';
import { Boxes, AlertTriangle, Plus, Search, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function AdminInventoryPage() {
  const inventoryItems = [
    { id: 'INV-01', name: 'Basmati Biryani Rice (50kg)', category: 'Grains & Rice', stock: '120 kg', minLevel: '30 kg', status: 'In Stock', supplier: 'India Gate Traders' },
    { id: 'INV-02', name: 'Fresh Paneer (Cottage Cheese)', category: 'Dairy', stock: '4 kg', minLevel: '10 kg', status: 'Low Stock', supplier: 'Amul Dairy Distributor' },
    { id: 'INV-03', name: 'Amul Fresh Butter (500g)', category: 'Dairy', stock: '2 kg', minLevel: '8 kg', status: 'Low Stock', supplier: 'Amul Dairy Distributor' },
    { id: 'INV-04', name: 'Fresh Boneless Chicken', category: 'Meat & Poultry', stock: '35 kg', minLevel: '15 kg', status: 'In Stock', supplier: 'Metro Meat Supplies' },
    { id: 'INV-05', name: 'Refined Sunflower Oil (15L)', category: 'Oils & Spices', stock: '85 L', minLevel: '20 L', status: 'In Stock', supplier: 'Fortune Oils' },
    { id: 'INV-06', name: 'Garam Masala Blend (1kg)', category: 'Oils & Spices', stock: '12 kg', minLevel: '3 kg', status: 'In Stock', supplier: 'Everest Spices' },
  ];

  return (
    <div className="admin-subpage-container">
      <div className="admin-dashboard-header">
        <div>
          <div className="page-breadcrumb-bar">
            <span>Admin</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Inventory & Raw Materials</span>
          </div>
          <h1 className="admin-page-title">Inventory & Raw Materials</h1>
          <p className="admin-page-subtitle">Track raw kitchen ingredients, low stock warnings, and supplier reorders.</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} />
          <span>Add Stock Item</span>
        </button>
      </div>

      {/* Warning Banner if Low Stock */}
      <div className="admin-alert-banner">
        <AlertTriangle size={18} color="#C0392B" />
        <div>
          <strong>Low Stock Alert:</strong> 2 ingredients (Fresh Paneer, Amul Butter) are below minimum reorder thresholds.
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Ingredient Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Min Reorder Level</th>
                <th>Status</th>
                <th>Primary Supplier</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-semibold" style={{ color: '#1E4636' }}>{inv.id}</td>
                  <td className="font-semibold">{inv.name}</td>
                  <td>{inv.category}</td>
                  <td className="font-semibold">{inv.stock}</td>
                  <td>{inv.minLevel}</td>
                  <td>
                    <span className={`status-badge-unified ${inv.status === 'Low Stock' ? 'is-cancelled' : 'is-ready'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="text-xs text-muted">{inv.supplier}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-sm btn-outline">Reorder</button>
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
