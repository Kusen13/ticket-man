import React from 'react';
import { AIChatMessage as AIChatMessageType } from '../../types';
import { Bot, User, ThumbsUp, ThumbsDown } from 'lucide-react';
import clsx from 'clsx';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface AIChatMessageProps {
  message: AIChatMessageType;
  onFeedback?: (messageId: string, feedback: 1 | -1) => void;
}

export const AIChatMessage: React.FC<AIChatMessageProps> = ({ message, onFeedback }) => {
  const isUser = message.role === 'user';

  return (
    <div className={clsx(
      "flex gap-3 animate-fade-in",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <div className={clsx(
        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
        isUser ? "bg-blue-500/20" : "bg-violet-500/20"
      )}>
        {isUser ? (
          <User size={16} className="text-blue-400" />
        ) : (
          <Bot size={16} className="text-violet-400" />
        )}
      </div>

      <div className={clsx(
        "max-w-[75%] rounded-2xl p-4",
        isUser 
          ? "bg-blue-500/10 border border-blue-500/20" 
          : "bg-violet-500/10 border border-violet-500/20"
      )}>
        <p className={clsx(
          "text-sm leading-relaxed whitespace-pre-wrap",
          isUser ? "text-blue-100" : "text-violet-100"
        )}>
          {message.content}
        </p>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <span className="text-[10px] text-slate-500">
            {dayjs(message.created_at).fromNow()}
          </span>
          
          {!isUser && onFeedback && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onFeedback(message.id, 1)}
                className={clsx(
                  "p-1.5 rounded-lg transition-all",
                  message.feedback === 1 
                    ? "bg-emerald-500/20 text-emerald-400" 
                    : "text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                )}
                title="Helpful"
              >
                <ThumbsUp size={12} />
              </button>
              <button
                onClick={() => onFeedback(message.id, -1)}
                className={clsx(
                  "p-1.5 rounded-lg transition-all",
                  message.feedback === -1 
                    ? "bg-rose-500/20 text-rose-400" 
                    : "text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                )}
                title="Not helpful"
              >
                <ThumbsDown size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChatMessage;
