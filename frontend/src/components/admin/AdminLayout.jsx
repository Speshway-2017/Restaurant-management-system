import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Table2, CalendarDays,
  Users, Clock, Boxes, Ticket, BarChart3, Receipt, Settings, ShieldCheck,
  Building2, FileText, Search, Bell, ChevronDown, LogOut, Menu, X, ArrowLeft,
  CheckCircle2, Plus, Sparkles, Filter, RefreshCw, User, ChevronRight, Camera,
  Globe
} from 'lucide-react';
import PowerOffSlide from '../PowerOffSlide';
import { useRestaurantBranding } from '../../context/RestaurantBrandingContext';

// Import Admin Sub-pages
import AdminDashboardHome from './AdminDashboardHome';
import AdminMenuPage from './AdminMenuPage';
import AdminTablesPage from './AdminTablesPage';
import AdminReservationsPage from './AdminReservationsPage';
import AdminStaffPage from './AdminStaffPage';
import AdminInventoryPage from './AdminInventoryPage';
import AdminCouponsPage from './AdminCouponsPage';
import AdminAnalyticsPage from './AdminAnalyticsPage';
import AdminPaymentsPage from './AdminPaymentsPage';
import AdminSettingsPage from './AdminSettingsPage';
import AdminProfilePage from './AdminProfilePage';
import AdminBlogsPage from './AdminBlogsPage';
import AdminGalleryPage from './AdminGalleryPage';
import AdminPublicPagesPage from './AdminPublicPagesPage';

const PATH_TO_TAB_MAP = {
  '/admin': 'dashboard',
  '/admin/': 'dashboard',
  '/admin/dashboard': 'dashboard',
  '/admin/overview': 'dashboard',
  '/admin/menu': 'menu-mgmt',
  '/admin/menu-mgmt': 'menu-mgmt',
  '/admin/inventory': 'inventory',
  '/admin/staff': 'staff-accounts',
  '/admin/staff-accounts': 'staff-accounts',
  '/admin/coupons': 'coupons',
  '/admin/loyalty': 'coupons',
  '/admin/analytics': 'analytics',
  '/admin/reports': 'analytics',
  '/admin/payments': 'payments',
  '/admin/settlements': 'payments',
  '/admin/public-pages': 'public-pages',
  '/admin/public': 'public-pages',
  '/admin/pages': 'public-pages',
  '/admin/settings': 'settings',
  '/admin/tables': 'tables',
  '/admin/reservations': 'reservations',
  '/admin/blogs': 'blogs',
  '/admin/gallery': 'gallery',
  '/admin/profile': 'profile'
};

const TAB_TO_PATH_MAP = {
  'dashboard': '/admin/dashboard',
  'menu-mgmt': '/admin/menu',
  'inventory': '/admin/inventory',
  'staff-accounts': '/admin/staff',
  'coupons': '/admin/coupons',
  'analytics': '/admin/analytics',
  'payments': '/admin/payments',
  'public-pages': '/admin/public-pages',
  'settings': '/admin/settings',
  'tables': '/admin/tables',
  'reservations': '/admin/reservations',
  'blogs': '/admin/blogs',
  'gallery': '/admin/gallery',
  'profile': '/admin/profile'
};

const getTabFromCurrentPath = () => {
  const rawPath = (window.location.pathname || '').toLowerCase().trim();
  if (PATH_TO_TAB_MAP[rawPath]) return PATH_TO_TAB_MAP[rawPath];
  for (const [p, t] of Object.entries(PATH_TO_TAB_MAP)) {
    if (p !== '/admin' && rawPath.startsWith(p)) return t;
  }
  return 'dashboard';
};

export default function AdminLayout({ setActivePage }) {
  const { brandName, brandLogo } = useRestaurantBranding();
  const nameParts = brandName.trim().split(' ');
  const firstNamePart = nameParts[0] || 'Flavora';
  const restNamePart = nameParts.slice(1).join(' ');

  const [activeTab, setActiveTab] = useState(() => getTabFromCurrentPath());
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('Jubilee Hills (Main Branch)');
  const [unreadNotifications, setUnreadNotifications] = useState(4);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const contentViewportRef = useRef(null);
  const profileMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      sender: 'Manager Rajesh (Jubilee Hills)',
      title: 'New Staff Member Created',
      message: 'Manager Rajesh added a new Waiter (Raju Kumar) to Jubilee Hills branch staff roster.',
      time: '10 mins ago',
      unread: true,
      tab: 'staff-accounts',
      icon: Users,
      iconBg: '#E3F2FD',
      iconColor: '#1565C0'
    },
    {
      id: 2,
      sender: 'Inventory Alert System',
      title: 'Raw Material Low Stock Warning',
      message: 'Fresh Paneer (Cottage Cheese) reached low stock threshold (4 kg remaining, min 10 kg).',
      time: '25 mins ago',
      unread: true,
      tab: 'inventory',
      icon: Boxes,
      iconBg: '#FEF2F2',
      iconColor: '#DC2626'
    },
    {
      id: 3,
      sender: 'Manager Srikanth (Banjara Hills)',
      title: 'Settlement Payout Request',
      message: 'Manager Srikanth requested daily sales settlement payout of ₹1.24 L for Banjara Hills.',
      time: '1 hour ago',
      unread: true,
      tab: 'payments',
      icon: Receipt,
      iconBg: '#FEF9C3',
      iconColor: '#854D0E'
    },
    {
      id: 4,
      sender: 'Chef Srikanth (Kitchen KDS)',
      title: 'Kitchen Dish Stock Update',
      message: 'Chef Srikanth toggled "Special Butter Chicken" stock status to Inactive.',
      time: '2 hours ago',
      unread: true,
      tab: 'menu-mgmt',
      icon: UtensilsCrossed,
      iconBg: '#FAF6EE',
      iconColor: '#1E4636'
    },
    {
      id: 5,
      sender: 'Receptionist Priya',
      title: 'Walk-in Table Assigned',
      message: 'Seated party of 4 at Table 12 (Jubilee Hills Main Dining Floor).',
      time: '3 hours ago',
      unread: false,
      tab: 'dashboard',
      icon: CheckCircle2,
      iconBg: '#F0FDF4',
      iconColor: '#166534'
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleNotifClick = (notif) => {
    setNotifications(notifications.map(n => n.id === notif.id ? { ...n, unread: false } : n));
    if (notif.tab) {
      setActiveTab(notif.tab);
    }
    setNotifMenuOpen(false);
  };

  // Click outside listener to automatically close profile and notification dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const [adminProfile, setAdminProfile] = useState(() => {
    const saved = localStorage.getItem('flavora_profile_admin');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { name: 'Saikiran G', role: 'Admin', email: 'admin@rms.com' };
  });

  useEffect(() => {
    const updateProfile = () => {
      const saved = localStorage.getItem('flavora_profile_admin');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.name) setAdminProfile(parsed);
        } catch (e) {}
      }
    };
    window.addEventListener('flavora_profile_updated', updateProfile);
    return () => window.removeEventListener('flavora_profile_updated', updateProfile);
  }, []);

  const getInitials = (nameStr) => {
    if (!nameStr) return 'SK';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return nameStr.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    if (contentViewportRef.current) {
      contentViewportRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);

    // Synchronize browser address bar URL with current activeTab
    const targetPath = TAB_TO_PATH_MAP[activeTab] || `/admin/${activeTab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab: activeTab }, '', targetPath);
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      const tab = getTabFromCurrentPath();
      setActiveTab(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const branches = [
    'Jubilee Hills (Main Branch)',
    'Banjara Hills Branch',
    'Gachibowli Branch',
    'Hitech City Branch'
  ];

  const handleNextBranch = () => {
    const currentIndex = branches.indexOf(selectedBranch);
    const nextIndex = (currentIndex + 1) % branches.length;
    setSelectedBranch(branches[nextIndex]);
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'menu-mgmt', label: 'Menu Management', icon: UtensilsCrossed },
    { id: 'inventory', label: 'Inventory Management', icon: Boxes },
    { id: 'staff-accounts', label: 'Staff Management', icon: Users },
    { id: 'coupons', label: 'Loyalty & Coupons', icon: Ticket },
    { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'payments', label: 'Payments & Settlements', icon: Receipt },
    { id: 'public-pages', label: 'Public Pages', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getBreadcrumbLabel = (tab) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'menu-mgmt': return 'Menu Management';
      case 'inventory': return 'Inventory Management';
      case 'blogs': return 'Blog Management';
      case 'gallery': return 'Gallery Management';
      case 'public-pages': return 'Public Pages & Website';
      case 'tables': return 'Table Management';
      case 'staff-accounts': return 'Staff Management';
      case 'staff-shifts': return 'Shifts & Attendance';
      case 'coupons': return 'Loyalty & Coupons';
      case 'analytics': return 'Reports & Analytics';
      case 'payments': return 'Payments & Settlements';
      case 'profile': return 'My Profile';
      case 'settings':
      case 'settings-profile':
      case 'settings-gst':
      case 'settings-branches':
        return 'Settings';
      default: return tab.toUpperCase().replace('-', ' ');
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardHome setActiveTab={setActiveTab} />;
      case 'menu-mgmt':
        return <AdminMenuPage />;
      case 'public-pages':
        return <AdminPublicPagesPage setActivePage={setActivePage} setActiveTab={setActiveTab} />;
      case 'blogs':
        return <AdminBlogsPage />;
      case 'gallery':
        return <AdminGalleryPage />;
      case 'tables':
        return <AdminTablesPage />;
      case 'reservations':
        return <AdminReservationsPage />;
      case 'staff-accounts':
      case 'staff-shifts':
        return <AdminStaffPage subTab={activeTab} />;
      case 'inventory':
        return <AdminInventoryPage />;
      case 'coupons':
        return <AdminCouponsPage />;
      case 'analytics':
        return <AdminAnalyticsPage setActiveTab={setActiveTab} />;
      case 'payments':
        return <AdminPaymentsPage />;
      case 'profile':
        return <AdminProfilePage setActivePage={setActivePage} />;
      case 'settings':
      case 'settings-profile':
      case 'settings-gst':
      case 'settings-branches':
        return <AdminSettingsPage subTab={activeTab} />;
      default:
        return <AdminDashboardHome setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="admin-app-wrapper">

      {/* ================= SIDEBAR NAVIGATION ================= */}
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
              <div className="admin-brand-subtitle">RESTO ADMIN PORTAL</div>
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
                    {item.badge && (
                      <span className={`admin-nav-badge ${item.badge.includes('Low') ? 'is-warning' : ''}`}>
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
            {brandName} v3.4 • India
          </div>
        </div>

      </aside>

      {/* Mobile Sidebar Overlay Backdrop */}
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
              {brandName} Resto Admin
            </h2>
          </div>

          <div className="admin-header-right">
            {/* Branch Badge Selector */}
            <div className="admin-branch-selector" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={16} color="#1E4636" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="admin-branch-dropdown"
                aria-label="Select branch"
              >
                {branches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Notifications Bell */}
            <div className="admin-header-icon-btn-wrapper" ref={notifMenuRef} style={{ position: 'relative' }}>
              <button 
                className="admin-header-icon-btn" 
                aria-label="Notifications"
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
              >
                <Bell size={19} color="#1E4636" />
                {unreadCount > 0 && (
                  <span className="admin-notif-dot">{unreadCount}</span>
                )}
              </button>

              {notifMenuOpen && (
                <div className="admin-notif-dropdown">
                  <div className="admin-notif-header">
                    <h3 className="admin-notif-title">
                      <Bell size={16} color="#1E4636" />
                      <span>Manager & System Alerts ({unreadCount})</span>
                    </h3>
                    {unreadCount > 0 && (
                      <button className="admin-notif-mark-btn" onClick={handleMarkAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="admin-notif-list">
                    {notifications.map((notif) => {
                      const Icon = notif.icon;
                      return (
                        <button
                          key={notif.id}
                          className={`admin-notif-item ${notif.unread ? 'is-unread' : ''}`}
                          onClick={() => handleNotifClick(notif)}
                        >
                          <div className="admin-notif-icon-badge" style={{ background: notif.iconBg }}>
                            <Icon size={16} color={notif.iconColor} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#1E4636' }}>
                              {notif.title}
                            </div>
                            <div className="admin-notif-text">
                              {notif.message}
                            </div>
                            <div className="admin-notif-time">
                              {notif.sender} • {notif.time}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Admin User Profile Dropdown */}
            <div className="admin-user-profile-wrapper" ref={profileMenuRef} style={{ position: 'relative' }}>
              <div
                className="admin-user-profile-box"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{ cursor: 'pointer' }}
              >
                <div className="admin-user-avatar">{getInitials(adminProfile.name)}</div>
                <div className="admin-user-details">
                  <div className="admin-user-name">{adminProfile.name || 'Chef Srikanth'}</div>
                  <div className="admin-user-role">Admin</div>
                </div>
                <ChevronDown
                  size={15}
                  color="#5C5C5C"
                  style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                />
              </div>

              {userMenuOpen && (
                <>
                  <div
                    className="admin-dropdown-backdrop"
                    onClick={() => setUserMenuOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                  />
                  <div className="admin-profile-dropdown-menu">
                    <div className="admin-dropdown-user-info">
                      <div className="user-info-name">{adminProfile.name || 'Chef Srikanth'}</div>
                      <div className="user-info-email" style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>{adminProfile.email || 'admin@restaurant.com'}</div>
                    </div>

                    <button
                      className="admin-dropdown-item"
                      onClick={() => { setActiveTab('profile'); setUserMenuOpen(false); }}
                    >
                      <User size={15} color="#1E4636" />
                      <span>My Profile</span>
                    </button>

                    <button
                      className="admin-dropdown-item"
                      onClick={() => { setActiveTab('settings'); setUserMenuOpen(false); }}
                    >
                      <Settings size={15} color="#1E4636" />
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
                </>
              )}
            </div>

          </div>
        </header>

        {/* Dynamic Sub-page View */}
        <main className="admin-content-viewport" ref={contentViewportRef}>
          {renderActiveView()}
        </main>

      </div>

    </div>
  );
}
