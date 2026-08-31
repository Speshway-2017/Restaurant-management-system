import React, { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, Sparkles, Utensils, Flame, UserCheck } from 'lucide-react';
import InfiniteSlider from '../components/InfiniteSlider';

import { useRestaurantBranding } from '../context/RestaurantBrandingContext';

export default function GalleryPage({ onOpenDemoModal }) {
  const { branding, brandName, fetchBranding } = useRestaurantBranding();
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchBranding();
    const handleSync = () => {
      fetchBranding();
    };
    window.addEventListener('flavora_gallery_updated', handleSync);
    return () => window.removeEventListener('flavora_gallery_updated', handleSync);
  }, [fetchBranding]);

  const defaultItems = [
    { id: 1, category: 'ambience', src: '/carousel_1.png', title: 'Luxury Dining Hall', desc: 'Warm ambient lighting & royal seating setup' },
    { id: 2, category: 'dishes', src: '/carousel_2.png', title: 'Gourmet Indian Feast', desc: 'Authentic curry spread with butter naan' },
    { id: 3, category: 'kitchen', src: '/carousel_3.png', title: 'Kitchen Pass Station', desc: 'Chefs plating fresh tandoori appetizers' },
    { id: 4, category: 'kitchen', src: '/chef_plating.png', title: 'Plating Artistry', desc: 'Precision garnishing by Executive Chef' },
    { id: 5, category: 'kitchen', src: '/tandoor_oven.png', title: 'Clay Tandoori Oven', desc: 'Fresh naan pulled from 400°C clay oven' },
    { id: 6, category: 'chefs', src: '/chef_1.png', title: 'Chef Vikram Roy', desc: 'Executive Culinary Director in action' },
    { id: 7, category: 'chefs', src: '/chef_2.png', title: 'Chef Ananya Sharma', desc: 'Master Tandoori & Dessert Specialist' },
    { id: 8, category: 'dishes', src: '/carousel_2.png', title: 'Hyderabadi Dum Biryani', desc: 'Fragrant basmati rice cooked on dum' },
    { id: 9, category: 'ambience', src: '/carousel_1.png', title: 'Private Dining Section', desc: 'Exclusive booth seating for families' },
  ];

  const galleryItems = (branding && Array.isArray(branding.gallery) && branding.gallery.length > 0)
    ? branding.gallery
    : (() => {
        try {
          const s = localStorage.getItem('flavora_gallery');
          if (s) {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        } catch(e) {}
        return defaultItems;
      })();

  const filteredItems = activeCategory === 'all' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeCategory);

  return (
    <div className="gallery-page">
      {/* Hero Header (Unified Page Hero System) */}
      <section className="page-hero-banner-unified">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="page-hero-badge-unified">
            <Camera size={14} />
            <span>VISUAL ATMOSPHERE & ARTISTRY</span>
          </div>

          <h1 className="page-hero-title-unified">
            Photo Gallery
          </h1>

          <p className="page-hero-subtitle-unified">
            Immerse yourself in the culinary artistry, clay tandoori craftsmanship, and royal dining atmosphere of {brandName}.
          </p>
        </div>
      </section>

      {/* SmoothUI Infinite Marquee Carousel Banner */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '2rem 1rem', borderBottom: '1px solid var(--color-neutral-200)' }}>
        <InfiniteSlider gap={16} speed={30} speedOnHover={0}>
          {galleryItems.map((item) => (
            <div
              key={item.id}
              style={{
                width: '240px',
                height: '140px',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
              }}
            >
              <img
                src={item.src}
                alt={item.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(20, 47, 36, 0.82) 0%, transparent 60%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '0.75rem',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 700
                }}
              >
                {item.title}
              </div>
            </div>
          ))}
        </InfiniteSlider>
      </section>

      {/* Gallery Grid */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '3.5rem 1.5rem 5rem 1.5rem' }}>
        <div className="section" style={{ padding: 0 }}>
          <div className="grid-3">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                className="card" 
                style={{ 
                  padding: 0, 
                  overflow: 'hidden', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--color-neutral-200)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ position: 'relative', overflow: 'hidden', height: '230px' }}>
                  <img 
                    src={item.src} 
                    alt={item.title} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease'
                    }} 
                  />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(11, 27, 20, 0.82)',
                    color: '#FFFFFF',
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    backdropFilter: 'blur(4px)'
                  }}>
                    {item.category}
                  </div>
                </div>

                <div style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                  <h3 className="text-h2" style={{ fontSize: '1.15rem', color: 'var(--color-primary-dark)', marginBottom: '0.35rem' }}>
                    {item.title}
                  </h3>
                  <p className="text-body" style={{ color: 'var(--color-neutral-600)', fontSize: '0.88rem' }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
