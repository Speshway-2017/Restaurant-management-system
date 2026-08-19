import React, { useState } from 'react';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Table2, CalendarDays,
  Users, Clock, Boxes, Ticket, BarChart3, Receipt, Settings, ShieldCheck,
  Building2, FileText, Search, Bell, ChevronDown, LogOut, Menu, X, ArrowLeft,
  CheckCircle2, Plus, Sparkles, Filter, RefreshCw, User, ChevronRight
} from 'lucide-react';
import PowerOffSlide from '../PowerOffSlide';

// Import Admin Sub-pages
import AdminDashboardHome from './AdminDashboardHome';
import AdminOrdersPage from './AdminOrdersPage';
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

export default function AdminLayout({ setActivePage }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('Jubilee Hills (Main Branch)');
  const [unreadNotifications, setUnreadNotifications] = useState(4);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
    { id: 'staff-accounts', label: 'Staff Management', icon: Users },
    { id: 'coupons', label: 'Loyalty & Coupons', icon: Ticket },
    { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'payments', label: 'Payments & Settlements', icon: Receipt },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getBreadcrumbLabel = (tab) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'menu-mgmt': return 'Menu Management';
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
      case 'orders':
        return <AdminOrdersPage />;
      case 'menu-mgmt':
        return <AdminMenuPage />;
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
        return <AdminAnalyticsPage />;
      case 'payments':
        return <AdminPaymentsPage />;
      case 'profile':
        return <AdminProfilePage />;
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
              src="/logo.png"
              alt="Flavora Kitchen Logo"
              className="admin-brand-logo-img"
            />
            <div className="admin-brand-text">
              <div className="admin-brand-title">
                <span className="brand-favora">Flavora</span>
                <span className="brand-kitchen" style={{ color: '#FFFFFF' }}>Kitchen</span>
              </div>
              <div className="admin-brand-subtitle">RESTO PLATFORM ADMIN</div>
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
                      window.scrollTo({ top: 0, behavior: 'smooth' });
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
            Flavora RestoOS v3.4 • India
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
              Flavora Resto Admin
            </h2>
          </div>

          <div className="admin-header-right">
            {/* Branch Badge Selector with Next Branch Button */}
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

              {/* Next Branch Navigation Button */}
              <button
                type="button"
                className="admin-next-branch-btn"
                onClick={handleNextBranch}
                aria-label="Next branch"
                title="Switch to Next Branch"
                style={{
                  background: '#1E4636',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.65rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                <span>Next</span>
                <ChevronRight size={14} color="#F2C14E" />
              </button>
            </div>

            {/* Notifications Bell */}
            <div className="admin-header-icon-btn-wrapper">
              <button className="admin-header-icon-btn" aria-label="Notifications">
                <Bell size={19} color="#1E4636" />
                {unreadNotifications > 0 && (
                  <span className="admin-notif-dot">{unreadNotifications}</span>
                )}
              </button>
            </div>

            {/* Admin User Profile Dropdown */}
            <div className="admin-user-profile-wrapper" style={{ position: 'relative' }}>
              <div
                className="admin-user-profile-box"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{ cursor: 'pointer' }}
              >
                <div className="admin-user-avatar">SK</div>
                <div className="admin-user-details">
                  <div className="admin-user-name">Chef Srikanth</div>
                  <div className="admin-user-role">Resto Manager</div>
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
                      <div className="user-info-name">Chef Srikanth</div>
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
                          localStorage.removeItem('flavora_auth_token');
                          setActivePage('login');
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
        <main className="admin-content-viewport">
          {renderActiveView()}
        </main>

      </div>

    </div>
  );
}
