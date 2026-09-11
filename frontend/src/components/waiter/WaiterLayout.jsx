import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Table2, ShoppingBag, Bell, Clock, LogOut, Menu, X, User, CheckCircle2, Volume2, VolumeX, ChevronDown, Settings, Home, ChevronRight, UtensilsCrossed, Receipt, Moon, Sun
} from 'lucide-react';
import PowerOffSlide from '../PowerOffSlide';

import WaiterDashboardHome from './WaiterDashboardHome';
import WaiterTablesPage from './WaiterTablesPage';
import WaiterOrdersPage from './WaiterOrdersPage';
import WaiterProfilePage from './WaiterProfilePage';
import WaiterSettingsPage from './WaiterSettingsPage';
import { api } from '../../services/api';
import { useRestaurantBranding } from '../../context/RestaurantBrandingContext';
import { onSocketEvent, joinSocketRooms } from '../../services/socket';

const WAITER_PATH_TO_TAB = {
  '/waiter': 'waiter-dashboard',
  '/waiter/': 'waiter-dashboard',
  '/waiter/dashboard': 'waiter-dashboard',
  '/waiter/tables': 'waiter-tables',
  '/waiter/orders': 'waiter-orders',
  '/waiter/settings': 'waiter-settings',
  '/waiter/profile': 'waiter-profile'
};

const WAITER_TAB_TO_PATH = {
  'waiter-dashboard': '/waiter/dashboard',
  'waiter-tables': '/waiter/tables',
  'waiter-orders': '/waiter/orders',
  'waiter-settings': '/waiter/settings',
  'waiter-profile': '/waiter/profile'
};

const BREADCRUMB_MAP = {
  'waiter-dashboard': { title: 'Dashboard Overview' },
  'waiter-tables': { title: 'My Tables' },
  'waiter-orders': { title: 'Orders' },
  'waiter-menu': { title: 'Menu' },
  'waiter-history': { title: 'Order History' },
  'waiter-profile': { title: 'Profile' },
  'waiter-settings': { title: 'Station Settings' }
};

export default function WaiterLayout({ setActivePage }) {
  const { brandName, brandLogo } = useRestaurantBranding();
  const nameParts = brandName.trim().split(' ');
  const firstNamePart = nameParts[0] || 'Flavora';
  const restNamePart = nameParts.slice(1).join(' ');

  const [currentTab, setCurrentTab] = useState(() => {
    const rawPath = (window.location.pathname || '').toLowerCase().trim();
    return WAITER_PATH_TO_TAB[rawPath] || 'waiter-dashboard';
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navbarClockStr, setNavbarClockStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setNavbarClockStr(now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);
  const profileMenuRef = useRef(null);
  const notifMenuRef = useRef(null);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);

  useEffect(() => {
    const session = getSessionUser();
    joinSocketRooms(session);

    const fetchNotifications = async () => {
      try {
        const currentWaiter = getSessionUser();
        const currentWaiterId = currentWaiter?._id || currentWaiter?.id;

        const [orders, assistance] = await Promise.all([
          api.getOrders().catch(() => []),
          api.getAssistanceRequests().catch(() => [])
        ]);

        const notifs = [];

        // 1. Order Ready Alerts - routed specifically to assigned waiter
        (orders || []).forEach(ord => {
          const readyItems = (ord.items || []).filter(i => (i.status === 'READY' || i.isReady) && !i.isDelivered && i.status !== 'DELIVERED');
          const isFoodReady = ord.chefStatus === 'READY' || ord.status === 'Ready' || readyItems.length > 0;
          
          if (isFoodReady && ord.waiterStatus !== 'SERVED' && ord.status !== 'Completed') {
            const isAssignedToMe = !ord.waiterId || (currentWaiterId && String(ord.waiterId) === String(currentWaiterId));
            if (isAssignedToMe) {
              notifs.push({
                id: `notif-ready-${ord.orderId || ord._id}`,
                type: 'ORDER_READY',
                title: `🔔 Order #${ord.orderId || 'Order'} is ready for Table ${ord.table || 'T-01'}`,
                message: `Prepared by Chef ${ord.chefName || 'Kitchen'}. Ready for pickup & service!`,
                time: ord.time || 'Just now',
                table: ord.table,
                orderId: ord.orderId || ord._id,
                isRead: false
              });
            }
          }
        });

        // 2. Customer Assistance Requests
        (assistance || []).filter(a => a.status === 'NEW' || a.status === 'ACKNOWLEDGED').forEach(ast => {
          notifs.push({
            id: `notif-ast-${ast._id}`,
            type: 'ASSISTANCE',
            title: `🙋 Customer Assistance - ${ast.table}`,
            message: `Requested: ${ast.requestType}${ast.note ? ` (${ast.note})` : ''}`,
            time: new Date(ast.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            table: ast.table,
            isRead: ast.status === 'ACKNOWLEDGED'
          });
        });

        setNotificationsList(notifs);
      } catch (e) {
        console.error('Failed to fetch notifications', e);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 4000);
    window.addEventListener('flavora_orders_updated', fetchNotifications);
    window.addEventListener('flavora_tables_updated', fetchNotifications);

    // Socket.io real-time listener for chef_ready events
    const unsubReady = onSocketEvent('chef_ready', (data) => {
      const current = getSessionUser();
      const currentWaiterId = current?._id || current?.id;
      const targetWaiterId = data?.order?.waiterId;
      if (!targetWaiterId || String(targetWaiterId) === String(currentWaiterId)) {
        fetchNotifications();
        window.dispatchEvent(new Event('flavora_orders_updated'));
      }
    });

    const unsubWaiterNotif = onSocketEvent('waiter_notification', () => {
      fetchNotifications();
      window.dispatchEvent(new Event('flavora_orders_updated'));
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('flavora_orders_updated', fetchNotifications);
      window.removeEventListener('flavora_tables_updated', fetchNotifications);
      unsubReady();
      unsubWaiterNotif();
    };
  }, []);

  const getSessionUser = () => {
    const raw = sessionStorage.getItem('flavora_user_data') || localStorage.getItem('flavora_user_data');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return null;
  };

  const sessionUser = getSessionUser();
  const accountKey = sessionUser?._id || sessionUser?.id || 'default';

  const [waiterProfile, setWaiterProfile] = useState(() => {
    return {
      name: sessionUser?.name || 'Waiter',
      empId: sessionUser?.empId || `RMSW-${String(sessionUser?._id || sessionUser?.id || '01').slice(-4).toUpperCase()}`,
      role: sessionUser?.role || 'Waiter',
      avatarUrl: ''
    };
  });

  const [waiterDutyStatus, setWaiterDutyStatus] = useState(() => {
    return localStorage.getItem(`flavora_waiter_duty_status_${accountKey}`) || localStorage.getItem('flavora_waiter_duty_status') || 'LOGGED_IN';
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const syncProfile = () => {
      const current = getSessionUser();
      const currentKey = current?._id || current?.id || accountKey;
      const localAvatar = localStorage.getItem(`flavora_waiter_avatar_${currentKey}`) || localStorage.getItem('flavora_waiter_avatar');
      const savedProfile = localStorage.getItem(`flavora_waiter_profile_${currentKey}`) || localStorage.getItem('flavora_waiter_profile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setWaiterProfile(prev => ({
            ...prev,
            name: parsed.name || prev.name,
            empId: parsed.empId || prev.empId,
            avatarUrl: localAvatar || parsed.avatarUrl || prev.avatarUrl
          }));
        } catch (e) {}
      } else if (localAvatar) {
        setWaiterProfile(prev => ({ ...prev, avatarUrl: localAvatar }));
      }
    };
    syncProfile();
    fetchWaiterProfile();
    window.addEventListener('flavora_waiter_profile_updated', syncProfile);
    return () => window.removeEventListener('flavora_waiter_profile_updated', syncProfile);
  }, [accountKey]);

  const fetchWaiterProfile = async () => {
    try {
      const current = getSessionUser();
      const currentKey = current?._id || current?.id || accountKey;
      const localAvatar = localStorage.getItem(`flavora_waiter_avatar_${currentKey}`) || localStorage.getItem('flavora_waiter_avatar');

      try {
        const me = await api.getMe();
        if (me && me.name) {
          setWaiterProfile({
            name: me.name,
            empId: me.empId || `RMSW-${String(me._id || me.id).slice(-4).toUpperCase()}`,
            role: me.role || 'Waiter',
            avatarUrl: localAvatar || me.avatarUrl || ''
          });
          return;
        }
      } catch (e) {}

      if (current) {
        const staffList = await api.getStaff();
        if (staffList && staffList.length > 0) {
          const waiterUser = staffList.find(s => 
            (current._id && String(s._id || s.id) === String(current._id)) ||
            (current.id && String(s._id || s.id) === String(current.id)) ||
            (current.email && s.email && s.email.toLowerCase() === current.email.toLowerCase())
          );
          if (waiterUser) {
            setWaiterProfile(prev => ({
              name: waiterUser.name || prev.name,
              empId: waiterUser.empId || prev.empId,
              role: waiterUser.role || 'Waiter',
              avatarUrl: localAvatar || waiterUser.avatarUrl || prev.avatarUrl
            }));
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const syncDutyStatus = () => {
      const current = getSessionUser();
      const currentKey = current?._id || current?.id || accountKey;
      const saved = localStorage.getItem(`flavora_waiter_duty_status_${currentKey}`) || localStorage.getItem('flavora_waiter_duty_status') || 'LOGGED_IN';
      setWaiterDutyStatus(saved);
    };
    syncDutyStatus();
    window.addEventListener('flavora_waiter_duty_updated', syncDutyStatus);
    window.addEventListener('storage', syncDutyStatus);
    return () => {
      window.removeEventListener('flavora_waiter_duty_updated', syncDutyStatus);
      window.removeEventListener('storage', syncDutyStatus);
    };
  }, [accountKey]);

  const handleToggleWaiterDuty = () => {
    const current = getSessionUser();
    const currentKey = current?._id || current?.id || accountKey;
    const nextStatus = waiterDutyStatus === 'LOGGED_IN' ? 'LOGGED_OUT' : 'LOGGED_IN';
    setWaiterDutyStatus(nextStatus);
    localStorage.setItem(`flavora_waiter_duty_status_${currentKey}`, nextStatus);
    window.dispatchEvent(new Event('flavora_waiter_duty_updated'));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabChange = (tabId) => {
    if (tabId === 'waiter-menu') {
      window.open('/menu', '_blank');
      return;
    }
    if (tabId === 'waiter-history') {
      setCurrentTab('waiter-orders');
      window.history.pushState({}, '', '/waiter/orders');
      return;
    }
    setCurrentTab(tabId);
    setMobileSidebarOpen(false);
    const path = WAITER_TAB_TO_PATH[tabId] || '/waiter/dashboard';
    window.history.pushState({}, '', path);
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return 'WR';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nameStr.slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
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
  };

  const navigationItems = [
    { id: 'waiter-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'waiter-tables', label: 'My Tables', icon: Table2 },
    { id: 'waiter-orders', label: 'Orders', icon: ShoppingBag },
    { id: 'waiter-settings', label: 'Settings', icon: Settings },
    { id: 'waiter-profile', label: 'Profile', icon: User }
  ];

  const renderActiveContent = () => {
    switch (currentTab) {
      case 'waiter-dashboard':
        return <WaiterDashboardHome onNavigateTab={handleTabChange} />;
      case 'waiter-tables':
        return <WaiterTablesPage />;
      case 'waiter-orders':
        return <WaiterOrdersPage />;
      case 'waiter-settings':
        return <WaiterSettingsPage />;
      case 'waiter-profile':
        return <WaiterProfilePage />;
      default:
        return <WaiterDashboardHome onNavigateTab={handleTabChange} />;
    }
  };

  return (
    <div className="admin-app-wrapper">

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* ================= SIDEBAR NAVIGATION (MATCHING MANAGER THEME) ================= */}
      <aside
        className={`admin-sidebar ${sidebarCollapsed ? 'is-collapsed' : ''} ${mobileSidebarOpen ? 'is-open is-mobile-open' : ''}`}
        onWheel={(e) => e.preventDefault()}
      >
        {/* Sidebar Brand Header */}
        <div className="admin-sidebar-header">
          <div className="admin-brand-lockup" onClick={() => handleTabChange('waiter-dashboard')} style={{ cursor: 'pointer' }}>
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
              <div className="admin-brand-subtitle">RESTO WAITER PORTAL</div>
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

        {/* Sidebar Navigation Tree */}
        <div className="admin-sidebar-nav">
          <ul className="admin-nav-list">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    className={`admin-nav-btn ${isActive ? 'is-active' : ''}`}
                    title={sidebarCollapsed ? item.label : ''}
                    onClick={() => {
                      handleTabChange(item.id);
                      setMobileSidebarOpen(false);
                    }}
                  >
                    <Icon size={18} className="admin-nav-icon" />
                    <span className="admin-nav-label">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sidebar Footer */}
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-version" style={{ marginTop: 0 }}>
            {brandName} v3.4 • India
          </div>
        </div>

      </aside>

      {/* Main Content Area */}
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
              {brandName} Resto Waiter
            </h2>
          </div>

          {/* Right Header Icons */}
          <div className="admin-header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>

            {/* Glassmorphism Orb Duty Toggle Switch */}
            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleToggleWaiterDuty}
                title={waiterDutyStatus === 'LOGGED_IN' ? 'Click to Check OUT' : 'Click to Check IN'}
                style={{
                  position: 'relative',
                  width: '94px',
                  height: '32px',
                  borderRadius: '20px',
                  background: waiterDutyStatus === 'LOGGED_IN'
                    ? 'linear-gradient(135deg, #059669 0%, #10B981 50%, #06B6D4 100%)'
                    : 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 50%, #C084FC 100%)',
                  border: '1px solid ' + (waiterDutyStatus === 'LOGGED_IN' ? 'rgba(52, 211, 153, 0.6)' : 'rgba(192, 132, 252, 0.6)'),
                  boxShadow: waiterDutyStatus === 'LOGGED_IN'
                    ? '0 4px 16px rgba(16, 185, 129, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.35)'
                    : '0 4px 16px rgba(124, 58, 237, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.35)',
                  cursor: 'pointer',
                  padding: 0,
                  outline: 'none',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  userSelect: 'none'
                }}
              >
                {/* Label Text Inside Track */}
                <span
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    left: waiterDutyStatus === 'LOGGED_IN' ? '12px' : '36px',
                    color: '#FFFFFF',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-heading, sans-serif)',
                    letterSpacing: '0.02em',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {waiterDutyStatus === 'LOGGED_IN' ? 'WORK' : 'REST'}
                </span>

                {/* 3D Translucent Glass Orb Knob */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    left: waiterDutyStatus === 'LOGGED_IN' ? 'calc(100% - 35px)' : '-3px',
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.18) 55%, rgba(255, 255, 255, 0.08) 100%)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.55)',
                    boxShadow: '0 6px 14px rgba(0, 0, 0, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -2px 4px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 2
                  }}
                >
                  {waiterDutyStatus === 'LOGGED_IN' ? (
                    <Sun size={16} color="#FFFFFF" style={{ filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))' }} />
                  ) : (
                    <Moon size={16} color="#FFFFFF" style={{ filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))' }} />
                  )}
                </div>
              </button>
            </div>

            {/* 24-Hour Navbar Clock */}
            {navbarClockStr && (() => {
              const segs = navbarClockStr.split(':');
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
                    height: '36px',
                    boxSizing: 'border-box',
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

            {/* Notifications Bell & Dropdown */}
            <div className="admin-header-icon-btn-wrapper" ref={notifMenuRef} style={{ position: 'relative' }}>
              <button 
                type="button"
                className="admin-header-icon-btn"
                aria-label="Notifications"
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                style={{ position: 'relative' }}
              >
                <Bell size={19} color="#1E4636" />
                {notificationsList.filter(n => !n.isRead).length > 0 && (
                  <span className="admin-notif-dot" style={{ backgroundColor: '#EF4444', color: '#FFFFFF', fontSize: '0.65rem', fontWeight: 900, padding: '0.1rem 0.35rem', borderRadius: '9999px', position: 'absolute', top: '-4px', right: '-4px' }}>
                    {notificationsList.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              {notifMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '125%',
                  right: 0,
                  width: '320px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  boxShadow: '0 12px 35px rgba(0,0,0,0.18)',
                  border: '1px solid #E2E8F0',
                  padding: '1rem',
                  zIndex: 99999
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F2A1D' }}>Live Notifications</span>
                    <span style={{ fontSize: '0.72rem', color: '#E07A3C', fontWeight: 800 }}>
                      {notificationsList.filter(n => !n.isRead).length} Active
                    </span>
                  </div>

                  {notificationsList.length === 0 ? (
                    <div style={{ padding: '1rem 0', textAlign: 'center', color: '#64748B', fontSize: '0.8rem' }}>
                      No active notifications right now.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                      {notificationsList.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setNotifMenuOpen(false);
                            if (n.type === 'ORDER_READY') handleTabChange('waiter-orders');
                            if (n.type === 'ASSISTANCE') handleTabChange('waiter-dashboard');
                          }}
                          style={{
                            padding: '0.65rem 0.75rem',
                            backgroundColor: n.type === 'ORDER_READY' ? '#F0FDF4' : '#FFF7ED',
                            border: `1px solid ${n.type === 'ORDER_READY' ? '#86EFAC' : '#FDBA74'}`,
                            borderRadius: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#0F2A1D' }}>{n.title}</div>
                          <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '0.15rem' }}>{n.message}</div>
                          <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.2rem', textAlign: 'right' }}>{n.time}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Waiter User Profile Card */}
            <div className="admin-user-profile-wrapper" ref={profileMenuRef} style={{ position: 'relative' }}>
              <div
                className="admin-user-profile-box"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  cursor: 'pointer',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC'
                }}
              >
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: '#1E4636',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.82rem',
                  fontWeight: 900,
                  overflow: 'hidden'
                }}>
                  {waiterProfile.avatarUrl ? (
                    <img src={waiterProfile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(waiterProfile.name)
                  )}
                </div>

                <div style={{ textTransform: 'none' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F2A1D' }}>{waiterProfile.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>{waiterProfile.empId} • Waiter</div>
                </div>
                <ChevronDown size={14} color="#5C5C5C" />
              </div>

              {/* Profile Dropdown Menu */}
              {userMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: '260px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  border: '1px solid #E2E8F0',
                  padding: '0.85rem',
                  zIndex: 99999
                }}>
                  <div style={{ paddingBottom: '0.75rem', marginBottom: '0.75rem', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0F2A1D' }}>{waiterProfile.name}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>{waiterProfile.empId} • Waiter</div>
                  </div>

                  <button
                    onClick={() => { handleTabChange('waiter-profile'); setUserMenuOpen(false); }}
                    style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', fontSize: '0.82rem', fontWeight: 700, color: '#0F2A1D', cursor: 'pointer', marginBottom: '0.35rem' }}
                  >
                    My Profile
                  </button>

                  <button
                    onClick={() => { handleTabChange('waiter-settings'); setUserMenuOpen(false); }}
                    style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', fontSize: '0.82rem', fontWeight: 700, color: '#0F2A1D', cursor: 'pointer', marginBottom: '0.5rem' }}
                  >
                    Settings
                  </button>

                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
                    <PowerOffSlide label="Logout" onPowerOff={handleLogout} />
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Viewport Content */}
        <main className="admin-content-viewport" style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          {renderActiveContent()}
        </main>

      </div>

    </div>
  );
}
