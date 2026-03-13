import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTickets } from '../../hooks/useTickets';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { TicketDetail } from '../../components/tickets/TicketDetail';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { TicketStatus } from '../../types';
import {
  Search, ChevronDown, UserCheck, History,
  Clock, AlertCircle, Ticket as TicketIcon, Globe, RotateCcw, Trash2
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { formatTicketId } from '../../utils/ticketUtils';
import { Countdown } from '../../components/ui/Countdown';

dayjs.extend(relativeTime);

const STATUS_OPTIONS: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'RETURNED'];

export const SuperAdminTickets: React.FC = () => {
  const { id } = useParams();
  const { tickets, updateTicketStatus, assignTicket, deleteTicket } = useTickets();
  const { user } = useAuth();
  const { users, departments } = useData();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [assigningTicketId, setAssigningTicketId] = useState<string | null>(null);
  const [confirmAssignData, setConfirmAssignData] = useState<{ ticketId: string; userId: string; userName: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  if (id) return <TicketDetail />;

  const sortedTickets = [...tickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const filteredTickets = sortedTickets.filter(t => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchDept = deptFilter === 'ALL' || t.departmentId === deptFilter;
    const isLive = t.status !== 'RESOLVED' && t.status !== 'CLOSED';
    return matchSearch && matchStatus && matchPriority && matchDept && isLive;
  });

  // Stats should reflect the department filter and only active (not resolved/closed) tickets
  const statsTickets = (deptFilter === 'ALL' ? tickets : tickets.filter(t => t.departmentId === deptFilter))
    .filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED');

  const stats = {
    open: statsTickets.filter(t => t.status === 'OPEN').length,
    inProgress: statsTickets.filter(t => t.status === 'IN_PROGRESS').length,
    returned: statsTickets.filter(t => t.status === 'RETURNED').length,
    reopened: statsTickets.filter(t => t.status === 'REOPENED').length,
    total: statsTickets.length,
  };

  const handleAssign = (ticketId: string, userId: string) => {
    assignTicket(ticketId, userId || undefined);
    setAssigningTicketId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Global Tickets</h1>
          <p className="text-slate-400">All tickets across every department in the system.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
          <Globe size={13} /> System-wide view
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: TicketIcon, color: 'text-white' },
          { label: 'Open', value: stats.open, icon: AlertCircle, color: 'text-cyan-400' },
          { label: 'Reopened', value: stats.reopened, icon: RotateCcw, color: 'text-orange-400' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-violet-400' },
          { label: 'Returned', value: stats.returned, icon: RotateCcw, color: 'text-rose-400' },
        ].map(stat => (
          <button 
            key={stat.label} 
            onClick={() => {
              if (stat.label === 'Total') setStatusFilter('ALL');
              else if (stat.label === 'Reopened') setStatusFilter('REOPENED');
              else setStatusFilter(stat.label.toUpperCase().replace(' ', '_'));
            }}
            className={`glass-card p-4 flex items-center gap-3 text-left transition-all hover:bg-white/5 active:scale-95 ${
              (statusFilter === stat.label.toUpperCase().replace(' ', '_') || (statusFilter === 'ALL' && stat.label === 'Total')) 
              ? 'ring-2 ring-violet-500/50 bg-white/[0.05]' 
              : ''
            }`}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5">
              <stat.icon size={18} className={stat.color} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-white/5 flex flex-wrap gap-3 items-center">
          <div className="relative w-full sm:flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-sm text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
          <div className="relative w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-sm text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
          <div className="relative w-full sm:w-auto">
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-sm text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Priority</option>
              {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
          <span className="text-xs text-slate-500 w-full sm:w-auto sm:ml-auto text-left sm:text-right">{filteredTickets.length} of {tickets.length} tickets</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6 font-medium">Ticket</th>
                <th className="p-4 font-medium">Submitted By</th>
                <th className="p-4 font-medium text-center">Priority</th>
                <th className="p-4 font-medium text-center">Status</th>
                <th className="p-4 font-medium">Deadline</th>
                <th className="p-4 font-medium">Assigned To</th>
                <th className="p-4 font-medium">Filing Time</th>
                <th className="p-4 font-medium">Resolution Time</th>
                <th className="p-4 font-medium">Updated</th>
                <th className="p-4 pr-6 font-medium no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center">
                    <TicketIcon size={32} className="text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No tickets match the filters.</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map(ticket => {
                  const assignedUser = users.find(u => u.id === ticket.assignedTo);
                  // Resolvers from this ticket's department
                  const deptResolvers = users.filter(u =>
                    u.departmentId === ticket.departmentId &&
                    (u.role === 'EMPLOYEE' || u.role === 'ADMIN')
                  );
                  const isAssigning = assigningTicketId === ticket.id;

                  return (
                    <tr key={ticket.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 pl-6">
                        <button
                          onClick={() => navigate(`/super_admin/tickets/${ticket.id}`)}
                          className="text-left group/btn"
                        >
                          <p className="text-sm font-bold text-violet-400 font-mono tracking-tight group-hover/btn:text-violet-300 transition-colors">
                            {formatTicketId(ticket.ticketNumber || ticket.id)}
                          </p>
                          <p className="text-[11px] font-semibold text-slate-200 mt-0.5 line-clamp-1 max-w-[180px]">
                            {ticket.title}
                          </p>
                          {ticket.status === 'RETURNED' && (
                            <div className="mt-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 animate-pulse">
                              <p className="font-bold flex items-center gap-1 uppercase mb-0.5">
                                <RotateCcw size={10} /> Returned by Resolver
                              </p>
                              <p className="italic line-clamp-2">"{ticket.returnReason}"</p>
                            </div>
                          )}
                          {ticket.status === 'REOPENED' && (
                            <div className="mt-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-400 animate-pulse">
                              <p className="font-bold flex items-center gap-1 uppercase mb-0.5">
                                <RotateCcw size={10} /> Ticket Re-opened
                              </p>
                              <p className="italic line-clamp-2">"{ticket.reopenReason}"</p>
                            </div>
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-300">
                              {users.find(u => u.id === ticket.createdBy)?.name || 'Unknown'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {(() => {
                                const submitter = users.find(u => u.id === ticket.createdBy);
                                return submitter?.departmentId ? (departments.find(d => d.id === submitter.departmentId)?.name || 'N/A') : 'N/A';
                              })()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="p-4">
                        <div className="relative inline-block">
                          <StatusBadge status={ticket.status} />
                          <select
                            value={ticket.status}
                            onChange={e => updateTicketStatus(ticket.id, e.target.value as TicketStatus)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s} className="bg-slate-900">{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="p-4">
                        <Countdown 
                          deadline={ticket.deadline} 
                          status={ticket.status} 
                          createdAt={ticket.createdAt} 
                          updatedAt={ticket.updatedAt} 
                        />
                      </td>
                      <td className="p-4">
                        {isAssigning ? (
                          <select
                            value=""
                            onChange={e => {
                                const val = e.target.value;
                                if (!val) {
                                  setAssigningTicketId(null);
                                  return;
                                }
                                const selectedUserId = val === 'unassign' ? '' : val;
                                const uName = selectedUserId ? users.find(u => u.id === selectedUserId)?.name || 'Unknown' : 'Unassigned';
                                setConfirmAssignData({ ticketId: ticket.id, userId: selectedUserId, userName: uName });
                            }}
                            autoFocus
                            onBlur={(e) => {
                                if (!e.relatedTarget) setTimeout(() => setAssigningTicketId(null), 200);
                            }}
                            className="appearance-none bg-slate-900 border border-violet-500/40 rounded-lg py-1.5 pl-2 pr-7 text-sm text-white focus:outline-none focus:border-violet-500"
                          >
                            <option value="">Select Resolver...</option>
                            <option value="unassign">Unassigned</option>
                            {deptResolvers.filter(r => r.id !== ticket.createdBy).map(r => (
                              <option key={r.id} value={r.id}>
                                {r.name} {r.id === ticket.assignedTo ? '(Current)' : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={() => setAssigningTicketId(ticket.id)}
                            className="flex items-center gap-2 text-xs text-slate-400 hover:text-violet-300 transition-colors group/assign"
                            title={ticket.status === 'REOPENED' ? "Click to re-assign" : "Click to assign"}
                          >
                            {assignedUser ? (
                              <>
                                <img
                                  src={assignedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignedUser.name)}&background=8b5cf6&color=fff`}
                                  alt={assignedUser.name}
                                  className="w-6 h-6 rounded-full border border-white/10"
                                />
                                <div className="flex flex-col items-start">
                                  {ticket.status === 'REOPENED' && <span className="text-[9px] text-orange-400 font-bold uppercase tracking-tighter">Previous Assignee</span>}
                                  <span className="text-slate-300 group-hover/assign:text-violet-300">{assignedUser.name}</span>
                                  {ticket.status === 'REOPENED' && <span className="text-[10px] text-violet-400 underline font-semibold">Re-Assign →</span>}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-6 h-6 rounded-full border border-dashed border-slate-600 flex items-center justify-center">
                                  <UserCheck size={12} className="text-slate-600 group-hover/assign:text-violet-400" />
                                </div>
                                <span className="text-slate-600 group-hover/assign:text-violet-400">
                                  {ticket.status === 'REOPENED' ? 'Re-Assign' : 'Assign'}
                                </span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                      {/* Filing Time */}
                      <td className="p-4 text-xs">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <History size={11} className="text-slate-500" />
                            <span>{dayjs(ticket.createdAt).format('MM-DD-YY')}</span>
                          </div>
                          <div className="text-cyan-400 font-bold pl-4">
                            {dayjs(ticket.createdAt).format('HH:mm')}
                          </div>
                        </div>
                      </td>

                      {/* Resolution Time */}
                      <td className="p-4 text-xs">
                        {ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <History size={11} className="text-slate-500" />
                              <span>{dayjs(ticket.updatedAt).format('MM-DD-YY')}</span>
                            </div>
                            <div className="text-emerald-400 font-bold pl-4">
                              {dayjs(ticket.updatedAt).format('HH:mm')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">Pending...</span>
                        )}
                      </td>

                      <td className="p-4 text-xs text-slate-500">
                        {dayjs(ticket.updatedAt).fromNow()}
                      </td>
                      {/* Actions: View + Delete */}
                      <td className="p-4 pr-6 no-print">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/super_admin/tickets/${ticket.id}`)}
                            className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-slate-300 hover:text-white transition-colors"
                          >
                            View →
                          </button>
                          {confirmDeleteId === ticket.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { deleteTicket(ticket.id); setConfirmDeleteId(null); }}
                                className="text-xs px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-md text-rose-400 hover:text-rose-300 transition-colors font-medium"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-slate-400 hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(ticket.id)}
                              className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                              title="Delete ticket"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Assignment */}
      {confirmAssignData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-sm p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-2">Confirm Assignment</h3>
            <p className="text-sm text-slate-400 mb-5 text-balance">
              Are you sure you want to {tickets.find(t => t.id === confirmAssignData.ticketId)?.assignedTo === (confirmAssignData.userId || null) ? 're-assign' : 'assign'} ticket <span className="text-violet-400 font-mono">#{confirmAssignData.ticketId.slice(-8)}</span> to <span className="text-white font-medium">{confirmAssignData.userName}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => { setConfirmAssignData(null); setAssigningTicketId(null); }} 
                className="btn-secondary text-sm px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleAssign(confirmAssignData.ticketId, confirmAssignData.userId);
                  setConfirmAssignData(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white font-medium rounded-lg hover:bg-violet-600 transition-colors text-sm shadow-[0_4px_14px_rgba(139,92,246,0.4)]"
              >
                <UserCheck size={15} /> Confirm {tickets.find(t => t.id === confirmAssignData.ticketId)?.assignedTo === (confirmAssignData.userId || null) ? 'Re-Assign' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
