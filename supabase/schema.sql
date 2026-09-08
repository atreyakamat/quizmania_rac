-- ==============================================================================
-- QUIZMANIA - ROTARACT CLUB OF MAPUSA (RI DISTRICT 3170)
-- Consolidated Complete PostgreSQL Database Schema
-- File: supabase/schema.sql
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. THEMES TABLE
CREATE TABLE IF NOT EXISTS public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  background_color TEXT NOT NULL,
  surface_color TEXT NOT NULL,
  text_color TEXT NOT NULL,
  button_color TEXT NOT NULL,
  border_radius TEXT NOT NULL DEFAULT '1rem',
  font_family TEXT NOT NULL DEFAULT 'Inter, system-ui, sans-serif',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL,
  instructions TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  settings JSONB NOT NULL DEFAULT '{
    "time_limit_minutes": 15,
    "passing_score_percentage": 50,
    "show_score_immediately": true,
    "allow_review": true,
    "require_participant_email": false,
    "collect_club_details": true
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_quizzes_schedule_window CHECK (start_at IS NULL OR end_at IS NULL OR end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_quizzes_slug ON public.quizzes(slug);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON public.quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quizzes_schedule_window ON public.quizzes(start_at, end_at);

-- 3. SECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  section_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sections_quiz_id ON public.sections(quiz_id);

-- 4. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  question_description TEXT,
  question_type TEXT NOT NULL DEFAULT 'single_choice' CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false', 'short_text', 'paragraph', 'text_answer', 'short_answer')),
  question_image TEXT,
  marks NUMERIC(5,2) NOT NULL DEFAULT 5 CHECK (marks >= 0),
  negative_marks NUMERIC(5,2) DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  question_order INTEGER NOT NULL DEFAULT 1,
  section_title TEXT,
  section_description TEXT,
  time_limit_seconds INTEGER,
  scoring_method TEXT DEFAULT 'all_or_nothing' CHECK (scoring_method IN ('all_or_nothing', 'partial')),
  accepted_answers JSONB DEFAULT '[]'::jsonb,
  case_sensitive BOOLEAN DEFAULT false,
  trim_whitespace BOOLEAN DEFAULT true,
  normalize_spaces BOOLEAN DEFAULT true,
  question_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_order ON public.questions(quiz_id, question_order);

-- 5. OPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_image TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  option_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_options_question_order ON public.options(question_id, option_order);

-- 6. QUIZ ATTEMPTS TABLE (Session Tokens and Timer Limits)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  participant_name TEXT NOT NULL,
  participant_email TEXT,
  participant_data JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('started','in_progress','submitted','auto_submitted','expired','abandoned')),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  answer_snapshot JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_session_token ON public.quiz_attempts(session_token);

-- 7. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE SET NULL,
  participant_name TEXT NOT NULL,
  participant_email TEXT,
  participant_data JSONB DEFAULT '{}'::jsonb,
  score NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_possible_marks NUMERIC(10,2),
  percentage NUMERIC(5,2),
  passed BOOLEAN,
  time_taken_seconds INTEGER,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_quiz_id ON public.submissions(quiz_id);

-- 8. ANSWERS TABLE
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.options(id) ON DELETE SET NULL,
  selected_option_ids JSONB DEFAULT '[]'::jsonb,
  text_answer TEXT,
  earned_marks NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_answers_submission_id ON public.answers(submission_id);

-- 9. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Themes Policies
CREATE POLICY "Public can view themes" ON public.themes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin full access themes" ON public.themes FOR ALL TO service_role USING (true);

-- Quizzes Policies
CREATE POLICY "Public can view published quizzes" ON public.quizzes FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admin full access quizzes" ON public.quizzes FOR ALL TO service_role USING (true);

-- Sections Policies
CREATE POLICY "Public can view published sections" ON public.sections FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = sections.quiz_id AND q.status = 'published')
);
CREATE POLICY "Admin full access sections" ON public.sections FOR ALL TO service_role USING (true);

-- Questions Policies
CREATE POLICY "Public can view published questions" ON public.questions FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = questions.quiz_id AND q.status = 'published')
);
CREATE POLICY "Admin full access questions" ON public.questions FOR ALL TO service_role USING (true);

-- Options Policies (Hide correct answer flags from anon)
REVOKE SELECT ON public.options FROM anon;
GRANT SELECT (id, question_id, option_text, option_image, option_order) ON public.options TO anon;

CREATE POLICY "Public can view options for published quizzes" ON public.options FOR SELECT TO anon, authenticated USING (
  EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.quizzes z ON z.id = q.quiz_id
    WHERE q.id = options.question_id AND z.status = 'published'
  )
);
CREATE POLICY "Admin full access options" ON public.options FOR ALL TO service_role USING (true);

-- Quiz Attempts Policies
CREATE POLICY "Public can insert attempts" ON public.quiz_attempts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public can update own attempts" ON public.quiz_attempts FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Public can select own attempts" ON public.quiz_attempts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin full access quiz_attempts" ON public.quiz_attempts FOR ALL TO service_role USING (true);

-- Submissions Policies
CREATE POLICY "Public can insert submissions" ON public.submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin full access submissions" ON public.submissions FOR ALL TO service_role USING (true);

-- Answers Policies
CREATE POLICY "Public can insert answers" ON public.answers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin full access answers" ON public.answers FOR ALL TO service_role USING (true);

-- 10. STORAGE BUCKETS (Public Read)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('quiz-covers', 'quiz-covers', true),
  ('question-images', 'question-images', true),
  ('option-images', 'option-images', true),
  ('branding-assets', 'branding-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Quiz Covers" ON storage.objects FOR SELECT TO public USING (bucket_id = 'quiz-covers');
CREATE POLICY "Public Read Question Images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'question-images');
CREATE POLICY "Public Read Option Images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'option-images');
CREATE POLICY "Public Read Branding Assets" ON storage.objects FOR SELECT TO public USING (bucket_id = 'branding-assets');

-- 11. DEFAULT THEMES SEED
INSERT INTO public.themes (id, name, primary_color, secondary_color, background_color, surface_color, text_color, button_color, border_radius, font_family)
VALUES 
  ('d0000000-0000-0000-0000-000000000001', 'QuizMania Rotaract', '#6E123D', '#A50D52', '#FAF8F9', '#FFFFFF', '#24141C', '#A50D52', '1rem', 'Inter, system-ui, sans-serif'),
  ('d0000000-0000-0000-0000-000000000002', 'Nature Green', '#2E7D32', '#81C784', '#F1F8E9', '#FFFFFF', '#1A1A1A', '#2E7D32', '0.75rem', 'Inter, system-ui, sans-serif'),
  ('d0000000-0000-0000-0000-000000000003', 'Ocean Blue', '#0284C7', '#7DD3FC', '#F0F9FF', '#FFFFFF', '#0C4A6E', '#0284C7', '1rem', 'Inter, system-ui, sans-serif')
ON CONFLICT (id) DO NOTHING;

-- 12. ADMIN USERS TABLE (Explicit Server-Side Authorization Allowlist)
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
CREATE POLICY "Admin full access admin_users" ON public.admin_users FOR ALL TO service_role USING (true);
CREATE POLICY "Admins can read admin_users" ON public.admin_users FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid() AND au.enabled = true
  )
);
