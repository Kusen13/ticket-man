/**
 * Formats a raw sequential ticket ID into a standardized display format: TKT-00001
 * Handles ids like tkt_1, tkt_5, etc.
 */
export const formatTicketId = (id: string | number | undefined): string => {
  if (!id) return 'TKT-00000';
  
  if (typeof id === 'number') {
    return `TKT-${String(id).padStart(5, '0')}`;
  }

  // Handle strings that might just be numeric IDs
  if (/^\d+$/.test(id)) {
    return `TKT-${id.padStart(5, '0')}`;
  }

  // Match old mock ids like tkt_1, tkt_12, tkt_100
  const m = id.match(/^tkt_(\d+)$/i);
  if (m) {
    return `TKT-${m[1].padStart(5, '0')}`;
  }
  
  // Fallback for UUIDs (if ticketNumber is missing, although it shouldn't be anymore)
  return `TKT-${id.toUpperCase().slice(0, 5)}`;
};
