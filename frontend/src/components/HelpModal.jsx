import React from 'react';

const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl+K', description: 'Jump to AI Assistant' },
    { key: 'Ctrl+1', description: 'Go to Overview' },
    { key: 'Ctrl+2', description: 'Go to Transactions' },
    { key: 'Ctrl+3', description: 'Go to Market Intel' },
    { key: 'Ctrl+4', description: 'Go to Groups' },
    { key: 'Ctrl+/', description: 'Show this help' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-[#1f1f1f]">
              <span className="text-sm text-gray-300">{shortcut.description}</span>
              <kbd className="px-2 py-1 bg-[#1a1a1a] border border-[#1f1f1f] rounded text-xs text-gray-200 font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[#1f1f1f]">
          <p className="text-xs text-gray-400">
            💡 Tip: Click on your wallet address in the header to copy it
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;

