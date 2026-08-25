import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Tag, Gift, Users, CheckCircle2, X, Trash2, Percent, DollarSign, Calendar, MoreVertical, Edit3, Ban } from 'lucide-react';
import { api } from '../../services/api';

export default function AdminCouponsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveActionMenuId(null);
      setMenuPosition(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const [coupons, setCoupons] = useState([
    { id: '1', code: 'FLAVORA20', type: 'Percentage', discountVal: 20, discount: '20% OFF', minOrder: '₹500', maxDisc: '₹150', usages: 142, status: 'Active', expiry: '2026-08-31' },
    { id: '2', code: 'WELCOME100', type: 'Flat Amount', discountVal: 100, discount: '₹100 OFF', minOrder: '₹400', maxDisc: '₹100', usages: 389, status: 'Active', expiry: '2026-12-31' },
    { id: '3', code: 'BIRYANI50', type: 'Flat Amount', discountVal: 50, discount: '₹50 OFF', minOrder: '₹300', maxDisc: '₹50', usages: 88, status: 'Active', expiry: '2026-08-15' },
    { id: '4', code: 'FESTIVE30', type: 'Percentage', discountVal: 30, discount: '30% OFF', minOrder: '₹1,000', maxDisc: '₹300', usages: 54, status: 'Expired', expiry: '2026-08-01' },
  ]);

  const [formData, setFormData] = useState({
    code: '',
    type: 'Percentage', // 'Percentage' or 'Flat Amount'
    discountVal: '',
    minOrder: '400',
    maxDisc: '150',
    expiry: '',
    isActive: true
  });

  const fetchCouponsList = () => {
    api.getCoupons()
      .then((data) => {
        if (data && data.length > 0) {
          const formatted = data.map(c => ({
            id: c._id || c.id,
            code: c.code,
            type: c.discount <= 100 ? 'Percentage' : 'Flat Amount',
            discountVal: c.discount,
            discount: c.discount <= 100 ? `${c.discount}% OFF` : `₹${c.discount} OFF`,
            minOrder: `₹${c.minOrder || 300}`,
            maxDisc: `₹${c.maxDiscount || 150}`,
            usages: c.usages || 0,
            status: c.isActive !== false ? 'Active' : 'Inactive',
            expiry: c.validTill && c.validTill !== 'Never' ? c.validTill : 'Never'
          }));
          setCoupons(formatted);
          try {
            localStorage.setItem('flavora_coupons', JSON.stringify(formatted));
            window.dispatchEvent(new Event('flavora_coupons_updated'));
          } catch (e) {}
        }
      })
      .catch((err) => {
        console.log('Using local coupons fallback:', err.message);
      });
  };

  useEffect(() => {
    fetchCouponsList();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      type: 'Percentage',
      discountVal: '',
      minOrder: '400',
      maxDisc: '150',
      expiry: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c) => {
    setEditingCoupon(c);
    setFormData({
      code: c.code || '',
      type: c.type || 'Percentage',
      discountVal: String(c.discountVal || (c.discount ? c.discount.replace(/[^0-9]/g, '') : '')),
      minOrder: String((c.minOrder || '').replace(/[^0-9]/g, '') || '400'),
      maxDisc: String((c.maxDisc || '').replace(/[^0-9]/g, '') || '150'),
      expiry: (c.expiry && c.expiry !== 'Never') ? c.expiry : '',
      isActive: c.status === 'Active'
    });
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discountVal) {
      alert('Please fill in required fields (Coupon Code, Discount Value).');
      return;
    }

    const cleanCode = formData.code.trim().toUpperCase();
    const isPercent = formData.type === 'Percentage';
    const discNum = Number(formData.discountVal);

    const payload = {
      code: cleanCode,
      discount: discNum,
      minOrder: Number(formData.minOrder) || 300,
      maxDiscount: Number(formData.maxDisc) || 150,
      validTill: formData.expiry ? formData.expiry : 'Never',
      isActive: formData.isActive
    };

    if (editingCoupon) {
      try {
        if (editingCoupon.id && editingCoupon.id.length === 24) {
          await api.updateCoupon(editingCoupon.id, payload);
        }
        showToast(`Promo Coupon "${cleanCode}" updated successfully!`);
        fetchCouponsList();
      } catch (err) {
        console.warn('API update coupon error:', err.message);
        setCoupons(coupons.map(item => item.id === editingCoupon.id ? {
          ...item,
          code: cleanCode,
          type: formData.type,
          discountVal: discNum,
          discount: isPercent ? `${discNum}% OFF` : `₹${discNum} OFF`,
          minOrder: `₹${payload.minOrder}`,
          maxDisc: `₹${payload.maxDiscount}`,
          status: payload.isActive ? 'Active' : 'Inactive',
          expiry: payload.validTill
        } : item));
        showToast(`Promo Coupon "${cleanCode}" updated locally!`);
      }
    } else {
      try {
        await api.createCoupon(payload);
        showToast(`Promo Coupon "${cleanCode}" created successfully!`);
        fetchCouponsList();
      } catch (err) {
        console.warn('API create coupon fallback:', err.message);
        const newLocalCoupon = {
          id: String(Date.now()),
          code: cleanCode,
          type: formData.type,
          discountVal: discNum,
          discount: isPercent ? `${discNum}% OFF` : `₹${discNum} OFF`,
          minOrder: `₹${payload.minOrder}`,
          maxDisc: `₹${payload.maxDiscount}`,
          usages: 0,
          status: payload.isActive ? 'Active' : 'Inactive',
          expiry: payload.validTill
        };
        setCoupons([newLocalCoupon, ...coupons]);
        showToast(`Promo Coupon "${cleanCode}" added locally!`);
      }
    }

    setIsModalOpen(false);
    setEditingCoupon(null);
    setFormData({
      code: '',
      type: 'Percentage',
      discountVal: '',
      minOrder: '400',
      maxDisc: '150',
      expiry: '',
      isActive: true
    });
  };

  const handleToggleStatus = async (coupon) => {
    const newStatus = coupon.status === 'Active' ? 'Inactive' : 'Active';
    setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, status: newStatus } : c));
    showToast(`Coupon "${coupon.code}" is now ${newStatus}`);

    if (coupon.id.length === 24) {
      api.updateCoupon(coupon.id, { isActive: newStatus === 'Active' }).catch(() => {});
    }
  };

  const handleDeleteCoupon = async (id, code) => {
    if (window.confirm(`Are you sure you want to delete promo code "${code}"?`)) {
      setCoupons(coupons.filter(c => c.id !== id));
      showToast(`Coupon "${code}" deleted`);

      if (id.length === 24) {
        api.deleteCoupon(id).catch(() => {});
      }
    }
  };

  return (
    <div className="admin-subpage-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#1E4636',
          color: '#FFFFFF',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          fontSize: '0.88rem'
        }}>
          <CheckCircle2 size={18} color="#F2C14E" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
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

        {/* CREATE COUPON CODE BUTTON */}
        <button 
          className="btn btn-primary"
          onClick={handleOpenAddModal}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={16} />
          <span>Create Coupon Code</span>
        </button>
      </div>

      {/* Coupons List Table */}
      <div className="admin-card mb-4">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Active Promo Coupons</h2>
        </div>
        <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="admin-data-table" style={{ minWidth: '850px' }}>
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
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                    No promo coupons created yet. Click "Create Coupon Code" to add one!
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id || c.code}>
                    <td className="font-semibold" style={{ color: '#E07A3C', fontSize: '0.95rem' }}>
                      <span style={{ backgroundColor: '#FAF3E6', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px border #E5DBC8' }}>
                        🏷️ {c.code}
                      </span>
                    </td>
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
                      {/* Three Dots Button */}
                      <button 
                        className="admin-action-dots-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetId = c.id || c.code;
                          if (activeActionMenuId === targetId) {
                            setActiveActionMenuId(null);
                            setMenuPosition(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPosition({
                              top: rect.bottom + 4,
                              right: window.innerWidth - rect.right,
                              coupon: c
                            });
                            setActiveActionMenuId(targetId);
                          }
                        }}
                        style={{
                          background: activeActionMenuId === (c.id || c.code) ? '#F0E8DA' : 'none',
                          border: 'none',
                          padding: '0.45rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: '#1E4636'
                        }}
                        title="Actions Menu"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Fixed Action Popup Overlay */}
      {activeActionMenuId && menuPosition && (
        <div style={{
          position: 'fixed',
          top: `${menuPosition.top}px`,
          right: `${menuPosition.right}px`,
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
          border: '1px solid #E5DBC8',
          zIndex: 999999,
          minWidth: '140px',
          overflow: 'hidden',
          padding: '0.35rem 0',
          animation: 'fadeIn 0.15s ease-in-out'
        }}>
          {/* Edit Option */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const target = menuPosition.coupon;
              setActiveActionMenuId(null);
              setMenuPosition(null);
              if (target) handleOpenEditModal(target);
            }}
            style={{
              width: '100%',
              padding: '0.55rem 0.95rem',
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#1E4636',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Edit3 size={14} color="#E07A3C" />
            <span>Edit</span>
          </button>

          {/* Deactivate / Activate Option */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const target = menuPosition.coupon;
              setActiveActionMenuId(null);
              setMenuPosition(null);
              if (target) handleToggleStatus(target);
            }}
            style={{
              width: '100%',
              padding: '0.55rem 0.95rem',
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: menuPosition.coupon?.status === 'Active' ? '#D35400' : '#27AE60',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Ban size={14} color={menuPosition.coupon?.status === 'Active' ? '#D35400' : '#27AE60'} />
            <span>{menuPosition.coupon?.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
          </button>

          {/* Delete Option */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const target = menuPosition.coupon;
              setActiveActionMenuId(null);
              setMenuPosition(null);
              if (target) handleDeleteCoupon(target.id, target.code);
            }}
            style={{
              width: '100%',
              padding: '0.55rem 0.95rem',
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#C0392B',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Trash2 size={14} color="#C0392B" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* ================= CREATE COUPON CODE MODAL DIALOG ================= */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '540px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#0B1B14',
              color: '#FFFFFF',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Ticket size={22} color="#FF8A00" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                    {editingCoupon ? 'Edit Promo Coupon' : 'Create New Promo Coupon'}
                  </h3>
                  <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.76rem', color: '#E2E8F0' }}>
                    {editingCoupon ? 'Update discount rules, order eligibility & expiry date' : 'Configure discount rules, order eligibility & expiry date'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCoupon} style={{ padding: '1.5rem' }}>
              <div className="admin-form-group mb-3">
                <label className="form-label" style={{ fontWeight: 700 }}>Promo Coupon Code *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. FLAVORA25"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mb-3">
                <div className="admin-form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Discount Type *</label>
                  <select
                    className="form-control"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Percentage">Percentage (% OFF)</option>
                    <option value="Flat Amount">Flat Amount (₹ OFF)</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    {formData.type === 'Percentage' ? 'Discount Percentage (%) *' : 'Flat Amount (INR ₹) *'}
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder={formData.type === 'Percentage' ? '20' : '100'}
                    value={formData.discountVal}
                    onChange={(e) => setFormData({ ...formData, discountVal: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mb-3">
                <div className="admin-form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Min Order Value (INR ₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="400"
                    value={formData.minOrder}
                    onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Max Discount Cap (INR ₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="150"
                    value={formData.maxDisc}
                    onChange={(e) => setFormData({ ...formData, maxDisc: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mb-4">
                <div className="admin-form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Expiry Date (Optional)</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.expiry}
                    onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Initial Status</label>
                  <select
                    className="form-control"
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  >
                    <option value="active">Active (Usable)</option>
                    <option value="inactive">Inactive (Disabled)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.5rem' }}
                >
                  <Plus size={16} />
                  <span>{editingCoupon ? 'Save Changes' : 'Save Promo Coupon'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
