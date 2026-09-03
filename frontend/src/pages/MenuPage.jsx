import React, { useState, useEffect } from 'react';
import { Utensils, UtensilsCrossed, Search, Plus, Minus, Trash2, ShoppingBag, CheckCircle2, QrCode, Sparkles, ChevronDown, ChefHat, Send, Clock, Lock, Filter, Flame, Globe } from 'lucide-react';
import { api } from '../services/api';
import MenuDishStrip from '../components/MenuDishStrip';
import ExposureSlider from '../components/ExposureSlider';
import { findItemInCatalog, calculateCartTotal, resolveDishImageUrl } from '../utils/menuRegistry';
import { useRestaurantBranding } from '../context/RestaurantBrandingContext';
import { isRestaurantOpenNow, getRestaurantStatusDetails } from '../utils/restaurantTimings';

// Customer Enhancement Components
import CustomerDishDetailModal from '../components/customer/CustomerDishDetailModal';
import CustomerOrderTrackingModal from '../components/customer/CustomerOrderTrackingModal';
import CustomerBillModal from '../components/customer/CustomerBillModal';
import CustomerEngagementModal from '../components/customer/CustomerEngagementModal';
import CustomerBottomNav from '../components/customer/CustomerBottomNav';
import CustomerMobileMenuView from '../components/customer/CustomerMobileMenuView';

export default function MenuPage({ onOpenDemoModal }) {
  const { brandName } = useRestaurantBranding();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // Locked Table session initialized strictly from original QR scan in sessionStorage to prevent manual URL tampering
  const [tableNum, setTableNum] = useState(() => {
    try {
      const savedSessionTable = sessionStorage.getItem('flavora_scanned_table');
      const urlParams = new URLSearchParams(window.location.search);
      const urlTableParam = urlParams.get('table');

      // If session table is already locked in this tab session, maintain locked session!
      if (savedSessionTable) {
        const lockedUpper = savedSessionTable.toUpperCase();
        // If someone manually edited the URL parameter in address bar, reset URL back to locked table!
        if (urlTableParam && urlTableParam.toUpperCase() !== lockedUpper) {
          window.history.replaceState(null, '', `${window.location.pathname}?table=${lockedUpper}`);
        }
        return lockedUpper;
      }

      // First time scanning table QR code
      if (urlTableParam) {
        const upper = urlTableParam.toUpperCase();
        sessionStorage.setItem('flavora_scanned_table', upper);
        localStorage.setItem('flavora_scanned_table', upper);
        return upper;
      }
      return localStorage.getItem('flavora_scanned_table') || '';
    } catch (e) {
      return '';
    }
  });

  const getCartStorageKey = (targetTable) => {
    const t = targetTable || tableNum || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('table') : '') || localStorage.getItem('flavora_scanned_table') || '';
    if (t) {
      const clean = String(t).toUpperCase().replace(/[^A-Z0-9-]/g, '');
      return `flavora_cart_${clean}`;
    }
    return 'flavora_cart_GENERAL';
  };

  const [cart, setCart] = useState(() => {
    try {
      const t = tableNum || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('table') : '') || localStorage.getItem('flavora_scanned_table') || '';
      if (t) {
        const clean = String(t).toUpperCase().replace(/[^A-Z0-9-]/g, '');
        const saved = localStorage.getItem(`flavora_cart_${clean}`);
        return saved ? JSON.parse(saved) : {};
      }
    } catch (e) {}
    return {};
  });
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isCustomerOrdersModalOpen, setIsCustomerOrdersModalOpen] = useState(false);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [guestName, setGuestName] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tbl = urlParams.get('table') || sessionStorage.getItem('flavora_scanned_table') || 'GENERAL';
      const cleanTbl = String(tbl).toUpperCase().replace(/[^A-Z0-9-]/g, '');
      return sessionStorage.getItem(`flavora_guest_name_${cleanTbl}`) || '';
    } catch (e) {
      return '';
    }
  });
  const [chefNotes, setChefNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState(null);
  const [tableOccupiedInfo, setTableOccupiedInfo] = useState(null);

  // New Customer Enhancement States
  const [selectedDishForDetail, setSelectedDishForDetail] = useState(null);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isEngagementModalOpen, setIsEngagementModalOpen] = useState(false);
  const [engagementTab, setEngagementTab] = useState('rating');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [priceFilter, setPriceFilter] = useState('all'); // 'all', 'under200', 'under500', '500plus', 'lowHigh', 'highLow'
  const [spiceFilter, setSpiceFilter] = useState('all'); // 'all', 'Mild', 'Medium', 'Spicy'
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [customerNavTab, setCustomerNavTab] = useState('menu');

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_restaurant_settings');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [outOfStockItems, setOutOfStockItems] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_out_of_stock_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const handleStockUpdate = () => {
      try {
        const saved = localStorage.getItem('flavora_out_of_stock_items');
        if (saved) setOutOfStockItems(JSON.parse(saved));
      } catch (e) { }
    };
    handleStockUpdate();
    window.addEventListener('flavora_menu_updated', handleStockUpdate);
    window.addEventListener('storage', handleStockUpdate);
    return () => {
      window.removeEventListener('flavora_menu_updated', handleStockUpdate);
      window.removeEventListener('storage', handleStockUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchLatestSettings = () => {
      api.getSettings()
        .then((data) => {
          if (data && typeof data === 'object') {
            setSettings(prev => {
              const updated = { ...prev, ...data };
              try {
                localStorage.setItem('flavora_restaurant_settings', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
          }
        })
        .catch(() => {});
    };

    fetchLatestSettings();
    const interval = setInterval(fetchLatestSettings, 8000);

    const handleSettingsSync = () => {
      try {
        const saved = localStorage.getItem('flavora_restaurant_settings');
        if (saved) setSettings(JSON.parse(saved));
      } catch (e) { }
    };
    window.addEventListener('flavora_settings_updated', handleSettingsSync);
    window.addEventListener('storage', handleSettingsSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('flavora_settings_updated', handleSettingsSync);
      window.removeEventListener('storage', handleSettingsSync);
    };
  }, []);

  const isClosedNow = !isRestaurantOpenNow(settings);
  const statusDetails = getRestaurantStatusDetails(settings);

  const [placedTableOrders, setPlacedTableOrders] = useState(() => {
    try {
      const currentTable = tableNum || localStorage.getItem('flavora_scanned_table');
      if (currentTable) {
        const saved = localStorage.getItem(`flavora_table_orders_${currentTable}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.filter(o => {
              const isClosedOrPaid = o.status === 'Completed' || o.status === 'Paid' || o.status === 'Cancelled' || o.status === 'Served' || o.payment === 'Paid' || o.payment === 'Completed' || o.paymentStatus === 'Paid';
              return o.status && !isClosedOrPaid;
            });
          }
        }
      }
    } catch (e) { }
    return [];
  });

  const [tableCleaningInfo, setTableCleaningInfo] = useState(null);

  // Poll backend API for real-time table occupancy & cleaning status across mobile devices
  useEffect(() => {
    if (!tableNum) return;

    const checkTableStatus = async () => {
      try {
        const cleanTableNum = String(tableNum).replace(/[^0-9]/g, '');

        // 1. Check active order status first across backend orders
        const orders = await api.getOrders();
        let activeBackendOrders = [];
        if (Array.isArray(orders) && orders.length > 0) {
          activeBackendOrders = orders.filter(ord => {
            const ordTableDigits = String(ord.table || ord.tableNumber || '').replace(/[^0-9]/g, '');
            const isMatch = ordTableDigits && cleanTableNum && String(parseInt(ordTableDigits, 10)) === String(parseInt(cleanTableNum, 10));
            const isClosedOrPaid = ord.status === 'Completed' || ord.status === 'Paid' || ord.status === 'Cancelled' || ord.status === 'Served' || ord.payment === 'Paid' || ord.payment === 'Completed' || ord.paymentStatus === 'Paid';
            return isMatch && !isClosedOrPaid;
          });
        }

        if (activeBackendOrders.length > 0) {
          const primaryActive = activeBackendOrders[0];
          setTableOccupiedInfo({
            isOccupied: true,
            orderId: primaryActive.orderId || primaryActive.id || primaryActive._id,
            status: primaryActive.status || 'Placed'
          });
          setTableCleaningInfo(null);

          const mappedActive = activeBackendOrders.map(ao => ({
            orderId: ao.orderId || ao.id || ao._id,
            table: ao.table || tableNum,
            customer: ao.customer || 'Guest Diner',
            status: ao.status || 'Placed',
            items: ao.items || [],
            totalAmount: ao.total || 0,
            chefNotes: ao.notes || ''
          }));
          setPlacedTableOrders(mappedActive);
        } else {
          // NO ACTIVE ORDERS EXIST FOR THIS TABLE
          setTableOccupiedInfo(null);
          setPlacedTableOrders([]);

          // 2. If NO active order exists, check if table is currently in Cleaning timer state
          const dbTables = await api.getTables();
          if (Array.isArray(dbTables)) {
            const matchedTbl = dbTables.find(t => {
              const tNum = String(t.number || t.name || '').replace(/[^0-9]/g, '');
              return tNum && cleanTableNum && String(parseInt(tNum, 10)) === String(parseInt(cleanTableNum, 10));
            });

            if (matchedTbl && matchedTbl.status === 'Cleaning') {
              const remainingMs = matchedTbl.cleaningUntil ? (new Date(matchedTbl.cleaningUntil).getTime() - Date.now()) : 0;
              if (remainingMs > 0) {
                setTableCleaningInfo({
                  isCleaning: true,
                  tableNum: matchedTbl.number || `T-${cleanTableNum.padStart(2, '0')}`,
                  remainingSec: Math.ceil(remainingMs / 1000)
                });
              } else {
                setTableCleaningInfo(null);
              }
            } else {
              setTableCleaningInfo(null);
            }
          } else {
            setTableCleaningInfo(null);
          }
        }
      } catch (err) {
        console.warn("Could not fetch backend table status:", err);
      }
    };

    checkTableStatus();
    const interval = setInterval(checkTableStatus, 3000);
    return () => clearInterval(interval);
  }, [tableNum]);

  const updateCartState = (newCart, targetTbl) => {
    setCart(newCart);
    try {
      const key = getCartStorageKey(targetTbl || tableNum);
      if (Object.keys(newCart).length === 0) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newCart));
      }
      window.dispatchEvent(new Event('flavora_cart_updated'));
    } catch (e) { }
  };

  useEffect(() => {
    const handleCartSync = () => {
      try {
        const key = getCartStorageKey(tableNum);
        const saved = localStorage.getItem(key);
        if (saved) {
          setCart(JSON.parse(saved));
        }
      } catch (e) { }
    };
    window.addEventListener('flavora_cart_updated', handleCartSync);
    return () => window.removeEventListener('flavora_cart_updated', handleCartSync);
  }, [tableNum]);

  const handleAddToCart = (id) => {
    if (!tableNum) {
      alert(`Ordering is available exclusively for Dine-In guests via Table QR Code. Please scan your dining table's QR code to unlock dish ordering.`);
      return;
    }
    const updated = { ...cart, [id]: (cart[id] || 0) + 1 };
    updateCartState(updated);
  };

  const handleDecreaseQty = (id) => {
    const current = cart[id] || 0;
    let updated;
    if (current <= 1) {
      updated = { ...cart };
      delete updated[id];
    } else {
      updated = { ...cart, [id]: current - 1 };
    }
    updateCartState(updated);
  };

  const handleDeleteItem = (id) => {
    const updated = { ...cart };
    delete updated[id];
    updateCartState(updated);
  };

  const handleClearCart = () => {
    updateCartState({});
  };

  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    const loadMenu = () => {
      const formatItem = (item) => ({
        id: item._id || item.id || item.name,
        _id: item._id || item.id,
        rawId: String(item._id || item.id || ''),
        dishId: item._id || item.id || item.dishId,
        name: item.name,
        category: item.category || 'Main Course',
        price: Number(item.price || 0),
        isVeg: item.isVeg !== undefined ? item.isVeg : true,
        available: item.available !== undefined ? item.available : (item.isAvailable !== undefined ? item.isAvailable : true),
        bestseller: item.bestseller !== undefined ? item.bestseller : (item.isBestseller !== undefined ? item.isBestseller : false),
        desc: item.desc || '',
        prepTime: item.prepTime || '15 mins',
        spice: item.spiceLevel || item.spice || 'Medium',
        img: resolveDishImageUrl(item)
      });

      const mergedMap = new Map();

      // 1. Load Admin-saved dishes from localStorage (flavora_dishes)
      try {
        const savedLocal = localStorage.getItem('flavora_dishes');
        if (savedLocal) {
          const parsed = JSON.parse(savedLocal);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.forEach(item => {
              if (item && item.name) {
                const key = (item.name || '').toLowerCase().trim();
                mergedMap.set(key, formatItem(item));
              }
            });
          }
        }
      } catch (e) { }

      // Immediately set initial items from Admin local storage if present
      const initialItems = Array.from(mergedMap.values());
      setMenuItems(initialItems);

      // 2. Fetch live Admin menu items from backend API database
      api.getMenuItems()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const apiMap = new Map();
            data.forEach(item => {
              if (item && item.name) {
                const key = (item.name || '').toLowerCase().trim();
                apiMap.set(key, formatItem(item));
              }
            });
            const updatedItems = Array.from(apiMap.values());
            setMenuItems(updatedItems);
            try {
              localStorage.setItem('flavora_dishes', JSON.stringify(updatedItems));
            } catch (e) { }
          } else if (initialItems.length === 0) {
            setMenuItems([]);
          }
        })
        .catch((err) => {
          console.log('Using local Admin menu items on MenuPage:', err.message);
        });
    };

    loadMenu();
    window.addEventListener('flavora_dishes_updated', loadMenu);
    window.addEventListener('storage', loadMenu);
    return () => {
      window.removeEventListener('flavora_dishes_updated', loadMenu);
      window.removeEventListener('storage', loadMenu);
    };
  }, []);

  const KNOWN_CATEGORY_ICONS = {
    'all': '🍽️',
    'starters': '🥗',
    'main course': '🍲',
    'mains': '🍲',
    'curries': '🍛',
    'biryani': '🍚',
    'breads': '🫓',
    'south indian': '🥞',
    'southindian': '🥞',
    'desserts': '🍨',
    'beverages': '🥤',
    'thalis': '🍱',
    'combos': '🎁',
    'snacks': '🍿',
    'tandoori': '🍢',
    'soups': '🥣',
    'salads': '🥗'
  };

  const getCategoryIcon = (catName) => {
    const c = (catName || '').toLowerCase().trim();
    if (KNOWN_CATEGORY_ICONS[c]) return KNOWN_CATEGORY_ICONS[c];
    for (const [key, icon] of Object.entries(KNOWN_CATEGORY_ICONS)) {
      if (c.includes(key)) return icon;
    }
    return '✨';
  };

  // Build dynamic list of categories present in menuItems for the Category Drawer
  const dynamicCategories = React.useMemo(() => {
    const catMap = new Map();
    catMap.set('all', { id: 'all', label: 'All Dishes', icon: '🍽️' });

    // Default categories list
    const defaultCats = [
      { id: 'starters', label: 'Starters', icon: '🥗' },
      { id: 'main course', label: 'Main Course', icon: '🍲' },
      { id: 'curries', label: 'Curries', icon: '🍛' },
      { id: 'biryani', label: 'Biryani', icon: '🍚' },
      { id: 'breads', label: 'Breads', icon: '🫓' },
      { id: 'south indian', label: 'South Indian', icon: '🥞' },
      { id: 'desserts', label: 'Desserts', icon: '🍨' },
      { id: 'beverages', label: 'Beverages', icon: '🥤' }
    ];
    defaultCats.forEach(cat => catMap.set(cat.id, cat));

    // Extract any extra custom categories created by Admin
    (menuItems || []).forEach(item => {
      if (item && item.category) {
        const trimmed = item.category.trim();
        const lowerKey = trimmed.toLowerCase();
        if (!catMap.has(lowerKey)) {
          catMap.set(lowerKey, {
            id: lowerKey,
            label: trimmed,
            icon: getCategoryIcon(trimmed)
          });
        }
      }
    });

    return Array.from(catMap.values());
  }, [menuItems]);

  const matchCategory = (itemCategory, selectedCat) => {
    if (!selectedCat || selectedCat === 'all' || selectedCat === 'All') return true;
    const catLower = (itemCategory || 'Main Course').toLowerCase().trim();
    const selLower = selectedCat.toLowerCase().trim();

    if (selLower === 'mains' || selLower === 'main course' || selLower === 'main-course' || selLower === 'maincourse') {
      return (
        catLower.includes('main') ||
        catLower.includes('curry') ||
        catLower.includes('curries') ||
        catLower.includes('biryani') ||
        catLower.includes('gravy') ||
        catLower.includes('thali') ||
        catLower.includes('combo') ||
        catLower.includes('rice') ||
        catLower === 'main course' ||
        catLower === 'mains' ||
        !itemCategory
      );
    }
    if (selLower === 'starters' || selLower === 'starter') return catLower.includes('starter') || catLower.includes('appetizer') || catLower.includes('tandoori') || catLower.includes('kebab');
    if (selLower === 'curries' || selLower === 'curry') return catLower.includes('curry') || catLower.includes('curries') || catLower.includes('gravy') || catLower.includes('main');
    if (selLower === 'biryani') return catLower.includes('biryani') || catLower.includes('pulao') || catLower.includes('rice') || catLower.includes('main');
    if (selLower === 'breads' || selLower === 'bread') return catLower.includes('bread') || catLower.includes('roti') || catLower.includes('naan') || catLower.includes('paratha');
    if (selLower === 'desserts' || selLower === 'dessert') return catLower.includes('dessert') || catLower.includes('sweet') || catLower.includes('ice');
    if (selLower === 'beverages' || selLower === 'beverage') return catLower.includes('beverage') || catLower.includes('drink') || catLower.includes('shake') || catLower.includes('juice');
    if (selLower === 'southindian' || selLower === 'south indian') return catLower.includes('south') || catLower.includes('dosa') || catLower.includes('idli');

    return catLower === selLower || catLower.includes(selLower) || selLower.includes(catLower);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = matchCategory(item.category, selectedCategory);
    const matchesVeg = vegOnly ? item.isVeg : true;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Price filter matching
    let matchesPrice = true;
    const price = Number(item.price || 0);
    if (priceFilter === 'under200') matchesPrice = price <= 200;
    else if (priceFilter === 'under500') matchesPrice = price <= 500;
    else if (priceFilter === '500plus') matchesPrice = price > 500;

    // Spice filter matching
    let matchesSpice = true;
    if (spiceFilter !== 'all') {
      const itemSpice = String(item.spice || item.spiceLevel || 'Medium').toLowerCase();
      matchesSpice = itemSpice.includes(spiceFilter.toLowerCase());
    }

    return matchesCategory && matchesVeg && matchesSearch && matchesPrice && matchesSpice;
  }).sort((a, b) => {
    if (priceFilter === 'lowHigh') return (Number(a.price) || 0) - (Number(b.price) || 0);
    if (priceFilter === 'highLow') return (Number(b.price) || 0) - (Number(a.price) || 0);
    return 0;
  });

  const totalCartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalCartPrice = calculateCartTotal(cart, menuItems);

  // Group filtered dishes dynamically by category
  const getNormalizedCategoryKey = (cat) => {
    const c = (cat || '').toLowerCase().trim();
    if (!c || c === 'main course' || c === 'mains' || c === 'main-course' || c.includes('main')) return 'Main Course';
    if (c.includes('starter')) return 'Starters';
    if (c.includes('biryani')) return 'Biryani';
    if (c.includes('bread') || c.includes('roti') || c.includes('naan')) return 'Breads';
    if (c.includes('south')) return 'South Indian';
    if (c.includes('dessert') || c.includes('sweet')) return 'Desserts';
    if (c.includes('beverage') || c.includes('drink')) return 'Beverages';
    if (c.includes('curry') || c.includes('curries')) return 'Curries';
    return (cat || '').trim() || 'Main Course';
  };

  const groupedDishes = React.useMemo(() => {
    const groupsMap = {};

    filteredItems.forEach(item => {
      const normCat = getNormalizedCategoryKey(item.category);
      if (!groupsMap[normCat]) {
        groupsMap[normCat] = [];
      }
      groupsMap[normCat].push(item);
    });

    return Object.keys(groupsMap).map(catName => ({
      key: catName,
      icon: getCategoryIcon(catName),
      items: groupsMap[catName]
    }));
  }, [filteredItems]);

  const handleSendOrderToChefAndManager = async (e) => {
    e.preventDefault();
    if (isClosedNow) {
      alert(statusDetails.closedMessage);
      return;
    }
    if (totalCartCount === 0) return;

    setIsSubmittingOrder(true);
    const orderItems = Object.entries(cart).map(([id, qty]) => {
      const dish = findItemInCatalog(id, menuItems);
      return {
        name: dish ? dish.name : id,
        price: dish ? dish.price : 0,
        quantity: qty
      };
    });

    const activeTable = tableNum || localStorage.getItem('flavora_scanned_table') || 'T-10';
    const generatedOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderPayload = {
      orderId: generatedOrderId,
      table: activeTable,
      type: 'Dine-In',
      customer: guestName.trim() || 'Guest Diner',
      notes: chefNotes.trim(),
      items: orderItems,
      total: totalCartPrice,
      status: 'Placed'
    };

    try {
      // 1. Send HTTP POST request to backend API
      const persistedOrder = await api.createOrder(orderPayload);

      // 2. SUCCESS! The backend persisted the order document in MongoDB database.
      setIsSubmittingOrder(false);
      setIsCheckoutModalOpen(false);
      const cartKey = getCartStorageKey(activeTable || tableNum);
      try {
        localStorage.removeItem(cartKey);
        localStorage.removeItem('flavora_active_cart'); // Clear legacy single key if exists
      } catch (e) { }
      setCart({});
      window.dispatchEvent(new Event('flavora_cart_updated'));
      if (guestName.trim()) {
        try {
          const cleanTbl = String(activeTable || tableNum || 'GENERAL').toUpperCase().replace(/[^A-Z0-9-]/g, '');
          sessionStorage.setItem(`flavora_guest_name_${cleanTbl}`, guestName.trim());
          sessionStorage.setItem(`flavora_order_submitted_${cleanTbl}`, 'true');
        } catch (e) { }
      }
      setChefNotes('');

      const backendOrderId = persistedOrder?.orderId || persistedOrder?._id || 'ORD-SUCCESS';

      // 3. Display order success modal ONLY with the backend-returned order ID
      setOrderSuccessMsg({
        table: persistedOrder?.table || activeTable,
        orderId: backendOrderId,
        total: persistedOrder?.total || totalCartPrice
      });

      // 4. Update local storage & table states
      try {
        const cleanT = activeTable.toUpperCase().replace('TABLE', '').replace('T-', '').trim();
        const savedOrders = Array.isArray(placedTableOrders) ? [...placedTableOrders] : [];
        
        const formattedOrderObj = {
          orderId: backendOrderId,
          table: persistedOrder?.table || activeTable,
          customer: persistedOrder?.customer || (guestName.trim() || 'Guest Diner'),
          status: persistedOrder?.status || 'Placed',
          items: persistedOrder?.items || orderItems,
          totalAmount: persistedOrder?.total || persistedOrder?.totalAmount || totalCartPrice,
          chefNotes: persistedOrder?.notes || persistedOrder?.chefNotes || chefNotes
        };

        const existingIdx = savedOrders.findIndex(o => (o.orderId || o.id) === backendOrderId);
        let newPlacedOrders = [];
        if (existingIdx >= 0) {
          newPlacedOrders = savedOrders;
          newPlacedOrders[existingIdx] = formattedOrderObj;
        } else {
          newPlacedOrders = [formattedOrderObj];
        }

        setPlacedTableOrders(newPlacedOrders);

        localStorage.setItem(`flavora_table_orders_${activeTable}`, JSON.stringify(newPlacedOrders));
        localStorage.setItem(`flavora_table_orders_T-${cleanT}`, JSON.stringify(newPlacedOrders));

        // Update local table list
        const savedTables = localStorage.getItem('flavora_tables');
        let tablesList = savedTables ? JSON.parse(savedTables) : [];
        if (Array.isArray(tablesList) && tablesList.length > 0) {
          tablesList = tablesList.map(t => {
            const tClean = (t.num || '').replace(/[^0-9]/g, '');
            const activeClean = activeTable.replace(/[^0-9]/g, '');
            if (tClean && activeClean && parseInt(tClean, 10) === parseInt(activeClean, 10)) {
              return {
                ...t,
                status: 'Occupied',
                cleaningUntil: null,
                orderId: backendOrderId,
                amount: `₹${totalCartPrice}`,
                customer: guestName.trim() || 'QR Diner'
              };
            }
            return t;
          });
          localStorage.setItem('flavora_tables', JSON.stringify(tablesList));
        }
      } catch (e) { }

      window.dispatchEvent(new Event('flavora_tables_updated'));
    } catch (err) {
      // API call failed! DO NOT show fake success modal or fake order ID!
      setIsSubmittingOrder(false);
      console.error('Failed to submit order to database:', err);
      alert(`Order placement failed: ${err.message || 'Server connection error. Please try again.'}`);
    }
  };

  const isFixedTableBarActive = Boolean(tableNum && !tableCleaningInfo?.isCleaning);

  if (isMobile) {
    return (
      <div className="menu-page mobile-customer-view" style={{ position: 'relative', backgroundColor: '#F8FAFC', color: '#0F172A' }}>
        <CustomerMobileMenuView
          brandName={brandName}
          tableNum={tableNum}
          menuItems={menuItems}
          filteredItems={filteredItems}
          groupedDishes={groupedDishes}
          dynamicCategories={dynamicCategories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          vegOnly={vegOnly}
          setVegOnly={setVegOnly}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          priceFilter={priceFilter}
          setPriceFilter={setPriceFilter}
          spiceFilter={spiceFilter}
          setSpiceFilter={setSpiceFilter}
          cart={cart}
          totalCartCount={totalCartCount}
          totalCartPrice={totalCartPrice}
          handleAddToCart={handleAddToCart}
          handleDecreaseQty={handleDecreaseQty}
          setSelectedDishForDetail={setSelectedDishForDetail}
          setIsCheckoutModalOpen={setIsCheckoutModalOpen}
          setIsCustomerOrdersModalOpen={setIsCustomerOrdersModalOpen}
          setIsCategoryDrawerOpen={setIsCategoryDrawerOpen}
          outOfStockItems={outOfStockItems}
          placedTableOrders={placedTableOrders}
          isClosedNow={isClosedNow}
          statusDetails={statusDetails}
        />

        {/* Category Drawer Modal */}
        {isCategoryDrawerOpen && (
          <div className="admin-modal-backdrop" onClick={() => setIsCategoryDrawerOpen(false)} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0', zIndex: 10000 }}>
            <div
              className="admin-modal-card"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '520px',
                width: '100%',
                borderRadius: '24px 24px 0 0',
                overflow: 'hidden',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.35)',
                backgroundColor: '#FFFFFF'
              }}
            >
              <div style={{ backgroundColor: '#0F2A1D', color: '#FFFFFF', padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Utensils size={22} strokeWidth={2.2} color="#FF8A00" />
                  <h3 style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                    Select Menu Category
                  </h3>
                </div>
                <button className="admin-modal-close" onClick={() => setIsCategoryDrawerOpen(false)} style={{ color: '#FFFFFF' }}>×</button>
              </div>

              <div style={{ padding: '1.25rem', backgroundColor: '#FAF6EE', maxHeight: '65vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {dynamicCategories.map((cat) => {
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setIsCategoryDrawerOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '1rem 0.6rem',
                          borderRadius: '14px',
                          border: '2px solid',
                          borderColor: isActive ? '#FF8A00' : '#EAE3D2',
                          backgroundColor: isActive ? '#1E4636' : '#FFFFFF',
                          color: isActive ? '#FFFFFF' : '#0F2A1D',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          boxShadow: isActive ? '0 6px 16px rgba(30,70,54,0.35)' : '0 2px 6px rgba(0,0,0,0.03)',
                          transition: 'all 0.15s ease',
                          gap: '0.4rem'
                        }}
                      >
                        <span style={{ fontSize: '1.6rem' }}>{cat.icon}</span>
                        <span style={{ textAlign: 'center', lineHeight: 1.2 }}>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ padding: '0.85rem 1.4rem', backgroundColor: '#FFFFFF', borderTop: '1px solid #EAE3D2', textAlign: 'center' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsCategoryDrawerOpen(false)}
                  style={{ width: '100%', borderRadius: '10px', fontWeight: 800, padding: '0.65rem', borderColor: '#1E4636', color: '#1E4636' }}
                >
                  Close Category Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dish Detailed Info Modal */}
        {selectedDishForDetail && (
          <CustomerDishDetailModal
            dish={selectedDishForDetail}
            onClose={() => setSelectedDishForDetail(null)}
            onAddToCart={(dishObj, qty) => {
              const id = dishObj.id || dishObj._id;
              const currentQty = cart[id] || 0;
              const newCart = { ...cart, [id]: currentQty + qty };
              updateCartState(newCart);
            }}
            language={currentLanguage}
          />
        )}

        {/* Real-time Order Tracking Modal */}
        {isOrderTrackingOpen && (
          <CustomerOrderTrackingModal
            activeOrder={placedTableOrders[0] || null}
            tableNum={tableNum}
            onClose={() => setIsOrderTrackingOpen(false)}
            onAddMoreItems={() => setIsOrderTrackingOpen(false)}
            onViewBill={() => {
              setIsOrderTrackingOpen(false);
              setIsBillModalOpen(true);
            }}
          />
        )}

        {/* Live Running Bill Modal */}
        {isBillModalOpen && (
          <CustomerBillModal
            activeOrder={placedTableOrders[0] || null}
            tableNum={tableNum}
            onClose={() => setIsBillModalOpen(false)}
            onPaymentSuccess={() => setAppliedCoupon(null)}
            appliedCoupon={appliedCoupon}
            setAppliedCoupon={setAppliedCoupon}
            loyaltyPoints={250}
            brandSettings={{ brandName }}
          />
        )}

        {/* Engagement Modal */}
        {isEngagementModalOpen && (
          <CustomerEngagementModal
            activeTab={engagementTab}
            onClose={() => setIsEngagementModalOpen(false)}
            activeOrder={placedTableOrders[0] || null}
            tableNum={tableNum}
            currentLanguage={currentLanguage}
            onLanguageChange={(lang) => setCurrentLanguage(lang)}
          />
        )}

        {/* Customer Mobile Bottom Nav */}
        <CustomerBottomNav
          activeTab={customerNavTab}
          onSelectTab={(tab) => {
            setCustomerNavTab(tab);
            if (tab === 'menu') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (tab === 'orders') {
              setIsOrderTrackingOpen(true);
            } else if (tab === 'bill') {
              setIsBillModalOpen(true);
            } else if (tab === 'more') {
              setEngagementTab('rating');
              setIsEngagementModalOpen(true);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="menu-page" style={{ position: 'relative', backgroundColor: '#FFFDF8', color: '#1A202C', paddingTop: isFixedTableBarActive ? '48px' : '0', paddingBottom: totalCartCount > 0 ? '6rem' : '0' }}>

      {/* ================= TABLE CLEANING NOTICE OVERLAY ================= */}
      {tableCleaningInfo?.isCleaning && (
        <div
          style={{
            backgroundColor: '#FFFBEB',
            borderBottom: '3px solid #F59E0B',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#FEF3C7', padding: '0.6rem', borderRadius: '12px', color: '#D97706' }}>
              <Sparkles size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#92400E' }}>
                Table {tableCleaningInfo.tableNum} is currently being prepared.
              </div>
              <div style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: 600, marginTop: '0.15rem' }}>
                Please wait until the table is available.
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FEF3C7', padding: '0.45rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, color: '#D97706', fontFamily: 'monospace' }}>
            ⏱️ {Math.floor(tableCleaningInfo.remainingSec / 60)}m {tableCleaningInfo.remainingSec % 60}s
          </div>
        </div>
      )}

      {/* ================= CUSTOMER SEATED QR BADGE STRIP (SINGLE LINE FIT AT TOP) ================= */}
      {isFixedTableBarActive && (
        <div className="customer-seated-bar">
          {/* Left Side: Table Badge & Seated Text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flexShrink: 1 }}>
            <span style={{ backgroundColor: '#E07A3C', color: '#FFFFFF', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>
              Table {tableNum}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#C8E6C9', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              📍 Seated
            </span>
          </div>

          {/* Right Side: My Orders (if any) + Cart Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
            {placedTableOrders.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCustomerOrdersModalOpen(true)}
                style={{
                  backgroundColor: '#F2C14E',
                  color: '#0F2A1D',
                  border: 'none',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <ShoppingBag size={12} />
                <span>Orders ({placedTableOrders.length})</span>
              </button>
            )}

            {/* Red Oval Cart Badge */}
            <button
              type="button"
              onClick={() => setIsCheckoutModalOpen(true)}
              style={{
                backgroundColor: '#B91C1C',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(185, 28, 28, 0.4)'
              }}
            >
              <ShoppingBag size={13} />
              <span>Cart {totalCartCount > 0 ? `(${totalCartCount})` : ''}</span>
            </button>
          </div>
        </div>
      )}

      {/* Restaurant Closed Banner (Shown when restaurant is closed) */}
      {isClosedNow && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1.5px solid #FCA5A5',
          borderRadius: '14px',
          padding: '0.85rem 1.25rem',
          margin: '1rem auto 0.5rem auto',
          maxWidth: '1200px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          boxShadow: '0 4px 16px rgba(220, 38, 38, 0.08)'
        }}>
          <div style={{ backgroundColor: '#DC2626', color: '#FFFFFF', padding: '0.55rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span>🔴 RESTAURANT IS CURRENTLY CLOSED FOR ORDERS</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#7F1D1D', margin: '0.2rem 0 0 0', fontWeight: 600 }}>
              {statusDetails.closedMessage}
            </p>
          </div>
        </div>
      )}

      {/* Scan QR Required Banner (Shown when customer opens menu without scanning a Table QR code) */}
      {!tableNum && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1.5px solid #FCD34D',
          borderRadius: '14px',
          padding: '0.85rem 1.25rem',
          margin: '1rem auto 0.5rem auto',
          maxWidth: '1200px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          boxShadow: '0 4px 16px rgba(245, 158, 11, 0.08)'
        }}>
          <div style={{ backgroundColor: '#F59E0B', color: '#FFFFFF', padding: '0.55rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <QrCode size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#92400E', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span>📲 Scan Table QR Code to Place an Order</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#78350F', margin: '0.2rem 0 0 0', fontWeight: 600 }}>
              Ordering is available exclusively for Dine-In guests. Please scan the QR code on your dining table to unlock dish ordering.
            </p>
          </div>
        </div>
      )}

      {/* Active Table Order Info Banner */}
      {tableNum && tableOccupiedInfo && tableOccupiedInfo.isOccupied && (
        <div style={{
          backgroundColor: '#F0FDF4',
          border: '1.5px solid #86EFAC',
          borderRadius: '14px',
          padding: '0.85rem 1.25rem',
          margin: '1rem auto 0.5rem auto',
          maxWidth: '1200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
          boxShadow: '0 4px 16px rgba(22, 101, 52, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ backgroundColor: '#166534', color: '#FFFFFF', padding: '0.55rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <span>📍 Seated at Table {tableNum}</span>
                <span style={{ backgroundColor: '#DCFCE7', color: '#166534', fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: 800, border: '1px solid #86EFAC' }}>
                  🟢 Active Session
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#15803D', margin: '0.2rem 0 0 0', fontWeight: 600 }}>
                You are currently ordering for Table {tableNum}. Feel free to browse the menu and add dishes to your order anytime!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Alert Banner */}
      {orderSuccessMsg && (
        <div style={{ backgroundColor: '#DCFCE7', border: '1.5px solid #22C55E', color: '#166534', padding: '1rem 1.5rem', margin: '1.5rem auto', maxWidth: '800px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
          <CheckCircle2 size={28} color="#22C55E" style={{ margin: '0 auto 0.5rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#166534' }}>
            🎉 Order Sent to Kitchen & Manager!
          </h3>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>
            Order <strong>#{orderSuccessMsg.orderId}</strong> for <strong>{orderSuccessMsg.table}</strong> has been transmitted. Total: <strong>₹{orderSuccessMsg.total}</strong>
          </p>
          <button className="btn btn-outline" onClick={() => setOrderSuccessMsg(null)} style={{ marginTop: '0.75rem', padding: '0.35rem 1rem', fontSize: '0.8rem', backgroundColor: '#FFFFFF' }}>
            Dismiss
          </button>
        </div>
      )}

      {/* ================= 1. EDITORIAL PAGE HERO SECTION ================= */}
      <section style={{ backgroundColor: '#FAF6EE', padding: '1.25rem 1.5rem 1.25rem 1.5rem', textAlign: 'center', borderBottom: '1px solid #EAE3D2' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontFamily: "var(--font-heading), 'Poppins', 'Inter', sans-serif", fontWeight: 800, color: '#1E4636', margin: '0 0 0.75rem 0', lineHeight: 1.15 }}>
            Dive Into Delicious Meal Dishes
          </h1>

          {/* Dynamic Single Source of Truth Horizontal Dish Strip */}
          <MenuDishStrip menuItems={menuItems} />

        </div>
      </section>

      {/* ================= 2. SEARCH & VEG TOGGLE BAR ================= */}
      <section style={{ backgroundColor: '#FAF6EE', padding: '1rem 1.25rem', borderBottom: '1px dashed #E2D7C5' }}>
        <div className="customer-filter-bar-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Search Box */}
          <div style={{ position: 'relative', flexGrow: 1, minWidth: 0, width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="text"
              placeholder="Search dishes, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                paddingLeft: '2.6rem',
                paddingRight: '1rem',
                borderRadius: '9999px',
                border: '1.5px solid #D8CEBC',
                backgroundColor: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Filters Group (Veg Toggle + Price Dropdown + Spice Level Dropdown) */}
          <div className="customer-filter-scroll-group">

            {/* Veg Only Toggle Switch */}
            <div
              onClick={() => setVegOnly(!vegOnly)}
              title={vegOnly ? "Showing Veg Only dishes (Click to show all)" : "Click to filter Veg Only dishes"}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                padding: '0.45rem 0.85rem',
                borderRadius: '16px',
                border: '1.5px solid #CBD5E1',
                cursor: 'pointer',
                userSelect: 'none',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                height: '42px',
                boxSizing: 'border-box'
              }}
            >
              {/* Horizontal Pill Track */}
              <div
                style={{
                  width: '46px',
                  height: '16px',
                  borderRadius: '10px',
                  backgroundColor: vegOnly ? '#DCFCE7' : '#E2E8F0',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background-color 0.25s ease'
                }}
              >
                {/* Sliding Green Veg Square Knob */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '7px',
                    border: '2px solid #166534',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    position: 'absolute',
                    top: '-4px',
                    left: vegOnly ? '24px' : '-2px',
                    transition: 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {/* Center Green Dot */}
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#166534'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Price Range Filter Dropdown */}
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '16px',
                border: '1.5px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
                outline: 'none',
                height: '42px',
                flexShrink: 0,
                boxSizing: 'border-box'
              }}
            >
              <option value="all">💰 All Prices</option>
              <option value="under200">Under ₹200</option>
              <option value="under500">Under ₹500</option>
              <option value="500plus">₹500+</option>
              <option value="lowHigh">Price: Low to High</option>
              <option value="highLow">Price: High to Low</option>
            </select>

            {/* Spice Level Filter Dropdown */}
            <select
              value={spiceFilter}
              onChange={(e) => setSpiceFilter(e.target.value)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '16px',
                border: '1.5px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
                outline: 'none',
                height: '42px',
                flexShrink: 0,
                boxSizing: 'border-box'
              }}
            >
              <option value="all">🌶️ All Spice Levels</option>
              <option value="Mild">Mild</option>
              <option value="Medium">Medium</option>
              <option value="Spicy">Spicy</option>
            </select>

          </div>

        </div>
      </section>

      {/* ================= 3. ALL DISHES EDITORIAL LIST GROUPED BY CATEGORY ================= */}
      <section style={{ backgroundColor: '#FAF6EE', padding: '2rem 1.5rem 1.5rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Centered Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#EBF4F0', marginBottom: '0.5rem' }}>
              <Sparkles size={18} color="#1E4636" />
            </div>
            <h2 style={{ fontSize: '2.2rem', fontFamily: "var(--font-heading), 'Poppins', 'Inter', sans-serif", fontWeight: 800, color: '#1E4636', margin: 0 }}>
              {brandName} Culinary Special Menu
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.92rem', marginTop: '0.3rem' }}>
              Hand-crafted gourmet recipes, clay-roasted kebabs, and authentic royal flavors.
            </p>
          </div>

          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px dashed #D8CEBC' }}>
              <Utensils size={40} style={{ color: '#94A3B8', marginBottom: '1rem' }} />
              <h3 style={{ color: '#1E4636', fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>No dishes found</h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Try adjusting your search query or category filter.</p>
            </div>
          ) : (
            <div>
              {groupedDishes.map(group => (
                <div key={group.key} style={{ marginBottom: '2rem' }}>

                  {/* Category Alignment Section Title Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', borderBottom: '2px solid #EAE3D2', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>{group.icon}</span>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1E4636', margin: 0, fontFamily: "var(--font-heading), 'Poppins', sans-serif" }}>
                      {group.key}
                    </h3>
                  </div>

                  {/* 2-Column Clean Grid of Aligned Dish Rows under this Category */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.25rem 2rem' }}>
                    {group.items.map(item => {
                      const qty = cart[item.id] || 0;
                      const itemId = item._id || item.id;
                      const isOutInStore = outOfStockItems.includes(itemId) || outOfStockItems.includes(item.name);
                      const isAvailable = item.available !== false && item.isAvailable !== false && !isOutInStore;

                      return (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.85rem',
                            paddingBottom: '1.25rem',
                            borderBottom: '1px dashed #E2D7C5',
                            position: 'relative'
                          }}
                        >
                          {/* Left: Thumbnail Image */}
                          <div
                            onClick={() => setSelectedDishForDetail(item)}
                            style={{ width: '68px', height: '68px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', cursor: 'pointer' }}
                          >
                            <img
                              src={resolveDishImageUrl(item)}
                              alt=""
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '/hero_dish_2.png';
                              }}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isAvailable ? 1 : 0.6 }}
                            />
                            {!isAvailable && (
                              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#FFFFFF', backgroundColor: '#DC2626', padding: '2px 5px', borderRadius: '4px' }}>OFFLINE</span>
                              </div>
                            )}
                          </div>

                          {/* Middle: Dish Info */}
                          <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                              {/* Veg / Non-Veg Indicator */}
                              <span style={{ display: 'inline-block', width: '14px', height: '14px', border: `2px solid ${item.isVeg ? '#166534' : '#DC2626'}`, borderRadius: '3px', position: 'relative', flexShrink: 0 }}>
                                <span style={{ position: 'absolute', inset: '2px', backgroundColor: item.isVeg ? '#166534' : '#DC2626', borderRadius: '50%' }}></span>
                              </span>

                              <h3
                                onClick={() => setSelectedDishForDetail(item)}
                                style={{ fontSize: '1rem', fontWeight: 800, color: '#0F2A1D', margin: 0, fontFamily: "var(--font-heading), 'Poppins', 'Inter', sans-serif", lineHeight: 1.25, cursor: 'pointer' }}
                              >
                                {item.name}
                              </h3>

                              {item.bestseller && (
                                <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '0.64rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '9999px', border: '1px solid #FCD34D' }}>
                                  ⭐ Best
                                </span>
                              )}
                            </div>

                            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 0.35rem 0', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {item.desc || 'Prepared fresh with premium ingredients & hand-ground spices.'}
                            </p>

                            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                              ⏱️ {item.prepTime || '15 mins'} • {item.spice || 'Medium'}
                            </div>
                          </div>

                          {/* Right: Price & Interactive Action */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1E4636' }}>
                              ₹{item.price}
                            </span>

                            {!isAvailable ? (
                              <button
                                type="button"
                                disabled
                                style={{
                                  backgroundColor: '#CBD5E1',
                                  color: '#64748B',
                                  cursor: 'not-allowed',
                                  opacity: 0.85,
                                  border: '1px solid #94A3B8',
                                  boxShadow: 'none',
                                  fontWeight: 700,
                                  fontSize: '0.78rem',
                                  padding: '0.35rem 0.85rem',
                                  borderRadius: '8px'
                                }}
                              >
                                Out of Stock
                              </button>
                            ) : !tableNum ? (
                              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, fontStyle: 'italic', backgroundColor: '#F1F5F9', padding: '0.3rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                                Scan QR to Order
                              </span>
                            ) : qty > 0 ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#1E4636', color: '#FFFFFF', padding: '0.2rem 0.5rem', borderRadius: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleDecreaseQty(item.id)}
                                  style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                                >
                                  <Minus size={14} />
                                </button>
                                <span style={{ fontWeight: 800, fontSize: '0.88rem', minWidth: '18px', textAlign: 'center' }}>{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(item.id)}
                                  style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddToCart(item.id)}
                                style={{
                                  backgroundColor: '#1E4636',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '0.45rem 1.25rem',
                                  fontWeight: 800,
                                  fontSize: '0.82rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  letterSpacing: '0.04em',
                                  boxShadow: '0 2px 8px rgba(30, 70, 54, 0.25)',
                                  transition: 'transform 0.15s ease'
                                }}
                              >
                                <span>ADD</span>
                              </button>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </section>



      {/* Swiggy-Style Circular Floating MENU Button at Bottom-Right (Orange, Icon Only) */}
      <button
        type="button"
        onClick={() => setIsCategoryDrawerOpen(true)}
        aria-label="Open Menu Categories"
        className="customer-floating-menu-btn"
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 122, 0, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 122, 0, 0.45)';
        }}
      >
        <UtensilsCrossed size={26} strokeWidth={2.4} color="#FFFFFF" />
      </button>



      {/* ================= 6. CATEGORY SELECTION BOTTOM DRAWER ================= */}
      {isCategoryDrawerOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsCategoryDrawerOpen(false)} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0', zIndex: 10000 }}>
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              borderRadius: '24px 24px 0 0',
              overflow: 'hidden',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.35)',
              backgroundColor: '#FFFFFF'
            }}
          >
            {/* Drawer Header */}
            <div style={{ backgroundColor: '#0F2A1D', color: '#FFFFFF', padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Utensils size={22} strokeWidth={2.2} color="#FF8A00" />
                <h3 style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                  Select Menu Category
                </h3>
              </div>
              <button className="admin-modal-close" onClick={() => setIsCategoryDrawerOpen(false)} style={{ color: '#FFFFFF' }}>×</button>
            </div>

            {/* Categories Grid List */}
            <div style={{ padding: '1.25rem', backgroundColor: '#FAF6EE', maxHeight: '65vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {dynamicCategories.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setIsCategoryDrawerOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem 0.6rem',
                        borderRadius: '14px',
                        border: '2px solid',
                        borderColor: isActive ? '#FF8A00' : '#EAE3D2',
                        backgroundColor: isActive ? '#1E4636' : '#FFFFFF',
                        color: isActive ? '#FFFFFF' : '#0F2A1D',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        boxShadow: isActive ? '0 6px 16px rgba(30,70,54,0.35)' : '0 2px 6px rgba(0,0,0,0.03)',
                        transition: 'all 0.15s ease',
                        gap: '0.4rem'
                      }}
                    >
                      <span style={{ fontSize: '1.6rem' }}>{cat.icon}</span>
                      <span style={{ textAlign: 'center', lineHeight: 1.2 }}>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.4rem', backgroundColor: '#FFFFFF', borderTop: '1px solid #EAE3D2', textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsCategoryDrawerOpen(false)}
                style={{ width: '100%', borderRadius: '10px', fontWeight: 800, padding: '0.65rem', borderColor: '#1E4636', color: '#1E4636' }}
              >
                Close Category Menu
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= 7. CHECKOUT MODAL FOR TABLE ORDERING ================= */}
      {isCheckoutModalOpen && (
        <div className="admin-modal-backdrop customer-qr-checkout-backdrop" onClick={() => setIsCheckoutModalOpen(false)}>
          <div
            className="admin-modal-card customer-qr-checkout-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header customer-qr-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: '1 1 auto' }}>
                <ChefHat size={22} color="#FF8A00" style={{ flexShrink: 0 }} />
                <h3 className="admin-modal-title customer-qr-modal-title">
                  {tableNum ? `Send Order — Table ${tableNum}` : 'Review Cart & Send Order'}
                </h3>
              </div>
              <button
                type="button"
                className="admin-modal-close customer-qr-modal-close"
                onClick={() => setIsCheckoutModalOpen(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSendOrderToChefAndManager} className="customer-qr-modal-form">

              {/* Order Items Summary */}
              <div className="customer-qr-dishes-box">
                <div className="customer-qr-dishes-header">
                  <span className="customer-qr-dishes-title">{tableNum ? `SELECTED DISHES (TABLE ${tableNum}):` : 'SELECTED DISHES IN YOUR CART:'}</span>
                  <div className="customer-qr-dishes-actions">
                    <span className="customer-qr-dish-count-badge">
                      {totalCartCount} {totalCartCount === 1 ? 'Dish' : 'Dishes'}
                    </span>
                  </div>
                </div>

                <div className="customer-qr-dishes-list">
                  {Object.entries(cart).map(([id, qty]) => {
                    const dish = findItemInCatalog(id, menuItems);
                    return dish ? (
                      <div key={id} className="customer-qr-cart-row">
                        {/* Left: Dish Name & Unit Price */}
                        <div className="customer-qr-cart-info">
                          <div className="customer-qr-cart-name">
                            {dish.name}
                          </div>
                          <div className="customer-qr-cart-unit-price">₹{dish.price} each</div>
                        </div>

                        {/* Right: Quantity Adjuster & Row Total */}
                        <div className="customer-qr-cart-controls">
                          <div className="customer-qr-qty-picker">
                            <button
                              type="button"
                              onClick={() => handleDecreaseQty(dish.id || id)}
                              className="customer-qr-qty-btn"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="customer-qr-qty-val">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(dish.id || id)}
                              className="customer-qr-qty-btn"
                              aria-label="Increase quantity"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <span className="customer-qr-row-price">₹{dish.price * qty}</span>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>

                <div className="customer-qr-total-row">
                  <span className="customer-qr-total-label">Total Amount Payable:</span>
                  <span>₹{totalCartPrice}</span>
                </div>
              </div>

              {/* Table Number Display (Locked from QR scan - strictly non-editable) */}
              <div className="admin-form-group mb-3">
                <label className="form-label" style={{ fontWeight: 800, fontSize: '0.84rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Lock size={14} color="#1E4636" />
                  <span>Assigned Dining Table</span>
                </label>

                {tableNum ? (
                  <div style={{
                    backgroundColor: '#FAF6EE',
                    border: '1.5px solid #E5DBC8',
                    borderRadius: '10px',
                    padding: '0.65rem 0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        backgroundColor: '#E07A3C',
                        color: '#FFFFFF',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.86rem',
                        fontWeight: 900,
                        letterSpacing: '0.02em'
                      }}>
                        Table {tableNum}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: '#FEF2F2',
                    border: '1.5px solid #FCA5A5',
                    borderRadius: '10px',
                    padding: '0.65rem 0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#991B1B',
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}>
                    <QrCode size={16} color="#DC2626" />
                    <span>No Table QR Code scanned. Please scan your dining table's QR code.</span>
                  </div>
                )}
              </div>

              {/* Guest Name Input / Established Diner Badge */}
              {(() => {
                const cleanTblKey = String(tableNum || activeTable || 'GENERAL').toUpperCase().replace(/[^A-Z0-9-]/g, '');
                const isEstablishedSession = Boolean(
                  (Array.isArray(placedTableOrders) && placedTableOrders.length > 0) ||
                  sessionStorage.setItem && sessionStorage.getItem(`flavora_order_submitted_${cleanTblKey}`) === 'true'
                );

                if (isEstablishedSession && guestName.trim()) {
                  return (
                    <div className="admin-form-group mb-3">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem', color: '#64748B' }}>Diner Name</label>
                      <div style={{
                        backgroundColor: '#F0FDF4',
                        border: '1.5px solid #86EFAC',
                        borderRadius: '10px',
                        padding: '0.55rem 0.85rem',
                        color: '#166534',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span>👤 {guestName}</span>
                        <span style={{ fontSize: '0.72rem', backgroundColor: '#DCFCE7', padding: '0.15rem 0.45rem', borderRadius: '4px', color: '#15803D', fontWeight: 800 }}>
                          Table {tableNum} Guest
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="admin-form-group mb-3">
                    <label className="form-label" style={{ fontWeight: 700 }}>Your Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Deepak J."
                      value={guestName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGuestName(val);
                        try {
                          const cleanTbl = String(tableNum || 'GENERAL').toUpperCase().replace(/[^A-Z0-9-]/g, '');
                          sessionStorage.setItem(`flavora_guest_name_${cleanTbl}`, val.trim());
                        } catch (err) { }
                      }}
                      className="form-control"
                    />
                  </div>
                );
              })()}

              {/* Instructions for Chef */}
              <div className="admin-form-group mb-4">
                <label className="form-label" style={{ fontWeight: 700 }}>Special Cooking Instructions for Chef</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Less spicy, extra butter, no green chilis..."
                  value={chefNotes}
                  onChange={(e) => setChefNotes(e.target.value)}
                  className="form-control"
                  style={{ fontSize: '0.88rem', minHeight: '85px' }}
                />
              </div>

              {isClosedNow && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '0.7rem 0.9rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} color="#DC2626" />
                  <span>Restaurant is currently closed. You can add dishes to cart, but order placement is disabled while closed.</span>
                </div>
              )}

              <div className="customer-qr-footer-actions">
                <button
                  type="button"
                  className="btn btn-outline customer-qr-btn-secondary"
                  onClick={() => setIsCheckoutModalOpen(false)}
                >
                  <span>Add More Items</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingOrder || isClosedNow}
                  className="btn btn-primary customer-qr-btn-primary"
                  style={{
                    backgroundColor: isClosedNow ? '#94A3B8' : '#FF8A00',
                    borderColor: isClosedNow ? '#94A3B8' : '#FF8A00',
                    cursor: isClosedNow ? 'not-allowed' : 'pointer',
                    opacity: isClosedNow ? 0.7 : 1
                  }}
                >
                  <Send size={15} />
                  <span>{isClosedNow ? 'Closed for Orders' : (isSubmittingOrder ? 'Placing Order...' : 'Confirm & Place Order')}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= 8. CUSTOMER "MY TABLE ORDERS ONLY" MODAL ================= */}
      {isCustomerOrdersModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsCustomerOrdersModalOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '480px',
              width: '100%',
              borderRadius: '18px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.35)'
            }}
          >
            <div className="admin-modal-header" style={{ backgroundColor: '#0F2A1D', color: '#FFFFFF', padding: '1.25rem 1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ backgroundColor: '#E07A3C', color: '#FFFFFF', fontSize: '0.82rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                  Table {tableNum}
                </span>
                <h3 className="admin-modal-title" style={{ color: '#FFFFFF', fontSize: '1.1rem', margin: 0 }}>
                  My Table Ordered Items
                </h3>
              </div>
              <button className="admin-modal-close" onClick={() => setIsCustomerOrdersModalOpen(false)} style={{ color: '#FFFFFF' }}>×</button>
            </div>

            <div style={{ padding: '1.4rem', maxHeight: '75vh', overflowY: 'auto' }}>
              {placedTableOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B' }}>
                  <ShoppingBag size={36} color="#94A3B8" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div style={{ fontWeight: 700, color: '#1E4636' }}>No active orders placed for Table {tableNum}</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Browse the menu and add dishes to place an order.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {placedTableOrders.map((ord, idx) => {
                    const itemsList = Array.isArray(ord.items) ? ord.items : [];
                    
                    // Filter active non-cancelled items for total calculation
                    const activeItems = itemsList.filter(it => it.status !== 'CANCELLED' && it.status !== 'Cancelled');
                    const calculatedSum = activeItems.reduce((acc, it) => {
                      const q = Number(it.quantity || it.qty || it.count || 1);
                      const rawP = Number(it.price || it.unitPrice || 0);
                      const catalogMatch = (menuItems || []).find(m => (m.name || '').toLowerCase() === (it.name || '').toLowerCase());
                      const fp = rawP > 0 ? rawP : (catalogMatch ? Number(catalogMatch.price || 0) : 0);
                      return acc + (fp * q);
                    }, 0);

                    const displayTotal = calculatedSum;

                    // Collect unique cancelled dish names for explicit display
                    const cancelledNames = [];

                    itemsList.forEach(it => {
                      if (it.status === 'CANCELLED' || it.status === 'Cancelled') {
                        const name = it.name;
                        if (name && name !== 'Dish Item' && !cancelledNames.includes(name)) {
                          cancelledNames.push(name);
                        }
                      }
                    });

                    const noteText = ord.chefNotes || ord.notes || '';
                    if (noteText.includes('Cancelled dishes:')) {
                      const match = noteText.match(/Cancelled dishes:\s*([^|(]+)/i);
                      if (match && match[1]) {
                        const parts = match[1].split(',').map(s => s.trim()).filter(Boolean);
                        parts.forEach(p => {
                          let resolved = p;
                          if (/^[0-9a-fA-F]{24}$/.test(p)) {
                            const matchInItems = (ord.items || []).find(i => String(i._id || i.id || i.itemId || i.dishId || '') === p);
                            if (matchInItems && matchInItems.name) resolved = matchInItems.name;
                            else {
                              const matchInCat = (menuItems || []).find(m => String(m._id || m.id || m.rawId || m.dishId || '') === p);
                              if (matchInCat && matchInCat.name) resolved = matchInCat.name;
                              else resolved = '';
                            }
                          }
                          if (resolved && resolved !== 'Dish Item' && !cancelledNames.includes(resolved)) {
                            cancelledNames.push(resolved);
                          }
                        });
                      }
                    }

                    // Filter out cancellation metadata from chef notes
                    const cleanChefNote = (() => {
                      const n = (ord.chefNotes || ord.notes || '').trim();
                      if (!n) return '';
                      const parts = n.split('|').map(p => p.trim()).filter(p => 
                        p && 
                        !p.toLowerCase().includes('cancelled dishes') && 
                        !p.toLowerCase().includes('customer changed mind') && 
                        !p.toLowerCase().includes('dish item')
                      );
                      return parts.join(' | ');
                    })();

                    return (
                      <div key={ord.orderId || idx} style={{ backgroundColor: '#FAF6EE', border: '1.5px solid #EAE3D2', borderRadius: '14px', padding: '1rem 1.1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', borderBottom: '1px solid #EAE3D2', paddingBottom: '0.45rem' }}>
                          <div>
                            <span style={{ fontWeight: 800, color: '#1E4636', fontSize: '0.92rem' }}>#{ord.orderId || `ORD-${idx + 1}`}</span>
                            <span style={{ fontSize: '0.76rem', color: '#64748B', marginLeft: '0.5rem' }}>Dine-In • Table {tableNum}</span>
                          </div>
                          <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '9999px' }}>
                            ● {ord.status || 'Preparing in Kitchen'}
                          </span>
                        </div>

                        {/* Items List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.65rem' }}>
                          {itemsList.map((it, i) => {
                            const isCancelledItem = it.status === 'CANCELLED' || it.status === 'Cancelled';
                            const qty = Number(it.quantity || it.qty || it.count || 1);
                            const rawP = Number(it.price || it.unitPrice || 0);
                            const catalogMatch = (menuItems || []).find(m => (m.name || '').toLowerCase() === (it.name || '').toLowerCase());
                            const price = rawP > 0 ? rawP : (catalogMatch ? Number(catalogMatch.price || 0) : 0);
                            const itemTotal = price * qty;
                            const itemName = it.name || 'Dish';

                            return (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem', color: isCancelledItem ? '#94A3B8' : '#334155' }}>
                                <span style={{ textDecoration: isCancelledItem ? 'line-through' : 'none' }}>
                                  <strong style={{ color: isCancelledItem ? '#94A3B8' : '#E07A3C', marginRight: '0.35rem' }}>{qty}x</strong>
                                  {itemName}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span style={{ fontWeight: 700, color: isCancelledItem ? '#94A3B8' : '#1E4636', textDecoration: isCancelledItem ? 'line-through' : 'none' }}>₹{itemTotal}</span>
                                  {isCancelledItem && (
                                    <span style={{ fontSize: '0.68rem', fontWeight: 800, backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                                      ❌ Cancelled
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Explicit Cancelled Items Block */}
                        {cancelledNames.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.4rem', marginBottom: '0.65rem', padding: '0.5rem 0.65rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px' }}>
                            {cancelledNames.map((name, cIdx) => (
                              <div key={cIdx} style={{ fontSize: '0.82rem', fontWeight: 800, color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span>🔴 Cancelled:</span>
                                <span style={{ fontWeight: 900 }}>{name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Optional Custom Chef Note */}
                        {cleanChefNote && (
                          <div style={{ fontSize: '0.78rem', color: '#9A3412', backgroundColor: '#FFF7ED', padding: '0.4rem 0.6rem', borderRadius: '6px', marginBottom: '0.65rem' }}>
                            📝 Note: {cleanChefNote}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px dashed #D5C9B5', fontWeight: 900, color: '#0F2A1D', fontSize: '0.95rem' }}>
                          <span>Order Total</span>
                          <span style={{ color: '#E07A3C' }}>₹{displayTotal}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="admin-modal-footer" style={{ justifyContent: 'space-between', backgroundColor: '#F8FAFC' }}>
              <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
                📍 Table {tableNum} Dine-In Session
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsCustomerOrdersModalOpen(false)}
                  style={{ backgroundColor: '#FF8A00', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: '0.82rem', padding: '0.45rem 0.9rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                  + Add More Dishes
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsCustomerOrdersModalOpen(false)}
                  style={{ backgroundColor: '#1E4636', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: '0.82rem', padding: '0.45rem 0.9rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= 9. NEW CUSTOMER ENHANCEMENT MODALS ================= */}

      {/* Dish Detailed Info Modal */}
      {selectedDishForDetail && (
        <CustomerDishDetailModal
          dish={selectedDishForDetail}
          onClose={() => setSelectedDishForDetail(null)}
          onAddToCart={(dishObj, qty, options) => {
            const id = dishObj.id || dishObj._id;
            const currentQty = cart[id] || 0;
            const newCart = { ...cart, [id]: currentQty + qty };
            updateCartState(newCart);
          }}
          language={currentLanguage}
        />
      )}

      {/* Real-time Order Tracking Modal */}
      {isOrderTrackingOpen && (
        <CustomerOrderTrackingModal
          activeOrder={placedTableOrders[0] || null}
          tableNum={tableNum}
          onClose={() => setIsOrderTrackingOpen(false)}
          onAddMoreItems={() => {
            setIsOrderTrackingOpen(false);
            window.scrollTo({ top: 400, behavior: 'smooth' });
          }}
          onViewBill={() => {
            setIsOrderTrackingOpen(false);
            setIsBillModalOpen(true);
          }}
        />
      )}

      {/* Live Running Bill & Settlement Modal */}
      {isBillModalOpen && (
        <CustomerBillModal
          activeOrder={placedTableOrders[0] || null}
          tableNum={tableNum}
          onClose={() => setIsBillModalOpen(false)}
          onPaymentSuccess={() => {
            setAppliedCoupon(null);
          }}
          appliedCoupon={appliedCoupon}
          setAppliedCoupon={setAppliedCoupon}
          loyaltyPoints={250}
          brandSettings={{ brandName }}
        />
      )}

      {/* Engagement Modal (Rating, Table Booking, Referral, Language) */}
      {isEngagementModalOpen && (
        <CustomerEngagementModal
          activeTab={engagementTab}
          onClose={() => setIsEngagementModalOpen(false)}
          activeOrder={placedTableOrders[0] || null}
          tableNum={tableNum}
          currentLanguage={currentLanguage}
          onLanguageChange={(lang) => setCurrentLanguage(lang)}
        />
      )}

      {/* Customer Mobile Bottom Navigation Bar */}
      <CustomerBottomNav
        activeTab={customerNavTab}
        onSelectTab={(tab) => {
          setCustomerNavTab(tab);
          if (tab === 'menu') {
            window.scrollTo({ top: 400, behavior: 'smooth' });
          } else if (tab === 'orders') {
            setIsOrderTrackingOpen(true);
          } else if (tab === 'bill') {
            setIsBillModalOpen(true);
          } else if (tab === 'more') {
            setEngagementTab('rating');
            setIsEngagementModalOpen(true);
          }
        }}
      />

    </div>
  );
}
