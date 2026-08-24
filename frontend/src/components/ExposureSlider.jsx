import React, { useState, useEffect } from 'react';
import { Camera, ChevronLeft, ChevronRight, Sliders, Sun, Sparkles, Eye } from 'lucide-react';

export default function ExposureSlider({
  items = [
    { id: 1, title: 'Sushi & Fresh Cuts', category: 'Culinary Artistry', desc: 'Precision knife techniques & ocean-fresh raw cuts.', img: '/chef_plating.png', iso: '100', aperture: 'f/1.4', shutter: '1/500s' },
    { id: 2, title: 'Woodfired Pizza Oven', category: 'Live Clay Oven', desc: 'Charcoal flames baking Neapolitan crusts at 450°C.', img: '/carousel_1.png', iso: '200', aperture: 'f/2.0', shutter: '1/250s' },
    { id: 3, title: 'Chef Hand Cooking', category: 'Master Chef Craft', desc: 'Hand-tossed pan aromatics & royal heritage sauces.', img: '/hero_dish_1.png', iso: '400', aperture: 'f/1.8', shutter: '1/1000s' },
    { id: 4, title: 'Precision Garnishing', category: 'Plating Studio', desc: 'Micro-greens, saffron threads & edible gold foil.', img: '/hero_dish_2.png', iso: '100', aperture: 'f/1.4', shutter: '1/400s' },
    { id: 5, title: 'Artisanal Bowl Presentation', category: 'Plating Studio', desc: 'Handcrafted ceramic bowls showcasing rich gravies.', img: '/carousel_2.png', iso: '160', aperture: 'f/2.2', shutter: '1/320s' },
    { id: 6, title: 'Clay Tandoori Oven', category: 'Live Clay Oven', desc: 'Authentic clay pot roasting with hand-ground spices.', img: '/tandoor_oven.png', iso: '320', aperture: 'f/1.8', shutter: '1/640s' }
  ]
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [exposure, setExposure] = useState(65);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Auto progression every 2.5 second (2.5sec/img)
  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % items.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isAutoPlay, items.length]);

  const handleNext = () => {
    setActiveIndex(prev => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setActiveIndex(prev => (prev - 1 + items.length) % items.length);
  };
  return (
    <div 
      className="smoothui-exposure-slider" 
      style={{ 
        width: '100%', 
        maxWidth: '1200px', 
        margin: '0 auto', 
        backgroundColor: 'transparent', 
        borderRadius: '0', 
        padding: '0', 
        boxShadow: 'none',
        border: 'none',
        color: '#1E4636'
      }}
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      
      {/* Main Exposure Cards Flex Gallery */}
      <div style={{ display: 'flex', gap: '1rem', minHeight: '340px', height: '360px', width: '100%' }}>
        {items.map((item, idx) => {
          const isActive = idx === activeIndex;
          const brightnessFactor = isActive ? 0.8 + (exposure / 200) : 0.65;

          return (
            <div
              key={item.id || idx}
              onClick={() => { setActiveIndex(idx); setIsAutoPlay(false); }}
              style={{
                flex: isActive ? '3.5' : '1',
                height: '100%',
                borderRadius: '18px',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
                border: isActive ? '2.5px solid #FF8A00' : '2px solid #FFFFFF',
                boxShadow: isActive ? '0 15px 35px rgba(255, 138, 0, 0.3)' : '0 6px 18px rgba(0, 0, 0, 0.08)',
                userSelect: 'none'
              }}
            >
              {/* Background Photo with Dynamic Exposure Brightness Filter */}
              <img
                src={item.img}
                alt={item.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: `brightness(${brightnessFactor}) contrast(1.08)`,
                  transform: isActive ? 'scale(1.04)' : 'scale(1)',
                  transition: 'transform 0.7s cubic-bezier(0.25, 1, 0.5, 1), filter 0.3s ease'
                }}
              />

              {/* Exposure Gradient Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: isActive
                    ? 'linear-gradient(to top, rgba(15, 42, 29, 0.95) 0%, rgba(15, 42, 29, 0.3) 60%, transparent 100%)'
                    : 'linear-gradient(to top, rgba(15, 42, 29, 0.85) 0%, transparent 60%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: isActive ? '1.5rem' : '1rem',
                  transition: 'all 0.4s ease'
                }}
              >
                {isActive && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255, 138, 0, 0.25)', color: '#FF8A00', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', width: 'fit-content', border: '1px solid rgba(255, 138, 0, 0.4)' }}>
                    <Sparkles size={12} />
                    <span>{item.category}</span>
                  </div>
                )}

                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: isActive ? '1.3rem' : '0.85rem', fontWeight: 800, color: '#FFFFFF', whiteSpace: isActive ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </h4>

                {isActive && (
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#D1D5DB', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.desc}
                  </p>
                )}
              </div>

             

            </div>
          );
        })}
      </div>



    </div>
  );
}
