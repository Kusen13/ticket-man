import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Priority } from '../../types';
import {
  Clock, Bot, Building2, Bell, Save,
  Check, AlertTriangle, ChevronRight, Info, Plus, X, ListTree
} from 'lucide-react';
import { useData } from '../../hooks/useData';

interface SLARule {
  priority: Priority;
  responseHours: number;
  resolutionHours: number;
}

interface SystemConfig {
  companyName: string;
  systemEmail: string;
  maxReopenCount: number;
  autoCloseAfterDays: number;
  notifyOnNewTicket: boolean;
  notifyOnEscalation: boolean;
  notifyOnReopen: boolean;
  slaRules: SLARule[];
  urgentKeywords: string[];
  highKeywords: string[];
  mediumKeywords: string[];
  maxNotificationsHistory?: number;
}



const PRIORITY_COLORS: Record<Priority, { bg: string; border: string; text: string; badge: string }> = {
  URGENT: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', badge: 'bg-rose-500' },
  HIGH: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', badge: 'bg-orange-500' },
  MEDIUM: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', badge: 'bg-amber-500' },
  LOW: { bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-400', badge: 'bg-slate-500' },
};

type SectionId = 'general' | 'sla' | 'ai' | 'categories' | 'notifications';

export const SystemSettings: React.FC = () => {
  const { user } = useAuth();
  const { categories, addCategory, updateCategory, deleteCategory, config, updateConfig } = useData();
  const [localConfig, setLocalConfig] = useState<SystemConfig>(config);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('general');
  const [newKeyword, setNewKeyword] = useState<Record<string, string>>({ URGENT: '', HIGH: '', MEDIUM: '' });

  // Update local config if global config changes (e.g., from another tab or reset)
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  const handleSave = async () => {
    await updateConfig(localConfig);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateSLA = (priority: Priority, field: keyof Omit<SLARule, 'priority'>, value: number) => {
    setLocalConfig(prev => ({
      ...prev,
      slaRules: prev.slaRules.map(r => r.priority === priority ? { ...r, [field]: value } : r)
    }));
  };

  const addKeyword = (level: 'urgentKeywords' | 'highKeywords' | 'mediumKeywords', key: string) => {
    const kw = newKeyword[key]?.trim().toLowerCase();
    if (!kw) return;
    setLocalConfig(prev => ({
      ...prev,
      [level]: prev[level].includes(kw) ? prev[level] : [...prev[level], kw]
    }));
    setNewKeyword(p => ({ ...p, [key]: '' }));
  };

  const removeKeyword = (level: 'urgentKeywords' | 'highKeywords' | 'mediumKeywords', kw: string) => {
    setLocalConfig(prev => ({ ...prev, [level]: prev[level].filter(k => k !== kw) }));
  };

  const navItems: { id: SectionId; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'sla', label: 'SLA Rules', icon: Clock },
    { id: 'ai', label: 'AI Priority Keywords', icon: Bot },
    { id: 'categories', label: 'Ticket Categories', icon: ListTree },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">System Settings</h1>
          <p className="text-slate-400">Configure global system behavior, SLA rules, AI detection, and notifications.</p>
        </div>
        <button onClick={handleSave} className={`btn-primary transition-all ${saved ? 'bg-emerald-600 shadow-[0_4px_14px_rgba(52,211,153,0.4)]' : ''}`}>
          {saved ? <><Check size={18} /> Saved!</> : <><Save size={18} /> Save Changes</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1">
          <div className="glass-card p-2 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeSection === item.id
                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                    : 'text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon size={16} />
                  {item.label}
                </div>
                {activeSection === item.id && <ChevronRight size={14} />}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">

          {/* ─── General Settings ─── */}
          {activeSection === 'general' && (
            <div className="glass-card p-6 space-y-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={18} className="text-violet-400" />
                <h2 className="text-lg font-semibold text-white">General Configuration</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company Name</label>
                  <input
                    type="text"
                    value={localConfig.companyName}
                    onChange={e => setLocalConfig(p => ({ ...p, companyName: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Email</label>
                  <input
                    type="email"
                    value={localConfig.systemEmail}
                    onChange={e => setLocalConfig(p => ({ ...p, systemEmail: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="border-t border-white/5 pt-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Ticket Lifecycle Rules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Max Allowed Re-opens</label>
                    <p className="text-xs text-slate-600 mb-1.5">Employees can re-open a resolved ticket up to this many times.</p>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={localConfig.maxReopenCount}
                      onChange={e => setLocalConfig(p => ({ ...p, maxReopenCount: Number(e.target.value) }))}
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Auto-Close After (Days)</label>
                    <p className="text-xs text-slate-600 mb-1.5">Resolved tickets auto-close after this many days if not re-opened.</p>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={localConfig.autoCloseAfterDays}
                      onChange={e => setLocalConfig(p => ({ ...p, autoCloseAfterDays: Number(e.target.value) }))}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── SLA Rules ─── */}
          {activeSection === 'sla' && (
            <div className="space-y-4 animate-fade-in">
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={18} className="text-violet-400" />
                  <h2 className="text-lg font-semibold text-white">SLA Response & Resolution Rules</h2>
                </div>
                <p className="text-sm text-slate-400 mb-5">Define how quickly tickets of each priority level must be responded to and resolved.</p>

                <div className="space-y-4">
                  {localConfig.slaRules.map(rule => {
                    const colors = PRIORITY_COLORS[rule.priority];
                    return (
                      <div key={rule.priority} className={`${colors.bg} border ${colors.border} rounded-xl p-5`}>
                        <div className="flex items-center gap-2 mb-4">
                          <span className={`w-2.5 h-2.5 rounded-full ${colors.badge}`}></span>
                          <span className={`text-sm font-bold ${colors.text} uppercase tracking-wider`}>{rule.priority}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-400 font-medium">First Response Time (hours)</label>
                            <input
                              type="number"
                              min={0.5}
                              step={0.5}
                              value={rule.responseHours}
                              onChange={e => updateSLA(rule.priority, 'responseHours', Number(e.target.value))}
                              className="input-field text-sm py-2"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-400 font-medium">Resolution Time (hours)</label>
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={rule.resolutionHours}
                              onChange={e => updateSLA(rule.priority, 'resolutionHours', Number(e.target.value))}
                              className="input-field text-sm py-2"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Must respond within <span className={colors.text}>{rule.responseHours}h</span> and resolve within <span className={colors.text}>{rule.resolutionHours}h</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── AI Keywords ─── */}
          {activeSection === 'ai' && (
            <div className="space-y-4 animate-fade-in">
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Bot size={18} className="text-violet-400" />
                  <h2 className="text-lg font-semibold text-white">AI Priority Detection Keywords</h2>
                </div>
                <p className="text-sm text-slate-400 mb-2">
                  The Smart AI engine scans ticket titles and descriptions for these keywords to auto-detect priority. All keywords are case-insensitive.
                </p>
                <div className="flex items-start gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mb-5">
                  <Info size={14} className="text-cyan-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-cyan-300">Higher priority keywords always take precedence. If a ticket matches both URGENT and HIGH keywords, it will be classified as URGENT.</p>
                </div>

                {(
                  [
                    { level: 'urgentKeywords' as const, label: 'URGENT', priority: 'URGENT' as Priority },
                    { level: 'highKeywords' as const, label: 'HIGH', priority: 'HIGH' as Priority },
                    { level: 'mediumKeywords' as const, label: 'MEDIUM', priority: 'MEDIUM' as Priority },
                  ]
                ).map(({ level, label, priority }) => {
                  const colors = PRIORITY_COLORS[priority];
                  const keywords = localConfig[level];
                  return (
                    <div key={level} className={`${colors.bg} border ${colors.border} rounded-xl p-5 mb-4`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${colors.badge}`}></span>
                        <span className={`text-sm font-bold ${colors.text} uppercase tracking-wider`}>{label} Priority Keywords</span>
                        <span className="text-xs text-slate-500">({keywords.length} keywords)</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {keywords.map(kw => (
                          <span key={kw} className={`flex items-center gap-1.5 text-xs font-medium ${colors.text} bg-black/20 px-2.5 py-1 rounded-md border ${colors.border}`}>
                            {kw}
                            <button onClick={() => removeKeyword(level, kw)} className="hover:text-white transition-colors">
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                        {keywords.length === 0 && <span className="text-xs text-slate-600 italic">No keywords configured</span>}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newKeyword[priority] || ''}
                          onChange={e => setNewKeyword(p => ({ ...p, [priority]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && addKeyword(level, priority)}
                          placeholder="Add keyword…"
                          className="input-field flex-1 text-sm py-2"
                        />
                        <button
                          onClick={() => addKeyword(level, priority)}
                          className="px-3 py-2 bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 rounded-lg text-sm transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Ticket Categories ─── */}
          {activeSection === 'categories' && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ListTree size={18} className="text-violet-400" />
                      <h2 className="text-lg font-semibold text-white">Ticket Categories</h2>
                    </div>
                    <p className="text-sm text-slate-400">Define ticket categories and their default priorities for automated triaging.</p>
                  </div>
                  <button 
                    onClick={async () => await addCategory({ name: 'New Category', defaultPriority: 'LOW' })}
                    className="btn-primary py-2 px-4 shadow-none"
                  >
                    <Plus size={16} /> Add Category
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="p-4 bg-slate-900/40 border border-white/5 rounded-xl hover:bg-slate-900/60 transition-colors group relative">
                      <button 
                        onClick={async () => await deleteCategory(cat.id)}
                        className="absolute top-2 right-2 p-1.5 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X size={16} />
                      </button>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category Name</label>
                          <input 
                            type="text"
                            value={cat.name}
                            onChange={async (e) => await updateCategory(cat.id, { name: e.target.value })}
                            className="bg-transparent border-none text-white font-medium p-0 focus:ring-0 w-full"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Default Priority</label>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as Priority[]).map(p => {
                              const isSelected = cat.defaultPriority === p;
                              const colors = PRIORITY_COLORS[p];
                              return (
                                <button
                                  key={p}
                                  onClick={async () => await updateCategory(cat.id, { defaultPriority: p })}
                                  className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${
                                    isSelected 
                                      ? `${colors.bg} ${colors.text} border ${colors.border}` 
                                      : 'bg-white/5 text-slate-500 hover:bg-white/10'
                                  }`}
                                >
                                  {p}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Notifications ─── */}
          {activeSection === 'notifications' && (
            <div className="glass-card p-6 space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Bell size={18} className="text-violet-400" />
                <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
              </div>
              <p className="text-sm text-slate-400">Control what events trigger system notifications to administrators and department heads.</p>

              <div className="space-y-4 pt-2">
                {[
                  {
                    key: 'notifyOnNewTicket' as const,
                    label: 'New Ticket Created',
                    desc: 'Notify department admin when a new ticket is routed to their department.'
                  },
                  {
                    key: 'notifyOnEscalation' as const,
                    label: 'SLA Escalation',
                    desc: 'Alert admins when a ticket breaches or is about to breach its SLA response/resolution deadline.'
                  },
                  {
                    key: 'notifyOnReopen' as const,
                    label: 'Ticket Re-opened',
                    desc: 'Notify the assigned resolver and department admin when an employee re-opens a resolved ticket.'
                  },
                ].map(pref => (
                  <div key={pref.key} className="flex items-start justify-between gap-6 p-4 bg-slate-900/40 border border-white/5 rounded-xl hover:bg-slate-900/60 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-slate-200 mb-0.5">{pref.label}</p>
                      <p className="text-xs text-slate-500">{pref.desc}</p>
                    </div>
                    <button
                      onClick={() => setLocalConfig(p => ({ ...p, [pref.key]: !p[pref.key] }))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        localConfig[pref.key] ? 'bg-violet-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                          localConfig[pref.key] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}

                <div className="flex items-start justify-between gap-6 p-4 bg-slate-900/40 border border-white/5 rounded-xl hover:bg-slate-900/60 transition-colors mt-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-200 mb-0.5">Max Notification History</label>
                    <p className="text-xs text-slate-500">Maximum number of notifications to keep per user before trimming older ones.</p>
                  </div>
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    step="50"
                    value={localConfig.maxNotificationsHistory || 100}
                    onChange={(e) => setLocalConfig(p => ({ ...p, maxNotificationsHistory: parseInt(e.target.value, 10) }))}
                    className="input-field w-24 text-center"
                  />
                </div>
              </div>

              <div className="border-t border-white/5 pt-4">
                <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                  <AlertTriangle size={16} className="text-orange-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-orange-300 mb-1">Email Delivery</p>
                    <p className="text-xs text-slate-400">Notification emails will be delivered from <span className="text-slate-200 font-medium">{localConfig.systemEmail}</span>. Configure SMTP settings in your hosting environment for actual email delivery.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
