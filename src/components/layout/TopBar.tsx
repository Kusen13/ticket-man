import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, CheckCircle2, AlertCircle, MessageSquare, Info, Menu, RefreshCw, Sun, Moon, Ticket as TicketIcon } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTickets } from '../../hooks/useTickets';
import { useTheme } from '../../context/ThemeContext';
import { Ticket, Notification } from '../../types';
import clsx from 'clsx';

dayjs.extend(relativeTime);

interface TopBarProps {
  isCollapsed: boolean;
  onOpenMobileMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ isCollapsed, onOpenMobileMenu }) => {
  const { user } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead, refreshData } = useData();
  const { refreshTickets } = useTickets();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; title: string; type: 'ticket' | 'page'; path: string; ticketNumber?: string }[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { tickets } = useTickets();

  useEffect(() => {
    if (!searchQuery.trim() || !user) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    
    // Search in tickets
    const matchedTickets = (tickets as Ticket[])
      .filter(t => 
        t.title.toLowerCase().includes(query) || 
        (t.ticketNumber && String(t.ticketNumber).toLowerCase().includes(query)) ||
        t.id.toLowerCase().includes(query)
      )
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        title: t.title,
        type: 'ticket' as const,
        path: `/${user.role.toLowerCase()}/tickets/${t.id}`,
        ticketNumber: t.ticketNumber ? `TKT-${String(t.ticketNumber).padStart(5, '0')}` : undefined
      }));

    setSearchResults(matchedTickets);
  }, [searchQuery, tickets, user?.role]);

  if (!user) return null;

  const userNotifications = notifications.filter(n => n.userId === user.id);
  const unreadNotifications = userNotifications.filter(n => !n.isRead).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unreadCount = unreadNotifications.length;

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.isRead) markNotificationRead(notif.id);
    setShowNotifications(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleSync = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        refreshData(),
        refreshTickets()
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'MENTION': return <MessageSquare size={16} className="text-violet-400" />;
      case 'NEW_TICKET': return <AlertCircle size={16} className="text-rose-400" />;
      case 'UPDATE': return <CheckCircle2 size={16} className="text-emerald-400" />;
      default: return <Info size={16} className="text-blue-400" />;
    }
  };

  const handleSearchResultClick = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <header className={clsx(
      "fixed top-0 right-0 h-[70px] glass-panel border-b border-white/5 z-30 flex items-center justify-between px-4 md:px-8 transition-all duration-300",
      "w-full lg:w-auto",
      isCollapsed ? "lg:left-[80px]" : "lg:left-[260px]"
    )}>
      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-400 hover:text-[var(--text-primary)] hover:bg-white/5 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        
        <div className="hidden sm:block flex-1 max-w-md min-w-[200px]" ref={searchRef}>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-violet-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full bg-[var(--input-bg)] border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
            />

            {/* Search Results Dropdown */}
            {showSearchResults && searchQuery.trim() !== '' && searchResults.length > 0 && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full glass-panel border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-fade-in origin-top">
                <div className="p-2 divide-y divide-white/5">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSearchResultClick(result.path)}
                      className="w-full text-left p-3 hover:bg-white/[0.05] transition-colors flex items-center gap-3 group rounded-lg"
                    >
                      <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-violet-400 group-hover:bg-violet-400/10 transition-colors">
                        <TicketIcon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-violet-400 font-mono mb-0.5">
                          {result.ticketNumber || `#${result.id.slice(0, 8)}`}
                        </div>
                        <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {result.title}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 relative" ref={dropdownRef}>
        <button 
          onClick={handleSync}
          disabled={isRefreshing}
          className={`p-2 transition-all rounded-full text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`}
          title="Manual Sync"
        >
          <RefreshCw size={18} />
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-full transition-all"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className={`relative p-2 transition-colors rounded-full ${showNotifications ? 'bg-white/10 text-[var(--text-primary)]' : 'text-slate-400 hover:text-[var(--text-primary)] hover:bg-white/5'}`}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse"></span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute top-[calc(100%+8px)] right-0 w-80 glass-panel border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-fade-in origin-top-right">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="font-semibold text-[var(--text-primary)]">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAllNotificationsRead(user.id)}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors bg-violet-400/10 px-2 py-1 rounded"
                >
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              {unreadNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <CheckCircle2 size={24} className="mx-auto mb-3 text-emerald-500/50" />
                  <p className="text-sm">You have no unread notifications.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {unreadNotifications.map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className="w-full text-left p-4 hover:bg-white/[0.03] transition-colors flex gap-3 bg-indigo-500/[0.03]"
                    >
                      <div className="mt-0.5 p-2 rounded-full shrink-0 bg-white/10">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {notif.title}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {notif.message}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-wider">
                          {dayjs(notif.createdAt).fromNow()}
                        </div>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0 mt-2 shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-white/5 bg-slate-900/50 text-center">
              <button 
                onClick={() => {
                  setShowNotifications(false);
                  navigate(`/${user.role.toLowerCase()}/notifications`);
                }}
                className="text-xs font-medium text-slate-300 hover:text-[var(--text-primary)] transition-colors"
              >
                View all notifications
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
