import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { DataProvider } from './context/DataContext';
import { TicketProvider } from './context/TicketContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { DashboardLayout } from './components/layout/DashboardLayout';

import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { EmployeeTickets } from './pages/employee/EmployeeTickets';
import { SubmitTicket } from './pages/employee/SubmitTicket';
import { AssignedTickets } from './pages/employee/AssignedTickets';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminTickets } from './pages/admin/AdminTickets';
import { TeamManagement } from './pages/admin/TeamManagement';

import { SuperAdminDashboard } from './pages/super_admin/SuperAdminDashboard';
import { SuperAdminTickets } from './pages/super_admin/SuperAdminTickets';
import { UserManagement } from './pages/super_admin/UserManagement';
import { DepartmentsManagement } from './pages/super_admin/DepartmentsManagement';
import { SystemSettings } from './pages/super_admin/SystemSettings';

import { KnowledgeBase } from './pages/shared/KnowledgeBase';
import { Messages } from './pages/shared/Messages';
import { Notifications } from './pages/shared/Notifications';
import { PendingApproval } from './pages/PendingApproval';
import { UsageReport } from './pages/shared/UsageReport';

// Quick Role Root Redirection
const RootRedirect = () => {
  const { user, isLoading } = useAuth();
  // Wait for Supabase to finish resolving session (handles OAuth redirect tokens)
  if (isLoading) return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm">Loading session...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/" replace />;
  
  // Handle unapproved users
  if (user.approvalStatus !== 'APPROVED') {
    return <Navigate to="/pending-approval" replace />;
  }
  
  return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
};

const HomeRoot = () => {
  console.log('HomeRoot Logic Running - Routing to Landing');
  const { user, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm">Loading session...</p>
      </div>
    </div>
  );
  if (!user) return <LandingPage />;
  return <RootRedirect />;
};

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <TicketProvider>
          <ThemeProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/pending-approval" element={<PendingApproval />} />
                
                <Route element={<DashboardLayout />}>
                  {/* Employee Routes */}
                  <Route path="/employee" element={<EmployeeDashboard />} />
                  <Route path="/employee/tickets" element={<EmployeeTickets />} />
                  <Route path="/employee/tickets/:id" element={<EmployeeTickets />} />
                  <Route path="/employee/history" element={<EmployeeTickets />} />
                  <Route path="/employee/history/:id" element={<EmployeeTickets />} />
                  <Route path="/employee/assigned" element={<AssignedTickets />} />
                  <Route path="/employee/submit" element={<SubmitTicket />} />
                  <Route path="/employee/kb" element={<KnowledgeBase />} />
                  <Route path="/employee/messages" element={<Messages />} />
                  <Route path="/employee/notifications" element={<Notifications />} />
                  <Route path="/employee/usage" element={<UsageReport />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/tickets" element={<AdminTickets />} />
                  <Route path="/admin/tickets/:id" element={<AdminTickets />} />
                  <Route path="/admin/assigned" element={<AssignedTickets />} />
                  <Route path="/admin/team" element={<TeamManagement />} />
                  <Route path="/admin/messages" element={<Messages />} />
                  <Route path="/admin/notifications" element={<Notifications />} />
                  <Route path="/admin/usage" element={<UsageReport />} />
                  
                  {/* Super Admin Routes */}
                  <Route path="/super_admin" element={<SuperAdminDashboard />} />
                  <Route path="/super_admin/tickets" element={<SuperAdminTickets />} />
                  <Route path="/super_admin/tickets/:id" element={<SuperAdminTickets />} />
                  <Route path="/super_admin/users" element={<UserManagement />} />
                  <Route path="/super_admin/departments" element={<DepartmentsManagement />} />
                  <Route path="/super_admin/settings" element={<SystemSettings />} />
                  <Route path="/super_admin/messages" element={<Messages />} />
                  <Route path="/super_admin/notifications" element={<Notifications />} />
                  <Route path="/super_admin/usage" element={<UsageReport />} />
                </Route>

                <Route path="/" element={<HomeRoot />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ThemeProvider>
        </TicketProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
