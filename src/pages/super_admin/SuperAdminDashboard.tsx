import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTickets } from '../../hooks/useTickets';
import { useData } from '../../hooks/useData';
import { TicketList } from '../../components/tickets/TicketList';
import { PerformanceMetrics } from '../../components/admin/PerformanceMetrics';
import { Building2, Filter, Download, Printer, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReportHeader } from '../../components/ui/ReportHeader';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { formatTicketId } from '../../utils/ticketUtils';

dayjs.extend(isBetween);

export const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { tickets } = useTickets();
  const { departments, getUserById, getCategoryById } = useData();
  const navigate = useNavigate();

  // Filter states
  const [startDate, setStartDate] = React.useState(dayjs().subtract(30, 'days').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = React.useState(dayjs().format('YYYY-MM-DD'));
  const [selectedDept, setSelectedDept] = React.useState<string>('all');
  const [isExporting, setIsExporting] = React.useState(false);

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  // Filter tickets by date range and department
    const filteredTickets = tickets.filter(t => {
      const ticketDate = dayjs(t.createdAt);
      const isInRange = ticketDate.isBetween(dayjs(startDate).startOf('day'), dayjs(endDate).endOf('day'), null, '[]');
      const isDeptMatch = selectedDept === 'all' || t.departmentId === selectedDept;
      const isResolved = t.status === 'RESOLVED' || t.status === 'CLOSED';
      return isInRange && isDeptMatch && isResolved;
    });

  const recentTickets = [...filteredTickets]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);

   const handleExportExcel = () => {
    setIsExporting(true);
    const headers = ['Ticket ID', 'Category', 'Subject', 'Department', 'Submitted By', 'Assigned To', 'Status', 'Priority', 'Filing Time', 'Resolution Time'];
    
    const rows = filteredTickets.map(t => {
      const deptName = departments.find(d => d.id === t.departmentId)?.name || 'Unknown';
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
        deptName,
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
    link.setAttribute('download', `System_Report_${dayjs().format('YYYY-MM-DD')}.csv`);
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
    navigate(`/super_admin/tickets/${id}`);
  };

  return (
    <div className="space-y-6">
      <ReportHeader 
        startDate={startDate} 
        endDate={endDate} 
        title="Global Operations Report" 
      />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Ticket History</h1>
          <p className="text-slate-400">View and audit all resolved and closed tickets across the system.</p>
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
      <div className="glass-card p-5 no-print border-violet-500/10">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Filter size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">System Filters</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Report Configuration</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
            {/* Dept Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Building2 size={12} /> Department
              </label>
              <select 
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-violet-500/50 appearance-none"
              >
                <option value="all" className="bg-slate-900">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Calendar size={12} /> Start Period
              </label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Calendar size={12} /> End Period
              </label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>
          
          <div className="lg:text-right shrink-0">
            <div className="text-xl font-bold text-white">{filteredTickets.length}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Matching Items</div>
          </div>
        </div>
      </div>

      <div className="space-y-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <TicketList 
          // title="Global Recent Tickets" 
          tickets={recentTickets} 
          onTicketClick={handleTicketClick} 
          hideDeadline={true}
        />
      </div>

      <div className="animate-slide-up no-print" style={{ animationDelay: '200ms' }}>
        <PerformanceMetrics 
          tickets={filteredTickets} 
          departmentName={selectedDept === 'all' ? 'All Departments' : departments.find(d => d.id === selectedDept)?.name} 
        />
      </div>
    </div>
  );
};
