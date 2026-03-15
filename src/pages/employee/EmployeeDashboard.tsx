import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTickets } from '../../hooks/useTickets';
import { TicketList } from '../../components/tickets/TicketList';
import { TicketForm } from '../../components/tickets/TicketForm';
import { UsagePanel } from '../../components/dashboard/UsagePanel';
import { useNavigate } from 'react-router-dom';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { tickets } = useTickets();
  const navigate = useNavigate();

  if (!user) return null;

  const activeTickets = tickets.filter(t => 
    t.createdBy === user.id && 
    t.status !== 'RESOLVED' && 
    t.status !== 'CLOSED'
  );

  const recentTickets = activeTickets
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const handleTicketClick = (id: string) => {
    navigate(`/employee/tickets/${id}`);
  };

  return (
    <div className="space-y-8">
      {/* Usage Panel */}
      <div className="animate-slide-up">
        <UsagePanel />
      </div>
      {/* Primary Action: Ticket Submission - Now first section */}
      <div className="animate-slide-up">
        <TicketForm />
      </div>

      {/* Secondary Section: Recent Activity - Now Full Width */}
      <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <TicketList 
          title="Recent Tickets" 
          tickets={recentTickets} 
          onTicketClick={handleTicketClick} 
        />
      </div>
    </div>
  );
};
