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
  sampleTitles: string[];
  sampleDescriptions: string;
  onClose: () => void;
}

const TrendSolutionPanel: React.FC<TrendSolutionPanelProps> = ({ category, sampleTitles, sampleDescriptions, onClose }) => {
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
        // 1. Check if we have a cached solution for today
        const today = new Date().toISOString().split('T')[0];
        const { data: cachedData } = await supabase
          .from('ai_trend_solutions')
          .select('solution')
          .eq('category', category)
          .gte('created_at', today)
          .maybeSingle();

        if (cachedData) {
          setSolution(cachedData.solution);
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setError('Authentication error. Please log in again.');
          return;
        }

        // Pull relevant KB articles for this category
        const relevantArticles = articles
          .filter(a =>
            a.category.toLowerCase().includes(category.toLowerCase()) ||
            a.title.toLowerCase().includes(category.toLowerCase())
          )
          .slice(0, 5)
          .map(a => ({ id: a.id, title: a.title, content: a.content.substring(0, 1500), category: a.category }));

        const contextInfo = `Category: ${category}
Recent Ticket Subjects: ${sampleTitles.join(', ')}
Issue Context: ${sampleDescriptions}`;

        const prompt = `The trending issue in our ticketing system is summarized as follows:
${contextInfo}

Based on this specific context and common IT/HR/Payroll/Facilities issues, provide a clear step-by-step guide employees can follow to resolve or handle this issue themselves.
Format your response as:
1. A one-sentence summary of the issue
2. Numbered steps (at least 4 steps)
3. A "When to escalate" note at the end

Be specific, practical, and concise.`;

        const { data: result, error: invokeError } = await supabase.functions.invoke('ai-chat', {
          body: {
            message: prompt,
            session_id: `trend_${category}_${today}`,
            kb_articles: relevantArticles,
            trends_summary: [category, ...sampleTitles],
          },
        });

        if (invokeError) {
          console.error("Trend AI Error:", invokeError);
          const errorMsg = invokeError.message || invokeError.toString();
          if (errorMsg.includes('429')) {
            setError('You have reached your daily AI limit. Try again tomorrow.');
          } else {
            setError(errorMsg || 'Could not generate guide. Please try again.');
          }
          return;
        }

        if (!result || result.error) {
          setError(result?.error || 'Could not generate guide. Please try again.');
          return;
        }

        setSolution(result.message);

        // 2. Cache the result for today
        await supabase.from('ai_trend_solutions').insert({
          category,
          solution: result.message,
          context_summary: contextInfo,
        });

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
  const [selectedTrend, setSelectedTrend] = useState<{ category: string; titles: string[]; descriptions: string } | null>(null);

  const handleTrendClick = (trend: any) => {
    // If same trend clicked again, close it
    setSelectedTrend(prev => prev?.category === trend.category ? null : {
      category: trend.category,
      titles: trend.sampleTitles,
      descriptions: trend.sampleDescriptions
    });
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
              const isTop = index === 0;
              return (
                <button
                  key={trend.category}
                  onClick={() => handleTrendClick(trend)}
                  className={clsx(
                    'w-full text-left rounded-xl p-3 transition-all group border',
                    selectedTrend?.category === trend.category
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
                        selectedTrend?.category === trend.category ? 'text-violet-300' : 'text-slate-300 group-hover:text-violet-400'
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
                          selectedTrend?.category === trend.category ? 'text-violet-400 rotate-90' : 'group-hover:text-violet-400 group-hover:translate-x-0.5'
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
          key={selectedTrend.category}
          category={selectedTrend.category}
          sampleTitles={selectedTrend.titles}
          sampleDescriptions={selectedTrend.descriptions}
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
