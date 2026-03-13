import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  Ticket, 
  LayoutDashboard, 
  Settings, 
  Users, 
  BookOpen, 
  MessageSquare, 
  LogOut,
  Building2,
  Inbox,
  Bell
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onExpand: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed, 
  onToggle, 
  onExpand,
  isMobileOpen,
  onMobileClose
}) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
      window.location.href = '/login';
    }
  };

  const getNavItems = () => {
    const items = [];

    if (user.role === 'EMPLOYEE') {
      items.push({ 
        name: 'Submit Ticket', 
        icon: MessageSquare, 
        path: '/employee' 
      });
    }

    if (user.role === 'SUPER_ADMIN') {
      items.push(
        { name: 'All Tickets', icon: Ticket, path: '/super_admin/tickets' },
        { name: 'Ticket History', icon: LayoutDashboard, path: '/super_admin' },
        { name: 'User Management', icon: Users, path: '/super_admin/users' },
        { name: 'Departments', icon: Building2, path: '/super_admin/departments' },
        { name: 'Knowledge Base', icon: BookOpen, path: '/super_admin/kb' },
        { name: 'System Settings', icon: Settings, path: '/super_admin/settings' },
        { name: 'Notifications', icon: Bell, path: '/super_admin/notifications' },
        { name: 'Messages', icon: MessageSquare, path: '/super_admin/messages' },
      );
    } else if (user.role === 'ADMIN') {
      items.push(
        { name: 'Department Tickets', icon: Ticket, path: '/admin/tickets' },
        { name: 'Ticket History', icon: LayoutDashboard, path: '/admin' },
        { name: 'Assigned To Me', icon: Inbox, path: '/admin/assigned' },
        { name: 'Team Management', icon: Users, path: '/admin/team' },
        { name: 'Notifications', icon: Bell, path: '/admin/notifications' },
        { name: 'Messages', icon: MessageSquare, path: '/admin/messages' },
      );
    } else {
      // EMPLOYEE
      items.push(
        { name: 'Recent Tickets', icon: Ticket, path: '/employee/tickets' },
        { name: 'Ticket History', icon: LayoutDashboard, path: '/employee/history' },
        { name: 'Assigned To Me', icon: Inbox, path: '/employee/assigned' },
        { name: 'Knowledge Base', icon: BookOpen, path: '/employee/kb' },
        { name: 'Notifications', icon: Bell, path: '/employee/notifications' },
        { name: 'Messages', icon: MessageSquare, path: '/employee/messages' },
      );
    }

    return items;
  };

  return (
    <aside 
      className={clsx(
        "fixed left-0 top-0 h-screen glass-panel border-r border-white/5 flex flex-col z-40 transition-all duration-300 ease-in-out select-none",
        // Mobile behavior
        isMobileOpen ? "translate-x-0 w-[280px]" : "-translate-x-full lg:translate-x-0",
        // Desktop behavior (when not mobile-hidden)
        !isMobileOpen && (isCollapsed ? "w-[80px]" : "w-[260px]")
      )}
    >
      {/* Logo Area */}
      <div 
        onClick={onToggle}
        className="h-[70px] relative flex items-center px-6 border-b border-white/5 cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.05] transition-all group overflow-hidden"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)] shrink-0 group-hover:scale-105 transition-transform">
            <Ticket size={20} className="text-white transform group-hover:rotate-12 transition-transform" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex flex-col animate-fade-in">
              <span className="font-black text-lg tracking-tight text-[var(--text-primary)] leading-none">TICKET MAN</span>
              <span className="text-[10px] text-violet-400 font-bold uppercase tracking-widest mt-0.5">Control Center</span>
            </div>
          )}
        </div>
        
        {/* Toggle trigger (desktop only) */}

      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        {(!isCollapsed || isMobileOpen) && (
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 px-3 animate-fade-in flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-violet-600"></span>
            Navigation
          </div>
        )}
        
        {getNavItems().map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => { 
                if (isCollapsed) onExpand();
                if (onMobileClose) onMobileClose();
              }}
              end={item.path.split('/').length <= 2}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group text-sm font-semibold relative mb-1",
                isActive 
                  ? "bg-gradient-to-r from-violet-600/20 to-transparent text-violet-400 shadow-[inset_1px_0_0_rgba(139,92,246,0.5)]" 
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.03]",
                (isCollapsed && !isMobileOpen) && "justify-center px-0 h-11 w-11 mx-auto"
              )}
              title={(isCollapsed && !isMobileOpen) ? item.name : ''}
            >
              <Icon size={isCollapsed && !isMobileOpen ? 20 : 18} className={clsx("transition-all group-hover:scale-110 shrink-0", 
                "group-hover:text-violet-400")} />
              {(!isCollapsed || isMobileOpen) && <span className="truncate animate-fade-in">{item.name}</span>}
              
              {/* Active Indicator Dot (Collapsed) */}
              {(isCollapsed && !isMobileOpen) && (
                <div className="absolute -right-1 top-2 bottom-2 w-[2px] bg-violet-500 rounded-full opacity-0 group-[.active]:opacity-100 transition-opacity" />
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User Profile & Logout */}
      <div className="p-4 bg-white/[0.01] border-t border-white/5">
        <div className={clsx(
          "flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5 transition-all mb-3 hover:bg-white/[0.04]",
          (isCollapsed && !isMobileOpen) && "justify-center px-0 border-transparent bg-transparent"
        )}>
          <div className="relative shrink-0">
            <img 
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=312e81&color=fff`} 
              alt={user.name} 
              className="w-9 h-9 rounded-full border border-white/10 ring-2 ring-violet-500/10"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#09090b] rounded-full"></div>
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-xs font-bold text-[var(--text-primary)] truncate leading-tight uppercase tracking-tight">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate font-semibold mt-0.5">{user.role.replace('_', ' ')}</p>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleLogout}
          className={clsx(
            "w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20",
            (isCollapsed && !isMobileOpen) && "justify-center px-0"
          )}
          title={(isCollapsed && !isMobileOpen) ? "Sign Out" : ""}
        >
          <LogOut size={16} />
          {(!isCollapsed || isMobileOpen) && <span className="animate-fade-in">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
