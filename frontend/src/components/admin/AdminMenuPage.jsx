import React, { useState, useRef, useEffect } from 'react';
import { 
  UtensilsCrossed, Plus, Search, Edit3, MoreVertical, ChevronDown,
  Bookmark, Star, Clock, Flame, CheckCircle2, Trash2,
  ArrowLeft, Save, Camera, Sparkles, Image as ImageIcon, UploadCloud, Link2
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminMenuPage() {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'
  const [selectedCat, setSelectedCat] = useState('All');
  const [search, setSearch] = useState('');
  const [editingDish, setEditingDish] = useState(null);
  const [activeMoreMenuId, setActiveMoreMenuId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [imageTab, setImageTab] = useState('upload'); // 'upload', 'link', or 'preset'
  const fileInputRef = useRef(null);

  const fetchMenu = () => {
    api.getMenuItems()
      .then((data) => {
        if (data && data.length > 0) {
          setMenuItems(data.map(item => ({
            id: item._id || item.id,
            name: item.name,
            category: item.category || 'Main Course',
            price: item.price,
            isVeg: item.isVeg !== undefined ? item.isVeg : true,
            available: item.isAvailable !== undefined ? item.isAvailable : item.available,
            bestseller: item.isBestseller !== undefined ? item.isBestseller : item.bestseller,
            bookmarked: item.bookmarked || false,
            desc: item.desc || '',
            prepTime: item.prepTime || '15–20 mins',
            spice: item.spiceLevel || item.spice || 'Medium',
            img: item.img || '/hero_dish_2.png'
          })));
        }
      })
      .catch((err) => {
        console.log('Using local menu items fallback:', err.message);
      });
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const [dishFormData, setDishFormData] = useState({
    name: '',
    category: 'Main Course',
    price: '',
    isVeg: true,
    prepTime: '15–20 mins',
    spice: 'Medium',
    available: true,
    bestseller: false,
    desc: '',
    img: ''
  });

  const [menuItems, setMenuItems] = useState([
    {
      id: 1,
      name: 'Chicken Biryani',
      category: 'Main Course',
      price: 320,
      isVeg: false,
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
      isVeg: true,
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
      isVeg: false,
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
      isVeg: true,
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
      isVeg: true,
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
      isVeg: true,
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
      isVeg: true,
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
      isVeg: true,
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
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    const newStatus = !item.available;
    const updated = menuItems.map(i => i.id === id ? { ...i, available: newStatus, isAvailable: newStatus } : i);
    setMenuItems(updated);
    try {
      localStorage.setItem('flavora_dishes', JSON.stringify(updated));
      window.dispatchEvent(new Event('flavora_dishes_updated'));
    } catch (e) {}
    showToast(newStatus ? 'Dish marked as active' : 'Dish marked as inactive');

    api.updateMenuItem(id, { isAvailable: newStatus }).catch(() => {});
  };

  const toggleBookmark = (id) => {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    const newStatus = !item.bookmarked;
    setMenuItems(menuItems.map(i => i.id === id ? { ...i, bookmarked: newStatus } : i));
    
    api.updateMenuItem(id, { bookmarked: newStatus }).catch(() => {});
  };

  const toggleBestseller = (id) => {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    const newStatus = !item.bestseller;
    const updated = menuItems.map(i => i.id === id ? { ...i, bestseller: newStatus, isBestseller: newStatus } : i);
    setMenuItems(updated);
    try {
      localStorage.setItem('flavora_dishes', JSON.stringify(updated));
      window.dispatchEvent(new Event('flavora_dishes_updated'));
    } catch (e) {}
    showToast('Bestseller status updated');

    api.updateMenuItem(id, { isBestseller: newStatus }).catch(() => {});
  };

  const handleDeleteDish = (id) => {
    if (window.confirm('Are you sure you want to delete this dish from the menu?')) {
      const updated = menuItems.filter(item => item.id !== id);
      setMenuItems(updated);
      try {
        localStorage.setItem('flavora_dishes', JSON.stringify(updated));
        window.dispatchEvent(new Event('flavora_dishes_updated'));
      } catch (e) {}
      showToast('Dish deleted successfully');

      api.deleteMenuItem(id).catch(() => {});
    }
  };

  const handleOpenAddPage = () => {
    setEditingDish(null);
    setDishFormData({
      name: '',
      category: 'Main Course',
      price: '',
      isVeg: true,
      prepTime: '15–20 mins',
      spice: 'Medium',
      available: true,
      bestseller: false,
      desc: '',
      img: ''
    });
    setViewMode('form');
  };

  const handleOpenEditPage = (item) => {
    setEditingDish(item);
    setDishFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      isVeg: item.isVeg !== undefined ? item.isVeg : true,
      prepTime: item.prepTime,
      spice: item.spice,
      available: item.available,
      bestseller: item.bestseller,
      desc: item.desc,
      img: item.img
    });
    if (item.img && (item.img.startsWith('http://') || item.img.startsWith('https://'))) {
      setImageTab('link');
    } else {
      setImageTab('upload');
    }
    setViewMode('form');
  };

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const localDataUrl = event.target.result;
          setDishFormData(prev => ({ ...prev, img: localDataUrl }));
          setIsUploadingImage(true);
          showToast('Uploading photo to Cloudinary...');

          try {
            const res = await api.uploadImage(localDataUrl, 'dishes');
            if (res && res.url) {
              setDishFormData(prev => ({ ...prev, img: res.url }));
              showToast('Photo uploaded to Cloudinary CDN!');
            }
          } catch (err) {
            console.warn('Cloudinary upload fallback to Data URL:', err.message);
          } finally {
            setIsUploadingImage(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLinkAutoUpload = async (url) => {
    if (!url || !url.trim()) return;
    const cleanUrl = url.trim();
    if (cleanUrl.includes('res.cloudinary.com') || cleanUrl.startsWith('/')) return;
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      try {
        setIsUploadingImage(true);
        showToast('Directly storing image link in Cloudinary...');
        const res = await api.uploadImage(cleanUrl, 'dishes');
        if (res && res.url) {
          setDishFormData(prev => ({ ...prev, img: res.url }));
          showToast('Image link stored on Cloudinary CDN!');
        }
      } catch (err) {
        console.warn('Auto Cloudinary upload from link failed:', err.message);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleSaveDishForm = async (e) => {
    e.preventDefault();
    if (!dishFormData.name || !dishFormData.price) return;

    let finalImg = dishFormData.img || '/hero_dish_2.png';

    // Only upload if the image is still a raw data URL and NOT already uploaded to Cloudinary
    if (finalImg && finalImg.startsWith('data:image/') && !finalImg.includes('res.cloudinary.com')) {
      try {
        setIsUploadingImage(true);
        showToast('Storing photo on Cloudinary...');
        const cloudRes = await api.uploadImage(finalImg, 'dishes');
        if (cloudRes && cloudRes.url) {
          finalImg = cloudRes.url;
          setDishFormData(prev => ({ ...prev, img: cloudRes.url }));
          showToast('Photo stored on Cloudinary CDN!');
        }
      } catch (err) {
        console.warn('Cloudinary upload on save fallback:', err.message);
      } finally {
        setIsUploadingImage(false);
      }
    }

    const payload = {
      name: dishFormData.name,
      category: dishFormData.category,
      price: Number(dishFormData.price),
      isVeg: dishFormData.isVeg,
      spiceLevel: dishFormData.spice || 'Medium',
      prepTime: dishFormData.prepTime || '15–20 mins',
      desc: dishFormData.desc || 'Special dish prepared with fresh ingredients.',
      img: finalImg,
      isBestseller: dishFormData.bestseller,
      isAvailable: dishFormData.available,
      bookmarked: false
    };

    let updatedList;
    if (editingDish) {
      updatedList = menuItems.map(item => item.id === editingDish.id ? {
        ...item,
        name: dishFormData.name,
        category: dishFormData.category,
        price: Number(dishFormData.price),
        isVeg: dishFormData.isVeg,
        prepTime: dishFormData.prepTime || '15–20 mins',
        spice: dishFormData.spice || 'Medium',
        available: dishFormData.available,
        isAvailable: dishFormData.available,
        bestseller: dishFormData.bestseller,
        isBestseller: dishFormData.bestseller,
        desc: dishFormData.desc || 'Special dish prepared with fresh ingredients.',
        img: dishFormData.img || item.img
      } : item);
      setMenuItems(updatedList);
      showToast(`Updated "${dishFormData.name}" successfully!`);

      try {
        await api.updateMenuItem(editingDish.id, payload);
        fetchMenu();
      } catch (err) {
        console.warn('API update menu item failed:', err.message);
      }
    } else {
      const newDish = {
        id: Date.now(),
        ...payload,
        available: payload.isAvailable,
        isAvailable: payload.isAvailable,
        bestseller: payload.isBestseller,
        isBestseller: payload.isBestseller,
        spice: payload.spiceLevel
      };
      updatedList = [newDish, ...menuItems];
      setMenuItems(updatedList);
      showToast(`Added "${dishFormData.name}" to menu!`);

      try {
        await api.createMenuItem(payload);
        fetchMenu();
      } catch (err) {
        console.warn('API create menu item failed:', err.message);
      }
    }

    try {
      localStorage.setItem('flavora_dishes', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('flavora_dishes_updated'));
    } catch (e) {}

    setViewMode('list');
    setEditingDish(null);
  };

  const filteredItems = menuItems.filter(item => {
    const itemCat = (item.category || '').toLowerCase();
    const matchesCat = selectedCat === 'All' || 
                       item.category === selectedCat || 
                       (selectedCat === 'Main Course' && (item.category === 'Biryani' || item.category === 'Curries' || itemCat.includes('biryani') || itemCat.includes('curry')));
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const categoryOrder = ['Starters', 'Main Course', 'Curries', 'Biryani', 'Breads', 'South Indian', 'Desserts', 'Beverages'];
  const presentCats = Array.from(new Set(filteredItems.map(i => i.category)));
  const sortedCategories = [
    ...categoryOrder.filter(cat => presentCats.includes(cat)),
    ...presentCats.filter(cat => !categoryOrder.includes(cat))
  ];

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

          {/* Search Bar First, Then Category Dropdown */}
          <div className="admin-card mb-4" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.5rem' }}>
            <div className="admin-filter-bar-flex" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="admin-header-search-box" style={{ width: '280px', flexShrink: 0 }}>
                <Search size={16} className="admin-search-icon" />
                <input
                  type="text"
                  placeholder="Search dish name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="admin-header-search-input"
                />
              </div>

              {/* Dish Specializations Dropdown (Defaulting to All Dishes) */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <select
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  style={{
                    height: '42px',
                    padding: '0 2.5rem 0 1.1rem',
                    borderRadius: '10px',
                    border: '1.5px solid #1E4636',
                    backgroundColor: '#1E4636',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(30, 70, 54, 0.2)'
                  }}
                >
                  <option value="All" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>All Dishes</option>
                  <option value="Starters" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>Starters</option>
                  <option value="Main Course" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>Main Course</option>
                  <option value="Curries" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>Curries</option>
                  <option value="Biryani" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>Biryani</option>
                  <option value="Breads" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>Breads</option>
                  <option value="South Indian" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>South Indian</option>
                  <option value="Desserts" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>Desserts</option>
                  <option value="Beverages" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>Beverages</option>
                </select>
                <ChevronDown size={16} color="#FFFFFF" style={{ position: 'absolute', right: '12px', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          {/* Menu Cards Grid / Category Sections */}
          {selectedCat === 'All' ? (
            sortedCategories.map((cat) => {
              const catDishes = filteredItems.filter(i => i.category === cat);
              if (catDishes.length === 0) return null;
              return (
                <div key={cat} style={{ marginBottom: '2.5rem' }}>
                  {/* Category Header Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.85rem 1.25rem',
                    background: '#FAF6EE',
                    borderRadius: '12px',
                    border: '1.5px solid #EAE3D2',
                    marginBottom: '1.25rem'
                  }}>
                    <UtensilsCrossed size={18} color="#1E4636" />
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E4636', margin: 0 }}>
                      {cat}
                    </h2>
                  </div>

                  <div className="admin-menu-cards-grid">
                    {catDishes.map((item) => (
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
                </div>
              );
            })
          ) : (
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
          )}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }} className="mb-3">
                  <div className="admin-form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-control"
                      value={dishFormData.category}
                      onChange={(e) => setDishFormData({ ...dishFormData, category: e.target.value })}
                    >
                      <option value="Starters">Starters</option>
                      <option value="Main Course">Main Course</option>
                      <option value="Curries">Curries</option>
                      <option value="Biryani">Biryani</option>
                      <option value="Breads">Breads</option>
                      <option value="South Indian">South Indian</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Beverages">Beverages</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="form-label">Dietary Type *</label>
                    <select
                      className="form-control"
                      value={dishFormData.isVeg ? 'veg' : 'nonveg'}
                      onChange={(e) => setDishFormData({ ...dishFormData, isVeg: e.target.value === 'veg' })}
                    >
                      <option value="veg">🟢 Veg</option>
                      <option value="nonveg">🔴 Non-Veg</option>
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

                {/* Dish Image Selection with Tabs (Upload File to Cloudinary / Paste Image Link / Preset Gallery) */}
                <div className="admin-form-group mb-4" style={{ background: '#FFFBF4', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E5DBC8' }}>
                  <label className="form-label" style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 700 }}>
                    📸 Dish Image Selection
                  </label>

                  {/* Tab Selector Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', backgroundColor: '#FFFFFF', padding: '0.35rem', borderRadius: '10px', border: '1px solid #E5DBC8' }}>
                    <button
                      type="button"
                      className={`admin-pill-btn ${imageTab === 'upload' ? 'is-active' : ''}`}
                      onClick={() => setImageTab('upload')}
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      <UploadCloud size={14} />
                      <span>Upload File (Cloudinary)</span>
                    </button>

                    <button
                      type="button"
                      className={`admin-pill-btn ${imageTab === 'link' ? 'is-active' : ''}`}
                      onClick={() => setImageTab('link')}
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      <Link2 size={14} />
                      <span>Image Link / URL</span>
                    </button>
                  </div>

                  {/* TAB 1: UPLOAD FILE TO CLOUDINARY */}
                  {imageTab === 'upload' && (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        style={{ display: 'none' }}
                      />
                      <div 
                        className="admin-image-upload-dropzone mb-2"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ background: '#FFFFFF', cursor: 'pointer' }}
                      >
                        <div className="admin-upload-icon-circle">
                          <UploadCloud size={22} />
                        </div>
                        <div>
                          <p className="admin-upload-text-title">Upload High-Res Food Photo to Cloudinary</p>
                          <p className="admin-upload-text-sub">Click to browse files or drag & drop (PNG, JPG, WEBP)</p>
                        </div>
                      </div>
                      {isUploadingImage && (
                        <div style={{ fontSize: '0.8rem', color: '#E07A3C', fontWeight: 600 }}>
                          ⏳ Uploading image to Cloudinary CDN...
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: PASTE DIRECT IMAGE URL / LINK */}
                  {imageTab === 'link' && (
                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem', color: '#5C5C5C', marginBottom: '0.35rem', fontWeight: 600 }}>
                        Paste Image Link (HTTP / HTTPS URL) *
                      </label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={dishFormData.img}
                        onChange={(e) => setDishFormData({ ...dishFormData, img: e.target.value })}
                        onBlur={(e) => handleLinkAutoUpload(e.target.value)}
                        style={{ background: '#FFFFFF', width: '100%' }}
                        required={imageTab === 'link'}
                      />
                      <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.35rem' }}>
                        💡 Any web image link (Unsplash, Imgur, CDN, etc.) is directly stored in your Cloudinary storage automatically.
                      </div>
                    </div>
                  )}

                  {/* Selected Image Preview Link */}
                  {dishFormData.img && (
                    <div style={{ fontSize: '0.76rem', color: '#1E4636', marginTop: '0.75rem', fontWeight: 600, wordBreak: 'break-all' }}>
                      🖼️ Image Source: <span style={{ color: '#E07A3C' }}>{dishFormData.img.length > 60 ? dishFormData.img.substring(0, 60) + '...' : dishFormData.img}</span>
                    </div>
                  )}
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
