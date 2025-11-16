import React, { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-emerald-500/90',
    error: 'bg-rose-500/90',
    warning: 'bg-amber-500/90',
    info: 'bg-blue-500/90'
  }[type] || 'bg-gray-500/90';

  const icon = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }[type] || 'ℹ';

  return (
    <div
      className={`${bgColor} text-white px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in`}
      onClick={onClose}
    >
      <span className="text-lg font-bold">{icon}</span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;

