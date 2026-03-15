-- AI Knowledge Base Agent - Database Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- Phase 1: Create AI Chat Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_chat_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  session_id  text NOT NULL,
  role        text NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text NOT NULL,
  tokens_used int DEFAULT 0,
  feedback    smallint DEFAULT NULL CHECK (feedback IN (1, -1)),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.ai_chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat logs"
  ON public.ai_chat_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat logs"
  ON public.ai_chat_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON public.ai_chat_logs FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Phase 2: Create AI Usage Tracking Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_usage_tracking (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  period         date NOT NULL,
  messages_sent  int NOT NULL DEFAULT 0,
  tokens_used    int NOT NULL DEFAULT 0,
  UNIQUE (user_id, period)
);

ALTER TABLE public.ai_usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own AI usage"
  ON public.ai_usage_tracking FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can upsert AI usage"
  ON public.ai_usage_tracking FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- Phase 3: Add AI Config to system_config
-- ============================================
ALTER TABLE public.system_config
  ADD COLUMN IF NOT EXISTS ai_enabled            boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_model              text    NOT NULL DEFAULT 'llama-3.3-70b-versatile',
  ADD COLUMN IF NOT EXISTS ai_max_msgs_per_day   int     NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS ai_max_msgs_admin_day int     NOT NULL DEFAULT 40;

-- ============================================
-- Phase 4: Create Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_user_id ON public.ai_chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_created_at ON public.ai_chat_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_session_id ON public.ai_chat_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_tracking_user_period ON public.ai_usage_tracking(user_id, period);

-- ============================================
-- Phase 5: pg_cron Cleanup Jobs
-- ============================================
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions for pg_cron (run as superuser)
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Purge AI chat logs older than 14 days (runs daily at 3:30 AM)
SELECT cron.schedule(
  'cleanup-ai-chat-logs',
  '30 3 * * *',
  $$DELETE FROM public.ai_chat_logs WHERE created_at < now() - INTERVAL '14 days'$$
);

-- Purge messages older than 3 months
SELECT cron.schedule(
  'cleanup-messages',
  '0 2 * * 0',
  $$DELETE FROM public.messages WHERE created_at < now() - INTERVAL '3 months'$$
);

-- Purge old daily AI usage rows (keep last 35 days)
SELECT cron.schedule(
  'cleanup-ai-usage',
  '0 4 * * 0',
  $$DELETE FROM public.ai_usage_tracking WHERE period < CURRENT_DATE - INTERVAL '35 days'$$
);

-- ============================================
-- Phase 6: Function to increment AI usage
-- ============================================
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user_id uuid,
  p_period date,
  p_messages int DEFAULT 1,
  p_tokens int DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.ai_usage_tracking (user_id, period, messages_sent, tokens_used)
  VALUES (p_user_id, p_period, p_messages, p_tokens)
  ON CONFLICT (user_id, period)
  DO UPDATE SET
    messages_sent = ai_usage_tracking.messages_sent + p_messages,
    tokens_used = ai_usage_tracking.tokens_used + p_tokens;
END;
$$;
