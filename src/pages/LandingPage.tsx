import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Ticket, Bot, Bell, MessageSquare, BarChart3, Shield, Users, Zap,
  Moon, Sun, Download, ArrowRight, Star, CheckCircle, ChevronDown,
  Smartphone, Globe, Lock, TrendingUp
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
    desc: 'Machine-learned analysis instantly assigns low, medium, high, or urgent priority to every ticket based on content and context.',
  },
  {
    icon: <Bell size={28} />,
    color: 'emerald',
    title: 'Mobile Push Notifications',
    desc: 'Real-time alerts delivered straight to your phone — even when the app is closed — via our PWA push notification system.',
  },
  {
    icon: <MessageSquare size={28} />,
    color: 'cyan',
    title: 'In-System Messaging',
    desc: 'Collaborate directly inside tickets with threaded comments, @mentions, file attachments, and live message channels.',
  },
  {
    icon: <BarChart3 size={28} />,
    color: 'orange',
    title: 'Usage & Quota Tracking',
    desc: 'Monitor ticket submissions, comments, messages, and storage in real-time dashboards — per user and system-wide.',
  },
  {
    icon: <Shield size={28} />,
    color: 'rose',
    title: 'Role-Based Access',
    desc: 'Employee, Admin, and Super Admin roles with granular permissions, approval workflows, and secure row-level data isolation.',
  },
  {
    icon: <Zap size={28} />,
    color: 'amber',
    title: 'SLA Deadline Tracking',
    desc: 'Configurable SLA rules per priority level with countdown timers, breach alerts, and auto-escalation support.',
  },
  {
    icon: <Users size={28} />,
    color: 'blue',
    title: 'Department Routing',
    desc: 'Tickets automatically route to the right department. Admins can assign, re-assign, or return tickets with full audit trails.',
  },
  {
    icon: <Globe size={28} />,
    color: 'violet',
    title: 'Smart Knowledge Base',
    desc: 'Employees can self-resolve common issues through a searchable, AI-curated knowledge base before filing a ticket.',
  },
];

const STATS = [
  { value: '3', label: 'Access Roles', icon: <Lock size={18} /> },
  { value: '∞', label: 'Ticket Routing', icon: <TrendingUp size={18} /> },
  { value: '5MB', label: 'Storage / User', icon: <Smartphone size={18} /> },
  { value: '24/7', label: 'Push Monitoring', icon: <Bell size={18} /> },
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
  console.log('LandingPage Rendering...');
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
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]">
              <Ticket size={18} className="text-white" />
            </div>
            <span className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>
              Ticket <span className="text-violet-400">Man</span>
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all ${
                isDark
                  ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  : 'bg-black/5 border-black/10 text-[#1a1a2e] hover:bg-black/10'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Link
              to="/login"
              className={`hidden sm:inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                isDark
                  ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  : 'bg-black/5 border-black/10 text-[#1a1a2e] hover:bg-black/10'
              }`}
            >
              Sign In
            </Link>

            <Link
              to="/login"
              className="btn-primary px-5 py-2.5 text-sm font-bold rounded-xl"
            >
              Sign Up Now
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-violet-600/10 blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/8 blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-purple-600/8 blur-[80px]" />
        </div>

        {/* Pill badge */}
        <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest mb-8 ${
          isDark ? 'bg-violet-500/10 border-violet-500/20 text-violet-300' : 'bg-violet-100 border-violet-300 text-violet-700'
        }`}>
          <Star size={12} className="text-yellow-400" fill="currentColor" />
          Smart Ticketing for Fast Services Corporation
        </div>

        {/* Headline */}
        <h1 className={`transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.08]`}>
          <span className={isDark ? 'text-white' : 'text-[#1a1a2e]'}>Resolve Issues.</span>
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Smarter & Faster.
          </span>
        </h1>

        {/* Subheading */}
        <p className={`transition-all duration-700 delay-150 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} max-w-2xl mx-auto text-lg sm:text-xl leading-relaxed mb-10 ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          AI-powered priority detection, real-time mobile push notifications, SLA tracking,
          and seamless team collaboration — all in one modern ticketing platform.
        </p>

        {/* CTAs */}
        <div className={`transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} flex flex-col sm:flex-row items-center justify-center gap-4 mb-16`}>
          <Link
            to="/login"
            className="btn-primary px-8 py-4 text-base font-bold rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.4)]"
          >
            Sign Up Now — It's Free
            <ArrowRight size={18} />
          </Link>
          <button
            onClick={triggerInstall}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold border transition-all hover:-translate-y-1 ${
              isDark
                ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                : 'bg-white border-black/15 text-[#1a1a2e] hover:bg-gray-50 shadow-sm'
            }`}
          >
            <Download size={18} className="text-violet-400" />
            Download App
          </button>
        </div>

        {/* Stats Bar */}
        <div className={`transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto w-full`}>
          {STATS.map((s) => (
            <div key={s.label} className={`rounded-2xl p-4 border flex flex-col items-center gap-2 ${
              isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/8 shadow-sm'
            }`}>
              <span className="text-violet-400">{s.icon}</span>
              <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>{s.value}</span>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown size={22} className={isDark ? 'text-slate-600' : 'text-slate-400'} />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-20">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest mb-4 ${
              isDark ? 'bg-violet-500/10 border-violet-500/20 text-violet-300' : 'bg-violet-100 border-violet-300 text-violet-700'
            }`}>
              <Zap size={12} />
              Packed Features
            </div>
            <h2 className={`text-4xl sm:text-5xl font-black tracking-tight mb-4 ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>
              Everything Your Team Needs
            </h2>
            <p className={`text-lg max-w-xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Ticket Man combines intelligent automation, real-time collaboration, and mobile-first design.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className={`group relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-2 cursor-default ${
                  isDark
                    ? 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                    : 'bg-white border-black/8 hover:border-black/15 shadow-sm hover:shadow-md'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${ACCENT[feat.color]}`}>
                  {feat.icon}
                </div>
                <h3 className={`font-bold text-sm mb-2 leading-tight ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>
                  {feat.title}
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PWA SECTION ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className={`relative rounded-3xl p-10 sm:p-16 overflow-hidden border ${
            isDark ? 'bg-gradient-to-br from-violet-900/30 to-indigo-900/20 border-violet-500/20' : 'bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200'
          }`}>
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-violet-600/10 blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-indigo-600/8 blur-[60px] pointer-events-none" />
            
            <div className="relative grid sm:grid-cols-2 gap-10 items-center">
              <div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-5 ${
                  isDark ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                }`}>
                  <Smartphone size={12} />
                  100% Free — No App Store Needed
                </div>
                <h2 className={`text-3xl sm:text-4xl font-black tracking-tight mb-4 leading-tight ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>
                  Install It On Your Phone
                </h2>
                <p className={`text-sm leading-relaxed mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ticket Man is a Progressive Web App — install it directly from your browser with one tap. 
                  Get native push notifications on Android &amp; iOS (16.4+) without any app store.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Notifications even when app is closed',
                    'Installs like a native app — no Play Store',
                    'Works offline for cached content',
                    'Automatic updates in the background',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                      <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={triggerInstall}
                  className="btn-primary px-8 py-4 text-sm font-bold rounded-2xl"
                >
                  <Download size={18} />
                  Download / Install Now
                </button>
              </div>

              {/* Mockup */}
              <div className="flex justify-center">
                <div className={`relative w-52 h-[380px] rounded-[36px] border-4 flex flex-col overflow-hidden shadow-2xl ${
                  isDark ? 'bg-[#0e0e18] border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  {/* Status bar */}
                  <div className={`flex items-center justify-between px-5 pt-4 pb-2 text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-1.5 rounded bg-current opacity-70" />
                      <div className="w-2 h-1.5 rounded bg-current opacity-50" />
                    </div>
                  </div>
                  {/* Notch */}
                  <div className="w-20 h-5 rounded-full bg-black mx-auto mb-2" />
                  {/* Mini app screen */}
                  <div className="flex-1 px-3 py-2 space-y-2 overflow-hidden">
                    <div className="w-full h-16 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                      <Ticket size={28} className="text-violet-400" />
                    </div>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`w-full h-10 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`} />
                    ))}
                    {/* Push notification bubble */}
                    <div className={`rounded-xl p-3 border ${isDark ? 'bg-white/[0.06] border-white/10' : 'bg-violet-50 border-violet-100'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Bell size={10} className="text-violet-400" />
                        <span className={`text-[9px] font-black uppercase tracking-wide ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>Ticket Man</span>
                      </div>
                      <p className={`text-[9px] leading-tight ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        🎫 New ticket assigned to you: TKT-00042
                      </p>
                    </div>
                  </div>
                  {/* Home bar */}
                  <div className="pb-3 flex justify-center">
                    <div className={`w-24 h-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-black/15'}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-4xl sm:text-5xl font-black tracking-tight mb-6 ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>
            Ready to Streamline Your
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent"> Tickets?</span>
          </h2>
          <p className={`text-lg mb-10 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Join all employees at Fast Services Corporation Meycauayan Branch on Ticket Man.
          </p>
          <Link
            to="/login"
            className="btn-primary px-10 py-5 text-base font-bold rounded-2xl shadow-[0_0_50px_rgba(139,92,246,0.5)] inline-flex items-center gap-3"
          >
            Get Started Now
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={`py-10 px-6 border-t ${isDark ? 'border-white/5' : 'border-black/8'}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <Ticket size={14} className="text-white" />
            </div>
            <span className={`font-black text-sm ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>
              Ticket Man
            </span>
          </div>
          <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            © {new Date().getFullYear()} Fast Services Corporation — Meycauayan Branch.
          </p>
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl border transition-all ${
              isDark
                ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                : 'bg-black/5 border-black/10 text-slate-500 hover:bg-black/10'
            }`}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </footer>
    </div>
  );
};
