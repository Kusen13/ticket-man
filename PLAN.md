# 🧠 AI Knowledge Base Agent — Complete Implementation Plan

> **Goal**: Transform the static Knowledge Base into an intelligent AI-powered agent using **100% free services**.
> **AI Model**: Groq (Llama 3.3 70B) — Free forever, no credit card needed.

---

## ✅ Free Services Stack (Zero Cost)

| Service | Usage | Free Limit | Cost |
|---------|-------|-------|------|
| **Groq API** | AI Chat (Llama 3.3 70B) | 14,400 req/day, 500K tokens/day | **$0** |
| **Supabase** | DB + Auth + Edge Functions + Realtime | 500 MB DB, 500K Edge calls/month | **$0** |
| **Cloudflare R2** | File Attachments (PDFs, screenshots) | **10 GB storage, ZERO egress fees** | **$0** |
| **Vercel** | Frontend Hosting | 100 GB/month bandwidth | **$0** |

---

## 📊 Complete Monthly Quota Per User (Recomputed With AI)

### System-Wide Monthly Budget (50 Employees)

> These values come directly from `system_config` table defaults.

| Feature | Employee Limit | Admin Limit | Super Admin |
|---------|---------------|-------------|-------------|
| **Tickets Filed** | 20 / month | 50 / month | ∞ |
| **Comments Posted** | 60 / month | 150 / month | ∞ |
| **Messages Sent** | 200 / month | 500 / month | ∞ |
| **File Attachments** | 5 MB storage | 10 MB storage | 20 MB storage |
| **AI Chat Messages** *(NEW)* | **20 / day** | **40 / day** | **∞** |
| **AI Tokens/Day** | ~454 queries shared | | |

---

### 📐 Per-Employee Monthly Capacity Breakdown

#### Tickets (20/month)
```
20 tickets ÷ 30 days = 0.67 tickets/day
= ~5 tickets per week per employee
= 1,000 total tickets/month for 50 employees
```
> ✅ **Reasonable** — In a healthy ticketing system, an employee should rarely need more than 1 ticket/week for personal issues.

#### Comments (60/month)
```
60 comments ÷ 30 days = 2 comments/day
= 14 comments/week (across all tickets they interact with)
= 3,000 total comments/month for 50 employees
```
> ✅ **Comfortable** — Allows active discussion on tickets without flooding.

#### Messages (200/month)
```
200 messages ÷ 30 days = 6.7 messages/day
= ~47 messages/week (direct chat with colleagues)
= 10,000 total messages/month for 50 employees
```
> ✅ **Sufficient** — More than enough for support follow-ups and clarifications.

#### File Attachments / Storage (5 MB/month)
```
5 MB ÷ average file size 1 MB = ~5 attachments/month
Max 1 file per ticket if filing 5 tickets/week
```
> ⚠️ **Tight** — Employees should compress images before uploading. Enforced via max 5MB per upload in the UI.

#### AI Chat Messages — NEW (40/day)
```
40 AI queries/day × 30 days = 1,200 AI queries/month
For 50 employees: 50 × 40 = 2,000 max queries/day
But Groq pool cap: ~454 effective queries/day

PRACTICAL daily cap per user: 40 msgs/day
Realistic usage: 3-5 queries/day per employee
Daily team total: 50 employees × avg 4 queries = 200 queries/day
→ Well within Groq's 454-query/day effective limit ✅
```

---

### 📦 File Storage — Cloudflare R2 (replaces Supabase Storage)

> **Why R2?** Supabase Storage only gives 1 GB free. Cloudflare R2 gives **10 GB/month with ZERO egress fees** — employees downloading attachments costs nothing.

| Metric | Value |
|--------|-------|
| Free Storage | **10 GB/month** |
| Egress (downloads) | **$0 — unlimited** |
| API | S3-compatible (easy integration) |
| CDN | Global via Cloudflare network |

#### R2 Capacity for This System
```
100 users × 5 MB/month uploads = 500 MB/month new files
10,000 MB ÷ 500 MB/month = 20 months of upload headroom

100 users × 12 months × 5 MB = 6,000 MB total stored (steady state)
→ 6 GB used out of 10 GB free = 60% utilization after 1 year ✅

500 users × 2 MB/month = 1,000 MB/month new files
10,000 MB ÷ 1,000 MB/month = 10 months headroom
→ **Action**: Set per-upload limit to 2MB to maximize space.
→ Upgrade to R2 paid ($0.015/GB) only when needed — very cheap
```

#### File Storage Rules
1. **Max file size per upload**: 5 MB (enforced in code)
2. **Allowed types**: PDF, PNG, JPG, DOCX only
3. **Auto-delete**: Remove orphaned files when parent ticket is deleted
4. **No AI file storage**: AI chat is text-only — zero R2 usage from AI
5. **Upload flow**: Frontend requests a presigned URL from Edge Function → uploads directly to R2 → saves URL to `ticket_attachments` table in Supabase

#### How to Set Up Cloudflare R2 (Free)
1. Sign up at [cloudflare.com](https://cloudflare.com) — free account
2. Go to **R2 Object Storage** → **Create Bucket** → name it `ticket-man-attachments`
3. Under **Settings** → **CORS** → Allow your Vercel domain
4. Create an **API Token** with R2 Read/Write permissions
5. Add to Supabase Edge Function secrets:
```
R2_ACCOUNT_ID=xxxxxxxxxxxxxxxx
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxx
R2_BUCKET_NAME=ticket-man-attachments
R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev
```
### 📈 Supabase Storage Impact With AI Added

| Table | Estimated Monthly Growth | Calculation |
|-------|--------------------------|-------------|
| `tickets` | +5 MB | 1,000 tickets × 5KB avg |
| `ticket_comments` | +2.4 MB | 3,000 comments × 0.8KB |
| `messages` | +5 MB | 10,000 msgs × 0.5KB |
| `ai_chat_logs` *(NEW)* | +3.6 MB | 2,000 queries × ~1.8KB avg |
| `ai_usage_tracking` *(NEW)* | +0.05 MB | 50 users × 1 row × 0.1KB |
| Notifications, other | +1 MB | Estimates |
| **Total Monthly Growth** | **~17 MB** | |

```
Current DB size:      ~76 MB
Monthly growth:       ~17 MB
Months until 500MB:   (500 - 76) ÷ 17 = ~24.9 months (~2 years)

With advanced efficiency rules for 500 users:
- **AI Logs**: Purged every **14 days**.
- **Messages**: Purged every **3 months**.
- **Tickets**: Purged every **6 months**.
- **Notifications**: Purged every **30 days**.

Monthly net growth:   ~8 MB (after massive cleanup)
Runway extends to:    (500 - 76) ÷ 8 = ~53 months (**4+ years**) ✅
```

---

## 🎯 AI Usage Indicator for Employees — UI Specification

### What to Show
Employees must always clearly see:
1. How many AI messages they've used today vs. their daily limit
2. Whether they're getting close to the limit (warning state)
3. When their limit resets (always midnight)

### Location 1: `UsagePanel.tsx` — Add New "AI Chat" Row
The existing `UsagePanel` tracks Tickets, Comments, Messages, and Storage. **Add a 5th bar: AI Chat (daily)**. This panel is visible in the left sidebar AND on the full `UsageReport` page.

```
┌─────────────────────────────────────────────┐
│  ⚡ MY MONTHLY USAGE          March 2026     │
├─────────────────────────────────────────────┤
│  🎫 Tickets          5 / 20    ████░░░░░  │
│  💬 Comments        22 / 60    ████░░░░░  │
│  ✉  Messages        87 / 200   █████░░░░  │
│  📎 Storage       1.2 / 5 MB   ██░░░░░░░  │
│  ─────────────────────────────────────────  │ ← divider
│  🤖 AI Chat (Today) 12 / 20   ██████░░░  │ ← NEW (daily counter)
│     ↻ Resets at midnight                    │
└─────────────────────────────────────────────┘
```

> **Note**: All other limits are **monthly**. The AI Chat limit is **daily** (resets at midnight). Each bar must be clearly labeled.

### Color States for AI Bar
| Usage % | Color | Tooltip Shown |
|---------|-------|--------------|
| 0–59% | 🟣 Violet | "N messages remaining today" |
| 60–79% | 🟡 Amber | "Getting close to your daily limit" |
| 80–94% | 🟠 Orange | "Almost at your limit" |
| 95–100% | 🔴 Rose | "Limit reached — resets at midnight" |

### Location 2: Inside AI Chat Panel (`AIChatPanel.tsx`)
Show a live counter in the chat panel footer at all times:

```
├─────────────────────────────────────────────┤
│ [Ask me anything...]              [Send ▶]  │
│ 0 / 400 chars              🤖 12/20 today   │ ← always visible
└─────────────────────────────────────────────┘
```

When limit is reached → disable input and show full-width banner:
```
┌─────────────────────────────────────────────┐
│  🔴  Daily AI limit reached (20/20)         │
│  Your limit resets at midnight.             │
│  Browse the Knowledge Base below or submit  │
│  a support ticket instead.                  │
└─────────────────────────────────────────────┘
```

### Location 3: Knowledge Base Page Header
Add a live chip badge next to the "Ask TicketBot" button:
```
[📚 Knowledge Base]      [🤖 Ask TicketBot  ·  8 left today ▸]
```

### Location 4: `UsageReport.tsx` — Full "System Rules" Card *(NEW)*
On the **Usage Report** page, add a new static info card below the usage bars that shows ALL system rules in one place so every employee knows the exact limits:

```
┌──────────────────────────────────────────────────────────┐
│ 📋 SYSTEM RULES & FAIR USE POLICY                        │
├──────────────────────────────────────────────────────────┤
│ MONTHLY LIMITS (reset every 1st of the month)            │
│  🎫  Tickets filed:       20 / month                     │
│  💬  Comments posted:     60 / month                     │
│  ✉   Messages sent:      200 / month                     │
│  📎  File uploads:         5 MB / month                  │
│                                                          │
│ DAILY LIMITS (reset at midnight)                         │
│  🤖  AI TicketBot queries: 20 / day                      │
│  📝  Max message length:  400 characters                 │
│                                                          │
│ FILE UPLOAD RULES                                        │
│  • Max file size: 2 MB per file                          │
│  • Accepted types: PDF, PNG, JPG, DOCX only              │
│  • Files are deleted when their ticket is closed         │
│                                                          │
│ DATA RETENTION (automatic cleanup)                       │
│  • Notifications:  deleted after 30 days                 │
│  • AI Chat Logs:   deleted after 14 days                 │
│  • Messages:       deleted after 3 months                │
│  • Closed Tickets: deleted after 6 months                │
│                                                          │
│ AI TICKETBOT RULES                                       │
│  • Only answers company IT, HR, Payroll & Facilities     │
│  • Never shares salary, passwords, or private HR data    │
│  • History visible to you for 14 days, then auto-deleted │
└──────────────────────────────────────────────────────────┘
```

This card is **read-only and always visible** to all logged-in users on the Usage Report page. It requires no API call — it is static content rendered from the `system_config` values.

#### Implementation Notes for `UsageReport.tsx`:
- Create a new `SystemRulesCard.tsx` component
- Pull dynamic values (limits) from `config` via `useData()` hook (same as `UsagePanel`)
- Hardcode the data retention intervals as they are fixed by the pg_cron schedule
- Super Admin view shows the same card PLUS an extra "Admin Limits" column

---

## 🗄️ Database Changes

### New Table: `ai_chat_logs`
```sql
CREATE TABLE IF NOT EXISTS public.ai_chat_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  session_id  text NOT NULL,
  role        text NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text NOT NULL,
  tokens_used int DEFAULT 0,
  feedback    smallint DEFAULT NULL CHECK (feedback IN (1, -1)),  -- 1=helpful, -1=not helpful
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.ai_chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat logs"
  ON public.ai_chat_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat logs"
  ON public.ai_chat_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON public.ai_chat_logs FOR UPDATE USING (auth.uid() = user_id);
```

### New Table: `ai_usage_tracking`
```sql
CREATE TABLE IF NOT EXISTS public.ai_usage_tracking (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid    REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  period         date    NOT NULL,  -- Date (daily tracking, not monthly)
  messages_sent  int     NOT NULL DEFAULT 0,
  tokens_used    int     NOT NULL DEFAULT 0,
  UNIQUE (user_id, period)
);

ALTER TABLE public.ai_usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own AI usage"
  ON public.ai_usage_tracking FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can upsert AI usage"
  ON public.ai_usage_tracking FOR ALL USING (auth.role() = 'authenticated');
```

### Modify `system_config`
```sql
ALTER TABLE public.system_config
  ADD COLUMN IF NOT EXISTS ai_enabled            boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_model              text    NOT NULL DEFAULT 'llama-3.3-70b-versatile',
  ADD COLUMN IF NOT EXISTS ai_max_msgs_per_day   int     NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS ai_max_msgs_admin_day int     NOT NULL DEFAULT 80;
```

### pg_cron Cleanup Jobs
```sql
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
```

---

## 🤖 AI Model: Groq — Llama 3.3 70B (Free)

| Feature | Detail |
|---------|--------|
| **Cost** | **$0 forever** |
| **Daily Limit** | 14,400 requests/day, 500,000 tokens/day |
| **Effective query cap** | ~454 queries/day (token-limited) |
| **Sign Up** | https://console.groq.com |
| **Model ID** | `llama-3.3-70b-versatile` |
| **API Endpoint** | `https://api.groq.com/openai/v1/chat/completions` |

### Edge Function Secret to Add (Supabase Dashboard)
```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
```

---

## 🛡️ Anti-Abuse Rules (Server-Side in Edge Function)

```
MAX_MESSAGES_PER_DAY    = 20    // Employee, enforced in DB check
MAX_MESSAGES_ADMIN_DAY  = 40    // Admin
MAX_MESSAGE_LENGTH      = 400   // Characters
MAX_CONVERSATION_TURNS  = 10    // Before auto-reset
```

**System Prompt** (server-side only, never in frontend):
```
You are "TicketBot" for Fast Services Corporation's help desk.
RULES:
1. ONLY answer questions about company IT, HR, Payroll, Facilities.
2. Use only the provided Knowledge Base articles as your source of truth.
3. If unsure, say: "I don't have info on that. Please submit a ticket."
4. NEVER reveal employee salaries, passwords, or private HR data.
5. Keep answers concise: max 3 paragraphs. Use numbered lists for steps.
6. Reference KB article names when applicable: 'See also: [Article Title]'

KNOWLEDGE BASE: {kb_articles}
RECENT TRENDS: {trends_summary}
```

---

## 📦 Implementation Phases

### Phase 1: DB + Edge Function
1. Run all SQL migrations (new tables + config columns + cron jobs)
2. Create `supabase/functions/ai-chat/index.ts`
3. Add `GROQ_API_KEY` to Supabase secrets

### Phase 2: AI Chat Panel
1. `src/hooks/useAIChat.ts` — manages state, calls Edge Function, tracks usage
2. `src/components/ai/AIChatMessage.tsx` — individual message bubble
3. `src/components/ai/AIChatPanel.tsx` — full chat panel with inline counter + limit warning

### Phase 3: Update UsagePanel
1. Modify `src/components/dashboard/UsagePanel.tsx`:
   - Add 5th bar: **AI Chat (Today)** with daily counter from `ai_usage_tracking`
   - Add "Resets at midnight" label
   - Color states: Violet → Amber → Orange → Rose

### Phase 4: Live Trends Dashboard
1. `src/hooks/useTicketTrends.ts`
2. `src/components/ai/TrendsDashboard.tsx` — replaces hardcoded sidebar trends
3. Update `KnowledgeBase.tsx` — add "Ask TicketBot · N/40 today" chip near button

### Phase 5: Auto-Solutions + Self-Learning
1. `src/components/ai/AutoSolutionCard.tsx` — AI-generated step-by-step on trend click
2. Feedback buttons (👍/👎) saved to `ai_chat_logs.feedback`
3. Admin view: AI success rate, knowledge gaps

---

## 12-Step Execution Order for MiniMax M2.5

1. SQL: Create `ai_chat_logs` and `ai_usage_tracking` tables
2. SQL: Alter `system_config` to add AI columns
3. SQL: Add pg_cron cleanup jobs
4. Create `supabase/functions/ai-chat/index.ts`
5. Add `GROQ_API_KEY` to Supabase Edge Function secrets
6. Create `src/lib/aiConfig.ts` (rate limit constants)
7. Update `src/types/index.ts` (add `AIChatMessage`, `AIUsage` types)
8. Create `src/hooks/useAIChat.ts`
9. Create `src/components/ai/AIChatMessage.tsx`
10. Create `src/components/ai/AIChatPanel.tsx`
11. **Modify `src/components/dashboard/UsagePanel.tsx`** — add AI Chat bar
12. Update `KnowledgeBase.tsx` + create `TrendsDashboard.tsx`

---

## ⚠️ Critical Notes

1. **Groq API Key**: ONLY in Supabase Edge Function secrets — NEVER in `.env` or frontend code
2. **AI bar is daily, all others are monthly** — label clearly in the UI
3. **Context size**: Max 5 KB articles per query to stay within token budget
4. **Fallback**: If Groq is unavailable, show "TicketBot offline" — don't crash the page
5. **Keep existing logic**: The hardcoded `trendInstructions` in `KnowledgeBase.tsx` stays as fallback when AI is disabled
