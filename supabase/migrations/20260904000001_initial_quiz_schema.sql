-- ==============================================================================
-- QUIZMANIA - ROTARACT CLUB OF MAPUSA (RI DISTRICT 3170)
-- PostgreSQL Database Schema & Security Definer Scoring
-- Migration: 20260904000001_initial_quiz_schema.sql
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
  settings JSONB NOT NULL DEFAULT '{
    "time_limit_minutes": 15,
    "shuffle_questions": false,
    "shuffle_options": false,
    "passing_score_percentage": 50,
    "show_score_immediately": true,
    "allow_review": true,
    "require_participant_email": true,
    "collect_club_details": true
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_slug ON public.quizzes(slug);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON public.quizzes(status);

-- 3. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'single_choice' CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false', 'text_answer')),
  question_image TEXT,
  marks INTEGER NOT NULL DEFAULT 5 CHECK (marks >= 1),
  required BOOLEAN NOT NULL DEFAULT TRUE,
  question_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_order ON public.questions(quiz_id, question_order);

-- 4. OPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_image TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  option_order INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_options_question_order ON public.options(question_id, option_order);

-- 5. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  participant_email TEXT,
  participant_data JSONB DEFAULT '{}'::jsonb,
  score INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_quiz_id ON public.submissions(quiz_id);

-- 6. ANSWERS TABLE
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id UUID NOT NULL REFERENCES public.options(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_answers_submission_id ON public.answers(submission_id);

-- 7. SECURE PUBLIC VIEWS
CREATE OR REPLACE VIEW public.public_quiz_options AS
SELECT 
  id,
  question_id,
  option_text,
  option_image,
  option_order
FROM public.options;

GRANT SELECT ON public.public_quiz_options TO anon, authenticated;

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view themes"
  ON public.themes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can view published quizzes"
  ON public.quizzes FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Public can view questions for published quizzes"
  ON public.questions FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = questions.quiz_id AND q.status = 'published'
    )
  );

REVOKE SELECT ON public.options FROM anon;
GRANT SELECT (id, question_id, option_text, option_image, option_order) ON public.options TO anon;

CREATE POLICY "Public can view options without answers for published quizzes"
  ON public.options FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.quizzes z ON z.id = q.quiz_id
      WHERE q.id = options.question_id AND z.status = 'published'
    )
  );

CREATE POLICY "Submissions viewable by admin service role only"
  ON public.submissions FOR ALL
  TO authenticated, service_role
  USING (true);

CREATE POLICY "Answers viewable by admin service role only"
  ON public.answers FOR ALL
  TO authenticated, service_role
  USING (true);

-- 9. SECURE SCORING STORED PROCEDURE (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.submit_quiz_answers(
  p_quiz_id UUID,
  p_participant_name TEXT,
  p_participant_email TEXT DEFAULT NULL,
  p_participant_data JSONB DEFAULT '{}'::jsonb,
  p_answers JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quiz_status TEXT;
  v_passing_percentage INTEGER := 50;
  v_total_possible_marks INTEGER := 0;
  v_earned_marks INTEGER := 0;
  v_submission_id UUID;
  v_item JSONB;
  v_q_id UUID;
  v_opt_id UUID;
  v_is_correct BOOLEAN;
  v_q_marks INTEGER;
  v_percentage INTEGER := 0;
  v_passed BOOLEAN := FALSE;
BEGIN
  SELECT status, COALESCE((settings->>'passing_score_percentage')::INTEGER, 50)
  INTO v_quiz_status, v_passing_percentage
  FROM public.quizzes
  WHERE id = p_quiz_id;

  IF v_quiz_status IS NULL OR v_quiz_status != 'published' THEN
    RAISE EXCEPTION 'Quiz is not available for submissions';
  END IF;

  SELECT COALESCE(SUM(marks), 0)
  INTO v_total_possible_marks
  FROM public.questions
  WHERE quiz_id = p_quiz_id;

  INSERT INTO public.submissions (quiz_id, participant_name, participant_email, participant_data, score)
  VALUES (p_quiz_id, p_participant_name, p_participant_email, p_participant_data, 0)
  RETURNING id INTO v_submission_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    v_q_id := (v_item->>'questionId')::UUID;
    v_opt_id := (v_item->>'selectedOptionId')::UUID;

    SELECT o.is_correct, q.marks
    INTO v_is_correct, v_q_marks
    FROM public.options o
    JOIN public.questions q ON q.id = o.question_id
    WHERE o.id = v_opt_id AND q.id = v_q_id AND q.quiz_id = p_quiz_id;

    IF v_is_correct IS TRUE THEN
      v_earned_marks := v_earned_marks + v_q_marks;
    END IF;

    INSERT INTO public.answers (submission_id, question_id, selected_option_id)
    VALUES (v_submission_id, v_q_id, v_opt_id);
  END LOOP;

  UPDATE public.submissions
  SET score = v_earned_marks
  WHERE id = v_submission_id;

  IF v_total_possible_marks > 0 THEN
    v_percentage := ROUND((v_earned_marks::NUMERIC / v_total_possible_marks::NUMERIC) * 100);
  END IF;

  v_passed := (v_percentage >= v_passing_percentage);

  RETURN jsonb_build_object(
    'submissionId', v_submission_id,
    'score', v_earned_marks,
    'totalPossibleMarks', v_total_possible_marks,
    'percentage', v_percentage,
    'passed', v_passed,
    'submittedAt', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_quiz_answers TO anon, authenticated, service_role;

-- 10. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('quiz-covers', 'quiz-covers', true),
  ('question-images', 'question-images', true),
  ('option-images', 'option-images', true),
  ('branding-assets', 'branding-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Quiz Covers" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'quiz-covers');

CREATE POLICY "Public Read Question Images" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'question-images');

CREATE POLICY "Public Read Option Images" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'option-images');

CREATE POLICY "Public Read Branding Assets" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'branding-assets');

-- 11. SEED DATA (Default Themes Only)
INSERT INTO public.themes (id, name, primary_color, secondary_color, background_color, surface_color, text_color, button_color, border_radius, font_family)
VALUES 
  ('d0000000-0000-0000-0000-000000000000', 'QuizMania Rotaract', '#6E123D', '#A50D52', '#FAF8F9', '#FFFFFF', '#24141C', '#A50D52', '1rem', 'Inter, system-ui, sans-serif'),
  ('d0000000-0000-0000-0000-000000000001', 'Nature Green', '#2E7D32', '#81C784', '#F1F8E9', '#FFFFFF', '#1A1A1A', '#2E7D32', '0.75rem', 'Inter, system-ui, sans-serif')
ON CONFLICT (id) DO NOTHING;
