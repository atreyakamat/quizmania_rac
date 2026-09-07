import type { 
  QuizSubmissionPayload, 
  QuizSubmissionResult, 
  QuestionBreakdown, 
  Submission, 
  Answer, 
  Quiz,
  SelectedAnswer,
  Question,
  QuestionType
} from '@quizmania/types';
import { getSupabaseAdminClient, isSupabaseAdminConfigured, isSupabaseDatabaseReady } from './supabase';
import { mockStore } from './mock-data';

interface ScoreContext {
  question: Question;
  answer: SelectedAnswer;
}

export function normalizeTextAnswer(text: string, settings: { caseSensitive: boolean; trimWhitespace: boolean; normalizeSpaces: boolean }): string {
  let normalized = text;
  if (settings.trimWhitespace) {
    normalized = normalized.trim();
  }
  if (settings.normalizeSpaces) {
    normalized = normalized.replace(/\s+/g, ' ');
  }
  if (!settings.caseSensitive) {
    normalized = normalized.toLowerCase();
  }
  return normalized;
}

export function scoreMultipleChoice(question: Question, selectedIds: string[]): QuestionBreakdown {
  const maxMarks = question.marks !== undefined && question.marks !== null ? Number(question.marks) : 1;
  const negativeMarks = question.negative_marks !== undefined && question.negative_marks !== null ? Number(question.negative_marks) : 0;
  
  const options = question.options || [];
  const correctOptions = options.filter(o => o.is_correct);
  const correctOptionIds = correctOptions.map(o => o.id);
  
  const correctSelectedCount = selectedIds.filter(id => correctOptionIds.includes(id)).length;
  const wrongSelectedCount = selectedIds.filter(id => !correctOptionIds.includes(id)).length;

  let earnedMarks = 0;
  let isCorrect = false;

  if (selectedIds.length > 0) {
    if (question.scoring_method === 'partial') {
      if (correctOptionIds.length > 0) {
        const netFraction = Math.max(0, (correctSelectedCount - wrongSelectedCount) / correctOptionIds.length);
        earnedMarks = Math.round(netFraction * maxMarks * 10) / 10;
        isCorrect = netFraction === 1;
      }
    } else {
      if (correctSelectedCount === correctOptionIds.length && wrongSelectedCount === 0) {
        earnedMarks = maxMarks;
        isCorrect = true;
      } else if (negativeMarks > 0) {
        earnedMarks = -negativeMarks;
      }
    }
  }

  return {
    questionId: question.id,
    questionText: question.question_text,
    questionType: question.question_type,
    earnedMarks: Math.max(0, earnedMarks), // Final breakdown marks? Or can it be negative? The instruction says 'prevent overall negative scores' but intermediate can be negative? Let's just return actual earned marks and apply max at total
    maxMarks,
    isCorrect,
    correctOptionIds,
    userSelection: selectedIds
  };
}

export function scoreQuestion(ctx: ScoreContext): QuestionBreakdown {
  const { question, answer } = ctx;
  const maxMarks = question.marks !== undefined && question.marks !== null ? Number(question.marks) : 1;
  const negativeMarks = question.negative_marks !== undefined && question.negative_marks !== null ? Number(question.negative_marks) : 0;
  
  let earnedMarks = 0;
  let isCorrect = false;
  let userSelectionDisplay: string | string[] | null = null;
  
  const options = question.options || [];
  const correctOptions = options.filter(o => o.is_correct);
  const correctOptionIds = correctOptions.map(o => o.id);
  
  switch (question.question_type) {
    case 'single_choice':
    case 'true_false': {
      const selectedId = answer.selectedOptionId;
      userSelectionDisplay = selectedId || null;
      if (selectedId) {
        if (correctOptionIds.includes(selectedId)) {
          earnedMarks = maxMarks;
          isCorrect = true;
        } else if (negativeMarks > 0) {
          earnedMarks = -negativeMarks;
        }
      }
      break;
    }
    
    case 'multiple_choice': {
      const selectedIds = answer.selectedOptionIds || (answer.selectedOptionId ? [answer.selectedOptionId] : []);
      const result = scoreMultipleChoice(question, selectedIds);
      // To correctly assign negative marks without breaking the type if we return negative from scoreMultipleChoice
      earnedMarks = result.earnedMarks;
      // scoreMultipleChoice returns positive earned marks if no negative marking? Wait, I should just use the exact internal value.
      const correctSelectedCount = selectedIds.filter(id => correctOptionIds.includes(id)).length;
      const wrongSelectedCount = selectedIds.filter(id => !correctOptionIds.includes(id)).length;
      if (selectedIds.length > 0) {
        if (question.scoring_method === 'partial') {
          if (correctOptionIds.length > 0) {
            const netFraction = Math.max(0, (correctSelectedCount - wrongSelectedCount) / correctOptionIds.length);
            earnedMarks = Math.round(netFraction * maxMarks * 10) / 10;
            isCorrect = netFraction === 1;
          }
        } else {
          if (correctSelectedCount === correctOptionIds.length && wrongSelectedCount === 0) {
            earnedMarks = maxMarks;
            isCorrect = true;
          } else if (negativeMarks > 0) {
            earnedMarks = -negativeMarks;
          }
        }
      }
      userSelectionDisplay = selectedIds;
      break;
    }
    
    case 'short_answer':
    case 'text_answer':
    case 'short_text': {
      const text = answer.textAnswer || '';
      userSelectionDisplay = text;
      
      if (text.trim()) {
        const accepted = question.accepted_answers && question.accepted_answers.length > 0 
          ? question.accepted_answers 
          : correctOptions.map(o => o.option_text);
        
        const settings = {
          caseSensitive: question.case_sensitive ?? false,
          trimWhitespace: question.trim_whitespace ?? true,
          normalizeSpaces: question.normalize_spaces ?? true
        };
        
        const normalizedInput = normalizeTextAnswer(text, settings);
        
        const isMatch = accepted.some(acc => {
          return normalizeTextAnswer(acc, settings) === normalizedInput;
        });
        
        if (isMatch) {
          earnedMarks = maxMarks;
          isCorrect = true;
        } else if (negativeMarks > 0) {
          earnedMarks = -negativeMarks;
        }
      }
      break;
    }
    
    case 'paragraph': {
      const text = answer.textAnswer || '';
      userSelectionDisplay = text;
      if (text.trim()) {
        earnedMarks = maxMarks;
        isCorrect = true;
      }
      break;
    }
    
    default: {
      const selectedId = answer.selectedOptionId;
      userSelectionDisplay = selectedId || null;
      if (selectedId && correctOptionIds.includes(selectedId)) {
        earnedMarks = maxMarks;
        isCorrect = true;
      }
    }
  }

  return {
    questionId: question.id,
    questionText: question.question_text,
    questionType: question.question_type,
    earnedMarks, // Can be negative here, handled by calculateFinalScore
    maxMarks,
    isCorrect,
    correctOptionIds,
    acceptedAnswers: question.accepted_answers,
    userSelection: userSelectionDisplay
  };
}

export function calculateFinalScore(breakdown: QuestionBreakdown[], allowNegativeTotal: boolean): number {
  let total = 0;
  for (const b of breakdown) {
    total += b.earnedMarks;
  }
  if (!allowNegativeTotal && total < 0) {
    return 0;
  }
  return Math.round(total * 10) / 10;
}

export async function processQuizSubmission(
  quizId: string, 
  payload: QuizSubmissionPayload
): Promise<{ success: boolean; result?: QuizSubmissionResult; error?: string }> {
  return scoreAndRecordQuizSubmission(quizId, payload);
}

export async function scoreAndRecordQuizSubmission(
  quizIdentifier: string,
  payload: QuizSubmissionPayload
): Promise<{ success: boolean; result?: QuizSubmissionResult; error?: string }> {
  let quiz: Quiz | null = null;
  const isLive = await isSupabaseDatabaseReady();

  if (isLive) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      // First try by ID
      let { data, error } = await supabase
        .from('quizzes')
        .select('*, questions(*, options(*))')
        .eq('id', quizIdentifier)
        .eq('status', 'published')
        .maybeSingle();

      if (!data) {
        // Fallback to slug
        const res = await supabase
          .from('quizzes')
          .select('*, questions(*, options(*))')
          .eq('slug', quizIdentifier)
          .eq('status', 'published')
          .maybeSingle();
        data = res.data;
      }

      if (data) {
        quiz = data as unknown as Quiz;
      }
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      return { success: false, error: 'Database connection unavailable in production environment' };
    }
    let found = mockStore.getQuizzes().find(q => q.id === quizIdentifier || q.slug === quizIdentifier);
    if (found && found.status === 'published') {
      quiz = found;
    }
  }

  if (!quiz) {
    return { success: false, error: 'Quiz not found or is not currently accepting submissions' };
  }

  // Idempotency / duplicate submission check
  if (payload.attemptId) {
    if (isLive) {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        const { data: existingSub } = await supabase
          .from('submissions')
          .select('id')
          .eq('attempt_id', payload.attemptId)
          .maybeSingle();
        if (existingSub) {
          return { success: false, error: 'A submission for this attempt already exists' };
        }
      }
    } else {
      const existing = mockStore.submissions.find(s => s.attempt_id === payload.attemptId);
      if (existing) {
        return { success: false, error: 'A submission for this attempt already exists' };
      }
    }
  }

  const questions = quiz.questions || [];
  if (questions.length === 0) {
    return { success: false, error: 'Quiz has no questions configured' };
  }

  const answerMap = new Map<string, SelectedAnswer>();
  for (const item of payload.answers) {
    answerMap.set(item.questionId, item);
  }

  for (const q of questions) {
    const ans = answerMap.get(q.id);

    // Verify option IDs belong to this question if selected
    if (['single_choice', 'multiple_choice', 'true_false'].includes(q.question_type)) {
      const validOptionIds = (q.options || []).map(o => o.id);
      if (ans?.selectedOptionId && !validOptionIds.includes(ans.selectedOptionId)) {
        return { success: false, error: `Invalid option selected for question: "${q.question_text}"` };
      }
      if (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) {
        const hasInvalid = ans.selectedOptionIds.some(id => !validOptionIds.includes(id));
        if (hasInvalid) {
          return { success: false, error: `Invalid option selected for question: "${q.question_text}"` };
        }
      }
    }

    if (q.required) {
      const isAnswered = Boolean(
        ans?.selectedOptionId || 
        (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) || 
        ans?.textAnswer?.trim()
      );
      if (!isAnswered) {
        return { success: false, error: `Missing required question: "${q.question_text}"` };
      }
    }
  }

  const breakdown: QuestionBreakdown[] = [];
  let totalPossibleMarks = 0;

  for (const q of questions) {
    const ans = answerMap.get(q.id) || { questionId: q.id };
    const b = scoreQuestion({ question: q, answer: ans });
    breakdown.push(b);
    totalPossibleMarks += b.maxMarks;
  }

  const allowNegativeTotal = quiz.settings?.allow_negative_total ?? false;
  const finalScore = calculateFinalScore(breakdown, allowNegativeTotal);
  
  const percentage = totalPossibleMarks > 0 ? Math.round((finalScore / totalPossibleMarks) * 100) : 0;
  const passingPercentage = quiz.settings?.passing_score_percentage ?? 50;
  const passed = percentage >= passingPercentage;

  const submissionId = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : '00000000-0000-4000-8000-' + Math.random().toString(16).slice(2, 14).padStart(12, '0');
  const submittedAt = new Date().toISOString();

  const participantData = {
    club_name: payload.participant.club_name || null,
    district_number: payload.participant.district_number || null,
    position: payload.participant.position || null,
    ...(payload.participant.data || {})
  };

  if (isLive) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return { success: false, error: 'Database service client not available' };
    }

    const { data: subData, error: subError } = await supabase
      .from('submissions')
      .insert({
        id: submissionId,
        quiz_id: quiz.id,
        participant_name: payload.participant.name,
        participant_email: payload.participant.email || null,
        participant_data: participantData,
        score: finalScore,
        total_possible_marks: totalPossibleMarks,
        percentage: percentage,
        passed: passed,
        submitted_at: submittedAt,
        attempt_id: payload.attemptId || null
      })
      .select()
      .single();

    if (subError) {
      console.error('Failed to insert submission in Supabase:', subError);
      return { success: false, error: `Failed to save submission: ${subError.message}` };
    }

    if (subData) {
      const answerRows = breakdown.map(b => {
        const ans = answerMap.get(b.questionId);
        return {
          submission_id: subData.id,
          question_id: b.questionId,
          selected_option_id: ans?.selectedOptionId || null,
          selected_option_ids: ans?.selectedOptionIds || null,
          text_answer: ans?.textAnswer || null,
          earned_marks: b.earnedMarks
        };
      });
      const { error: ansError } = await supabase.from('answers').insert(answerRows);
      if (ansError) {
        console.error('Failed to insert answers in Supabase:', ansError);
      }
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      return {
        success: false,
        error: 'Production database is not connected. Submissions cannot be recorded in mock mode.'
      };
    }

    const answerRows: Answer[] = breakdown.map(b => {
      const ans = answerMap.get(b.questionId);
      return {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ans-${Date.now()}-${Math.random()}`,
        submission_id: submissionId,
        question_id: b.questionId,
        selected_option_id: ans?.selectedOptionId || null,
        selected_option_ids: ans?.selectedOptionIds || null,
        text_answer: ans?.textAnswer || null,
        earned_marks: b.earnedMarks
      };
    });

    mockStore.addSubmission({
      id: submissionId,
      quiz_id: quiz.id,
      participant_name: payload.participant.name,
      participant_email: payload.participant.email || null,
      participant_data: participantData,
      score: finalScore,
      total_possible_marks: totalPossibleMarks,
      percentage: percentage,
      passed: passed,
      submitted_at: submittedAt,
      attempt_id: payload.attemptId || null
    }, answerRows);
  }

  return {
    success: true,
    result: {
      submissionId,
      score: finalScore,
      totalPossibleMarks,
      percentage,
      passed,
      submittedAt,
      feedbackMessage: passed
        ? 'Congratulations! You completed the quiz with flying colors.'
        : 'Quiz completed. Thank you for participating with the Rotaract Club of Mapusa!',
      breakdown: quiz.settings?.show_correct_answers ? breakdown : undefined
    }
  };
}
