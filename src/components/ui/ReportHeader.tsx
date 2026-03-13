import React from 'react';
import dayjs from 'dayjs';

interface ReportHeaderProps {
  startDate: string;
  endDate: string;
  title?: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ startDate, endDate, title }) => {
  return (
    <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-tighter">Ticket Man</h1>
          <p className="text-sm text-slate-600 mt-1 font-medium italic">
            Official System Report - {title || 'Departmental Records'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Report Period</div>
          <div className="text-lg font-semibold text-slate-800">
            {dayjs(startDate).format('MMM DD, YYYY')} — {dayjs(endDate).format('MMM DD, YYYY')}
          </div>
        </div>
      </div>
    </div>
  );
};
