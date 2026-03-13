import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTickets } from '../../hooks/useTickets';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { StatusBadge } from '../ui/StatusBadge';
import { PriorityBadge } from '../ui/PriorityBadge';
import { ArrowLeft, Clock, Send, RotateCcw, AlertCircle, ListTree, Download, FileText, Building2, Bot, User as UserIcon, Maximize2, AtSign, Check, CheckCheck, UserCheck } from 'lucide-react';
import { formatTicketId } from '../../utils/ticketUtils';
import { User } from '../../types';
import dayjs from 'dayjs';
import { Countdown } from '../ui/Countdown';

export const TicketDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tickets, updateTicketStatus, comments, addComment, markCommentsSeen } = useTickets();
  const { user } = useAuth();
  const { departments, getCategoryById, getUserById, users, addNotification } = useData();

  const [commentText, setCommentText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<User[]>([]);
  const [reopenReason, setReopenReason] = useState('');
  const [isReopening, setIsReopening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const handleFsChange = () => {
      if (document.fullscreenElement === null) {
        setLightboxSrc(null);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const openLightbox = (src: string) => {
    setLightboxSrc(src);
    setTimeout(() => {
      if (lightboxRef.current && !document.fullscreenElement) {
        lightboxRef.current.requestFullscreen().catch(() => {});
      }
    }, 50);
  };


  const ticket = tickets.find(t => t.id === id);
  const dept = ticket ? departments.find(d => d.id === ticket.departmentId) : null;
  const category = ticket?.categoryId ? getCategoryById(ticket.categoryId) : null;

  if (!ticket) {
    return (
      <div className="glass-card p-10 text-center">
        <h2 className="text-xl text-white mb-2">Ticket Not Found</h2>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Go Back</button>
      </div>
    );
  }

  // Mark comments as seen on mount and when new comments arrive
  useEffect(() => {
    if (user && ticket) {
      markCommentsSeen(ticket.id, user.id);
    }
  }, [ticket?.id, user?.id, comments]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCommentText(val);

    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = val.substring(0, cursorPosition);
    const words = textBeforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
      setShowMentions(true);
      setMentionFilter(lastWord.substring(1));
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (selectedUser: User) => {
    if (!mentionedUsers.find(u => u.id === selectedUser.id)) {
      setMentionedUsers([...mentionedUsers, selectedUser]);
    }
    const words = commentText.split(/\s/);
    words.pop(); // Remove the partial @mention
    const newText = words.join(' ') + (words.length > 0 ? ' ' : '') + `@${selectedUser.name} `;
    setCommentText(newText);
    setShowMentions(false);
    commentInputRef.current?.focus();
  };

  const renderCommentText = (text: string) => {
    // Regex looking for @Name Patterns
    const parts = text.split(/(@\w+(?:\s\w+)?)/g);
    return parts.map((part, i) => {
      // Find a user match exactly by name to highlight
      const userMatch = users.find(u => `@${u.name}` === part.trim());
      if (userMatch) {
        return <span key={i} className="text-violet-400 font-semibold bg-violet-500/10 px-1 rounded">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user || isProcessing) return;
    
    try {
      setIsProcessing(true);
      // Find all users actually mentioned in the text
      const actualMentions = mentionedUsers.filter(u => commentText.includes(`@${u.name}`)).map(u => u.id);
      
      await addComment(ticket.id, user.id, commentText, actualMentions);

      // Trigger notifications for mentioned users
      actualMentions.forEach(mentionId => {
        addNotification(
          mentionId,
          'You were mentioned',
          `${user.name} mentioned you in ticket ${formatTicketId(ticket.ticketNumber || ticket.id)}`,
          'MENTION',
          `/${users.find(u=>u.id === mentionId)?.role.toLowerCase()}/tickets/${ticket.id}`
        );
      });

      setCommentText('');
      setMentionedUsers([]);
      setShowMentions(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason || isProcessing) return;
    try {
      setIsProcessing(true);
      await updateTicketStatus(ticket.id, 'REOPENED', reopenReason);
      setIsReopening(false);
      setReopenReason('');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {lightboxSrc && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center animate-fade-in cursor-zoom-out"
          onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen();
            setLightboxSrc(null);
          }}
        >
          <img
            src={lightboxSrc}
            alt="Fullscreen View"
            className="max-w-full max-h-full object-contain shadow-2xl"
          />
          {/* Subtle exit hint */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-[10px] uppercase tracking-widest font-medium pointer-events-none">
            Press Esc or click to exit
          </div>
        </div>
      )}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Back to Tickets
      </button>

      {/* Main Ticket Card */}
      <div className="glass-card p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-sm sm:text-lg font-bold text-violet-400 font-mono tracking-widest bg-violet-500/5 px-2.5 py-1 rounded border border-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                  {formatTicketId(ticket.ticketNumber || ticket.id)}
                </span>
                <StatusBadge status={ticket.status} size="sm" />
                <PriorityBadge priority={ticket.priority} />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
                {ticket.title}
              </h1>
              <div className="flex items-center gap-2 lg:hidden">
                <Countdown 
                  deadline={ticket.deadline} 
                  status={ticket.status} 
                  createdAt={ticket.createdAt} 
                  updatedAt={ticket.updatedAt} 
                  size="sm"
                />
              </div>
            </div>
          
          <div className="text-left md:text-right text-xs sm:text-sm text-slate-400 space-y-2 md:space-y-1 bg-white/[0.02] md:bg-transparent p-4 md:p-0 rounded-xl border border-white/5 md:border-none">
            <p className="flex items-center gap-2 md:justify-end">
              <Building2 size={14} className="text-slate-500" />
              <span className="md:hidden font-medium text-slate-500">Dept:</span>
              <span className="text-slate-200">{dept?.name}</span>
            </p>
            <p className="flex items-center gap-2 md:justify-end">
              <ListTree size={14} className="text-slate-500" />
              <span className="md:hidden font-medium text-slate-500">Category:</span>
              <span className="text-slate-200">
                {category ? category.name : (ticket.customCategory || 'General')}
              </span>
              {!category && ticket.customCategory && <Bot size={12} className="text-violet-400" />}
            </p>
            <p className="flex items-center gap-2 md:justify-end">
              <UserIcon size={14} className="text-slate-500" />
              <span className="md:hidden font-medium text-slate-500">By:</span>
              <span className="text-slate-200">{getUserById(ticket.createdBy)?.name || 'System'}</span>
            </p>
            <div className="hidden md:block">
              <p className="flex items-center gap-2 justify-end">
                <UserIcon size={14} className="text-slate-500" />
                Assigned To: <span className="text-slate-200">{ticket.assignedTo ? getUserById(ticket.assignedTo)?.name : 'Unassigned'}</span>
              </p>
              <p className="flex items-center gap-1.5 justify-end mt-2 text-xs text-slate-400">
                <Clock size={14} /> Created: {dayjs(ticket.createdAt).format('MMM D, YYYY h:mm A')}
              </p>
              <p className="flex items-center gap-1.5 justify-end text-[10px] text-slate-500">
                <Clock size={12} /> Last Update: {dayjs(ticket.updatedAt).format('MMM D, YYYY h:mm A')}
              </p>
            </div>
            <div className="md:hidden pt-2 border-t border-white/5 mt-2 space-y-1">
               <p className="flex items-center gap-2">
                 <UserCheck size={14} className="text-slate-500" />
                 <span className="font-medium text-slate-500">Assigned:</span>
                 <span className="text-slate-200">{ticket.assignedTo ? getUserById(ticket.assignedTo)?.name : 'Unassigned'}</span>
               </p>
               <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-2">
                 <Clock size={12} /> Filed {dayjs(ticket.createdAt).format('MMM D, h:mm A')}
               </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="prose prose-invert max-w-none bg-slate-900/40 p-5 rounded-xl border border-white/5 text-slate-300">
            <p className="whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          </div>

          {/* Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Download size={12} /> Attachments ({ticket.attachments.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {ticket.attachments.map((file) => (
                  <div key={file.id} className="group rounded-xl overflow-hidden border border-white/10 bg-slate-900/60 hover:border-violet-500/30 transition-all duration-200">
                    {file.type.startsWith('image/') ? (
                      // Image: tall thumbnail with centered fullscreen button
                      <div className="relative cursor-pointer" onClick={() => openLightbox(file.url)}>
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Dark overlay + centered Fullscreen icon on hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-90 group-hover:scale-100">
                            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-3 shadow-xl">
                              <Maximize2 size={22} className="text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Non-image: icon placeholder
                      <div className="flex flex-col items-center justify-center h-44 gap-2 text-slate-500">
                        <FileText size={32} className="text-violet-400" />
                        <span className="text-[10px] text-slate-500 text-center px-3 break-all line-clamp-2">{file.name}</span>
                      </div>
                    )}
                    {/* Footer: filename + download */}
                    <div className="px-3 py-2.5 flex items-center justify-between gap-2 border-t border-white/5">
                      <span className="text-[11px] text-slate-400 truncate flex-1 font-medium">{file.name}</span>
                      <a
                        href={file.url}
                        download={file.name}
                        onClick={e => e.stopPropagation()}
                        className="shrink-0 p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download size={13} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reopen Action (Only if resolved and not yet reopened too many times) */}
        {ticket.status === 'RESOLVED' && ticket.reopenCount < (useData().config.maxReopenCount) && user?.role === 'EMPLOYEE' && (
          <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
            {!isReopening ? (
              <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-xl flex items-center justify-between shadow-[0_0_15px_rgba(251,146,60,0.1)]">
                <div>
                  <h4 className="text-sm font-semibold text-orange-400 mb-1 flex items-center gap-2">
                    <AlertCircle size={16} /> Is the issue still occurring?
                  </h4>
                  <p className="text-xs text-slate-400">You can re-open this ticket if the resolution provided did not fix your problem.</p>
                  <p className="text-[10px] text-orange-400/70 font-bold uppercase tracking-wider mt-2 bg-orange-500/5 w-fit px-2 py-0.5 rounded border border-orange-500/10">
                    {useData().config.maxReopenCount - ticket.reopenCount} re-opens remaining
                  </p>
                </div>
                <button 
                  onClick={() => setIsReopening(true)}
                  className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm font-semibold hover:bg-orange-500/30 transition-colors flex items-center gap-2"
                >
                  <RotateCcw size={16} /> Re-open Ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleReopen} className="bg-slate-900/50 p-5 rounded-xl border border-orange-500/30 animate-slide-up">
                <h4 className="text-sm font-semibold text-orange-400 mb-3">Reason for Re-opening</h4>
                <textarea
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="input-field mb-3 focus:border-orange-500/50 focus:ring-orange-500/50"
                  rows={3}
                  placeholder="Please explain why the issue is not resolved..."
                  required
                />
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setIsReopening(false)} className="btn-secondary text-sm px-4 py-2" disabled={isProcessing}>Cancel</button>
                  <button type="submit" disabled={isProcessing} className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-[0_4px_14px_rgba(249,115,22,0.4)] text-sm flex items-center gap-2">
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <RotateCcw size={16} />
                    )}
                    Submit Re-open
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Discussion Thread */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Discussion Thread</h3>

        <div className="space-y-6 mb-8">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 text-xs font-bold">
              SYS
            </div>
            <div className="flex-1 bg-slate-900/60 rounded-xl rounded-tl-none p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-200">System Notification</span>
                <span className="text-xs text-slate-500">{dayjs(ticket.createdAt).fromNow()}</span>
              </div>
              <p className="text-sm text-slate-400">Ticket created and prioritized via AI engine.</p>
            </div>
          </div>
          
          {ticket.returnReason && (
            <div className="flex justify-center my-6 relative">
              <div className="absolute w-full border-t border-rose-500/20 top-1/2"></div>
              <div className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-4 py-1.5 rounded-full text-xs font-semibold relative z-10 flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                <RotateCcw size={12} /> Ticket Returned
              </div>
            </div>
          )}

          {ticket.returnReason && (
             <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 text-xs font-bold">
               {ticket.returnedByName ? ticket.returnedByName.charAt(0) : 'E'}
             </div>
             <div className="flex-1 bg-slate-900/60 rounded-xl rounded-tl-none p-4 border border-white/5">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-sm font-semibold text-slate-200">Returned by {ticket.returnedByName || 'Employee'}</span>
               </div>
               <p className="text-sm text-slate-400 italic">"{ticket.returnReason}"</p>
             </div>
           </div>
          )}

          {ticket.reopenReason && (
            <div className="flex justify-center my-6 relative">
              <div className="absolute w-full border-t border-orange-500/20 top-1/2"></div>
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/30 px-4 py-1.5 rounded-full text-xs font-semibold relative z-10 flex items-center gap-2 shadow-[0_0_15px_rgba(251,146,60,0.2)]">
                <RotateCcw size={12} /> Ticket Re-opened
              </div>
            </div>
          )}

          {ticket.reopenReason && (
             <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-white text-xs font-bold">
               U
             </div>
             <div className="flex-1 bg-slate-900/60 rounded-xl rounded-tl-none p-4 border border-white/5">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-sm font-semibold text-slate-200">Reopen Reason Provided</span>
               </div>
               <p className="text-sm text-slate-400 italic">"{ticket.reopenReason}"</p>
             </div>
           </div>
          )}

          {/* User Comments */}
          {comments.filter(c => c.ticketId === ticket.id).map(c => {
            const author = getUserById(c.userId);
            const isMe = user?.id === c.userId;
            const seenCount = c.readBy ? c.readBy.length : 1; // 1 is author
            
            return (
              <div key={c.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 text-xs font-bold shrink-0">
                  {author ? author.name.charAt(0) : 'U'}
                </div>
                <div className={`p-4 rounded-xl max-w-[85%] border shadow-sm ${
                  isMe 
                    ? 'bg-violet-600/20 border-violet-500/30 rounded-tr-none' 
                    : 'bg-slate-900/60 border-white/5 rounded-tl-none'
                }`}>
                  <div className={`flex items-center gap-2 mb-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-semibold text-slate-200">{isMe ? 'You' : author?.name}</span>
                    <span className="text-xs text-slate-500">{dayjs(c.createdAt).fromNow()}</span>
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {renderCommentText(c.message)}
                  </p>
                  
                  {isMe && (
                    <div className="flex justify-end mt-2">
                       {seenCount > 1 ? (
                         <div className="flex items-center gap-1 text-[10px] text-violet-400 font-medium" title="Seen by others">
                           <CheckCheck size={14} /> Seen
                         </div>
                       ) : (
                         <div className="flex items-center gap-1 text-[10px] text-slate-500" title="Sent">
                           <Check size={14} /> Sent
                         </div>
                       )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Comment Input */}
        <div className="relative mt-6">
          {showMentions && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden z-20 animate-fade-in">
              <div className="p-2 bg-slate-900/50 border-b border-white/5 text-xs font-semibold text-slate-400">
                Mention someone
              </div>
              <div className="max-h-48 overflow-y-auto">
                {users.filter(u => u.name.toLowerCase().includes(mentionFilter.toLowerCase())).map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleMentionSelect(u)}
                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-violet-500/20 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <AtSign size={12} className="text-violet-400" />
                    {u.name}
                    <span className="text-[10px] text-slate-500 ml-auto bg-slate-900 px-1.5 rounded">{u.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <form onSubmit={handleAddComment} className="flex gap-3">
            <input
              ref={commentInputRef}
              type="text"
              value={commentText}
              onChange={handleCommentChange}
              placeholder="Type a message or use @ to mention someone..."
              className="input-field flex-1 pr-12"
            />
            <button type="submit" disabled={!commentText.trim() || isProcessing} className="btn-primary px-4 py-2 flex items-center justify-center min-w-[50px]">
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
