-- Add sections table
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  section_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add quiz_attempts table  
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  participant_name TEXT NOT NULL,
  participant_email TEXT,
  participant_data JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started','in_progress','submitted','auto_submitted','expired','abandoned')),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  answer_snapshot JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to questions table if not present
ALTER TABLE public.questions 
  ADD COLUMN IF NOT EXISTS question_description TEXT,
  ADD COLUMN IF NOT EXISTS negative_marks NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS section_title TEXT,
  ADD COLUMN IF NOT EXISTS section_description TEXT,
  ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS scoring_method TEXT DEFAULT 'all_or_nothing' CHECK (scoring_method IN ('all_or_nothing', 'partial')),
  ADD COLUMN IF NOT EXISTS accepted_answers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS case_sensitive BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trim_whitespace BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS normalize_spaces BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS question_settings JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add columns to options table if not present
ALTER TABLE public.options
  ADD COLUMN IF NOT EXISTS option_image TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add columns to quizzes table if not present
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Add columns to submissions table  
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS total_possible_marks NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS percentage NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS passed BOOLEAN,
  ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER;

-- Add columns to answers table
ALTER TABLE public.answers
  ADD COLUMN IF NOT EXISTS selected_option_ids JSONB,
  ADD COLUMN IF NOT EXISTS text_answer TEXT,
  ADD COLUMN IF NOT EXISTS earned_marks NUMERIC(5,2) DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_session_token ON public.quiz_attempts(session_token);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_status ON public.quiz_attempts(status);
CREATE INDEX IF NOT EXISTS idx_sections_quiz_id ON public.sections(quiz_id);

-- RLS for quiz_attempts: allow insert from public, restrict reads
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow insert attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow update own attempt" ON public.quiz_attempts FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Allow read own attempt" ON public.quiz_attempts FOR SELECT USING (true);

-- RLS for sections: public read, admin write
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Public can read sections" ON public.sections FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on sections" ON public.sections FOR ALL USING (true);
