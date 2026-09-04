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

-- 11. SEED DATA
INSERT INTO public.themes (id, name, primary_color, secondary_color, background_color, surface_color, text_color, button_color, border_radius, font_family)
VALUES 
  ('d0000000-0000-0000-0000-000000000000', 'QuizMania Rotaract', '#6E123D', '#A50D52', '#FAF8F9', '#FFFFFF', '#24141C', '#A50D52', '1rem', 'Inter, system-ui, sans-serif'),
  ('d0000000-0000-0000-0000-000000000001', 'Nature Green', '#2E7D32', '#81C784', '#F1F8E9', '#FFFFFF', '#1A1A1A', '#2E7D32', '0.75rem', 'Inter, system-ui, sans-serif')
ON CONFLICT (id) DO NOTHING;

-- Seed Quiz: Nutrition Week Quiz 2026
INSERT INTO public.quizzes (id, title, slug, description, cover_image, status, theme_id, settings)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Nutrition Week Quiz 2026',
  'nutrition-week-2026',
  'Celebrate Nutrition Week with the Rotaract Club of Mapusa! Test your knowledge about healthy eating, nutrients and balanced lifestyles.',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&auto=format&fit=crop&q=80',
  'published',
  'd0000000-0000-0000-0000-000000000000',
  '{"time_limit_minutes": 15, "passing_score_percentage": 60, "show_score_immediately": true, "allow_review": true, "require_participant_email": true, "collect_club_details": true}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Seed Questions & Options
-- Q1: Carbohydrates (C)
INSERT INTO public.questions (id, quiz_id, question_text, question_type, marks, required, question_order)
VALUES ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Which nutrient is the body''s primary source of energy?', 'single_choice', 5, true, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.options (id, question_id, option_text, is_correct, option_order) VALUES
('c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'Vitamins', false, 1),
('c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', 'Proteins', false, 2),
('c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', 'Carbohydrates', true, 3),
('c0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000001', 'Minerals', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q2: Vitamin D (C)
INSERT INTO public.questions (id, quiz_id, question_text, question_type, marks, required, question_order)
VALUES ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Which vitamin is mainly produced in the body when the skin is exposed to sunlight?', 'single_choice', 5, true, 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.options (id, question_id, option_text, is_correct, option_order) VALUES
('c0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000002', 'Vitamin A', false, 1),
('c0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000002', 'Vitamin C', false, 2),
('c0000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000002', 'Vitamin D', true, 3),
('c0000000-0000-0000-0000-000000000024', 'b0000000-0000-0000-0000-000000000002', 'Vitamin K', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q3: Protein (A)
INSERT INTO public.questions (id, quiz_id, question_text, question_type, marks, required, question_order)
VALUES ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Which nutrient is especially important for building and repairing body tissues?', 'single_choice', 5, true, 3)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.options (id, question_id, option_text, is_correct, option_order) VALUES
('c0000000-0000-0000-0000-000000000031', 'b0000000-0000-0000-0000-000000000003', 'Protein', true, 1),
('c0000000-0000-0000-0000-000000000032', 'b0000000-0000-0000-0000-000000000003', 'Fibre', false, 2),
('c0000000-0000-0000-0000-000000000033', 'b0000000-0000-0000-0000-000000000003', 'Water', false, 3),
('c0000000-0000-0000-0000-000000000034', 'b0000000-0000-0000-0000-000000000003', 'Carbohydrates', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q4: Whole grains (B)
INSERT INTO public.questions (id, quiz_id, question_text, question_type, marks, required, question_order)
VALUES ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Which of the following foods is generally a good source of dietary fibre?', 'single_choice', 5, true, 4)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.options (id, question_id, option_text, is_correct, option_order) VALUES
('c0000000-0000-0000-0000-000000000041', 'b0000000-0000-0000-0000-000000000004', 'White sugar', false, 1),
('c0000000-0000-0000-0000-000000000042', 'b0000000-0000-0000-0000-000000000004', 'Whole grains', true, 2),
('c0000000-0000-0000-0000-000000000043', 'b0000000-0000-0000-0000-000000000004', 'Butter', false, 3),
('c0000000-0000-0000-0000-000000000044', 'b0000000-0000-0000-0000-000000000004', 'Soft drinks', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q5: Calcium (B)
INSERT INTO public.questions (id, quiz_id, question_text, question_type, marks, required, question_order)
VALUES ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Which mineral is important for maintaining healthy bones and teeth?', 'single_choice', 5, true, 5)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.options (id, question_id, option_text, is_correct, option_order) VALUES
('c0000000-0000-0000-0000-000000000051', 'b0000000-0000-0000-0000-000000000005', 'Iron', false, 1),
('c0000000-0000-0000-0000-000000000052', 'b0000000-0000-0000-0000-000000000005', 'Calcium', true, 2),
('c0000000-0000-0000-0000-000000000053', 'b0000000-0000-0000-0000-000000000005', 'Sodium', false, 3),
('c0000000-0000-0000-0000-000000000054', 'b0000000-0000-0000-0000-000000000005', 'Potassium', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q6: Fats (A)
INSERT INTO public.questions (id, quiz_id, question_text, question_type, marks, required, question_order)
VALUES ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Which nutrient helps the body absorb certain vitamins and provides stored energy?', 'single_choice', 5, true, 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.options (id, question_id, option_text, is_correct, option_order) VALUES
('c0000000-0000-0000-0000-000000000061', 'b0000000-0000-0000-0000-000000000006', 'Fats', true, 1),
('c0000000-0000-0000-0000-000000000062', 'b0000000-0000-0000-0000-000000000006', 'Water', false, 2),
('c0000000-0000-0000-0000-000000000063', 'b0000000-0000-0000-0000-000000000006', 'Minerals', false, 3),
('c0000000-0000-0000-0000-000000000064', 'b0000000-0000-0000-0000-000000000006', 'Fibre', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q7: Fresh fruit (A)
INSERT INTO public.questions (id, quiz_id, question_text, question_type, marks, required, question_order)
VALUES ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Which of the following is generally considered a healthy snack option?', 'single_choice', 5, true, 7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.options (id, question_id, option_text, is_correct, option_order) VALUES
('c0000000-0000-0000-0000-000000000071', 'b0000000-0000-0000-0000-000000000007', 'Fresh fruit', true, 1),
('c0000000-0000-0000-0000-000000000072', 'b0000000-0000-0000-0000-000000000007', 'Candy', false, 2),
('c0000000-0000-0000-0000-000000000073', 'b0000000-0000-0000-0000-000000000007', 'Sugary soda', false, 3),
('c0000000-0000-0000-0000-000000000074', 'b0000000-0000-0000-0000-000000000007', 'Deep-fried chips', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q8: Hydration benefit (B)
INSERT INTO public.questions (id, quiz_id, question_text, question_type, marks, required, question_order)
VALUES ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'What is the main benefit of drinking enough water?', 'single_choice', 5, true, 8)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.options (id, question_id, option_text, is_correct, option_order) VALUES
('c0000000-0000-0000-0000-000000000081', 'b0000000-0000-0000-0000-000000000008', 'It completely replaces meals', false, 1),
('c0000000-0000-0000-0000-000000000082', 'b0000000-0000-0000-0000-000000000008', 'It helps maintain normal body functions and hydration', true, 2),
('c0000000-0000-0000-0000-000000000083', 'b0000000-0000-0000-0000-000000000008', 'It provides large amounts of protein', false, 3),
('c0000000-0000-0000-0000-000000000084', 'b0000000-0000-0000-0000-000000000008', 'It replaces the need for fruits and vegetables', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q9: Iron (B)
INSERT INTO public.questions (id, quiz_id, question_text, question_type, marks, required, question_order)
VALUES ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'Which nutrient is important for carrying oxygen in the blood?', 'single_choice', 5, true, 9)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.options (id, question_id, option_text, is_correct, option_order) VALUES
('c0000000-0000-0000-0000-000000000091', 'b0000000-0000-0000-0000-000000000009', 'Calcium', false, 1),
('c0000000-0000-0000-0000-000000000092', 'b0000000-0000-0000-0000-000000000009', 'Iron', true, 2),
('c0000000-0000-0000-0000-000000000093', 'b0000000-0000-0000-0000-000000000009', 'Vitamin C', false, 3),
('c0000000-0000-0000-0000-000000000094', 'b0000000-0000-0000-0000-000000000009', 'Fibre', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q10: Balanced diet (C)
INSERT INTO public.questions (id, quiz_id, question_text, question_type, marks, required, question_order)
VALUES ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'A balanced diet generally includes:', 'single_choice', 5, true, 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.options (id, question_id, option_text, is_correct, option_order) VALUES
('c0000000-0000-0000-0000-000000000101', 'b0000000-0000-0000-0000-000000000010', 'Only protein-rich foods', false, 1),
('c0000000-0000-0000-0000-0000000000102', 'b0000000-0000-0000-0000-000000000010', 'Only fruits and vegetables', false, 2),
('c0000000-0000-0000-0000-0000000000103', 'b0000000-0000-0000-0000-000000000010', 'A variety of foods from different food groups', true, 3),
('c0000000-0000-0000-0000-0000000000104', 'b0000000-0000-0000-0000-000000000010', 'Only low-fat foods', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q11: Unsaturated fats (A)
INSERT INTO public.questions (id, quiz_id, question_text, question_type, marks, required, question_order)
VALUES ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Which of these is a good source of healthy unsaturated fats?', 'single_choice', 5, true, 11)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.options (id, question_id, option_text, is_correct, option_order) VALUES
('c0000000-0000-0000-0000-000000000111', 'b0000000-0000-0000-0000-000000000011', 'Nuts', true, 1),
('c0000000-0000-0000-0000-0000000000112', 'b0000000-0000-0000-0000-000000000011', 'Candy', false, 2),
('c0000000-0000-0000-0000-0000000000113', 'b0000000-0000-0000-0000-000000000011', 'Soft drinks', false, 3),
('c0000000-0000-0000-0000-0000000000114', 'b0000000-0000-0000-0000-000000000011', 'Refined sugar', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q12: Fruits and vegetables variety (A)
INSERT INTO public.questions (id, quiz_id, question_text, question_type, marks, required, question_order)
VALUES ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'Why is it beneficial to include a variety of fruits and vegetables in your diet?', 'single_choice', 5, true, 12)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.options (id, question_id, option_text, is_correct, option_order) VALUES
('c0000000-0000-0000-0000-000000000121', 'b0000000-0000-0000-0000-000000000012', 'They provide a range of nutrients', true, 1),
('c0000000-0000-0000-0000-0000000000122', 'b0000000-0000-0000-0000-000000000012', 'They eliminate the need for water', false, 2),
('c0000000-0000-0000-0000-0000000000123', 'b0000000-0000-0000-0000-000000000012', 'They replace all other food groups', false, 3),
('c0000000-0000-0000-0000-0000000000124', 'b0000000-0000-0000-0000-000000000012', 'They contain only carbohydrates', false, 4)
ON CONFLICT (id) DO NOTHING;
