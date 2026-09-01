import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DemoModal from './components/DemoModal';
import { useRestaurantBranding } from './context/RestaurantBrandingContext';

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

export default function App() {
  const getIsLoggedIn = () => Boolean(
    sessionStorage.getItem('flavora_logged_in') === 'true' ||
    sessionStorage.getItem('flavora_auth_token')
  );

  const [activePage, setActivePageState] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const isLoggedIn = getIsLoggedIn();

    // If QR code scanned or URL contains /menu or ?table=, open 'menu' directly without login!
    if (path.includes('/menu') || search.includes('table=')) {
      return 'menu';
    }
    if (path.includes('/receptionist')) {
      return isLoggedIn ? 'receptionist' : 'login';
    }
    if (path.includes('/chef')) {
      return isLoggedIn ? 'chef' : 'login';
    }
    if (path.includes('/waiter')) {
      return isLoggedIn ? 'waiter' : 'login';
    }
    if (path.includes('/manager')) {
      return isLoggedIn ? 'manager' : 'login';
    }
    if (path.includes('/admin')) {
      return isLoggedIn ? 'admin' : 'login';
    }

    const saved = localStorage.getItem('flavora_active_page');
    if (saved) {
      if ((saved === 'admin' || saved === 'manager' || saved === 'chef' || saved === 'receptionist') && !isLoggedIn) {
        return 'home';
      }
      return saved;
    }
    return 'home';
  });

  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const setActivePage = (newPage) => {
    setActivePageState(newPage);
    localStorage.setItem('flavora_active_page', newPage);

    const isLoggedIn = getIsLoggedIn();
    if (newPage === 'home') {
      window.history.pushState({}, '', '/');
    } else if (newPage === 'receptionist' && isLoggedIn) {
      window.history.pushState({}, '', '/receptionist/dashboard');
    } else if (newPage === 'admin' && isLoggedIn) {
      window.history.pushState({}, '', '/admin/dashboard');
    } else if (newPage === 'manager' && isLoggedIn) {
      window.history.pushState({}, '', '/manager/dashboard');
    } else if (newPage === 'chef' && isLoggedIn) {
      window.history.pushState({}, '', '/chef/dashboard');
    } else if (newPage === 'waiter' && isLoggedIn) {
      window.history.pushState({}, '', '/waiter/dashboard');
    } else if (newPage === 'login') {
      window.history.pushState({}, '', '/login');
    }
  };

  useEffect(() => {
    const handleUrlRouting = () => {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const isLoggedIn = getIsLoggedIn();

      if (path.includes('/menu') || search.includes('table=')) {
        setActivePageState('menu');
      } else if (path.includes('/receptionist')) {
        setActivePageState(isLoggedIn ? 'receptionist' : 'login');
      } else if (path.includes('/chef')) {
        setActivePageState(isLoggedIn ? 'chef' : 'login');
      } else if (path.includes('/waiter')) {
        setActivePageState(isLoggedIn ? 'waiter' : 'login');
      } else if (path.includes('/manager')) {
        setActivePageState(isLoggedIn ? 'manager' : 'login');
      } else if (path.includes('/admin')) {
        setActivePageState(isLoggedIn ? 'admin' : 'login');
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
