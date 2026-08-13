import React, { useState, useRef, useEffect } from 'react';
import { 
  UtensilsCrossed, Plus, Search, Edit3, MoreVertical, 
  Bookmark, Star, Clock, Flame, CheckCircle2, Trash2,
  ArrowLeft, Save, Camera, Sparkles, Image as ImageIcon, UploadCloud
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminMenuPage() {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'
  const [selectedCat, setSelectedCat] = useState('All');
  const [search, setSearch] = useState('');
  const [editingDish, setEditingDish] = useState(null);
  const [activeMoreMenuId, setActiveMoreMenuId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.getMenuItems()
      .then((data) => {
        if (data && data.length > 0) {
          setMenuItems(data.map(item => ({
            id: item._id || item.id,
            name: item.name,
            category: item.category || 'Main Course',
            price: item.price,
            available: item.isAvailable !== undefined ? item.isAvailable : item.available,
            bestseller: item.isBestseller !== undefined ? item.isBestseller : item.bestseller,
            desc: item.desc || '',
            prepTime: item.prepTime || '15–20 mins',
            spice: item.spiceLevel || item.spice || 'Medium',
            img: item.img || '/hero_dish_2.png'
          })));
        }
      })
      .catch(() => {
        console.log('Using local menu items fallback');
      });
  }, []);

  const [dishFormData, setDishFormData] = useState({
    name: '',
    category: 'Main Course',
    price: '',
    prepTime: '15–20 mins',
    spice: 'Medium',
    available: true,
    bestseller: false,
    desc: '',
    img: '/hero_dish_2.png'
  });

  const [menuItems, setMenuItems] = useState([
    {
      id: 1,
      name: 'Chicken Biryani',
      category: 'Main Course',
      price: 320,
      available: true,
      bestseller: true,
      bookmarked: true,
      desc: 'Aromatic basmati rice cooked with tender chicken, spices and herbs.',
      prepTime: '25–30 mins',
      spice: 'Medium',
      img: '/hero_dish_2.png'
    },
    {
      id: 2,
      name: 'Amritsari Paneer Tikka',
      category: 'Starters',
      price: 290,
      available: true,
      bestseller: true,
      bookmarked: false,
      desc: 'Cottage cheese cubes marinated in Kashmiri chili, yogurt and tandoori spices.',
      prepTime: '15–20 mins',
      spice: 'Spicy',
      img: '/hero_dish_1.png'
    },
    {
      id: 3,
      name: 'Classic Butter Chicken',
      category: 'Main Course',
      price: 440,
      available: true,
      bestseller: false,
      bookmarked: true,
      desc: 'Charcoal grilled chicken simmered in a rich velvety tomato and cashew gravy.',
      prepTime: '20–25 mins',
      spice: 'Mild',
      img: '/carousel_3.png'
    },
    {
      id: 4,
      name: 'Hyderabadi Veg Biryani',
      category: 'Main Course',
      price: 280,
      available: false,
      bestseller: false,
      bookmarked: false,
      desc: 'Garden fresh vegetables layered with fragrant saffron basmati rice on dum.',
      prepTime: '20–25 mins',
      spice: 'Medium',
      img: '/carousel_2.png'
    },
    {
      id: 5,
      name: 'Ghee Roast Masala Dosa',
      category: 'South Indian',
      price: 180,
      available: true,
      bestseller: true,
      bookmarked: false,
      desc: 'Crispy golden crepe roasted in pure ghee filled with spiced potato masala.',
      prepTime: '10–15 mins',
      spice: 'Medium',
      img: '/carousel_1.png'
    },
    {
      id: 6,
      name: 'Dal Makhani Shahi',
      category: 'Main Course',
      price: 260,
      available: true,
      bestseller: false,
      bookmarked: false,
      desc: 'Slow-cooked black lentils simmered overnight with butter, cream and garlic.',
      prepTime: '15–20 mins',
      spice: 'Mild',
      img: '/tandoor_oven.png'
    },
    {
      id: 7,
      name: 'Saffron Gulab Jamun',
      category: 'Desserts',
      price: 160,
      available: true,
      bestseller: false,
      bookmarked: false,
      desc: 'Hot golden khoya dumplings soaked in cardamom saffron sugar syrup.',
      prepTime: '5–10 mins',
      spice: 'Sweet',
      img: '/chef_plating.png'
    },
    {
      id: 8,
      name: 'Special Mango Lassi',
      category: 'Beverages',
      price: 120,
      available: true,
      bestseller: true,
      bookmarked: false,
      desc: 'Rich churned sweet yogurt drink blended with fresh Alphonsa mango pulp.',
      prepTime: '5 mins',
      spice: 'Sweet',
      img: '/hero_dish_1.png'
    },
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleAvailability = (id) => {
    setMenuItems(menuItems.map(item => item.id === id ? { ...item, available: !item.available } : item));
    showToast('Kitchen availability updated');
  };

  const toggleBookmark = (id) => {
    setMenuItems(menuItems.map(item => item.id === id ? { ...item, bookmarked: !item.bookmarked } : item));
  };

  const toggleBestseller = (id) => {
    setMenuItems(menuItems.map(item => item.id === id ? { ...item, bestseller: !item.bestseller } : item));
    showToast('Bestseller status updated');
  };

  const handleDeleteDish = (id) => {
    if (window.confirm('Are you sure you want to delete this dish from the menu?')) {
      setMenuItems(menuItems.filter(item => item.id !== id));
      showToast('Dish deleted successfully');
    }
  };

  const handleOpenAddPage = () => {
    setEditingDish(null);
    setDishFormData({
      name: '',
      category: 'Main Course',
      price: '',
      prepTime: '15–20 mins',
      spice: 'Medium',
      available: true,
      bestseller: false,
      desc: '',
      img: '/hero_dish_2.png'
    });
    setViewMode('form');
  };

  const handleOpenEditPage = (item) => {
    setEditingDish(item);
    setDishFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      prepTime: item.prepTime,
      spice: item.spice,
      available: item.available,
      bestseller: item.bestseller,
      desc: item.desc,
      img: item.img
    });
    setViewMode('form');
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setDishFormData({ ...dishFormData, img: event.target.result });
          showToast('New dish photo uploaded successfully');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDishForm = (e) => {
    e.preventDefault();
    if (!dishFormData.name || !dishFormData.price) return;

    if (editingDish) {
      setMenuItems(menuItems.map(item => item.id === editingDish.id ? {
        ...item,
        name: dishFormData.name,
        category: dishFormData.category,
        price: Number(dishFormData.price),
        prepTime: dishFormData.prepTime || '15–20 mins',
        spice: dishFormData.spice || 'Medium',
        available: dishFormData.available,
        bestseller: dishFormData.bestseller,
        desc: dishFormData.desc || 'Special Indian dish cooked to perfection.',
        img: dishFormData.img || item.img
      } : item));
      showToast(`Updated "${dishFormData.name}" successfully!`);
    } else {
      const newDish = {
        id: Date.now(),
        name: dishFormData.name,
        category: dishFormData.category,
        price: Number(dishFormData.price),
        available: dishFormData.available,
        bestseller: dishFormData.bestseller,
        bookmarked: false,
        desc: dishFormData.desc || 'Freshly prepared delicious item with authentic Indian spices.',
        prepTime: dishFormData.prepTime || '15–20 mins',
        spice: dishFormData.spice || 'Medium',
        img: dishFormData.img || '/hero_dish_2.png'
      };
      setMenuItems([newDish, ...menuItems]);
      showToast(`Added "${dishFormData.name}" to menu!`);
    }

    setViewMode('list');
    setEditingDish(null);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCat = selectedCat === 'All' || item.category === selectedCat;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

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

      {/* VIEW MODE 1: MENU CARDS LIST PAGE */}
      {viewMode === 'list' && (
        <>
          {/* Header */}
          <div className="admin-dashboard-header">
            <div>
              <div className="page-breadcrumb-bar">
                <span>Admin</span>
                <span className="crumb-sep">›</span>
                <span className="crumb-current">Menu Management</span>
              </div>
              <h1 className="admin-page-title">Menu Management</h1>
              <p className="admin-page-subtitle">Configure categories, items, prices, and instant kitchen availability.</p>
            </div>
            <button className="btn btn-primary" onClick={handleOpenAddPage}>
              <Plus size={16} />
              <span>Add New Menu Item</span>
            </button>
          </div>

          {/* Search Bar First, Then Category Pills */}
          <div className="admin-card mb-4" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.5rem' }}>
            <div className="admin-filter-bar-flex">
              <div className="admin-header-search-box" style={{ width: '260px', flexShrink: 0 }}>
                <Search size={16} className="admin-search-icon" />
                <input
                  type="text"
                  placeholder="Search dish name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="admin-header-search-input"
                />
              </div>

              <div className="admin-pill-selector">
                {['All', 'Starters', 'Main Course', 'South Indian', 'Desserts', 'Beverages'].map((cat) => (
                  <button
                    key={cat}
                    className={`admin-pill-btn ${selectedCat === cat ? 'is-active' : ''}`}
                    onClick={() => setSelectedCat(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Cards Grid */}
          <div className="admin-menu-cards-grid">
            {filteredItems.map((item) => (
              <div key={item.id} className="admin-menu-card-v2">
                
                {/* Top Food Photo & Badges */}
                <div className="admin-menu-card-img-wrapper">
                  <img src={item.img} alt={item.name} className="admin-menu-card-img" />
                  
                  {item.bestseller && (
                    <div className="admin-menu-bestseller-badge">
                      <Star size={12} fill="#F2C14E" color="#F2C14E" />
                      <span>Bestseller</span>
                    </div>
                  )}

                  <button 
                    className="admin-menu-bookmark-btn" 
                    onClick={() => toggleBookmark(item.id)}
                    title="Bookmark Dish"
                  >
                    <Bookmark 
                      size={15} 
                      color="#1E4636" 
                      fill={item.bookmarked ? '#1E4636' : 'none'} 
                    />
                  </button>
                </div>

                {/* Card Content Body */}
                <div className="admin-menu-card-body">
                  
                  {/* Dish Name & Status Pill */}
                  <div className="admin-menu-card-title-row">
                    <h3 className="admin-menu-card-name">{item.name}</h3>
                    <button
                      className={`admin-menu-status-pill ${item.available ? 'is-active' : 'is-inactive'}`}
                      onClick={() => toggleAvailability(item.id)}
                      title="Toggle Kitchen Stock Status"
                    >
                      <span className="status-dot"></span>
                      <span>{item.available ? 'Active' : 'Inactive'}</span>
                    </button>
                  </div>

                  {/* Description */}
                  <p className="admin-menu-card-desc">{item.desc}</p>

                  {/* Meta Attributes */}
                  <div className="admin-menu-card-meta-bar">
                    <span className="meta-item">
                      <UtensilsCrossed size={13} color="#E07A3C" />
                      <span>{item.category}</span>
                    </span>
                    <span className="meta-divider">|</span>
                    <span className="meta-item">
                      <Clock size={13} color="#E07A3C" />
                      <span>{item.prepTime}</span>
                    </span>
                    <span className="meta-divider">|</span>
                    <span className="meta-item">
                      <Flame size={13} color="#E07A3C" />
                      <span>{item.spice}</span>
                    </span>
                  </div>

                  <div className="admin-menu-card-footer-divider" />

                  {/* Footer Price & Action Buttons */}
                  <div className="admin-menu-card-footer">
                    <div className="admin-menu-card-price-group">
                      <div className="admin-menu-card-price">₹{item.price}</div>
                      <div className="admin-menu-card-tax">Inclusive of all taxes</div>
                    </div>

                    <div className="admin-menu-card-actions">
                      {/* EDIT BUTTON -> OPENS EDIT PAGE */}
                      <button 
                        className="admin-menu-edit-btn" 
                        onClick={() => handleOpenEditPage(item)}
                        title="Edit Dish Information"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>

                      {/* THREE DOTS MORE OPTIONS BUTTON */}
                      <div style={{ position: 'relative' }}>
                        <button 
                          className="admin-menu-more-btn" 
                          title="More options"
                          onClick={() => setActiveMoreMenuId(activeMoreMenuId === item.id ? null : item.id)}
                        >
                          <MoreVertical size={15} />
                        </button>

                        {activeMoreMenuId === item.id && (
                          <>
                            <div 
                              style={{ position: 'fixed', inset: 0, zIndex: 99 }} 
                              onClick={() => setActiveMoreMenuId(null)} 
                            />
                            <div className="admin-card-more-dropdown">
                              <button className="dropdown-opt" onClick={() => { toggleAvailability(item.id); setActiveMoreMenuId(null); }}>
                                <CheckCircle2 size={13} color={item.available ? '#C0392B' : '#2E7D32'} />
                                <span>Mark as {item.available ? 'Inactive' : 'Active'}</span>
                              </button>

                              <button className="dropdown-opt" onClick={() => { toggleBestseller(item.id); setActiveMoreMenuId(null); }}>
                                <Star size={13} color="#F2C14E" fill={item.bestseller ? '#F2C14E' : 'none'} />
                                <span>{item.bestseller ? 'Remove Bestseller' : 'Mark Bestseller'}</span>
                              </button>

                              <div style={{ height: '1px', background: '#F0E8DA', margin: '0.2rem 0' }} />

                              <button className="dropdown-opt is-delete" onClick={() => { handleDeleteDish(item.id); setActiveMoreMenuId(null); }}>
                                <Trash2 size={13} color="#C0392B" />
                                <span>Delete Dish</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        </>
      )}

      {/* VIEW MODE 2: DEDICATED ADD / EDIT DISH PAGE */}
      {viewMode === 'form' && (
        <div>
          {/* Header Bar */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="page-breadcrumb-bar" style={{ marginBottom: '0.5rem' }}>
              <span className="crumb-link" onClick={() => setViewMode('list')}>Admin</span>
              <span className="crumb-sep">›</span>
              <span className="crumb-link" onClick={() => setViewMode('list')}>Menu Management</span>
              <span className="crumb-sep">›</span>
              <span className="crumb-current">
                {editingDish ? `Edit ${editingDish.name}` : 'Add New Item'}
              </span>
            </div>

            <div>
              <h1 className="admin-page-title" style={{ margin: 0, fontSize: '1.65rem' }}>
                {editingDish ? `Edit Dish: ${editingDish.name}` : 'Add New Menu Item'}
              </h1>
              <p className="admin-page-subtitle" style={{ margin: '0.2rem 0 0 0' }}>
                Configure dish details, category, pricing, photo, and kitchen preparation settings.
              </p>
            </div>
          </div>

          {/* Form Content Grid */}
          <form onSubmit={handleSaveDishForm}>
            <div className="admin-grid-12" style={{ gap: '1.5rem' }}>
              
              {/* Left Column: Dish Information Form Fields & Upload Photo */}
              <div className="admin-card col-span-7" style={{ padding: '1.75rem' }}>
                <div className="admin-card-header mb-4" style={{ borderBottom: '1px solid #F0E8DA', paddingBottom: '0.75rem' }}>
                  <h2 className="admin-card-title" style={{ fontSize: '1.2rem', margin: 0 }}>
                    Dish Information & Pricing
                  </h2>
                </div>

                <div className="admin-form-group mb-3">
                  <label className="form-label">Dish Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Special Chicken Dum Biryani"
                    value={dishFormData.name}
                    onChange={(e) => setDishFormData({ ...dishFormData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="mb-3">
                  <div className="admin-form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-control"
                      value={dishFormData.category}
                      onChange={(e) => setDishFormData({ ...dishFormData, category: e.target.value })}
                    >
                      <option value="Starters">Starters</option>
                      <option value="Main Course">Main Course</option>
                      <option value="South Indian">South Indian</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Beverages">Beverages</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="form-label">Price (INR ₹) *</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="320"
                      value={dishFormData.price}
                      onChange={(e) => setDishFormData({ ...dishFormData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="mb-3">
                  <div className="admin-form-group">
                    <label className="form-label">Preparation Time</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 20–25 mins"
                      value={dishFormData.prepTime}
                      onChange={(e) => setDishFormData({ ...dishFormData, prepTime: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="form-label">Spice Level</label>
                    <select
                      className="form-control"
                      value={dishFormData.spice}
                      onChange={(e) => setDishFormData({ ...dishFormData, spice: e.target.value })}
                    >
                      <option value="Mild">Mild</option>
                      <option value="Medium">Medium</option>
                      <option value="Spicy">Spicy</option>
                      <option value="Sweet">Sweet</option>
                    </select>
                  </div>
                </div>

                <div className="admin-form-group mb-4">
                  <label className="form-label">Dish Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Aromatic basmati rice cooked with tender chicken, Kashmiri spices and herbs..."
                    value={dishFormData.desc}
                    onChange={(e) => setDishFormData({ ...dishFormData, desc: e.target.value })}
                  />
                </div>

                {/* Upload Photo Section inside Left Column */}
                <div className="admin-form-group mb-4" style={{ background: '#FFFBF4', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E5DBC8' }}>
                  <label className="form-label" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    📸 Upload Photo of a Dish
                  </label>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    style={{ display: 'none' }}
                  />

                  {/* Dropzone Box */}
                  <div 
                    className="admin-image-upload-dropzone mb-3"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ background: '#FFFFFF' }}
                  >
                    <div className="admin-upload-icon-circle">
                      <UploadCloud size={22} />
                    </div>
                    <div>
                      <p className="admin-upload-text-title">Upload High-Res Food Photo</p>
                      <p className="admin-upload-text-sub">Click to browse files or drag & drop (PNG, JPG, WEBP)</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label" style={{ fontSize: '0.76rem', color: '#5C5C5C', marginBottom: '0.25rem' }}>
                        Or choose from preset food gallery:
                      </label>
                      <select
                        className="form-control"
                        value={dishFormData.img}
                        onChange={(e) => setDishFormData({ ...dishFormData, img: e.target.value })}
                      >
                        <option value="/hero_dish_2.png">Biryani Platter Photo</option>
                        <option value="/hero_dish_1.png">Tikka Starter Photo</option>
                        <option value="/carousel_3.png">Butter Chicken Curry Photo</option>
                        <option value="/carousel_2.png">Veg Biryani Photo</option>
                        <option value="/carousel_1.png">Masala Dosa Photo</option>
                        <option value="/tandoor_oven.png">Tandoori Naan Photo</option>
                        <option value="/chef_plating.png">Dessert Plating Photo</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
                    <Save size={16} />
                    <span>{editingDish ? 'Save Changes' : 'Create Dish Item'}</span>
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setViewMode('list')}>
                    Cancel
                  </button>
                </div>
              </div>

              {/* Right Column: Live Menu Card Preview & Settings */}
              <div className="admin-card col-span-5" style={{ padding: '1.75rem' }}>
                <div className="admin-card-header mb-4" style={{ borderBottom: '1px solid #F0E8DA', paddingBottom: '0.75rem' }}>
                  <h2 className="admin-card-title" style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={18} color="#E07A3C" />
                    <span>Live Menu Card Preview</span>
                  </h2>
                  <p style={{ fontSize: '0.76rem', color: '#5C5C5C', margin: '0.2rem 0 0 0' }}>
                    Real-time preview of how this dish will appear on your restaurant menu grid.
                  </p>
                </div>

                {/* Real-time Card Preview */}
                <div className="mb-4">
                  <div className="admin-menu-card-v2" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)', borderRadius: '14px' }}>
                    
                    {/* Image Banner */}
                    <div className="admin-menu-card-img-wrapper">
                      <img 
                        src={dishFormData.img || '/hero_dish_2.png'} 
                        alt={dishFormData.name || 'Dish Preview'} 
                        className="admin-menu-card-img" 
                      />
                      
                      {dishFormData.bestseller && (
                        <div className="admin-menu-bestseller-badge">
                          <Star size={12} fill="#F2C14E" color="#F2C14E" />
                          <span>Bestseller</span>
                        </div>
                      )}

                      <div className="admin-menu-bookmark-btn" style={{ cursor: 'default' }}>
                        <Bookmark size={15} color="#1E4636" fill="none" />
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="admin-menu-card-body">
                      <div className="admin-menu-card-title-row">
                        <h3 className="admin-menu-card-name">
                          {dishFormData.name || 'Dish Name'}
                        </h3>
                        <div className={`admin-menu-status-pill ${dishFormData.available ? 'is-active' : 'is-inactive'}`}>
                          <span className="status-dot"></span>
                          <span>{dishFormData.available ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>

                      <p className="admin-menu-card-desc">
                        {dishFormData.desc || 'Dish description will appear here on the card.'}
                      </p>

                      <div className="admin-menu-card-meta-bar">
                        <span className="meta-item">
                          <UtensilsCrossed size={13} color="#E07A3C" />
                          <span>{dishFormData.category || 'Main Course'}</span>
                        </span>
                        <span className="meta-divider">|</span>
                        <span className="meta-item">
                          <Clock size={13} color="#E07A3C" />
                          <span>{dishFormData.prepTime || '15–20 mins'}</span>
                        </span>
                        <span className="meta-divider">|</span>
                        <span className="meta-item">
                          <Flame size={13} color="#E07A3C" />
                          <span>{dishFormData.spice || 'Medium'}</span>
                        </span>
                      </div>

                      <div className="admin-menu-card-footer-divider" />

                      <div className="admin-menu-card-footer">
                        <div className="admin-menu-card-price-group">
                          <div className="admin-menu-card-price">₹{dishFormData.price || 0}</div>
                          <div className="admin-menu-card-tax">Inclusive of all taxes</div>
                        </div>

                        <div className="admin-menu-card-actions">
                          <div className="admin-menu-edit-btn" style={{ cursor: 'default', opacity: 0.85 }}>
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </div>
                          <div className="admin-menu-more-btn" style={{ cursor: 'default', opacity: 0.85 }}>
                            <MoreVertical size={15} />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Quick Toggle Controls */}
                <div style={{ background: '#FAF6EE', padding: '1.1rem', borderRadius: '12px', border: '1px solid #E5DBC8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1E4636' }}>Kitchen Stock Status</div>
                      <div style={{ fontSize: '0.75rem', color: '#5C5C5C' }}>Instant availability in POS & customer app</div>
                    </div>
                    <button
                      type="button"
                      className={`admin-menu-status-pill ${dishFormData.available ? 'is-active' : 'is-inactive'}`}
                      onClick={() => setDishFormData({ ...dishFormData, available: !dishFormData.available })}
                    >
                      <span className="status-dot"></span>
                      <span>{dishFormData.available ? 'Active' : 'Inactive'}</span>
                    </button>
                  </div>

                  <div style={{ height: '1px', background: '#E5DBC8', margin: '0.85rem 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1E4636' }}>Highlight Bestseller</div>
                      <div style={{ fontSize: '0.75rem', color: '#5C5C5C' }}>Displays bestseller star badge</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={dishFormData.bestseller}
                      onChange={(e) => setDishFormData({ ...dishFormData, bestseller: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#1E4636', cursor: 'pointer' }}
                    />
                  </div>
                </div>

              </div>

            </div>
          </form>
        </div>
      )}

    </div>
  );
}
