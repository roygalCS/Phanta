import React, { useState } from 'react';

const PhantaLogo = ({ className = '', size = 48 }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full transition-all duration-300 ease-out"
        style={{ 
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        <defs>
          {/* Modern gradient */}
          <linearGradient id="phantaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
          
          {/* Glow effect */}
          <filter id="logoGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background circle with gradient */}
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="url(#phantaGradient)"
          opacity={isHovered ? 1 : 0.95}
          filter="url(#logoGlow)"
          className="transition-opacity duration-300"
        />
        
        {/* Inner circle for depth */}
        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1"
        />

        {/* Stylized "P" letter - proper orientation */}
        {/* Vertical stem */}
        <rect
          x="35"
          y="30"
          width="8"
          height="60"
          rx="2"
          fill="white"
          fillOpacity={isHovered ? 1 : 0.95}
          className="transition-opacity duration-300"
        />
        
        {/* Top horizontal bar */}
        <rect
          x="35"
          y="30"
          width="30"
          height="8"
          rx="2"
          fill="white"
          fillOpacity={isHovered ? 1 : 0.95}
          className="transition-opacity duration-300"
        />
        
        {/* Curved part of P */}
        <path
          d="M 65 38 
             Q 75 38 75 50
             Q 75 60 65 60"
          fill="none"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={isHovered ? 1 : 0.95}
          className="transition-opacity duration-300"
        />
        
        {/* Modern accent dot */}
        <circle
          cx="82"
          cy="60"
          r="4"
          fill="white"
          opacity={isHovered ? 1 : 0.7}
          className="transition-opacity duration-300"
        />
      </svg>
    </div>
  );
};

export default PhantaLogo;
