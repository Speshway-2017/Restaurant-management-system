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
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

    </div>
  );
}
