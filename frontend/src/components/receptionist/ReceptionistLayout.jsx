import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Table2, Clock, CalendarDays, Users, Tv, Bell,
  Settings, ChevronDown, LogOut, Menu, X, ArrowLeft, UserCheck, Search, ShieldCheck, User,
  Home, ChevronRight, Moon, Sun
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
import { onSocketEvent } from '../../services/socket';

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
  const [activeBookingsBadge, setActiveBookingsBadge] = useState(0);

  useEffect(() => {
    const fetchResvCount = () => {
      api.getReceptionistReservations().then(res => {
        const list = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        const today = new Date().toISOString().split('T')[0];
        const active = list.filter(r => r.date >= today && r.status === 'Confirmed');
        setActiveBookingsBadge(active.length);
      }).catch(() => {});
    };

    fetchResvCount();
    const interval = setInterval(fetchResvCount, 5000);

    const unsub = onSocketEvent('reservation_created', () => {
      fetchResvCount();
    });

    const handleWin = () => fetchResvCount();
    window.addEventListener('flavora_reservation_created', handleWin);

    return () => {
      clearInterval(interval);
      if (typeof unsub === 'function') unsub();
      window.removeEventListener('flavora_reservation_created', handleWin);
    };
  }, []);

  const getSessionUser = () => {
    const raw = sessionStorage.getItem('flavora_user_data') || localStorage.getItem('flavora_user_data');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return null;
  };

  const currentSessionUser = getSessionUser();
  const receptionistAccountKey = currentSessionUser?._id || currentSessionUser?.id || 'default';
  const [receptionistDutyStatus, setReceptionistDutyStatus] = useState(() => {
    return localStorage.getItem(`flavora_receptionist_duty_status_${receptionistAccountKey}`) || localStorage.getItem('flavora_receptionist_duty_status') || 'LOGGED_IN';
  });

  useEffect(() => {
    const syncDutyStatus = () => {
      const saved = localStorage.getItem(`flavora_receptionist_duty_status_${receptionistAccountKey}`) || localStorage.getItem('flavora_receptionist_duty_status') || 'LOGGED_IN';
      setReceptionistDutyStatus(saved);
    };
    syncDutyStatus();
    window.addEventListener('flavora_receptionist_duty_updated', syncDutyStatus);
    window.addEventListener('storage', syncDutyStatus);
    return () => {
      window.removeEventListener('flavora_receptionist_duty_updated', syncDutyStatus);
      window.removeEventListener('storage', syncDutyStatus);
    };
  }, [receptionistAccountKey]);

  const handleToggleReceptionistDuty = () => {
    const nextStatus = receptionistDutyStatus === 'LOGGED_IN' ? 'LOGGED_OUT' : 'LOGGED_IN';
    setReceptionistDutyStatus(nextStatus);
    localStorage.setItem(`flavora_receptionist_duty_status_${receptionistAccountKey}`, nextStatus);
    window.dispatchEvent(new Event('flavora_receptionist_duty_updated'));
  };

  const [receptionistProfile, setReceptionistProfile] = useState(() => {
    const current = getSessionUser();
    if (current && current.name) {
      return {
        name: current.name,
        email: current.email || '',
        phone: current.phone || '',
        role: current.role || 'Receptionist',
        empId: current.empId || `RMSR-${String(current._id || current.id || '01').slice(-4).toUpperCase()}`
      };
    }
    return {
      name: 'Receptionist',
      email: '',
      phone: '',
      role: 'Receptionist',
      empId: 'RMSR-01'
    };
  });

  const contentViewportRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const fetchStaffFromDb = async () => {
      const current = getSessionUser();
      if (!current) return;

      try {
        const me = await api.getMe();
        if (me && me.name) {
          setReceptionistProfile({
            name: me.name,
            email: me.email || '',
            phone: me.phone || '',
            role: me.role || 'Receptionist',
            empId: me.empId || `RMSR-${String(me._id || me.id).slice(-4).toUpperCase()}`
          });
          return;
        }
      } catch (e) {}

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
                email: match.email || current.email || '',
                phone: match.phone || current.phone || '',
                role: match.role || current.role || 'Receptionist',
                empId: match.empId || current.empId || `RMSR-${String(match._id || match.id).slice(-4).toUpperCase()}`
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
          email: current.email || '',
          phone: current.phone || '',
          role: current.role || 'Receptionist',
          empId: current.empId || `RMSR-${String(current._id || current.id || '01').slice(-4).toUpperCase()}`
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
    { id: 'receptionist-reservations', label: 'Reservations', icon: CalendarDays, badge: activeBookingsBadge },
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
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Icon size={18} className="admin-nav-icon" />
                      <span className="admin-nav-label">{item.label}</span>
                    </div>
                    {item.badge > 0 && !sidebarCollapsed && (
                      <span style={{
                        backgroundColor: '#E07A3C',
                        color: '#FFFFFF',
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        padding: '0.12rem 0.45rem',
                        borderRadius: '9999px',
                        lineHeight: 1.2
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
            
            {/* Glassmorphism Orb Duty Toggle Switch */}
            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleToggleReceptionistDuty}
                title={receptionistDutyStatus === 'LOGGED_IN' ? 'Click to Check OUT' : 'Click to Check IN'}
                style={{
                  position: 'relative',
                  width: '94px',
                  height: '32px',
                  borderRadius: '20px',
                  background: receptionistDutyStatus === 'LOGGED_IN'
                    ? 'linear-gradient(135deg, #059669 0%, #10B981 50%, #06B6D4 100%)'
                    : 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 50%, #C084FC 100%)',
                  border: '1px solid ' + (receptionistDutyStatus === 'LOGGED_IN' ? 'rgba(52, 211, 153, 0.6)' : 'rgba(192, 132, 252, 0.6)'),
                  boxShadow: receptionistDutyStatus === 'LOGGED_IN'
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
                    left: receptionistDutyStatus === 'LOGGED_IN' ? '12px' : '36px',
                    color: '#FFFFFF',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-heading, sans-serif)',
                    letterSpacing: '0.02em',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {receptionistDutyStatus === 'LOGGED_IN' ? 'WORK' : 'REST'}
                </span>

                {/* 3D Translucent Glass Orb Knob */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    left: receptionistDutyStatus === 'LOGGED_IN' ? 'calc(100% - 35px)' : '-3px',
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
                  {receptionistDutyStatus === 'LOGGED_IN' ? (
                    <Sun size={16} color="#FFFFFF" style={{ filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))' }} />
                  ) : (
                    <Moon size={16} color="#FFFFFF" style={{ filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))' }} />
                  )}
                </div>
              </button>
            </div>

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

            {/* Notifications Button */}
            <div className="admin-header-icon-btn-wrapper" style={{ position: 'relative' }}>
              <button 
                type="button"
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
