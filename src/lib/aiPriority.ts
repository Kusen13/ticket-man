import { AIPriorityResult } from '../types';

const URGENT_KEYWORDS = [
  'down', 'outage', 'emergency', 'critical', 'cannot work', 'security breach', 'data loss', 'production', 'crash', 
  'smoke', 'fire', 'explosion', 'leak', 'flooding', 'blackout', 'power failure', 'emergency', 'hacked', 'data leak',
  'major bug', 'system down', 'stopped working', 'blocked', 'cannot log in', 'unauthorized', 'suspicious'
];
const HIGH_KEYWORDS = [
  'broken', 'error', 'failing', 'blocked', 'deadline', 'not working', 'urgent', 'asap', 'soon', 'important', 
  'hardware failure', 'monitor', 'printer down', 'blue screen', 'corrupted', 'missing', 'denied', 'payroll',
  'salary', 'bonus', 'hmo', 'medical', 'insurance', 'safety', 'injury'
];
const MEDIUM_KEYWORDS = [
  'slow', 'issue', 'problem', 'intermittent', 'workaround', 'delay', 'glitch', 'performance', 'sync',
  'email', 'outlook', 'vpn', 'license', 'software', 'update', 'reboot', 'restart', 'noisy', 'broken chair',
  'light bulb', 'not cooling', 'leaking faucet'
];
const LOW_KEYWORDS = [
  'request', 'question', 'suggestion', 'improvement', 'nice to have', 'when possible', 'general', 'info',
  'how to', 'training', 'tutorial', 'seminar', 'feedback', 'stationary', 'pantry', 'supplies', 'coffee',
  'water', 'parking', 'badge', 'id', 'new hire', 'onboarding'
];

export interface PriorityKeywords {
  urgent: string[];
  high: string[];
  medium: string[];
  low?: string[];
}

export const analyzePriority = (title: string, description: string, customKeywords?: PriorityKeywords): AIPriorityResult => {
  const text = `${title} ${description}`.toLowerCase();
  
  const URGENT = customKeywords?.urgent || URGENT_KEYWORDS;
  const HIGH = customKeywords?.high || HIGH_KEYWORDS;
  const MEDIUM = customKeywords?.medium || MEDIUM_KEYWORDS;
  const LOW = customKeywords?.low || LOW_KEYWORDS;

  const matches = (keywords: string[]) => keywords.some(kw => text.includes(kw.toLowerCase()));

  if (matches(URGENT)) {
    return {
      priority: 'URGENT',
      confidence: 90 + Math.floor(Math.random() * 10),
      reasoning: 'Detected critical keywords related to system outages or severe blockers.'
    };
  }
  
  if (matches(HIGH)) {
    return {
      priority: 'HIGH',
      confidence: 80 + Math.floor(Math.random() * 10),
      reasoning: 'Detected keywords indicating functionality is broken or causing significant blockages.'
    };
  }
  
  if (matches(MEDIUM)) {
    return {
      priority: 'MEDIUM',
      confidence: 70 + Math.floor(Math.random() * 10),
      reasoning: 'Issue appears to be a standard problem or performance degradation.'
    };
  }
  
  if (matches(LOW)) {
    return {
      priority: 'LOW',
      confidence: 85 + Math.floor(Math.random() * 10),
      reasoning: 'Detected keywords suggesting a general request, question, or non-critical improvement.'
    };
  }

  // Default fallback if no keywords match strictly
  return {
    priority: 'LOW',
    confidence: 60,
    reasoning: 'Insufficient high-priority keywords detected. Defaulting to Low priority for triage.'
  };
};

/**
 * Suggests a category based on the text provided.
 * Helps the system classify custom user inputs.
 */
export const suggestCategory = (text: string, categories: any[]): string | null => {
  const input = text.toLowerCase();
  
  // Mapping of keywords to internal category names (partial matches)
  const mapping: Record<string, string[]> = {
    'hardware': ['laptop', 'computer', 'pc', 'monitor', 'keyboard', 'mouse', 'printer', 'scanner', 'hardware'],
    'software': ['bug', 'crash', 'glitch', 'error', 'software', 'app', 'application'],
    'network': ['wifi', 'internet', 'connection', 'network', 'outage', 'slow', 'vpn', 'router'],
    'access': ['password', 'login', 'account', 'access', 'reset', 'permissions', 'locked'],
    'payroll': ['salary', 'pay', 'bonus', 'deduction', 'slip', 'payroll'],
    'leave': ['vacation', 'sick', 'leave', 'absence', 'holiday', 'time off'],
    'facilities': ['aircon', 'a/c', 'light', 'water', 'leak', 'toilet', 'cleanup', 'janitorial', 'desk', 'chair'],
    'security': ['breach', 'lost', 'stolen', 'unauthorized', 'suspicious', 'badge', 'security']
  };

  for (const [catName, keywords] of Object.entries(mapping)) {
    if (keywords.some(kw => input.includes(kw))) {
      // Find the first category that matches the general name
      const match = categories.find(c => c.name.toLowerCase().includes(catName));
      if (match) return match.id;
    }
  }

  return null;
};
