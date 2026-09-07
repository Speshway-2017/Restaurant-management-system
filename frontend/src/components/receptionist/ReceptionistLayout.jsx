import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Table2, Clock, CalendarDays, Users, Tv, Bell,
  Settings, ChevronDown, LogOut, Menu, X, ArrowLeft, UserCheck, Search, ShieldCheck, User,
  Home, ChevronRight
} from 'lucide-react';
import PowerOffSlide from '../PowerOffSlide';

import ReceptionistDashboardHome from './ReceptionistDashboardHome';
import ReceptionistFloorPlanPage from './ReceptionistFloorPlanPage';
import ReceptionistWaitlistPage from './ReceptionistWaitlistPage';
import ReceptionistReservationsPage from './ReceptionistReservationsPage';
import ReceptionistGuestsPage from './ReceptionistGuestsPage';
import ReceptionistQueueDisplayPage from './ReceptionistQueueDisplayPage';
import ReceptionistNotificationsPage from './ReceptionistNotificationsPage';
import ReceptionistSettingsPage from './ReceptionistSettingsPage';
import ReceptionistProfilePage from './ReceptionistProfilePage';
import { useRestaurantBranding } from '../../context/RestaurantBrandingContext';
import { api } from '../../services/api';

const RECEPTIONIST_PATH_TO_TAB = {
  '/receptionist': 'receptionist-dashboard',
  '/receptionist/': 'receptionist-dashboard',
  '/receptionist/dashboard': 'receptionist-dashboard',
  '/receptionist/floor-plan': 'receptionist-floor-plan',
  '/receptionist/waitlist': 'receptionist-waitlist',
  '/receptionist/reservations': 'receptionist-reservations',
  '/receptionist/guests': 'receptionist-guests',
  '/receptionist/queue-display': 'receptionist-queue-display',
  '/receptionist/notifications': 'receptionist-notifications',
  '/receptionist/settings': 'receptionist-settings',
  '/receptionist/profile': 'receptionist-profile'
};

const RECEPTIONIST_TAB_TO_PATH = {
  'receptionist-dashboard': '/receptionist/dashboard',
  'receptionist-floor-plan': '/receptionist/floor-plan',
  'receptionist-waitlist': '/receptionist/waitlist',
  'receptionist-reservations': '/receptionist/reservations',
  'receptionist-guests': '/receptionist/guests',
  'receptionist-queue-display': '/receptionist/queue-display',
  'receptionist-notifications': '/receptionist/notifications',
  'receptionist-settings': '/receptionist/settings',
  'receptionist-profile': '/receptionist/profile'
};

const getBreadcrumbLabel = (tab) => {
  switch (tab) {
    case 'receptionist-dashboard':
      return 'Dashboard Overview';
    case 'receptionist-floor-plan':
      return 'Live Floor Plan & Seating';
    case 'receptionist-waitlist':
      return 'Waitlist Queue Management';
    case 'receptionist-reservations':
      return 'Table Reservations';
    case 'receptionist-guests':
      return 'Guest Database & History';
    case 'receptionist-queue-display':
      return 'Public Queue Display';
    case 'receptionist-notifications':
      return 'SMS & WhatsApp Alerts';
    case 'receptionist-settings':
      return 'Reception Settings';
    case 'receptionist-profile':
      return 'Host Profile';
    default:
      return 'Dashboard Overview';
  }
};

const getReceptionistTabFromPath = () => {
  const rawPath = (window.location.pathname || '').toLowerCase().trim();
  if (RECEPTIONIST_PATH_TO_TAB[rawPath]) return RECEPTIONIST_PATH_TO_TAB[rawPath];
  for (const [p, t] of Object.entries(RECEPTIONIST_PATH_TO_TAB)) {
    if (p !== '/receptionist' && rawPath.startsWith(p)) return t;
  }
  return 'receptionist-dashboard';
};

export default function ReceptionistLayout({ setActivePage }) {
  const { brandName, brandLogo } = useRestaurantBranding();
  const nameParts = brandName.trim().split(' ');
  const firstNamePart = nameParts[0] || 'Flavora';
  const restNamePart = nameParts.slice(1).join(' ');

  const [activeTab, setActiveTab] = useState(() => getReceptionistTabFromPath());
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navbarClockStr, setNavbarClockStr] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [powerModalOpen, setPowerModalOpen] = useState(false);

  const getSessionUser = () => {
    const raw = sessionStorage.getItem('flavora_user_data') || localStorage.getItem('flavora_user_data');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return null;
  };

  const [receptionistProfile, setReceptionistProfile] = useState(() => {
    const current = getSessionUser();
    if (current && current.name) {
      return {
        name: current.name,
        email: current.email || 'receptionist@rms.com',
        phone: current.phone || '',
        role: current.role || 'Host Desk',
        empId: current.empId || 'RMSR-01'
      };
    }
    return {
      name: 'Reception Desk',
      email: 'receptionist@rms.com',
      phone: '9876543210',
      role: 'Host Desk',
      empId: 'RMSR-01'
    };
  });

  const contentViewportRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const fetchStaffFromDb = () => {
      const current = getSessionUser();
      if (!current) return;

      api.getStaff()
        .then((staffList) => {
          if (Array.isArray(staffList) && staffList.length > 0) {
            const match = staffList.find(s => 
              (current._id && String(s._id || s.id) === String(current._id)) ||
              (current.id && String(s._id || s.id) === String(current.id)) ||
              (current.email && s.email && s.email.toLowerCase() === current.email.toLowerCase())
            );
            if (match && match.name) {
              const fetchedProfile = {
                name: match.name,
                email: match.email || current.email,
                phone: match.phone || current.phone || '',
                role: match.role || current.role || 'Host Desk',
                empId: match.empId || current.empId || 'RMSR-01'
              };
              setReceptionistProfile(fetchedProfile);
            }
          }
        })
        .catch((err) => {
          console.warn('Could not fetch receptionist profile from DB:', err.message);
        });
    };

    fetchStaffFromDb();

    const updateProfile = () => {
      const current = getSessionUser();
      if (current && current.name) {
        setReceptionistProfile({
          name: current.name,
          email: current.email || 'receptionist@rms.com',
          phone: current.phone || '',
          role: current.role || 'Host Desk',
          empId: current.empId || 'RMSR-01'
        });
      }
    };

    window.addEventListener('flavora_profile_updated', updateProfile);
    return () => window.removeEventListener('flavora_profile_updated', updateProfile);
  }, []);

  const getInitials = (nameStr) => {
    if (!nameStr) return 'RD';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return nameStr.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setNavbarClockStr(now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

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
    const handlePopState = () => {
      setActiveTab(getReceptionistTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setMobileSidebarOpen(false);
    const targetPath = RECEPTIONIST_TAB_TO_PATH[tabId] || '/receptionist/dashboard';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    if (contentViewportRef.current) {
      contentViewportRef.current.scrollTop = 0;
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('flavora_logged_in');
    sessionStorage.removeItem('flavora_auth_token');
    sessionStorage.removeItem('flavora_user_role');
    localStorage.removeItem('flavora_auth_token');
    localStorage.removeItem('flavora_logged_in');
    setActivePage('login');
  };

  const navItems = [
    { id: 'receptionist-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'receptionist-floor-plan', label: 'Floor Plan', icon: Table2 },
    { id: 'receptionist-waitlist', label: 'Waitlist Queue', icon: Clock },
    { id: 'receptionist-reservations', label: 'Reservations', icon: CalendarDays },
    { id: 'receptionist-guests', label: 'Guests', icon: Users },
    { id: 'receptionist-queue-display', label: 'Queue Display', icon: Tv },
    { id: 'receptionist-notifications', label: 'Notifications', icon: Bell },
    { id: 'receptionist-settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="admin-app-wrapper">
      
      {/* ==================== RECEPTIONIST SIDEBAR ==================== */}
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
              <div className="admin-brand-subtitle">
                RESTO RECEPTIONIST PORTAL
              </div>
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
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    className={`admin-nav-btn ${isActive ? 'is-active' : ''}`}
                    title={sidebarCollapsed ? item.label : ''}
                    onClick={() => handleTabChange(item.id)}
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

      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ==================== MAIN CONTENT WRAPPER ==================== */}
      <div className={`admin-main-wrapper ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
        
        {/* Header Navigation Bar */}
        <header className="admin-top-header">
          {/* Left: Hamburger & Title */}
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

            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1E4636', fontFamily: 'var(--font-heading)' }}>
                {brandName} Reception Desk
              </h2>
              
            </div>
          </div>

          {/* Right: Clock, Notifications, Profile */}
          <div className="admin-header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            
            {/* Live 24-Hour Navbar Clock */}
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

            {/* Notifications Button */}
            <div className="admin-header-icon-btn-wrapper" style={{ position: 'relative' }}>
              <button 
                className="admin-header-icon-btn" 
                aria-label="Notifications"
                onClick={() => handleTabChange('receptionist-notifications')}
                style={{ position: 'relative' }}
              >
                <Bell size={19} color="#1E4636" />
                <span className="admin-notif-dot" style={{ backgroundColor: '#EF4444', color: '#FFFFFF', fontSize: '0.65rem', fontWeight: 900, padding: '0.1rem 0.35rem', borderRadius: '9999px', position: 'absolute', top: '-4px', right: '-4px' }}>
                  3
                </span>
              </button>
            </div>

            {/* Receptionist User Profile Card */}
            <div className="admin-user-profile-wrapper" ref={profileMenuRef} style={{ position: 'relative' }}>
              <div
                className="admin-user-profile-box"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{ cursor: 'pointer' }}
              >
                <div className="admin-user-avatar" style={{ backgroundColor: '#0F2A1D', color: '#FFFFFF', overflow: 'hidden' }}>
                  {receptionistProfile.avatarUrl ? (
                    <img src={receptionistProfile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(receptionistProfile.name)
                  )}
                </div>
                <div className="admin-user-info-text">
                  <div className="admin-user-name">{receptionistProfile.name}</div>
                  <div className="admin-user-role">{receptionistProfile.empId || 'HST-01'} • Receptionist</div>
                </div>
                <ChevronDown size={14} color="#5C5C5C" />
              </div>

              {/* Profile Dropdown Menu */}
              {userMenuOpen && (
                <div className="admin-profile-dropdown-menu">
                  <div className="admin-dropdown-user-info">
                    <div className="user-info-name">{receptionistProfile.name}</div>
                    <div className="user-info-email">{receptionistProfile.email}</div>
                  </div>
                  <button
                    className="admin-dropdown-item"
                    onClick={() => {
                      handleTabChange('receptionist-profile');
                      setUserMenuOpen(false);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}
                  >
                    <User size={16} color="#0F2A1D" />
                    <span>My Profile</span>
                  </button>
                  <button
                    className="admin-dropdown-item"
                    onClick={() => {
                      handleTabChange('receptionist-settings');
                      setUserMenuOpen(false);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}
                  >
                    <Settings size={16} color="#0F2A1D" />
                    <span>Settings</span>
                  </button>
                  <div className="admin-dropdown-divider" />
                  <div style={{ padding: '0.5rem 0.75rem' }}>
                    <PowerOffSlide
                      duration={1500}
                      label="Logout"
                      onPowerOff={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Dynamic Viewport View Component */}
        <main ref={contentViewportRef} className="admin-content-viewport" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
          
          {/* Breadcrumb Navigation Bar matching Waiter Dashboard */}
          <div className="page-breadcrumb-bar" style={{ marginBottom: '1.25rem' }}>
            <span
              className="crumb-link"
              onClick={() => handleTabChange('receptionist-dashboard')}
            >
              Receptionist
            </span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">{getBreadcrumbLabel(activeTab)}</span>
          </div>

          {activeTab === 'receptionist-dashboard' && <ReceptionistDashboardHome onNavigate={handleTabChange} />}
          {activeTab === 'receptionist-floor-plan' && <ReceptionistFloorPlanPage />}
          {activeTab === 'receptionist-waitlist' && <ReceptionistWaitlistPage />}
          {activeTab === 'receptionist-reservations' && <ReceptionistReservationsPage />}
          {activeTab === 'receptionist-guests' && <ReceptionistGuestsPage />}
          {activeTab === 'receptionist-queue-display' && <ReceptionistQueueDisplayPage />}
          {activeTab === 'receptionist-notifications' && <ReceptionistNotificationsPage />}
          {activeTab === 'receptionist-settings' && <ReceptionistSettingsPage />}
          {activeTab === 'receptionist-profile' && <ReceptionistProfilePage />}
        </main>
      </div>

      {/* Logout Power Confirmation Modal */}
      {powerModalOpen && (
        <PowerOffSlide
          isOpen={powerModalOpen}
          onClose={() => setPowerModalOpen(false)}
          onConfirm={handleLogout}
        />
      )}

    </div>
  );
}
