import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { AIChatMessage, AIUsage } from '../types';
import { AI_CONFIG } from '../lib/aiConfig';

interface UseAIChatReturn {
  messages: AIChatMessage[];
  isLoading: boolean;
  error: string | null;
  usage: AIUsage | null;
  limit: number;
  sendMessage: (content: string) => Promise<void>;
  clearConversation: () => void;
  setFeedback: (messageId: string, feedback: 1 | -1) => Promise<void>;
}

export const useAIChat = (sessionId?: string): UseAIChatReturn => {
  const { user } = useAuth();
  const { config, articles } = useData();
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [limit, setLimit] = useState(AI_CONFIG.DEFAULT_EMPLOYEE_LIMIT);
  
  // Stabilize session ID: persist for the current day for this user
  const getDailySessionId = useCallback(() => {
    if (!user) return `anon_${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    return `daily_${user.id}_${today}`;
  }, [user]);

  const currentSessionRef = useRef<string>(sessionId || getDailySessionId());

  useEffect(() => {
    if (sessionId) {
      currentSessionRef.current = sessionId;
    } else {
      currentSessionRef.current = getDailySessionId();
    }
  }, [sessionId, getDailySessionId]);

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const userLimit = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
      ? (config.aiMaxMsgsAdminDay || AI_CONFIG.DEFAULT_ADMIN_LIMIT)
      : (config.aiMaxMsgsPerDay || AI_CONFIG.DEFAULT_EMPLOYEE_LIMIT);
    setLimit(userLimit);

    const { data } = await supabase
      .from('ai_usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('period', today)
      .single();

    if (data) {
      setUsage({
        user_id: data.user_id,
        period: data.period,
        messages_sent: data.messages_sent,
        tokens_used: data.tokens_used,
      });
    } else {
      setUsage(null);
    }
  }, [user, config.aiMaxMsgsAdminDay, config.aiMaxMsgsPerDay]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('ai_chat_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_id', currentSessionRef.current)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data.map(m => ({
        id: m.id,
        user_id: m.user_id,
        session_id: m.session_id,
        role: m.role,
        content: m.content,
        tokens_used: m.tokens_used,
        feedback: m.feedback,
        created_at: m.created_at,
      })));
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUsage();
      fetchHistory();
    }
  }, [user, fetchUsage, fetchHistory]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !content.trim()) return;
    if (content.length > AI_CONFIG.MAX_MESSAGE_LENGTH) {
      setError(`Message too long. Max ${AI_CONFIG.MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    const tempUserMessage: AIChatMessage = {
      id: `temp_${Date.now()}`,
      user_id: user.id,
      session_id: currentSessionRef.current,
      role: 'user',
      content,
      tokens_used: 0,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const kbArticles = articles.slice(0, 10).map(a => ({
        id: a.id,
        title: a.title,
        content: a.content.substring(0, 2000),
        category: a.category,
      }));

      // Force session refresh to ensure JWT is valid
      await supabase.auth.refreshSession();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Authentication error. Please log in again.');
        setIsLoading(false);
        return;
      }

      const { data: result, error: invokeError } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: content,
          session_id: currentSessionRef.current,
          kb_articles: kbArticles,
          trends_summary: [],
        },
      });

      console.log("AI Response:", result, invokeError);

      if (invokeError) {
        console.error("AI Error:", invokeError);
        // Supabase functions.invoke returns error as an object
        const errorMsg = invokeError.message || invokeError.toString();
        if (errorMsg.includes('429') || errorMsg.includes('limit')) {
          setError('You have reached your daily AI limit. Try again tomorrow.');
        } else if (errorMsg.includes('401')) {
          setError('Authentication error. Please refresh the page and log in again.');
        } else {
          setError(errorMsg || 'Failed to get AI response');
        }
        setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
        return;
      }

      if (!result || result.error) {
        setError(result?.error || 'No message returned from AI');
        setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
        return;
      }

      const assistantMessage: AIChatMessage = {
        id: `ai_${Date.now()}`,
        user_id: user.id,
        session_id: currentSessionRef.current,
        role: 'assistant',
        content: result.message,
        tokens_used: result.tokens_used,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserMessage.id);
        return [...filtered, assistantMessage];
      });

      await fetchHistory();
      await fetchUsage();
    } catch (err) {
      setError('Failed to connect to AI service');
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [user, articles, fetchHistory, fetchUsage]);

  const clearConversation = useCallback(() => {
    currentSessionRef.current = `session_${Date.now()}`;
    setMessages([]);
  }, []);

  const setFeedback = useCallback(async (messageId: string, feedback: 1 | -1) => {
    await supabase
      .from('ai_chat_logs')
      .update({ feedback })
      .eq('id', messageId);

    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, feedback } : m))
    );
  }, []);

  return {
    messages,
    isLoading,
    error,
    usage,
    limit,
    sendMessage,
    clearConversation,
    setFeedback,
  };
};
