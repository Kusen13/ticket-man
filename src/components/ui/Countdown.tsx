import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { getSLAStatus } from '../../lib/sla';
import { clsx } from 'clsx';

dayjs.extend(duration);

interface CountdownProps {
  deadline: string | undefined;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  size?: 'sm' | 'md';
}

export const Countdown: React.FC<CountdownProps> = ({ 
  deadline, 
  status, 
  createdAt, 
  updatedAt,
  size = 'md'
}) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [slaStatus, setSlaStatus] = useState<'OK' | 'WARNING' | 'BREACHED'>('OK');

  useEffect(() => {
    if (!deadline || status === 'RESOLVED' || status === 'CLOSED') {
      setTimeLeft(null);
      return;
    }

    const timer = setInterval(() => {
      const target = dayjs(deadline);
      const now = dayjs();
      const diff = target.diff(now);
      const currentSla = getSLAStatus(deadline, status);
      setSlaStatus(currentSla);

      if (diff <= 0) {
        setTimeLeft('OVERDUE');
      } else {
        const dur = dayjs.duration(diff);
        const days = Math.floor(dur.asDays());
        const hours = dur.hours();
        const mins = dur.minutes();
        const secs = dur.seconds();

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${mins}m`);
        } else {
          setTimeLeft(`${mins}m ${secs}s`);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, status]);

  if (status === 'RESOLVED' || status === 'CLOSED') {
    const start = dayjs(createdAt);
    const end = dayjs(updatedAt);
    const diff = end.diff(start);
    const dur = dayjs.duration(diff);
    const totalHours = Math.floor(dur.asHours());
    const mins = dur.minutes();
    
    let timeStr = totalHours === 0 ? `${mins}m` : `${totalHours}h ${mins}m`;
    if (totalHours > 24) {
      const d = Math.floor(totalHours / 24);
      const h = totalHours % 24;
      timeStr = `${d}d ${h}h`;
    }

    return (
      <div className={clsx(
        "flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 rounded-md border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)] group/sla",
        size === 'sm' ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
      )}>
        <CheckCircle2 size={size === 'sm' ? 10 : 12} className="group-hover/sla:scale-110 transition-transform text-emerald-500" />
        {timeStr}
      </div>
    );
  }

  if (!deadline) return <span className="text-slate-600 italic text-[11px]">No Deadline</span>;

  const colorClass = 
    slaStatus === 'BREACHED' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]' :
    slaStatus === 'WARNING' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse' :
    'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';

  return (
    <div className={clsx(
      "flex items-center gap-1.5 rounded-md border font-mono font-bold w-fit whitespace-nowrap",
      size === 'sm' ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
      colorClass
    )}>
      {slaStatus === 'BREACHED' ? <AlertCircle size={size === 'sm' ? 10 : 12} /> : <Clock size={size === 'sm' ? 10 : 12} />}
      {timeLeft || '---'}
    </div>
  );
};
