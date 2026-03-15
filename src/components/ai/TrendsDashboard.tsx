import React from 'react';
import { useTicketTrends } from '../../hooks/useTicketTrends';
import { TrendingUp } from 'lucide-react';
import clsx from 'clsx';

interface TrendsDashboardProps {
  onCategoryClick?: (category: string) => void;
}

export const TrendsDashboard: React.FC<TrendsDashboardProps> = ({ onCategoryClick }) => {
  const { trends } = useTicketTrends(30);

  if (trends.length === 0) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-violet-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Live Trends</span>
        </div>
        <p className="text-xs text-slate-500">No recent ticket trends</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={14} className="text-violet-400" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Live Trends</span>
      </div>
      <div className="space-y-3">
        {trends.map((trend, index) => (
          <button
            key={trend.category}
            onClick={() => onCategoryClick?.(trend.category)}
            className="w-full text-left group"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div 
                  className={clsx(
                    "w-1.5 h-1.5 rounded-full transition-transform group-hover:scale-125",
                    index === 0 ? "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" : "bg-slate-600"
                  )}
                />
                <span className="text-xs text-slate-300 font-medium truncate group-hover:text-violet-400 transition-colors">
                  {trend.category}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500">{trend.count}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={clsx(
                  "h-full rounded-full transition-all",
                  index === 0 ? "bg-violet-500" : "bg-slate-700"
                )}
                style={{ width: `${trend.percentage}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrendsDashboard;
