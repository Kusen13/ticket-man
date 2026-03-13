import React from 'react';
import { Ticket } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { PriorityBadge } from '../ui/PriorityBadge';
import { ArrowRight, History, User as UserIcon, Bot, Trash2 } from 'lucide-react';
import { useData } from '../../hooks/useData';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import { formatTicketId } from '../../utils/ticketUtils';
import { Countdown } from '../ui/Countdown';

dayjs.extend(relativeTime);
dayjs.extend(duration);

interface TicketListProps {
  tickets: Ticket[];
  onTicketClick: (id: string) => void;
  onDeleteTicket?: (id: string) => void;
  title?: string;
  hideDeadline?: boolean;
}

export const TicketList: React.FC<TicketListProps> = ({ tickets, onTicketClick, onDeleteTicket, title, hideDeadline }) => {
  const { departments } = useData();


  return (
    <div className="glass-card overflow-hidden">
      {title && (
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between no-print bg-white/[0.02]">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h2>
          <span className="text-[10px] sm:text-xs text-slate-400 font-bold bg-slate-800/80 px-3 py-1 rounded-full border border-white/5">
            {tickets.length} total
          </span>
        </div>
      )}
      
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <th className="p-4 pl-6 font-semibold">Ticket / Category</th>
              <th className="p-4 font-semibold">Submitted By</th>
              <th className="p-4 font-semibold text-center">Status</th>
              <th className="p-4 font-semibold text-center">Priority</th>
              <th className="p-4 font-semibold">Assigned To</th>
              {!hideDeadline && <th className="p-4 font-semibold">Deadline</th>}
              <th className="p-4 font-semibold text-center">Filing / Res</th>
              <th className="p-4 font-semibold no-print">Updated</th>
              <th className="p-4 pr-6 text-right no-print">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={hideDeadline ? 8 : 9} className="p-12 text-center text-slate-500">
                   <div className="flex flex-col items-center gap-3">
                     <History size={32} className="text-slate-800" />
                     <p className="text-sm font-medium">No records found matching your current filters.</p>
                   </div>
                </td>
              </tr>
            ) : (
              tickets.map((t) => {
                const { getUserById, getCategoryById } = useData();
                const submitter = getUserById(t.createdBy);
                const category = t.categoryId ? getCategoryById(t.categoryId) : null;
                const assignee = t.assignedTo ? getUserById(t.assignedTo) : null;

                return (
                  <tr 
                    key={t.id} 
                    onClick={() => onTicketClick(t.id)}
                    className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-violet-400 font-mono tracking-tight group-hover:text-violet-300 transition-colors">
                          {formatTicketId(t.ticketNumber || t.id)}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-semibold text-slate-200">
                            {category ? category.name : (t.customCategory || 'Uncategorized')}
                          </span>
                          {!category && t.customCategory && <Bot size={10} className="text-violet-400/70" />}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium truncate max-w-[180px] leading-tight">
                          {t.title}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3 text-xs text-slate-300">
                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                           {submitter?.avatar ? (
                             <img src={submitter.avatar} className="w-full h-full object-cover" alt="" />
                           ) : (
                             <UserIcon size={14} className="text-slate-500" />
                           )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-200 truncate">{submitter?.name || 'Unknown'}</span>
                          <span className="text-[10px] text-slate-500 truncate">
                            {submitter?.departmentId ? (departments.find(d => d.id === submitter.departmentId)?.name || 'N/A') : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center"><StatusBadge status={t.status} size="sm" /></td>
                    <td className="p-4 text-center"><PriorityBadge priority={t.priority} /></td>
                    <td className="p-4">
                      {assignee ? (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <img src={assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee.name)}&background=8b5cf6&color=fff`} className="w-5 h-5 rounded-full border border-white/10" alt="" />
                          <span className="truncate max-w-[100px]">{assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">Unassigned</span>
                      )}
                    </td>
                    {!hideDeadline && (
                      <td className="p-4">
                        <Countdown deadline={t.deadline} status={t.status} size="sm" createdAt={t.createdAt} updatedAt={t.updatedAt} />
                      </td>
                    )}
                    <td className="p-4 text-center">
                      <div className="flex flex-col text-[10px]">
                        <span className="text-cyan-400 font-bold">{dayjs(t.createdAt).format('MM/DD HH:mm')}</span>
                        { (t.status === 'RESOLVED' || t.status === 'CLOSED') && (
                          <span className="text-emerald-400 font-bold mt-0.5 border-t border-white/5 pt-0.5">
                            {dayjs(t.updatedAt).format('MM/DD HH:mm')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                      {dayjs(t.updatedAt).fromNow()}
                    </td>
                    <td className="p-4 pr-6 text-right no-print">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        {onDeleteTicket && (
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this ticket?')) onDeleteTicket(t.id);
                            }}
                            className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        <ArrowRight size={16} className="text-slate-600 group-hover:text-violet-400 transition-transform group-hover:translate-x-1" />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-white/5">
        {tickets.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No records found.</div>
        ) : (
          tickets.map((t) => {
            const { getUserById, getCategoryById } = useData();
            const category = t.categoryId ? getCategoryById(t.categoryId) : null;
            const submitter = getUserById(t.createdBy);

            return (
              <div 
                key={t.id} 
                onClick={() => onTicketClick(t.id)}
                className="p-4 active:bg-white/5 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm font-bold text-violet-400 font-mono tracking-tight">{formatTicketId(t.ticketNumber || t.id)}</span>
                    <h3 className="text-sm font-semibold text-slate-200 mt-0.5 line-clamp-1">{t.title}</h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {category?.name || t.customCategory || 'General'} • {dayjs(t.createdAt).fromNow()}
                    </p>
                  </div>
                  <PriorityBadge priority={t.priority} />
                </div>

                <div className="flex items-center justify-between py-2 border-y border-white/5">
                   <StatusBadge status={t.status} size="sm" />
                   {!hideDeadline && (
                     <Countdown deadline={t.deadline} status={t.status} size="sm" createdAt={t.createdAt} updatedAt={t.updatedAt} />
                   )}
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden">
                      {submitter?.avatar ? <img src={submitter.avatar} className="w-full h-full object-cover" /> : <UserIcon size={10} />}
                    </div>
                    <span className="truncate max-w-[120px]">{submitter?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Updated {dayjs(t.updatedAt).format('MMM D')}</span>
                    <ArrowRight size={14} className="text-violet-500" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
