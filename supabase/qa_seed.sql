-- ====================================================================
-- QUIZMANIA QA FIXTURE SEED SCRIPT
-- Target: "QuizMania QA — Full Engine Test"
-- Safe: Uses ON CONFLICT and targets only QA IDs
-- ====================================================================

-- 1. Ensure Theme exists
INSERT INTO public.themes (id, name, primary_color, secondary_color, background_color, surface_color, text_color, button_color, border_radius, font_family)
VALUES 
  ('d0000000-0000-0000-0000-000000000000', 'QuizMania Rotaract', '#6E123D', '#A50D52', '#FAF8F9', '#FFFFFF', '#24141C', '#A50D52', '1rem', 'Inter, system-ui, sans-serif')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert / Update QA Quiz Header
INSERT INTO public.quizzes (id, title, slug, description, cover_image, status, theme_id, settings, instructions)
VALUES (
  '00000000-0000-0000-0000-0000000000aa',
  'QuizMania QA — Full Engine Test',
  'quizmania-qa-full-engine-test',
  'Comprehensive QA Test Quiz for validating the QuizMania engine across question types, timer, scoring, sections, and feature toggles.',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&auto=format&fit=crop&q=80',
  'published',
  'd0000000-0000-0000-0000-000000000000',
  '{"time_limit_minutes": 10, "enable_question_timer": false, "auto_submit_on_expire": true, "passing_score_percentage": 50, "show_score_immediately": true, "show_correct_answers": true, "allow_review": true, "show_progress_bar": true, "require_participant_email": true, "collect_club_details": true, "prevent_duplicate_submission": false, "allow_multiple_attempts": true, "features": {"timer": true, "review": true, "shuffleQuestions": false, "shuffleOptions": false, "negativeMarking": true, "partialCredit": true}}'::jsonb,
  'Welcome to the QuizMania QA Engine Test. Please verify each question type, review page, and submission evaluation.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  settings = EXCLUDED.settings,
  instructions = EXCLUDED.instructions;

-- 3. Insert Sections
INSERT INTO public.sections (id, quiz_id, title, description, section_order)
VALUES
  ('00000000-0000-0000-0000-0000000001e1', '00000000-0000-0000-0000-0000000000aa', 'Section 1: General Knowledge & Mechanics', 'Testing single choice, negative marks, and true/false questions', 1),
  ('00000000-0000-0000-0000-0000000001e2', '00000000-0000-0000-0000-0000000000aa', 'Section 2: Text & Media Evaluation', 'Testing short text matching, paragraph review, and media assets', 2)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- 4. Delete existing QA questions to re-seed cleanly
DELETE FROM public.questions WHERE quiz_id = '00000000-0000-0000-0000-0000000000aa';

-- 5. Insert QA Questions
-- Q1: Single choice with negative marks
INSERT INTO public.questions (id, quiz_id, question_text, question_description, question_type, marks, negative_marks, required, question_order, section_title, scoring_method, time_limit_seconds)
VALUES ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000aa', 'QA 1: What is the official primary motto of Rotary International?', 'Negative marking test question: -2 marks if answered incorrectly.', 'single_choice', 5, 2, true, 1, 'Section 1: General Knowledge & Mechanics', 'all_or_nothing', 60);

INSERT INTO public.options (id, question_id, option_text, is_correct, option_order) VALUES
('00000000-0000-0000-0000-000000001011', '00000000-0000-0000-0000-0000000000f1', 'Service Above Self', true, 1),
('00000000-0000-0000-0000-000000001012', '00000000-0000-0000-0000-0000000000f1', 'Profit Above Service', false, 2),
('00000000-0000-0000-0000-000000001013', '00000000-0000-0000-0000-0000000000f1', 'Speed Over Substance', false, 3),
('00000000-0000-0000-0000-000000001014', '00000000-0000-0000-0000-0000000000f1', 'Action Without Reflection', false, 4);

-- Q2: Multiple choice with partial credit
INSERT INTO public.questions (id, quiz_id, question_text, question_description, question_type, marks, negative_marks, required, question_order, section_title, scoring_method)
VALUES ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000aa', 'QA 2: Which of the following are recognized Rotary Avenues of Service? (Select ALL that apply)', 'Partial credit test: selects 3 correct options for full 6 marks.', 'multiple_choice', 6, 0, true, 2, 'Section 1: General Knowledge & Mechanics', 'partial');

INSERT INTO public.options (id, question_id, option_text, is_correct, option_order) VALUES
('00000000-0000-0000-0000-000000001021', '00000000-0000-0000-0000-0000000000f2', 'Club Service', true, 1),
('00000000-0000-0000-0000-000000001022', '00000000-0000-0000-0000-0000000000f2', 'Community Service', true, 2),
('00000000-0000-0000-0000-000000001023', '00000000-0000-0000-0000-0000000000f2', 'International Service', true, 3),
('00000000-0000-0000-0000-000000001024', '00000000-0000-0000-0000-0000000000f2', 'Commercial Promotion Service', false, 4);

-- Q3: True / False
INSERT INTO public.questions (id, quiz_id, question_text, question_description, question_type, marks, negative_marks, required, question_order, section_title, scoring_method)
VALUES ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000aa', 'QA 3: The Rotaract Club of Mapusa operates within Rotary International District 3170.', 'True / False test question: 4 marks.', 'true_false', 4, 1, true, 3, 'Section 1: General Knowledge & Mechanics', 'all_or_nothing');

INSERT INTO public.options (id, question_id, option_text, is_correct, option_order) VALUES
('00000000-0000-0000-0000-000000001031', '00000000-0000-0000-0000-0000000000f3', 'True', true, 1),
('00000000-0000-0000-0000-000000001032', '00000000-0000-0000-0000-0000000000f3', 'False', false, 2);

-- Q4: Short text with normalization
INSERT INTO public.questions (id, quiz_id, question_text, question_description, question_type, marks, negative_marks, required, question_order, section_title, scoring_method, accepted_answers, case_sensitive, trim_whitespace, normalize_spaces)
VALUES ('00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-0000000000aa', 'QA 4: What is the official single-word name of the youth partner organization of Rotary (founded in 1968)?', 'Short text matching test: accepts "Rotaract" or "Rotaract Club", case-insensitive with whitespace normalization.', 'short_text', 5, 0, true, 4, 'Section 2: Text & Media Evaluation', 'all_or_nothing', '["Rotaract", "Rotaract Club"]'::jsonb, false, true, true);

-- Q5: Paragraph
INSERT INTO public.questions (id, quiz_id, question_text, question_description, question_type, marks, negative_marks, required, question_order, section_title, scoring_method)
VALUES ('00000000-0000-0000-0000-0000000000f5', '00000000-0000-0000-0000-0000000000aa', 'QA 5: Briefly describe an impactful community initiative your team could lead this season.', 'Paragraph test: open-ended qualitative answer, recorded for review (0 auto marks).', 'paragraph', 0, 0, false, 5, 'Section 2: Text & Media Evaluation', 'all_or_nothing');

-- Q6: Question image
INSERT INTO public.questions (id, quiz_id, question_text, question_description, question_type, question_image, marks, negative_marks, required, question_order, section_title, scoring_method)
VALUES ('00000000-0000-0000-0000-0000000000f6', '00000000-0000-0000-0000-0000000000aa', 'QA 6: Which device or emblem is depicted in the question reference image?', 'Question image display test.', 'single_choice', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60', 5, 0, true, 6, 'Section 2: Text & Media Evaluation', 'all_or_nothing');

INSERT INTO public.options (id, question_id, option_text, is_correct, option_order) VALUES
('00000000-0000-0000-0000-000000001061', '00000000-0000-0000-0000-0000000000f6', 'Digital Communication & Community Connection', true, 1),
('00000000-0000-0000-0000-000000001062', '00000000-0000-0000-0000-0000000000f6', 'Agricultural Harvester', false, 2),
('00000000-0000-0000-0000-000000001063', '00000000-0000-0000-0000-0000000000f6', 'Chemical Refinery Plant', false, 3);

-- Q7: Image options
INSERT INTO public.questions (id, quiz_id, question_text, question_description, question_type, marks, negative_marks, required, question_order, section_title, scoring_method)
VALUES ('00000000-0000-0000-0000-0000000000f7', '00000000-0000-0000-0000-0000000000aa', 'QA 7: Which visual palette card represents the official QuizMania burgundy & magenta brand identity?', 'Option image test: verifies image rendering inside individual answer choice tiles.', 'single_choice', 5, 0, true, 7, 'Section 2: Text & Media Evaluation', 'all_or_nothing');

INSERT INTO public.options (id, question_id, option_text, option_image, is_correct, option_order) VALUES
('00000000-0000-0000-0000-000000001071', '00000000-0000-0000-0000-0000000000f7', 'Deep Burgundy (#6E123D) and Rich Magenta (#A50D52)', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=60', true, 1),
('00000000-0000-0000-0000-000000001072', '00000000-0000-0000-0000-0000000000f7', 'Neon Yellow and Fluorescent Cyan', 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=60', false, 2);
