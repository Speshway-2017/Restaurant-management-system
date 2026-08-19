import React from 'react';

export default function InfiniteSlider({
  children,
  gap = 16,
  speed = 40, // duration in seconds for full loop
  speedOnHover = 0, // 0 = pause on hover
  reverse = false,
  className = '',
  style = {}
}) {
  const childrenArray = React.Children.toArray(children);

  const pauseOnHoverClass = speedOnHover === 0 ? 'pause-on-hover' : '';
  const directionClass = reverse ? 'is-reverse' : '';

  return (
    <div
      className={`smooth-infinite-slider-wrapper ${pauseOnHoverClass} ${className}`}
      style={{
        '--slider-gap': `${gap}px`,
        '--slider-duration': `${speed}s`,
        ...style
      }}
    >
      <div className={`smooth-infinite-slider-track ${directionClass}`}>
        {/* Track 1 */}
        <div className="smooth-infinite-slider-content">
          {childrenArray.map((child, index) => (
            <div key={`orig-${index}`} className="smooth-slider-item">
              {child}
            </div>
          ))}
        </div>

        {/* Track 2 (Duplicate for Seamless Loop) */}
        <div className="smooth-infinite-slider-content" aria-hidden="true">
          {childrenArray.map((child, index) => (
            <div key={`dup-${index}`} className="smooth-slider-item">
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
