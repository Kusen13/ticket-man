import { Message } from '../types';
import dayjs from 'dayjs';

const now = dayjs();

export const mockMessages: Message[] = [
  {
    id: 'msg_1',
    conversationId: 'conv_1',
    senderId: 'usr_4',
    receiverId: 'usr_2',
    content: 'Hi John, the VPN is still dropping every 5 minutes.',
    isRead: true,
    createdAt: now.subtract(45, 'minute').toISOString()
  },
  {
    id: 'msg_2',
    conversationId: 'conv_1',
    senderId: 'usr_2',
    receiverId: 'usr_4',
    content: 'I see the ticket. We are investigating a router issue. Try connecting to US-West in the meantime.',
    isRead: false,
    createdAt: now.subtract(10, 'minute').toISOString()
  }
];
