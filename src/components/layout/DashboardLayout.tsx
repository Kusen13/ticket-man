import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import clsx from 'clsx';

export const DashboardLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06060b]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
          <p className="text-violet-400 text-sm font-medium animate-pulse">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.approvalStatus !== 'APPROVED') {
    return <Navigate to="/pending-approval" replace />;
  }

  return (
    <div className="min-h-screen bg-[#06060b] text-slate-200 font-sans flex overflow-x-hidden">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        onExpand={() => setIsSidebarCollapsed(false)}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar 
          isCollapsed={isSidebarCollapsed} 
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        
        {/* Main Content Area */}
        <main className={clsx(
          "pt-[70px] min-h-screen transition-all duration-300",
          !isMobileMenuOpen && (isSidebarCollapsed ? "lg:pl-[80px]" : "lg:pl-[260px]")
        )}>
          <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};
