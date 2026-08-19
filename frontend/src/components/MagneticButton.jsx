import React, { useState, useRef } from 'react';

export default function MagneticButton({
  children,
  onClick,
  variant = 'default', // 'default' | 'outline' | 'secondary' | 'primary'
  className = '',
  style = {},
  type = 'button',
  magneticStrength = 0.35, // Sensitivity multiplier
  disabled = false,
  ...props
}) {
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (disabled || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * magneticStrength;
    const deltaY = (e.clientY - centerY) * magneticStrength;

    setPosition({ x: deltaX, y: deltaY });
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setPosition({ x: 0, y: 0 });
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'outline':
        return 'smooth-magnetic-btn-outline';
      case 'secondary':
        return 'smooth-magnetic-btn-secondary';
      case 'primary':
      case 'default':
      default:
        return 'smooth-magnetic-btn-default';
    }
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`smooth-magnetic-btn ${getVariantClass()} ${className}`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${isHovered ? 1.04 : 1})`,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
        ...style
      }}
      {...props}
    >
      <span
        style={{
          transform: `translate3d(${position.x * 0.2}px, ${position.y * 0.2}px, 0px)`,
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          pointerEvents: 'none'
        }}
      >
        {children}
      </span>
    </button>
  );
}
