-- ====================================================================
-- QUIZMANIA QA TEST DATA RESET SCRIPT
-- Safe cleanup: TARGETS ONLY QA QUIZ ('00000000-0000-0000-0000-0000000000aa')
-- Does NOT touch or delete any production quizzes, questions, or submissions
-- ====================================================================

-- 1. Delete answers belonging to QA submissions
DELETE FROM public.answers 
WHERE submission_id IN (
  SELECT id FROM public.submissions WHERE quiz_id = '00000000-0000-0000-0000-0000000000aa'
);

-- 2. Delete submissions for QA quiz
DELETE FROM public.submissions 
WHERE quiz_id = '00000000-0000-0000-0000-0000000000aa';

-- 3. Delete attempts for QA quiz
DELETE FROM public.quiz_attempts 
WHERE quiz_id = '00000000-0000-0000-0000-0000000000aa';

-- Notice: The QA quiz definition itself remains intact so it does not need to be recreated.
