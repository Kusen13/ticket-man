import React from 'react';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: 'violet' | 'cyan' | 'rose' | 'emerald';
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp = true,
  color = 'violet'
}) => {
  const colorStyles = {
    violet: 'text-violet-400 bg-violet-400/10 shadow-[0_0_15px_rgba(139,92,246,0.3)]',
    cyan: 'text-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.3)]',
    rose: 'text-rose-400 bg-rose-400/10 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    emerald: 'text-emerald-400 bg-emerald-400/10 shadow-[0_0_15px_rgba(52,211,153,0.3)]',
  };

  return (
    <div className="glass-card p-6 animate-slide-up hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-400 font-medium text-sm">{title}</h3>
        <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", colorStyles[color])}>
          <Icon size={20} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        {trend && (
          <span className={clsx(
            "text-xs font-medium",
            trendUp ? "text-emerald-400" : "text-rose-400"
          )}>
            {trendUp ? '↑ ' : '↓ '}{trend}
          </span>
        )}
      </div>
    </div>
  );
};
