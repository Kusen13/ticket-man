import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import dayjs from 'dayjs';
import { Database, MessageSquare, Ticket, FileArchive, Users } from 'lucide-react';
import clsx from 'clsx';

interface SystemUsage {
  totalTickets: number;
  totalComments: number;
  totalMessages: number;
  totalStorageMB: number;
  activeUsers: number;
}

interface SystemUsagePanelProps {
  isSidebar?: boolean;
}

export const SystemUsagePanel: React.FC<SystemUsagePanelProps> = ({ isSidebar = false }) => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<SystemUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      if (!user || user.role === 'EMPLOYEE') return;
      const period = dayjs().startOf('month').format('YYYY-MM-DD');
      
      const { data, error } = await supabase
        .from('usage_quotas')
        .select('*')
        .eq('period', period);
        
      if (!error && data) {
        const total = data.reduce((acc, curr) => {
          return {
            tickets: acc.tickets + curr.tickets,
            comments: acc.comments + curr.comments,
            messages: acc.messages + curr.messages,
            storage_bytes: acc.storage_bytes + curr.storage_bytes,
          };
        }, { tickets: 0, comments: 0, messages: 0, storage_bytes: 0 });

        setUsage({
          totalTickets: total.tickets,
          totalComments: total.comments,
          totalMessages: total.messages,
          totalStorageMB: parseFloat((total.storage_bytes / (1024 * 1024)).toFixed(2)),
          activeUsers: data.length
        });
      } else {
        setUsage({ totalTickets: 0, totalComments: 0, totalMessages: 0, totalStorageMB: 0, activeUsers: 0 });
      }
      setLoading(false);
    };
    fetchUsage();
  }, [user]);

  if (!user || user.role === 'EMPLOYEE' || loading || !usage) return null;

  const StatItem = ({ label, value, icon, unit }: { label: string; value: number | string; icon: React.ReactNode; unit?: string }) => (
    <div className={clsx(
      "bg-white/[0.02] border border-white/5 rounded-xl transition-all",
      isSidebar ? "p-3" : "p-4"
    )}>
      <div className="flex items-center gap-2 mb-1 text-slate-500">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className={clsx(
        "font-black text-white",
        isSidebar ? "text-lg" : "text-2xl"
      )}>
        {value} {unit && <span className="text-xs text-slate-500 font-bold ml-0.5">{unit}</span>}
      </p>
    </div>
  );

  return (
    <div className={clsx(
      "transition-all duration-300",
      isSidebar ? "px-4 py-6 border-t border-white/5" : "glass-card p-6 border-indigo-500/20"
    )}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-400 shrink-0">
          <Database size={16} />
        </div>
        <div className="min-w-0">
          <h3 className="text-xs font-black text-white uppercase tracking-widest truncate">System Overview</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Global Quota Stats</p>
        </div>
      </div>
      
      <div className={clsx(
        "grid gap-3",
        isSidebar ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
      )}>
        <StatItem label="Users" value={usage.activeUsers} icon={<Users size={12} className="text-indigo-400" />} />
        <StatItem label="Tickets" value={usage.totalTickets} icon={<Ticket size={12} className="text-indigo-400" />} />
        <StatItem label="Comments" value={usage.totalComments} icon={<MessageSquare size={12} className="text-indigo-400" />} />
        <StatItem label="Msgs" value={usage.totalMessages} icon={<MessageSquare size={12} className="text-indigo-400" />} />
        <StatItem label="Data" value={usage.totalStorageMB} unit="MB" icon={<FileArchive size={12} className="text-indigo-400" />} />
      </div>
    </div>
  );
};
