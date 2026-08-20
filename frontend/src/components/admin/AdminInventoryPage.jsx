import React, { useState, useEffect } from 'react';
import { Boxes, AlertTriangle, Plus, Search, RefreshCw, CheckCircle2, X, Edit3, Trash2, PackagePlus, Filter, MoreVertical } from 'lucide-react';

export default function AdminInventoryPage() {
  const initialItems = [
    { id: 'INV-01', name: 'Basmati Biryani Rice (50kg)', category: 'Grains & Rice', stockQty: 120, unit: 'kg', minLevel: 30, supplier: 'India Gate Traders' },
    { id: 'INV-02', name: 'Fresh Paneer (Cottage Cheese)', category: 'Dairy', stockQty: 4, unit: 'kg', minLevel: 10, supplier: 'Amul Dairy Distributor' },
    { id: 'INV-03', name: 'Amul Fresh Butter (500g)', category: 'Dairy', stockQty: 2, unit: 'kg', minLevel: 8, supplier: 'Amul Dairy Distributor' },
    { id: 'INV-04', name: 'Fresh Boneless Chicken', category: 'Meat & Poultry', stockQty: 35, unit: 'kg', minLevel: 15, supplier: 'Metro Meat Supplies' },
    { id: 'INV-05', name: 'Refined Sunflower Oil (15L)', category: 'Oils & Spices', stockQty: 85, unit: 'L', minLevel: 20, supplier: 'Fortune Oils' },
    { id: 'INV-06', name: 'Garam Masala Blend (1kg)', category: 'Oils & Spices', stockQty: 12, unit: 'kg', minLevel: 3, supplier: 'Everest Spices' },
  ];

  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('flavora_inventory_items');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialItems;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [reorderModalItem, setReorderModalItem] = useState(null);
  const [addQty, setAddQty] = useState(10);
  const [toastMsg, setToastMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: 'Grains & Rice',
    stockQty: '',
    unit: 'kg',
    minLevel: '',
    supplier: ''
  });

  useEffect(() => {
    localStorage.setItem('flavora_inventory_items', JSON.stringify(items));
  }, [items]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleCreateStockItem = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.stockQty || !formData.minLevel) {
      alert('Please fill in ingredient name, current stock, and minimum reorder level.');
      return;
    }

    const nextNum = items.length + 1;
    const newId = `INV-${nextNum < 10 ? '0' + nextNum : nextNum}`;

    const newItem = {
      id: newId,
      name: formData.name.trim(),
      category: formData.category,
      stockQty: Number(formData.stockQty),
      unit: formData.unit,
      minLevel: Number(formData.minLevel),
      supplier: formData.supplier.trim() || 'General Vendor'
    };

    setItems([newItem, ...items]);
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      category: 'Grains & Rice',
      stockQty: '',
      unit: 'kg',
      minLevel: '',
      supplier: ''
    });
    showToast(`✅ "${newItem.name}" added to inventory successfully!`);
  };

  const handleReorderStock = (e) => {
    e.preventDefault();
    if (!reorderModalItem) return;
    const qtyToAdd = Number(addQty) || 10;
    
    setItems(items.map(item => {
      if (item.id === reorderModalItem.id) {
        return { ...item, stockQty: item.stockQty + qtyToAdd };
      }
      return item;
    }));

    showToast(`📦 Restocked ${qtyToAdd} ${reorderModalItem.unit} of ${reorderModalItem.name}!`);
    setReorderModalItem(null);
  };

  const handleDeleteItem = (id, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from inventory?`)) {
      setItems(items.filter(i => i.id !== id));
      showToast(`🗑️ "${name}" removed from inventory.`);
    }
  };

  // Dynamic Low Stock Calculation
  const lowStockItems = items.filter(i => Number(i.stockQty) <= Number(i.minLevel));

  // Filtered List
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="admin-subpage-container">
      
      {/* Floating Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#F0FDF4',
          color: '#166534',
          border: '1.5px solid #BBF7D0',
          padding: '0.85rem 1.35rem',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.92rem',
          fontWeight: 800
        }}>
          <CheckCircle2 size={20} color="#166534" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
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
        <button 
          className="btn btn-primary" 
          onClick={() => setIsAddModalOpen(true)}
          style={{ padding: '0.65rem 1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} />
          <span>Add Stock Item</span>
        </button>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="admin-alert-banner" style={{ background: '#FEF2F2', borderColor: '#FCA5A5', color: '#991B1B', padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
          <AlertTriangle size={20} color="#DC2626" />
          <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            <strong style={{ color: '#991B1B' }}>Low Stock Alert:</strong> {lowStockItems.length} ingredient{lowStockItems.length > 1 ? 's' : ''} ({lowStockItems.map(i => i.name).join(', ')}) {lowStockItems.length > 1 ? 'are' : 'is'} below minimum reorder thresholds.
          </div>
        </div>
      )}

      {/* Inventory Table & Filters Container */}
      <div className="admin-card" style={{ padding: '1.5rem' }}>
        
        {/* Search & Category Filter Controls */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '480px' }}>
            <Search size={16} color="#64748B" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by ingredient name, code, or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2.5rem', background: '#FAF6EE' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={16} color="#64748B" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-control"
              style={{ padding: '0.5rem 0.95rem', width: 'auto', fontWeight: 700, background: '#FAF6EE' }}
            >
              <option value="All">All Categories</option>
              <option value="Grains & Rice">Grains & Rice</option>
              <option value="Dairy">Dairy</option>
              <option value="Meat & Poultry">Meat & Poultry</option>
              <option value="Oils & Spices">Oils & Spices</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Beverages">Beverages</option>
            </select>
          </div>
        </div>

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
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>
                    No inventory items match your search or filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((inv) => {
                  const isLow = Number(inv.stockQty) <= Number(inv.minLevel);
                  return (
                    <tr key={inv.id}>
                      <td className="font-semibold" style={{ color: '#1E4636' }}>{inv.id}</td>
                      <td className="font-semibold" style={{ color: '#0F2A1D' }}>{inv.name}</td>
                      <td>{inv.category}</td>
                      <td className="font-semibold" style={{ color: isLow ? '#DC2626' : '#1E4636' }}>
                        {inv.stockQty} {inv.unit}
                      </td>
                      <td>{inv.minLevel} {inv.unit}</td>
                      <td>
                        <span className={`status-badge-unified ${isLow ? 'is-cancelled' : 'is-ready'}`}>
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="text-xs text-muted" style={{ fontWeight: 600 }}>{inv.supplier}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-popover-wrapper">
                          <button 
                            className="action-popover-trigger-btn"
                            aria-label="Actions Menu"
                            title="More Actions"
                          >
                            <MoreVertical size={16} color="#1E4636" />
                          </button>
                          
                          <div className="action-popover-dropdown">
                            <button 
                              className="action-popover-item"
                              onClick={() => { setReorderModalItem(inv); setAddQty(10); }}
                            >
                              <PackagePlus size={14} color="#1E4636" />
                              <span>Reorder Stock</span>
                            </button>
                            <button 
                              className="action-popover-item is-delete"
                              onClick={() => handleDeleteItem(inv.id, inv.name)}
                            >
                              <Trash2 size={14} color="#DC2626" />
                              <span>Delete Item</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADD STOCK ITEM MODAL ================= */}
      {isAddModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ background: '#FFFFFF', maxWidth: '540px' }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Add New Stock Item</h2>
              <button className="admin-modal-close" onClick={() => setIsAddModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleCreateStockItem} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Ingredient / Item Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Basmati Biryani Rice (50kg)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-control"
                  >
                    <option value="Grains & Rice">Grains & Rice</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Meat & Poultry">Meat & Poultry</option>
                    <option value="Oils & Spices">Oils & Spices</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Stock Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="form-control"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="L">L (Liters)</option>
                    <option value="g">g (Grams)</option>
                    <option value="ml">ml (Milliliters)</option>
                    <option value="packs">packs</option>
                    <option value="units">units</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Current Stock Qty *</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    min="0"
                    value={formData.stockQty}
                    onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Min Reorder Level *</label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    min="0"
                    value={formData.minLevel}
                    onChange={(e) => setFormData({ ...formData, minLevel: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Primary Supplier / Vendor</label>
                <input
                  type="text"
                  placeholder="e.g. Amul Dairy Distributor"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.4rem', fontWeight: 800 }}>
                  <Plus size={16} />
                  <span>SAVE STOCK ITEM</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= REORDER STOCK MODAL ================= */}
      {reorderModalItem && (
        <div className="admin-modal-backdrop" onClick={() => setReorderModalItem(null)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ background: '#FFFFFF', maxWidth: '440px' }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Restock / Reorder Ingredient</h2>
              <button className="admin-modal-close" onClick={() => setReorderModalItem(null)}>&times;</button>
            </div>

            <form onSubmit={handleReorderStock} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem', background: '#FAF6EE', padding: '0.85rem', borderRadius: '8px', border: '1px solid #EAE3D2' }}>
                <div style={{ fontWeight: 800, color: '#1E4636', fontSize: '0.95rem' }}>{reorderModalItem.name}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>
                  Current Stock: <strong>{reorderModalItem.stockQty} {reorderModalItem.unit}</strong> • Supplier: {reorderModalItem.supplier}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Quantity to Add ({reorderModalItem.unit}) *</label>
                <input
                  type="number"
                  min="1"
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setReorderModalItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.4rem', fontWeight: 800 }}>
                  <PackagePlus size={16} />
                  <span>CONFIRM RESTOCK</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
