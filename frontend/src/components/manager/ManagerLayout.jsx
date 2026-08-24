import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, UtensilsCrossed, Users, Ticket, BarChart3, Receipt,
  Settings, Bell, ChevronDown, LogOut, Menu, X, ArrowLeft, Building2, UserCheck,
  ChevronRight, Table2
} from 'lucide-react';
import PowerOffSlide from '../PowerOffSlide';

// Import Views
import ManagerDashboardHome from './ManagerDashboardHome';
import AdminOrdersPage from '../admin/AdminOrdersPage';
import AdminStaffPage from '../admin/AdminStaffPage';
import AdminMenuPage from '../admin/AdminMenuPage';
import AdminCouponsPage from '../admin/AdminCouponsPage';
import AdminAnalyticsPage from '../admin/AdminAnalyticsPage';
import AdminProfilePage from '../admin/AdminProfilePage';
import AdminTablesPage from './ManagerTablesPage';
import AdminSettingsPage from '../admin/AdminSettingsPage';

const MANAGER_PATH_TO_TAB = {
  '/manager': 'manager-dashboard',
  '/manager/': 'manager-dashboard',
  '/manager/dashboard': 'manager-dashboard',
  '/manager/orders': 'orders',
  '/manager/tables': 'tables',
  '/manager/staff': 'staff',
  '/manager/menu': 'menu',
  '/manager/coupons': 'coupons',
  '/manager/analytics': 'analytics',
  '/manager/settings': 'settings',
  '/manager/profile': 'profile'
};

const MANAGER_TAB_TO_PATH = {
  'manager-dashboard': '/manager/dashboard',
  'orders': '/manager/orders',
  'tables': '/manager/tables',
  'staff': '/manager/staff',
  'menu': '/manager/menu',
  'coupons': '/manager/coupons',
  'analytics': '/manager/analytics',
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
  const [activeTab, setActiveTab] = useState(() => getManagerTabFromCurrentPath());
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const contentViewportRef = useRef(null);
  const profileMenuRef = useRef(null);

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
  const branches = [
    'Jubilee Hills (Main Branch)',
    'Banjara Hills Branch',
    'Gachibowli Branch',
    'Hitech City Branch'
  ];
  const [selectedBranch, setSelectedBranch] = useState('Jubilee Hills (Main Branch)');
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleNextBranch = () => {
    const currentIndex = branches.indexOf(selectedBranch);
    const nextIndex = (currentIndex + 1) % branches.length;
    setSelectedBranch(branches[nextIndex]);
  };

  const navigationItems = [
    { id: 'manager-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'manager-orders', label: 'Order Management', icon: UtensilsCrossed },
    { id: 'manager-tables', label: 'Table Management', icon: Table2 },
    { id: 'manager-staff', label: 'Staff Management', icon: Users },
    { id: 'manager-menu', label: 'Menu Management', icon: UtensilsCrossed },
    { id: 'manager-coupons', label: 'Coupons & Discounts', icon: Ticket },
    { id: 'manager-reports', label: 'Shift Reports', icon: BarChart3 },
    { id: 'manager-settings', label: 'Branch Settings', icon: Settings },
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'manager-dashboard':
        return <ManagerDashboardHome setActiveTab={setActiveTab} />;
      case 'manager-orders':
        return <AdminOrdersPage />;
      case 'manager-tables':
        return <AdminTablesPage />;
      case 'manager-staff':
        return <AdminStaffPage subTab="staff-shifts" />;
      case 'manager-menu':
        return <AdminMenuPage />;
      case 'manager-coupons':
        return <AdminCouponsPage />;
      case 'manager-reports':
        return <AdminAnalyticsPage />;
      case 'manager-settings':
        return <AdminSettingsPage isManagerMode={true} />;
      case 'manager-profile':
        return <AdminProfilePage setActivePage={setActivePage} />;
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
              src="/logo.png"
              alt="Flavora Kitchen Logo"
              className="admin-brand-logo-img"
            />
            <div className="admin-brand-text">
              <div className="admin-brand-title" style={{ display: 'flex', gap: '0.3rem' }}>
                <span className="brand-favora">Flavora</span>
                <span className="brand-kitchen" style={{ color: '#FFFFFF' }}>Kitchen</span>
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
            RestoOS Manager • v3.4
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
              Flavora Resto Manager
            </h2>
          </div>

          <div className="admin-header-right">
            {/* Notifications Bell */}
            <div className="admin-header-icon-btn-wrapper">
              <button 
                className="admin-header-icon-btn" 
                aria-label="Notifications"
                onClick={() => setUnreadNotifications(0)}
              >
                <Bell size={19} color="#1E4636" />
                {unreadNotifications > 0 && (
                  <span className="admin-notif-dot">{unreadNotifications}</span>
                )}
              </button>
            </div>

            {/* Manager User Profile Card */}
            <div className="admin-user-profile-wrapper" ref={profileMenuRef} style={{ position: 'relative' }}>
              <div
                className="admin-user-profile-box"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="admin-user-avatar">
                  M
                </div>
                <div className="admin-user-info-text">
                  <div className="admin-user-name">Manager Rahul</div>
                  <div className="admin-user-role">RMSM-01 • Manager</div>
                </div>
                <ChevronDown size={14} color="#5C5C5C" />
              </div>

              {/* Profile Dropdown */}
              {userMenuOpen && (
                <div className="admin-profile-dropdown-menu">
                  <div className="admin-dropdown-user-info">
                    <div className="user-info-name">Rahul Verma</div>
                    <div className="user-info-email">manager@flavorakitchen.in</div>
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
                      setActivePage('admin');
                      setUserMenuOpen(false);
                    }}
                  >
                    <span>Switch to Admin View</span>
                  </button>
                  <div className="admin-dropdown-divider" />
                  <div style={{ padding: '0.5rem 0.75rem' }}>
                    <PowerOffSlide
                      duration={1500}
                      label="Logout"
                      onPowerOff={() => {
                        setUserMenuOpen(false);
                        localStorage.removeItem('flavora_auth_token');
                        setActivePage('login');
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

    </div>
  );
}
