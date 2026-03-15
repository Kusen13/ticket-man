export type Role = 'EMPLOYEE' | 'ADMIN' | 'SUPER_ADMIN';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REOPENED' | 'RETURNED' | 'CLOSED';
export type SLAStatus = 'OK' | 'WARNING' | 'BREACHED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId?: string;
  avatar?: string;
  isOnline?: boolean;
  status?: string;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  isInvited?: boolean;
  lastActive?: string;
  createdAt?: string;
}

export interface AccessRequest {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  adminId?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  defaultPriority: Priority;
  departmentId?: string; // Optional: restrict category to a department
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; // Base64 or Blob URL for now
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber?: number;
  title: string;
  description: string;
  priority: Priority;
  status: TicketStatus;
  departmentId: string;
  categoryId?: string;
  customCategory?: string;
  attachments?: Attachment[];
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  reopenReason?: string;
  reopenCount: number;
  returnReason?: string;
  returnedBy?: string;
  returnedByName?: string;
  slaStatus?: SLAStatus;
}

export interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  mentions?: string[]; // user IDs
  readBy?: string[];   // user IDs
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'MENTION' | 'UPDATE' | 'NEW_TICKET' | 'OTHER';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string; // To group messages
  senderId: string;
  receiverId?: string; // Optional if sending to a group/department
  content: string;
  attachments?: Attachment[];
  isRead: boolean;
  createdAt: string;
}

export interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  departmentId?: string; // null means global
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  videoUrl?: string;
}

export interface SLARule {
  priority: Priority;
  responseHours: number;
  resolutionHours: number;
}

export interface SystemConfig {
  companyName: string;
  systemEmail: string;
  maxReopenCount: number;
  autoCloseAfterDays: number;
  notifyOnNewTicket: boolean;
  notifyOnEscalation: boolean;
  notifyOnReopen: boolean;
  slaRules: SLARule[];
  urgentKeywords: string[];
  highKeywords: string[];
  mediumKeywords: string[];
  maxNotificationsHistory?: number;
  quotaTicketsEmployee: number;
  quotaTicketsAdmin: number;
  quotaCommentsEmployee: number;
  quotaCommentsAdmin: number;
  quotaMessagesEmployee: number;
  quotaMessagesAdmin: number;
  quotaStorageEmployeeMb: number;
  quotaStorageAdminMb: number;
  quotaStorageSuperMb: number;
  aiEnabled?: boolean;
  aiModel?: string;
  aiMaxMsgsPerDay?: number;
  aiMaxMsgsAdminDay?: number;
}

export interface AIPriorityResult {
  priority: Priority;
  confidence: number;
  reasoning: string;
}

export interface AIChatMessage {
  id: string;
  user_id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens_used: number;
  feedback?: 1 | -1 | null;
  created_at: string;
}

export interface AIUsage {
  user_id: string;
  period: string;
  messages_sent: number;
  tokens_used: number;
}

export interface AIChatRequest {
  message: string;
  session_id: string;
  kb_articles?: KBArticle[];
  trends_summary?: string[];
}

export interface AIChatResponse {
  message: string;
  tokens_used: number;
  usage: {
    used: number;
    limit: number;
  };
}
