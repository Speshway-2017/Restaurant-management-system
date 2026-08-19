import React, { useState, useEffect } from 'react';

export default function KineticCenterBuild({
  phrases = [],
  activePhraseIndex = null, // If controlled externally by hero slide index
  className = '',
  style = {},
  interval = 4000
}) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentIndex = activePhraseIndex !== null ? activePhraseIndex : internalIndex;

  useEffect(() => {
    if (activePhraseIndex !== null || !phrases.length) return;
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setInternalIndex((prev) => (prev + 1) % phrases.length);
        setIsAnimating(false);
      }, 350);
    }, interval);

    return () => clearInterval(timer);
  }, [phrases.length, interval, activePhraseIndex]);

  if (!phrases.length) return null;

  const currentPhrase = phrases[currentIndex % phrases.length];
  // Break phrase into words for kinetic staggered animation
  const words = typeof currentPhrase === 'string' ? currentPhrase.split(' ') : [];

  return (
    <div className={`kinetic-center-build-container ${isAnimating ? 'is-animating' : ''} ${className}`} style={style}>
      {typeof currentPhrase === 'string' ? (
        <span className="kinetic-phrase-wrap" key={currentIndex}>
          {words.map((word, wIdx) => (
            <span
              key={`${currentIndex}-${wIdx}`}
              className="kinetic-word"
              style={{ animationDelay: `${wIdx * 0.06}s` }}
            >
              {word}&nbsp;
            </span>
          ))}
        </span>
      ) : (
        <div key={currentIndex} className="kinetic-jsx-wrap">
          {currentPhrase}
        </div>
      )}
    </div>
  );
}
