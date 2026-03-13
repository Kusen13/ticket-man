import React from 'react';
import { Priority } from '../../types';
import { clsx } from 'clsx';
import { AlertCircle, AlertTriangle, Info, ArrowDownCircle } from 'lucide-react';

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const config = {
    URGENT: {
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse',
      icon: AlertCircle
    },
    HIGH: {
      color: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
      icon: AlertTriangle
    },
    MEDIUM: {
      color: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
      icon: Info
    },
    LOW: {
      color: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
      icon: ArrowDownCircle
    }
  };

  const { color, icon: Icon } = config[priority];

  return (
    <span className={clsx(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase border priority-badge",
      color
    )}>
      <Icon size={12} strokeWidth={3} />
      {priority}
    </span>
  );
};
