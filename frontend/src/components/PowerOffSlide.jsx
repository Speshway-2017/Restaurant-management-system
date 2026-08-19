import React, { useState, useRef, useEffect } from 'react';
import { Power, LogOut, Check } from 'lucide-react';

export default function PowerOffSlide({
  onPowerOff,
  label = 'Slide to Logout',
  duration = 1500,
  className = '',
  style = {}
}) {
  const containerRef = useRef(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const getMaxDrag = () => {
    if (!containerRef.current) return 180;
    const containerWidth = containerRef.current.offsetWidth;
    const handleWidth = 44; // Handle button size
    return Math.max(containerWidth - handleWidth - 8, 100);
  };

  const handleStart = (clientX) => {
    if (isUnlocked) return;
    setIsDragging(true);
  };

  const handleMove = (clientX) => {
    if (!isDragging || !containerRef.current || isUnlocked) return;
    const rect = containerRef.current.getBoundingClientRect();
    const maxDrag = getMaxDrag();
    const currentX = clientX - rect.left - 24;
    const clampedX = Math.max(0, Math.min(currentX, maxDrag));
    setDragX(clampedX);

    // If dragged near the end (>85%)
    if (clampedX >= maxDrag * 0.85) {
      setIsUnlocked(true);
      setDragX(maxDrag);
      setIsDragging(false);
      if (onPowerOff) {
        setTimeout(() => {
          onPowerOff();
        }, 300);
      }
    }
  };

  const handleEnd = () => {
    if (!isDragging || isUnlocked) return;
    setIsDragging(false);
    // Snap back to zero
    setDragX(0);
  };

  // Mouse event listeners
  const onMouseDown = (e) => handleStart(e.clientX);
  
  useEffect(() => {
    const onMouseMove = (e) => {
      if (isDragging) handleMove(e.clientX);
    };
    const onMouseUp = () => {
      if (isDragging) handleEnd();
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  // Touch event listeners
  const onTouchStart = (e) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  const maxDrag = getMaxDrag();
  const progressPercent = Math.min((dragX / maxDrag) * 100, 100);

  return (
    <div
      ref={containerRef}
      className={`power-off-slide-track ${isUnlocked ? 'is-unlocked' : ''} ${className}`}
      style={{
        position: 'relative',
        height: '48px',
        width: '100%',
        maxWidth: '240px',
        backgroundColor: '#1E293B',
        borderRadius: '9999px',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        userSelect: 'none',
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.4), 0 4px 14px rgba(0, 0, 0, 0.15)',
        cursor: 'grab',
        ...style
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Sliding Progress Fill */}
      <div
        className="power-off-fill"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${progressPercent}%`,
          background: isUnlocked
            ? 'linear-gradient(to right, #E07A3C, #C0392B)'
            : 'linear-gradient(to right, #1E4636, #E07A3C)',
          borderRadius: '9999px',
          transition: isDragging ? 'none' : `width ${duration}ms cubic-bezier(0.2, 0.8, 0.2, 1)`
        }}
      />

      {/* Label Text */}
      <span
        className="power-off-label"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: '0.82rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: isUnlocked ? '#FFFFFF' : 'rgba(255, 255, 255, 0.88)',
          textTransform: 'uppercase',
          pointerEvents: 'none',
          opacity: Math.max(1 - progressPercent / 60, 0.2),
          transition: 'opacity 0.2s ease'
        }}
      >
        {isUnlocked ? 'Logging Out...' : label}
      </span>

      {/* Handle Power Switch Button */}
      <div
        className="power-off-handle"
        onMouseDown={onMouseDown}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: isUnlocked ? '#C0392B' : '#FFFFFF',
          color: isUnlocked ? '#FFFFFF' : '#C0392B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 3px 10px rgba(0, 0, 0, 0.3)',
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : `transform ${duration}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
          zIndex: 3,
          cursor: isDragging ? 'grabbing' : 'grab',
          flexShrink: 0
        }}
      >
        {isUnlocked ? (
          <Check size={18} />
        ) : (
          <Power size={18} color="#C0392B" />
        )}
      </div>
    </div>
  );
}
