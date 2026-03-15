import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import dayjs from 'dayjs';
import { Database, MessageSquare, Ticket, FileArchive, Users } from 'lucide-react';

interface SystemUsage {
  totalTickets: number;
  totalComments: number;
  totalMessages: number;
  totalStorageMB: number;
  activeUsers: number;
}

export const SystemUsagePanel: React.FC = () => {
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

  return (
    <div className="glass-card p-6 border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.05)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Database size={24} className="text-indigo-400" /> System Usage Overview
          </h3>
          <p className="text-sm text-slate-400 font-medium">Aggregate resource consumption for the current month.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Active Users */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-3 mb-2 text-slate-400">
            <Users size={18} className="text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-widest">Active Users</span>
          </div>
          <p className="text-2xl font-black text-white">{usage.activeUsers}</p>
        </div>

        {/* Tickets */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-3 mb-2 text-slate-400">
            <Ticket size={18} className="text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-widest">Tickets</span>
          </div>
          <p className="text-2xl font-black text-white">{usage.totalTickets}</p>
        </div>

        {/* Comments */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-3 mb-2 text-slate-400">
            <MessageSquare size={18} className="text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-widest">Comments</span>
          </div>
          <p className="text-2xl font-black text-white">{usage.totalComments}</p>
        </div>

        {/* Messages */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-3 mb-2 text-slate-400">
            <MessageSquare size={18} className="text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-widest">Messages</span>
          </div>
          <p className="text-2xl font-black text-white">{usage.totalMessages}</p>
        </div>

        {/* Storage */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-3 mb-2 text-slate-400">
            <FileArchive size={18} className="text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-widest">Storage</span>
          </div>
          <p className="text-2xl font-black text-white">{usage.totalStorageMB} <span className="text-sm text-slate-400 font-medium">MB</span></p>
        </div>
      </div>
    </div>
  );
};
