import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { useTickets } from '../../hooks/useTickets';
import { useAuth } from '../../hooks/useAuth';
import { Ticket, KBArticle } from '../../types';
import { Search, Book, ChevronRight, Hash, Sparkles, TrendingUp, HelpCircle, Clock, PlayCircle } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const KnowledgeBase: React.FC = () => {
  const { departments, articles, getCategoryById } = useData();
  const { tickets } = useTickets();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [readingArticleId, setReadingArticleId] = useState<string | null>(null);

  // AI Logic: Detect "Trending" issues based on recent ticket activity
  const trendingCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach((t: Ticket) => {
      const catName = t.categoryId ? getCategoryById(t.categoryId)?.name : (t.customCategory || 'General');
      if (catName) counts[catName] = (counts[catName] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name);
  }, [tickets, getCategoryById]);

  // AI Logic: Smart recommendations based on current trends
  const recommendations = useMemo(() => {
    return articles.filter((a: KBArticle) => 
      trendingCategories.some(cat => 
        a.category.toLowerCase().includes(cat.toLowerCase()) || 
        a.title.toLowerCase().includes(cat.toLowerCase())
      )
    ).slice(0, 2);
  }, [articles, trendingCategories]);

  const categories = Array.from(new Set(articles.map((a: KBArticle) => a.category)));

  const filteredArticles = articles.filter((a: KBArticle) => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? a.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const trendInstructions: Record<string, string> = {
    'Network Access': 'AI ANALYSIS: Most connection issues are resolved by resetting your MFA session or restarting the Cisco AnyConnect client. Ensure you are on a stable Wi-Fi before connecting.',
    'Software': 'AI ANALYSIS: System slowness or sync issues are usually caused by accumulated cache. Clearing the application cache (Teams/Outlook) is the recommended first step.',
    'Hardware': 'AI ANALYSIS: For printer or peripheral issues, always check physical connections and power cycle the device. If the status is "Offline", remove and re-add the device in Settings.',
    'Account Help': 'AI ANALYSIS: Password lockouts are often temporary. Wait 15 minutes before retrying or use the Self-Service Password Reset (SSPR) tool if configured.',
    'Leaves & Absences': 'AI ANALYSIS: Ensure all supporting documents (medical certificates/approvals) are uploaded to the HR Portal to avoid processing delays.',
    'Benefits': 'AI ANALYSIS: Claims and enrollment updates are processed every Tuesday and Thursday. Check your registered email for Maxicare card digital copies.',
    'Payroll': 'AI ANALYSIS: Payslips are released 2 days before the actual disbursement date. Report any discrepancies immediately via the FastPay Portal.',
  };

  const handleTicketRedirect = () => {
    if (user?.role === 'EMPLOYEE') {
      navigate('/employee/submit');
    } else if (user?.role === 'ADMIN') {
      navigate('/admin/tickets'); // Admins usually manage, but if they need to submit, they can go here
    } else {
      navigate('/super_admin/tickets');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/20">
                <Book className="text-violet-400" size={24} />
             </div>
             Knowledge Base
          </h1>
          <p className="text-slate-400">AI-Powered self-service portal. Try our automated guides before filing a ticket.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Categories */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-violet-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search help guide..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
            />
          </div>

          <div className="glass-card p-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">Navigation</h3>
            <div className="space-y-1">
              <button 
                onClick={() => { setSelectedCategory(null); setReadingArticleId(null); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${!selectedCategory && !readingArticleId ? 'bg-violet-500/20 text-violet-300 border border-violet-500/20' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-2.5 text-sm font-semibold"><Book size={16}/> All Guides</div>
                <span className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded-full">{articles.length}</span>
              </button>
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setReadingArticleId(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${selectedCategory === cat ? 'bg-violet-500/20 text-violet-300 border border-violet-500/20' : 'text-slate-400 hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-2.5 text-sm font-semibold truncate"><Hash size={16} className="opacity-50"/> {cat}</div>
                </button>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5">
                <h3 className="text-[10px] font-bold text-amber-400/80 uppercase tracking-[0.2em] mb-4 px-2 flex items-center gap-2">
                    <TrendingUp size={12} /> Live Trends
                </h3>
                <div className="space-y-3 px-2">
                    {trendingCategories.map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => {
                            setSelectedCategory(null);
                            setSearchTerm(cat);
                            setReadingArticleId(null);
                          }}
                          className="w-full text-left text-[11px] text-slate-300 flex items-center gap-2.5 font-medium hover:text-violet-400 transition-colors group"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)] group-hover:scale-125 transition-transform" />
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
          </div>
        </div>

        {/* Article Reader / List */}
        <div className="lg:col-span-3 space-y-6">
          {readingArticleId ? (
            <div className="glass-card animate-slide-up border-violet-500/10 mb-20">
              {(() => {
                const article = articles.find((a: KBArticle) => a.id === readingArticleId);
                if (!article) return null;
                return (
                  <div className="p-8">
                    <button 
                        onClick={() => setReadingArticleId(null)}
                        className="text-xs text-violet-400 hover:text-violet-300 mb-8 flex items-center gap-2 font-bold uppercase tracking-wider group"
                    >
                        <ChevronRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Back to Library
                    </button>
                    <div className="flex items-center gap-4 mb-6">
                        <span className="bg-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-violet-500/20">
                            {article.category}
                        </span>
                        <span className="text-slate-500 text-xs flex items-center gap-1.5 font-medium">
                            <Clock size={14} /> Last updated {dayjs(article.updatedAt).fromNow()}
                        </span>
                    </div>
                    <h2 className="text-4xl font-extrabold text-white mb-8 leading-[1.1]">{article.title}</h2>
                    
                    {/* Video Tutorial Link */}
                    {article.videoUrl && (
                        <div className="mb-10 p-6 rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-500/10 to-transparent flex items-center justify-between gap-6 group/video">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center border border-rose-500/20">
                                    <PlayCircle className="text-rose-500" size={28} />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-lg">Visual Guide Available</h4>
                                    <p className="text-slate-400 text-sm">Watch the step-by-step video tutorial on YouTube.</p>
                                </div>
                            </div>
                            <a 
                                href={article.videoUrl ? article.videoUrl.replace('/embed/', '/watch?v=') : '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 active:scale-95 shrink-0"
                            >
                                <PlayCircle size={18} /> Watch on YouTube
                            </a>
                        </div>
                    )}

                    <div className="text-slate-300 whitespace-pre-wrap leading-[1.8] text-[15px]">
                        {article.content.split('\n').map((line: string, i: number) => {
                             if (line.startsWith('###')) return <h3 key={i} className="text-xl font-bold text-white mt-10 mb-5 flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-violet-500 rounded-full" />
                                {line.replace('### ', '')}
                             </h3>;
                             if (line.startsWith('**')) return <p key={i} className="mb-4 font-bold text-slate-200">{line.replace(/\*\*/g, '')}</p>;
                             return <p key={i} className="mb-4 opacity-90">{line}</p>;
                        })}
                    </div>
                    <div className="mt-16 p-8 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
                            <HelpCircle className="text-violet-400" size={24} />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">Instructions not working?</h4>
                        <p className="text-slate-400 text-sm mb-6 max-w-sm">If these steps didn't resolve your issue, please submit a formal ticket so our team can investigate.</p>
                        <button 
                            onClick={handleTicketRedirect}
                            className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-violet-600/20 active:scale-95"
                        >
                            Submit Support Ticket
                        </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <>
              {/* AI Smart Recommendations */}
              {!searchTerm && !selectedCategory && recommendations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Sparkles size={14} className="text-violet-400" /> Smart Suggestions For You
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendations.map((article: KBArticle) => (
                          <div 
                            key={`rec-${article.id}`} 
                            onClick={() => setReadingArticleId(article.id)}
                            className="relative group overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-transparent p-6 cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/[0.12] transition-all"
                          >
                              <Sparkles className="absolute -right-6 -top-6 text-violet-500/5 w-32 h-32 rotate-12 group-hover:scale-110 transition-transform" />
                              <div className="flex items-center gap-2 mb-4">
                                  <div className="px-2 py-1 rounded bg-violet-500/20 border border-violet-500/20">
                                      <TrendingUp size={10} className="text-violet-400" />
                                  </div>
                                  <span className="text-violet-400 text-[9px] font-black uppercase tracking-[0.1em]">Predicted Solution</span>
                              </div>
                              <h4 className="text-white font-bold mb-3 group-hover:text-violet-300 transition-colors text-lg leading-tight">{article.title}</h4>
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed opacity-80">{article.content.replace(/[#*]/g, '')}</p>
                          </div>
                      )) }
                  </div>
                </div>
              )}

                  <div className="flex flex-col gap-4">
                    {!searchTerm && !selectedCategory && <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Library</h3>}
                    
                    {/* AI Trend Instruction Banner */}
                    {(selectedCategory || searchTerm) && (trendInstructions[selectedCategory || ''] || trendingCategories.includes(searchTerm)) && (
                        <div className="glass-card p-5 border-violet-500/30 bg-violet-500/5 animate-fade-in flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0 border border-violet-500/20">
                                <Sparkles className="text-violet-400" size={20} />
                            </div>
                            <div>
                                <h4 className="text-violet-300 font-bold text-sm mb-1 uppercase tracking-wider flex items-center gap-2">
                                    AI Smart Guide: {selectedCategory || searchTerm}
                                </h4>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    {trendInstructions[selectedCategory || ''] || trendInstructions[trendingCategories.find(t => t === searchTerm) || ''] || 'Our AI suggests checking the most recent guides below for this trending topic.'}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                    {filteredArticles.length === 0 ? (
                      <div className="glass-card p-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-900 mx-auto mb-6 flex items-center justify-center border border-white/5">
                            <Search size={24} className="text-slate-700" />
                        </div>
                        <h3 className="text-white font-bold mb-2">No results for "{searchTerm}"</h3>
                        <p className="text-slate-500 text-sm">Try broader keywords or browse by category.</p>
                      </div>
                    ) : (
                      filteredArticles.map((article: KBArticle) => {
                        const dept = departments.find(d => d.id === article.departmentId);
                        const isTrending = trendingCategories.includes(article.category);
                        return (
                          <div 
                            key={article.id} 
                            onClick={() => setReadingArticleId(article.id)}
                            className="glass-card group p-6 hover:bg-white/[0.02] hover:border-violet-500/20 transition-all cursor-pointer relative overflow-hidden"
                          >
                            {isTrending && (
                                <div className="absolute top-0 right-10 flex flex-col items-center">
                                     <div className="bg-violet-500 h-1 w-12 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                                     <div className="text-[9px] font-black text-violet-400 mt-1">TRENDING</div>
                                </div>
                            )}
                            <div className="flex items-start justify-between mb-4">
                               <h2 className="text-xl font-bold text-white group-hover:text-violet-400 transition-colors leading-tight uppercase tracking-tight">{article.title}</h2>
                               <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-violet-500/20 text-slate-600 group-hover:text-violet-400 transition-all">
                                   <ChevronRight size={18} />
                               </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                              <span className="bg-slate-800/80 text-slate-400 px-3 py-1 rounded-lg text-[10px] font-black border border-white/5 uppercase tracking-tighter">{article.category}</span>
                              {dept && <span className="bg-violet-500/5 text-violet-400/70 border border-violet-500/10 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">{dept.name}</span>}
                              {article.videoUrl && (
                                <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter flex items-center gap-1">
                                    <PlayCircle size={12} /> Video Guide
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-400/70 line-clamp-2 leading-relaxed mb-6 group-hover:text-slate-400 transition-colors">
                                {article.content.replace(/[#*]/g, '')}
                            </p>
                            <div className="flex items-center gap-2 text-xs font-bold text-violet-500/60 uppercase tracking-widest group-hover:text-violet-400 transition-all">
                                Open Solution <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                          </div>
                        );
                      })
                    )}
                 </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ArrowUpRight = ({ size, className }: { size: number, className: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="7" y1="17" x2="17" y2="7"></line>
        <polyline points="7 7 17 7 17 17"></polyline>
    </svg>
);
