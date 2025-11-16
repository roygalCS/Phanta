import React, { useState } from 'react';

const PhantaLogo = ({ className = '', size = 48 }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative group ${className}`}
      style={{ width: size, height: size * 1.35 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        viewBox="0 0 200 270"
        className="w-full h-full transition-all duration-500 ease-out"
        style={{ 
          transformOrigin: 'bottom center',
          transform: isHovered ? 'rotate(-12deg) translateY(-4px)' : 'rotate(0deg)'
        }}
      >
        <defs>
          <linearGradient id="purpleBottle" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
          <linearGradient id="spillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#9333ea" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.3" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Spilling liquid - animated on hover */}
        <g className={`transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {/* Main spill drop */}
          <ellipse
            cx="100"
            cy="200"
            rx="20"
            ry="6"
            fill="url(#spillGradient)"
            filter="url(#glow)"
          >
            {isHovered && (
              <>
                <animate
                  attributeName="cy"
                  values="200;210;215;210;200"
                  dur="0.8s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="ry"
                  values="6;10;12;10;6"
                  dur="0.8s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="rx"
                  values="20;22;24;22;20"
                  dur="0.8s"
                  repeatCount="indefinite"
                />
              </>
            )}
          </ellipse>
          
          {/* Spill streams */}
          <path
            d="M 90 200 Q 95 205 100 210 Q 105 205 110 200"
            fill="none"
            stroke="url(#spillGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.7"
          >
            {isHovered && (
              <animate
                attributeName="d"
                values="M 90 200 Q 95 205 100 210 Q 105 205 110 200;M 90 200 Q 95 208 100 215 Q 105 208 110 200;M 90 200 Q 95 205 100 210 Q 105 205 110 200"
                dur="0.6s"
                repeatCount="indefinite"
              />
            )}
          </path>
          
          {/* Smaller spill drops */}
          <circle cx="95" cy="205" r="2" fill="url(#spillGradient)" opacity="0.6">
            {isHovered && (
              <animate
                attributeName="cy"
                values="205;212;205"
                dur="0.7s"
                repeatCount="indefinite"
              />
            )}
          </circle>
          <circle cx="105" cy="205" r="2" fill="url(#spillGradient)" opacity="0.6">
            {isHovered && (
              <animate
                attributeName="cy"
                values="205;212;205"
                dur="0.7s"
                begin="0.2s"
                repeatCount="indefinite"
              />
            )}
          </circle>
        </g>

        {/* Bottle body - purple liquid section */}
        <path
          d="M 70 50 
             L 70 200 
             Q 70 220 90 220 
             L 110 220 
             Q 130 220 130 200 
             L 130 50 
             Q 130 30 110 30 
             L 90 30 
             Q 70 30 70 50 Z"
          fill="url(#purpleBottle)"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Bottle neck - white section */}
        <rect
          x="85"
          y="30"
          width="30"
          height="25"
          fill="#ffffff"
          stroke="#ffffff"
          strokeWidth="2"
          rx="3"
        />

        {/* Bottle cap - white with ridges */}
        <rect
          x="88"
          y="15"
          width="24"
          height="18"
          fill="#ffffff"
          stroke="#ffffff"
          strokeWidth="2"
          rx="2"
        />
        {/* Cap ridges */}
        <line x1="92" y1="20" x2="108" y2="20" stroke="#d1d5db" strokeWidth="1" />
        <line x1="94" y1="24" x2="106" y2="24" stroke="#d1d5db" strokeWidth="1" />
        <line x1="96" y1="28" x2="104" y2="28" stroke="#d1d5db" strokeWidth="1" />

        {/* Label - darker purple rectangle */}
        <rect
          x="75"
          y="90"
          width="50"
          height="45"
          fill="#6d28d9"
          stroke="#ffffff"
          strokeWidth="2"
          rx="4"
          transform="rotate(-5 100 112.5)"
        />

        {/* PHANTA text on label */}
        <text
          x="100"
          y="118"
          fill="#ffffff"
          fontSize="22"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          letterSpacing="1"
          transform="rotate(-5 100 118)"
        >
          PHANTA
        </text>

        {/* Bottle highlight/shine */}
        <ellipse
          cx="85"
          cy="130"
          rx="6"
          ry="35"
          fill="#ffffff"
          fillOpacity="0.15"
        />

        {/* White outline around entire bottle */}
        <path
          d="M 70 50 
             L 70 200 
             Q 70 220 90 220 
             L 110 220 
             Q 130 220 130 200 
             L 130 50 
             Q 130 30 110 30 
             L 90 30 
             Q 70 30 70 50 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default PhantaLogo;
