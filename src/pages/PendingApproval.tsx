import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Loader2, Clock, XCircle } from 'lucide-react';

export const PendingApproval: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect if approved while on this page
  useEffect(() => {
    if (user?.approvalStatus === 'APPROVED') {
      navigate('/', { replace: true });
    }
  }, [user?.approvalStatus, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-[#06060b] text-slate-200 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card p-8 border-violet-500/20 text-center space-y-6">
        <div className="flex justify-center">
          {user?.approvalStatus === 'REJECTED' ? (
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
              <XCircle size={32} />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <Clock size={32} className="animate-pulse" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {user?.approvalStatus === 'REJECTED' ? 'Access Denied' : 'Approval Pending'}
          </h1>
          <p className="text-slate-400">
            {user?.approvalStatus === 'REJECTED' 
              ? 'Your account request has been declined by the administrator.'
              : 'Your account is currently waiting for Super Admin approval before you can access the dashboard.'}
          </p>
        </div>

        <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 text-sm text-slate-300">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-xs uppercase font-semibold">Logged in as</span>
            <span className="font-medium text-violet-400">{user?.email}</span>
          </div>
        </div>

        {user?.approvalStatus !== 'REJECTED' && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 italic">
            <Loader2 size={14} className="animate-spin" />
            <span>Please check back later...</span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all duration-200 border border-white/5"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};
