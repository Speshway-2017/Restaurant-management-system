import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag, Users, Ticket, BarChart3, Receipt,
  Settings, Bell, ChevronDown, LogOut, Menu, X, ArrowLeft, Building2, UserCheck,
  ChevronRight, Table2
} from 'lucide-react';
import PowerOffSlide from '../PowerOffSlide';

// Dedicated Manager Portal Page Views
import ManagerDashboardHome from './ManagerDashboardHome';
import ManagerOrdersPage from './ManagerOrdersPage';
import ManagerTablesPage from './ManagerTablesPage';
import ManagerStaffPage from './ManagerStaffPage';
import ManagerMenuPage from './ManagerMenuPage';
import ManagerCouponsPage from './ManagerCouponsPage';
import ManagerAnalyticsPage from './ManagerAnalyticsPage';
import ManagerSettingsPage from './ManagerSettingsPage';
import ManagerProfilePage from './ManagerProfilePage';
import { api } from '../../services/api';
import { useRestaurantBranding } from '../../context/RestaurantBrandingContext';

const MANAGER_PATH_TO_TAB = {
  '/manager': 'manager-dashboard',
  '/manager/': 'manager-dashboard',
  '/manager/dashboard': 'manager-dashboard',
  '/manager/orders': 'manager-orders',
  '/manager/tables': 'manager-tables',
  '/manager/staff': 'manager-staff',
  '/manager/menu': 'manager-menu',
  '/manager/coupons': 'manager-coupons',
  '/manager/analytics': 'manager-reports',
  '/manager/reports': 'manager-reports',
  '/manager/settings': 'manager-settings',
  '/manager/profile': 'manager-profile'
};

const MANAGER_TAB_TO_PATH = {
  'manager-dashboard': '/manager/dashboard',
  'manager-orders': '/manager/orders',
  'manager-tables': '/manager/tables',
  'manager-staff': '/manager/staff',
  'manager-menu': '/manager/menu',
  'manager-coupons': '/manager/coupons',
  'manager-reports': '/manager/reports',
  'manager-settings': '/manager/settings',
  'manager-profile': '/manager/profile',
  'orders': '/manager/orders',
  'tables': '/manager/tables',
  'staff': '/manager/staff',
  'menu': '/manager/menu',
  'coupons': '/manager/coupons',
  'analytics': '/manager/reports',
  'settings': '/manager/settings',
  'profile': '/manager/profile'
};

const getManagerTabFromCurrentPath = () => {
  const rawPath = (window.location.pathname || '').toLowerCase().trim();
  if (MANAGER_PATH_TO_TAB[rawPath]) return MANAGER_PATH_TO_TAB[rawPath];
  for (const [p, t] of Object.entries(MANAGER_PATH_TO_TAB)) {
    if (p !== '/manager' && rawPath.startsWith(p)) return t;
  }
  return 'manager-dashboard';
};

export default function ManagerLayout({ setActivePage }) {
  const { brandName, brandLogo } = useRestaurantBranding();
  const nameParts = brandName.trim().split(' ');
  const firstNamePart = nameParts[0] || 'Flavora';
  const restNamePart = nameParts.slice(1).join(' ');

  const [activeTab, setActiveTab] = useState(() => getManagerTabFromCurrentPath());
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navbarClockStr, setNavbarClockStr] = useState('');
  const contentViewportRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setNavbarClockStr(now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Click outside listener to automatically close user profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (contentViewportRef.current) {
      contentViewportRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);

    const targetPath = MANAGER_TAB_TO_PATH[activeTab] || `/manager/${activeTab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab: activeTab }, '', targetPath);
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      const tab = getManagerTabFromCurrentPath();
      setActiveTab(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [managerProfile, setManagerProfile] = useState(() => {
    const saved = localStorage.getItem('flavora_profile_manager');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
  });

  useEffect(() => {
    const fetchManagerFromDb = () => {
      api.getStaff()
        .then((staffList) => {
          if (Array.isArray(staffList) && staffList.length > 0) {
            const managerInDb = staffList.find(s => s.role === 'Manager' || s.role === 'Resto Manager' || (s.empId && s.empId.startsWith('RMSM')));
            if (managerInDb && managerInDb.name) {
              const fetchedProfile = {
                name: managerInDb.name,
                email: managerInDb.email || 'manager@flavorakitchen.in',
                phone: managerInDb.phone || '9876512345',
                role: 'Restaurant Manager',
                empId: managerInDb.empId || 'RMSM-01'
              };
              setManagerProfile(fetchedProfile);
              localStorage.setItem('flavora_profile_manager', JSON.stringify(fetchedProfile));
            }
          }
        })
        .catch((err) => {
          console.warn('Could not fetch manager profile from DB:', err.message);
        });
    };

    fetchManagerFromDb();

    const updateManagerProfile = () => {
      const saved = localStorage.getItem('flavora_profile_manager');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.name) setManagerProfile(parsed);
        } catch (e) {}
      } else {
        fetchManagerFromDb();
      }
    };

    window.addEventListener('flavora_profile_updated', updateManagerProfile);
    return () => window.removeEventListener('flavora_profile_updated', updateManagerProfile);
  }, []);

  const getInitials = (nameStr) => {
    if (!nameStr) return 'RM';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return nameStr.slice(0, 2).toUpperCase();
  };

  const branches = [
    'Jubilee Hills (Main Branch)',
    'Banjara Hills Branch',
    'Gachibowli Branch',
    'Hitech City Branch'
  ];
  const [selectedBranch, setSelectedBranch] = useState('Jubilee Hills (Main Branch)');
  const [managerNotifications, setManagerNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_manager_notifications');
      return saved ? JSON.parse(saved) : [
        { id: 'NOTIF-1', title: '🟢 System Online', message: 'Resto Manager KDS Terminal is synchronized.', time: '09:00 AM', read: true }
      ];
    } catch (e) {
      return [];
    }
  });
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const notifMenuRef = useRef(null);

  useEffect(() => {
    const handleNotifUpdate = () => {
      try {
        const saved = localStorage.getItem('flavora_manager_notifications');
        if (saved) {
          const parsed = JSON.parse(saved);
          setManagerNotifications(parsed);
          if (parsed.length > 0 && !parsed[0].read) {
            setActiveToast(parsed[0]);
            setTimeout(() => setActiveToast(null), 6000);
          }
        }
      } catch (e) { }
    };
    handleNotifUpdate();
    window.addEventListener('flavora_notification_created', handleNotifUpdate);
    window.addEventListener('storage', handleNotifUpdate);
    return () => {
      window.removeEventListener('flavora_notification_created', handleNotifUpdate);
      window.removeEventListener('storage', handleNotifUpdate);
    };
  }, []);

  const unreadCount = managerNotifications.filter(n => !n.read).length;

  const handleMarkAllNotifsRead = () => {
    const readList = managerNotifications.map(n => ({ ...n, read: true }));
    setManagerNotifications(readList);
    try {
      localStorage.setItem('flavora_manager_notifications', JSON.stringify(readList));
    } catch (e) { }
  };

  const [userMenuOpen, setUserMenuOpen] = useState(false);
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
  };

  const handleNextBranch = () => {
    const currentIndex = branches.indexOf(selectedBranch);
    const nextIndex = (currentIndex + 1) % branches.length;
    setSelectedBranch(branches[nextIndex]);
  };

  const navigationItems = [
    { id: 'manager-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'manager-orders', label: 'Order Management', icon: ShoppingBag },
    { id: 'manager-tables', label: 'Table Management', icon: Table2 },
    { id: 'manager-staff', label: 'Staff Management', icon: Users },
    { id: 'manager-menu', label: 'Menu Management', icon: UtensilsCrossed },
    { id: 'manager-coupons', label: 'Coupons & Discounts', icon: Ticket },
    { id: 'manager-reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'manager-settings', label: 'Branch Settings', icon: Settings },
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'manager-dashboard':
        return <ManagerDashboardHome setActiveTab={setActiveTab} />;
      case 'manager-orders':
        return <ManagerOrdersPage />;
      case 'manager-tables':
      case 'tables':
        return <ManagerTablesPage />;
      case 'manager-staff':
        return <ManagerStaffPage />;
      case 'manager-menu':
        return <ManagerMenuPage />;
      case 'manager-coupons':
        return <ManagerCouponsPage />;
      case 'manager-reports':
        return <ManagerAnalyticsPage />;
      case 'manager-settings':
      case 'settings':
        return <ManagerSettingsPage />;
      case 'manager-profile':
      case 'profile':
        return <ManagerProfilePage />;
      default:
        return <ManagerDashboardHome setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="admin-app-wrapper">

      {/* ================= SIDEBAR NAVIGATION (LUXURY THEME) ================= */}
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
              <div className="admin-brand-subtitle">RESTO MANAGER PORTAL</div>
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
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sidebar Footer */}
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-version" style={{ marginTop: 0 }}>
            {brandName} Manager • v3.4
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
              {brandName} Resto Manager
            </h2>
          </div>

          <div className="admin-header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

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

            {/* Notifications Bell Dropdown */}
            <div className="admin-header-icon-btn-wrapper" ref={notifMenuRef} style={{ position: 'relative' }}>
              <button 
                className="admin-header-icon-btn" 
                aria-label="Notifications"
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                style={{ position: 'relative' }}
              >
                <Bell size={19} color="#1E4636" />
                {unreadCount > 0 && (
                  <span className="admin-notif-dot" style={{ backgroundColor: '#EF4444', color: '#FFFFFF', fontSize: '0.65rem', fontWeight: 900, padding: '0.1rem 0.35rem', borderRadius: '9999px', position: 'absolute', top: '-4px', right: '-4px' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Box */}
              {notifMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: '320px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                  zIndex: 9999,
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0F2A1D' }}>Manager Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllNotifsRead}
                        style={{ border: 'none', background: 'none', color: '#2563EB', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {managerNotifications.length === 0 ? (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>
                        No notifications yet.
                      </div>
                    ) : (
                      managerNotifications.map((n, idx) => (
                        <div
                          key={n.id || idx}
                          style={{
                            padding: '0.75rem 1rem',
                            borderBottom: '1px solid #F1F5F9',
                            backgroundColor: n.read ? '#FFFFFF' : '#FEF2F2',
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: n.read ? '#0F2A1D' : '#DC2626' }}>
                            {n.title}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.15rem', lineHeight: '1.35' }}>
                            {n.message}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.25rem', fontWeight: 700 }}>
                            {n.time}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Manager User Profile Card */}
            <div className="admin-user-profile-wrapper" ref={profileMenuRef} style={{ position: 'relative' }}>
              <div
                className="admin-user-profile-box"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="admin-user-avatar">
                  {getInitials(managerProfile.name)}
                </div>
                <div className="admin-user-info-text">
                  <div className="admin-user-name">{managerProfile.name}</div>
                  <div className="admin-user-role">{managerProfile.empId || 'RMSM-01'} • Manager</div>
                </div>
                <ChevronDown size={14} color="#5C5C5C" />
              </div>

              {/* Profile Dropdown */}
              {userMenuOpen && (
                <div className="admin-profile-dropdown-menu">
                  <div className="admin-dropdown-user-info">
                    <div className="user-info-name">{managerProfile.name}</div>
                    <div className="user-info-email">{managerProfile.email}</div>
                  </div>
                  <button
                    className="admin-dropdown-item"
                    onClick={() => {
                      setActiveTab('manager-profile');
                      setUserMenuOpen(false);
                    }}
                  >
                    <span>My Profile</span>
                  </button>
                  <button
                    className="admin-dropdown-item"
                    onClick={() => {
                      setActiveTab('manager-settings');
                      setUserMenuOpen(false);
                    }}
                  >
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

        {/* Viewport Content View */}
        <div className="admin-content-viewport" ref={contentViewportRef}>
          {renderActiveView()}
        </div>

      </div>

      {/* Floating Live Notification Toast Banner for Manager */}
      {activeToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#FEF2F2',
            border: '2px solid #FCA5A5',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            boxShadow: '0 10px 30px rgba(220, 38, 38, 0.25)',
            zIndex: 999999,
            maxWidth: '380px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem'
          }}
        >
          <div style={{ backgroundColor: '#DC2626', color: '#FFFFFF', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bell size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#991B1B', marginBottom: '0.2rem' }}>
              {activeToast.title}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#7F1D1D', fontWeight: 600, lineHeight: '1.35' }}>
              {activeToast.message}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#991B1B', marginTop: '0.3rem', fontWeight: 700 }}>
              {activeToast.time}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveToast(null)}
            style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', padding: '0.2rem' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

    </div>
  );
}
