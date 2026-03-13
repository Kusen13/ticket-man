import React, { useState } from 'react';
import { useTickets } from '../../hooks/useTickets';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Countdown } from '../../components/ui/Countdown';
import {
  CheckCheck, RotateCcw, Inbox, PlayCircle,
  X, AlertCircle, Clock, ChevronRight
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { formatTicketId } from '../../utils/ticketUtils';

dayjs.extend(relativeTime);

export const AssignedTickets: React.FC = () => {
  const { user } = useAuth();
  const { tickets, acceptTicket, returnTicket, updateTicketStatus } = useTickets();
  const { departments } = useData();

  const [returningId, setReturningId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnError, setReturnError] = useState('');
  const [confirmDoneId, setConfirmDoneId] = useState<string | null>(null);

  if (!user) return null;

  // Tickets currently assigned to me (OPEN or IN_PROGRESS)
  const assignedToMe = tickets
    .filter(t => t.assignedTo === user.id && (t.status === 'OPEN' || t.status === 'IN_PROGRESS'))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const dept = departments.find(d => d.id === user.departmentId);

  const handleAccept = (ticketId: string) => {
    acceptTicket(ticketId);
  };

  const handleMarkDone = (ticketId: string) => {
    updateTicketStatus(ticketId, 'RESOLVED');
    setConfirmDoneId(null);
  };

  const handleReturn = () => {
    if (!returningId) return;
    if (!returnReason.trim()) {
      setReturnError('Please provide a reason before returning the ticket.');
      return;
    }
    returnTicket(returningId, returnReason.trim(), user.id, user.name);
    setReturningId(null);
    setReturnReason('');
    setReturnError('');
  };

  const openReturnModal = (ticketId: string) => {
    setReturningId(ticketId);
    setReturnReason('');
    setReturnError('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">My Assigned Tickets</h1>
        <p className="text-slate-400">
          Tickets that have been assigned to you{user.role === 'EMPLOYEE' ? ` by the ${dept?.name || 'department'} admin` : ''}.
        </p>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5">
            <Inbox size={18} className="text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{assignedToMe.length}</div>
            <div className="text-xs text-slate-500">Active Assignments</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5">
            <Clock size={18} className="text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">
              {assignedToMe.filter(t => t.status === 'OPEN').length}
            </div>
            <div className="text-xs text-slate-500">Awaiting Acceptance</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5">
            <PlayCircle size={18} className="text-violet-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-violet-400">
              {assignedToMe.filter(t => t.status === 'IN_PROGRESS').length}
            </div>
            <div className="text-xs text-slate-500">In Progress</div>
          </div>
        </div>
      </div>

      {/* Ticket Cards */}
      {assignedToMe.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <CheckCheck size={48} className="text-emerald-400/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">No Active Assignments</h3>
          <p className="text-sm text-slate-600">You have no tickets assigned to you right now. Check back later!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignedToMe.map(ticket => {
            const deptName = departments.find(d => d.id === ticket.departmentId)?.name;
            const isPending = ticket.status === 'OPEN';
            const isInProgress = ticket.status === 'IN_PROGRESS';

            return (
          <div key={ticket.id} className={`glass-card p-5 border transition-all duration-300 ${ticket.status === 'OPEN' || ticket.status === 'REOPENED' ? 'border-amber-500/20 shadow-[0_0_20px_rgba(251,191,36,0.05)] bg-amber-500/[0.02]' : 'border-violet-500/15 group-hover:border-violet-500/30'}`}>
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Left — ticket info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-mono font-bold text-violet-400">{formatTicketId(ticket.ticketNumber || ticket.id)}</span>
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                      <Countdown 
                        deadline={ticket.deadline} 
                        status={ticket.status} 
                        createdAt={ticket.createdAt} 
                        updatedAt={ticket.updatedAt} 
                      />
                      {(ticket.status === 'OPEN' || ticket.status === 'REOPENED') && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-tight animate-pulse">
                          <AlertCircle size={11} /> {ticket.status === 'REOPENED' ? 'Re-opened: Accept Again' : 'Awaiting acceptance'}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1 line-clamp-2">{ticket.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-2">{ticket.description}</p>
                    
                    {ticket.status === 'REOPENED' && (
                      <div className="mb-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/10 relative overflow-hidden group/reopen">
                        <div className="absolute left-0 top-0 w-1 h-full bg-orange-500/40" />
                        <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                          <RotateCcw size={10} /> Re-open Reason
                        </p>
                        <p className="text-xs text-slate-300 italic leading-relaxed">"{ticket.reopenReason}"</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium">
                      <span className="text-slate-400">Department: <span className="text-slate-300 capitalize">{deptName}</span></span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock size={11} /> Updated {dayjs(ticket.updatedAt).fromNow()}</span>
                    </div>
                  </div>

                  {/* Right — actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {(ticket.status === 'OPEN' || ticket.status === 'REOPENED') && (
                      <button
                        onClick={() => handleAccept(ticket.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors text-sm shadow-[0_4px_14px_rgba(52,211,153,0.35)]"
                      >
                        <PlayCircle size={16} /> {ticket.status === 'REOPENED' ? 'Accept Again' : 'Accept Ticket'}
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        onClick={() => setConfirmDoneId(ticket.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white font-semibold rounded-lg hover:bg-violet-600 transition-colors text-sm shadow-[0_4px_14px_rgba(139,92,246,0.35)]"
                      >
                        <CheckCheck size={16} /> Mark as Done
                      </button>
                    )}

                    <button
                      onClick={() => openReturnModal(ticket.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 rounded-lg transition-colors text-sm"
                    >
                      <RotateCcw size={15} /> Return to Queue
                    </button>
                  </div>
                </div>

                {/* Instruction hint for pending */}
                {isPending && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <ChevronRight size={12} className="text-amber-400" />
                      Click <span className="text-emerald-400 font-medium">Accept Ticket</span> to start working on it, or <span className="text-rose-400 font-medium">Return to Queue</span> if you cannot handle it.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Return Modal */}
      {returningId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">Return Ticket to Queue</h3>
                <p className="text-xs text-slate-500 mt-0.5">Please explain why you cannot handle this ticket.</p>
              </div>
              <button
                onClick={() => { setReturningId(null); setReturnError(''); }}
                className="p-1.5 text-slate-500 hover:text-white rounded-md hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-300 flex items-center gap-1.5">
                <AlertCircle size={13} /> Once returned, this ticket will be unassigned and the admin will be notified to re-assign it.
              </p>
            </div>

            <div className="space-y-1.5 mb-5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reason for returning *</label>
              <textarea
                value={returnReason}
                onChange={e => { setReturnReason(e.target.value); setReturnError(''); }}
                placeholder="e.g. I don't have access to the affected system, or this requires Level 2 support skills..."
                rows={4}
                className="input-field resize-none"
              />
              {returnError && (
                <p className="text-xs text-rose-400 flex items-center gap-1.5 mt-1">
                  <AlertCircle size={12} /> {returnError}
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setReturningId(null); setReturnError(''); }}
                className="btn-secondary text-sm px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleReturn}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white font-medium rounded-lg hover:bg-rose-600 transition-colors text-sm shadow-[0_4px_14px_rgba(239,68,68,0.4)]"
              >
                <RotateCcw size={15} /> Return Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Done Confirmation */}
      {confirmDoneId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-sm p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-2">Mark as Resolved?</h3>
            <p className="text-sm text-slate-400 mb-5">
              This will mark the ticket as <span className="text-emerald-400 font-medium">RESOLVED</span>. The employee who submitted it can still re-open it if the issue persists.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDoneId(null)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <button
                onClick={() => handleMarkDone(confirmDoneId)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors text-sm shadow-[0_4px_14px_rgba(52,211,153,0.4)]"
              >
                <CheckCheck size={15} /> Yes, Mark as Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
