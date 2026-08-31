import React, { useRef, useState, useEffect } from 'react';
import { resolveDishImageUrl } from '../utils/menuRegistry';

export default function MenuDishStrip({ menuItems = [], onSelectDish }) {
  const containerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Inertia momentum refs
  const dragRef = useRef({
    isMouseDown: false,
    startX: 0,
    scrollLeft: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    dragDistance: 0,
    momentumFrame: null
  });

  const [outOfStockItems, setOutOfStockItems] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_out_of_stock_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('flavora_out_of_stock_items');
        if (saved) setOutOfStockItems(JSON.parse(saved));
      } catch (e) { }
    };
    window.addEventListener('flavora_menu_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('flavora_menu_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Single Source of Truth menu dishes
  const validDishes = (menuItems || []).filter(item => item && item.name);

  // Smooth continuous auto-scroll loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container || validDishes.length === 0) return;

    let animationFrameId;
    const scrollSpeed = 0.7; // Smooth slow marquee speed

    const step = () => {
      if (!isPaused && !dragRef.current.isMouseDown && dragRef.current.velocity === 0 && container) {
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 2) {
          container.scrollLeft = 0;
        } else {
          container.scrollLeft += scrollSpeed;
        }
      }
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPaused, validDishes]);

  if (validDishes.length === 0) return null;

  // Highlight the exact middle dish
  const middleIndex = Math.floor(validDishes.length / 2);

  // Apply momentum decay physics after user pushes/flings dishes fast
  const startMomentum = () => {
    const state = dragRef.current;
    if (state.momentumFrame) cancelAnimationFrame(state.momentumFrame);

    const decay = () => {
      const container = containerRef.current;
      if (!container || Math.abs(state.velocity) < 0.1) {
        state.velocity = 0;
        setIsPaused(false);
        return;
      }

      container.scrollLeft -= state.velocity * 16;
      state.velocity *= 0.93; // Smooth friction decay multiplier

      state.momentumFrame = requestAnimationFrame(decay);
    };

    state.momentumFrame = requestAnimationFrame(decay);
  };

  // Mouse / Touch Drag Start
  const handleDragStart = (pageX) => {
    const container = containerRef.current;
    if (!container) return;

    const state = dragRef.current;
    if (state.momentumFrame) cancelAnimationFrame(state.momentumFrame);

    state.isMouseDown = true;
    state.startX = pageX;
    state.scrollLeft = container.scrollLeft;
    state.lastX = pageX;
    state.lastTime = Date.now();
    state.velocity = 0;
    state.dragDistance = 0;

    setIsDragging(true);
    setIsPaused(true);
  };

  // Mouse / Touch Drag Move with Velocity Tracking
  const handleDragMove = (pageX) => {
    const state = dragRef.current;
    const container = containerRef.current;
    if (!state.isMouseDown || !container) return;

    const dx = pageX - state.lastX;
    const dt = Date.now() - state.lastTime || 16;

    state.velocity = dx / dt; // Push speed velocity ratio
    state.dragDistance += Math.abs(dx);
    state.lastX = pageX;
    state.lastTime = Date.now();

    const walk = (pageX - state.startX) * 1.4; // Responsive drag multiplier
    container.scrollLeft = state.scrollLeft - walk;
  };

  // Mouse / Touch Drag End
  const handleDragEnd = () => {
    const state = dragRef.current;
    if (!state.isMouseDown) return;

    state.isMouseDown = false;
    setIsDragging(false);

    if (Math.abs(state.velocity) > 0.2) {
      startMomentum();
    } else {
      setIsPaused(false);
    }
  };

  // Mouse Wheel Scroll with Proportional Speed
  const handleWheel = (e) => {
    if (e.deltaY !== 0 && containerRef.current) {
      containerRef.current.scrollLeft += e.deltaY * 1.2;
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={(e) => handleDragStart(e.pageX)}
      onMouseMove={(e) => handleDragMove(e.pageX)}
      onMouseUp={handleDragEnd}
      onMouseLeave={() => { handleDragEnd(); setIsPaused(false); setHoveredIdx(null); }}
      onTouchStart={(e) => handleDragStart(e.touches[0].pageX)}
      onTouchMove={(e) => handleDragMove(e.touches[0].pageX)}
      onTouchEnd={handleDragEnd}
      style={{
        width: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        padding: '1.25rem 0',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none'
      }}
      className="no-scrollbar"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.4rem',
          flexWrap: 'nowrap',
          padding: '0 1.5rem',
          width: 'max-content',
          margin: '0 auto',
          pointerEvents: isDragging ? 'none' : 'auto'
        }}
      >
        {validDishes.map((item, idx) => {
          const isMiddle = idx === middleIndex;
          const isHovered = hoveredIdx === idx;
          const dishImg = resolveDishImageUrl(item);
          const dishName = item.name;

          return (
            <div
              key={item.id || item._id || idx}
              onClick={() => {
                if (dragRef.current.dragDistance < 10 && onSelectDish) {
                  onSelectDish(item);
                }
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                flexShrink: 0,
                width: isMiddle ? '260px' : '170px',
                height: isMiddle ? '190px' : '140px',
                borderRadius: isMiddle ? '20px' : '16px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: isMiddle
                  ? '0 20px 45px rgba(255, 138, 0, 0.35), 0 0 25px rgba(255, 138, 0, 0.2)'
                  : isHovered
                    ? '0 12px 28px rgba(15, 42, 29, 0.18)'
                    : '0 8px 20px rgba(0, 0, 0, 0.08)',
                border: isMiddle ? '3px solid #FF8A00' : isHovered ? '2px solid #1E4636' : '2px solid #FFFFFF',
                alignSelf: 'center',
                transform: isMiddle
                  ? (isHovered ? 'scale(1.09) translateY(-8px)' : 'scale(1.06) translateY(-4px)')
                  : (isHovered ? 'scale(1.05) translateY(-6px)' : 'scale(1)'),
                transition: 'all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              {/* Highlight Crown Badge for Middle Dish */}
              {isMiddle && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  zIndex: 2,
                  backgroundColor: '#FF8A00',
                  color: '#FFFFFF',
                  fontSize: '0.66rem',
                  fontWeight: 900,
                  padding: '0.22rem 0.65rem',
                  borderRadius: '9999px',
                  boxShadow: '0 4px 12px rgba(255,138,0,0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  letterSpacing: '0.5px'
                }}>
                  👑 SIGNATURE DISH
                </div>
              )}

              <img
                src={dishImg}
                alt=""
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/hero_dish_2.png';
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: isMiddle
                    ? 'linear-gradient(to top, rgba(15,42,29,0.9) 0%, rgba(15,42,29,0.35) 55%, transparent 100%)'
                    : 'linear-gradient(to top, rgba(15,42,29,0.85) 0%, rgba(15,42,29,0.3) 50%, transparent 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: isMiddle ? '0.9rem' : '0.65rem'
                }}
              >
                <span
                  style={{
                    color: '#FFFFFF',
                    fontSize: isMiddle ? '0.96rem' : '0.78rem',
                    fontWeight: 800,
                    lineHeight: 1.25,
                    textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {dishName}
                </span>

                {isMiddle && (
                  <span style={{ color: '#E2E8F0', fontSize: '0.7rem', fontWeight: 600, marginTop: '2px' }}>
                    Chef's #1 Recommended Recipe
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
