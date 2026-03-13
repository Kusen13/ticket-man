import React from 'react';
import { TicketStatus } from '../../types';
import { clsx } from 'clsx';

interface StatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const styles: Record<TicketStatus, string> = {
    OPEN: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20 shadow-[0_0_8px_rgba(34,211,238,0.2)]',
    IN_PROGRESS: 'bg-violet-400/10 text-violet-400 border-violet-400/20 shadow-[0_0_8px_rgba(139,92,246,0.2)]',
    RESOLVED: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20 shadow-[0_0_8px_rgba(52,211,153,0.2)]',
    REOPENED: 'bg-orange-400/10 text-orange-400 border-orange-400/20 shadow-[0_0_8px_rgba(251,146,60,0.2)]',
    RETURNED: 'bg-amber-400/10 text-amber-400 border-amber-400/20 shadow-[0_0_8px_rgba(251,191,36,0.2)]',
    CLOSED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-[9px]',
    md: 'px-2.5 py-1 text-[11px]',
    lg: 'px-3 py-1.5 text-xs'
  };

  return (
    <span className={clsx(
      "rounded-md font-bold tracking-wider uppercase border status-badge inline-flex items-center justify-center",
      styles[status],
      sizeStyles[size]
    )}>
      {status.replace('_', ' ')}
    </span>
  );
};
