import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '../WalletContext';
import apiService from '../services/api';

const GroupChat = ({ groupId, groupName }) => {
  const { account } = useWallet();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
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
    const mentionsAi = messageText.includes('@gemini') || messageText.includes('@ai');

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
      
      // Process AI response in background (no loading indicator shown to user)
      try {
        const cleanPrompt = messageText.replace(/@(gemini|ai)/gi, '').trim();
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
          groupContext: `Group: ${groupName}. This is a group chat context.`
        });

        if (response.message) {
          const aiMessage = {
            id: Date.now() + 1,
            sender: 'Gemini AI',
            text: response.message,
            timestamp: new Date(),
            type: 'ai',
            provider: 'gemini',
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
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="px-4 py-3 border-b border-indigo-500/20 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-indigo-100">{groupName}</h3>
          <p className="text-xs text-indigo-300/70">Group Chat</p>
        </div>
        
        {/* AI Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${aiEnabled ? 'bg-indigo-400' : 'bg-indigo-500/30'}`} />
          <span className="text-xs text-indigo-300/70">Powered by Gemini</span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {messages.length === 0 && (
          <div className="text-center text-indigo-300/70 text-sm py-8">
            <p>Start chatting with your group</p>
            <p className="text-xs mt-2">Mention @gemini or @ai to add Gemini AI to the conversation</p>
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
                  ? 'bg-indigo-500/30 border border-indigo-500/40 text-indigo-100'
                  : msg.type === 'ai'
                  ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-50'
                  : 'bg-indigo-500/10 text-indigo-200 border border-indigo-500/20'
              }`}
            >
              {msg.type === 'ai' && (
                <div className="text-xs font-medium mb-1 opacity-90">
                  🔮 Gemini
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
      <div className="border-t border-indigo-500/20 bg-black px-4 py-3">
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
                placeholder="Type @gemini or @ai to add Gemini AI to the conversation..."
                className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm text-indigo-100 placeholder-indigo-300/50 px-4 py-2.5 focus:outline-none focus:border-indigo-500/40 focus:bg-indigo-500/15 resize-none"
                rows={1}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl text-sm font-normal bg-indigo-500/30 border border-indigo-500/40 text-indigo-100 hover:bg-indigo-500/40 hover:border-indigo-500/60 transition-colors disabled:opacity-50"
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
