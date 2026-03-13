import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTickets } from '../../hooks/useTickets';
import { useAuth } from '../../hooks/useAuth';
import { TicketList } from '../../components/tickets/TicketList';
import { TicketDetail } from '../../components/tickets/TicketDetail';

export const EmployeeTickets: React.FC = () => {
  const { id } = useParams();
  const { tickets, deleteTicket } = useTickets();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  // View specific detail
  if (id) {
    return <TicketDetail />;
  }

  const isHistory = location.pathname.includes('/history');
  
  // View list
  const userTickets = tickets.filter(t => t.createdBy === user.id);
  
  const filteredTickets = userTickets
    .filter(t => {
      if (isHistory) {
        return t.status === 'RESOLVED' || t.status === 'CLOSED';
      } else {
        return t.status !== 'RESOLVED' && t.status !== 'CLOSED';
      }
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          {isHistory ? 'Ticket History' : 'Recent Tickets'}
        </h1>
        <p className="text-slate-400">
          {isHistory 
            ? 'View all your resolved and closed support requests.' 
            : 'View and manage your active support requests.'}
        </p>
      </div>
      
      <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <TicketList 
          tickets={filteredTickets} 
          onTicketClick={(ticketId) => navigate(`${location.pathname}/${ticketId}`)}
          onDeleteTicket={async (ticketId) => await deleteTicket(ticketId)}
          hideDeadline={isHistory}
        />
      </div>
    </div>
  );
};
