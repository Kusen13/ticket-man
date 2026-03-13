import { User } from '../types';

export const mockUsers: User[] = [
  {
    id: 'usr_1',
    name: 'Sarah Connor',
    email: 'admin@fastservices.com',
    role: 'SUPER_ADMIN',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Connor&background=8b5cf6&color=fff'
  },
  {
    id: 'usr_2',
    name: 'John Doe',
    email: 'it.admin@fastservices.com',
    role: 'ADMIN',
    departmentId: 'dept_1', // IT
    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=22d3ee&color=fff'
  },
  {
    id: 'usr_3',
    name: 'Jane Smith',
    email: 'hr.admin@fastservices.com',
    role: 'ADMIN',
    departmentId: 'dept_2', // HR
    avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=f43f5e&color=fff'
  },
  {
    id: 'usr_4',
    name: 'Alice Johnson',
    email: 'alice@fastservices.com',
    role: 'EMPLOYEE',
    avatar: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=34d399&color=fff'
  },
  {
    id: 'usr_5',
    name: 'Bob Williams',
    email: 'bob@fastservices.com',
    role: 'EMPLOYEE',
    avatar: 'https://ui-avatars.com/api/?name=Bob+Williams&background=a78bfa&color=fff'
  }
];
