import { Department } from '../types';

export const mockDepartments: Department[] = [
  {
    id: 'dept_1',
    name: 'IT Support',
    description: 'Hardware, software, network, and access issues',
    adminId: 'usr_2'
  },
  {
    id: 'dept_2',
    name: 'Human Resources',
    description: 'Payroll, benefits, leaves, and employee relations',
    adminId: 'usr_3'
  },
  {
    id: 'dept_3',
    name: 'Facilities',
    description: 'Building maintenance, office supplies, working environment',
  },
  {
    id: 'dept_4',
    name: 'Finance',
    description: 'Expenses, budget approvals, and reimbursements',
  },
  {
    id: 'dept_5',
    name: 'Operations',
    description: 'Process improvements, internal tools, logistics',
  }
];
