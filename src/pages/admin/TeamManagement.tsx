import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { useTickets } from '../../hooks/useTickets';
import {
  Users, Ticket as TicketIcon, CheckCircle2, Clock,
  Search, Shield, ShieldCheck, Mail, BarChart2
} from 'lucide-react';

export const TeamManagement: React.FC = () => {
  const { user } = useAuth();
  const { users, departments } = useData();
  const { tickets } = useTickets();
  const [searchTerm, setSearchTerm] = useState('');

  if (!user || user.role !== 'ADMIN') return null;

  const dept = departments.find(d => d.id === user.departmentId);

  // Team members = employees in admin's department + admin themselves
  const teamMembers = users.filter(u =>
    u.departmentId === user.departmentId || u.id === user.id
  );

  const filteredMembers = teamMembers.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMemberStats = (memberId: string) => {
    const assigned = tickets.filter(t => t.assignedTo === memberId);
    const open = assigned.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
    const resolved = assigned.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
    return { total: assigned.length, open: open.length, resolved: resolved.length };
  };

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return (
        <span className="flex items-center gap-1.5 text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-md text-xs font-semibold border border-violet-400/20">
          <ShieldCheck size={12} /> Department Admin
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-md text-xs font-semibold border border-white/10">
        <Shield size={12} /> Employee
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Team Management</h1>
          <p className="text-slate-400">
            Manage members of <span className="text-violet-400 font-medium">{dept?.name || 'your department'}</span>.
          </p>
        </div>
      </div>

      {/* Department Overview */}
      <div className="glass-card p-6 border-violet-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <BarChart2 size={22} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white mb-1">{dept?.name}</h2>
            <p className="text-sm text-slate-400 mb-4">{dept?.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1"><Users size={12}/> Team Size</div>
                <div className="text-2xl font-bold text-white">{teamMembers.length}</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1"><TicketIcon size={12}/> Active Tickets</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {tickets.filter(t => t.departmentId === user.departmentId && t.status !== 'CLOSED').length}
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1"><CheckCircle2 size={12}/> Resolved</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {tickets.filter(t => t.departmentId === user.departmentId && (t.status === 'RESOLVED' || t.status === 'CLOSED')).length}
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1"><Clock size={12}/> In Progress</div>
                <div className="text-2xl font-bold text-violet-400">
                  {tickets.filter(t => t.departmentId === user.departmentId && t.status === 'IN_PROGRESS').length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Member List */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-4">
          <h3 className="font-semibold text-white">Team Members</h3>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{teamMembers.length}</span>
          <div className="relative ml-auto max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No members found.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredMembers.map(member => {
              const stats = getMemberStats(member.id);
              const isMe = member.id === user.id;
              return (
                <div key={member.id} className="flex flex-col md:flex-row md:items-center gap-4 p-5 hover:bg-white/[0.02] transition-colors">
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="relative">
                      <img src={member.avatar} alt={member.name} className="w-11 h-11 rounded-full border border-white/10" />
                      {isMe && (
                        <span className="absolute -bottom-1 -right-1 bg-violet-500 text-white text-[9px] font-bold px-1 rounded">YOU</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{member.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Mail size={11} />
                        <span className="truncate">{member.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="hidden md:block">{getRoleBadge(member.role)}</div>

                  {/* Workload Stats */}
                  <div className="flex items-center gap-6 text-center">
                    <div>
                      <div className="text-lg font-bold text-white">{stats.total}</div>
                      <div className="text-xs text-slate-500">Assigned</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-cyan-400">{stats.open}</div>
                      <div className="text-xs text-slate-500">Active</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-emerald-400">{stats.resolved}</div>
                      <div className="text-xs text-slate-500">Resolved</div>
                    </div>
                  </div>

                  {/* Workload Bar */}
                  <div className="w-full md:w-32">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Workload</span>
                      <span>{stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-600 to-emerald-400 transition-all duration-500"
                        style={{ width: `${stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
