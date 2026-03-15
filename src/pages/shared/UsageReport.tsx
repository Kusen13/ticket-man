import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UsagePanel } from '../../components/dashboard/UsagePanel';
import { SystemUsagePanel } from '../../components/dashboard/SystemUsagePanel';
import { Activity } from 'lucide-react';

export const UsageReport: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <Activity className="text-violet-400" /> Usage & Quotas
        </h1>
        <p className="text-slate-400">Monitor your resource consumption against your monthly limits.</p>
      </div>

      <div className="space-y-6">
        <UsagePanel />
        
        {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
          <SystemUsagePanel />
        )}
      </div>
    </div>
  );
};
