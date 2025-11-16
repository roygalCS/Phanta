import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '../WalletContext';
import apiService from '../services/api';

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

const GroupChat = ({ groupId, groupName }) => {
  const { account } = useWallet();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [aiProvider, setAiProvider] = useState('gemini');
  const [aiEnabled, setAiEnabled] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageText = input.trim();
    const mentionsAi = messageText.includes('@gemini') || messageText.includes('@ai') || messageText.includes('@chatgpt') || messageText.includes('@claude') || messageText.includes('@groq') || messageText.includes('@mistral') || messageText.includes('@together');

    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: account,
      text: messageText,
      timestamp: new Date(),
      type: 'user',
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // If AI is mentioned, enable and respond (process silently, then post response)
    if (mentionsAi) {
      setAiEnabled(true);
      
      // Determine provider from mention or use selected
      let provider = aiProvider;
      if (messageText.includes('@chatgpt')) provider = 'chatgpt';
      else if (messageText.includes('@claude')) provider = 'claude';
      else if (messageText.includes('@groq')) provider = 'groq';
      else if (messageText.includes('@mistral')) provider = 'mistral';
      else if (messageText.includes('@together')) provider = 'together';
      else if (messageText.includes('@gemini')) provider = 'gemini';
      
      // Process AI response in background (no loading indicator shown to user)
      try {
        const cleanPrompt = messageText.replace(/@(gemini|ai|chatgpt|claude|groq|mistral|together)/gi, '').trim();
        const historyPayload = messages
          .filter(m => m.type === 'user' || m.type === 'ai')
          .slice(-10)
          .map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.text
          }));

        const response = await apiService.sendGroupChatMessage({
          walletAddress: account,
          prompt: cleanPrompt || `Help with ${groupName} group.`,
          history: historyPayload,
          provider: provider,
          groupContext: `Group: ${groupName}. This is a group chat context.`
        });

        if (response.message) {
          const aiMessage = {
            id: Date.now() + 1,
            sender: 'AI Assistant',
            text: response.message,
            timestamp: new Date(),
            type: 'ai',
            provider: provider,
          };
          setMessages((prev) => [...prev, aiMessage]);
        }
      } catch (error) {
        console.error('AI response failed:', error);
        // Silently fail - don't show error to user
      }
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0f0f0f]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1f1f1f] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-200">{groupName}</h3>
          <p className="text-xs text-gray-500">Group Chat</p>
        </div>
        
        {/* AI Provider Selector */}
        <div className="flex items-center gap-2">
          {aiEnabled && (
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1 text-gray-300 focus:outline-none focus:border-[#3a3a3a]"
            >
              {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                <option key={key} value={key}>{provider.logo} {provider.name}</option>
              ))}
            </select>
          )}
          <div className={`w-2 h-2 rounded-full ${aiEnabled ? 'bg-emerald-400' : 'bg-gray-600'}`} />
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            <p>Start chatting with your group</p>
            <p className="text-xs mt-2">Mention @gemini, @chatgpt, @claude, @groq, @mistral, or @together to add AI</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                msg.type === 'user'
                  ? 'bg-[#1a73e8] text-white'
                  : msg.type === 'ai'
                  ? `bg-gradient-to-r ${AI_PROVIDERS[msg.provider]?.color || 'from-purple-500 to-pink-500'} text-white`
                  : 'bg-[#1a1a1a] text-gray-200 border border-[#2a2a2a]'
              }`}
            >
              {msg.type === 'ai' && (
                <div className="text-xs font-medium mb-1 opacity-90">
                  {AI_PROVIDERS[msg.provider]?.logo} {AI_PROVIDERS[msg.provider]?.name || 'AI'}
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-[#1f1f1f] bg-[#0f0f0f] px-4 py-3">
        <form onSubmit={handleSend}>
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Type @gemini, @chatgpt, @claude, @groq, @mistral, or @together to add AI..."
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-gray-500 px-4 py-2.5 focus:outline-none focus:border-[#3a3a3a] resize-none"
                rows={1}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl text-sm font-normal bg-[#1a73e8] text-white hover:bg-[#1557b0] transition-colors disabled:opacity-50"
              disabled={!input.trim()}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupChat;

