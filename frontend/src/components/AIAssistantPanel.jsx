import React, { useEffect, useMemo, useRef, useState } from 'react';
import apiService from '../services/api';

const SUGGESTED_PROMPTS = [
  'What allocation tweaks should I make this week?',
  'How can I hedge downside risk over the next quarter?',
  'Summarise my runway and highlight any red flags.',
  'Give me three yield ideas that fit this wallet.'
];

const AI_PROVIDERS = {
  gemini: { 
    name: 'Gemini', 
    color: 'from-purple-500 to-pink-500',
    logo: '🔮'
  },
  chatgpt: { 
    name: 'ChatGPT', 
    color: 'from-green-500 to-emerald-500',
    logo: '🤖'
  },
  claude: { 
    name: 'Claude', 
    color: 'from-orange-500 to-amber-500',
    logo: '🧠'
  },
  groq: { 
    name: 'Groq', 
    color: 'from-blue-500 to-cyan-500',
    logo: '⚡'
  },
  mistral: { 
    name: 'Mistral', 
    color: 'from-indigo-500 to-purple-500',
    logo: '🌊'
  },
  together: { 
    name: 'Together', 
    color: 'from-teal-500 to-green-500',
    logo: '🤝'
  },
};

const STATUS_COPY = {
  idle: { label: 'Idle', tone: 'text-gray-500' },
  connecting: { label: 'Connecting', tone: 'text-amber-400' },
  live: { label: 'Live', tone: 'text-emerald-400' },
  fallback: { label: 'Offline', tone: 'text-gray-400' },
  error: { label: 'Error', tone: 'text-rose-400' }
};

const createMessage = (role, content, extras = {}) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
  ...extras
});

const GeminiAnalystPanel = ({ walletAddress }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(walletAddress ? 'connecting' : 'idle');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [meta, setMeta] = useState(null);
  const [prefillAttempted, setPrefillAttempted] = useState(false);
  const [aiProvider, setAiProvider] = useState('gemini');
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!walletAddress) {
      setMessages([]);
      setInput('');
      setError('');
      setNote('Connect your wallet to unlock AI Assistant.');
      setMeta(null);
      setStatus('idle');
      setPrefillAttempted(false);
      return;
    }

    setMessages([]);
    setInput('');
    setError('');
    setNote('');
    setMeta(null);
    setStatus('connecting');
    setPrefillAttempted(false);

    const bootstrap = async () => {
      setLoading(true);
      try {
        // Get real portfolio data for context
        let portfolioContext = null;
        try {
          const portfolioResponse = await apiService.getPortfolioOverview(walletAddress);
          portfolioContext = portfolioResponse.overview;
        } catch (err) {
          console.warn('Could not load portfolio for context:', err);
        }

        const response = await apiService.sendAnalystMessage({
          walletAddress,
          history: [],
          prefill: true,
          overview: portfolioContext
        });

        if (response.message) {
          setMessages([createMessage('assistant', response.message, { source: response.source })]);
        }

        setNote(response.note || '');
        setMeta(response.meta || null);

        if (response.source === 'gemini') {
          setStatus('live');
        } else if (response.source === 'fallback') {
          setStatus('fallback');
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
  }, [walletAddress]);

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

  const handleSend = async (event) => {
    event.preventDefault();
    if (!walletAddress) {
      setError('Connect a wallet before chatting with AI Assistant.');
      return;
    }

    const trimmed = input.trim();
    if (!trimmed || loading) {
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
        const portfolioResponse = await apiService.getPortfolioOverview(walletAddress);
        portfolioContext = portfolioResponse.overview;
      } catch (err) {
        console.warn('Could not load portfolio for context:', err);
      }

      const response = await apiService.sendAnalystMessage({
        walletAddress,
        prompt: trimmed,
        history: historyPayload,
        overview: portfolioContext,
        provider: aiProvider
      });

      if (response.message) {
        const assistantMessage = createMessage('assistant', response.message, { source: response.source });
        setMessages((prev) => [...prev, assistantMessage]);
      }

      setNote(response.note || '');
      setMeta(response.meta || null);

      if (response.source === 'gemini' || response.source === 'chatgpt' || response.source === 'claude' || response.source === 'groq' || response.source === 'mistral' || response.source === 'together') {
        setStatus('live');
      } else if (response.source === 'fallback') {
        setStatus('fallback');
      }
    } catch (err) {
      console.error('AI Assistant chat failed:', err);
      setError(err.message || 'Unable to fetch AI response.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

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
    const provider = message.source || 'gemini';

    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
        <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              isUser
                ? 'bg-[#1a73e8] text-white'
                : `bg-gradient-to-r ${AI_PROVIDERS[provider]?.color || 'from-purple-500 to-pink-500'} text-white`
            }`}
          >
            {!isUser && (
              <div className="text-xs font-medium mb-1 opacity-90">
                {AI_PROVIDERS[provider]?.logo} {AI_PROVIDERS[provider]?.name || 'AI'}
              </div>
            )}
            {message.content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#0f0f0f] max-w-3xl mx-auto">
      {/* AI Provider Selector - Minimal */}
      <div className="px-4 py-2 border-b border-[#1f1f1f] flex items-center justify-end">
        <select
          value={aiProvider}
          onChange={(e) => setAiProvider(e.target.value)}
          className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1 text-gray-300 focus:outline-none focus:border-[#3a3a3a]"
        >
          {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
            <option key={key} value={key}>{provider.logo} {provider.name}</option>
          ))}
        </select>
      </div>

      {/* Chat area - ChatGPT/Gemini style */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8 space-y-4"
      >
        {messages.length === 0 && prefillAttempted && !loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <p className="text-gray-500 text-sm mb-6">
                {status === 'fallback'
                  ? 'AI is offline, but I still have curated strategies ready. Ask away.'
                  : "Start a conversation about your portfolio, allocations, or crypto strategy."}
              </p>
              {/* Suggested prompts - Minimal */}
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-gray-400 hover:text-white hover:border-[#3a3a3a] transition-colors"
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
            <div className="bg-[#1a1a1a] rounded-2xl px-4 py-3 text-sm text-gray-400">
              <span className="inline-flex items-center gap-2">
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></span>
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Status and notes - Minimal */}
      {(note || error) && (
        <div className="px-4 py-2 border-t border-[#1f1f1f]">
          {note && (
            <div className="text-[10px] text-amber-400 mb-1">{note}</div>
          )}
          {error && (
            <div className="text-[10px] text-rose-400">{error}</div>
          )}
        </div>
      )}

      {/* Input area - ChatGPT/Gemini style - Fixed at bottom */}
      <div className="border-t border-[#1f1f1f] bg-[#0f0f0f] px-4 py-3">
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
                placeholder={walletAddress ? 'Message Phanta...' : 'Connect a wallet to start chatting.'}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-gray-500 px-4 py-2.5 pr-20 focus:outline-none focus:border-[#3a3a3a] resize-none"
                rows={1}
                disabled={!walletAddress || loading}
              />
              <div className="absolute bottom-2.5 right-2">
                {statusBadge}
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl text-sm font-normal bg-[#1a73e8] text-white hover:bg-[#1557b0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!walletAddress || loading || !input.trim()}
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
