import React, { createContext, useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Ticket, TicketStatus, Comment, User } from '../types';
import { calculateDeadline } from '../lib/sla';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import dayjs from 'dayjs';

export interface TicketContextType {
  tickets: Ticket[];
  comments: Comment[];
  addTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'reopenCount'>, files?: File[]) => Promise<any>;
  deleteTicket: (ticketId: string) => Promise<any>;
  updateTicketStatus: (id: string, status: TicketStatus, reason?: string) => Promise<any>;
  assignTicket: (ticketId: string, userId: string | undefined) => Promise<any>;
  acceptTicket: (ticketId: string) => Promise<any>;
  returnTicket: (ticketId: string, reason: string, userId?: string, userName?: string) => Promise<any>;
  addComment: (ticketId: string, userId: string, message: string, mentions?: string[]) => Promise<any>;
  markCommentsSeen: (ticketId: string, userId: string) => Promise<any>;
  refreshTickets: () => Promise<void>;
  isLoading: boolean;
}

export const TicketContext = createContext<TicketContextType | undefined>(undefined);

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { users, config, addNotification } = useData();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const lastFetchRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTicketsAndComments = useCallback(async (showLoading = true, force = false) => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const now = Date.now();
    if (!force && !showLoading && now - lastFetchRef.current < 15000) {
      return;
    }
    lastFetchRef.current = now;

    try {
      if (showLoading && tickets.length === 0) setIsLoading(true);
      
      const [ { data: dbTickets }, { data: dbComments } ] = await Promise.all([
        supabase.from('tickets').select('*').order('created_at', { ascending: false }),
        supabase.from('ticket_comments').select('*').order('created_at', { ascending: true })
      ]);

      if (dbTickets) {
        setTickets(dbTickets.map((t: any) => ({
          id: t.id,
          ticketNumber: t.ticket_number,
          title: t.title,
          description: t.description,
          priority: t.priority,
          status: t.status,
          departmentId: t.department_id,
          categoryId: t.category_id,
          customCategory: t.custom_category,
          createdBy: t.created_by,
          assignedTo: t.assigned_to,
          deadline: t.deadline,
          reopenCount: t.reopen_count,
          reopenReason: t.reopen_reason,
          returnReason: t.return_reason,
          returnedBy: t.returned_by,
          returnedByName: t.returned_by_name,
          slaStatus: t.sla_status,
          createdAt: t.created_at,
          updatedAt: t.updated_at
        })));
      }

      if (dbComments) {
        setComments(dbComments.map((c: any) => ({
          id: c.id,
          ticketId: c.ticket_id,
          userId: c.user_id,
          message: c.message,
          mentions: c.mentions,
          readBy: c.read_by,
          createdAt: c.created_at
        })));
      }
    } catch (error) {
      console.error('Error fetching tickets/comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, tickets.length]);

  useEffect(() => {
    fetchTicketsAndComments();
    const handleFocus = () => fetchTicketsAndComments(false);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchTicketsAndComments]);

  useEffect(() => {
    if (!user) return;

    const ticketsChannel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload) => {
        const t = payload.new as any;
        const old = payload.old as any;
        
        if (payload.eventType === 'INSERT') {
          setTickets(prev => {
            if (prev.find(item => item.id === t.id)) return prev;
            return [{
              id: t.id, ticketNumber: t.ticket_number, title: t.title, description: t.description, priority: t.priority,
              status: t.status, departmentId: t.department_id, categoryId: t.category_id, customCategory: t.custom_category,
              createdBy: t.created_by, assignedTo: t.assigned_to, deadline: t.deadline, reopenCount: t.reopen_count,
              reopenReason: t.reopen_reason, returnReason: t.return_reason, returnedBy: t.returned_by,
              returnedByName: t.returned_by_name, slaStatus: t.sla_status, createdAt: t.created_at, updatedAt: t.updated_at
            }, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setTickets(prev => prev.map(item => item.id === t.id ? {
            ...item,
            ...Object.fromEntries(Object.entries({
              ticketNumber: t.ticket_number, title: t.title, description: t.description, priority: t.priority,
              status: t.status, departmentId: t.department_id, categoryId: t.category_id, customCategory: t.custom_category,
              assignedTo: t.assigned_to, deadline: t.deadline, reopenCount: t.reopen_count, reopenReason: t.reopen_reason,
              returnReason: t.return_reason, returnedBy: t.returned_by, returnedByName: t.returned_by_name,
              slaStatus: t.sla_status, updatedAt: t.updated_at
            }).filter(([_, v]) => v !== undefined))
          } : item));
        } else if (payload.eventType === 'DELETE') {
          setTickets(prev => prev.filter(item => item.id !== old.id));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_comments' }, (payload) => {
        const c = payload.new as any;
        setComments(prev => {
          if (prev.find(item => item.id === c.id)) return prev;
          return [...prev, {
            id: c.id, ticketId: c.ticket_id, userId: c.user_id, message: c.message, mentions: c.mentions, readBy: c.read_by, createdAt: c.created_at
          }];
        });
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') fetchTicketsAndComments(false);
      });

    return () => {
      supabase.removeChannel(ticketsChannel);
    };
  }, [user, fetchTicketsAndComments]);

  const notifyInvolved = useCallback(async (ticket: Ticket, title: string, message: string, type: 'UPDATE' | 'NEW_TICKET' | 'OTHER') => {
    if (!user) return;
    const targetIds = new Set<string>();
    if (ticket.createdBy) targetIds.add(ticket.createdBy);
    if (ticket.assignedTo) targetIds.add(ticket.assignedTo);
    users.filter(u => (u.role === 'ADMIN' && u.departmentId === ticket.departmentId) || u.role === 'SUPER_ADMIN').forEach(u => targetIds.add(u.id));
    targetIds.delete(user.id);
    const notificationPromises = Array.from(targetIds).map(async (targetId) => {
      const targetUser = users.find((u: User) => u.id === targetId);
      if (targetUser) addNotification(targetId, title, message, type, `/${targetUser.role.toLowerCase()}/tickets/${ticket.id}`);
    });
    await Promise.all(notificationPromises);
  }, [user, users, addNotification]);

  const addTicket = async (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'reopenCount'>, files?: File[]) => {
    if (!user) return;
    
    // Check Quota
    const period = dayjs().startOf('month').format('YYYY-MM-DD');
    const { data: usageData } = await supabase.from('usage_quotas').select('tickets, storage_bytes').eq('user_id', user.id).eq('period', period).single();
    
    const maxTickets = user.role === 'ADMIN' ? config.quotaTicketsAdmin : 
                       user.role === 'SUPER_ADMIN' ? Infinity : config.quotaTicketsEmployee;
    
    const maxStorageMb = user.role === 'SUPER_ADMIN' ? config.quotaStorageSuperMb :
                         user.role === 'ADMIN' ? config.quotaStorageAdminMb : config.quotaStorageEmployeeMb;
    const maxStorageBytes = maxStorageMb * 1024 * 1024;
    
    if ((usageData?.tickets || 0) >= maxTickets) {
      alert(`Monthly Limit Reached: You have used all ${maxTickets} ticket submissions for this month.`);
      throw new Error('Quota exceeded');
    }
    
    const totalFilesSize = files?.reduce((acc, f) => acc + f.size, 0) || 0;
    if ((usageData?.storage_bytes || 0) + totalFilesSize > maxStorageBytes) {
      alert(`Storage Limit Reached: Uploading these files would exceed your ${maxStorageMb}MB monthly limit.`);
      throw new Error('Storage quota exceeded');
    }

    const createdAt = new Date().toISOString();
    const deadline = calculateDeadline(ticket.priority, createdAt, config.slaRules);
    try {
      const { data: newDbTicket, error: _ticketError } = await supabase.from('tickets').insert({ title: ticket.title, description: ticket.description, priority: ticket.priority, status: 'OPEN', department_id: ticket.departmentId || null, category_id: ticket.categoryId || null, custom_category: ticket.customCategory || null, created_by: user.id, deadline }).select().single();
      if (newDbTicket) {
        const uploadedAttachments: import('../types').Attachment[] = [];
        if (files && files.length > 0) {
          for (const file of files) {
            const fileName = `${newDbTicket.id}/${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${file.name.split('.').pop()}`;
            const { data: uploadData } = await supabase.storage.from('ticket-attachments').upload(fileName, file);
            if (uploadData) {
              const { data: { publicUrl } } = supabase.storage.from('ticket-attachments').getPublicUrl(uploadData.path);
                const { data: dbAtt } = await supabase.from('ticket_attachments').insert({ ticket_id: newDbTicket.id, name: file.name, type: file.type, size: file.size, url: publicUrl }).select().single();
                if (dbAtt) uploadedAttachments.push({ id: dbAtt.id, name: dbAtt.name, type: dbAtt.type, size: dbAtt.size, url: dbAtt.url, createdAt: dbAtt.created_at });
              }
            }
            if (totalFilesSize > 0) {
               await supabase.rpc('increment_storage_usage', { p_user_id: user.id, p_period: period, p_bytes: totalFilesSize });
            }
          }
          const finalTicket: Ticket = { id: newDbTicket.id, ticketNumber: newDbTicket.ticket_number, title: newDbTicket.title, description: newDbTicket.description, priority: newDbTicket.priority, status: newDbTicket.status, departmentId: newDbTicket.department_id, categoryId: newDbTicket.category_id, customCategory: newDbTicket.custom_category, createdBy: newDbTicket.created_by, assignedTo: newDbTicket.assigned_to, deadline: newDbTicket.deadline, reopenCount: newDbTicket.reopen_count, createdAt: newDbTicket.created_at, updatedAt: newDbTicket.updated_at, attachments: uploadedAttachments };
          setTickets(prev => [finalTicket, ...prev]);
          await supabase.rpc('increment_ticket_usage', { p_user_id: user.id, p_period: period });
          await notifyInvolved(finalTicket, 'New Ticket Created', `Ticket TKT-${String(finalTicket.ticketNumber).padStart(5, '0')} has been submitted.`, 'NEW_TICKET');
        }
      } catch (err) { console.error(err); throw err; }
    };

  const deleteTicket = async (ticketId: string) => {
    try {
      // 1. Fetch all attachment records for this ticket
      const { data: attachmentRecords } = await supabase
        .from('ticket_attachments')
        .select('id, url, name')
        .eq('ticket_id', ticketId);

      // 2. Delete files from Supabase Storage
      if (attachmentRecords && attachmentRecords.length > 0) {
        // Extract file paths from URLs (the path after the bucket name)
        const storagePaths = attachmentRecords.map((att: any) => {
          try {
            // URL format: .../storage/v1/object/public/ticket-attachments/<path>
            const url = new URL(att.url);
            const pathParts = url.pathname.split('/ticket-attachments/');
            return pathParts[1] || null;
          } catch {
            return null;
          }
        }).filter(Boolean) as string[];

        if (storagePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('ticket-attachments')
            .remove(storagePaths);
          if (storageError) console.warn('Storage cleanup error:', storageError.message);
        }

        // 3. Delete attachment DB records
        await supabase.from('ticket_attachments').delete().eq('ticket_id', ticketId);
      }

      // 4. Delete comments for the ticket
      await supabase.from('ticket_comments').delete().eq('ticket_id', ticketId);

      // 5. Delete the ticket itself (trigger will reset sequence if table becomes empty)
      await supabase.from('tickets').delete().eq('id', ticketId);

      setTickets(prev => prev.filter(t => t.id !== ticketId));
    } catch (err) {
      console.error('deleteTicket error:', err);
      throw err;
    }
  };

  const updateTicketStatus = async (id: string, status: TicketStatus, reason?: string) => {
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return;
    try {
      const now = new Date().toISOString();
      const updates: any = { status, updated_at: now };
      if (reason) {
        updates.reopen_reason = reason;
        updates.reopen_count = ticket.reopenCount + 1;
        updates.deadline = calculateDeadline(ticket.priority, now, config.slaRules);
      }
      const { data: updated } = await supabase.from('tickets').update(updates).eq('id', id).select().single();
      if (updated) {
        const mapped: Ticket = { ...ticket, status: updated.status as TicketStatus, reopenCount: updated.reopen_count, reopenReason: updated.reopen_reason, deadline: updated.deadline, updatedAt: updated.updated_at };
        setTickets(prev => prev.map(t => t.id === id ? mapped : t));
        await notifyInvolved(mapped, reason ? 'Ticket Re-opened' : 'Status Updated', `Ticket status changed to ${status}`, 'UPDATE');
      }
      return true;
    } catch (err) { console.error(err); return false; }
  };

  const assignTicket = async (ticketId: string, userId: string | undefined) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    try {
      const { data: updated } = await supabase.from('tickets').update({ assigned_to: userId, status: (ticket.status === 'RETURNED' || ticket.status === 'REOPENED') ? 'OPEN' : ticket.status, updated_at: new Date().toISOString() }).eq('id', ticketId).select().single();
      if (updated) {
        const mapped: Ticket = { ...ticket, assignedTo: updated.assigned_to, status: updated.status as TicketStatus, updatedAt: updated.updated_at };
        setTickets(prev => prev.map(t => t.id === ticketId ? mapped : t));
        await notifyInvolved(mapped, 'Ticket Assignment', `Ticket was ${userId ? 'assigned' : 'unassigned'}.`, 'UPDATE');
      }
      return true;
    } catch (err) { console.error(err); return false; }
  };

  const acceptTicket = async (ticketId: string) => {
    try {
      const { data: updated } = await supabase.from('tickets').update({ status: 'IN_PROGRESS', updated_at: new Date().toISOString() }).eq('id', ticketId).select().single();
      if (updated) setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'IN_PROGRESS', updatedAt: updated.updated_at } : t));
    } catch (err) { console.error(err); }
  };

  const returnTicket = useCallback(async (ticketId: string, reason: string, userId?: string, userName?: string) => {
    try {
      const { data: updated } = await supabase.from('tickets').update({ status: 'RETURNED', assigned_to: null, return_reason: reason, returned_by: userId, returned_by_name: userName, updated_at: new Date().toISOString() }).eq('id', ticketId).select().single();
      if (updated) {
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
          const mapped: Ticket = { ...ticket, status: 'RETURNED', assignedTo: undefined, returnReason: reason, returnedBy: userId, returnedByName: userName, updatedAt: updated.updated_at };
          setTickets(prev => prev.map(t => t.id === ticketId ? mapped : t));
          await notifyInvolved(mapped, 'Ticket Returned', `Returned by ${userName}`, 'UPDATE');
        }
      }
    } catch (err) { console.error(err); }
  }, [tickets, notifyInvolved]);

  const addComment = useCallback(async (ticketId: string, userId: string, message: string, mentions?: string[]) => {
    if (!user) return;
    try {
      // Check Quota
      const period = dayjs().startOf('month').format('YYYY-MM-DD');
      const { data: usageData } = await supabase.from('usage_quotas').select('comments').eq('user_id', userId).eq('period', period).single();
      
      const maxComments = user.role === 'ADMIN' ? config.quotaCommentsAdmin : 
                          user.role === 'SUPER_ADMIN' ? Infinity : config.quotaCommentsEmployee;
      
      if ((usageData?.comments || 0) >= maxComments) {
        alert(`Monthly Limit Reached: You have used all ${maxComments} comments for this month.`);
        throw new Error('Quota exceeded');
      }

      const { data: dbComment } = await supabase.from('ticket_comments').insert({ ticket_id: ticketId, user_id: userId, message, mentions: mentions || [], read_by: [userId] }).select().single();
      if (dbComment) {
        setComments(prev => [...prev, { id: dbComment.id, ticketId: dbComment.ticket_id, userId: dbComment.user_id, message: dbComment.message, mentions: dbComment.mentions, readBy: dbComment.read_by, createdAt: dbComment.created_at }]);
        await supabase.rpc('increment_comment_usage', { p_user_id: userId, p_period: period });
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) await notifyInvolved(ticket, 'New Comment', `New comment on ${ticket.title}`, 'UPDATE');
      }
    } catch (err) { console.error(err); throw err; }
  }, [tickets, notifyInvolved, user, config.quotaCommentsAdmin, config.quotaCommentsEmployee]);

  const markCommentsSeen = useCallback(async (ticketId: string, userId: string) => {
    const unseen = comments.filter(c => c.ticketId === ticketId && (!c.readBy || !c.readBy.includes(userId)));
    if (unseen.length === 0) return;
    try {
      await Promise.all(unseen.map(c => supabase.from('ticket_comments').update({ read_by: [...(c.readBy || []), userId] }).eq('id', c.id)));
      setComments(prev => prev.map(c => (c.ticketId === ticketId && (!c.readBy || !c.readBy.includes(userId))) ? { ...c, readBy: [...(c.readBy || []), userId] } : c));
    } catch (err) { console.error(err); }
  }, [comments]);

  return (
    <TicketContext.Provider value={{
      tickets, comments, addTicket, deleteTicket, updateTicketStatus, assignTicket, acceptTicket, returnTicket, addComment, markCommentsSeen,
      refreshTickets: () => fetchTicketsAndComments(true, true),
      isLoading
    }}>
      {children}
    </TicketContext.Provider>
  );
};
