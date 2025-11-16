import React, { useState } from 'react';

const Tooltip = ({ children, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 ${positionClasses[position]} px-3 py-2 bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg text-xs text-gray-200 whitespace-nowrap shadow-lg animate-fade-in`}
        >
          {content}
          <div
            className={`absolute ${
              position === 'top' ? 'top-full left-1/2 -translate-x-1/2 border-t-[#1f1f1f] border-t-4 border-x-transparent border-x-4' :
              position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 border-b-[#1f1f1f] border-b-4 border-x-transparent border-x-4' :
              position === 'left' ? 'left-full top-1/2 -translate-y-1/2 border-l-[#1f1f1f] border-l-4 border-y-transparent border-y-4' :
              'right-full top-1/2 -translate-y-1/2 border-r-[#1f1f1f] border-r-4 border-y-transparent border-y-4'
            }`}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;

