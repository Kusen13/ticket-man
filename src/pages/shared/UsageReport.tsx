import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { UsagePanel } from '../../components/dashboard/UsagePanel';
import { SystemUsagePanel } from '../../components/dashboard/SystemUsagePanel';
import { Activity, FileText, Clock, Shield, Bot } from 'lucide-react';
import { AI_CONFIG } from '../../lib/aiConfig';

export const UsageReport: React.FC = () => {
  const { user } = useAuth();
  const { config } = useData();

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <Activity className="text-violet-400" /> Usage & Quotas
        </h1>
        <p className="text-slate-400">Monitor your resource consumption against your monthly limits.</p>
      </div>

      <div className="space-y-6">
        <UsagePanel />
        
        {/* System Rules Card */}
        <div className="glass-card p-6 border-violet-500/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <FileText size={20} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">System Rules & Fair Use Policy</h2>
              <p className="text-xs text-slate-500">Understanding your limits and data handling</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Monthly Limits */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={12} /> Monthly Limits
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tickets filed</span>
                  <span className="text-white font-bold">
                    {user.role === 'EMPLOYEE' ? config.quotaTicketsEmployee : user.role === 'ADMIN' ? config.quotaTicketsAdmin : '∞'}/month
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Comments posted</span>
                  <span className="text-white font-bold">
                    {user.role === 'EMPLOYEE' ? config.quotaCommentsEmployee : user.role === 'ADMIN' ? config.quotaCommentsAdmin : '∞'}/month
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Messages sent</span>
                  <span className="text-white font-bold">
                    {user.role === 'EMPLOYEE' ? config.quotaMessagesEmployee : user.role === 'ADMIN' ? config.quotaMessagesAdmin : '∞'}/month
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">File uploads</span>
                  <span className="text-white font-bold">
                    {user.role === 'EMPLOYEE' ? config.quotaStorageEmployeeMb : user.role === 'ADMIN' ? config.quotaStorageAdminMb : config.quotaStorageSuperMb}MB/month
                  </span>
                </div>
              </div>
            </div>

            {/* Daily Limits */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Bot size={12} /> Daily Limits
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">AI TicketBot queries</span>
                  <span className="text-white font-bold">
                    {user.role === 'SUPER_ADMIN' ? '∞' : isAdmin ? (config.aiMaxMsgsAdminDay || AI_CONFIG.DEFAULT_ADMIN_LIMIT) : (config.aiMaxMsgsPerDay || AI_CONFIG.DEFAULT_EMPLOYEE_LIMIT)}/day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max message length</span>
                  <span className="text-white font-bold">{AI_CONFIG.MAX_MESSAGE_LENGTH} characters</span>
                </div>
              </div>
            </div>

            {/* File Upload Rules */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText size={12} /> File Upload Rules
              </h3>
              <div className="space-y-2 text-xs text-slate-400">
                <p>• Max file size: <span className="text-white">2 MB per file</span></p>
                <p>• Accepted types: <span className="text-white">PDF, PNG, JPG, DOCX</span></p>
                <p>• Files deleted when ticket is closed</p>
              </div>
            </div>

            {/* Data Retention */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Shield size={12} /> Data Retention
              </h3>
              <div className="space-y-2 text-xs text-slate-400">
                <p>• Notifications: <span className="text-white">30 days</span></p>
                <p>• AI Chat Logs: <span className="text-white">14 days</span></p>
                <p>• Messages: <span className="text-white">3 months</span></p>
                <p>• Closed Tickets: <span className="text-white">6 months</span></p>
              </div>
            </div>
          </div>

          {/* AI Rules */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <h3 className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Bot size={12} /> AI TicketBot Rules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <p className="text-slate-400">• Only answers company IT, HR, Payroll & Facilities questions</p>
              <p className="text-slate-400">• Never shares salary, passwords, or private HR data</p>
              <p className="text-slate-400">• History visible for 14 days, then auto-deleted</p>
            </div>
          </div>
        </div>
        
        {isAdmin && (
          <SystemUsagePanel />
        )}
      </div>
    </div>
  );
};

export default UsageReport;
