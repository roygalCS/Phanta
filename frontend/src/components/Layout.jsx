import React, { useMemo, useState } from 'react';
import Dashboard from '../Dashboard';
import { useWallet } from '../WalletContext';
import GeminiAnalystPanel from './AIAssistantPanel';
import MarketIntel from './MarketIntel';
import GroupManager from './GroupManager';
import PhantaLogo from './PhantaLogo';
import geminiLogo from '../assets/gemini-logo.svg';

const Layout = () => {
  // Default to assistant (AI-first)
  const [activePage, setActivePage] = useState('assistant');
  const { account, balance, disconnectWallet, userData } = useWallet();

  const navigationItems = useMemo(
    () => [
      { id: 'assistant', label: 'AI Assistant', icon: geminiLogo, primary: true },
      { id: 'groups', label: 'Groups' },
      { id: 'overview', label: 'Overview' },
      { id: 'transactions', label: 'Transactions' },
      { id: 'income', label: 'Income' },
      { id: 'portfolio', label: 'Portfolio' },
      { id: 'market', label: 'Market Intel' },
    ],
    []
  );

  const renderPage = () => {
    // AI Assistant is the main view
    if (activePage === 'assistant') {
      return (
        <div className="h-full bg-[#0f0f0f]">
          <GeminiAnalystPanel walletAddress={account} />
        </div>
      );
    }

    if (['overview', 'transactions', 'income', 'fingerprint', 'portfolio', 'funds'].includes(activePage)) {
      return <Dashboard initialTab={activePage} />;
    }

    if (activePage === 'market') {
      return <MarketIntel />;
    }

    if (activePage === 'groups') {
      return <GroupManager />;
    }

    // Default to AI Assistant
    return (
      <div className="h-full bg-[#0f0f0f]">
        <GeminiAnalystPanel walletAddress={account} />
      </div>
    );
  };

  return (
    <div className="h-screen bg-[#0f0f0f] text-white flex flex-col">
      {/* Minimal header - AI-first */}
      <header className="px-6 py-4 border-b border-[#1f1f1f]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Phanta bottle logo with hover animation */}
            <PhantaLogo size={32} />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-[#2a2a2a]">
              <span className="text-xs text-gray-400">{balance || '0.0000'} SOL</span>
            </div>
            <button
              onClick={disconnectWallet}
              className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] text-xs text-gray-400 hover:text-white rounded-lg border border-[#2a2a2a] transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation - AI Assistant is primary */}
      <nav className="px-6 py-3 border-b border-[#1f1f1f] bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                activePage === item.id
                  ? item.primary
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-pink-500/30 scale-105'
                    : 'bg-[#1a73e8] text-white shadow-lg shadow-blue-500/30'
                  : 'bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#252525] border border-[#2a2a2a]'
              }`}
            >
              <span className="flex items-center gap-2">
                {item.icon && <img src={item.icon} alt="AI" className="h-3 w-3" />}
                <span>{item.label}</span>
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main content - AI-first */}
      <main className="flex-1 overflow-y-auto bg-[#0f0f0f]">
        {renderPage()}
      </main>
    </div>
  );
};

export default Layout;
