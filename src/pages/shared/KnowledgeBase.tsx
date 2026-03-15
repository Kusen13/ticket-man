import React, { useState } from 'react';
import { useTicketTrends } from '../../hooks/useTicketTrends';
import { useData } from '../../hooks/useData';
import { AIChatPanel } from '../../components/ai/AIChatPanel';
import {
  Bot, TrendingUp, Sparkles, ChevronRight, X, Loader2, AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../../supabaseClient';

/* ─────────────────────────────────────────────────────────────
   Inline AI Step-by-Step card that appears when a trend is clicked
───────────────────────────────────────────────────────────── */
interface TrendSolutionPanelProps {
  category: string;
  onClose: () => void;
}

const TrendSolutionPanel: React.FC<TrendSolutionPanelProps> = ({ category, onClose }) => {
  const [solution, setSolution] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { articles } = useData();

  React.useEffect(() => {
    // Reset on new category
    setSolution(null);
    setLoading(true);
    setError(null);

    const fetchSolution = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setError('Authentication error. Please log in again.');
          return;
        }

        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lgvxipvgtquqqcmyzjug.supabase.co';
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndnhpcHZndHF1cXFjbXl6anVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjUwMDMsImV4cCI6MjA4ODYwMTAwM30.c3_1MrF6-_7R5JE4PMzauI-IU6FGv19W3druYYCBDGk';

        // Pull relevant KB articles for this category
        const relevantArticles = articles
          .filter(a =>
            a.category.toLowerCase().includes(category.toLowerCase()) ||
            a.title.toLowerCase().includes(category.toLowerCase())
          )
          .slice(0, 5)
          .map(a => ({ id: a.id, title: a.title, content: a.content.substring(0, 1500), category: a.category }));

        const prompt = `The trending issue in our ticketing system is: "${category}". 
Based on common IT/HR/Payroll/Facilities issues, provide a clear step-by-step guide employees can follow to resolve or handle this issue themselves.
Format your response as:
1. A one-sentence summary of the issue
2. Numbered steps (at least 4 steps)
3. A "When to escalate" note at the end

Be specific, practical, and concise.`;

        const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            message: prompt,
            session_id: `trend_${category}_${Date.now()}`,
            kb_articles: relevantArticles,
            trends_summary: [category],
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 429) {
            setError('You have reached your daily AI limit. Try again tomorrow.');
          } else {
            setError(data.error || 'Could not generate guide. Please try again.');
          }
          return;
        }

        setSolution(data.message);
      } catch (err) {
        setError('Failed to connect to AI. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchSolution();
  }, [category]);

  return (
    <div className="glass-card border-violet-500/30 bg-violet-500/5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/20">
            <Sparkles className="text-violet-400" size={17} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">AI Step-by-Step Guide</h3>
            <p className="text-[10px] text-violet-400 font-bold uppercase tracking-wide">{category}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="p-5">
        {loading && (
          <div className="flex items-center gap-3 text-slate-400 py-4">
            <Loader2 size={18} className="animate-spin text-violet-400" />
            <span className="text-sm">Generating step-by-step guide...</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-3 text-rose-400 py-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {solution && (
          <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
            {solution.split('\n').map((line, i) => {
              // Bold numbered steps
              const stepMatch = line.match(/^(\d+)\.\s(.+)/);
              if (stepMatch) return (
                <div key={i} className="flex gap-3 mb-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[11px] font-black flex items-center justify-center">
                    {stepMatch[1]}
                  </span>
                  <span className="pt-0.5">{stepMatch[2]}</span>
                </div>
              );
              // Escalate note
              if (line.toLowerCase().includes('escalate') || line.toLowerCase().includes('when to')) return (
                <div key={i} className="mt-4 pt-4 border-t border-white/5 text-amber-400/80 text-xs font-medium">{line}</div>
              );
              // Empty line
              if (!line.trim()) return <div key={i} className="h-2" />;
              // Regular text
              return <p key={i} className="mb-2 text-slate-400">{line}</p>;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Expanded Trends Panel (right column)
───────────────────────────────────────────────────────────── */
const TrendsColumn: React.FC = () => {
  const { trends } = useTicketTrends(30);
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null);

  const handleTrendClick = (category: string) => {
    // If same trend clicked again, close it
    setSelectedTrend(prev => prev === category ? null : category);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
            <TrendingUp className="text-emerald-400" size={17} />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">Live Trends</h2>
            <p className="text-[10px] text-slate-500">Tickets from the last 30 days · Click a trend for AI guide</p>
          </div>
        </div>

        {trends.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No recent ticket trends yet.</p>
        ) : (
          <div className="space-y-3">
            {trends.map((trend, index) => {
              const isActive = selectedTrend === trend.category;
              const isTop = index === 0;
              return (
                <button
                  key={trend.category}
                  onClick={() => handleTrendClick(trend.category)}
                  className={clsx(
                    'w-full text-left rounded-xl p-3 transition-all group border',
                    isActive
                      ? 'bg-violet-500/15 border-violet-500/40'
                      : 'hover:bg-white/5 border-transparent hover:border-white/10'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={clsx(
                        'w-2 h-2 rounded-full transition-transform',
                        isTop
                          ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] group-hover:scale-125'
                          : 'bg-slate-600 group-hover:scale-125'
                      )} />
                      <span className={clsx(
                        'text-sm font-semibold transition-colors',
                        isActive ? 'text-violet-300' : 'text-slate-300 group-hover:text-violet-400'
                      )}>
                        {trend.category}
                      </span>
                      {isTop && (
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                          Top
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500">{trend.count} tickets</span>
                      <ChevronRight
                        size={14}
                        className={clsx(
                          'text-slate-600 transition-all',
                          isActive ? 'text-violet-400 rotate-90' : 'group-hover:text-violet-400 group-hover:translate-x-0.5'
                        )}
                      />
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all',
                        isTop ? 'bg-emerald-500' : 'bg-slate-600'
                      )}
                      style={{ width: `${trend.percentage}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Solution Card — appears below when a trend is selected */}
      {selectedTrend && (
        <TrendSolutionPanel
          key={selectedTrend}
          category={selectedTrend}
          onClose={() => setSelectedTrend(null)}
        />
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Main Knowledge Base Page
───────────────────────────────────────────────────────────── */
export const KnowledgeBase: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in h-full">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/20">
          <Bot className="text-violet-400" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Help Center</h1>
          <p className="text-slate-400 text-sm">Chat with TicketBot · See trending issues · Get instant step-by-step guides</p>
        </div>
      </div>

      {/* Two-column layout: Chat (left) | Trends (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Left — Always-open Chat */}
        <div className="glass-card p-5 flex flex-col" style={{ minHeight: '600px' }}>
          <AIChatPanel />
        </div>

        {/* Right — Live Trends + AI Guide */}
        <div className="flex flex-col gap-4">
          <TrendsColumn />
        </div>
      </div>
    </div>
  );
};
