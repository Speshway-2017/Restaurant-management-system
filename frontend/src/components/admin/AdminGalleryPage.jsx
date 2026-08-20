import React, { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, Plus, Search, Edit3, Trash2, CheckCircle2, Filter, Sparkles, X, Eye, MoreVertical } from 'lucide-react';

export default function AdminGalleryPage({ isEmbedded = false }) {
  const initialItems = [
    { id: 1, category: 'ambience', src: '/carousel_1.png', title: 'Luxury Dining Hall', desc: 'Warm ambient lighting & royal seating setup', isFeatured: true },
    { id: 2, category: 'dishes', src: '/carousel_2.png', title: 'Gourmet Indian Feast', desc: 'Authentic curry spread with butter naan', isFeatured: true },
    { id: 3, category: 'kitchen', src: '/carousel_3.png', title: 'Kitchen Pass Station', desc: 'Chefs plating fresh tandoori appetizers', isFeatured: true },
    { id: 4, category: 'kitchen', src: '/chef_plating.png', title: 'Plating Artistry', desc: 'Precision garnishing by Executive Chef', isFeatured: false },
    { id: 5, category: 'kitchen', src: '/tandoor_oven.png', title: 'Clay Tandoori Oven', desc: 'Fresh naan pulled from 400°C clay oven', isFeatured: false },
    { id: 6, category: 'chefs', src: '/chef_1.png', title: 'Chef Vikram Roy', desc: 'Executive Culinary Director in action', isFeatured: false },
    { id: 7, category: 'chefs', src: '/chef_2.png', title: 'Chef Ananya Sharma', desc: 'Master Tandoori & Dessert Specialist', isFeatured: false },
  ];

  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('flavora_gallery');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialItems;
  });

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: 'ambience',
    src: '/carousel_1.png',
    desc: '',
    isFeatured: true
  });

  useEffect(() => {
    localStorage.setItem('flavora_gallery', JSON.stringify(items));
  }, [items]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'ambience',
      src: '/carousel_1.png',
      desc: '',
      isFeatured: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      category: item.category || 'ambience',
      src: item.src || '/carousel_1.png',
      desc: item.desc || '',
      isFeatured: item.isFeatured !== false
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.src) {
      alert('Please fill in title and photo URL.');
      return;
    }

    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? { ...i, ...formData } : i));
      showToast(`✅ Photo "${formData.title}" updated!`);
    } else {
      const newItem = {
        id: Date.now(),
        ...formData
      };
      setItems([newItem, ...items]);
      showToast(`📸 Photo "${formData.title}" added to gallery!`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteItem = (id, title) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from the gallery?`)) {
      setItems(items.filter(i => i.id !== id));
      showToast(`🗑️ Photo "${title}" deleted.`);
    }
  };

  const toggleFeatured = (id) => {
    setItems(items.map(i => i.id === id ? { ...i, isFeatured: !i.isFeatured } : i));
    showToast(`Gallery feature status updated.`);
  };

  const filteredItems = items.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase()) ||
                          i.desc.toLowerCase().includes(search.toLowerCase()) ||
                          i.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === 'all' || i.category === filterCat;
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

      {/* Header Bar (Only rendered when standalone) */}
      {!isEmbedded && (
        <div className="admin-dashboard-header">
          <div>
            <div className="page-breadcrumb-bar">
              <span>Admin</span>
              <span className="crumb-sep">›</span>
              <span className="crumb-current">Gallery Management</span>
            </div>
            <h1 className="admin-page-title">Landing Page Gallery Management</h1>
            <p className="admin-page-subtitle">Manage high-resolution restaurant photos, ambiance shots, and dish showcases.</p>
          </div>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            <span>Add Photo to Gallery</span>
          </button>
        </div>
      )}

      {/* Table & Controls Card */}
      <div className="admin-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '480px' }}>
            <Search size={16} color="#64748B" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search photo title, description, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2.5rem', background: '#FAF6EE' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Filter size={16} color="#64748B" />
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="form-control"
              style={{ padding: '0.5rem 0.95rem', width: 'auto', fontWeight: 700, background: '#FAF6EE' }}
            >
              <option value="all">All Categories</option>
              <option value="ambience">Ambience</option>
              <option value="dishes">Dishes</option>
              <option value="kitchen">Kitchen</option>
              <option value="chefs">Chefs</option>
            </select>
            {isEmbedded && (
              <button className="btn btn-primary" onClick={handleOpenAddModal}>
                <Plus size={16} />
                <span>Add Photo to Gallery</span>
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="admin-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Photo Title & Description</th>
                <th>Category</th>
                <th>Visibility Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>
                    No photos found in gallery. Click "+ Add Photo to Gallery" to add one.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <img src={item.src} alt={item.title} style={{ width: '56px', height: '42px', borderRadius: '8px', objectFit: 'cover' }} />
                    </td>
                    <td className="font-semibold" style={{ color: '#0F2A1D', maxWidth: '300px' }}>
                      <div style={{ fontWeight: 800 }}>{item.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{item.desc}</div>
                    </td>
                    <td>
                      <span className="status-badge-unified is-ready" style={{ background: '#FAF6EE', color: '#1E4636', borderColor: '#E5DBC8', textTransform: 'uppercase' }}>
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleFeatured(item.id)}
                        className={`status-badge-unified ${item.isFeatured ? 'is-ready' : 'is-cancelled'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to toggle Featured on Home Page"
                      >
                        {item.isFeatured ? '🌟 Featured' : '👁️ Visible'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-popover-wrapper">
                        <button className="action-popover-trigger-btn" title="Actions Menu">
                          <MoreVertical size={16} color="#1E4636" />
                        </button>
                        
                        <div className="action-popover-dropdown">
                          <button 
                            className="action-popover-item"
                            onClick={() => handleOpenEditModal(item)}
                          >
                            <Edit3 size={14} color="#1E4636" />
                            <span>Edit Photo</span>
                          </button>
                          <button 
                            className="action-popover-item"
                            onClick={() => toggleFeatured(item.id)}
                          >
                            <Sparkles size={14} color="#E07A3C" />
                            <span>{item.isFeatured ? 'Set as Normal' : 'Feature on Home'}</span>
                          </button>
                          <button 
                            className="action-popover-item is-delete"
                            onClick={() => handleDeleteItem(item.id, item.title)}
                          >
                            <Trash2 size={14} color="#DC2626" />
                            <span>Delete Photo</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ background: '#FFFFFF', maxWidth: '520px' }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{editingItem ? 'Edit Gallery Photo' : 'Add Photo to Gallery'}</h2>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSaveItem} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Photo Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Clay Tandoori Oven"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                    <option value="ambience">Ambience</option>
                    <option value="dishes">Dishes</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="chefs">Chefs</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Photo Image URL *</label>
                  <input
                    type="text"
                    placeholder="e.g. /tandoor_oven.png"
                    value={formData.src}
                    onChange={(e) => setFormData({ ...formData, src: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Description Caption</label>
                <textarea
                  rows="2"
                  placeholder="Short description displayed on hover..."
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.4rem', fontWeight: 800 }}>
                  <Plus size={16} />
                  <span>{editingItem ? 'SAVE CHANGES' : 'ADD TO GALLERY'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
