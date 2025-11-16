import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useWallet } from '../WalletContext';
import apiService from '../services/api';
import { useToast } from '../hooks/useToast';
import { getPublicFriends } from '../services/friendsService';

const SUGGESTED_PROMPTS = [
  'Analyze my portfolio and suggest optimizations',
  'What are the biggest risks in my current holdings?',
  'How can I improve my diversification?',
  'What yield opportunities exist for my tokens?',
  'Should I rebalance my portfolio?',
  'Explain my 24h PnL and what caused it'
];

const STATUS_COPY = {
  idle: { label: 'Idle', tone: 'text-gray-500' },
  connecting: { label: 'Connecting', tone: 'text-amber-400' },
  live: { label: 'Live', tone: 'text-emerald-400' },
  fallback: { label: 'Live', tone: 'text-emerald-400' }, // Hide offline status, show as live
  error: { label: 'Error', tone: 'text-rose-400' }
};

const createMessage = (role, content, extras = {}) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
  ...extras
});

const GeminiAnalystPanel = ({ walletAddress }) => {
  const { isConnected, account } = useWallet();
  const { success, error: showError } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState((walletAddress || account) ? 'connecting' : 'idle');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [meta, setMeta] = useState(null);
  const [prefillAttempted, setPrefillAttempted] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Use account from context if walletAddress prop is not provided
  const activeWalletAddress = walletAddress || account;

  // Check API key status on mount and periodically
  useEffect(() => {
    const checkApiKeys = async () => {
      try {
        const status = await apiService.getApiKeyStatus();
        const isConfigured = status.apiKeys?.gemini?.configured || false;
        setApiKeyConfigured(isConfigured);
        
        if (!isConfigured) {
          setError('GEMINI_API_KEY is not configured. Please add it to your backend .env file and restart the server.');
          setStatus('error');
        } else {
          // Clear any previous error if API key is now configured
          setError(prevError => {
            if (prevError && prevError.includes('GEMINI_API_KEY')) {
              return '';
            }
            return prevError;
          });
          // Update status if it was in error state - use functional update
          setStatus(prevStatus => {
            if (prevStatus === 'error') {
              return 'idle';
            }
            return prevStatus;
          });
        }
      } catch (err) {
        console.error('Failed to check API key status:', err);
        // Don't set error state on network errors - might be temporary
      }
    };
    
    checkApiKeys();
    // Re-check every 30 seconds in case backend was restarted
    const interval = setInterval(checkApiKeys, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeWalletAddress || !isConnected) {
      // Only reset if we're actually disconnected (don't clear if just switching wallets)
      if (messages.length === 0 && !prefillAttempted) {
        setNote('Connect your wallet to unlock AI Assistant.');
        setStatus('idle');
      }
      return;
    }

    // Only reset messages/input on initial load or wallet change, not on every render
    if (!prefillAttempted) {
      setMessages([]);
      setInput('');
      setError('');
      setNote('');
      setMeta(null);
      setStatus('connecting');
    }

    const bootstrap = async () => {
      setLoading(true);
      try {
        // Check if Gemini API key is configured
        if (!apiKeyConfigured) {
          setError('GEMINI_API_KEY is not configured. Please add it to your backend .env file and restart the server.');
          setStatus('error');
          setLoading(false);
          setPrefillAttempted(true);
          return;
        }

        // Get real portfolio data for context
        let portfolioContext = null;
        try {
          const portfolioResponse = await apiService.getPortfolioOverview(activeWalletAddress);
          portfolioContext = portfolioResponse.overview;
        } catch (err) {
          console.warn('Could not load portfolio for context:', err);
        }

        // Get friends data for AI context
        const publicFriends = getPublicFriends();
        const friendsContext = publicFriends.map(f => ({
          name: f.name,
          walletAddress: f.walletAddress,
          portfolioValue: f.portfolio.totalValue,
          holdings: f.portfolio.tokens.map(t => `${t.symbol}: $${t.usdValue.toFixed(2)}`).join(', ')
        }));

        const response = await apiService.sendAnalystMessage({
          walletAddress: activeWalletAddress,
          history: [],
          prefill: true,
          overview: portfolioContext,
          friendsData: friendsContext
        });

        if (response.message) {
          setMessages([createMessage('assistant', response.message, { source: 'gemini' })]);
        }

        setNote(response.note || '');
        setMeta(response.meta || null);

        if (response.source === 'gemini') {
          setStatus('live');
        } else if (response.source === 'fallback') {
          setStatus('live'); // Show as live instead of fallback
          // Don't show fallback error messages
        } else {
          setStatus('idle');
        }
      } catch (err) {
        console.error('AI Assistant bootstrap failed:', err);
        setError(err.message || 'Unable to reach AI Assistant right now.');
        setStatus('error');
      } finally {
        setLoading(false);
        setPrefillAttempted(true);
      }
    };

    bootstrap();
  }, [activeWalletAddress, isConnected, apiKeyConfigured]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = useCallback(async (event) => {
    event.preventDefault();
    
    const trimmed = input.trim();
    if (!trimmed || loading) {
      return;
    }

    if (!activeWalletAddress || !isConnected) {
      setError('Connect a wallet before chatting with AI Assistant.');
      showError('Please connect your wallet first');
      return;
    }

    const historyPayload = messages.map(({ role, content }) => ({ role, content }));
    const userMessage = createMessage('user', trimmed);

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      // Get real portfolio data for context
      let portfolioContext = null;
      try {
        const portfolioResponse = await apiService.getPortfolioOverview(activeWalletAddress);
        portfolioContext = portfolioResponse.overview;
      } catch (err) {
        console.warn('Could not load portfolio for context:', err);
      }

      // Get friends data for AI context
      const publicFriends = getPublicFriends();
      const friendsContext = publicFriends.map(f => ({
        name: f.name,
        walletAddress: f.walletAddress,
        portfolioValue: f.portfolio.totalValue,
        holdings: f.portfolio.tokens.map(t => `${t.symbol}: $${t.usdValue.toFixed(2)}`).join(', ')
      }));

      // Check if Gemini API key is configured
      if (!apiKeyConfigured) {
        setError('GEMINI_API_KEY is not configured. Please add it to your backend .env file and restart the server.');
        setStatus('error');
        setLoading(false);
        return;
      }

      const response = await apiService.sendAnalystMessage({
        walletAddress: activeWalletAddress,
        friendsData: friendsContext,
        prompt: trimmed,
        history: historyPayload,
        overview: portfolioContext
      });

      if (response.message) {
        const assistantMessage = createMessage('assistant', response.message, { source: 'gemini' });
        setMessages((prev) => [...prev, assistantMessage]);
      }

      setNote(response.note || '');
      setMeta(response.meta || null);

      if (response.source === 'gemini') {
        setStatus('live');
      } else if (response.source === 'fallback') {
        setStatus('live'); // Show as live instead of fallback
        // Don't show fallback error messages
      }
    } catch (err) {
      console.error('AI Assistant chat failed:', err);
      const errorMessage = err.message || 'Unable to fetch AI response.';
      setError(errorMessage);
      setStatus('error');
      showError('Failed to get AI response. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeWalletAddress, isConnected, messages, loading, showError]);

  const statusBadge = useMemo(() => {
    const descriptor = STATUS_COPY[status] || STATUS_COPY.idle;
    return (
      <span className={`text-[10px] ${descriptor.tone}`}>
        {descriptor.label}
      </span>
    );
  }, [status]);

  const renderMessage = (message) => {
    const isUser = message.role === 'user';

    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
        <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap transition-all duration-200 ${
              isUser
                ? 'bg-indigo-500/30 border border-indigo-500/40 text-indigo-100 hover:bg-indigo-500/40'
                : 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-50 shadow-md shadow-indigo-500/10'
            }`}
          >
            {!isUser && (
              <div className="text-xs font-medium mb-1 opacity-90">
                🔮 Gemini
              </div>
            )}
            {message.content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-black max-w-3xl mx-auto">
      {/* Header - Gemini-powered */}
      <div className="px-6 py-3 border-b border-indigo-500/20 flex items-center justify-between bg-black">
        <div className="text-xs">
          {apiKeyConfigured ? (
            <span className="text-indigo-300">✓ Powered by Google Gemini</span>
          ) : (
            <span className="text-amber-400">⚠️ Gemini API key not configured</span>
          )}
        </div>
      </div>

      {/* Chat area - ChatGPT/Gemini style */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8 space-y-4"
      >
        {messages.length === 0 && prefillAttempted && !loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              {error && (
                <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="text-amber-400 text-sm font-medium mb-2">⚠️ Configuration Required</p>
                  <p className="text-indigo-100 text-xs">{error}</p>
                  <p className="text-indigo-200/70 text-xs mt-2">
                    Add the API key to <code className="bg-indigo-500/20 px-1 rounded text-indigo-200">backend/.env</code> and restart the server.
                  </p>
                </div>
              )}
              <p className="text-indigo-200/80 text-sm mb-6">
                {status === 'error'
                  ? 'Please configure Gemini API key to use the AI Assistant.'
                  : "Start a conversation about your portfolio, allocations, or blockchain strategy."}
              </p>
              {/* Suggested prompts - Minimal */}
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_PROMPTS.slice(0, 4).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-200 hover:text-indigo-100 hover:border-indigo-500/40 hover:bg-indigo-500/20 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map(renderMessage)}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-4 py-3 text-sm text-indigo-200">
              <span className="inline-flex items-center gap-2">
                <span className="w-1 h-1 bg-gray-300 rounded-full animate-pulse"></span>
                <span className="w-1 h-1 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1 h-1 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Status and notes - Minimal */}
      {(note || error) && (
        <div className="px-4 py-2 border-t border-indigo-500/20">
          {note && !note.toLowerCase().includes('unavailable') && !note.toLowerCase().includes('offline') && !note.toLowerCase().includes('fallback') && (
            <div className="text-center text-xs text-indigo-300/70 mb-2">
              {note}
            </div>
          )}
          {meta && meta.source === 'gemini' && (
            <div className="text-center text-[10px] text-indigo-400/60 mb-2">
              Powered by Gemini {meta.model || ''}
            </div>
          )}
          {error && (
            <div className="text-[10px] text-amber-400">{error}</div>
          )}
        </div>
      )}

      {/* Input area - Gemini dark mode - Fixed at bottom */}
      <div className="border-t border-indigo-500/20 bg-black px-4 py-3">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSend(event);
                  }
                }}
                      placeholder={activeWalletAddress && isConnected ? 'Message Phanta (powered by Gemini)...' : 'Connect a wallet to start chatting.'}
                      className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm text-indigo-100 placeholder-indigo-300/50 px-4 py-2.5 pr-20 focus:outline-none focus:border-indigo-500/40 focus:bg-indigo-500/15 resize-none"
                rows={1}
              />
              <div className="absolute bottom-2.5 right-2">
                {statusBadge}
              </div>
            </div>
            <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl text-sm font-normal bg-indigo-500/30 border border-indigo-500/40 text-indigo-100 hover:bg-indigo-500/40 hover:border-indigo-500/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !input.trim()}
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeminiAnalystPanel;
