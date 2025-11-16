import React from 'react';

const EmptyState = ({ 
  icon = '📊', 
  title, 
  description, 
  action, 
  actionLabel 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-200 mb-2">{title}</h3>
      <p className="text-sm text-gray-400 max-w-md mb-6">{description}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="px-6 py-2.5 bg-[#1a73e8] text-white rounded-xl text-sm font-medium hover:bg-[#1557b0] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

