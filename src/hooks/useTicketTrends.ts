import { useMemo } from 'react';
import { useTickets } from './useTickets';
import { useData } from './useData';
import { Ticket } from '../types';

interface TrendItem {
  category: string;
  count: number;
  percentage: number;
}

export const useTicketTrends = (daysBack: number = 30) => {
  const { tickets } = useTickets();
  const { getCategoryById } = useData();

  const trends = useMemo((): TrendItem[] => {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    const recentTickets = tickets.filter((t: Ticket) => 
      new Date(t.createdAt) >= cutoffDate
    );

    const counts: Record<string, number> = {};
    recentTickets.forEach((t: Ticket) => {
      const catName = t.categoryId ? getCategoryById(t.categoryId)?.name : (t.customCategory || 'General');
      if (catName) {
        counts[catName] = (counts[catName] || 0) + 1;
      }
    });

    const total = recentTickets.length || 1;
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / total) * 100),
      }));
  }, [tickets, getCategoryById, daysBack]);

  const topCategory = trends[0]?.category || null;

  return {
    trends,
    topCategory,
  };
};
