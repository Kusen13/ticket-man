import React from 'react';
import { Ticket } from '../../types';
import { Target, Zap, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

interface PerformanceMetricsProps {
  tickets: Ticket[];
  departmentName?: string;
}

import { isResolvedOnTime, isOverdue } from '../../lib/sla';

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ tickets, departmentName }) => {
  // Criteria for Performance Score:
  // 1. SLA Compliance (Resolved On Time / Total Resolved) - 70%
  // 2. Queue Health (Open non-overdue / Total Open) - 30%

  const total = tickets.length;
  if (total === 0) return null;

  const resolved = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
  const open = tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED');

  // SLA Compliance: resolved on time / total resolved
  const resolvedOnTime = resolved.filter(isResolvedOnTime).length;
  const slaCompliance = resolved.length > 0 ? (resolvedOnTime / resolved.length) * 100 : 100;

  // Overdue Rate: how many open tickets are overdue
  const overdueCount = open.filter(isOverdue).length;
  const overduePenalty = open.length > 0 ? (overdueCount / open.length) * 30 : 0;

  // Weighted Final Score
  const resolutionRate = (resolved.length / total) * 100;
  const finalScore = Math.round((slaCompliance * 0.7) + (resolutionRate * 0.3) - overduePenalty);
  const clampedScore = Math.max(0, Math.min(100, finalScore));

  const isGood = clampedScore >= 75;
  const isBad = clampedScore < 50;

  return (
    <div className="glass-card p-6 border-violet-500/20 shadow-[0_0_30px_rgba(139,92,246,0.05)]">
      <div className="flex flex-col md:flex-row gap-8 items-center">
        {/* Score Circle */}
        <div className="relative flex-shrink-0">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-white/5"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={364.4}
              strokeDashoffset={364.4 - (364.4 * clampedScore) / 100}
              className={`${isGood ? 'text-emerald-400' : isBad ? 'text-rose-400' : 'text-violet-400'} transition-all duration-1000 ease-out`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">{clampedScore}%</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Score</span>
          </div>
        </div>

        {/* Info & Metrics */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="text-violet-400" size={20} />
                AI Metric Performance
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                SLA-based performance rating for {departmentName ?? 'the Department'} tracking resolution vs deadlines.
              </p>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              isGood ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 
              isBad ? 'bg-rose-400/10 text-rose-400 border border-rose-400/20' : 
              'bg-violet-400/10 text-violet-400 border border-violet-400/20'
            }`}>
              {isGood ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isGood ? 'Excellent Status' : isBad ? 'Needs Attention' : 'Stable Performance'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricSmall 
              icon={CheckCircle2} 
              label="SLA Compliance" 
              value={`${Math.round(slaCompliance)}%`} 
              color="emerald" 
            />
            <MetricSmall 
              icon={AlertTriangle} 
              label="Currently Overdue" 
              value={`${overdueCount} Items`} 
              color="rose" 
            />
            <MetricSmall 
              icon={Zap} 
              label="Resolution Rate" 
              value={`${Math.round(resolutionRate)}%`} 
              color="violet" 
            />
          </div>

          <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                <Zap size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI Performance Insight</span>
                <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                  {isGood 
                    ? `Outstanding! ${Math.round(slaCompliance)}% of tickets are resolved before their SLA deadlines. The department is operating well within the system settings. Keep maintaining this speed.`
                    : isBad 
                    ? `Alert: The department health is low. With ${overdueCount} overdue items and a compliance rate of ${Math.round(slaCompliance)}%, the workload exceeds standard SLA rules. Consider re-assigning pending tasks.`
                    : `Solid performance. Most tickets meet deadlines, but the ${overdueCount} overdue items suggest a slight bottleneck. Improving resolution speed for high-priority items will boost the score.`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricSmall: React.FC<{ icon: any, label: string, value: string, color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
    <div className="flex items-center gap-2.5">
      <div className={`p-1.5 rounded-lg bg-${color}-400/10 text-${color}-400`}>
        <Icon size={14} />
      </div>
      <span className="text-xs font-semibold text-slate-400">{label}</span>
    </div>
    <span className="text-sm font-bold text-white">{value}</span>
  </div>
);
