import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DemoModal from './components/DemoModal';
import { useRestaurantBranding } from './context/RestaurantBrandingContext';
import { api } from './services/api';

import HomePage from './pages/HomePage';
import AboutUsPage from './pages/AboutUsPage';
import FeaturesPage from './pages/FeaturesPage';
import PerformancePage from './pages/PerformancePage';
import SecurityPage from './pages/SecurityPage';
import BlogsPage from './pages/BlogsPage';
import ContactUsPage from './pages/ContactUsPage';
import LoginPage from './pages/LoginPage';
import GalleryPage from './pages/GalleryPage';
import MenuPage from './pages/MenuPage';
import OffersPage from './pages/OffersPage';
import AdminLayout from './components/admin/AdminLayout';
import ManagerLayout from './components/manager/ManagerLayout';
import ChefLayout from './components/chef/ChefLayout';
import WaiterLayout from './components/waiter/WaiterLayout';
import ReceptionistLayout from './components/receptionist/ReceptionistLayout';

const getAuthState = () => {
  const token = sessionStorage.getItem('flavora_auth_token') || localStorage.getItem('flavora_auth_token');
  const loggedInFlag = sessionStorage.getItem('flavora_logged_in') === 'true' || localStorage.getItem('flavora_logged_in') === 'true';
  const role = (sessionStorage.getItem('flavora_user_role') || localStorage.getItem('flavora_user_role') || '').toLowerCase().trim();
  const isAuthenticated = Boolean(loggedInFlag && token && role);
  return { isAuthenticated, token, role };
};

const getAuthorizedDashboardPage = (targetRoute) => {
  const { isAuthenticated, role } = getAuthState();
  if (!isAuthenticated) return 'login';

  let roleDashboard = 'login';
  if (role === 'admin') roleDashboard = 'admin';
  else if (role === 'manager' || role === 'resto manager') roleDashboard = 'manager';
  else if (role === 'chef' || role === 'head chef') roleDashboard = 'chef';
  else if (role === 'waiter') roleDashboard = 'waiter';
  else if (role === 'receptionist' || role === 'host') roleDashboard = 'receptionist';

  if (targetRoute === 'admin') {
    return role === 'admin' ? 'admin' : roleDashboard;
  }
  if (targetRoute === 'manager') {
    return (role === 'manager' || role === 'resto manager' || role === 'admin') ? 'manager' : roleDashboard;
  }
  if (targetRoute === 'chef') {
    return (role === 'chef' || role === 'head chef' || role === 'admin') ? 'chef' : roleDashboard;
  }
  if (targetRoute === 'waiter') {
    return (role === 'waiter' || role === 'admin') ? 'waiter' : roleDashboard;
  }
  if (targetRoute === 'receptionist') {
    return (role === 'receptionist' || role === 'host' || role === 'admin') ? 'receptionist' : roleDashboard;
  }

  return roleDashboard;
};

export default function App() {
  const [activePage, setActivePageState] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();

    // Public customer dining menu QR bypass
    if (path.includes('/menu') || search.includes('table=')) {
      return 'menu';
    }
    if (path.includes('/receptionist')) {
      return getAuthorizedDashboardPage('receptionist');
    }
    if (path.includes('/chef')) {
      return getAuthorizedDashboardPage('chef');
    }
    if (path.includes('/waiter')) {
      return getAuthorizedDashboardPage('waiter');
    }
    if (path.includes('/manager')) {
      return getAuthorizedDashboardPage('manager');
    }
    if (path.includes('/admin')) {
      return getAuthorizedDashboardPage('admin');
    }

    const saved = localStorage.getItem('flavora_active_page');
    if (saved && ['admin', 'manager', 'chef', 'waiter', 'receptionist'].includes(saved)) {
      return getAuthorizedDashboardPage(saved);
    }
    return saved || 'home';
  });

  const [demoModalOpen, setDemoModalOpen] = useState(false);

  // Validate existing auth session/token with backend on app startup/refresh
  useEffect(() => {
    const { isAuthenticated, token } = getAuthState();
    if (isAuthenticated && token) {
      api.getMe()
        .then((res) => {
          const userObj = res.user || res;
          const role = userObj.role || res.role;
          if (userObj && role) {
            const normRole = String(role).toLowerCase().trim();
            sessionStorage.setItem('flavora_user_role', normRole);
            sessionStorage.setItem('flavora_user_data', JSON.stringify(userObj));
          }
        })
        .catch(() => {
          sessionStorage.clear();
          localStorage.removeItem('flavora_auth_token');
          localStorage.removeItem('flavora_logged_in');
          localStorage.removeItem('flavora_user_role');
          localStorage.removeItem('flavora_user_data');
          setActivePageState('login');
          window.history.pushState({}, '', '/login');
        });
    }
  }, []);

  const setActivePage = (newPage) => {
    const authorizedPage = ['admin', 'manager', 'chef', 'waiter', 'receptionist'].includes(newPage)
      ? getAuthorizedDashboardPage(newPage)
      : newPage;

    setActivePageState(authorizedPage);
    localStorage.setItem('flavora_active_page', authorizedPage);

    const { isAuthenticated } = getAuthState();
    if (authorizedPage === 'home') {
      window.history.pushState({}, '', '/');
    } else if (authorizedPage === 'receptionist' && isAuthenticated) {
      window.history.pushState({}, '', '/receptionist/dashboard');
    } else if (authorizedPage === 'admin' && isAuthenticated) {
      window.history.pushState({}, '', '/admin/dashboard');
    } else if (authorizedPage === 'manager' && isAuthenticated) {
      window.history.pushState({}, '', '/manager/dashboard');
    } else if (authorizedPage === 'chef' && isAuthenticated) {
      window.history.pushState({}, '', '/chef/dashboard');
    } else if (authorizedPage === 'waiter' && isAuthenticated) {
      window.history.pushState({}, '', '/waiter/dashboard');
    } else if (authorizedPage === 'login') {
      window.history.pushState({}, '', '/login');
    }
  };

  useEffect(() => {
    const handleUrlRouting = () => {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();

      if (path.includes('/menu') || search.includes('table=')) {
        setActivePageState('menu');
      } else if (path.includes('/receptionist')) {
        setActivePageState(getAuthorizedDashboardPage('receptionist'));
      } else if (path.includes('/chef')) {
        setActivePageState(getAuthorizedDashboardPage('chef'));
      } else if (path.includes('/waiter')) {
        setActivePageState(getAuthorizedDashboardPage('waiter'));
      } else if (path.includes('/manager')) {
        setActivePageState(getAuthorizedDashboardPage('manager'));
      } else if (path.includes('/admin')) {
        setActivePageState(getAuthorizedDashboardPage('admin'));
      }
    };

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => window.removeEventListener('popstate', handleUrlRouting);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePage]);

  // Lock background scrolling across ALL containers whenever any modal popup is open
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const modalOpen = document.querySelector('.admin-modal-backdrop, .modal-backdrop, [role="dialog"]');
      const containers = document.querySelectorAll('html, body, #root, main, .admin-content-viewport, .admin-dashboard-container, .admin-layout-main');

      if (modalOpen) {
        containers.forEach(el => {
          if (el) {
            el.style.overflow = 'hidden';
          }
        });
      } else {
        containers.forEach(el => {
          if (el) {
            el.style.overflow = '';
          }
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const renderCurrentPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage setActivePage={setActivePage} onOpenDemoModal={() => setDemoModalOpen(true)} />;
      case 'about':
        return <AboutUsPage setActivePage={setActivePage} onOpenDemoModal={() => setDemoModalOpen(true)} />;
      case 'gallery':
        return <GalleryPage onOpenDemoModal={() => setDemoModalOpen(true)} />;
      case 'menu':
        return <MenuPage onOpenDemoModal={() => setDemoModalOpen(true)} />;
      case 'offer':
        return <OffersPage setActivePage={setActivePage} onOpenDemoModal={() => setDemoModalOpen(true)} />;
      case 'features':
        return <FeaturesPage setActivePage={setActivePage} onOpenDemoModal={() => setDemoModalOpen(true)} />;
      case 'performance':
        return <PerformancePage setActivePage={setActivePage} onOpenDemoModal={() => setDemoModalOpen(true)} />;
      case 'security':
        return <SecurityPage setActivePage={setActivePage} onOpenDemoModal={() => setDemoModalOpen(true)} />;
      case 'blogs':
        return <BlogsPage setActivePage={setActivePage} />;
      case 'contact':
        return <ContactUsPage onOpenDemoModal={() => setDemoModalOpen(true)} />;
      case 'login':
        return <LoginPage setActivePage={setActivePage} />;
      case 'admin':
        return <AdminLayout setActivePage={setActivePage} />;
      case 'manager':
        return <ManagerLayout setActivePage={setActivePage} />;
      case 'chef':
        return <ChefLayout setActivePage={setActivePage} />;
      case 'waiter':
        return <WaiterLayout setActivePage={setActivePage} />;
      case 'receptionist':
        return <ReceptionistLayout setActivePage={setActivePage} />;
      default:
        return <HomePage setActivePage={setActivePage} onOpenDemoModal={() => setDemoModalOpen(true)} />;
    }
  };

  const { branding } = useRestaurantBranding();
  const isBannerVisible = branding && branding.announcementEnabled !== false && Boolean(branding.announcementMessage || branding.announcementBadge);
  const isFullStandalonePage = activePage === 'login' || activePage === 'admin' || activePage === 'manager' || activePage === 'chef' || activePage === 'waiter' || activePage === 'receptionist';

  return (
    <div className="app-container">
      {!isFullStandalonePage && (
        <Navbar
          activePage={activePage}
          setActivePage={setActivePage}
          onOpenDemoModal={() => setDemoModalOpen(true)}
        />
      )}

      <main className="main-content" style={isFullStandalonePage ? { minHeight: '100vh' } : { paddingTop: isBannerVisible ? '86px' : '50px', transition: 'padding-top 0.3s ease' }}>
        {renderCurrentPage()}
      </main>

      {!isFullStandalonePage && (
        <Footer
          setActivePage={setActivePage}
          onOpenDemoModal={() => setDemoModalOpen(true)}
        />
      )}

      <DemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </div>
  );
}
