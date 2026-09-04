import type { QuizSubmissionPayload, QuizSubmissionResult, Submission, Answer, Quiz } from '@quizmania/types';
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from './supabase';
import { mockStore } from './mock-data';

/**
 * SECURE SCORING ENGINE (Server-side / Edge Function only)
 *
 * Validates participant responses against protected database records,
 * computes marks accurately, records submission in `submissions` and `answers`,
 * and returns a sanitized result without leaking correct answers.
 */
export async function scoreAndRecordQuizSubmission(
  quizSlug: string,
  payload: QuizSubmissionPayload
): Promise<{ success: boolean; result?: QuizSubmissionResult; error?: string }> {
  // 1. Fetch full quiz (including protected is_correct) using admin privileges
  let quiz: Quiz | null = null;

  if (isSupabaseAdminConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          slug,
          status,
          settings,
          questions:questions(
            id,
            question_text,
            question_type,
            marks,
            required,
            options:options(
              id,
              is_correct
            )
          )
        `)
        .eq('slug', quizSlug)
        .eq('status', 'published')
        .single();

      if (!error && data) {
        quiz = data as unknown as Quiz;
      }
    }
  }

  if (!quiz) {
    const found = mockStore.getQuizBySlug(quizSlug);
    if (found && found.status === 'published') {
      quiz = found;
    }
  }

  if (!quiz) {
    return { success: false, error: 'Quiz not found or is not currently accepting submissions' };
  }

  const questions = quiz.questions || [];
  if (questions.length === 0) {
    return { success: false, error: 'Quiz has no questions configured' };
  }

  // 2. Validate required questions
  const answeredMap = new Map<string, string>();
  for (const item of payload.answers) {
    answeredMap.set(item.questionId, item.selectedOptionId);
  }

  for (const q of questions) {
    if (q.required && !answeredMap.has(q.id)) {
      return { success: false, error: `Missing required question: "${q.question_text}"` };
    }
  }

  // 3. Compute score and record selected answers
  let earnedMarks = 0;
  let totalPossibleMarks = 0;
  const recordedAnswers: Array<{ question_id: string; selected_option_id: string; is_correct: boolean }> = [];

  for (const q of questions) {
    const qMarks = Number(q.marks) || 1;
    totalPossibleMarks += qMarks;

    const selectedOptionId = answeredMap.get(q.id);
    if (selectedOptionId) {
      const correctOption = (q.options || []).find(o => o.is_correct);
      const isCorrect = correctOption?.id === selectedOptionId;
      if (isCorrect) {
        earnedMarks += qMarks;
      }
      recordedAnswers.push({
        question_id: q.id,
        selected_option_id: selectedOptionId,
        is_correct: isCorrect
      });
    }
  }

  const percentage = totalPossibleMarks > 0 ? Math.round((earnedMarks / totalPossibleMarks) * 100) : 0;
  const passingPercentage = quiz.settings?.passing_score_percentage ?? 50;
  const passed = percentage >= passingPercentage;

  const submissionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const submittedAt = new Date().toISOString();

  // 4. Persist to Database (or mock store)
  if (isSupabaseAdminConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      // Insert submission
      const { data: subData, error: subError } = await supabase
        .from('submissions')
        .insert({
          id: submissionId,
          quiz_id: quiz.id,
          participant_name: payload.participant.name,
          participant_email: payload.participant.email || null,
          participant_data: payload.participant.data || null,
          score: earnedMarks,
          submitted_at: submittedAt
        })
        .select()
        .single();

      if (!subError && subData) {
        // Insert answers
        const answerRows = recordedAnswers.map(ans => ({
          submission_id: subData.id,
          question_id: ans.question_id,
          selected_option_id: ans.selected_option_id
        }));

        await supabase.from('answers').insert(answerRows);
      }
    }
  } else {
    mockStore.addSubmission({
      id: submissionId,
      quiz_id: quiz.id,
      participant_name: payload.participant.name,
      participant_email: payload.participant.email || null,
      participant_data: payload.participant.data || null,
      score: earnedMarks,
      submitted_at: submittedAt
    });
  }

  // 5. Return sanitized result response
  return {
    success: true,
    result: {
      submissionId,
      score: earnedMarks,
      totalPossibleMarks,
      percentage,
      passed,
      submittedAt,
      feedbackMessage: passed
        ? 'Congratulations! You passed the quiz successfully.'
        : 'Quiz completed. Keep practicing to improve your score!'
    }
  };
}
