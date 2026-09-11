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
import { getSupabaseAdminClient, getSupabasePublicClient, isSupabaseAdminConfigured, isSupabaseDatabaseReady } from './supabase';
import { mockStore } from './mock-data';
import { generateCanonicalUuid, isCanonicalUuid } from '@quizmania/quiz-schema';

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

function calculatePartialScore(
  correctSelected: number,
  wrongSelected: number,
  totalCorrect: number,
  maxMarks: number
): { earnedMarks: number; isCorrect: boolean } {
  if (totalCorrect === 0) return { earnedMarks: 0, isCorrect: false };
  const netFraction = Math.max(0, (correctSelected - wrongSelected) / totalCorrect);
  const earnedMarks = Math.round(netFraction * maxMarks * 10) / 10;
  return { earnedMarks, isCorrect: netFraction === 1 };
}

function calculateAllOrNothingScore(
  correctSelected: number,
  wrongSelected: number,
  totalCorrect: number,
  maxMarks: number,
  negativeMarks: number
): { earnedMarks: number; isCorrect: boolean } {
  if (correctSelected === totalCorrect && wrongSelected === 0) {
    return { earnedMarks: maxMarks, isCorrect: true };
  }
  if (negativeMarks > 0) {
    return { earnedMarks: -negativeMarks, isCorrect: false };
  }
  return { earnedMarks: 0, isCorrect: false };
}

export function scoreMultipleChoice(question: Question, selectedIds: string[]): QuestionBreakdown {
  const maxMarks = question.marks !== undefined && question.marks !== null ? Number(question.marks) : 1;
  const negativeMarks = question.negative_marks !== undefined && question.negative_marks !== null ? Number(question.negative_marks) : 0;
  
  const options = question.options || [];
  const correctOptionIds = options.filter(o => o.is_correct).map(o => o.id);
  
  const correctSelectedCount = selectedIds.filter(id => correctOptionIds.includes(id)).length;
  const wrongSelectedCount = selectedIds.filter(id => !correctOptionIds.includes(id)).length;

  let earnedMarks = 0;
  let isCorrect = false;

  if (selectedIds.length > 0) {
    const scored = question.scoring_method === 'partial'
      ? calculatePartialScore(correctSelectedCount, wrongSelectedCount, correctOptionIds.length, maxMarks)
      : calculateAllOrNothingScore(correctSelectedCount, wrongSelectedCount, correctOptionIds.length, maxMarks, negativeMarks);
    earnedMarks = scored.earnedMarks;
    isCorrect = scored.isCorrect;
  }

  return {
    questionId: question.id,
    questionText: question.question_text,
    questionType: question.question_type,
    earnedMarks: Math.max(0, earnedMarks),
    maxMarks,
    isCorrect,
    correctOptionIds,
    userSelection: selectedIds
  };
}

function scoreSingleChoiceQuestion(
  selectedId: string | undefined | null,
  correctOptionIds: string[],
  maxMarks: number,
  negativeMarks: number
): { earnedMarks: number; isCorrect: boolean } {
  if (!selectedId) return { earnedMarks: 0, isCorrect: false };
  if (correctOptionIds.includes(selectedId)) {
    return { earnedMarks: maxMarks, isCorrect: true };
  }
  if (negativeMarks > 0) {
    return { earnedMarks: -negativeMarks, isCorrect: false };
  }
  return { earnedMarks: 0, isCorrect: false };
}

function scoreTextQuestion(
  text: string | undefined | null,
  question: Question,
  correctOptions: Array<{ option_text: string }>,
  maxMarks: number,
  negativeMarks: number
): { earnedMarks: number; isCorrect: boolean } {
  const trimmed = (text || '').trim();
  if (!trimmed) return { earnedMarks: 0, isCorrect: false };

  const accepted = question.accepted_answers && question.accepted_answers.length > 0
    ? question.accepted_answers
    : correctOptions.map(o => o.option_text);

  const settings = {
    caseSensitive: question.case_sensitive ?? false,
    trimWhitespace: question.trim_whitespace ?? true,
    normalizeSpaces: question.normalize_spaces ?? true
  };

  const normalizedInput = normalizeTextAnswer(trimmed, settings);
  const isMatch = accepted.some(acc => normalizeTextAnswer(acc, settings) === normalizedInput);

  if (isMatch) {
    return { earnedMarks: maxMarks, isCorrect: true };
  }
  if (negativeMarks > 0) {
    return { earnedMarks: -negativeMarks, isCorrect: false };
  }
  return { earnedMarks: 0, isCorrect: false };
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
      userSelectionDisplay = answer.selectedOptionId || null;
      const res = scoreSingleChoiceQuestion(answer.selectedOptionId, correctOptionIds, maxMarks, negativeMarks);
      earnedMarks = res.earnedMarks;
      isCorrect = res.isCorrect;
      break;
    }
    
    case 'multiple_choice': {
      const selectedIds = answer.selectedOptionIds || (answer.selectedOptionId ? [answer.selectedOptionId] : []);
      userSelectionDisplay = selectedIds;
      const result = scoreMultipleChoice(question, selectedIds);
      earnedMarks = result.earnedMarks;
      isCorrect = Boolean(result.isCorrect);
      if (selectedIds.length > 0 && !isCorrect && question.scoring_method !== 'partial' && negativeMarks > 0) {
        earnedMarks = -negativeMarks;
      }
      break;
    }
    
    case 'short_answer':
    case 'text_answer':
    case 'short_text': {
      const text = answer.textAnswer || '';
      userSelectionDisplay = text;
      const res = scoreTextQuestion(text, question, correctOptions, maxMarks, negativeMarks);
      earnedMarks = res.earnedMarks;
      isCorrect = res.isCorrect;
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
    earnedMarks,
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

async function fetchLiveQuizForSubmission(
  supabase: any,
  quizIdentifier: string
): Promise<{ quiz: Quiz | null; error?: string }> {
  const selectQuery = '*, questions(*, options(*))';
  if (isCanonicalUuid(quizIdentifier)) {
    const { data, error } = await supabase
      .from('quizzes')
      .select(selectQuery)
      .eq('id', quizIdentifier)
      .eq('status', 'published')
      .maybeSingle();

    if (error) {
      return { quiz: null, error: `Database error querying quiz by ID: ${error.message}` };
    }
    if (data) {
      return { quiz: data as unknown as Quiz };
    }
  }

  const res = await supabase
    .from('quizzes')
    .select(selectQuery)
    .eq('slug', quizIdentifier)
    .eq('status', 'published')
    .maybeSingle();

  if (res.error) {
    return { quiz: null, error: `Database error querying quiz by slug: ${res.error.message}` };
  }

  return { quiz: res.data ? (res.data as unknown as Quiz) : null };
}

async function fetchQuizForSubmission(
  quizIdentifier: string,
  isLive: boolean
): Promise<{ quiz: Quiz | null; error?: string }> {
  if (isLive) {
    if (!isSupabaseAdminConfigured()) {
      return {
        quiz: null,
        error: 'Database service configuration missing: SUPABASE_SECRET_KEY is not configured in the server environment.'
      };
    }
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return {
        quiz: null,
        error: 'Database service client could not be initialized.'
      };
    }
    return fetchLiveQuizForSubmission(supabase, quizIdentifier);
  }

  if (process.env.NODE_ENV === 'production') {
    return { quiz: null, error: 'Database connection unavailable in production environment' };
  }
  const found = mockStore.getQuizzes().find(q => q.id === quizIdentifier || q.slug === quizIdentifier);
  return { quiz: found?.status === 'published' ? found : null };
}

async function isDuplicateAttempt(attemptId: string | undefined, isLive: boolean): Promise<boolean> {
  if (!attemptId) return false;
  if (isLive) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return false;
    const { data } = await supabase
      .from('submissions')
      .select('id')
      .eq('attempt_id', attemptId)
      .maybeSingle();
    return Boolean(data);
  }
  return mockStore.submissions.some(s => s.attempt_id === attemptId);
}

function isQuestionAnswered(ans?: SelectedAnswer): boolean {
  if (!ans) return false;
  if (ans.selectedOptionId) return true;
  if (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) return true;
  return Boolean(ans.textAnswer?.trim());
}

function hasValidOptionSelections(q: Question, ans?: SelectedAnswer): boolean {
  if (!['single_choice', 'multiple_choice', 'true_false'].includes(q.question_type)) {
    return true;
  }
  const validOptionIds = (q.options || []).map(o => o.id);
  if (ans?.selectedOptionId && !validOptionIds.includes(ans.selectedOptionId)) {
    return false;
  }
  if (ans?.selectedOptionIds?.some(id => !validOptionIds.includes(id))) {
    return false;
  }
  return true;
}

function validateQuestionSelections(questions: Question[], answerMap: Map<string, SelectedAnswer>): string | null {
  for (const q of questions) {
    const ans = answerMap.get(q.id);
    if (!hasValidOptionSelections(q, ans)) {
      return `Invalid option selected for question: "${q.question_text}"`;
    }
    if (q.required && !isQuestionAnswered(ans)) {
      return `Missing required question: "${q.question_text}"`;
    }
  }
  return null;
}

async function saveLiveSubmission(
  subRecord: Record<string, any>,
  breakdown: QuestionBreakdown[],
  answerMap: Map<string, SelectedAnswer>
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { success: false, error: 'Database service client not available for recording submissions' };
  }

  const { data: subData, error: subError } = await supabase
    .from('submissions')
    .insert(subRecord)
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
  return { success: true };
}

function saveMockSubmission(
  subRecord: Submission,
  breakdown: QuestionBreakdown[],
  answerMap: Map<string, SelectedAnswer>
): { success: boolean; error?: string } {
  if (process.env.NODE_ENV === 'production') {
    return {
      success: false,
      error: 'Production database is not connected. Submissions cannot be recorded in mock mode.'
    };
  }

  const answerRows: Answer[] = breakdown.map(b => {
    const ans = answerMap.get(b.questionId);
    return {
      id: generateCanonicalUuid(),
      submission_id: subRecord.id,
      question_id: b.questionId,
      selected_option_id: ans?.selectedOptionId || null,
      selected_option_ids: ans?.selectedOptionIds || null,
      text_answer: ans?.textAnswer || null,
      earned_marks: b.earnedMarks
    };
  });

  mockStore.addSubmission(subRecord, answerRows);
  return { success: true };
}

export async function scoreAndRecordQuizSubmission(
  quizIdentifier: string,
  payload: QuizSubmissionPayload
): Promise<{ success: boolean; result?: QuizSubmissionResult; error?: string }> {
  const isLive = await isSupabaseDatabaseReady();
  const { quiz, error: fetchError } = await fetchQuizForSubmission(quizIdentifier, isLive);

  if (!quiz) {
    if (fetchError) {
      return { success: false, error: fetchError };
    }
    if (!isLive && process.env.NODE_ENV === 'production') {
      return { success: false, error: 'Database connection unavailable in production environment' };
    }
    return { success: false, error: 'Quiz not found or is not currently accepting submissions' };
  }

  if (await isDuplicateAttempt(payload.attemptId, isLive)) {
    return { success: false, error: 'A submission for this attempt already exists' };
  }

  const questions = quiz.questions || [];
  if (questions.length === 0) {
    return { success: false, error: 'Quiz has no questions configured' };
  }

  const answerMap = new Map<string, SelectedAnswer>();
  for (const item of payload.answers) {
    answerMap.set(item.questionId, item);
  }

  const validationError = validateQuestionSelections(questions, answerMap);
  if (validationError) {
    return { success: false, error: validationError };
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

  const submissionId = generateCanonicalUuid();
  const submittedAt = new Date().toISOString();
  const participantData = {
    club_name: payload.participant.club_name || null,
    district_number: payload.participant.district_number || null,
    position: payload.participant.position || null,
    ...(payload.participant.data || {})
  };

  const subRecord: Submission = {
    id: submissionId,
    quiz_id: quiz.id,
    participant_name: payload.participant.name,
    participant_email: payload.participant.email || null,
    participant_data: participantData,
    score: finalScore,
    total_possible_marks: totalPossibleMarks,
    percentage,
    passed,
    submitted_at: submittedAt,
    attempt_id: payload.attemptId || null
  };

  const saveRes = isLive
    ? await saveLiveSubmission(subRecord, breakdown, answerMap)
    : saveMockSubmission(subRecord, breakdown, answerMap);

  if (!saveRes.success) {
    return { success: false, error: saveRes.error };
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
