-- ==============================================================================
-- QUIZMANIA - MIGRATION 20260909000004: FORTIFY RLS & STORAGE SECURITY
-- Description:
-- 1. Enforce Column-Level Security on questions to hide accepted_answers from anon/authenticated
-- 2. Enforce Column-Level Security on options to hide is_correct from authenticated as well as anon
-- 3. Restrict quiz_attempts, submissions, and answers exclusively to service_role
-- 4. Restrict storage object uploads, updates, and deletes to service_role
-- ==============================================================================

-- 1. Column-Level Security for Questions (accepted_answers protected)
REVOKE SELECT ON public.questions FROM anon, authenticated;
GRANT SELECT (
  id, quiz_id, section_id, question_text, question_description,
  question_type, question_image, marks, negative_marks, required,
  question_order, section_title, section_description, time_limit_seconds,
  scoring_method, case_sensitive, trim_whitespace, normalize_spaces,
  question_settings, created_at, updated_at
) ON public.questions TO anon, authenticated;

-- 2. Column-Level Security for Options (is_correct protected)
REVOKE SELECT ON public.options FROM anon, authenticated;
GRANT SELECT (
  id, question_id, option_text, option_image, option_order, created_at, updated_at
) ON public.options TO anon, authenticated;

-- 3. Remove Permissive Direct Policies on Attempts, Submissions, Answers
DROP POLICY IF EXISTS "Public can insert attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Public can update own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Public can select own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Public can insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Public can insert answers" ON public.answers;
DROP POLICY IF EXISTS "Submissions viewable by admin service role only" ON public.submissions;
DROP POLICY IF EXISTS "Answers viewable by admin service role only" ON public.answers;

-- 4. Ensure Service Role Policies are Explicit and Comprehensive
DROP POLICY IF EXISTS "Service role full access quiz_attempts" ON public.quiz_attempts;
CREATE POLICY "Service role full access quiz_attempts" ON public.quiz_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access submissions" ON public.submissions;
CREATE POLICY "Service role full access submissions" ON public.submissions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access answers" ON public.answers;
CREATE POLICY "Service role full access answers" ON public.answers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Storage Policies: Public Read for assets, Service Role for Write/Delete
DROP POLICY IF EXISTS "Service role full access storage" ON storage.objects;
CREATE POLICY "Service role full access storage" ON storage.objects FOR ALL TO service_role USING (true) WITH CHECK (true);
