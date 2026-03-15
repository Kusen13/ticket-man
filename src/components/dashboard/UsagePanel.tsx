import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import dayjs from 'dayjs';
import { MessageSquare, Ticket, FileArchive } from 'lucide-react';

interface UsageData {
  tickets: number;
  comments: number;
  messages: number;
  storage_bytes: number;
}

export const UsagePanel: React.FC = () => {
  const { user } = useAuth();
  const { config } = useData();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      if (!user) return;
      const period = dayjs().startOf('month').format('YYYY-MM-DD');
      const { data, error } = await supabase
        .from('usage_quotas')
        .select('*')
        .eq('user_id', user.id)
        .eq('period', period)
        .single();
        
      if (!error && data) {
        setUsage(data as UsageData);
      } else {
        setUsage({ tickets: 0, comments: 0, messages: 0, storage_bytes: 0 });
      }
      setLoading(false);
    };
    fetchUsage();
  }, [user]);

  if (!user || loading || !usage) return null;

  const getLimits = () => {
    if (user.role === 'SUPER_ADMIN') {
      return { tickets: Infinity, comments: Infinity, messages: Infinity, storageMB: config.quotaStorageSuperMb };
    }
    if (user.role === 'ADMIN') {
      return { tickets: config.quotaTicketsAdmin, comments: config.quotaCommentsAdmin, messages: config.quotaMessagesAdmin, storageMB: config.quotaStorageAdminMb };
    }
    return { tickets: config.quotaTicketsEmployee, comments: config.quotaCommentsEmployee, messages: config.quotaMessagesEmployee, storageMB: config.quotaStorageEmployeeMb };
  };

  const limits = getLimits();
  const storageMBUsed = (usage.storage_bytes / (1024 * 1024)).toFixed(2);
  const storagePct = Math.min((parseFloat(storageMBUsed) / limits.storageMB) * 100, 100);
  
  const ticketPct = limits.tickets === Infinity ? 0 : Math.min((usage.tickets / limits.tickets) * 100, 100);
  const commentPct = limits.comments === Infinity ? 0 : Math.min((usage.comments / limits.comments) * 100, 100);
  const messagePct = limits.messages === Infinity ? 0 : Math.min((usage.messages / limits.messages) * 100, 100);

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold text-white mb-4">My Monthly Usage</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tickets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Ticket size={16} className="text-violet-400" /> Tickets
            </span>
            <span className="text-xs font-bold text-slate-400">
              {usage.tickets} / {limits.tickets === Infinity ? '∞' : limits.tickets}
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${ticketPct > 90 ? 'bg-rose-500' : 'bg-violet-500'}`}
              style={{ width: `${ticketPct}%` }}
            />
          </div>
        </div>

        {/* Comments */}
        <div>
          <div className="flex items-center justify-between mb-2">
             <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
               <MessageSquare size={16} className="text-violet-400" /> Comments
             </span>
             <span className="text-xs font-bold text-slate-400">
               {usage.comments} / {limits.comments === Infinity ? '∞' : limits.comments}
             </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
             <div 
               className={`h-full rounded-full transition-all duration-500 ${commentPct > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
               style={{ width: `${commentPct}%` }}
             />
          </div>
        </div>

        {/* Messages */}
        <div>
          <div className="flex items-center justify-between mb-2">
             <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
               <MessageSquare size={16} className="text-violet-400" /> Messages
             </span>
             <span className="text-xs font-bold text-slate-400">
               {usage.messages} / {limits.messages === Infinity ? '∞' : limits.messages}
             </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
             <div 
               className={`h-full rounded-full transition-all duration-500 ${messagePct > 90 ? 'bg-rose-500' : 'bg-blue-500'}`}
               style={{ width: `${messagePct}%` }}
             />
          </div>
        </div>

        {/* Storage */}
        <div>
          <div className="flex items-center justify-between mb-2">
             <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
               <FileArchive size={16} className="text-violet-400" /> Storage
             </span>
             <span className="text-xs font-bold text-slate-400">
               {storageMBUsed} MB / {limits.storageMB} MB
             </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
             <div 
               className={`h-full rounded-full transition-all duration-500 ${storagePct > 90 ? 'bg-rose-500' : 'bg-orange-500'}`}
               style={{ width: `${storagePct}%` }}
             />
          </div>
        </div>
      </div>
    </div>
  );
};
