import React, { useMemo, useState, useEffect } from 'react';
import Dashboard from '../Dashboard';
import { useWallet } from '../WalletContext';
import GeminiAnalystPanel from './AIAssistantPanel';
import MarketIntel from './MarketIntel';
import GroupManager from './GroupManager';
import Friends from './Friends';
import PhantaLogo from './PhantaLogo';
import ToastContainer from './ToastContainer';
import Tooltip from './Tooltip';
import HelpModal from './HelpModal';
import { useToast } from '../hooks/useToast';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import apiService from '../services/api';
import geminiLogo from '../assets/gemini-logo.svg';

const Layout = () => {
  // Default to assistant (AI-first)
  const [activePage, setActivePage] = useState('assistant');
  const { account, balance, disconnectWallet, connectWallet, userData, isConnected } = useWallet();
  const { toasts, removeToast, success, info } = useToast();
  const [showHelp, setShowHelp] = useState(false);
  const [overviewBalance, setOverviewBalance] = useState(null);

  // Keyboard shortcuts
        useKeyboardShortcuts({
          'ctrl+k': () => setActivePage('assistant'),
          'ctrl+1': () => setActivePage('overview'),
          'ctrl+2': () => setActivePage('transactions'),
          'ctrl+3': () => setActivePage('market'),
          'ctrl+4': () => setActivePage('groups'),
          'ctrl+5': () => setActivePage('friends'),
          'ctrl+/': (e) => {
            e.preventDefault();
            setShowHelp(true);
          }
        });

  useEffect(() => {
    // Remove the info toast on page change - it's annoying
    // if (activePage === 'assistant') {
    //   info('Press Ctrl+K to focus AI Assistant, Ctrl+/ for shortcuts');
    // }
  }, [activePage, info]);

  // Fetch overview balance to match Overview display
  useEffect(() => {
    const fetchOverviewBalance = async () => {
      if (!account) {
        setOverviewBalance(null);
        return;
      }
      
      try {
        const response = await apiService.getPortfolioOverview(account);
        if (response?.overview?.balances?.crypto?.amount) {
          setOverviewBalance(response.overview.balances.crypto.amount);
        }
      } catch (error) {
        console.error('Error fetching overview balance:', error);
        // Keep using wallet balance if overview fetch fails
      }
    };

    fetchOverviewBalance();
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchOverviewBalance, 30000);
    return () => clearInterval(interval);
  }, [account]);

  const navigationItems = useMemo(
    () => [
      { id: 'assistant', label: 'AI Assistant', icon: geminiLogo, primary: true },
      { id: 'groups', label: 'Groups' },
      { id: 'friends', label: 'Friends' },
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
        <div className="h-full bg-black">
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

    if (activePage === 'friends') {
      return <Friends />;
    }

    // Default to AI Assistant
    return (
      <div className="h-full bg-black">
        <GeminiAnalystPanel walletAddress={account} />
      </div>
    );
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      
      {/* Header - Gemini dark mode style */}
      <header className="px-8 py-5 border-b border-[#1f1f1f] bg-black">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Phanta bottle logo with hover animation - larger */}
            <PhantaLogo size={44} />
          </div>

          <div className="flex items-center gap-4">
            {account && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(account);
                  success('Wallet address copied!');
                }}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors group"
                title="Click to copy wallet address"
              >
                <span className="truncate max-w-[120px]">{account.slice(0, 4)}...{account.slice(-4)}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">📋</span>
              </button>
            )}
            <div className="flex items-center gap-2.5 bg-[#0f0f0f] px-4 py-2.5 rounded-xl border border-[#1f1f1f] hover:border-[#2a2a2a] transition-colors">
              <span className="text-sm text-gray-100 font-medium">
                {overviewBalance !== null 
                  ? `${overviewBalance.toFixed(4)} SOL` 
                  : `${balance || '0.0000'} SOL`}
              </span>
            </div>
            {isConnected && (
              <button
                onClick={async () => {
                  try {
                    await disconnectWallet();
                    await connectWallet();
                    success('Account switched!');
                  } catch (err) {
                    // Error handled by wallet context
                  }
                }}
                className="px-4 py-2.5 bg-[#0f0f0f] hover:bg-[#1a1a1a] text-sm text-gray-100 hover:text-white rounded-xl border border-[#1f1f1f] hover:border-[#2a2a2a] transition-all duration-200"
                title="Switch to another Phantom account"
              >
                Switch Account
              </button>
            )}
            <Tooltip content="Keyboard shortcuts (Ctrl+/)">
              <button
                onClick={() => setShowHelp(true)}
                className="px-4 py-2.5 bg-[#0f0f0f] hover:bg-[#1a1a1a] text-sm text-gray-100 hover:text-white rounded-xl border border-[#1f1f1f] hover:border-[#2a2a2a] transition-all duration-200"
                title="Help & Shortcuts"
              >
                ?
              </button>
            </Tooltip>
            <button
              onClick={() => {
                disconnectWallet();
                success('Logged out successfully');
              }}
              className="px-4 py-2.5 bg-[#0f0f0f] hover:bg-[#1a1a1a] text-sm text-gray-100 hover:text-white rounded-xl border border-[#1f1f1f] hover:border-[#2a2a2a] transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation - Larger tabs, Gemini dark mode */}
      <nav className="px-8 py-4 border-b border-[#1f1f1f] bg-black">
        <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto">
          {navigationItems.map((item) => {
            const shortcut = item.id === 'assistant' ? 'Ctrl+K' :
                            item.id === 'overview' ? 'Ctrl+1' :
                            item.id === 'transactions' ? 'Ctrl+2' :
                            item.id === 'market' ? 'Ctrl+3' :
                            item.id === 'groups' ? 'Ctrl+4' : null;
            
            return (
              <Tooltip key={item.id} content={shortcut ? `${item.label} (${shortcut})` : item.label}>
                <button
                  onClick={() => setActivePage(item.id)}
                  className={`px-6 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    activePage === item.id
                      ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 shadow-md shadow-indigo-500/20 scale-[1.02]'
                      : 'bg-[#0f0f0f] text-gray-300 hover:text-indigo-300 hover:bg-[#1a1a1a] border border-[#1f1f1f] hover:border-indigo-500/30'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon && <img src={item.icon} alt="AI" className="h-4 w-4" />}
                    <span>{item.label}</span>
                  </span>
                </button>
              </Tooltip>
            );
          })}
        </div>
      </nav>

      {/* Main content - AI-first */}
      <main className="flex-1 overflow-y-auto bg-black">
        {renderPage()}
      </main>
    </div>
  );
};

export default Layout;
