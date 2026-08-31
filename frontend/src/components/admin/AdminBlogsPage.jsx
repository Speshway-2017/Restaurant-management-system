import React, { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Search, Edit3, Trash2, CheckCircle2, Eye, Calendar, User, Clock, Filter, Sparkles, X, Globe, Lock, MoreVertical, UploadCloud, Link2 } from 'lucide-react';
import { api } from '../../services/api';
import { useRestaurantBranding } from '../../context/RestaurantBrandingContext';

export default function AdminBlogsPage({ isEmbedded = false }) {
  const { branding, updateBranding } = useRestaurantBranding();

  const initialBlogs = [
    {
      id: 1,
      title: 'The Secret of Traditional Dum Biryani',
      category: 'HERITAGE',
      categoryClass: 'badge-overlay-orange',
      author: 'Chef Ananya',
      date: 'October 12, 2024',
      readTime: '7 min read',
      image: '/carousel_1.png',
      status: 'Published',
      excerpt: "Mastering the 'dum' technique is more than just cooking; it's a slow-cooked philosophy of patience.",
      content: `Dum Pukht translates literally to 'slow oven cooking'. Originating from the royal Mughal and Awadhi kitchens, this technique involves sealing food in a heavy brass or clay handi with a dough paste seal.`
    },
    {
      id: 2,
      title: 'Sourcing Seasonal Ingredients in India',
      category: 'SOURCING',
      categoryClass: 'badge-overlay-green',
      author: 'Chef Vikram',
      date: 'October 05, 2024',
      readTime: '5 min read',
      image: '/tandoor_oven.png',
      status: 'Published',
      excerpt: 'Navigating local markets to find the best seasonal produce for your restaurant menu, ensuring farm-fresh quality.',
      content: `Seasonal sourcing in India requires deep relationships with regional mandis (wholesale markets). From monsoon mustard greens to winter Guntur chilies.`
    },
    {
      id: 3,
      title: 'Designing High-Yield Kitchen Workflows',
      category: 'OPERATIONS',
      categoryClass: 'badge-overlay-green',
      author: 'Saikiran G',
      date: 'September 28, 2024',
      readTime: '6 min read',
      image: '/chef_plating.png',
      status: 'Published',
      excerpt: 'How digital station order routing minimizes kitchen ticket times and cuts order waste by 35%.',
      content: `Kitchen ticket bottlenecks directly reduce customer satisfaction. Implementing real-time digital station monitors ensures kitchen staff receive synchronized prep orders.`
    }
  ];

  const [blogs, setBlogs] = useState(() => {
    if (branding && Array.isArray(branding.blogs) && branding.blogs.length > 0) {
      return branding.blogs;
    }
    const saved = localStorage.getItem('flavora_blogs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialBlogs;
  });

  useEffect(() => {
    if (branding && Array.isArray(branding.blogs) && branding.blogs.length > 0) {
      setBlogs(branding.blogs);
    }
  }, [branding?.blogs]);

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [imageTab, setImageTab] = useState('upload'); // 'upload' or 'link'
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'HERITAGE',
    author: 'Chef Srikanth',
    readTime: '5 min read',
    image: '/carousel_1.png',
    status: 'Published',
    excerpt: '',
    content: ''
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
        const res = await api.uploadImage(base64, 'blogs');
        if (res && res.url) {
          setFormData(prev => ({ ...prev, image: res.url }));
          showToast('✓ Image uploaded successfully!');
        } else {
          setFormData(prev => ({ ...prev, image: base64 }));
          showToast('✓ Image attached!');
        }
      } catch (err) {
        setFormData(prev => ({ ...prev, image: base64 }));
        showToast('✓ Image attached!');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateBlogState = async (newBlogs) => {
    setBlogs(newBlogs);
    try {
      localStorage.setItem('flavora_blogs', JSON.stringify(newBlogs));
      window.dispatchEvent(new Event('flavora_blogs_updated'));
    } catch (e) {}

    // Persist directly to MongoDB database via Settings API
    try {
      await updateBranding({
        ...branding,
        blogs: newBlogs
      });
    } catch (err) {
      console.error('Failed to sync blogs to MongoDB:', err);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      category: 'HERITAGE',
      author: 'Chef Srikanth',
      readTime: '5 min read',
      image: '/carousel_1.png',
      status: 'Published',
      excerpt: '',
      content: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || '',
      category: blog.category || 'HERITAGE',
      author: blog.author || 'Chef Srikanth',
      readTime: blog.readTime || '5 min read',
      image: blog.image || '/carousel_1.png',
      status: blog.status || 'Published',
      excerpt: blog.excerpt || '',
      content: blog.content || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveBlog = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.excerpt) {
      alert('Please fill in blog title and excerpt.');
      return;
    }

    if (editingBlog) {
      const updated = blogs.map(b => String(b.id) === String(editingBlog.id) ? {
        ...b,
        ...formData
      } : b);
      updateBlogState(updated);
      showToast(`✅ Article "${formData.title}" updated successfully!`);
    } else {
      const newBlog = {
        id: Date.now(),
        ...formData,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })
      };
      const updated = [newBlog, ...blogs];
      updateBlogState(updated);
      showToast(`🎉 New article "${formData.title}" published!`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteBlog = (id, title) => {
    if (window.confirm(`Are you sure you want to delete blog article "${title}"?`)) {
      const updated = blogs.filter(b => String(b.id) !== String(id));
      updateBlogState(updated);
      showToast(`🗑️ Blog article "${title}" deleted.`);
    }
  };

  const toggleStatus = (id) => {
    const updated = blogs.map(b => String(b.id) === String(id) ? {
      ...b,
      status: b.status === 'Published' ? 'Draft' : 'Published'
    } : b);
    updateBlogState(updated);
    showToast(`Status updated.`);
  };

  const filteredBlogs = blogs.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
                          b.author.toLowerCase().includes(search.toLowerCase()) ||
                          b.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === 'All' || b.category === filterCat;
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
              <span className="crumb-current">Blog Management</span>
            </div>
            <h1 className="admin-page-title">Landing Page Blog Management</h1>
            <p className="admin-page-subtitle">Publish culinary stories, heritage guides, and operational insights for visitors.</p>
          </div>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            <span>Add New Article</span>
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
              placeholder="Search by article title, author, or category..."
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
              <option value="All">All Categories</option>
              <option value="HERITAGE">HERITAGE</option>
              <option value="SOURCING">SOURCING</option>
              <option value="OPERATIONS">OPERATIONS</option>
              <option value="RECIPES">RECIPES</option>
            </select>
            {isEmbedded && (
              <button className="btn btn-primary" onClick={handleOpenAddModal}>
                <Plus size={16} />
                <span>Add New Article</span>
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="admin-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Cover</th>
                <th>Article Title</th>
                <th>Category</th>
                <th>Author</th>
                <th>Date & Read Time</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlogs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>
                    No blog articles found. Click "+ Add New Article" to create one.
                  </td>
                </tr>
              ) : (
                filteredBlogs.map((blog) => (
                  <tr key={blog.id}>
                    <td>
                      <img src={blog.image} alt={blog.title} style={{ width: '48px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                    </td>
                    <td className="font-semibold" style={{ color: '#0F2A1D', maxWidth: '280px' }}>
                      <div style={{ fontWeight: 800 }}>{blog.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '260px' }}>{blog.excerpt}</div>
                    </td>
                    <td>
                      <span className="status-badge-unified is-ready" style={{ background: '#FAF6EE', color: '#1E4636', borderColor: '#E5DBC8' }}>
                        {blog.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#1E4636' }}>{blog.author}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                      <div>{blog.date}</div>
                      <div style={{ fontSize: '0.72rem' }}>{blog.readTime}</div>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleStatus(blog.id)}
                        className={`status-badge-unified ${blog.status === 'Published' ? 'is-ready' : 'is-cancelled'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to toggle Draft / Published"
                      >
                        {blog.status === 'Published' ? '🌐 Published' : '🔒 Draft'}
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
                            onClick={() => handleOpenEditModal(blog)}
                          >
                            <Edit3 size={14} color="#1E4636" />
                            <span>Edit Article</span>
                          </button>
                          <button 
                            className="action-popover-item"
                            onClick={() => toggleStatus(blog.id)}
                          >
                            <Globe size={14} color="#E07A3C" />
                            <span>{blog.status === 'Published' ? 'Mark as Draft' : 'Publish Article'}</span>
                          </button>
                          <button 
                            className="action-popover-item is-delete"
                            onClick={() => handleDeleteBlog(blog.id, blog.title)}
                          >
                            <Trash2 size={14} color="#DC2626" />
                            <span>Delete Article</span>
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
              maxWidth: '620px',
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
                <FileText size={20} color="#F2C14E" />
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {editingBlog ? 'Edit Blog Article' : 'Publish New Article'}
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

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveBlog} style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem', display: 'block' }}>Article Title *</label>
                <input
                  type="text"
                  placeholder="e.g. The Secret of Traditional Dum Biryani"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', borderRadius: '10px', padding: '0.65rem 0.85rem' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem', display: 'block' }}>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-control"
                    style={{ width: '100%', borderRadius: '10px', padding: '0.65rem 0.85rem' }}
                  >
                    <option value="HERITAGE">HERITAGE</option>
                    <option value="SOURCING">SOURCING</option>
                    <option value="OPERATIONS">OPERATIONS</option>
                    <option value="RECIPES">RECIPES</option>
                    <option value="TECHNIQUE">TECHNIQUE</option>
                    <option value="BUSINESS">BUSINESS</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem', display: 'block' }}>Author *</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="form-control"
                    style={{ width: '100%', borderRadius: '10px', padding: '0.65rem 0.85rem' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem', display: 'block' }}>Read Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 5 min read"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    className="form-control"
                    style={{ width: '100%', borderRadius: '10px', padding: '0.65rem 0.85rem' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem', display: 'block' }}>Publishing Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-control"
                    style={{ width: '100%', borderRadius: '10px', padding: '0.65rem 0.85rem' }}
                  >
                    <option value="Published">🌟 Published (Visible to Public)</option>
                    <option value="Draft">🔒 Draft (Admin Only)</option>
                  </select>
                </div>
              </div>

              {/* Cover Image Upload Dual Tab */}
              <div>
                <label className="form-label" style={{ fontWeight: 800, color: '#0F2A1D', marginBottom: '0.4rem', display: 'block' }}>Cover Image</label>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setImageTab('upload')}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.85rem',
                      borderRadius: '8px',
                      border: '1.5px solid',
                      borderColor: imageTab === 'upload' ? '#0F2A1D' : '#CBD5E1',
                      backgroundColor: imageTab === 'upload' ? '#0F2A1D' : '#FFFFFF',
                      color: imageTab === 'upload' ? '#FFFFFF' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <UploadCloud size={15} />
                    <span>Upload File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageTab('link')}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.85rem',
                      borderRadius: '8px',
                      border: '1.5px solid',
                      borderColor: imageTab === 'link' ? '#0F2A1D' : '#CBD5E1',
                      backgroundColor: imageTab === 'link' ? '#0F2A1D' : '#FFFFFF',
                      color: imageTab === 'link' ? '#FFFFFF' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Link2 size={15} />
                    <span>Paste Image URL</span>
                  </button>
                </div>

                {imageTab === 'upload' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                    <div
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleFileUpload(e.dataTransfer.files[0]);
                        }
                      }}
                      style={{
                        border: '2px dashed',
                        borderColor: isDragging ? '#0F2A1D' : '#CBD5E1',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        textAlign: 'center',
                        backgroundColor: isDragging ? '#F0FDF4' : '#FAF6EE',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <UploadCloud size={30} color="#0F2A1D" style={{ margin: '0 auto 0.4rem auto' }} />
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#0F2A1D' }}>
                        {isUploading ? 'Uploading Image...' : 'Click to Browse or Drag & Drop Cover Photo'}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Supports PNG, JPG, WEBP</span>
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/photo-... or /carousel_1.png"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="form-control"
                    style={{ width: '100%', borderRadius: '10px', padding: '0.65rem 0.85rem' }}
                  />
                )}

                {/* Cover Image Preview Thumbnail */}
                {formData.image && (
                  <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#F8FAFC', padding: '0.5rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <img src={formData.image} alt="Preview" style={{ width: '56px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                    <div style={{ fontSize: '0.78rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      <strong>Preview:</strong> {formData.image.slice(0, 45)}...
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem', display: 'block' }}>Excerpt Summary *</label>
                <textarea
                  rows="2"
                  placeholder="Short summary displayed on blog cards..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', borderRadius: '10px', padding: '0.65rem 0.85rem' }}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem', display: 'block' }}>Full Article Content</label>
                <textarea
                  rows="5"
                  placeholder="Detailed article body text..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="form-control"
                  style={{ width: '100%', borderRadius: '10px', padding: '0.65rem 0.85rem' }}
                />
              </div>

              {/* Modal Footer Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #E2E8F0', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '10px',
                    padding: '0.65rem 1.25rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#0F2A1D',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.65rem 1.5rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(15, 42, 29, 0.25)'
                  }}
                >
                  <Plus size={16} />
                  <span>{editingBlog ? 'SAVE CHANGES' : 'PUBLISH ARTICLE'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
