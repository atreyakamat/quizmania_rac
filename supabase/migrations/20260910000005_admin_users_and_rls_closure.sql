-- ==============================================================================
-- QUIZMANIA - MIGRATION 20260910000005: ADMIN USERS & RLS CLOSURE
-- Organization: Rotaract Club of Mapusa
-- Purpose: 
-- 1. Create public.admin_users allowlist table and RLS policies
-- 2. Enforce Column-Level Security (CLS) hiding accepted_answers and is_correct from public
-- 3. Revoke legacy public write policies on quiz_attempts, submissions, and answers
-- 4. Secure storage bucket write permissions to service_role only
-- ==============================================================================

-- 1. CREATE ADMIN USERS ALLOWLIST TABLE
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE, -- references auth.users(id) when using Supabase Auth
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin', 'editor')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access admin_users" ON public.admin_users;
CREATE POLICY "Admin full access admin_users" ON public.admin_users FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read admin_users" ON public.admin_users;
CREATE POLICY "Admins can read admin_users" ON public.admin_users FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid() AND au.enabled = true
  )
);

-- 2. ENFORCE COLUMN-LEVEL SECURITY ON QUESTIONS (Hide accepted_answers from anon/authenticated)
REVOKE SELECT ON public.questions FROM anon, authenticated;
GRANT SELECT (
  id, quiz_id, section_id, question_text, question_description,
  question_type, question_image, marks, negative_marks, required,
  question_order, section_title, section_description, time_limit_seconds,
  scoring_method, case_sensitive, trim_whitespace, normalize_spaces,
  question_settings, created_at, updated_at
) ON public.questions TO anon, authenticated;

-- 3. ENFORCE COLUMN-LEVEL SECURITY ON OPTIONS (Hide is_correct from anon/authenticated)
REVOKE SELECT ON public.options FROM anon, authenticated;
GRANT SELECT (
  id, question_id, option_text, option_image, option_order, created_at, updated_at
) ON public.options TO anon, authenticated;

-- Ensure public select policies for published quizzes remain active
DROP POLICY IF EXISTS "Public can view published questions" ON public.questions;
CREATE POLICY "Public can view published questions" ON public.questions FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = questions.quiz_id AND q.status = 'published')
);

DROP POLICY IF EXISTS "Public can view options for published quizzes" ON public.options;
CREATE POLICY "Public can view options for published quizzes" ON public.options FOR SELECT TO anon, authenticated USING (
  EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.quizzes z ON z.id = q.quiz_id
    WHERE q.id = options.question_id AND z.status = 'published'
  )
);

-- 4. REVOKE DIRECT CLIENT INSERT/UPDATE POLICIES ON ATTEMPTS, SUBMISSIONS, ANSWERS
DROP POLICY IF EXISTS "Public can insert attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Public can update own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Public can select own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Public can insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Public can insert answers" ON public.answers;
DROP POLICY IF EXISTS "Submissions viewable by admin service role only" ON public.submissions;
DROP POLICY IF EXISTS "Answers viewable by admin service role only" ON public.answers;

-- Explicit service_role policies for authoritative Next.js backend
DROP POLICY IF EXISTS "Service role full access quiz_attempts" ON public.quiz_attempts;
CREATE POLICY "Service role full access quiz_attempts" ON public.quiz_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access submissions" ON public.submissions;
CREATE POLICY "Service role full access submissions" ON public.submissions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access answers" ON public.answers;
CREATE POLICY "Service role full access answers" ON public.answers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. STORAGE POLICIES: PUBLIC READ FOR ASSETS, SERVICE ROLE FOR UPLOADS/DELETES
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('quiz-covers', 'quiz-covers', true),
  ('question-images', 'question-images', true),
  ('option-images', 'option-images', true),
  ('branding-assets', 'branding-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Quiz Covers" ON storage.objects;
CREATE POLICY "Public Read Quiz Covers" ON storage.objects FOR SELECT TO public USING (bucket_id = 'quiz-covers');

DROP POLICY IF EXISTS "Public Read Question Images" ON storage.objects;
CREATE POLICY "Public Read Question Images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'question-images');

DROP POLICY IF EXISTS "Public Read Option Images" ON storage.objects;
CREATE POLICY "Public Read Option Images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'option-images');

DROP POLICY IF EXISTS "Public Read Branding Assets" ON storage.objects;
CREATE POLICY "Public Read Branding Assets" ON storage.objects FOR SELECT TO public USING (bucket_id = 'branding-assets');

DROP POLICY IF EXISTS "Service role full access storage" ON storage.objects;
CREATE POLICY "Service role full access storage" ON storage.objects FOR ALL TO service_role USING (true) WITH CHECK (true);
