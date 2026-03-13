import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTickets } from '../../hooks/useTickets';
import { TicketList } from '../../components/tickets/TicketList';
import { PerformanceMetrics } from '../../components/admin/PerformanceMetrics';
import { Filter, Download, Printer, Calendar } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { useNavigate } from 'react-router-dom';
import { ReportHeader } from '../../components/ui/ReportHeader';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { formatTicketId } from '../../utils/ticketUtils';

dayjs.extend(isBetween);

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { tickets } = useTickets();
  const { departments, getUserById, getCategoryById } = useData();
  const navigate = useNavigate();

  // Filter states
  const [startDate, setStartDate] = React.useState(dayjs().subtract(30, 'days').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = React.useState(dayjs().format('YYYY-MM-DD'));
  const [isExporting, setIsExporting] = React.useState(false);

  if (!user || user.role !== 'ADMIN') return null;

  // As an admin, show RESOLVED/CLOSED tickets in their department that match the date range
  const deptTickets = tickets.filter(t => {
    const isDept = t.departmentId === user.departmentId;
    const isHistory = t.status === 'RESOLVED' || t.status === 'CLOSED';
    const ticketDate = dayjs(t.createdAt);
    const isInRange = ticketDate.isBetween(dayjs(startDate).startOf('day'), dayjs(endDate).endOf('day'), null, '[]');
    return isDept && isHistory && isInRange;
  });
  
  const currentDept = departments.find(d => d.id === user.departmentId);

  const recentTickets = [...deptTickets]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);

   const handleExportExcel = () => {
    setIsExporting(true);
    // Simple CSV export
    const headers = ['Ticket ID', 'Category', 'Subject', 'Department', 'Submitted By', 'Assigned To', 'Status', 'Priority', 'Filing Time', 'Resolution Time'];
    const currentDeptName = currentDept?.name || 'Unknown';

    const rows = deptTickets.map(t => {
      const category = t.categoryId ? getCategoryById(t.categoryId) : null;
      const categoryName = category ? category.name : (t.customCategory || 'General');
      const submitterName = getUserById(t.createdBy)?.name || 'Unknown';
      const assigneeName = t.assignedTo ? (getUserById(t.assignedTo)?.name || 'Unknown') : 'Unassigned';
      const resolutionTime = (t.status === 'RESOLVED' || t.status === 'CLOSED') 
        ? dayjs(t.updatedAt).format('MM-DD-YY HH:mm') 
        : 'Pending';

      return [
        formatTicketId(t.ticketNumber || t.id),
        categoryName,
        t.title,
        currentDeptName,
        submitterName,
        assigneeName,
        t.status,
        t.priority,
        dayjs(t.createdAt).format('MM-DD-YY HH:mm'),
        resolutionTime
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Department_History_${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => setIsExporting(false), 1000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTicketClick = (id: string) => {
    navigate(`/admin/tickets/${id}`);
  };

  return (
    <div className="space-y-6">
      <ReportHeader 
        startDate={startDate} 
        endDate={endDate} 
        title={currentDept ? `${currentDept.name} Department` : 'Departmental History'} 
      />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Ticket History</h1>
          <p className="text-slate-400">View and audit all resolved and closed tickets in your department.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 no-print">
          <button 
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors border border-white/5"
          >
            <Download size={16} className={isExporting ? 'animate-bounce' : ''} />
            Export Excel
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors border border-white/5"
          >
            <Printer size={16} />
            Print PDF
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 md:p-5 no-print border-violet-500/10 overflow-hidden w-full max-w-full">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Filter size={18} />
            </div>
            <h3 className="font-semibold text-white text-sm">Report Period</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full flex-1 min-w-0 max-w-full">
            <div className="relative w-full sm:w-auto flex-1 min-w-0 max-w-full">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-9 pr-2 sm:pr-4 text-sm text-white focus:outline-none focus:border-violet-500/50 w-full transition-colors appearance-none min-w-0 max-w-full"
                title="Start Period"
              />
            </div>
            <span className="text-slate-600 hidden sm:block shrink-0">to</span>
            <div className="relative w-full sm:w-auto flex-1 min-w-0 max-w-full">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-9 pr-2 sm:pr-4 text-sm text-white focus:outline-none focus:border-violet-500/50 w-full transition-colors appearance-none min-w-0 max-w-full"
                title="End Period"
              />
            </div>
          </div>
          
          <div className="text-xs text-slate-500 italic shrink-0 w-full lg:w-auto text-left lg:text-right">
            Showing {deptTickets.length} records in this period
          </div>
        </div>
      </div>

      <div className="space-y-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <TicketList 
          title={`${currentDept?.name || 'Department'} Tickets Workflow`} 
          tickets={recentTickets} 
          onTicketClick={handleTicketClick} 
          hideDeadline={true}
        />
      </div>

      <div className="animate-slide-up no-print" style={{ animationDelay: '200ms' }}>
        <PerformanceMetrics tickets={deptTickets} departmentName={currentDept?.name} />
      </div>
    </div>
  );
};
