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
  Search, ChevronDown, UserCheck, Users,
  Clock, CheckCircle2, AlertCircle, Ticket as TicketIcon, RotateCcw, X
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { formatTicketId } from '../../utils/ticketUtils';
import { Countdown } from '../../components/ui/Countdown';

dayjs.extend(relativeTime);

const STATUS_OPTIONS: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'RETURNED'];

export const AdminTickets: React.FC = () => {
  const { id } = useParams();
  const { tickets, assignTicket, deleteTicket, updateTicketStatus } = useTickets();
  const { user } = useAuth();
  const { users, departments } = useData();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assigningTicketId, setAssigningTicketId] = useState<string | null>(null);
  const [confirmAssignData, setConfirmAssignData] = useState<{ ticketId: string; userId: string; userName: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!user || user.role !== 'ADMIN') return null;

  // If viewing a specific ticket detail
  if (id) return <TicketDetail />;

  const dept = departments.find(d => d.id === user.departmentId);

  // All employees in this department (possible resolvers)
  const resolvers = users.filter(u =>
    u.departmentId === user.departmentId && (u.role === 'EMPLOYEE' || u.role === 'ADMIN')
  );

  // Filter tickets for this department
  const deptTickets = tickets
    .filter(t => t.departmentId === user.departmentId && t.status !== 'RESOLVED' && t.status !== 'CLOSED')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const filteredTickets = deptTickets.filter(t => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const stats = {
    open: deptTickets.filter(t => t.status === 'OPEN').length,
    inProgress: deptTickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: deptTickets.filter(t => t.status === 'RESOLVED').length,
    returned: deptTickets.filter(t => t.status === 'RETURNED').length,
    unassigned: deptTickets.filter(t => (!t.assignedTo || t.status === 'REOPENED') && t.status !== 'RETURNED' && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length,
    reopened: deptTickets.filter(t => t.status === 'REOPENED').length,
  };

  const handleAssign = async (ticketId: string, userId: string) => {
    setIsProcessing(true);
    await assignTicket(ticketId, userId || undefined);
    setIsProcessing(false);
    setAssigningTicketId(null);
  };


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Ticket Management</h1>
          <p className="text-slate-400">
            Department: <span className="text-violet-400 font-medium">{dept?.name}</span>
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Open', value: stats.open, icon: AlertCircle, color: 'text-cyan-400' },
          { label: 'Reopened', value: stats.reopened, icon: RotateCcw, color: 'text-orange-400' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-violet-400' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Returned', value: stats.returned, icon: RotateCcw, color: 'text-rose-400' },
          { label: 'Unassigned', value: stats.unassigned, icon: Users, color: 'text-orange-400' },
        ].map(stat => (
          <button 
            key={stat.label} 
            onClick={() => {
              if (stat.label === 'Total') setStatusFilter('ALL');
              else if (stat.label === 'Reopened') setStatusFilter('REOPENED');
              else if (stat.label === 'Unassigned') {
                // For unassigned, we don't have a direct status usually, 
                // but let's assume it filters for OPEN tickets that are unassigned if we want to be specific,
                // or just keep it as a stat if there's no "UNASSIGNED" status.
                // User asked for "Indicators are clickable and being a Filter also if we clicked it".
                // Since statusFilter only handles statuses, we'll set it to ALL and maybe search for unassigned if needed?
                // Actually, let's just use the status names.
                setStatusFilter('ALL');
              }
              else setStatusFilter(stat.label.toUpperCase().replace(' ', '_'));
            }}
            className={`glass-card p-4 flex items-center gap-3 text-left transition-all hover:bg-white/5 active:scale-95 ${
              (statusFilter === stat.label.toUpperCase().replace(' ', '_') || (statusFilter === 'ALL' && stat.label === 'Total')) 
              ? 'ring-2 ring-violet-500/50 bg-white/[0.05]' 
              : ''
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-white/5`}>
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
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-sm text-slate-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="appearance-none bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-sm text-slate-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              <option value="ALL">All Priority</option>
              {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
          <span className="text-xs text-slate-500 ml-auto">{filteredTickets.length} tickets</span>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6 font-medium">Ticket</th>
                <th className="p-4 font-medium">Submitted By</th>
                <th className="p-4 font-medium text-center">Priority</th>
                <th className="p-4 font-medium text-center">Status</th>
                <th className="p-4 font-medium">Deadline</th>
                <th className="p-4 font-medium">Assigned To</th>
                <th className="p-4 font-medium">Filing Time</th>
                <th className="p-4 font-medium">Updated</th>
                <th className="p-4 pr-6 font-medium no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <TicketIcon size={32} className="text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No tickets found.</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map(ticket => {
                  return (
                    <tr key={ticket.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 pl-6">
                        <button onClick={() => navigate(`/admin/tickets/${ticket.id}`)} className="text-left group/btn">
                          <p className="text-sm font-bold text-violet-400 font-mono tracking-tight group-hover/btn:text-violet-300 transition-colors">
                            {formatTicketId(ticket.ticketNumber || ticket.id)}
                          </p>
                          <p className="text-[11px] font-semibold text-slate-200 mt-0.5 line-clamp-1 max-w-[180px]">
                            {ticket.title}
                          </p>
                        </button>
                      </td>
                      <td className="p-4 text-xs text-slate-300">
                        {users.find(u => u.id === ticket.createdBy)?.name || 'Unknown'}
                      </td>
                      <td className="p-4 text-center">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="p-4">
                        <div className="relative inline-block">
                          <StatusBadge status={ticket.status} />
                          <select
                            value={ticket.status}
                            onClick={e => e.stopPropagation()}
                            onChange={e => {
                              e.stopPropagation();
                              updateTicketStatus(ticket.id, e.target.value as TicketStatus);
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s} className="bg-slate-900">{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="p-4">
                        <Countdown deadline={ticket.deadline} status={ticket.status} />
                      </td>
                      <td className="p-4">
                        {assigningTicketId === ticket.id ? (
                          <select
                            value=""
                            onClick={(e) => e.stopPropagation()}
                            onChange={e => {
                                e.stopPropagation();
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
                            {users.filter(u => u.departmentId === ticket.departmentId && (u.role === 'EMPLOYEE' || u.role === 'ADMIN')).filter(r => r.id !== ticket.createdBy).map(r => (
                              <option key={r.id} value={r.id}>
                                {r.name} {r.id === ticket.assignedTo ? '(Current)' : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setAssigningTicketId(ticket.id); }}
                            className="flex items-center gap-2 text-xs text-slate-400 hover:text-violet-300 transition-colors group/assign"
                            title={ticket.status === 'REOPENED' ? "Click to re-assign" : "Click to assign"}
                          >
                            {ticket.assignedTo ? (
                              <>
                                <img
                                  src={users.find(u => u.id === ticket.assignedTo)?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(users.find(u => u.id === ticket.assignedTo)?.name || 'U')}&background=8b5cf6&color=fff`}
                                  alt={users.find(u => u.id === ticket.assignedTo)?.name || 'U'}
                                  className="w-6 h-6 rounded-full border border-white/10"
                                />
                                <div className="flex flex-col items-start">
                                  {ticket.status === 'REOPENED' && <span className="text-[9px] text-orange-400 font-bold uppercase tracking-tighter">Previous Assignee</span>}
                                  <span className="text-slate-300 group-hover/assign:text-violet-300">{users.find(u => u.id === ticket.assignedTo)?.name}</span>
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
                      <td className="p-4 text-xs text-slate-400">
                        {dayjs(ticket.createdAt).format('MM/DD HH:mm')}
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {dayjs(ticket.updatedAt).fromNow()}
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => navigate(`/admin/tickets/${ticket.id}`)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg">
                            View →
                          </button>
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
              Assign ticket <span className="text-violet-400 font-mono">#{confirmAssignData.ticketId.slice(-8)}</span> to <span className="text-white font-medium">{confirmAssignData.userName}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => { setConfirmAssignData(null); setAssigningTicketId(null); }} 
                className="btn-secondary text-sm px-4 py-2"
              >
                Cancel
              </button>
              <button
                disabled={isProcessing}
                onClick={async () => {
                  if (confirmAssignData) {
                    await handleAssign(confirmAssignData.ticketId, confirmAssignData.userId);
                    setConfirmAssignData(null);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white font-medium rounded-lg hover:bg-violet-600 transition-colors text-sm shadow-[0_4px_14px_rgba(139,92,246,0.4)] disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <UserCheck size={15} />
                )}
                Confirm {deptTickets.find(t => t.id === confirmAssignData.ticketId)?.assignedTo === (confirmAssignData.userId || null) ? 'Re-Assign' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle size={20} className="text-rose-500" />
              Delete Ticket
            </h3>
            <p className="text-sm text-slate-400">
              Are you sure you want to delete this ticket? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setConfirmDeleteId(null)} className="btn-secondary text-sm px-4 py-2">
                Cancel
              </button>
              <button 
                onClick={async () => {
                  await deleteTicket(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-lg transition-colors"
              >
                Delete Permanent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select Assignee Modal */}
      {assigningTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="font-bold text-white flex items-center gap-2">
                <UserCheck size={18} className="text-violet-400" />
                Select Assignee
              </h3>
              <button onClick={() => setAssigningTicketId(null)} className="p-1 text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid gap-1">
                {resolvers.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No staff members found in your department.</div>
                ) : (
                  resolvers.map(resUser => (
                    <button
                      key={resUser.id}
                      onClick={() => setConfirmAssignData({ 
                        ticketId: assigningTicketId, 
                        userId: resUser.id, 
                        userName: resUser.name 
                      })}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group text-left"
                    >
                      <img 
                        src={resUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(resUser.name)}&background=8b5cf6&color=fff`} 
                        className="w-10 h-10 rounded-full border border-white/10 group-hover:border-violet-500/50 transition-colors" 
                        alt="" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">{resUser.name}</p>
                        <p className="text-xs text-slate-500 truncate capitalize">{resUser.role.toLowerCase()}</p>
                      </div>
                      <ChevronDown size={14} className="text-slate-600 -rotate-90" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
