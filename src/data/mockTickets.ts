import { Ticket } from '../types';
import dayjs from 'dayjs';

const now = dayjs();

export const mockTickets: Ticket[] = [
  {
    id: 'tkt_1',
    title: 'Cannot access production database',
    description: 'I keep getting connection timeouts when trying to query the main production replica.',
    priority: 'URGENT',
    status: 'OPEN',
    departmentId: 'dept_1',
    createdBy: 'usr_4',
    createdAt: now.subtract(2, 'hour').toISOString(),
    updatedAt: now.subtract(2, 'hour').toISOString(),
    reopenCount: 0
  },
  {
    id: 'tkt_2',
    title: 'Update payroll details',
    description: 'Need to update my bank account information for the next payroll cycle.',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    departmentId: 'dept_2',
    createdBy: 'usr_5',
    assignedTo: 'usr_3',
    createdAt: now.subtract(1, 'day').toISOString(),
    updatedAt: now.subtract(12, 'hour').toISOString(),
    reopenCount: 0
  },
  {
    id: 'tkt_3',
    title: 'Need new ergonomic chair',
    description: 'My current chair is broken and causing severe back pain. Requesting a replacement.',
    priority: 'HIGH',
    status: 'OPEN',
    departmentId: 'dept_3',
    createdBy: 'usr_4',
    createdAt: now.subtract(3, 'day').toISOString(),
    updatedAt: now.subtract(3, 'day').toISOString(),
    reopenCount: 0
  },
  {
    id: 'tkt_4',
    title: 'Figma license request',
    description: 'I need a Figma Pro license for the upcoming design sprint.',
    priority: 'LOW',
    status: 'RESOLVED',
    departmentId: 'dept_1',
    createdBy: 'usr_5',
    assignedTo: 'usr_2',
    createdAt: now.subtract(5, 'day').toISOString(),
    updatedAt: now.subtract(2, 'day').toISOString(),
    reopenCount: 0
  },
  {
    id: 'tkt_5',
    title: 'VPN connection failing repeatedly',
    description: 'VPN drops every 5 minutes making it impossible to work from home.',
    priority: 'HIGH',
    status: 'REOPENED',
    departmentId: 'dept_1',
    createdBy: 'usr_4',
    assignedTo: 'usr_2',
    createdAt: now.subtract(1, 'week').toISOString(),
    updatedAt: now.subtract(1, 'hour').toISOString(),
    reopenReason: 'The issue started happening again this morning.',
    reopenCount: 1
  }
];
