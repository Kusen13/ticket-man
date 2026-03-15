import { useMemo } from 'react';
import { useTickets } from './useTickets';
import { useData } from './useData';
import { Ticket } from '../types';

interface TrendItem {
  category: string;
  count: number;
  percentage: number;
  sampleTitles: string[];
  sampleDescriptions: string;
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

    const categoryData: Record<string, { count: number; titles: Set<string>; descriptions: string[] }> = {};
    
    recentTickets.forEach((t: Ticket) => {
      const catName = t.categoryId ? getCategoryById(t.categoryId)?.name : (t.customCategory || 'General');
      if (catName) {
        if (!categoryData[catName]) {
          categoryData[catName] = { count: 0, titles: new Set(), descriptions: [] };
        }
        categoryData[catName].count += 1;
        categoryData[catName].titles.add(t.title);
        if (t.description) categoryData[catName].descriptions.push(t.description);
      }
    });

    const total = recentTickets.length || 1;
    return Object.entries(categoryData)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([category, data]) => ({
        category,
        count: data.count,
        percentage: Math.round((data.count / total) * 100),
        sampleTitles: Array.from(data.titles).slice(0, 3),
        sampleDescriptions: data.descriptions.slice(0, 2).join(' | '),
      }));
  }, [tickets, getCategoryById, daysBack]);


  const topCategory = trends[0]?.category || null;

  return {
    trends,
    topCategory,
  };
};
