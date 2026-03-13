import dayjs from 'dayjs';
import { Priority, Ticket, SLARule, SLAStatus } from '../types';

/**
 * Calculates the resolution deadline based on priority and creation time.
 */
export const calculateDeadline = (priority: Priority, createdAt: string, rules: SLARule[]): string => {
  if (!rules || rules.length === 0) {
    // Default to 72 hours if no SLA rules are configured
    return dayjs(createdAt).add(72, 'hour').toISOString();
  }
  const rule = rules.find(r => r.priority === priority) || rules[rules.length - 1];
  return dayjs(createdAt).add(rule.resolutionHours, 'hour').toISOString();
};

/**
 * Checks if a ticket is resolved on time.
 */
export const isResolvedOnTime = (ticket: Ticket): boolean => {
  if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') return false;
  if (!ticket.deadline) return true; // Fallback if no deadline set
  return dayjs(ticket.updatedAt).isBefore(dayjs(ticket.deadline));
};

/**
 * Checks if an open ticket is currently overdue.
 */
export const isOverdue = (ticket: Ticket): boolean => {
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') return false;
  if (!ticket.deadline) return false;
  return dayjs().isAfter(dayjs(ticket.deadline));
};

/**
 * Determines SLA status based on current time and deadline
 */
export const getSLAStatus = (deadline: string | undefined, status: string): SLAStatus => {
  if (!deadline || status === 'RESOLVED' || status === 'CLOSED') return 'OK';
  
  const now = dayjs();
  const target = dayjs(deadline);
  
  if (now.isAfter(target)) return 'BREACHED';
  
  // Warning if less than 25% of time remains or less than 2 hours
  const diffHours = target.diff(now, 'hour', true);
  if (diffHours < 2) return 'WARNING';
  
  return 'OK';
};
