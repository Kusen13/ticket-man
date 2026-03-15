export const AI_CONFIG = {
  MAX_MESSAGE_LENGTH: 400,
  MAX_CONVERSATION_TURNS: 10,
  DEFAULT_EMPLOYEE_LIMIT: 20,
  DEFAULT_ADMIN_LIMIT: 40,
  DEFAULT_MODEL: 'llama-3.3-70b-versatile',
  GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions',
};

export const AI_COLOR_STATES = {
  NORMAL: { color: 'bg-violet-500', threshold: 59, label: 'N messages remaining today' },
  WARNING: { color: 'bg-amber-500', threshold: 79, label: 'Getting close to your daily limit' },
  DANGER: { color: 'bg-orange-500', threshold: 94, label: 'Almost at your limit' },
  EXHAUSTED: { color: 'bg-rose-500', threshold: 100, label: 'Limit reached — resets at midnight' },
};

export const getAIUsageColor = (percentage: number): string => {
  if (percentage >= 95) return AI_COLOR_STATES.EXHAUSTED.color;
  if (percentage >= 80) return AI_COLOR_STATES.DANGER.color;
  if (percentage >= 60) return AI_COLOR_STATES.WARNING.color;
  return AI_COLOR_STATES.NORMAL.color;
};

export const getAILabel = (percentage: number): string => {
  if (percentage >= 95) return AI_COLOR_STATES.EXHAUSTED.label;
  if (percentage >= 80) return AI_COLOR_STATES.DANGER.label;
  if (percentage >= 60) return AI_COLOR_STATES.WARNING.label;
  return AI_COLOR_STATES.NORMAL.label;
};
