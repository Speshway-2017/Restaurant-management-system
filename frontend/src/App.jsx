import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DemoModal from './components/DemoModal';

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

export default function App() {
  const [activePage, setActivePageState] = useState(() => {
    return localStorage.getItem('flavora_active_page') || 'login';
  });
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const setActivePage = (newPage) => {
    setActivePageState(newPage);
    localStorage.setItem('flavora_active_page', newPage);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePage]);

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
        return <OffersPage onOpenDemoModal={() => setDemoModalOpen(true)} />;
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
      default:
        return <HomePage setActivePage={setActivePage} onOpenDemoModal={() => setDemoModalOpen(true)} />;
    }
  };

  const isFullStandalonePage = activePage === 'login' || activePage === 'admin';

  return (
    <div className="app-container">
      {!isFullStandalonePage && (
        <Navbar 
          activePage={activePage} 
          setActivePage={setActivePage} 
          onOpenDemoModal={() => setDemoModalOpen(true)} 
        />
      )}

      <main className="main-content" style={isFullStandalonePage ? { minHeight: '100vh' } : {}}>
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
