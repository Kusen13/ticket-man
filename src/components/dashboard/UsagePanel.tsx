import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import dayjs from 'dayjs';
import { MessageSquare, Ticket, FileArchive, Activity } from 'lucide-react';

interface UsageData {
  tickets: number;
  comments: number;
  messages: number;
  storage_bytes: number;
}

const EMPTY: UsageData = { tickets: 0, comments: 0, messages: 0, storage_bytes: 0 };

export const UsagePanel: React.FC = () => {
  const { user } = useAuth();
  const { config } = useData();
  const [usage, setUsage] = useState<UsageData>(EMPTY);

  useEffect(() => {
    if (!user) return;
    const period = dayjs().startOf('month').format('YYYY-MM-DD');
    supabase
      .from('usage_quotas')
      .select('tickets, comments, messages, storage_bytes')
      .eq('user_id', user.id)
      .eq('period', period)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setUsage(data as UsageData);
      });
  }, [user]);

  if (!user) return null;

  // Safe defaults in case config hasn't loaded from server yet
  const ticketLimit   = user.role === 'SUPER_ADMIN' ? Infinity : user.role === 'ADMIN' ? (config.quotaTicketsAdmin   || 50)  : (config.quotaTicketsEmployee   || 20);
  const commentLimit  = user.role === 'SUPER_ADMIN' ? Infinity : user.role === 'ADMIN' ? (config.quotaCommentsAdmin  || 150) : (config.quotaCommentsEmployee  || 60);
  const messageLimit  = user.role === 'SUPER_ADMIN' ? Infinity : user.role === 'ADMIN' ? (config.quotaMessagesAdmin  || 500) : (config.quotaMessagesEmployee  || 200);
  const storageMBLimit = user.role === 'SUPER_ADMIN' ? (config.quotaStorageSuperMb || 20) : user.role === 'ADMIN' ? (config.quotaStorageAdminMb || 10) : (config.quotaStorageEmployeeMb || 5);

  const pct = (used: number, max: number) =>
    max === Infinity ? 0 : Math.min(Math.round((used / max) * 100), 100);

  const storageMBUsed = (usage.storage_bytes / (1024 * 1024));
  const storagePct = pct(storageMBUsed, storageMBLimit);
  const ticketPct  = pct(usage.tickets,  ticketLimit);
  const commentPct = pct(usage.comments, commentLimit);
  const messagePct = pct(usage.messages, messageLimit);

  const barColor = (p: number) => p >= 90 ? 'bg-rose-500' : p >= 70 ? 'bg-amber-500' : 'bg-violet-500';

  const StatBar = ({ label, icon, used, limit, percent, color }: { label: string; icon: React.ReactNode; used: number | string; limit: number | string; percent: number; color: string }) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-300 flex items-center gap-2">{icon} {label}</span>
        <span className="text-xs font-bold text-slate-400">{used} / {limit}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
          <Activity size={18} />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">My Monthly Usage</h3>
          <p className="text-xs text-slate-500">{dayjs().format('MMMM YYYY')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5">
        <StatBar
          label="Tickets"
          icon={<Ticket size={15} className="text-violet-400" />}
          used={usage.tickets}
          limit={ticketLimit === Infinity ? '∞' : ticketLimit}
          percent={ticketPct}
          color={barColor(ticketPct)}
        />
        <StatBar
          label="Comments"
          icon={<MessageSquare size={15} className="text-emerald-400" />}
          used={usage.comments}
          limit={commentLimit === Infinity ? '∞' : commentLimit}
          percent={commentPct}
          color={commentPct >= 90 ? 'bg-rose-500' : commentPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}
        />
        <StatBar
          label="Messages"
          icon={<MessageSquare size={15} className="text-blue-400" />}
          used={usage.messages}
          limit={messageLimit === Infinity ? '∞' : messageLimit}
          percent={messagePct}
          color={messagePct >= 90 ? 'bg-rose-500' : messagePct >= 70 ? 'bg-amber-500' : 'bg-blue-500'}
        />
        <StatBar
          label="Storage"
          icon={<FileArchive size={15} className="text-orange-400" />}
          used={`${storageMBUsed.toFixed(2)} MB`}
          limit={`${storageMBLimit} MB`}
          percent={storagePct}
          color={storagePct >= 90 ? 'bg-rose-500' : storagePct >= 70 ? 'bg-amber-500' : 'bg-orange-500'}
        />
      </div>
    </div>
  );
};
