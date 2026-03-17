import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Ticket, Bot, Bell, MessageSquare, BarChart3, Shield, Zap,
  Moon, Sun, ArrowRight, CheckCircle, Smartphone, Globe, Lock, TrendingUp, Sparkles
} from 'lucide-react';

// ─────────────────────────────────────────────
// PWA Install Helper
// ─────────────────────────────────────────────
let deferredPrompt: any = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

const triggerInstall = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  } else {
    alert(
      'To install:\n📱 iOS Safari → Share → Add to Home Screen\n🤖 Android Chrome → Menu (⋮) → Add to Home Screen'
    );
  }
};

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────
const FEATURES = [
  {
    icon: <Bot size={28} />,
    color: 'violet',
    title: 'AI Priority Engine',
    desc: 'Intelligent analysis automatically assigns priority levels based on ticket content, ensuring urgent issues never wait.',
  },
  {
    icon: <TrendingUp size={28} />,
    color: 'emerald',
    title: 'Smart Ticket Routing',
    desc: 'Automated department assignment with configurable SLA rules and audit trails for every service request.',
  },
  {
    icon: <MessageSquare size={28} />,
    color: 'cyan',
    title: 'Live Collaboration',
    desc: 'Real-time threaded comments, @mentions, and mobile push notifications keep your team synchronized 24/7.',
  },
  {
    icon: <Globe size={28} />,
    color: 'amber',
    title: 'Smart Knowledge Base',
    desc: 'AI-curated self-service portal helps employees resolve common issues instantly before a ticket is even filed.',
  },
  {
    icon: <Shield size={28} />,
    color: 'rose',
    title: 'Corporate Security',
    desc: 'Role-based access control with granular permissions and secure data isolation for all organizational levels.',
  },
  {
    icon: <BarChart3 size={28} />,
    color: 'orange',
    title: 'Service Analytics',
    desc: 'Comprehensive dashboards for tracking usage quotas, SLA compliance, and team performance metrics.',
  },
];

const STATS = [
  { value: '3', label: 'Access Roles', icon: <Lock size={18} /> },
  { value: '100%', label: 'Cloud Hosted', icon: <Globe size={18} /> },
  { value: '24/7', label: 'AI Assistance', icon: <Bot size={18} /> },
  { value: 'SLA', label: 'Compliance', icon: <Zap size={18} /> },
];

const ACCENT: Record<string, string> = {
  violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  cyan:    'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  orange:  'text-orange-400 bg-orange-500/10 border-orange-500/20',
  rose:    'text-rose-400 bg-rose-500/10 border-rose-500/20',
  amber:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
  blue:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    setTimeout(() => setVisible(true), 100);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#06060b]' : 'bg-[#f2eeeb]'} overflow-x-hidden`}>

      {/* ── NAV ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? `${isDark ? 'bg-[#06060b]/90' : 'bg-[#f2eeeb]/90'} backdrop-blur-xl border-b ${isDark ? 'border-white/5' : 'border-black/8'} shadow-xl`
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]">
              <Ticket size={18} className="text-white" />
            </div>
            <span className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>
              Ticket <span className="text-violet-400">Man</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all ${
                isDark
                  ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  : 'bg-black/5 border-black/10 text-[#1a1a2e] hover:bg-black/10'
              }`}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Link
              to="/login"
              className={`inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                isDark
                  ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  : 'bg-black/5 border-black/10 text-[#1a1a2e] hover:bg-black/10'
              }`}
            >
              Portal Login
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-violet-600/10 blur-[120px]" />
        </div>

        <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-8 ${
          isDark ? 'bg-violet-500/10 border-violet-500/20 text-violet-300' : 'bg-violet-100 border-violet-300 text-violet-700'
        }`}>
          <Sparkles size={12} className="text-yellow-400" fill="currentColor" />
          Enterprise Ticketing Solution
        </div>

        <h1 className={`transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} text-5xl sm:text-7xl font-black tracking-tight mb-6 leading-[1.05]`}>
          <span className={isDark ? 'text-white' : 'text-[#1a1a2e]'}>Solve Fast.</span>
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Serve Better.
          </span>
        </h1>

        <p className={`transition-all duration-700 delay-150 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} max-w-2xl mx-auto text-lg leading-relaxed mb-12 ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          Streamline Fast Services Corporation's internal support with AI priority detection, 
          real-time mobile notifications, and advanced department routing.
        </p>

        <div className={`transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} flex flex-col sm:flex-row items-center justify-center gap-4 mb-20`}>
          <Link
            to="/login"
            className="btn-primary px-10 py-5 text-base font-bold rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.4)]"
          >
            Get Started Now
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className={`transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto w-full`}>
          {STATS.map((s) => (
            <div key={s.label} className={`rounded-2xl p-5 border flex flex-col items-center gap-2 ${
              isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/8 shadow-sm'
            }`}>
              <span className="text-violet-400">{s.icon}</span>
              <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>{s.value}</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className={`text-3xl sm:text-5xl font-black tracking-tight mb-4 ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>
              Powerful Capabilities
            </h2>
            <p className={`text-base max-w-xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              One unified platform to manage every organizational request with modern simplicity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className={`group rounded-2xl p-8 border transition-all duration-300 ${
                  isDark
                    ? 'bg-white/[0.02] border-white/5 hover:border-violet-500/30'
                    : 'bg-white border-black/8 hover:border-violet-500/30 shadow-sm'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${ACCENT[feat.color]}`}>
                  {feat.icon}
                </div>
                <h3 className={`font-bold text-lg mb-3 ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>
                  {feat.title}
                </h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PWA SECTION (Simplified) ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className={`relative rounded-3xl p-10 sm:p-16 overflow-hidden border ${
            isDark ? 'bg-gradient-to-br from-violet-950/40 to-black border-white/5' : 'bg-white border-black/10'
          }`}>
            <div className="relative grid sm:grid-cols-2 gap-16 items-center">
              <div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 ${
                  isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <Smartphone size={12} />
                  Native Mobile Experience
                </div>
                <h2 className={`text-3xl font-black tracking-tight mb-6 leading-tight ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>
                   Access Everywhere.
                   <br />Stay Notified.
                </h2>
                <div className="space-y-4 mb-8">
                  {[
                    'Instant installation — no App Store required',
                    'Real-time push notifications on Android & iOS',
                    'Biometric security support for all portal logs',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-emerald-500" />
                      <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={triggerInstall}
                  className="btn-primary w-full sm:w-auto px-10 py-4 text-sm font-bold rounded-2xl"
                >
                  Install App Now
                </button>
              </div>

              <div className="flex justify-center sm:justify-end">
                <div className={`relative w-48 h-[360px] rounded-[32px] border-8 flex flex-col overflow-hidden shadow-2xl ${
                  isDark ? 'bg-[#0e0e18] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="w-20 h-5 rounded-full bg-black mx-auto mt-2" />
                  <div className="flex-1 px-4 py-4 space-y-3">
                    <div className="w-full h-14 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                      <Ticket size={24} className="text-violet-400" />
                    </div>
                    <div className={`rounded-xl p-3 border ${isDark ? 'bg-white/[0.06] border-white/10' : 'bg-violet-50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Bell size={10} className="text-violet-400" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-violet-400">Update</span>
                      </div>
                      <p className={`text-[8px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        🎫 New ticket assigned to you
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={`py-12 px-6 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <Ticket size={14} className="text-white" />
            </div>
            <span className={`font-black text-sm uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>
              Ticket Man
            </span>
          </div>
          <p className={`text-[11px] font-medium tracking-wide ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            © {new Date().getFullYear()} Fast Services Corporation · Internal Support System
          </p>
        </div>
      </footer>
    </div>
  );
};
