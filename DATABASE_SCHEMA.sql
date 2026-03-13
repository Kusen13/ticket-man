-- ============================================================
-- TICKET MAN — Full Database Schema for Supabase
-- Copy and paste this entire file into Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  admin_id    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view departments"
  ON public.departments FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Super admins can manage departments"
  ON public.departments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

-- ============================================================
-- 2. CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL,
  description        text,
  default_priority   text NOT NULL DEFAULT 'LOW'
                     CHECK (default_priority IN ('LOW','MEDIUM','HIGH','URGENT')),
  department_id      uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at         timestamptz DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories"
  ON public.categories FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Super admins can manage categories"
  ON public.categories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

-- ============================================================
-- 3. TICKETS
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS public.tickets_ticket_number_seq START WITH 1;

CREATE TABLE IF NOT EXISTS public.tickets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number   int DEFAULT nextval('public.tickets_ticket_number_seq'),
  title           text NOT NULL,
  description     text NOT NULL,
  priority        text NOT NULL DEFAULT 'LOW'
                  CHECK (priority IN ('LOW','MEDIUM','HIGH','URGENT')),
  status          text NOT NULL DEFAULT 'OPEN'
                  CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','REOPENED','RETURNED','CLOSED')),
  department_id   uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  category_id     uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  custom_category text,
  created_by      uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  assigned_to     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  deadline        timestamptz,
  reopen_count    int NOT NULL DEFAULT 0,
  reopen_reason   text,
  return_reason   text,
  returned_by     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  returned_by_name text,
  sla_status      text DEFAULT 'OK' CHECK (sla_status IN ('OK','WARNING','BREACHED')),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Employees see their own tickets; Admins see their dept; Super Admins see all
CREATE POLICY "Users can view relevant tickets"
  ON public.tickets FOR SELECT
  USING (
    auth.uid() = created_by
    OR auth.uid() = assigned_to
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND (
          u.role = 'SUPER_ADMIN'
          OR (u.role = 'ADMIN' AND u.department_id = tickets.department_id)
        )
    )
  );

CREATE POLICY "Employees can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins and owners can update tickets"
  ON public.tickets FOR UPDATE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND (u.role = 'SUPER_ADMIN' OR u.role = 'ADMIN')
    )
  );

CREATE POLICY "Super admins can delete tickets"
  ON public.tickets FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- 4. TICKET ATTACHMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  uuid REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  name       text NOT NULL,
  type       text NOT NULL,
  size       bigint NOT NULL,
  url        text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments on their tickets"
  ON public.ticket_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id
        AND (
          t.created_by = auth.uid()
          OR t.assigned_to = auth.uid()
          OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('ADMIN','SUPER_ADMIN'))
        )
    )
  );

CREATE POLICY "Users can add attachments to their tickets"
  ON public.ticket_attachments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tickets WHERE id = ticket_id AND created_by = auth.uid())
  );

-- ============================================================
-- 5. TICKET COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  uuid REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  message    text NOT NULL,
  mentions   uuid[] DEFAULT '{}',
  read_by    uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on relevant tickets"
  ON public.ticket_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id
        AND (
          t.created_by = auth.uid()
          OR t.assigned_to = auth.uid()
          OR auth.uid() = ANY(ticket_comments.mentions)
          OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('ADMIN','SUPER_ADMIN'))
        )
    )
  );

CREATE POLICY "Authenticated users can post comments"
  ON public.ticket_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update read_by on comments"
  ON public.ticket_comments FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 6. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title      text NOT NULL,
  message    text NOT NULL,
  type       text NOT NULL DEFAULT 'OTHER'
             CHECK (type IN ('MENTION','UPDATE','NEW_TICKET','OTHER')),
  link       text,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can mark notifications as read"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 7. MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id       uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  content         text NOT NULL,
  is_read         boolean NOT NULL DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Authenticated users can send messages"
  ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update read status"
  ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- ============================================================
-- 8. KNOWLEDGE BASE ARTICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kb_articles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  content       text NOT NULL,
  category      text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  created_by    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  video_url     text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER kb_articles_updated_at
  BEFORE UPDATE ON public.kb_articles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE POLICY "Authenticated users can view KB articles"
  ON public.kb_articles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Super admins can manage KB articles"
  ON public.kb_articles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

-- ============================================================
-- 9. SYSTEM CONFIG (single-row settings table)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_config (
  id                      int PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- enforces single row
  company_name            text NOT NULL DEFAULT 'Fast Services Corporation',
  system_email            text NOT NULL DEFAULT 'tickets@fastservices.com',
  max_reopen_count        int NOT NULL DEFAULT 3,
  auto_close_after_days   int NOT NULL DEFAULT 7,
  notify_on_new_ticket    boolean NOT NULL DEFAULT true,
  notify_on_escalation    boolean NOT NULL DEFAULT true,
  notify_on_reopen        boolean NOT NULL DEFAULT true,
  sla_rules               jsonb NOT NULL DEFAULT '[
    {"priority":"URGENT","responseHours":1,"resolutionHours":4},
    {"priority":"HIGH","responseHours":4,"resolutionHours":24},
    {"priority":"MEDIUM","responseHours":24,"resolutionHours":72},
    {"priority":"LOW","responseHours":48,"resolutionHours":168}
  ]',
  urgent_keywords         text[] DEFAULT ARRAY[
    'down','outage','emergency','critical','cannot work','security breach',
    'data loss','production','crash','smoke','fire','flooding','blackout',
    'power failure','hacked','data leak','system down','blocked','unauthorized'
  ],
  high_keywords           text[] DEFAULT ARRAY[
    'broken','error','failing','blocked','deadline','not working','urgent',
    'asap','important','hardware failure','monitor','printer down','blue screen',
    'corrupted','missing','denied','payroll','salary','bonus','hmo','medical','injury'
  ],
  medium_keywords         text[] DEFAULT ARRAY[
    'slow','issue','problem','intermittent','workaround','delay','glitch',
    'performance','sync','email','outlook','vpn','license','software','update',
    'reboot','restart','noisy','broken chair','light bulb','not cooling'
  ],
  updated_at              timestamptz DEFAULT now()
);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view config"
  ON public.system_config FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Super admins can update config"
  ON public.system_config FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

-- ============================================================
-- SEED DATA
-- ============================================================

-- Departments
INSERT INTO public.departments (id, name, description) VALUES
  ('11111111-0001-0001-0001-000000000001', 'IT Support',      'Hardware, software, network, and access issues'),
  ('11111111-0002-0001-0001-000000000002', 'Human Resources', 'Payroll, benefits, leaves, and employee relations'),
  ('11111111-0003-0001-0001-000000000003', 'Facilities',      'Building maintenance, office supplies, working environment'),
  ('11111111-0004-0001-0001-000000000004', 'Finance',         'Expenses, budget approvals, and reimbursements'),
  ('11111111-0005-0001-0001-000000000005', 'Operations',      'Process improvements, internal tools, logistics')
ON CONFLICT (id) DO NOTHING;

-- Categories
INSERT INTO public.categories (name, description, default_priority) VALUES
  ('Hardware Issue',           'Computers, printers, monitors, or peripheral problems.',       'HIGH'),
  ('Software Bug',             'System crashes, errors, or unexpected behavior.',              'MEDIUM'),
  ('Network / Wi-Fi Outage',   'Internet connectivity or speed issues.',                       'URGENT'),
  ('Access / Password Reset',  'Account logins, permissions, or MFA resets.',                 'LOW'),
  ('VPN Connectivity',         'Issues connecting to company systems remotely.',               'MEDIUM'),
  ('Server Deployment',        'Requests for new server instances or environment updates.',    'HIGH'),
  ('Email / Outlook Issue',    'Phishing attempts, sync errors, or loading problems.',        'MEDIUM'),
  ('Database Access',          'SQL permissions, connection strings, or query issues.',        'HIGH'),
  ('Cloud / AWS / Azure',      'Issues with hosted infrastructure or cloud services.',        'HIGH'),
  ('Mobile Device (MDM)',      'Company phones, tablets, or MDM enrollment.',                 'LOW'),
  ('Payroll Inquiry',          'Questions regarding salary, bonuses, or deductions.',         'HIGH'),
  ('Leave Application',        'Sick leave, vacation, or maternity/paternity requests.',      'LOW'),
  ('Health Insurance (HMO)',   'Updating dependents or claims processing.',                   'MEDIUM'),
  ('Performance Review',       'Feedback, promotion requests, or goal setting.',              'LOW'),
  ('ID / Badge Replacement',   'Lost cards, name changes, or access level updates.',          'LOW'),
  ('Office Supplies',          'Paper, ink, stationery, or pantry replenishment.',            'LOW'),
  ('Expense Reimbursement',    'Filing or tracking travel and business expenses.',             'MEDIUM'),
  ('Invoice / Billing',        'Issues with vendor payments or client billing.',               'HIGH'),
  ('Tax Documentation',        'Requests for 2316, ITR, or other tax forms.',                 'LOW'),
  ('Budget Approval',          'Requests for departmental budget allocations.',                'MEDIUM'),
  ('Air Conditioning (A/C)',   'Temperature controls, leaks, or total failure.',              'HIGH'),
  ('Electric / Lighting',      'Dim lights, power outlets, or total power failure.',          'URGENT'),
  ('Plumbing / Water leak',    'Clogged drains or water leakage in the office.',              'HIGH'),
  ('Janitorial Service',       'Cleaning requests for spills or general maintenance.',        'LOW'),
  ('Elevator Issue',           'Safety concerns or functional errors with lifts.',            'URGENT'),
  ('Furniture / Desk Repair',  'Broken chairs, shaky desks, or filing cabinet issues.',       'LOW'),
  ('Critical Security Breach', 'Data leak, unauthorized access, or loss of device.',          'URGENT'),
  ('Physical Security',        'Broken locks, suspicious activity, or lost ID badges.',       'HIGH'),
  ('Compliance Violation',     'Reports of unethical behavior or regulatory issues.',         'HIGH'),
  ('CCTV Request',             'Reviewing footage for security or operational reasons.',      'MEDIUM'),
  ('Brand Assets / Logo',      'Requests for high-res logos or brand guidelines.',            'LOW'),
  ('Social Media Post',        'Requests for content publishing or engagement.',              'LOW'),
  ('Event Management',         'Logistics for company seminars or townhalls.',                'MEDIUM'),
  ('Contract Review',          'Legal review for NDAs, SLAs, or vendor agreements.',         'HIGH'),
  ('Notarization',             'Requests for document notarization services.',                'LOW'),
  ('General Inquiry',          'Non-technical questions or general feedback.',                'LOW'),
  ('Training Request',         'Requests for seminars or skill upgrades.',                    'LOW'),
  ('Transportation Support',   'Carpooling or company vehicle requests.',                     'MEDIUM'),
  ('Pantry / Coffee Machine',  'Issues with food service or office beverages.',               'LOW')
ON CONFLICT DO NOTHING;

-- System Config (single row)
INSERT INTO public.system_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Knowledge Base Articles
INSERT INTO public.kb_articles (title, content, category, video_url) VALUES
  (
    'How to Connect to Employee VPN (Official Guide)',
    E'If you are working remotely, you must use the VPN to access company tools.\n\n### Quick Steps:\n1. Open Cisco AnyConnect on your laptop.\n2. Enter `vpn.fastservices.corp` as the server.\n3. Login with your employee ID and Windows password.\n4. Approve the Duo MFA notification on your phone.',
    'Network Access',
    'https://www.youtube.com/watch?v=R23I4RNR2j8'
  ),
  (
    'Filing for PTO or Sick Leave',
    E'All leave requests must be filed through the HR Portal.\n\n### How to File:\n1. Log in to the HRIS Portal.\n2. Go to "Time Off" > "Request Leave".\n3. Select your dates and leave type.\n4. Click Submit to notify your manager.',
    'Leaves & Absences',
    'https://www.youtube.com/watch?v=uPhN1d2rU3E'
  ),
  (
    'Self-Service Password Reset (SSPR)',
    E'You can reset your own password without calling IT.\n\n### Instructions:\n1. Go to the Login Page.\n2. Click "Forgot Password?".\n3. Enter your full FS email address.\n4. Choose "Text my Phone" for a verification code.\n5. Enter the 6-digit code and set a new password.',
    'Account Help',
    'https://www.youtube.com/watch?v=N_p39Yl1Bxs'
  ),
  (
    'Printer Troubleshooting (Paper Jams & Offline)',
    E'Before filing a ticket for a printer, try these fixes.\n\n### Basic Troubleshooting:\n1. **Offline**: Unplug for 30 seconds and plug back in.\n2. **Paper Jam**: Gently pull any visible paper from all trays.\n3. **Missing Printout**: Check Print Queue and cancel Error items.',
    'Hardware',
    'https://www.youtube.com/watch?v=2-nF76e5B2k'
  ),
  (
    'Microsoft Teams & Outlook Sync Issues',
    E'Fix sync issues by clearing the app cache.\n\n### Steps:\n1. Close Teams completely.\n2. Press Win+R, type `%appdata%\\Microsoft\\Teams`, press Enter.\n3. Delete everything inside the folder.\n4. Restart Teams.',
    'Software',
    'https://www.youtube.com/watch?v=41fO-dD50R0'
  ),
  (
    'Setting up Outlook Signature',
    E'Follow the corporate standard for email signatures.\n\n### Steps:\n1. Get the signature template from the Internal Branding site.\n2. Open Outlook > File > Options > Mail > Signatures.\n3. Paste the template and update with your Name, Position, and Phone.',
    'Software',
    'https://www.youtube.com/watch?v=I0YJt6-v03g'
  ),
  (
    'HMO Enrollment & Claims Guide',
    E'Managing your medical insurance benefits.\n\n### Reimbursements:\n1. Scan all receipts and medical abstracts.\n2. Log in to the Maxicare Portal.\n3. Upload documents under "New Claim".',
    'Benefits',
    'https://www.youtube.com/watch?v=Xq-K9l30vS0'
  ),
  (
    'Clearing Browser Cache & Cookies',
    E'Fix most website errors and slow loading.\n\n### Google Chrome:\n1. Press Ctrl+Shift+Del.\n2. Set Time Range to "All Time".\n3. Check "Cookies" and "Cached images".\n4. Click "Clear data".',
    'Account Help',
    'https://www.youtube.com/watch?v=5U2-N9DAs-w'
  ),
  (
    'Payroll Schedule & Payslip Portal',
    E'### Payroll Schedule:\n- **15th**: Covering 26th of previous month to 10th of current month.\n- **30th/End of Month**: Covering 11th to 25th.\n\n### Accessing Payslip:\n1. Log in to FastPay Portal.\n2. Go to "My Documents" > "Payslips".',
    'Payroll',
    'https://www.youtube.com/watch?v=SAn_W0DskO4'
  ),
  (
    'Internal Requisition for Office Supplies',
    E'### Procedure:\n1. Check existing stock in your floor pantry first.\n2. Fill out the Store Requisition Form (SRF).\n3. Get approval from your supervisor.\n4. Submit the SRF to the General Services Department (GSD).',
    'Facilities',
    'https://www.youtube.com/watch?v=C2_d5JvW_Xo'
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. REAL-TIME SETUP
-- ============================================================
-- Enable real-time for core tables so updates reflect instantly in the UI
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================
-- Done! All tables, policies, and seed data applied.
-- ============================================================
