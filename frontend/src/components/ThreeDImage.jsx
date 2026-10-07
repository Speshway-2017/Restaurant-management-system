import React, { useState, useRef, useEffect } from 'react';
import { Star, ShieldCheck, Sparkles, Utensils } from 'lucide-react';

export default function ThreeDImage({
  src = '/restaurant_ambience.png',
  alt = 'Restaurant Ambience',
  maxHeight = '360px',
  borderRadius = '24px',
  className = '',
  style = {},
  showBadges = true,
  maxRotation = 18, // max rotation in degrees
  perspective = 1000,
  scaleOnHover = 1.05
}) {
  const containerRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState({});
  const [glareStyle, setGlareStyle] = useState({ opacity: 0 });
  const [shadowStyle, setShadowStyle] = useState({});
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate cursor center relative offsets (-0.5 to 0.5)
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const offsetX = x - 0.5;
    const offsetY = y - 0.5;

    // Calculate 3D Rotation (RotateY depends on X offset, RotateX on Y offset inverted)
    const rotateY = offsetX * (maxRotation * 2);
    const rotateX = -offsetY * (maxRotation * 2);

    // Light position glare percentage (0 to 100)
    const glareX = x * 100;
    const glareY = y * 100;

    // Dynamic shadow shift based on rotation
    const shadowX = -rotateY * 1.5;
    const shadowY = rotateX * 1.5 + 20;
    const shadowBlur = 35 + Math.abs(offsetX * 20);

    setTransformStyle({
      transform: `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scaleOnHover}, ${scaleOnHover}, ${scaleOnHover})`,
      transition: 'transform 0.1s cubic-bezier(0.2, 0, 0.4, 1)'
    });

    setGlareStyle({
      opacity: 0.45,
      background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.1) 35%, transparent 70%)`,
      transition: 'opacity 0.2s ease-out'
    });

    setShadowStyle({
      boxShadow: `${shadowX.toFixed(1)}px ${shadowY.toFixed(1)}px ${shadowBlur.toFixed(1)}px rgba(0, 0, 0, 0.55), 0 0 30px rgba(255, 138, 0, 0.25)`
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransformStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)'
    });
    setGlareStyle({
      opacity: 0,
      transition: 'opacity 0.6s ease-out'
    });
    setShadowStyle({
      boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 138, 0, 0.15)',
      transition: 'box-shadow 0.6s ease-out'
    });
  };

  return (
    <div
      className={`threed-image-wrapper ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '100%',
        perspective: `${perspective}px`,
        perspectiveOrigin: 'center center',
        ...style
      }}
    >
      {/* Dynamic Ambient Background Aura / Backdrop Glow */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '5%',
          right: '5%',
          bottom: '5%',
          borderRadius: borderRadius,
          background: 'radial-gradient(circle, rgba(255, 138, 0, 0.35) 0%, rgba(30, 70, 54, 0.4) 60%, transparent 100%)',
          filter: 'blur(28px)',
          opacity: isHovered ? 0.95 : 0.6,
          transform: isHovered ? 'scale(1.08)' : 'scale(1)',
          transition: 'all 0.5s ease-out',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      {/* Main 3D Card Frame */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'relative',
          zIndex: 2,
          borderRadius: borderRadius,
          overflow: 'hidden',
          cursor: 'pointer',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          backgroundColor: '#14201A',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 138, 0, 0.15)',
          ...shadowStyle,
          ...transformStyle
        }}
      >
        {/* Ambient Idle 3D Float wrapper if not mouse-over */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            animation: !isHovered ? 'ambient3DFloat 5s ease-in-out infinite' : 'none'
          }}
        >
          {/* Main Image */}
          <img
            src={src}
            alt={alt}
            style={{
              width: '100%',
              maxHeight: maxHeight,
              objectFit: 'cover',
              display: 'block',
              borderRadius: borderRadius,
              transform: 'translateZ(0px)',
              transition: 'filter 0.3s ease',
              filter: isHovered ? 'brightness(1.04) contrast(1.03)' : 'brightness(1)'
            }}
          />

          {/* Dynamic Light Specular Glare Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: borderRadius,
              pointerEvents: 'none',
              mixBlendMode: 'overlay',
              transform: 'translateZ(20px)',
              ...glareStyle
            }}
          />

          {/* Subtle Dynamic Border Highlight Line */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: borderRadius,
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              pointerEvents: 'none',
              transform: 'translateZ(25px)'
            }}
          />

          {/* Floating 3D Badge 1: Top Right - Rating Badge */}
          {showBadges && (
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                backgroundColor: 'rgba(15, 24, 19, 0.82)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 138, 0, 0.5)',
                borderRadius: '14px',
                padding: '0.45rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#FFFFFF',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
                transform: isHovered ? 'translateZ(45px) scale(1.05)' : 'translateZ(30px) scale(1)',
                transition: 'transform 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
                pointerEvents: 'none'
              }}
            >
              <Star size={15} color="#FF8A00" fill="#FF8A00" />
              <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.02em', color: '#FFF' }}>
                4.9 <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>(500+ Reviews)</span>
              </span>
            </div>
          )}

          {/* Floating 3D Badge 2: Bottom Left - VIP Dining Badge */}
          {showBadges && (
            <div
              style={{
                position: 'absolute',
                bottom: '18px',
                left: '18px',
                backgroundColor: 'rgba(15, 24, 19, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '14px',
                padding: '0.5rem 0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#FFFFFF',
                boxShadow: '0 10px 24px rgba(0, 0, 0, 0.45)',
                transform: isHovered ? 'translateZ(55px) scale(1.06)' : 'translateZ(35px) scale(1)',
                transition: 'transform 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
                pointerEvents: 'none'
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 138, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Sparkles size={16} color="#FF8A00" />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FF8A00', lineHeight: 1.1 }}>
                  Luxury Ambience
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>
                  Live Music & Chef Tables
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded CSS for keyframes */}
      <style>{`
        @keyframes ambient3DFloat {
          0%, 100% {
            transform: translateY(0px) rotateX(0deg) rotateY(0deg);
          }
          50% {
            transform: translateY(-8px) rotateX(2deg) rotateY(-2deg);
          }
        }
      `}</style>
    </div>
  );
}
