import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import MagneticButton from './MagneticButton';

export default function Cta2({
  primaryText = 'Explore Full Menu',
  secondaryText = 'Our Heritage',
  onPrimaryClick,
  onSecondaryClick,
  className = '',
  style = {}
}) {
  return (
    <div className={`smooth-cta2-container ${className}`} style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', ...style }}>
      {/* Primary Cta2 Button with Glow & Arrow Shift */}
      <MagneticButton
        onClick={onPrimaryClick}
        variant="secondary"
        className="smooth-cta2-primary"
        style={{
          background: 'linear-gradient(135deg, #FF8A00 0%, #E07A3C 100%)',
          color: '#FFFFFF',
          border: 'none',
          padding: '0.9rem 1.9rem',
          fontSize: '0.98rem',
          fontWeight: 800,
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(255, 138, 0, 0.35)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}
      >
        <span>{primaryText}</span>
        <ArrowRight size={18} className="smooth-cta2-arrow" />
      </MagneticButton>

      {/* Secondary Cta2 Outline Button */}
      {secondaryText && (
        <MagneticButton
          onClick={onSecondaryClick}
          variant="outline"
          className="smooth-cta2-secondary"
          style={{
            borderColor: '#0F2A1D',
            color: '#0F2A1D',
            padding: '0.9rem 1.7rem',
            fontSize: '0.98rem',
            fontWeight: 700,
            borderRadius: '12px'
          }}
        >
          <span>{secondaryText}</span>
        </MagneticButton>
      )}
    </div>
  );
}
