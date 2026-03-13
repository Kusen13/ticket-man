import React from 'react';
import { TicketForm } from '../../components/tickets/TicketForm';

export const SubmitTicket: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Submit a Ticket</h1>
        <p className="text-slate-400">Describe your issue and our Smart AI will automatically detect the priority.</p>
      </div>

      <TicketForm />
    </div>
  );
};
