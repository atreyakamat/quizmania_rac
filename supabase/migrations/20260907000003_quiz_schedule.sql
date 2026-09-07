-- Migration: 20260907000003_quiz_schedule.sql
-- Description: Add start_at and end_at availability schedule columns and indexes to quizzes table

ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ;

-- Constraint: if both start_at and end_at are provided, end_at must be greater than start_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_quizzes_schedule_window'
  ) THEN
    ALTER TABLE public.quizzes
      ADD CONSTRAINT chk_quizzes_schedule_window
      CHECK (start_at IS NULL OR end_at IS NULL OR end_at > start_at);
  END IF;
END $$;

-- Indexes for efficient queries on scheduled quizzes
CREATE INDEX IF NOT EXISTS idx_quizzes_schedule_window ON public.quizzes(start_at, end_at);
