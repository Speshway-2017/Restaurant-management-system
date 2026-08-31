import React, { useState, useEffect, useRef } from 'react';
import { Camera, Image as ImageIcon, Plus, Search, Edit3, Trash2, CheckCircle2, Filter, Sparkles, X, Eye, MoreVertical, UploadCloud, Link2 } from 'lucide-react';
import { api } from '../../services/api';
import { useRestaurantBranding } from '../../context/RestaurantBrandingContext';

export default function AdminGalleryPage({ isEmbedded = false }) {
  const { branding, updateBranding } = useRestaurantBranding();

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
    if (branding && Array.isArray(branding.gallery) && branding.gallery.length > 0) {
      return branding.gallery;
    }
    const saved = localStorage.getItem('flavora_gallery');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialItems;
  });

  useEffect(() => {
    if (branding && Array.isArray(branding.gallery) && branding.gallery.length > 0) {
      setItems(branding.gallery);
    }
  }, [branding?.gallery]);

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [imageTab, setImageTab] = useState('upload'); // 'upload' or 'link'
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'ambience',
    src: '/carousel_1.png',
    desc: '',
    isFeatured: true
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      try {
        const res = await api.uploadImage(base64, 'gallery');
        if (res && res.url) {
          setFormData(prev => ({ ...prev, src: res.url }));
          showToast('✓ Image uploaded successfully!');
        } else {
          setFormData(prev => ({ ...prev, src: base64 }));
          showToast('✓ Image attached!');
        }
      } catch (err) {
        setFormData(prev => ({ ...prev, src: base64 }));
        showToast('✓ Image attached!');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

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

  const updateGalleryState = async (newItems) => {
    setItems(newItems);
    try {
      localStorage.setItem('flavora_gallery', JSON.stringify(newItems));
      window.dispatchEvent(new Event('flavora_gallery_updated'));
    } catch (e) {}

    // Persist directly to MongoDB database via Settings API
    try {
      await updateBranding({
        ...branding,
        gallery: newItems
      });
    } catch (err) {
      console.error('Failed to sync gallery to MongoDB:', err);
    }
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.src) {
      alert('Please fill in title and photo URL.');
      return;
    }

    if (editingItem) {
      const updated = items.map(i => String(i.id) === String(editingItem.id) ? { ...i, ...formData } : i);
      updateGalleryState(updated);
      showToast(`✅ Photo "${formData.title}" updated!`);
    } else {
      const newItem = {
        id: Date.now(),
        ...formData
      };
      const updated = [newItem, ...items];
      updateGalleryState(updated);
      showToast(`📸 Photo "${formData.title}" added to gallery!`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteItem = (id, title) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from the gallery?`)) {
      const updated = items.filter(i => String(i.id) !== String(id));
      updateGalleryState(updated);
      showToast(`🗑️ Photo "${title}" deleted.`);
    }
  };

  const toggleFeatured = (id) => {
    const updated = items.map(i => String(i.id) === String(id) ? { ...i, isFeatured: !i.isFeatured } : i);
    updateGalleryState(updated);
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
                    <td style={{ verticalAlign: 'middle' }}>
                      <img src={item.src} alt={item.title} style={{ width: '60px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #E2E8F0' }} />
                    </td>
                    <td style={{ color: '#0F2A1D', maxWidth: '320px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{item.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: '1.35', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                        {item.desc}
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <span className="status-badge-unified is-ready" style={{ background: '#FAF6EE', color: '#1E4636', borderColor: '#E5DBC8', textTransform: 'uppercase', fontWeight: 800 }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <button
                        type="button"
                        onClick={() => toggleFeatured(item.id)}
                        className={`status-badge-unified ${item.isFeatured ? 'is-ready' : 'is-cancelled'}`}
                        style={{ cursor: 'pointer', border: 'none', fontWeight: 800 }}
                        title="Click to toggle Featured on Home Page"
                      >
                        {item.isFeatured ? '🌟 Featured' : '👁️ Visible'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          style={{
                            backgroundColor: '#FFFFFF',
                            color: '#1E4636',
                            border: '1.5px solid #CBD5E1',
                            borderRadius: '8px',
                            padding: '0.4rem 0.55rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FAF6EE'; e.currentTarget.style.borderColor = '#1E4636'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                          title="Edit Photo Title, Category, or Image"
                        >
                          <Edit3 size={14} color="#1E4636" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.title)}
                          style={{
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FCA5A5',
                            borderRadius: '8px',
                            padding: '0.4rem 0.55rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                          title="Delete Photo"
                        >
                          <Trash2 size={13} color="#DC2626" />
                        </button>
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
        <div
          className="admin-modal-backdrop"
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              maxWidth: '540px',
              width: '100%',
              maxHeight: '90vh',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid #E2E8F0'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                backgroundColor: '#0F2A1D',
                color: '#FFFFFF',
                padding: '1.1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Camera size={20} color="#F2C14E" />
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {editingItem ? 'Edit Gallery Photo' : 'Add Photo to Gallery'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <form onSubmit={handleSaveItem} style={{ padding: '1.5rem', overflowY: 'auto', flexGrow: 1 }}>
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

              <div style={{ marginBottom: '1rem' }}>
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

              {/* IMAGE SELECTION WITH TABS (Identical to Menu Page System) */}
              <div style={{ marginBottom: '1.25rem', background: '#FFFBF4', padding: '1.1rem', borderRadius: '12px', border: '1px solid #E5DBC8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.88rem', margin: 0, fontWeight: 700, color: '#1E4636' }}>
                    📸 Gallery Photo Selection *
                  </label>
                  {isUploading && (
                    <span style={{ fontSize: '0.78rem', color: '#E07A3C', fontWeight: 700 }}>
                      ⏳ Uploading photo...
                    </span>
                  )}
                </div>

                {/* Tab Switcher */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem', backgroundColor: '#FFFFFF', padding: '0.3rem', borderRadius: '10px', border: '1px solid #E5DBC8' }}>
                  <button
                    type="button"
                    className={`admin-pill-btn ${imageTab === 'upload' ? 'is-active' : ''}`}
                    onClick={() => setImageTab('upload')}
                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', cursor: 'pointer', borderRadius: '8px' }}
                  >
                    <UploadCloud size={14} />
                    <span>Upload File</span>
                  </button>

                  <button
                    type="button"
                    className={`admin-pill-btn ${imageTab === 'link' ? 'is-active' : ''}`}
                    onClick={() => setImageTab('link')}
                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', cursor: 'pointer', borderRadius: '8px' }}
                  >
                    <Link2 size={14} />
                    <span>Paste Image URL</span>
                  </button>
                </div>

                {/* TAB 1: UPLOAD FILE */}
                {imageTab === 'upload' && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <div
                      className={`admin-image-upload-dropzone ${isDragging ? 'is-dragging' : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      style={{
                        background: isDragging ? '#FFF7ED' : '#FFFFFF',
                        borderColor: isDragging ? '#E07A3C' : '#CBD5E1',
                        borderStyle: 'dashed',
                        borderWidth: '2px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        padding: '1.25rem',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        transform: isDragging ? 'scale(1.01)' : 'scale(1)'
                      }}
                    >
                      {formData.src ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
                          <img
                            src={formData.src}
                            alt="Preview"
                            style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #CBD5E1' }}
                            onError={(e) => { e.target.src = '/carousel_1.png'; }}
                          />
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E4636' }}>
                              ✓ Image Attached
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                              Click or drag a new file to replace
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="admin-upload-icon-circle" style={{ backgroundColor: isDragging ? '#E07A3C' : undefined, color: isDragging ? '#FFFFFF' : undefined, margin: '0 auto 0.5rem auto' }}>
                            <UploadCloud size={24} />
                          </div>
                          <p className="admin-upload-text-title" style={{ fontSize: '0.88rem', color: isDragging ? '#E07A3C' : '#1E4636', fontWeight: 700, margin: 0 }}>
                            {isDragging ? 'Drop Photo Here to Upload!' : 'Upload Gallery Photo'}
                          </p>
                          <p className="admin-upload-text-sub" style={{ fontSize: '0.76rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                            Click to browse files or drag & drop image here (PNG, JPG, WEBP)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: PASTE URL */}
                {imageTab === 'link' && (
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: '#5C5C5C', marginBottom: '0.35rem', fontWeight: 600, display: 'block' }}>
                      Paste Image URL (Public web link or Cloudinary CDN) *
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={formData.src}
                      onChange={(e) => setFormData({ ...formData, src: e.target.value })}
                      style={{ background: '#FFFFFF', width: '100%', fontSize: '0.88rem' }}
                      required
                    />
                    <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.35rem' }}>
                      💡 Tip: Paste public image links (Unsplash, Pexels, Imgur) or switch to "Upload File" tab to upload from device.
                    </div>
                    {formData.src && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#FFFFFF', padding: '0.5rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <img
                          src={formData.src}
                          alt="URL Preview"
                          style={{ width: '60px', height: '45px', objectFit: 'cover', borderRadius: '6px' }}
                          onError={(e) => { e.target.src = '/carousel_1.png'; }}
                        />
                        <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 700 }}>
                          ✓ Image Link Active
                        </span>
                      </div>
                    )}
                  </div>
                )}
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

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
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
