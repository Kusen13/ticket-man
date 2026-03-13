import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Department, Category, SystemConfig, KBArticle, Notification, Message, AccessRequest } from '../types';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';

const DEFAULT_CONFIG: SystemConfig = {
  companyName: 'Fast Services Corporation',
  systemEmail: 'tickets@fastservices.com',
  maxReopenCount: 3,
  autoCloseAfterDays: 7,
  notifyOnNewTicket: true,
  notifyOnEscalation: true,
  notifyOnReopen: true,
  slaRules: [
    { priority: 'URGENT', responseHours: 1, resolutionHours: 4 },
    { priority: 'HIGH', responseHours: 4, resolutionHours: 24 },
    { priority: 'MEDIUM', responseHours: 24, resolutionHours: 72 },
    { priority: 'LOW', responseHours: 48, resolutionHours: 168 },
  ],
  urgentKeywords: [
    'down', 'outage', 'emergency', 'critical', 'cannot work', 'security breach', 'data loss', 'production', 'crash', 
    'smoke', 'fire', 'explosion', 'leak', 'flooding', 'blackout', 'power failure', 'emergency', 'hacked', 'data leak',
    'major bug', 'system down', 'stopped working', 'blocked', 'cannot log in', 'unauthorized', 'suspicious'
  ],
  highKeywords: [
    'broken', 'error', 'failing', 'blocked', 'deadline', 'not working', 'urgent', 'asap', 'soon', 'important', 
    'hardware failure', 'monitor', 'printer down', 'blue screen', 'corrupted', 'missing', 'denied', 'payroll',
    'salary', 'bonus', 'hmo', 'medical', 'insurance', 'safety', 'injury'
  ],
  mediumKeywords: [
    'slow', 'issue', 'problem', 'intermittent', 'workaround', 'delay', 'glitch', 'performance', 'sync',
    'email', 'outlook', 'vpn', 'license', 'software', 'update', 'reboot', 'restart', 'noisy', 'broken chair',
    'light bulb', 'not cooling', 'leaking faucet'
  ],
};

export interface DataContextType {
  users: User[];
  departments: Department[];
  categories: Category[];
  config: SystemConfig;
  articles: KBArticle[];
  notifications: Notification[];
  messages: Message[];
  accessRequests: AccessRequest[];
  isLoading: boolean;
  addUser: (user: Omit<User, 'id'>) => Promise<User | undefined>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string, currentUserId?: string) => Promise<void>;
  approveUser: (id: string) => Promise<void>;
  rejectUser: (id: string) => Promise<void>;
  addDepartment: (dept: Omit<Department, 'id'>) => Promise<Department | undefined>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  addCategory: (cat: Omit<Category, 'id'>) => Promise<Category | undefined>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateConfig: (updates: Partial<SystemConfig>) => Promise<void>;
  addArticle: (article: Omit<KBArticle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<KBArticle | undefined>;
  updateArticle: (id: string, updates: Partial<KBArticle>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  addNotification: (userId: string, title: string, message: string, type: Notification['type'], link?: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: (userId: string) => void;
  sendMessage: (receiverId: string, content: string, senderId: string, files?: File[]) => Promise<void>;
  markConversationAsRead: (partnerId: string, currentUserId: string) => void;
  getUserById: (id: string) => User | undefined;
  getDepartmentById: (id: string) => Department | undefined;
  getCategoryById: (id: string) => Category | undefined;
  refreshSession: (userId: string) => User | undefined;
  refreshData: () => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const lastFetchRef = useRef<number>(0);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (showLoading = true, force = false) => {
    if (!user || authLoading) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    const now = Date.now();
    if (!force && !showLoading && now - lastFetchRef.current < 15000) {
      return;
    }
    lastFetchRef.current = now;

    try {
      if (showLoading) setIsLoading(true);
      
      const results = await Promise.allSettled([
        supabase.from('users').select('*'),
        supabase.from('departments').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('system_config').select('*').single(),
        supabase.from('kb_articles').select('*'),
        supabase.from('user_invitations').select('*'),
        supabase.from('access_requests').select('*'),
        supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
        supabase.from('notifications').select('*').eq('user_id', user.id)
      ]);

      const getVal = (res: any) => res.status === 'fulfilled' ? res.value.data : null;

      const dbUsers = getVal(results[0]);
      const dbDepts = getVal(results[1]);
      const dbCats = getVal(results[2]);
      const dbConfig = getVal(results[3]);
      const dbKB = getVal(results[4]);
      const dbInvites = getVal(results[5]);
      const dbRequests = getVal(results[6]);
      const dbMessages = getVal(results[7]);
      const dbNotifs = getVal(results[8]);

      let allUsers: User[] = [];
      if (dbUsers) {
        allUsers = dbUsers.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          departmentId: u.department_id,
          avatar: u.avatar,
          isOnline: u.is_online,
          status: u.status,
          approvalStatus: u.approval_status,
          lastActive: u.last_active,
          createdAt: u.created_at
        }));
      }

      if (dbInvites) {
        const invitedUsers: User[] = dbInvites.map((inv: any) => ({
          id: `inv-${inv.email}`,
          name: inv.name,
          email: inv.email,
          role: inv.role as any,
          departmentId: inv.department_id,
          approvalStatus: 'APPROVED' as const,
          isInvited: true,
          createdAt: inv.created_at
        }));
        allUsers = [...allUsers, ...invitedUsers];
      }
      
      if (dbUsers || dbInvites) setUsers(allUsers);
      if (dbDepts) setDepartments(dbDepts.map((d: any) => ({ id: d.id, name: d.name, description: d.description, adminId: d.admin_id })));
      if (dbCats) setCategories(dbCats.map((c: any) => ({ id: c.id, name: c.name, description: c.description, defaultPriority: c.default_priority, departmentId: c.department_id })));
      if (dbConfig) {
        setConfig({
          companyName: dbConfig.company_name, systemEmail: dbConfig.system_email, maxReopenCount: dbConfig.max_reopen_count, autoCloseAfterDays: dbConfig.auto_close_after_days,
          notifyOnNewTicket: dbConfig.notify_on_new_ticket, notifyOnEscalation: dbConfig.notify_on_escalation, notifyOnReopen: dbConfig.notify_on_reopen,
          slaRules: dbConfig.sla_rules, urgentKeywords: dbConfig.urgent_keywords, highKeywords: dbConfig.high_keywords, mediumKeywords: dbConfig.medium_keywords
        });
      }
      if (dbKB) setArticles(dbKB.map((a: any) => ({ id: a.id, title: a.title, content: a.content, category: a.category, departmentId: a.department_id, createdBy: a.created_by, createdAt: a.created_at, updatedAt: a.updated_at, videoUrl: a.video_url })));
      if (dbRequests) setAccessRequests(dbRequests.map((r: any) => ({ id: r.id, email: r.email, name: r.name, role: r.role, createdAt: r.created_at })));
      if (dbMessages) {
        setMessages(dbMessages.map((m: any) => ({
          id: m.id, conversationId: m.conversation_id, senderId: m.sender_id, receiverId: m.receiver_id,
          content: m.content, attachments: m.attachments || [], isRead: m.is_read, createdAt: m.created_at
        })));
      }
      if (dbNotifs) {
        setNotifications(dbNotifs.map((n: any) => ({
          id: n.id, userId: n.user_id, title: n.title, message: n.message, type: n.type as any,
          link: n.link, isRead: n.is_read, createdAt: n.created_at
        })));
      }
    } catch (error) {
      console.error('Error fetching DataContext data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchData();
    const handleFocus = () => fetchData(false);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData]);

  useEffect(() => {
    if (!user) return;

    const messagesChannel = supabase
      .channel('public:messages')
      .on('postgres_changes', { 
        event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        const m = payload.new as any;
        setMessages(prev => {
          if (prev.find(msg => msg.id === m.id)) return prev;
          return [...prev, {
            id: m.id, conversationId: m.conversation_id, senderId: m.sender_id, receiverId: m.receiver_id,
            content: m.content, attachments: m.attachments || [], isRead: m.is_read, createdAt: m.created_at
          }];
        });
      })
      .subscribe();

    const notifsChannel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const n = payload.new as any;
        setNotifications(prev => {
          if (prev.find(notif => notif.id === n.id)) return prev;
          return [{
            id: n.id, userId: n.user_id, title: n.title, message: n.message, type: n.type as any,
            link: n.link, isRead: n.is_read, createdAt: n.created_at
          }, ...prev];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(notifsChannel);
    };
  }, [user?.id]);

  const addNotification = useCallback(async (userId: string, title: string, message: string, type: Notification['type'], link?: string) => {
    try {
      const { error } = await supabase.from('notifications').insert([{ user_id: userId, title, message, type, link, is_read: false }]);
      if (error) throw error;
    } catch (error) { console.error('Error adding notification:', error); }
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) { console.error('Error marking notification read:', error); }
  }, []);

  const markAllNotificationsRead = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.userId === userId ? { ...n, isRead: true } : n));
    } catch (error) { console.error('Error marking all notifications read:', error); }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) { console.error('Error deleting notification:', error); }
  }, []);

  const clearAllNotifications = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('user_id', userId);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.userId !== userId));
    } catch (error) { console.error('Error clearing all notifications:', error); }
  }, []);

  const getUserById = useCallback((id: string) => users.find(u => u.id === id), [users]);

  const sendMessage = useCallback(async (receiverId: string, content: string, senderId: string, files?: File[]) => {
    const conversationId = [senderId, receiverId].sort().join('_');
    const uploadedAttachments: import('../types').Attachment[] = [];
    try {
      if (files && files.length > 0) {
        for (const file of files) {
          const fileName = `${conversationId}/${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${file.name.split('.').pop()}`;
          const { data: uploadData, error: _uploadError } = await supabase.storage.from('message-attachments').upload(fileName, file);
          if (uploadData) {
            const { data: { publicUrl } } = supabase.storage.from('message-attachments').getPublicUrl(uploadData.path);
            uploadedAttachments.push({ id: Math.random().toString(36).substring(2, 11), name: file.name, type: file.type, size: file.size, url: publicUrl, createdAt: new Date().toISOString() });
          }
        }
      }
      const { data, error: _msgError } = await supabase.from('messages').insert([{ conversation_id: conversationId, sender_id: senderId, receiver_id: receiverId, content, attachments: uploadedAttachments, is_read: false }]).select().single();
      if (data) {
        setMessages(prev => [...prev, { id: data.id, conversationId: data.conversation_id, senderId: data.sender_id, receiverId: data.receiver_id, content: data.content, attachments: data.attachments || [], isRead: data.is_read, createdAt: data.created_at }]);
        const receiver = getUserById(receiverId);
        const sender = getUserById(senderId);
        addNotification(receiverId, 'New Message', `You received a new message from ${sender?.name || 'Someone'}`, 'MENTION', `/${receiver?.role?.toLowerCase() || 'employee'}/messages`);

      }
    } catch (error) { console.error('Error sending message:', error); }
  }, [addNotification, getUserById]);

  const markConversationAsRead = useCallback(async (partnerId: string, currentUserId: string) => {
    const conversationId = [currentUserId, partnerId].sort().join('_');
    try {
      await supabase.from('messages').update({ is_read: true }).eq('conversation_id', conversationId).eq('receiver_id', currentUserId);
      setMessages(prev => prev.map(msg => (msg.conversationId === conversationId && msg.receiverId === currentUserId && !msg.isRead) ? { ...msg, isRead: true } : msg));
    } catch (err) { console.error(err); }
  }, []);

  const getDepartmentById = useCallback((id: string) => departments.find(d => d.id === id), [departments]);
  const getCategoryById = useCallback((id: string) => categories.find(c => c.id === id), [categories]);
  const refreshSession = useCallback((userId: string) => {
    const fresh = users.find(u => u.id === userId);
    if (fresh) localStorage.setItem('ticketman_user', JSON.stringify(fresh));
    return fresh;
  }, [users]);

  const addUser = useCallback(async (user: Omit<User, 'id'>) => {
    try {
      const { data: existingUser } = await supabase.from('users').select('*').eq('email', user.email).single();
      if (existingUser) {
        await supabase.from('users').update({ role: user.role, department_id: user.departmentId, approval_status: 'APPROVED' }).eq('id', existingUser.id);
        const updatedUser: User = { ...existingUser, role: user.role, departmentId: user.departmentId, approvalStatus: 'APPROVED' };
        setUsers(prev => prev.map(u => u.id === existingUser.id ? updatedUser : u));
        return updatedUser;
      }
      await supabase.from('user_invitations').upsert({ email: user.email, name: user.name, role: user.role, department_id: user.departmentId });
      const newUser: User = { ...user, id: `inv-${user.email}`, approvalStatus: 'APPROVED', isInvited: true };
      setUsers(prev => [...prev.filter(u => u.email !== user.email), newUser]);
      return newUser;
    } catch (err) { console.error(err); }
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    try {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.role) dbUpdates.role = updates.role;
      if (updates.departmentId !== undefined) dbUpdates.department_id = updates.departmentId;
      if (updates.avatar) dbUpdates.avatar = updates.avatar;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.isOnline !== undefined) dbUpdates.is_online = updates.isOnline;
      if (updates.approvalStatus) dbUpdates.approval_status = updates.approvalStatus;
      await supabase.from('users').update(dbUpdates).eq('id', id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    } catch (err) { console.error(err); }
  }, []);

  const approveUser = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.rpc('approve_user', { target_user_id: id });
      if (error) throw error;
      const request = accessRequests.find(r => r.id === id);
      if (request) {
        const newUser: User = { id: request.id, name: request.name, email: request.email, role: request.role, approvalStatus: 'APPROVED' };
        setUsers(prev => [...prev, newUser]);
        setAccessRequests(prev => prev.filter(r => r.id !== id));
        addNotification(request.id, 'Account Approved', 'Your account has been approved by an administrator.', 'OTHER', `/${request.role?.toLowerCase() || 'employee'}`);
      }
    } catch (err) { console.error(err); }
  }, [accessRequests, addNotification]);

  const rejectUser = useCallback(async (id: string) => {
    try {
      await supabase.rpc('reject_user', { target_user_id: id });
      setAccessRequests(prev => prev.filter(r => r.id !== id));
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) { console.error(err); }
  }, []);

  const deleteUser = useCallback(async (id: string, currentUserId?: string) => {
    if (id === currentUserId) return alert("You cannot remove your own account.");
    try {
      if (id.startsWith('inv-')) {
        await supabase.from('user_invitations').delete().eq('email', id.replace('inv-', ''));
      } else {
        const { error } = await supabase.rpc('reject_user', { target_user_id: id });
        if (error) await supabase.rpc('delete_user_completely', { target_user_id: id });
      }
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) { console.error(err); }
  }, []);

  const addDepartment = useCallback(async (dept: Omit<Department, 'id'>) => {
    try {
      const { data: newDbDept } = await supabase.from('departments').insert({ name: dept.name, description: dept.description || null, admin_id: dept.adminId || null }).select().single();
      if (newDbDept) {
        const mapped: Department = { id: newDbDept.id, name: newDbDept.name, description: newDbDept.description || '', adminId: newDbDept.admin_id };
        setDepartments(prev => [...prev.filter(d => d.id !== mapped.id), mapped]);
        return mapped;
      }
    } catch (err) { console.error(err); }
  }, []);

  const updateDepartment = useCallback(async (id: string, updates: Partial<Department>) => {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.adminId !== undefined) dbUpdates.admin_id = updates.adminId;
      await supabase.from('departments').update(dbUpdates).eq('id', id);
      setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    } catch (err) { console.error(err); }
  }, []);

  const deleteDepartment = useCallback(async (id: string) => {
    try {
      await supabase.from('departments').delete().eq('id', id);
      setDepartments(prev => prev.filter(d => d.id !== id));
    } catch (err) { console.error(err); }
  }, []);

  const addCategory = useCallback(async (cat: Omit<Category, 'id'>) => {
    try {
      const { data: newDbCat, error } = await supabase
        .from('categories')
        .insert({ 
          name: cat.name, 
          description: cat.description || null, 
          default_priority: cat.defaultPriority, 
          department_id: cat.departmentId || null 
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error adding category:', error);
        alert(`Failed to add category: ${error.message}`);
        return;
      }

      if (newDbCat) {
        const mapped: Category = { 
          id: newDbCat.id, 
          name: newDbCat.name, 
          description: newDbCat.description || '', 
          defaultPriority: newDbCat.default_priority as any, 
          departmentId: newDbCat.department_id 
        };
        setCategories(prev => [...prev.filter(c => c.id !== mapped.id), mapped]);
        return mapped;
      }
    } catch (err: any) { 
      console.error(err);
      alert(`An unexpected error occurred: ${err.message || 'Unknown error'}`);
    }
  }, []);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.defaultPriority !== undefined) dbUpdates.default_priority = updates.defaultPriority;
      if (updates.departmentId !== undefined) dbUpdates.department_id = updates.departmentId;
      
      const { error } = await supabase.from('categories').update(dbUpdates).eq('id', id);
      if (error) {
        console.error('Error updating category:', error);
        alert(`Failed to update category: ${error.message}`);
        return;
      }
      
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    } catch (err: any) { 
      console.error(err);
      alert(`An unexpected error occurred: ${err.message || 'Unknown error'}`);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) {
        console.error('Error deleting category:', error);
        alert(`Failed to delete category: ${error.message}`);
        return;
      }
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err: any) { 
      console.error(err);
      alert(`An unexpected error occurred: ${err.message || 'Unknown error'}`);
    }
  }, []);

  const updateConfig = useCallback(async (updates: Partial<SystemConfig>) => {
    try {
      const dbUpdates: any = {};
      if (updates.companyName) dbUpdates.company_name = updates.companyName;
      if (updates.systemEmail) dbUpdates.system_email = updates.systemEmail;
      if (updates.maxReopenCount !== undefined) dbUpdates.max_reopen_count = updates.maxReopenCount;
      if (updates.autoCloseAfterDays !== undefined) dbUpdates.auto_close_after_days = updates.autoCloseAfterDays;
      if (updates.notifyOnNewTicket !== undefined) dbUpdates.notify_on_new_ticket = updates.notifyOnNewTicket;
      if (updates.notifyOnEscalation !== undefined) dbUpdates.notify_on_escalation = updates.notifyOnEscalation;
      if (updates.notifyOnReopen !== undefined) dbUpdates.notify_on_reopen = updates.notifyOnReopen;
      if (updates.slaRules) dbUpdates.sla_rules = updates.slaRules;
      if (updates.urgentKeywords) dbUpdates.urgent_keywords = updates.urgentKeywords;
      if (updates.highKeywords) dbUpdates.high_keywords = updates.highKeywords;
      if (updates.mediumKeywords) dbUpdates.medium_keywords = updates.mediumKeywords;
      
      const { error } = await supabase.from('system_config').update(dbUpdates).eq('id', 1);
      if (error) {
        console.error('Error updating config:', error);
        alert(`Failed to save settings: ${error.message}`);
        return;
      }
      
      setConfig(prev => ({ ...prev, ...updates }));
    } catch (err: any) { 
      console.error(err);
      alert(`An unexpected error occurred: ${err.message || 'Unknown error'}`);
    }
  }, []);

  const addArticle = useCallback(async (article: Omit<KBArticle, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data: newDbA } = await supabase.from('kb_articles').insert({ title: article.title, content: article.content, category: article.category, department_id: article.departmentId, created_by: article.createdBy, video_url: article.videoUrl }).select().single();
      if (newDbA) {
        const mapped: KBArticle = { id: newDbA.id, title: newDbA.title, content: newDbA.content, category: newDbA.category, departmentId: newDbA.department_id, createdBy: newDbA.created_by, createdAt: newDbA.created_at, updatedAt: newDbA.updated_at, videoUrl: newDbA.video_url };
        setArticles(prev => [...prev, mapped]);
        return mapped;
      }
    } catch (err) { console.error(err); }
  }, []);

  const updateArticle = useCallback(async (id: string, updates: Partial<KBArticle>) => {
    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.content) dbUpdates.content = updates.content;
      if (updates.category) dbUpdates.category = updates.category;
      if (updates.departmentId !== undefined) dbUpdates.department_id = updates.departmentId;
      if (updates.videoUrl !== undefined) dbUpdates.video_url = updates.videoUrl;
      await supabase.from('kb_articles').update(dbUpdates).eq('id', id);
      setArticles(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: dbUpdates.updated_at } : a));
    } catch (err) { console.error(err); }
  }, []);

  const deleteArticle = useCallback(async (id: string) => {
    try {
      await supabase.from('kb_articles').delete().eq('id', id);
      setArticles(prev => prev.filter(a => a.id !== id));
    } catch (err) { console.error(err); }
  }, []);

  return (
    <DataContext.Provider value={{
      users, departments, categories, config, articles, notifications, messages, accessRequests, isLoading,
      addUser, updateUser, deleteUser, approveUser, rejectUser, addDepartment, updateDepartment, deleteDepartment,
      addCategory, updateCategory, deleteCategory, updateConfig, addArticle, updateArticle, deleteArticle,
      addNotification, markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications,
      sendMessage, markConversationAsRead, getUserById, getDepartmentById, getCategoryById, refreshSession,
      refreshData: () => fetchData(true, true)
    }}>
      {children}
    </DataContext.Provider>
  );
};
