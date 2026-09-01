import React, { useState, useEffect, useRef } from 'react';
import {
  ChefHat, Clock, CheckCircle2, AlertCircle, Flame, Bell, Volume2, VolumeX,
  Filter, Search, LogOut, Utensils, CheckSquare, Square, ShoppingBag,
  Sparkles, RefreshCw, Layers, XCircle, ShieldCheck, Eye, Award, TrendingUp,
  User, Check, ChevronRight, ChevronDown, X, Menu, BarChart3, Settings, Table2
} from 'lucide-react';
import { api } from '../../services/api';
import PowerOffSlide from '../PowerOffSlide';

import ChefKdsPassPage from './ChefKdsPassPage';
import ChefInventoryPage from './ChefInventoryPage';
import ChefHistoryPage from './ChefHistoryPage';
import ChefAnalyticsPage from './ChefAnalyticsPage';
import ChefProfilePage from './ChefProfilePage';
import ChefSettingsPage from './ChefSettingsPage';
import { useRestaurantBranding } from '../../context/RestaurantBrandingContext';

export default function ChefLayout({ setActivePage }) {
  const { brandName, brandLogo } = useRestaurantBranding();
  const nameParts = brandName.trim().split(' ');
  const firstNamePart = nameParts[0] || 'Flavora';
  const restNamePart = nameParts.slice(1).join(' ');

  const [activeTab, setActiveTab] = useState('chef-kds'); // 'chef-kds', 'chef-inventory', 'chef-history', 'chef-analytics'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [kitchenStatus, setKitchenStatus] = useState('active'); // 'active', 'busy'
  const [chefDutyStatus, setChefDutyStatus] = useState(() => {
    return localStorage.getItem('flavora_chef_duty_status') || 'LOGGED_IN';
  });

  useEffect(() => {
    const syncDutyStatus = () => {
      const saved = localStorage.getItem('flavora_chef_duty_status') || 'LOGGED_IN';
      setChefDutyStatus(saved);
    };
    syncDutyStatus();
    window.addEventListener('flavora_chef_duty_updated', syncDutyStatus);
    window.addEventListener('storage', syncDutyStatus);
    return () => {
      window.removeEventListener('flavora_chef_duty_updated', syncDutyStatus);
      window.removeEventListener('storage', syncDutyStatus);
    };
  }, []);

  const handleToggleChefDuty = () => {
    const nextStatus = chefDutyStatus === 'LOGGED_IN' ? 'LOGGED_OUT' : 'LOGGED_IN';
    setChefDutyStatus(nextStatus);
    localStorage.setItem('flavora_chef_duty_status', nextStatus);
    window.dispatchEvent(new Event('flavora_chef_duty_updated'));
    showToast(nextStatus === 'LOGGED_IN' ? '🟢 Chef Status: ON DUTY (Logged In)' : '🔴 Chef Status: OFF DUTY (Logged Out)');
  };

  // KDS Filters
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'placed', 'preparing', 'ready'
  const [searchQuery, setSearchQuery] = useState('');

  // Real-Time Orders & Menu State
  const [ordersList, setOrdersList] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_out_of_stock_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [checkedDishItems, setCheckedDishItems] = useState({});
  const [selectedTicketModal, setSelectedTicketModal] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const profileMenuRef = useRef(null);
  const contentViewportRef = useRef(null);
  const previousOrderCountRef = useRef(0);
  const optimisticStatusesRef = useRef({});

  const [chefProfile, setChefProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_profile_chef');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) { }

  });

  useEffect(() => {
    const fetchChefFromDb = async () => {
      try {
        const staffList = await api.getStaff();
        if (Array.isArray(staffList) && staffList.length > 0) {
          const chefInDb = staffList.find(s => s.role === 'Chef' || s.role === 'Head Chef' || (s.empId && s.empId.startsWith('CHEF')));
          if (chefInDb && chefInDb.name) {
            const fetched = {
              name: chefInDb.name,
              email: chefInDb.email || 'chef@flavorakitchen.in',
              role: chefInDb.role || 'Executive Chef',
              empId: chefInDb.empId || 'CHEF-01'
            };
            setChefProfile(fetched);
            localStorage.setItem('flavora_profile_chef', JSON.stringify(fetched));
          }
        }
      } catch (err) { }
    };
    fetchChefFromDb();
  }, []);

  const getInitials = (nameStr) => {
    if (!nameStr) return 'CK';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nameStr.slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    localStorage.removeItem('flavora_auth_token');
    localStorage.removeItem('flavora_logged_in');
    localStorage.removeItem('flavora_user_role');
    localStorage.setItem('flavora_active_page', 'home');
    window.history.pushState({}, '', '/');
    setActivePage('home');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Web Audio API Chime for New Kitchen Orders
  const playNewOrderChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) { }
  };

  // Live Clock Interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Live Backend & Local Orders
  const fetchOrdersAndMenu = async () => {
    try {
      let backendData = [];
      try {
        backendData = await api.getOrders();
      } catch (e) { }

      let localOrders = [];
      try {
        const saved = localStorage.getItem('flavora_manager_orders');
        if (saved) localOrders = JSON.parse(saved);
      } catch (e) { }

      const getCleanId = (o, fallbackIdx = 0) => {
        if (!o) return `KDS-${6000 + fallbackIdx}`;
        const raw = o.orderId || (typeof o.id === 'string' && o.id.startsWith('ORD-') ? o.id : null) || o.id || o._id || `KDS-${6000 + fallbackIdx}`;
        return String(raw).replace(/^#/i, '').trim();
      };

      // Merge backend and local orders using Map keyed by clean ID
      const orderMap = new Map();

      if (Array.isArray(localOrders)) {
        localOrders.forEach((lo, idx) => {
          if (!lo) return;
          const cleanId = getCleanId(lo, idx);
          orderMap.set(cleanId, lo);
        });
      }

      if (Array.isArray(backendData)) {
        backendData.forEach((bo, idx) => {
          if (!bo) return;
          const cleanId = getCleanId(bo, idx);
          // Backend is authoritative for items and order state
          orderMap.set(cleanId, bo);
        });
      }

      const combined = Array.from(orderMap.values());

      const mappedOrders = combined.map((o, idx) => {
        const cleanId = getCleanId(o, idx);
        const idStr = o.orderId || (typeof o.id === 'string' && o.id.startsWith('ORD-') ? o.id : null) || o.id || o._id || cleanId;
        const createdDate = o.createdAt ? new Date(o.createdAt) : new Date();
        const rawItems = Array.isArray(o.items) ? o.items : [];

        // Check if there are any pending dishes in this order that need cooking
        const hasPendingItems = rawItems.some(it => !it.isDelivered && !it.isReady && it.status !== 'READY' && it.status !== 'DELIVERED' && it.status !== 'SERVED');

        if (hasPendingItems) {
          // Clear any stale optimistic 'Ready' status for this order because customer added new dishes!
          delete optimisticStatusesRef.current[cleanId];
          delete optimisticStatusesRef.current[idStr];
        }

        const overrideStatus = optimisticStatusesRef.current[cleanId] || optimisticStatusesRef.current[idStr];
        const rawStatus = overrideStatus || o.status || 'Placed';

        const finalItems = rawItems.map((it, itemIdx) => {
          const isDelivered = Boolean(it.isDelivered || it.status === 'DELIVERED' || it.status === 'SERVED');
          const isReady = Boolean(!isDelivered && (it.isReady || it.status === 'READY' || (rawStatus === 'Ready' && !hasPendingItems)));
          const isCooking = Boolean(!isDelivered && !isReady && (it.status === 'COOKING' || it.status === 'PREPARING' || rawStatus === 'Preparing' || rawStatus === 'Cooking'));
          return {
            ...it,
            id: it.id || it._id || `item-${itemIdx}`,
            name: it.name,
            price: Number(it.price) || 0,
            quantity: Number(it.quantity || it.qty || 1),
            status: isDelivered ? 'DELIVERED' : (isReady ? 'READY' : (isCooking ? 'COOKING' : 'PLACED')),
            isReady: isReady,
            isDelivered: isDelivered
          };
        });

        return {
          id: idStr,
          _id: o._id,
          orderId: o.orderId || idStr,
          table: o.table || (o.tableNum ? `Table ${o.tableNum}` : 'Takeaway'),
          type: o.type || 'Dine-In',
          customer: o.customer || o.customerName || 'Guest',
          status: hasPendingItems ? (rawStatus === 'Preparing' || rawStatus === 'Cooking' ? 'Preparing' : 'Placed') : rawStatus,
          items: finalItems,
          notes: o.notes || o.chefNotes || o.instructions || '',
          time: createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: createdDate,
          total: o.totalAmount || o.total || 0
        };
      });

      const activePlacedCount = mappedOrders.filter(o => o.status === 'Placed').length;
      if (previousOrderCountRef.current > 0 && activePlacedCount > previousOrderCountRef.current) {
        playNewOrderChime();
        showToast('🔔 NEW KITCHEN TICKET RECEIVED!');
      }
      previousOrderCountRef.current = activePlacedCount;

      setOrdersList(mappedOrders);

      // Sync checkedDishItems state map with authoritative DB item status (READY or DELIVERED)
      const syncedCheckedMap = {};
      mappedOrders.forEach(ord => {
        const isOrderInCooking = ord.status === 'Preparing' || ord.status === 'Cooking' || ord.status === 'In-Progress' || ord.status === 'Ready';
        const itemMap = {};
        const cleanId = getCleanId(ord);
        (ord.items || []).forEach((it, idx) => {
          const isDelivered = it.isDelivered || it.status === 'DELIVERED' || it.status === 'SERVED';
          const isChecked = isDelivered || (isOrderInCooking && Boolean(it.isReady || it.status === 'READY'));
          itemMap[idx] = isChecked;
        });
        syncedCheckedMap[ord.id] = itemMap;
        syncedCheckedMap[cleanId] = itemMap;
        syncedCheckedMap[`#${cleanId}`] = itemMap;
      });
      setCheckedDishItems(prev => ({
        ...prev,
        ...syncedCheckedMap
      }));

      try {
        const menuData = await api.getMenuItems();
        if (Array.isArray(menuData) && menuData.length > 0) {
          setMenuItems(menuData);
        }
      } catch (e) { }

    } catch (err) {
      console.warn("Chef fetch warning:", err.message);
    }
  };

  useEffect(() => {
    fetchOrdersAndMenu();
    const interval = setInterval(fetchOrdersAndMenu, 4000);

    const handleSync = () => fetchOrdersAndMenu();
    window.addEventListener('flavora_orders_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('flavora_orders_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [soundEnabled]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    const cleanOrderId = String(orderId).replace(/^#/i, '');
    optimisticStatusesRef.current[cleanOrderId] = newStatus;
    optimisticStatusesRef.current[orderId] = newStatus;

    const targetOrder = ordersList.find(o => 
      o.id === orderId || o.orderId === orderId || o._id === orderId ||
      o.id === cleanOrderId || o.orderId === cleanOrderId || o.id === `#${cleanOrderId}` || o.orderId === `#${cleanOrderId}`
    );

    let updatedItems = targetOrder && Array.isArray(targetOrder.items) ? [...targetOrder.items] : [];
    const orderCheckedMap = checkedDishItems[orderId] || checkedDishItems[cleanOrderId] || checkedDishItems[`#${cleanOrderId}`] || {};
    const hasCheckedItems = Object.keys(orderCheckedMap).length > 0 && Object.values(orderCheckedMap).some(Boolean);

    let effectiveOrderStatus = newStatus;
    if (newStatus === 'Preparing' && updatedItems.length > 0) {
      // Mark all non-delivered items as PREPARING when chef clicks Start Cooking
      updatedItems = updatedItems.map(it => {
        const isDelivered = it.isDelivered || it.status === 'DELIVERED' || it.status === 'SERVED';
        if (isDelivered) {
          return { ...it, status: 'SERVED', isDelivered: true };
        }
        return { ...it, status: 'PREPARING' };
      });
      effectiveOrderStatus = 'Preparing';
    } else if (newStatus === 'Ready' && updatedItems.length > 0) {
      if (hasCheckedItems) {
        // Chef explicitly checked specific dish checkboxes! Mark ONLY checked items as READY!
        updatedItems = updatedItems.map((it, idx) => {
          const isDelivered = it.isDelivered || it.status === 'DELIVERED' || it.status === 'SERVED';
          if (isDelivered) {
            return { ...it, status: 'SERVED', isDelivered: true, isReady: true };
          }
          const isChecked = Boolean(orderCheckedMap[idx] || it.isReady || it.status === 'READY');
          return {
            ...it,
            status: isChecked ? 'READY' : 'PREPARING',
            isReady: isChecked
          };
        });
        effectiveOrderStatus = deriveOrderStatus(updatedItems, 'Preparing');
      } else {
        // If Chef did NOT check individual checkboxes, mark ALL non-delivered items as READY
        updatedItems = updatedItems.map(it => {
          const isDelivered = it.isDelivered || it.status === 'DELIVERED' || it.status === 'SERVED';
          if (isDelivered) {
            return { ...it, status: 'SERVED', isDelivered: true, isReady: true };
          }
          return { ...it, status: 'READY', isReady: true };
        });
        effectiveOrderStatus = 'Ready';
      }
    }

    const updated = ordersList.map(o => {
      const matches = o.id === orderId || o.orderId === orderId || o._id === orderId ||
                      o.id === cleanOrderId || o.orderId === cleanOrderId;
      if (matches) {
        return {
          ...o,
          status: effectiveOrderStatus,
          items: updatedItems
        };
      }
      return o;
    });

    setOrdersList(updated);

    try {
      localStorage.setItem('flavora_manager_orders', JSON.stringify(updated));
      window.dispatchEvent(new Event('flavora_orders_updated'));
    } catch (e) { }

    try {
      const rawApiId = targetOrder ? (targetOrder.orderId || targetOrder.id || targetOrder._id || cleanOrderId) : cleanOrderId;
      const cleanApiId = String(rawApiId).replace(/^#/i, '').trim();
      await api.updateOrderStatus(cleanApiId, effectiveOrderStatus, { items: updatedItems, status: effectiveOrderStatus });
    } catch (e) { }

    if (newStatus === 'Preparing') {
      showToast(`🔥 Order ${orderId} is COOKING!`);
    } else if (newStatus === 'Ready') {
      showToast(`✅ Order ${orderId} dish status updated!`);
    }
    if (selectedTicketModal && selectedTicketModal.id === orderId) {
      setSelectedTicketModal({ ...selectedTicketModal, status: effectiveOrderStatus, items: updatedItems });
    }
  };

  const [updatingDishItems, setUpdatingDishItems] = useState({});

  const handleToggleItemCheck = async (orderId, itemIdx) => {
    const cleanOrderId = String(orderId).replace(/^#/i, '');
    const itemKey = `${cleanOrderId}-${itemIdx}`;

    if (updatingDishItems[itemKey]) return;

    const targetOrder = ordersList.find(o =>
      o.id === orderId || o.orderId === orderId || o._id === orderId ||
      o.id === cleanOrderId || o.orderId === cleanOrderId || o.id === `#${cleanOrderId}` || o.orderId === `#${cleanOrderId}`
    );

    if (!targetOrder) return;

    // Check if order or any dish is in cooking/served state
    const hasAnyItemStarted = Array.isArray(targetOrder.items) && targetOrder.items.some(it =>
      it.isReady || it.isDelivered || it.status === 'READY' || it.status === 'SERVED' || it.status === 'DELIVERED' || it.status === 'COOKING' || it.status === 'PREPARING'
    );
    const isCooking = targetOrder.status === 'Preparing' || targetOrder.status === 'Cooking' || targetOrder.status === 'In-Progress' || targetOrder.status === 'Ready' || hasAnyItemStarted;

    if (!isCooking) {
      showToast('⚠️ Please click "🔥 Start Cooking" first before marking dishes as ready!');
      return;
    }

    setUpdatingDishItems(prev => ({ ...prev, [itemKey]: true }));

    const prevCheckedMap = checkedDishItems[orderId] || checkedDishItems[cleanOrderId] || {};
    const prevOrdersList = [...ordersList];
    const targetItem = targetOrder.items ? targetOrder.items[itemIdx] : null;
    const isCurrentlyChecked = Boolean(prevCheckedMap[itemIdx] || (targetItem && (targetItem.isReady || targetItem.status === 'READY')));
    const nextCheckedState = !isCurrentlyChecked;

    // 1. Synchronous Optimistic UI Update (0ms delay)
    setCheckedDishItems(prev => ({
      ...prev,
      [orderId]: { ...(prev[orderId] || {}), [itemIdx]: nextCheckedState },
      [cleanOrderId]: { ...(prev[cleanOrderId] || {}), [itemIdx]: nextCheckedState },
      [`#${cleanOrderId}`]: { ...(prev[`#${cleanOrderId}`] || {}), [itemIdx]: nextCheckedState }
    }));

    const targetItemId = targetItem ? (targetItem._id || targetItem.id || itemIdx) : itemIdx;
    const targetItemName = targetItem ? targetItem.name : '';
    const newStatus = nextCheckedState ? 'READY' : 'COOKING';

    const updatedItems = (targetOrder.items || []).map((it, idx) => {
      if (idx === itemIdx) {
        return {
          ...it,
          status: newStatus,
          isReady: nextCheckedState
        };
      }
      return it;
    });

    const allCheckedNow = updatedItems.length > 0 && updatedItems.every(i => i.status === 'READY' || i.isReady || i.status === 'DELIVERED' || i.isDelivered);
    const newOrderStatus = allCheckedNow ? 'Ready' : (targetOrder.status === 'Ready' ? 'Preparing' : targetOrder.status);

    const updatedOrderList = ordersList.map(o => {
      const matches = o.id === orderId || o.orderId === orderId || o._id === orderId ||
        o.id === cleanOrderId || o.orderId === cleanOrderId;
      if (matches) {
        return {
          ...o,
          status: newOrderStatus,
          items: updatedItems
        };
      }
      return o;
    });

    setOrdersList(updatedOrderList);

    try {
      localStorage.setItem('flavora_manager_orders', JSON.stringify(updatedOrderList));
      window.dispatchEvent(new Event('flavora_orders_updated'));
    } catch (e) { }

    // 2. Background Persistence to MongoDB & Error Rollback
    try {
      const apiOrderId = targetOrder._id || targetOrder.id || targetOrder.orderId || cleanOrderId;
      await api.updateOrderItemStatus(apiOrderId, [targetItemId, itemIdx, targetItemName], newStatus);
      window.dispatchEvent(new Event('flavora_orders_updated'));
    } catch (err) {
      console.error('Failed to update dish status on backend:', err);
      // Rollback Optimistic Update
      setCheckedDishItems(prev => ({
        ...prev,
        [orderId]: prevCheckedMap,
        [cleanOrderId]: prevCheckedMap,
        [`#${cleanOrderId}`]: prevCheckedMap
      }));
      setOrdersList(prevOrdersList);
      try {
        localStorage.setItem('flavora_manager_orders', JSON.stringify(prevOrdersList));
        window.dispatchEvent(new Event('flavora_orders_updated'));
      } catch (e) { }
      showToast('❌ Unable to update dish status. Please try again.');
    } finally {
      setUpdatingDishItems(prev => {
        const next = { ...prev };
        delete next[itemKey];
        return next;
      });
    }
  };

  const handleToggleOutOfStock = async (itemId, itemName) => {
    const isCurrentlyOut = outOfStockItems.includes(itemId) || outOfStockItems.includes(itemName);
    let nextList = [];
    if (isCurrentlyOut) {
      nextList = outOfStockItems.filter(i => i !== itemId && i !== itemName);
      showToast(`🟢 ${itemName} is BACK IN STOCK!`);
    } else {
      nextList = Array.from(new Set([...outOfStockItems.filter(i => i !== itemId && i !== itemName), itemId]));
      showToast(`🔴 ${itemName} marked OUT OF STOCK!`);

      // Broadcast notification for Manager
      try {
        const existingNotifs = JSON.parse(localStorage.getItem('flavora_manager_notifications') || '[]');
        const newNotif = {
          id: `NOTIF-${Date.now()}`,
          title: '🔴 Item Out of Stock Alert',
          message: `Chef Ramu marked "${itemName}" as OUT OF STOCK / Sold Out.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
          timestamp: new Date().toISOString()
        };
        const updatedNotifs = [newNotif, ...existingNotifs];
        localStorage.setItem('flavora_manager_notifications', JSON.stringify(updatedNotifs));
        window.dispatchEvent(new Event('flavora_notification_created'));
      } catch (e) { }
    }
    setOutOfStockItems(nextList);
    try {
      localStorage.setItem('flavora_out_of_stock_items', JSON.stringify(nextList));
      window.dispatchEvent(new Event('flavora_menu_updated'));
    } catch (e) { }

    try {
      await api.updateMenuItem(itemId, { isAvailable: isCurrentlyOut });
    } catch (e) { }
  };

  const getElapsedMins = (createdAt) => {
    if (!createdAt) return 0;
    const diffMs = currentTime.getTime() - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const isOrderCompletedInKitchen = (ord) => {
    if (ord.status === 'Completed' || ord.status === 'Paid' || ord.status === 'Cancelled') {
      return true;
    }
    const items = Array.isArray(ord.items) ? ord.items : [];
    if (items.length === 0) return false;

    // If there are ANY dishes still to be prepared/cooked, the ticket MUST stay visible on Live KDS!
    const hasPendingDishes = items.some(i => i && !i.isDelivered && !i.isReady && i.status !== 'READY' && i.status !== 'DELIVERED' && i.status !== 'SERVED');
    if (hasPendingDishes) {
      return false;
    }

    // Only if all items are served/ready and status is Ready/Served
    if (ord.status === 'Ready' || ord.status === 'Served') {
      return true;
    }

    return items.every(i => i && (i.isReady || i.status === 'READY' || i.isDelivered || i.status === 'SERVED' || i.status === 'DELIVERED'));
  };

  const activeKdsOrders = ordersList.filter(o => {
    const isKitchenDone = isOrderCompletedInKitchen(o);
    // Completed/Ready orders move to Orders History and should NOT be displayed on Live KDS
    if (isKitchenDone || o.status === 'Cancelled') return false;

    if (statusFilter === 'placed') return o.status === 'Placed';
    if (statusFilter === 'preparing') return o.status === 'Preparing';
    return true; // 'active' -> shows all active placed & cooking tickets
  }).filter(o => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return o.id.toLowerCase().includes(q) ||
      o.table.toLowerCase().includes(q) ||
      o.customer.toLowerCase().includes(q) ||
      o.items.some(i => (i.name || '').toLowerCase().includes(q));
  });

  const actualOutOfStockCount = menuItems.filter(item => {
    const itemId = item._id || item.id;
    return outOfStockItems.includes(itemId) || outOfStockItems.includes(item.name) || item.isAvailable === false;
  }).length;

  const navigationItems = [
    { id: 'chef-kds', label: 'Live Kitchen Orders', icon: Flame, badge: activeKdsOrders.length },
    { id: 'chef-inventory', label: "Stock Manager", icon: Utensils, badge: actualOutOfStockCount },
    { id: 'chef-history', label: 'Orders History', icon: CheckCircle2 },
    { id: 'chef-analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'chef-settings', label: 'Settings', icon: Settings },
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'chef-kds':
        return (
          <div className="admin-subpage-container" style={{ paddingBottom: '3rem' }}>
            <div className="admin-dashboard-header" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div className="page-breadcrumb-bar">
                  <span>Dashboard</span>
                  <span className="crumb-sep">›</span>
                  <span className="crumb-current">Live Kitchen Orders</span>
                </div>
                <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span>Live Kitchen Display System (KDS)</span>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontWeight: 800 }}>
                    🟢 Pass Active
                  </span>
                </h1>
                <p className="admin-page-subtitle">Real-time orders, cooking timers, itemized strikeout checkboxes, and waiter dispatch alerts.</p>
              </div>

              {/* Status Filter & Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', backgroundColor: '#FFFFFF', padding: '0.2rem', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  {[
                    { id: 'active', label: 'All Active' },
                    { id: 'placed', label: '🆕 Placed' },
                    { id: 'preparing', label: '🔥 Cooking' }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStatusFilter(st.id)}
                      style={{
                        backgroundColor: statusFilter === st.id ? '#0F2A1D' : 'transparent',
                        color: statusFilter === st.id ? '#FFFFFF' : '#475569',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={16} color="#64748B" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search table or dish..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.6rem 0.45rem 2.1rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#0F2A1D',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            <ChefKdsPassPage
              activeKdsOrders={activeKdsOrders}
              getElapsedMins={getElapsedMins}
              checkedDishItems={checkedDishItems}
              updatingDishItems={updatingDishItems}
              handleToggleItemCheck={handleToggleItemCheck}
              handleUpdateStatus={handleUpdateStatus}
              setSelectedTicketModal={setSelectedTicketModal}
            />
          </div>
        );
      case 'chef-inventory':
        return (
          <div className="admin-subpage-container" style={{ paddingBottom: '3rem' }}>
            <ChefInventoryPage
              menuItems={menuItems}
              outOfStockItems={outOfStockItems}
              handleToggleOutOfStock={handleToggleOutOfStock}
            />
          </div>
        );
      case 'chef-history':
        return (
          <div className="admin-subpage-container" style={{ paddingBottom: '3rem' }}>
            <ChefHistoryPage ordersList={ordersList} />
          </div>
        );
      case 'chef-analytics':
        return (
          <ChefAnalyticsPage
            ordersList={ordersList}
            getElapsedMins={getElapsedMins}
          />
        );
      case 'chef-profile':
        return <ChefProfilePage chefProfile={chefProfile} setChefProfile={setChefProfile} />;
      case 'chef-settings':
        return <ChefSettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div className="admin-app-wrapper">

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#0F2A1D',
          color: '#FFFFFF',
          padding: '0.85rem 1.4rem',
          borderRadius: '14px',
          boxShadow: '0 14px 40px rgba(0,0,0,0.3)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.92rem',
          fontWeight: 800,
          border: '1px solid #2D5A43'
        }}>
          <Sparkles size={20} color="#4ADE80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= SIDEBAR NAVIGATION (MATCHING ADMIN/MANAGER THEME) ================= */}
      <aside
        className={`admin-sidebar ${sidebarCollapsed ? 'is-collapsed' : ''} ${mobileSidebarOpen ? 'is-open is-mobile-open' : ''}`}
        onWheel={(e) => e.preventDefault()}
      >
        {/* Sidebar Brand Header */}
        <div className="admin-sidebar-header">
          <div className="admin-brand-lockup">
            <img
              src={brandLogo}
              alt={`${brandName} Logo`}
              onError={(e) => { e.target.src = '/logo.png'; }}
              className="admin-brand-logo-img"
            />
            <div className="admin-brand-text">
              <div className="admin-brand-title" style={{ display: 'flex', gap: '0.3rem' }}>
                <span className="brand-favora">{firstNamePart}</span>
                {restNamePart && <span className="brand-kitchen" style={{ color: '#FFFFFF' }}>{restNamePart}</span>}
              </div>
              <div className="admin-brand-subtitle">EXECUTIVE CHEF KDS</div>
            </div>
          </div>

          <button
            className="admin-mobile-close-btn"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} color="#FFFFFF" />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="admin-sidebar-nav">
          <ul className="admin-nav-list">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    className={`admin-nav-btn ${isActive ? 'is-active' : ''}`}
                    title={sidebarCollapsed ? item.label : ''}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileSidebarOpen(false);
                      if (contentViewportRef.current) {
                        contentViewportRef.current.scrollTop = 0;
                      }
                      window.scrollTo(0, 0);
                    }}
                  >
                    <Icon size={18} className="admin-nav-icon" />
                    <span className="admin-nav-label">{item.label}</span>
                    {item.badge > 0 && (
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        backgroundColor: isActive ? '#FFFFFF' : '#E07A3C',
                        color: isActive ? '#0F2A1D' : '#FFFFFF',
                        padding: '0.1rem 0.45rem',
                        borderRadius: '9999px'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sidebar Footer */}
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-version" style={{ marginTop: 0 }}>
            {brandName} KDS • v4.2 Live
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className={`admin-main-wrapper ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>

        {/* Top Header Bar */}
        <header className="admin-top-header">
          <div className="admin-header-left">
            <button
              className="admin-hamburger-btn"
              onClick={() => {
                if (window.innerWidth < 992) {
                  setMobileSidebarOpen(!mobileSidebarOpen);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                }
              }}
              aria-label="Toggle navigation menu"
              title={sidebarCollapsed ? "Expand Sidebar" : "Fold Sidebar"}
            >
              <Menu size={20} color="#1E4636" />
            </button>

            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1E4636', fontFamily: 'var(--font-heading)' }}>
              {brandName} Resto Chef
            </h2>
          </div>

          <div className="admin-header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* 24-Hour Navbar Clock */}
            {(() => {
              const timeStr = currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const segs = timeStr.split(':');
              const hh = segs[0] || '00';
              const mm = segs[1] || '00';
              const ss = segs[2] || '00';
              return (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '0.35rem 0.75rem',
                    boxShadow: '0 2px 8px rgba(15, 42, 29, 0.04), 0 1px 2px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem' }}>
                    <span style={{ fontSize: '0.98rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading, sans-serif)', letterSpacing: '0.02em' }}>
                      {hh}:{mm}
                    </span>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#E07A3C', fontFamily: 'monospace' }}>
                      :{ss}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Chef User Profile Card */}
            <div className="admin-user-profile-wrapper" ref={profileMenuRef} style={{ position: 'relative' }}>
              <div
                className="admin-user-profile-box"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="admin-user-avatar" style={{ overflow: 'hidden' }}>
                  {chefProfile?.avatarUrl ? (
                    <img src={chefProfile.avatarUrl} alt="Chef Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(chefProfile?.name || 'Chef')
                  )}
                </div>
                <div className="admin-user-info-text">
                  <div className="admin-user-name">{chefProfile?.name || 'Chef Vikrant'}</div>
                  <div className="admin-user-role">{chefProfile?.empId || 'CHEF-01'} • {chefProfile?.role || 'Executive Chef'}</div>
                </div>
                <ChevronDown size={14} color="#5C5C5C" />
              </div>

              {/* Profile Dropdown */}
              {userMenuOpen && (
                <div className="admin-profile-dropdown-menu">
                  <div className="admin-dropdown-user-info">
                    <div className="user-info-name">{chefProfile?.name || 'Chef Vikrant'}</div>
                    <div className="user-info-email">{chefProfile?.email || 'chef@flavorakitchen.in'}</div>
                  </div>
                  <button
                    className="admin-dropdown-item"
                    onClick={() => {
                      setActiveTab('chef-profile');
                      setUserMenuOpen(false);
                    }}
                  >
                    <User size={16} />
                    <span>My Profile</span>
                  </button>
                  <button
                    className="admin-dropdown-item"
                    onClick={() => {
                      setActiveTab('chef-settings');
                      setUserMenuOpen(false);
                    }}
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                  <div className="admin-dropdown-divider" />
                  <div style={{ padding: '0.5rem 0.75rem' }}>
                    <PowerOffSlide
                      duration={1500}
                      label="Logout"
                      onPowerOff={() => {
                        setUserMenuOpen(false);
                        sessionStorage.removeItem('flavora_auth_token');
                        sessionStorage.removeItem('flavora_logged_in');
                        sessionStorage.removeItem('flavora_user_role');
                        localStorage.removeItem('flavora_auth_token');
                        localStorage.removeItem('flavora_logged_in');
                        localStorage.removeItem('flavora_user_role');
                        localStorage.setItem('flavora_active_page', 'home');
                        window.history.pushState({}, '', '/');
                        setActivePage('home');
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="admin-content-viewport" ref={contentViewportRef}>
          {renderActiveView()}
        </div>
      </div>

      {/* Ticket Modal */}
      {selectedTicketModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 42, 29, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ backgroundColor: '#0F2A1D', padding: '1.25rem 1.5rem', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#FFFFFF' }}>
                  Kitchen Ticket Details — {selectedTicketModal.table}
                </h3>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#A3C2B3' }}>
                  ID: {selectedTicketModal.id} • Order Time: {selectedTicketModal.time}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicketModal(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedTicketModal.notes && (
                <div style={{ backgroundColor: '#FFF3EB', border: '1px solid #FDBA74', borderRadius: '10px', padding: '0.75rem', color: '#C2410C', fontSize: '0.82rem' }}>
                  <strong>Chef Note:</strong> {selectedTicketModal.notes}
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B', marginBottom: '0.5rem' }}>ORDERED DISHES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedTicketModal.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontWeight: 800, color: '#0F2A1D' }}>
                        <strong style={{ color: '#E07A3C', marginRight: '0.4rem' }}>{item.quantity || 1}x</strong>
                        {item.name}
                      </span>
                      <span style={{ color: '#64748B', fontSize: '0.8rem' }}>₹{(item.price || 0) * (item.quantity || 1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTicketModal(null)}
                  style={{
                    padding: '0.6rem 1.4rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#0F2A1D',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Close Pass Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
