import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '../../hooks/useAIChat';
import { AIChatMessage } from './AIChatMessage';
import { Bot, Send, Trash2, Sparkles, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { AI_CONFIG, getAIUsageColor } from '../../lib/aiConfig';

interface AIChatPanelProps {
  sessionId?: string;
  compact?: boolean;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ sessionId }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, error, usage, limit, sendMessage, clearConversation, setFeedback } = useAIChat(sessionId);

  const used = usage?.messages_sent || 0;
  const percentage = Math.round((used / limit) * 100);
  const isAtLimit = percentage >= 100;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isAtLimit || isLoading) return;
    await sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Bot size={20} className="text-violet-400" />
          </div>
          <div>
            <h3 className="font-bold text-white flex items-center gap-2">
              <Sparkles size={14} className="text-violet-400" />
              TicketBot
            </h3>
            <p className="text-[10px] text-slate-500">AI Assistant</p>
          </div>
        </div>
        <button
          onClick={clearConversation}
          className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          title="Clear conversation"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {isAtLimit && (
        <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-rose-300 text-sm font-bold">Daily AI limit reached ({used}/{limit})</p>
              <p className="text-rose-400/70 text-xs mt-1">
                Your limit resets at midnight. Browse the Knowledge Base or submit a support ticket instead.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
              <Sparkles size={32} className="text-violet-400" />
            </div>
            <h4 className="text-white font-bold mb-2">Ask TicketBot</h4>
            <p className="text-slate-400 text-sm max-w-xs">
              Get instant help with IT, HR, Payroll, and Facilities questions.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <AIChatMessage
              key={msg.id}
              message={msg}
              onFeedback={setFeedback}
            />
          ))
        )}
        {isLoading && (
          <div className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Bot size={16} className="text-violet-400" />
            </div>
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && !isAtLimit && (
        <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-amber-400 text-xs">{error}</p>
        </div>
      )}

      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, AI_CONFIG.MAX_MESSAGE_LENGTH))}
          onKeyDown={handleKeyDown}
          placeholder={isAtLimit ? "Limit reached..." : "Ask me anything..."}
          disabled={isAtLimit}
          rows={2}
          className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-4 pr-24 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all resize-none disabled:opacity-50"
        />
        <div className="absolute right-2 bottom-2 flex items-center gap-2">
          <span className="text-[10px] text-slate-500">
            {input.length}/{AI_CONFIG.MAX_MESSAGE_LENGTH}
          </span>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isAtLimit || isLoading}
            className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-slate-500">AI Chat (Today)</span>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 bg-white/10 rounded-full overflow-hidden">
            <div
              className={clsx("h-full rounded-full transition-all", getAIUsageColor(percentage))}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <span className={clsx(
            "text-[10px] font-bold",
            percentage >= 95 ? "text-rose-400" :
            percentage >= 80 ? "text-orange-400" :
            percentage >= 60 ? "text-amber-400" : "text-violet-400"
          )}>
            {used}/{limit}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
