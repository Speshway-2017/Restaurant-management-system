import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit3, Trash2, CheckCircle2, Eye, Calendar, User, Clock, Filter, Sparkles, X, Globe, Lock, MoreVertical } from 'lucide-react';

export default function AdminBlogsPage({ isEmbedded = false }) {
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
    const saved = localStorage.getItem('flavora_blogs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialBlogs;
  });

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

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

  useEffect(() => {
    localStorage.setItem('flavora_blogs', JSON.stringify(blogs));
  }, [blogs]);

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
      setBlogs(blogs.map(b => b.id === editingBlog.id ? {
        ...b,
        ...formData
      } : b));
      showToast(`✅ Article "${formData.title}" updated successfully!`);
    } else {
      const newBlog = {
        id: Date.now(),
        ...formData,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })
      };
      setBlogs([newBlog, ...blogs]);
      showToast(`🎉 New article "${formData.title}" published!`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteBlog = (id, title) => {
    if (window.confirm(`Are you sure you want to delete blog article "${title}"?`)) {
      setBlogs(blogs.filter(b => b.id !== id));
      showToast(`🗑️ Blog article "${title}" deleted.`);
    }
  };

  const toggleStatus = (id) => {
    setBlogs(blogs.map(b => b.id === id ? {
      ...b,
      status: b.status === 'Published' ? 'Draft' : 'Published'
    } : b));
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
        <div className="admin-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ background: '#FFFFFF', maxWidth: '580px' }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{editingBlog ? 'Edit Blog Article' : 'Publish New Article'}</h2>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSaveBlog} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Article Title *</label>
                <input
                  type="text"
                  placeholder="e.g. The Secret of Traditional Dum Biryani"
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
                    <option value="HERITAGE">HERITAGE</option>
                    <option value="SOURCING">SOURCING</option>
                    <option value="OPERATIONS">OPERATIONS</option>
                    <option value="RECIPES">RECIPES</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Author *</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Read Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 5 min read"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Cover Image URL</label>
                  <input
                    type="text"
                    placeholder="e.g. /carousel_1.png"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Excerpt Summary *</label>
                <textarea
                  rows="2"
                  placeholder="Short summary displayed on blog cards..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Full Article Content</label>
                <textarea
                  rows="4"
                  placeholder="Detailed article body text..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.4rem', fontWeight: 800 }}>
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
