import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { supabase } from '../../supabaseClient';
import { 
  Search, Send, User as UserIcon, Check, CheckCheck, 
  ChevronLeft, MessageCircle, Paperclip, X, Image as ImageIcon, 
  FileText, File, Download, Loader2
} from 'lucide-react';
import dayjs from 'dayjs';
import clsx from 'clsx';

interface AttachmentPreview {
  file: File;
  preview?: string;
}

export const Messages: React.FC = () => {
  const { user } = useAuth();
  const { users, messages, sendMessage, markConversationAsRead } = useData();
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [mobileChatActive, setMobileChatActive] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Typing Indicator State
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Attachments State
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter users for the sidebar conversation list
  const filteredUsers = useMemo(() => {
    return users
      .filter(u => u.id !== user?.id)
      .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(u => {
        const conversationId = [user?.id, u.id].sort().join('_');
        const userMessages = messages.filter(m => m.conversationId === conversationId);
        const lastMessage = userMessages[userMessages.length - 1];
        const unreadCount = userMessages.filter(m => m.receiverId === user?.id && !m.isRead).length;
        
        return {
          ...u,
          lastMessage,
          unreadCount
        };
      })
      .sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [users, user?.id, messages, searchQuery]);

  // Set initial active partner
  useEffect(() => {
    if (!activePartnerId && filteredUsers.length > 0 && window.innerWidth >= 1024) {
      setActivePartnerId(filteredUsers[0].id);
    }
  }, [filteredUsers, activePartnerId]);

  // Real-time Typing Indicator & Broadcast
  useEffect(() => {
    if (!user || !activePartnerId) return;

    const conversationId = [user.id, activePartnerId].sort().join('_');
    const channel = supabase.channel(`chat:${conversationId}`);

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId === activePartnerId) {
          setPartnerIsTyping(payload.isTyping);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activePartnerId]);

  const broadcastTyping = (isTyping: boolean) => {
    if (!user || !activePartnerId) return;
    const conversationId = [user.id, activePartnerId].sort().join('_');
    supabase.channel(`chat:${conversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, isTyping }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    // Broadcast typing true
    broadcastTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTyping(false);
    }, 2000);
  };

  // Attachments Helpers
  const addFiles = useCallback((files: File[]) => {
    const newPreviews: AttachmentPreview[] = files.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));
    setAttachments(prev => [...prev, ...newPreviews]);
  }, []);

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const updated = [...prev];
      if (updated[index].preview) URL.revokeObjectURL(updated[index].preview!);
      return updated.filter((_, i) => i !== index);
    });
  };

  // Paste Handler
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
            const file = items[i].getAsFile();
            if (file) files.push(file);
        }
    }
    if (files.length > 0) addFiles(files);
  };

  // Mark conversation as read
  useEffect(() => {
    if (user && activePartnerId) {
      markConversationAsRead(activePartnerId, user.id);
    }
  }, [activePartnerId, messages.length, user?.id, markConversationAsRead]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activePartnerId, mobileChatActive, partnerIsTyping]);

  const activeConversationMessages = useMemo(() => {
    if (!user || !activePartnerId) return [];
    const conversationId = [user.id, activePartnerId].sort().join('_');
    return messages.filter(m => m.conversationId === conversationId);
  }, [messages, user?.id, activePartnerId]);

  const activePartner = useMemo(() => {
    return users.find(u => u.id === activePartnerId);
  }, [users, activePartnerId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activePartnerId || (!messageInput.trim() && attachments.length === 0)) return;

    try {
      setIsSending(true);
      const files = attachments.map(a => a.file);
      await sendMessage(activePartnerId, messageInput.trim(), user.id, files);
      
      setMessageInput('');
      setAttachments([]);
      broadcastTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const selectPartner = (id: string) => {
    setActivePartnerId(id);
    setMobileChatActive(true);
    setPartnerIsTyping(false);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={16} />;
    if (type.includes('pdf')) return <FileText size={16} />;
    return <File size={16} />;
  };

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-160px)] sm:h-[calc(100vh-140px)] flex gap-0 lg:gap-6 animate-fade-in relative overflow-hidden">
      {/* List Pane */}
      <div className={clsx(
        "w-full lg:w-[320px] flex-shrink-0 glass-card flex flex-col overflow-hidden border border-white/5 transition-all duration-300",
        mobileChatActive ? "hidden lg:flex" : "flex"
      )}>
        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center border border-violet-500/20">
              <MessageCircle size={18} className="text-violet-400" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight uppercase">Messages</h2>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-violet-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search contacts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all font-medium"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 bg-slate-900/20">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserIcon size={20} className="text-slate-600" />
              </div>
              <p className="text-slate-500 text-sm font-bold">No contacts found</p>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <button 
                key={u.id} 
                onClick={() => selectPartner(u.id)}
                className={clsx(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative mb-1",
                  activePartnerId === u.id 
                    ? "bg-violet-500/20 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]" 
                    : "hover:bg-white/5 border border-white/0"
                )}
              >
                <div className="relative shrink-0">
                  <img src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=312e81&color=fff`} alt="" className="w-11 h-11 rounded-full border border-white/10 shadow-lg object-cover" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#09090b] bg-emerald-500"></span>
                </div>
                
                <div className="text-left flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className={clsx(
                      "text-sm font-bold truncate transition-colors",
                      activePartnerId === u.id ? "text-white" : "text-slate-200"
                    )}>
                      {u.name}
                    </span>
                    {u.lastMessage && (
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                        {dayjs(u.lastMessage.createdAt).format('h:mm A')}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <p className={clsx(
                      "text-xs truncate flex-1",
                      u.unreadCount > 0 ? "text-violet-300 font-bold" : "text-slate-500 font-medium"
                    )}>
                      {u.lastMessage ? u.lastMessage.content : (
                        <span className="italic opacity-50">New connection</span>
                      )}
                    </p>
                    {u.unreadCount > 0 && (
                      <span className="bg-violet-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)] animate-pulse">
                        {u.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Pane */}
      <div className={clsx(
        "flex-1 glass-card flex flex-col overflow-hidden border border-white/5 bg-slate-900/10 transition-all duration-300",
        !mobileChatActive ? "hidden lg:flex" : "flex"
      )}>
        {activePartner ? (
          <>
            <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-md">
               <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                  <button 
                    onClick={() => setMobileChatActive(false)}
                    className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all active:scale-90"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="relative shrink-0">
                    <img src={activePartner.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activePartner.name)}&background=312e81&color=fff`} alt="" className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-white/10" />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#09090b] bg-emerald-500"></div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-white tracking-tight truncate text-sm sm:text-base">{activePartner.name}</p>
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.15em] flex items-center gap-1.5 leading-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Direct Line
                    </p>
                  </div>
               </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-fixed"
            >
              {activeConversationMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-slate-700">
                    <MessageCircle size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Safe & Secure Chat</p>
                    <p className="text-[11px] text-slate-600 mt-1 uppercase font-bold">Begin your conversation below</p>
                  </div>
                </div>
              ) : (
                activeConversationMessages.map((msg, i) => {
                  const isMe = msg.senderId === user.id;
                  const prevMsg = activeConversationMessages[i - 1];
                  const showTime = !prevMsg || dayjs(msg.createdAt).diff(dayjs(prevMsg.createdAt), 'minute') > 5;
                  
                  return (
                    <div key={msg.id} className="space-y-1">
                      {showTime && (
                        <div className="flex justify-center py-4">
                          <span className="text-[9px] font-black text-slate-500 bg-white/[0.02] px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-white/5 shadow-sm">
                            {dayjs(msg.createdAt).format('MMMM D, h:mm A')}
                          </span>
                        </div>
                      )}
                      <div className={clsx("flex group", isMe ? 'justify-end' : 'justify-start')}>
                        <div className={clsx(
                          "max-w-[85%] sm:max-w-[70%] p-3 sm:p-4 rounded-2xl shadow-2xl transition-all relative overflow-hidden border",
                          isMe 
                            ? "bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-tr-none border-violet-500/20" 
                            : "bg-white/[0.03] text-slate-200 border-white/5 rounded-tl-none backdrop-blur-sm"
                        )}>
                          {msg.content && <p className="text-xs sm:text-sm leading-relaxed font-medium mb-2">{msg.content}</p>}
                          
                          {/* Attachments Display */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="space-y-2 mt-1">
                              {msg.attachments.map((att) => (
                                <div key={att.id}>
                                  {att.type.startsWith('image/') ? (
                                    <div className="relative group/att rounded-lg overflow-hidden border border-white/10 max-w-full">
                                      <img src={att.url} alt={att.name} className="w-full max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(att.url, '_blank')} />
                                      <a href={att.url} download target="_blank" rel="noreferrer" className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md rounded-lg text-white opacity-0 group-hover/att:opacity-100 transition-opacity">
                                        <Download size={14} />
                                      </a>
                                    </div>
                                  ) : (
                                    <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors group/file text-left min-w-0">
                                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-violet-400 group-hover/file:bg-violet-500/20 transition-colors">
                                        {getFileIcon(att.type)}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-bold text-slate-300 truncate">{att.name}</p>
                                        <p className="text-[8px] text-slate-500 uppercase font-black">{(att.size / 1024).toFixed(1)} KB</p>
                                      </div>
                                      <Download size={12} className="text-slate-500 group-hover/file:text-white" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className={clsx(
                            "flex items-center gap-1.5 mt-2 opacity-50",
                            isMe ? "justify-end" : "justify-start"
                          )}>
                            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                              {dayjs(msg.createdAt).format('h:mm A')}
                            </span>
                            {isMe && (
                              msg.isRead ? <CheckCheck size={12} className="text-emerald-300" /> : <Check size={12} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing Indicator */}
              {partnerIsTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white/[0.03] text-slate-400 border border-white/5 rounded-2xl rounded-tl-none p-3 backdrop-blur-sm flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400/50 animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400/50 animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400/50 animate-bounce"></span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                      {activePartner.name.split(' ')[0]} is typing
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-white/5 bg-white/[0.02] backdrop-blur-xl relative">
              {/* Attachment Previews */}
              {attachments.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="relative group shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-slate-900/60 shadow-lg">
                      {att.preview ? (
                        <img src={att.preview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                          <div className="text-violet-400">{getFileIcon(att.file.type)}</div>
                          <p className="text-[8px] text-slate-500 truncate w-full text-center">{att.file.name}</p>
                        </div>
                      )}
                      <button 
                        onClick={() => removeAttachment(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-rose-600 rounded-full text-white transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-end gap-2 sm:gap-4 relative max-w-4xl mx-auto">
                 <div className="flex-1 relative flex items-center">
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute left-3 p-2 text-slate-500 hover:text-violet-400 transition-colors"
                    >
                      <Paperclip size={20} />
                    </button>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      multiple 
                      className="hidden" 
                      onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
                    />
                    <input 
                      type="text" 
                      value={messageInput}
                      onChange={handleInputChange}
                      onPaste={handlePaste}
                      placeholder="Type your message..." 
                      disabled={isSending}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 sm:pr-5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all font-medium" 
                    />
                 </div>
                 <button 
                  type="submit" 
                  disabled={isSending || (!messageInput.trim() && attachments.length === 0)}
                  className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:scale-95 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-95 group"
                >
                   {isSending ? (
                     <Loader2 size={18} className="animate-spin" />
                   ) : (
                     <Send size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                   )}
                 </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-6 opacity-40 px-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-slate-800 shadow-inner">
              <MessageCircle size={40} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-widest">Secure Channels</h3>
              <p className="text-xs font-bold uppercase tracking-tight max-w-xs mx-auto text-slate-600">Encrypted direct messaging enabled. Select a contact to begin.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


