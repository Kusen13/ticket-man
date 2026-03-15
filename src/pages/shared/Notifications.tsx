import React, { useMemo } from 'react';
import { useData } from '../../hooks/useData';
import { useAuth } from '../../hooks/useAuth';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { Bell, Trash2, CheckCircle2, MessageSquare, AlertCircle, Info, Link as LinkIcon, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const Notifications: React.FC = () => {
  const { user } = useAuth();
  const { notifications, deleteNotification, clearAllNotifications, markNotificationRead } = useData();
  const { isSupported, isSubscribed, isLoading, subscribe } = usePushNotifications();
  const navigate = useNavigate();

  const userNotifications = useMemo(() => {
    return notifications.filter(n => n.userId === user?.id).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications, user?.id]);

  const handleNotificationClick = (id: string, linkType?: string, e?: React.MouseEvent) => {
    // If they clicked the delete button, dont navigate
    if (e && (e.target as HTMLElement).closest('button')?.dataset.action === 'delete') {
      return;
    }
    markNotificationRead(id);
    if (linkType) {
      navigate(linkType);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'MENTION': return <MessageSquare size={20} className="text-blue-400" />;
      case 'NEW_TICKET': return <AlertCircle size={20} className="text-emerald-400" />;
      case 'UPDATE': return <Info size={20} className="text-violet-400" />;
      case 'OTHER': return <Bell size={20} className="text-slate-400" />;
      default: return <Bell size={20} className="text-slate-400" />;
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-20 sm:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
            <Bell className="text-violet-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              History
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold uppercase tracking-wider">
              Notification Activity
            </p>
          </div>
        </div>
        
        {userNotifications.length > 0 && (
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all your notification history?')) {
                clearAllNotifications(user.id);
              }
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/[0.03] hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/20 rounded-xl transition-all text-xs font-bold uppercase tracking-widest active:scale-95"
          >
            <Trash2 size={14} />
            Clear All
          </button>
        )}
      </div>

      {isSupported && !isSubscribed && !isLoading && (
        <div className="glass-card border border-violet-500/20 bg-violet-500/5 p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
              <Smartphone className="text-violet-400" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Stay Updated Anywhere</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Enable mobile-friendly push notifications to get alerts even when the app is closed.
              </p>
            </div>
          </div>
          <button 
            onClick={async () => {
              const success = await subscribe();
              if (success) {
                alert('🎉 Push Notifications Enabled Successfully!');
              }
            }}
            className="btn-primary py-2.5 px-6 shrink-0 shadow-[0_0_20px_rgba(139,92,246,0.2)] whitespace-nowrap"
          >
            Enable Notifications
          </button>
        </div>
      )}

      {isSupported && isSubscribed && !isLoading && (
        <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-2">
          <CheckCircle2 size={12} />
          Mobile Push Registered
        </div>
      )}

      {!isSupported && !isLoading && (
        <div className="glass-card border border-amber-500/20 bg-amber-500/5 p-4 rounded-2xl">
          <p className="text-xs text-amber-400 flex items-center gap-2">
            <AlertCircle size={14} />
            Push Notifications not supported in this browser. 
            {/iPhone|iPad|iPod/.test(navigator.userAgent) && (
              <span className="font-bold ml-1">Tip: You must "Add to Home Screen" on iOS 16.4+ for this to work.</span>
            )}
          </p>
        </div>
      )}

      <div className="glass-card overflow-hidden border-white/5">
        {userNotifications.length === 0 ? (
          <div className="text-center py-20 px-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-900/50 mb-6 border border-white/5">
              <CheckCircle2 size={40} className="text-slate-800" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 underline decoration-violet-500/30 decoration-4 underline-offset-4">Inbox Clear</h3>
            <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">
              You're all caught up! There are no new notifications waiting for your attention.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {userNotifications.map((notif) => (
              <div 
                key={notif.id}
                className={`flex items-start gap-4 p-5 sm:p-6 hover:bg-white/[0.02] transition-all group cursor-pointer relative ${
                  !notif.isRead ? 'bg-violet-500/[0.03]' : ''
                }`}
                onClick={(e) => handleNotificationClick(notif.id, notif.link, e)}
              >
                {!notif.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                )}
                
                <div className={`mt-1 shrink-0 p-2.5 rounded-xl border border-white/5 bg-slate-900/50 ${!notif.isRead ? 'ring-1 ring-violet-500/20' : ''}`}>
                  {getIcon(notif.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className={`text-sm font-bold truncate ${!notif.isRead ? 'text-white' : 'text-slate-400'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] sm:text-xs text-slate-600 font-bold uppercase tracking-tighter shrink-0 flex items-center gap-1">
                       {dayjs(notif.createdAt).fromNow()}
                    </span>
                  </div>
                  <p className={`text-xs sm:text-sm leading-relaxed line-clamp-2 ${!notif.isRead ? 'text-slate-300' : 'text-slate-500'}`}>
                    {notif.message}
                  </p>
                  
                  {notif.link && (
                    <div className="flex items-center gap-1.5 mt-3 text-[10px] font-black uppercase tracking-widest text-violet-400 hover:text-violet-300 transition-colors">
                      <LinkIcon size={12} />
                      View Impact
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2 self-center sm:self-start">
                  <button
                    data-action="delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                    className="p-3 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all active:scale-90"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
