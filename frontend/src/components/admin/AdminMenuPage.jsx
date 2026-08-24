import React, { useState, useRef, useEffect } from 'react';
import { 
  UtensilsCrossed, Plus, Minus, Search, Edit3, MoreVertical, ChevronDown,
  Bookmark, Star, Clock, Flame, CheckCircle2, Trash2, Boxes,
  ArrowLeft, Save, Camera, Sparkles, Image as ImageIcon, UploadCloud, Link2
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminMenuPage() {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'
  const [activeSection, setActiveSection] = useState('items'); // 'items' or 'combos'
  const [selectedCat, setSelectedCat] = useState('All');
  const [search, setSearch] = useState('');
  const [editingDish, setEditingDish] = useState(null);
  const [activeMoreMenuId, setActiveMoreMenuId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [imageTab, setImageTab] = useState('upload'); // 'upload', 'link', or 'preset'
  const fileInputRef = useRef(null);

  // Combo Management States
  const defaultCombosList = [
    {
      id: 'Royal Biryani Feast Combo',
      title: 'Royal Biryani Feast Combo',
      name: 'Royal Biryani Feast Combo',
      desc: '1 Full Chicken Dum Biryani + 2 Butter Naan + 1 Paneer Tikka + Gulab Jamun + Soft Drinks.',
      price: 890,
      origPrice: '₹1,250',
      originalPriceNum: 1250,
      tag: 'BEST VALUE (30% OFF)',
      img: '/hero_dish_2.png',
      isVeg: false,
      available: true,
      items: [
        { id: 1, name: 'Chicken Biryani', qty: 1, price: 320 },
        { id: 2, name: 'Amritsari Paneer Tikka', qty: 1, price: 290 },
        { id: 7, name: 'Saffron Gulab Jamun', qty: 1, price: 160 }
      ]
    },
    {
      id: 'Tandoori Kebab Platter Special',
      title: 'Tandoori Kebab Platter Special',
      name: 'Tandoori Kebab Platter Special',
      desc: 'Assorted Murgh Malai Kabab, Tandoori Chicken, Paneer Angara & Mint Chutney.',
      price: 760,
      origPrice: '₹980',
      originalPriceNum: 980,
      tag: 'CHEF SPECIAL',
      img: '/carousel_1.png',
      isVeg: false,
      available: true,
      items: [
        { id: 2, name: 'Amritsari Paneer Tikka', qty: 1, price: 290 },
        { id: 3, name: 'Classic Butter Chicken', qty: 1, price: 440 }
      ]
    },
    {
      id: 'Dal Makhani & Shahi Thali',
      title: 'Dal Makhani & Shahi Thali',
      name: 'Dal Makhani & Shahi Thali',
      desc: 'Dal Makhani Gold + Paneer Butter Masala + Saffron Rice + 3 Butter Rotis + Lassi.',
      price: 640,
      origPrice: '₹820',
      originalPriceNum: 820,
      tag: 'PURE VEG ROYAL',
      img: '/hero_dish_1.png',
      isVeg: true,
      available: true,
      items: [
        { id: 6, name: 'Dal Makhani Shahi', qty: 1, price: 260 },
        { id: 8, name: 'Special Mango Lassi', qty: 1, price: 120 }
      ]
    },
    {
      id: 'Family Royal Celebration Feast',
      title: 'Family Royal Celebration Feast',
      name: 'Family Royal Celebration Feast',
      desc: '2 Full Dum Biryanis + 4 Garlic Naans + Paneer Tikka + Gulab Jamun Platter + Beverages.',
      price: 1150,
      origPrice: '₹1,490',
      originalPriceNum: 1490,
      tag: 'FAMILY COMBO (25% OFF)',
      img: '/carousel_2.png',
      isVeg: false,
      available: true,
      items: [
        { id: 1, name: 'Chicken Biryani', qty: 2, price: 320 },
        { id: 7, name: 'Saffron Gulab Jamun', qty: 2, price: 160 }
      ]
    }
  ];

  const [combos, setCombos] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_combos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return defaultCombosList;
  });

  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [comboSearchQuery, setComboSearchQuery] = useState('');
  const [comboFormData, setComboFormData] = useState({
    title: '',
    tag: 'CHEF COMBO DEAL',
    desc: '',
    img: '/hero_dish_2.png',
    price: '',
    isVeg: false,
    available: true,
    selectedItems: [] // [{ id, name, price, qty }]
  });

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

  // Combo Management Functions
  const handleOpenCreateComboModal = () => {
    setEditingCombo(null);
    setComboFormData({
      title: '',
      tag: 'CHEF COMBO DEAL',
      desc: '',
      img: '/hero_dish_2.png',
      price: '',
      isVeg: false,
      available: true,
      selectedItems: []
    });
    setComboSearchQuery('');
    setViewMode('combo-form');
  };

  const handleOpenEditComboModal = (combo) => {
    setEditingCombo(combo);

    let initialSelectedItems = [];
    if (combo.items && Array.isArray(combo.items) && combo.items.length > 0) {
      initialSelectedItems = combo.items.map(it => ({
        id: it.id || it.name,
        name: it.name,
        price: it.price || 100,
        qty: it.qty || 1
      }));
    } else {
      // Intelligently infer from existing menu items or pick default 2 items
      const descLower = (combo.desc || '').toLowerCase();
      const matched = menuItems.filter(m => descLower.includes(m.name.toLowerCase())).map(m => ({
        id: m.id,
        name: m.name,
        price: m.price,
        qty: 1
      }));

      if (matched.length >= 2) {
        initialSelectedItems = matched;
      } else if (menuItems.length >= 2) {
        initialSelectedItems = [
          { id: menuItems[0].id, name: menuItems[0].name, price: menuItems[0].price, qty: 1 },
          { id: menuItems[1].id, name: menuItems[1].name, price: menuItems[1].price, qty: 1 }
        ];
      }
    }

    setComboFormData({
      title: combo.title || combo.name || '',
      tag: combo.tag || 'CHEF COMBO DEAL',
      desc: combo.desc || '',
      img: combo.img || '/hero_dish_2.png',
      price: combo.price || '',
      isVeg: combo.isVeg || false,
      available: combo.available !== undefined ? combo.available : true,
      selectedItems: initialSelectedItems
    });
    setComboSearchQuery('');
    setViewMode('combo-form');
  };

  const handleToggleComboItemSelection = (menuItem) => {
    const existing = comboFormData.selectedItems.find(i => i.id === menuItem.id || i.name === menuItem.name);
    if (existing) {
      setComboFormData(prev => ({
        ...prev,
        selectedItems: prev.selectedItems.filter(i => i.id !== menuItem.id && i.name !== menuItem.name)
      }));
    } else {
      setComboFormData(prev => ({
        ...prev,
        selectedItems: [
          ...prev.selectedItems,
          { id: menuItem.id, name: menuItem.name, price: menuItem.price, qty: 1 }
        ]
      }));
    }
  };

  const handleUpdateComboItemQty = (idKey, newQty) => {
    if (newQty <= 0) {
      setComboFormData(prev => ({
        ...prev,
        selectedItems: prev.selectedItems.filter(i => (i.id || i.name) !== idKey)
      }));
      return;
    }
    setComboFormData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.map(i => (i.id || i.name) === idKey ? { ...i, qty: newQty } : i)
    }));
  };

  const handleRemoveComboItem = (idKey) => {
    setComboFormData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter(i => (i.id || i.name) !== idKey)
    }));
  };

  const handleSaveCombo = async (e) => {
    e.preventDefault();
    if (comboFormData.selectedItems.length < 2) {
      showToast('⚠️ Please select at least 2 menu items to create a combo.');
      return;
    }
    if (!comboFormData.title.trim() || !comboFormData.price) {
      showToast('⚠️ Please fill in combo title and selling price.');
      return;
    }

    let finalImg = comboFormData.img || '/hero_dish_2.png';
    if (finalImg && (finalImg.startsWith('data:image/') || finalImg.startsWith('http')) && !finalImg.includes('res.cloudinary.com')) {
      try {
        setIsUploadingImage(true);
        showToast('Saving photo to Cloudinary CDN...');
        const cloudRes = await api.uploadImage(finalImg, 'combos');
        if (cloudRes && cloudRes.url) {
          finalImg = cloudRes.url;
        }
      } catch (err) {
        console.warn('Cloudinary upload on combo save fallback:', err.message);
      } finally {
        setIsUploadingImage(false);
      }
    }

    const origTotal = comboFormData.selectedItems.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.qty || 1)), 0);
    const newCombo = {
      id: editingCombo ? editingCombo.id : `combo-${Date.now()}`,
      title: comboFormData.title.trim(),
      name: comboFormData.title.trim(),
      desc: comboFormData.desc.trim() || comboFormData.selectedItems.map(i => `${i.name} x${i.qty}`).join(' + '),
      price: Number(comboFormData.price),
      origPrice: `₹${origTotal.toLocaleString()}`,
      originalPriceNum: origTotal,
      tag: comboFormData.tag.trim() || 'CHEF COMBO DEAL',
      img: finalImg,
      isVeg: comboFormData.isVeg,
      available: comboFormData.available,
      items: comboFormData.selectedItems
    };

    let updatedCombos;
    if (editingCombo) {
      updatedCombos = combos.map(c => (c.id === editingCombo.id || c.title === editingCombo.title || c.name === editingCombo.name) ? newCombo : c);
    } else {
      updatedCombos = [newCombo, ...combos];
    }

    setCombos(updatedCombos);
    try {
      localStorage.setItem('flavora_combos', JSON.stringify(updatedCombos));
      window.dispatchEvent(new Event('flavora_combos_updated'));
      window.dispatchEvent(new Event('flavora_dishes_updated'));
    } catch (err) {}

    setViewMode('list');
    setActiveSection('combos');
    setEditingCombo(null);
    showToast(editingCombo ? 'Combo offer updated!' : '🎉 New Combo Offer created!');
  };

  const handleDeleteCombo = (comboId) => {
    if (window.confirm('Are you sure you want to delete this combo offer? (The individual menu items inside will NOT be deleted).')) {
      const updatedCombos = combos.filter(c => c.id !== comboId);
      setCombos(updatedCombos);
      try {
        localStorage.setItem('flavora_combos', JSON.stringify(updatedCombos));
        window.dispatchEvent(new Event('flavora_combos_updated'));
        window.dispatchEvent(new Event('flavora_dishes_updated'));
      } catch (e) {}
      showToast('Combo offer deleted');
    }
  };

  const toggleComboAvailability = (comboId) => {
    const updatedCombos = combos.map(c => c.id === comboId ? { ...c, available: !c.available } : c);
    setCombos(updatedCombos);
    try {
      localStorage.setItem('flavora_combos', JSON.stringify(updatedCombos));
      window.dispatchEvent(new Event('flavora_combos_updated'));
      window.dispatchEvent(new Event('flavora_dishes_updated'));
    } catch (e) {}
    showToast('Combo availability status updated');
  };

  const toggleComboBookmark = (comboId) => {
    const updatedCombos = combos.map(c => c.id === comboId ? { ...c, bookmarked: !c.bookmarked } : c);
    setCombos(updatedCombos);
    try {
      localStorage.setItem('flavora_combos', JSON.stringify(updatedCombos));
      window.dispatchEvent(new Event('flavora_combos_updated'));
      window.dispatchEvent(new Event('flavora_dishes_updated'));
    } catch (e) {}
    showToast('Combo bookmark updated');
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
  const [isDraggingCombo, setIsDraggingCombo] = useState(false);
  const [isDraggingDish, setIsDraggingDish] = useState(false);

  const handleComboFileDrop = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast('⚠️ Please drop a valid image file (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      if (evt.target?.result) {
        const localDataUrl = evt.target.result;
        setComboFormData(prev => ({ ...prev, img: localDataUrl }));
        setIsUploadingImage(true);
        showToast('Uploading dropped photo to Cloudinary...');
        try {
          const res = await api.uploadImage(localDataUrl, 'combos');
          if (res && res.url) {
            setComboFormData(prev => ({ ...prev, img: res.url }));
            showToast('✓ Photo saved to Cloudinary CDN!');
          }
        } catch (err) {
          console.warn('Cloudinary drop upload error:', err.message);
        } finally {
          setIsUploadingImage(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDishFileDrop = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast('⚠️ Please drop a valid image file (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      if (evt.target?.result) {
        const localDataUrl = evt.target.result;
        setDishFormData(prev => ({ ...prev, img: localDataUrl }));
        setIsUploadingImage(true);
        showToast('Uploading dropped photo to Cloudinary...');
        try {
          const res = await api.uploadImage(localDataUrl, 'dishes');
          if (res && res.url) {
            setDishFormData(prev => ({ ...prev, img: res.url }));
            showToast('✓ Photo saved to Cloudinary CDN!');
          }
        } catch (err) {
          console.warn('Cloudinary drop upload error:', err.message);
        } finally {
          setIsUploadingImage(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleDishFileDrop(file);
    }
  };

  const handleLinkAutoUpload = async (url, targetType = 'dish') => {
    if (!url || !url.trim()) return;
    const cleanUrl = url.trim();

    // Immediately reflect the pasted URL in state so live preview renders right away
    if (targetType === 'combo') {
      setComboFormData(prev => ({ ...prev, img: cleanUrl }));
    } else {
      setDishFormData(prev => ({ ...prev, img: cleanUrl }));
    }

    if (cleanUrl.includes('res.cloudinary.com') || cleanUrl.startsWith('/')) return;

    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:image/')) {
      try {
        setIsUploadingImage(true);
        showToast('Saving image to Cloudinary CDN...');
        const folder = targetType === 'combo' ? 'combos' : 'dishes';
        const res = await api.uploadImage(cleanUrl, folder);
        if (res && res.url) {
          if (targetType === 'combo') {
            setComboFormData(prev => ({ ...prev, img: res.url }));
          } else {
            setDishFormData(prev => ({ ...prev, img: res.url }));
          }
          showToast('✓ Photo saved to Cloudinary CDN!');
        }
      } catch (err) {
        console.warn('Auto Cloudinary upload from link fallback:', err.message);
        showToast('⚠️ Private/restricted link. Use "Upload File" or public link.');
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
              <p className="admin-page-subtitle">Configure categories, dishes, prices, combo offers, and instant kitchen availability.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn btn-primary" onClick={handleOpenAddPage}>
                <Plus size={16} />
                <span>+ Add Menu Item</span>
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleOpenCreateComboModal}
                style={{ backgroundColor: '#E07A3C', borderColor: '#E07A3C' }}
              >
                <Sparkles size={16} />
                <span>+ Create Combo</span>
              </button>
            </div>
          </div>

          {/* Section Navigation Tabs: Individual Dishes vs Combo Offers */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid #EAE3D2', paddingBottom: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setActiveSection('items')}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeSection === 'items' ? '#1E4636' : 'transparent',
                color: activeSection === 'items' ? '#FFFFFF' : '#64748B',
                boxShadow: activeSection === 'items' ? '0 4px 12px rgba(30, 70, 54, 0.25)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              🥗 Individual Menu Items ({menuItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('combos')}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeSection === 'combos' ? '#E07A3C' : 'transparent',
                color: activeSection === 'combos' ? '#FFFFFF' : '#64748B',
                boxShadow: activeSection === 'combos' ? '0 4px 12px rgba(224, 122, 60, 0.25)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              🍱 Combo Offers ({combos.length})
            </button>
          </div>

          {/* SECTION 1: INDIVIDUAL MENU ITEMS */}
          {activeSection === 'items' && (
            <>
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
                    <ChevronDown size={16} color="#FFFFFF" style={{ position: 'absolute', right: '1rem', pointerEvents: 'none' }} />
                  </div>
                </div>
              </div>

              {/* Menu Cards Grid */}
              {filteredItems.length === 0 ? (
                <div className="admin-card text-center" style={{ padding: '3rem 1.5rem' }}>
                  <UtensilsCrossed size={36} color="#94A3B8" style={{ margin: '0 auto 0.75rem auto' }} />
                  <h3 style={{ fontSize: '1.1rem', color: '#1E4636', fontWeight: 800 }}>No Dishes Found</h3>
                  <p style={{ color: '#64748B', fontSize: '0.88rem' }}>No menu items match your search filter "{search}".</p>
                </div>
              ) : (
                <div className="admin-menu-cards-grid">
                  {filteredItems.map((item) => (
                    <div key={item.id} className="admin-menu-card-v2">
                      <div className="admin-menu-card-img-wrapper">
                        <img src={item.img || '/hero_dish_2.png'} alt={item.name} className="admin-menu-card-img" />
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

                      <div className="admin-menu-card-body">
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

                        <p className="admin-menu-card-desc">{item.desc}</p>

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

                        <div className="admin-menu-card-footer">
                          <div className="admin-menu-card-price-group">
                            <div className="admin-menu-card-price">₹{item.price}</div>
                            <div className="admin-menu-card-tax">Inclusive of all taxes</div>
                          </div>

                          <div className="admin-menu-card-actions">
                            <button 
                              className="admin-menu-edit-btn" 
                              onClick={() => handleOpenEditPage(item)}
                              title="Edit Dish Information"
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>

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

          {/* SECTION 2: COMBO OFFERS */}
          {activeSection === 'combos' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E4636', margin: 0, fontFamily: 'var(--font-heading)' }}>
                    Active Combo Offers ({combos.length})
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                    Combos combine existing menu items into special deals for the Home Page and online ordering.
                  </p>
                </div>
                <button className="btn btn-primary" onClick={handleOpenCreateComboModal} style={{ backgroundColor: '#E07A3C', borderColor: '#E07A3C' }}>
                  <Sparkles size={16} />
                  <span>+ Create Combo</span>
                </button>
              </div>

              {combos.length === 0 ? (
                <div className="admin-card text-center" style={{ padding: '3rem 1.5rem' }}>
                  <Sparkles size={40} color="#E07A3C" style={{ margin: '0 auto 1rem auto' }} />
                  <h3 style={{ color: '#1E4636', fontWeight: 800 }}>No Combo Offers Created Yet</h3>
                  <p style={{ color: '#64748B', maxWidth: '400px', margin: '0.5rem auto 1.5rem auto' }}>
                    Create thali, biryani feast, or family celebration combos using your existing menu items!
                  </p>
                  <button className="btn btn-primary" onClick={handleOpenCreateComboModal} style={{ backgroundColor: '#E07A3C', borderColor: '#E07A3C' }}>
                    <Sparkles size={16} />
                    <span>Create Your First Combo</span>
                  </button>
                </div>
              ) : (
                <div className="admin-menu-cards-grid">
                  {combos.map((combo) => {
                    const origTotalNum = combo.originalPriceNum || Number((combo.origPrice || '').replace(/[^0-9]/g, '')) || combo.price;
                    const savingsNum = Math.max(0, origTotalNum - combo.price);

                    return (
                      <div key={combo.id} className="admin-menu-card-v2">
                        {/* Image Banner */}
                        <div className="admin-menu-card-img-wrapper">
                          <img 
                            src={combo.img || '/hero_dish_2.png'} 
                            alt={combo.title || combo.name} 
                            className="admin-menu-card-img" 
                            onError={(e) => { e.target.onerror = null; e.target.src = '/hero_dish_2.png'; }}
                          />
                          <div className="admin-menu-bestseller-badge" style={{ backgroundColor: '#E07A3C', color: '#FFFFFF' }}>
                            <Sparkles size={12} fill="#FFFFFF" color="#FFFFFF" />
                            <span>{combo.tag || 'CHEF COMBO'}</span>
                          </div>

                          <button 
                            className="admin-menu-bookmark-btn" 
                            onClick={() => toggleComboBookmark(combo.id)}
                            title="Bookmark Combo"
                          >
                            <Bookmark 
                              size={15} 
                              color="#1E4636" 
                              fill={combo.bookmarked ? '#1E4636' : 'none'} 
                            />
                          </button>
                        </div>

                        {/* Card Body */}
                        <div className="admin-menu-card-body">
                          <div className="admin-menu-card-title-row">
                            <h3 className="admin-menu-card-name">{combo.title || combo.name}</h3>
                            <button
                              className={`admin-menu-status-pill ${combo.available !== false ? 'is-active' : 'is-inactive'}`}
                              onClick={() => toggleComboAvailability(combo.id)}
                              title="Toggle Kitchen Availability"
                            >
                              <span className="status-dot"></span>
                              <span>{combo.available !== false ? 'Active' : 'Inactive'}</span>
                            </button>
                          </div>

                          <p className="admin-menu-card-desc">{combo.desc}</p>

                          <div className="admin-menu-card-meta-bar">
                            <span className="meta-item">
                              <UtensilsCrossed size={13} color="#E07A3C" />
                              <span>Chef Combo</span>
                            </span>
                            <span className="meta-divider">|</span>
                            <span className="meta-item">
                              <Boxes size={13} color="#E07A3C" />
                              <span>{combo.items?.length || 0} Items</span>
                            </span>
                            {savingsNum > 0 && (
                              <>
                                <span className="meta-divider">|</span>
                                <span className="meta-item">
                                  <Flame size={13} color="#E07A3C" />
                                  <span>Save ₹{savingsNum}</span>
                                </span>
                              </>
                            )}
                          </div>



                          <div className="admin-menu-card-footer-divider" />

                          <div className="admin-menu-card-footer">
                            <div className="admin-menu-card-price-group">
                              {origTotalNum > combo.price && (
                                <div style={{ fontSize: '0.72rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                                  {combo.origPrice || `₹${origTotalNum}`}
                                </div>
                              )}
                              <div className="admin-menu-card-price">₹{combo.price}</div>
                              <div className="admin-menu-card-tax">Inclusive of all taxes</div>
                            </div>

                            <div className="admin-menu-card-actions">
                              <button 
                                className="admin-menu-edit-btn" 
                                onClick={() => handleOpenEditComboModal(combo)}
                                title="Edit Combo Offer"
                              >
                                <Edit3 size={13} />
                                <span>Edit</span>
                              </button>

                              <div style={{ position: 'relative' }}>
                                <button 
                                  className="admin-menu-more-btn" 
                                  title="More options"
                                  onClick={() => setActiveMoreMenuId(activeMoreMenuId === `combo-${combo.id}` ? null : `combo-${combo.id}`)}
                                >
                                  <MoreVertical size={15} />
                                </button>

                                {activeMoreMenuId === `combo-${combo.id}` && (
                                  <>
                                    <div 
                                      style={{ position: 'fixed', inset: 0, zIndex: 99 }} 
                                      onClick={() => setActiveMoreMenuId(null)} 
                                    />
                                    <div className="admin-card-more-dropdown">
                                      <button className="dropdown-opt" onClick={() => { toggleComboAvailability(combo.id); setActiveMoreMenuId(null); }}>
                                        <CheckCircle2 size={13} color={combo.available !== false ? '#C0392B' : '#2E7D32'} />
                                        <span>Mark as {combo.available !== false ? 'Inactive' : 'Active'}</span>
                                      </button>

                                      <div style={{ height: '1px', background: '#F0E8DA', margin: '0.2rem 0' }} />

                                      <button className="dropdown-opt is-delete" onClick={() => { handleDeleteCombo(combo.id); setActiveMoreMenuId(null); }}>
                                        <Trash2 size={13} color="#C0392B" />
                                        <span>Delete Combo</span>
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* VIEW MODE 3: DEDICATED CREATE / EDIT COMBO PAGE */}
      {viewMode === 'combo-form' && (
        <div>
          {/* Page Header Bar with Back Button & Breadcrumbs */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="page-breadcrumb-bar" style={{ marginBottom: '0.5rem' }}>
                <span className="crumb-link" onClick={() => { setViewMode('list'); setActiveSection('combos'); }}>Admin</span>
                <span className="crumb-sep">›</span>
                <span className="crumb-link" onClick={() => { setViewMode('list'); setActiveSection('combos'); }}>Menu Management</span>
                <span className="crumb-sep">›</span>
                <span className="crumb-current">
                  {editingCombo ? `Edit ${editingCombo.title || editingCombo.name}` : 'Create New Combo Offer'}
                </span>
              </div>

              <h1 className="admin-page-title" style={{ margin: 0, fontSize: '1.65rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={24} color="#E07A3C" />
                <span>{editingCombo ? `Edit Combo Offer: ${editingCombo.title || editingCombo.name}` : 'Create New Combo Offer'}</span>
              </h1>
              <p className="admin-page-subtitle" style={{ margin: '0.2rem 0 0 0' }}>
                Combine existing menu dishes into special thalis, biryani feasts, or party combos with custom pricing.
              </p>
            </div>

            <button className="btn btn-outline" onClick={() => { setViewMode('list'); setActiveSection('combos'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowLeft size={16} />
              <span>Back to Menu List</span>
            </button>
          </div>

          {/* Combo Form Content Grid (2 Columns: Form Fields 7 cols | Live Card Preview & Pricing 5 cols) */}
          <form onSubmit={handleSaveCombo}>
            <div className="admin-grid-12" style={{ gap: '1.5rem' }}>
              
              {/* Left Column (7 cols): Combo Details & Included Dishes */}
              <div className="admin-card col-span-7" style={{ padding: '1.75rem' }}>
                <div className="admin-card-header mb-4" style={{ borderBottom: '1px solid #F0E8DA', paddingBottom: '0.75rem' }}>
                  <h2 className="admin-card-title" style={{ fontSize: '1.2rem', margin: 0, color: '#1E4636' }}>
                    Combo Details & Included Dishes
                  </h2>
                </div>

                <div className="admin-form-group mb-3">
                  <label className="form-label" style={{ fontWeight: 700 }}>Combo Title / Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Royal Biryani Feast Combo"
                    value={comboFormData.title}
                    onChange={(e) => setComboFormData({ ...comboFormData, title: e.target.value })}
                    required
                    style={{ fontSize: '0.98rem', fontWeight: 600 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mb-3">
                  <div className="admin-form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Offer Badge / Tag</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. BEST VALUE (30% OFF)"
                      value={comboFormData.tag}
                      onChange={(e) => setComboFormData({ ...comboFormData, tag: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Dietary Type</label>
                    <select
                      className="form-control"
                      value={comboFormData.isVeg ? 'veg' : 'nonveg'}
                      onChange={(e) => setComboFormData({ ...comboFormData, isVeg: e.target.value === 'veg' })}
                    >
                      <option value="nonveg">🔴 Non-Veg Combo</option>
                      <option value="veg">🟢 Pure Veg Combo</option>
                    </select>
                  </div>
                </div>

                {/* IMAGE SELECTION WITH CLOUDINARY AUTO-SAVING UPON PASTE */}
                <div className="admin-form-group mb-4" style={{ background: '#FFFBF4', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E5DBC8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ fontSize: '0.9rem', margin: 0, fontWeight: 700 }}>
                      📸 Combo Food Photo Selection
                    </label>
                    {isUploadingImage && (
                      <span style={{ fontSize: '0.78rem', color: '#E07A3C', fontWeight: 700 }}>
                        ⏳ Saving image to Cloudinary CDN...
                      </span>
                    )}
                  </div>

                  {/* Tab Switcher */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem', backgroundColor: '#FFFFFF', padding: '0.3rem', borderRadius: '10px', border: '1px solid #E5DBC8' }}>
                    <button
                      type="button"
                      className={`admin-pill-btn ${imageTab === 'upload' ? 'is-active' : ''}`}
                      onClick={() => setImageTab('upload')}
                      style={{ flex: 1, padding: '0.4rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      <UploadCloud size={14} />
                      <span>Upload File (Cloudinary)</span>
                    </button>

                    <button
                      type="button"
                      className={`admin-pill-btn ${imageTab === 'link' ? 'is-active' : ''}`}
                      onClick={() => setImageTab('link')}
                      style={{ flex: 1, padding: '0.4rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
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
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = async (evt) => {
                              if (evt.target?.result) {
                                const localDataUrl = evt.target.result;
                                setComboFormData(prev => ({ ...prev, img: localDataUrl }));
                                setIsUploadingImage(true);
                                showToast('Uploading photo to Cloudinary...');
                                try {
                                  const res = await api.uploadImage(localDataUrl, 'combos');
                                  if (res && res.url) {
                                    setComboFormData(prev => ({ ...prev, img: res.url }));
                                    showToast('Photo saved to Cloudinary CDN!');
                                  }
                                } catch (err) {} finally {
                                  setIsUploadingImage(false);
                                }
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                      <div 
                        className={`admin-image-upload-dropzone ${isDraggingCombo ? 'is-dragging' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDraggingCombo(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDraggingCombo(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDraggingCombo(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleComboFileDrop(file);
                        }}
                        style={{ 
                          background: isDraggingCombo ? '#FFF7ED' : '#FFFFFF', 
                          borderColor: isDraggingCombo ? '#E07A3C' : 'inherit',
                          borderStyle: 'dashed',
                          borderWidth: '2px',
                          cursor: 'pointer', 
                          padding: '1.25rem',
                          transition: 'all 0.2s ease',
                          transform: isDraggingCombo ? 'scale(1.01)' : 'scale(1)'
                        }}
                      >
                        <div className="admin-upload-icon-circle" style={{ backgroundColor: isDraggingCombo ? '#E07A3C' : undefined, color: isDraggingCombo ? '#FFFFFF' : undefined }}>
                          <UploadCloud size={22} />
                        </div>
                        <div>
                          <p className="admin-upload-text-title" style={{ fontSize: '0.88rem', color: isDraggingCombo ? '#E07A3C' : '#1E4636', fontWeight: 700 }}>
                            {isDraggingCombo ? 'Drop Image File Here to Upload!' : 'Upload Combo Photo to Cloudinary'}
                          </p>
                          <p className="admin-upload-text-sub" style={{ fontSize: '0.76rem' }}>
                            Click to browse files or drag & drop image here (PNG, JPG, WEBP)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PASTE URL WITH AUTOMATIC CLOUDINARY SAVE */}
                  {imageTab === 'link' && (
                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem', color: '#5C5C5C', marginBottom: '0.35rem', fontWeight: 600 }}>
                        Paste Image URL (Public web link or Cloudinary CDN) *
                      </label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={comboFormData.img}
                        onChange={(e) => {
                          const val = e.target.value;
                          setComboFormData(prev => ({ ...prev, img: val }));
                        }}
                        onPaste={(e) => {
                          const pastedVal = e.clipboardData.getData('text');
                          if (pastedVal) {
                            setComboFormData(prev => ({ ...prev, img: pastedVal }));
                            handleLinkAutoUpload(pastedVal, 'combo');
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value) {
                            handleLinkAutoUpload(e.target.value, 'combo');
                          }
                        }}
                        style={{ background: '#FFFFFF', width: '100%', fontSize: '0.88rem' }}
                      />
                      <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.35rem' }}>
                        💡 Tip: Paste public image links (Unsplash, Pexels, Imgur) or use "Upload File" to pick any photo from your device!
                      </div>
                    </div>
                  )}
                </div>

                <div className="admin-form-group mb-4">
                  <label className="form-label" style={{ fontWeight: 700 }}>Combo Description</label>
                  <textarea
                    rows="2"
                    className="form-control"
                    placeholder="Describe the items included in this combo deal..."
                    value={comboFormData.desc}
                    onChange={(e) => setComboFormData({ ...comboFormData, desc: e.target.value })}
                  />
                </div>

                {/* SEARCH & SELECT EXISTING MENU ITEMS */}
                <div style={{ backgroundColor: '#FAF6EE', border: '1.5px solid #EAE3D2', borderRadius: '14px', padding: '1.1rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1E4636', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>SELECT EXISTING MENU ITEMS (Select at least 2) *</span>
                    <span style={{ fontSize: '0.8rem', color: comboFormData.selectedItems.length >= 2 ? '#166534' : '#DC2626', fontWeight: 800 }}>
                      {comboFormData.selectedItems.length} Items Selected
                    </span>
                  </div>

                  {comboFormData.selectedItems.length < 2 && (
                    <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '0.45rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                      ⚠️ Please select at least 2 menu items below to form a valid combo.
                    </div>
                  )}

                  {/* Search existing menu items */}
                  <div className="admin-header-search-box" style={{ width: '100%', marginBottom: '1.1rem' }}>
                    <Search size={15} className="admin-search-icon" />
                    <input
                      type="text"
                      placeholder="Search existing menu items..."
                      value={comboSearchQuery}
                      onChange={(e) => setComboSearchQuery(e.target.value)}
                      className="admin-header-search-input"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Searchable Menu Items Grid */}
                  <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.85rem', paddingRight: '0.25rem' }}>
                    {menuItems
                      .filter(m => m.name.toLowerCase().includes(comboSearchQuery.toLowerCase()))
                      .map(m => {
                        const isSelected = comboFormData.selectedItems.some(i => i.id === m.id || i.name === m.name);
                        return (
                          <div
                            key={m.id}
                            onClick={() => handleToggleComboItemSelection(m)}
                            style={{
                              padding: '0.55rem 0.75rem',
                              borderRadius: '8px',
                              border: isSelected ? '2px solid #E07A3C' : '1px solid #E2D7C5',
                              backgroundColor: isSelected ? '#FFF7ED' : '#FFFFFF',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.82rem',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.3rem' }}>
                              <span style={{ fontWeight: 800, color: '#1E4636' }}>{m.name}</span>
                              <span style={{ color: '#64748B', marginLeft: '0.3rem' }}>₹{m.price}</span>
                            </div>
                            <span style={{ fontWeight: 800, color: isSelected ? '#E07A3C' : '#1E4636', fontSize: '0.82rem', flexShrink: 0 }}>
                              {isSelected ? '✓ Added' : '+ Add'}
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  {/* SELECTED ITEMS WITH QUANTITY CONTROLS */}
                  {comboFormData.selectedItems.length > 0 && (
                    <div style={{ borderTop: '1px solid #EAE3D2', paddingTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1E4636', marginBottom: '0.5rem' }}>SELECTED COMBO DISHES & QUANTITIES:</div>
                      {comboFormData.selectedItems.map((selItem) => {
                        const itemKey = selItem.id || selItem.name;
                        return (
                          <div key={itemKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.45rem', backgroundColor: '#FFFFFF', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #E2D7C5' }}>
                            <div style={{ fontWeight: 800, color: '#1E4636' }}>{selItem.name} (₹{selItem.price})</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#1E4636', color: '#FFFFFF', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                                <button type="button" onClick={() => handleUpdateComboItemQty(itemKey, selItem.qty - 1)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '1px' }}>
                                  <Minus size={12} />
                                </button>
                                <span style={{ fontWeight: 800, fontSize: '0.8rem', minWidth: '18px', textAlign: 'center' }}>{selItem.qty}</span>
                                <button type="button" onClick={() => handleUpdateComboItemQty(itemKey, selItem.qty + 1)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '1px' }}>
                                  <Plus size={12} />
                                </button>
                              </div>
                              <span style={{ fontWeight: 800, color: '#1E4636', minWidth: '55px', textAlign: 'right' }}>₹{selItem.price * selItem.qty}</span>
                              <button type="button" onClick={() => handleRemoveComboItem(itemKey)} style={{ background: 'none', border: 'none', color: '#C0392B', cursor: 'pointer', padding: '2px' }}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (5 cols): Live Combo Card Preview & Pricing Summary */}
              <div className="admin-card col-span-5" style={{ padding: '1.75rem', height: 'fit-content' }}>
                
                {/* Section Title */}
                <div className="admin-card-header mb-4" style={{ borderBottom: '1px solid #F0E8DA', paddingBottom: '0.75rem' }}>
                  <h2 className="admin-card-title" style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1E4636' }}>
                    <Sparkles size={18} color="#E07A3C" />
                    <span>Live Combo Card Preview</span>
                  </h2>
                  <p style={{ fontSize: '0.76rem', color: '#5C5C5C', margin: '0.2rem 0 0 0' }}>
                    Real-time preview of how this combo will appear on your Home Page and customer app.
                  </p>
                </div>

                {/* REAL-TIME LIVE COMBO CARD PREVIEW */}
                <div className="mb-4">
                  {(() => {
                    const autoOrig = comboFormData.selectedItems.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.qty || 1)), 0);
                    const sellNum = Number(comboFormData.price || 0);
                    const savNum = Math.max(0, autoOrig - sellNum);

                    return (
                      <div className="admin-menu-card-v2" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                        {/* Image Banner */}
                        <div className="admin-menu-card-img-wrapper">
                          <img 
                            src={comboFormData.img || '/hero_dish_2.png'} 
                            alt={comboFormData.title || 'Combo Preview'} 
                            className="admin-menu-card-img" 
                            onError={(e) => { e.target.onerror = null; e.target.src = '/hero_dish_2.png'; }}
                          />
                          <div className="admin-menu-bestseller-badge" style={{ backgroundColor: '#E07A3C', color: '#FFFFFF' }}>
                            <Sparkles size={12} fill="#FFFFFF" color="#FFFFFF" />
                            <span>{comboFormData.tag || 'CHEF COMBO'}</span>
                          </div>

                          <div className="admin-menu-bookmark-btn" style={{ cursor: 'default' }}>
                            <Bookmark size={15} color="#1E4636" fill="none" />
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="admin-menu-card-body">
                          <div className="admin-menu-card-title-row">
                            <h3 className="admin-menu-card-name">
                              {comboFormData.title || 'Combo Offer Name'}
                            </h3>
                            <div className={`admin-menu-status-pill ${comboFormData.available ? 'is-active' : 'is-inactive'}`}>
                              <span className="status-dot"></span>
                              <span>{comboFormData.available ? 'Active' : 'Inactive'}</span>
                            </div>
                          </div>

                          <p className="admin-menu-card-desc">
                            {comboFormData.desc || 'Combo description will appear here.'}
                          </p>

                          <div className="admin-menu-card-meta-bar">
                            <span className="meta-item">
                              <UtensilsCrossed size={13} color="#E07A3C" />
                              <span>Chef Combo</span>
                            </span>
                            <span className="meta-divider">|</span>
                            <span className="meta-item">
                              <Boxes size={13} color="#E07A3C" />
                              <span>{comboFormData.selectedItems.length} Items</span>
                            </span>
                            {savNum > 0 && (
                              <>
                                <span className="meta-divider">|</span>
                                <span className="meta-item">
                                  <Flame size={13} color="#E07A3C" />
                                  <span>Save ₹{savNum}</span>
                                </span>
                              </>
                            )}
                          </div>



                          <div className="admin-menu-card-footer-divider" />

                          <div className="admin-menu-card-footer">
                            <div className="admin-menu-card-price-group">
                              {autoOrig > sellNum && (
                                <div style={{ fontSize: '0.72rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                                  ₹{autoOrig}
                                </div>
                              )}
                              <div className="admin-menu-card-price">₹{sellNum || 0}</div>
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
                    );
                  })()}
                </div>

                {/* PRICING COMPUTATION FORM */}
                {(() => {
                  const autoOriginalPrice = comboFormData.selectedItems.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.qty || 1)), 0);
                  const sellingPriceNum = Number(comboFormData.price || 0);
                  const savingsNum = Math.max(0, autoOriginalPrice - sellingPriceNum);
                  
                  return (
                    <div>
                      <div className="admin-form-group mb-3">
                        <label className="form-label" style={{ fontWeight: 700 }}>Original Value Sum (Auto-Calculated)</label>
                        <input
                          type="text"
                          readOnly
                          className="form-control"
                          value={`₹${autoOriginalPrice.toLocaleString()}`}
                          style={{ backgroundColor: '#F1F5F9', fontWeight: 800, color: '#475569', fontSize: '1.05rem' }}
                        />
                      </div>

                      <div className="admin-form-group mb-4">
                        <label className="form-label" style={{ fontWeight: 700 }}>Combo Selling Price (₹) *</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 890"
                          value={comboFormData.price}
                          onChange={(e) => setComboFormData({ ...comboFormData, price: e.target.value })}
                          required
                          style={{ fontWeight: 800, color: '#1E4636', fontSize: '1.15rem' }}
                        />
                      </div>

                      {sellingPriceNum > 0 && autoOriginalPrice > 0 && (
                        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.85rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
                          <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 700, marginBottom: '0.2rem' }}>LIVE CUSTOMER SAVINGS:</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#15803D' }}>
                            You Save: ₹{savingsNum} ({autoOriginalPrice > 0 ? Math.round((savingsNum / autoOriginalPrice) * 100) : 0}% OFF)
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
                        <button 
                          type="submit" 
                          className="btn btn-primary" 
                          style={{ backgroundColor: '#E07A3C', borderColor: '#E07A3C', color: '#FFFFFF', fontWeight: 800, padding: '0.85rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                          <Sparkles size={18} />
                          <span>{editingCombo ? 'Update Combo Offer' : 'Save & Publish Combo'}</span>
                        </button>
                        
                        <button 
                          type="button" 
                          className="btn btn-outline" 
                          onClick={() => { setViewMode('list'); setActiveSection('combos'); }}
                          style={{ padding: '0.75rem', fontWeight: 700 }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>
          </form>
        </div>
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
                        className={`admin-image-upload-dropzone mb-2 ${isDraggingDish ? 'is-dragging' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDraggingDish(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDraggingDish(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDraggingDish(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleDishFileDrop(file);
                        }}
                        style={{ 
                          background: isDraggingDish ? '#FFF7ED' : '#FFFFFF', 
                          borderColor: isDraggingDish ? '#E07A3C' : 'inherit',
                          borderStyle: 'dashed',
                          borderWidth: '2px',
                          cursor: 'pointer',
                          padding: '1.25rem',
                          transition: 'all 0.2s ease',
                          transform: isDraggingDish ? 'scale(1.01)' : 'scale(1)'
                        }}
                      >
                        <div className="admin-upload-icon-circle" style={{ backgroundColor: isDraggingDish ? '#E07A3C' : undefined, color: isDraggingDish ? '#FFFFFF' : undefined }}>
                          <UploadCloud size={22} />
                        </div>
                        <div>
                          <p className="admin-upload-text-title" style={{ fontSize: '0.88rem', color: isDraggingDish ? '#E07A3C' : '#1E4636', fontWeight: 700 }}>
                            {isDraggingDish ? 'Drop Image File Here to Upload!' : 'Upload High-Res Food Photo to Cloudinary'}
                          </p>
                          <p className="admin-upload-text-sub" style={{ fontSize: '0.76rem' }}>
                            Click to browse files or drag & drop image here (PNG, JPG, WEBP)
                          </p>
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
