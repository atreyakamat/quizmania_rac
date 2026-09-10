import type { 
  Quiz, 
  Theme, 
  Submission, 
  QuizStatus, 
  QuizJsonImportFormat, 
  Question, 
  Option,
  ResponseListItem,
  QuestionResponseDetail,
  ResponseDetail,
  ResponsesFilterParams,
  ResponsesSummary,
  PaginatedResponsesResult,
  Answer,
  QuizSection
} from '@quizmania/types';
import { convertQuizJsonToQuiz, getQuizAvailability, validateScheduleTimes, generateCanonicalUuid } from '@quizmania/quiz-schema';
import { getSupabaseAdminClient, isSupabaseDatabaseReady } from '../supabase';
import { mockStore, AdminUserRecord } from '../mock-data';
import { ClubSummaryReport, generateClubSummary, exportClubSummaryCsv } from '../club-summary';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function ensureUuid(id?: string | null): string {
  if (id && UUID_REGEX.test(id)) return id;
  // Classification: SECURITY-SENSITIVE
  // Cryptographically secure UUID ensures database primary keys cannot be predicted or collided
  return generateCanonicalUuid();
}

export function normalizeQuizRecord(quiz: any): Quiz {
  if (!quiz) return quiz;
  const start_at = quiz.start_at ?? quiz.settings?.start_at ?? null;
  const end_at = quiz.end_at ?? quiz.settings?.end_at ?? null;
  const schedule_enabled = quiz.settings?.schedule_enabled ?? Boolean(start_at || end_at);
  const settings = {
    ...(quiz.settings || {}),
    schedule_enabled,
    start_at,
    end_at
  };
  const normalized: Quiz = {
    ...quiz,
    start_at,
    end_at,
    settings,
    instructions: quiz.instructions ?? quiz.settings?.instructions ?? null,
  };
  normalized.availability = getQuizAvailability(normalized);
  return normalized;
}

/**
 * Admin Data Access Layer (Local & Private Server-Side Only)
 * Deterministic: When Supabase is ready, uses Supabase. Otherwise uses local disk-synced store.
 */
function sortQuizQuestionsAndSections(quiz: any): any {
  if (Array.isArray(quiz.questions)) {
    quiz.questions.sort((a: any, b: any) => (a.question_order || 0) - (b.question_order || 0));
    for (const q of quiz.questions) {
      if (Array.isArray(q.options)) {
        q.options.sort((a: any, b: any) => (a.option_order || 0) - (b.option_order || 0));
      }
    }
  }
  if (Array.isArray(quiz.sections)) {
    quiz.sections.sort((a: any, b: any) => (a.section_order || 0) - (b.section_order || 0));
  }
  return quiz;
}

const QUIZ_QUERY_SELECT = `
  *,
  theme:themes(*),
  sections:sections(*),
  questions:questions(
    *,
    options:options(*)
  )
`;

async function fetchLiveAllQuizzes(filterStatus?: QuizStatus): Promise<Quiz[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  let query = supabase
    .from('quizzes')
    .select(QUIZ_QUERY_SELECT)
    .order('created_at', { ascending: false });

  if (filterStatus) {
    query = query.eq('status', filterStatus);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Supabase getAllQuizzes error: ${error.message}`);
  }
  if (!data) return [];

  for (const quiz of data as any[]) {
    sortQuizQuestionsAndSections(quiz);
  }
  return (data as any[]).map(normalizeQuizRecord);
}

/**
 * Admin Data Access Layer (Local & Private Server-Side Only)
 * Deterministic: When Supabase is ready, uses Supabase. Otherwise uses local disk-synced store.
 */
export async function getAllQuizzes(filterStatus?: QuizStatus): Promise<Quiz[]> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    return fetchLiveAllQuizzes(filterStatus);
  }

  const list = filterStatus
    ? mockStore.getQuizzes().filter(q => q.status === filterStatus)
    : mockStore.getQuizzes();
  return list.map(normalizeQuizRecord);
}

async function fetchLiveQuizById(id: string): Promise<Quiz | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('quizzes')
    .select(QUIZ_QUERY_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase getQuizById error: ${error.message}`);
  }
  if (!data) return null;

  sortQuizQuestionsAndSections(data);
  return normalizeQuizRecord(data);
}

export async function getQuizById(id: string): Promise<Quiz | null> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    return fetchLiveQuizById(id);
  }

  const mockQuiz = mockStore.getQuizById(id);
  return mockQuiz ? normalizeQuizRecord(mockQuiz) : null;
}

async function fetchLiveQuizBySlug(slug: string): Promise<Quiz | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('quizzes')
    .select(QUIZ_QUERY_SELECT)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase getQuizBySlug error: ${error.message}`);
  }
  if (!data) return null;

  sortQuizQuestionsAndSections(data);
  return normalizeQuizRecord(data);
}

export async function getQuizBySlug(slug: string): Promise<Quiz | null> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    return fetchLiveQuizBySlug(slug);
  }

  const mockQuiz = mockStore.getQuizBySlug(slug);
  return mockQuiz ? normalizeQuizRecord(mockQuiz) : null;
}

async function upsertLiveQuizRecord(
  supabase: any,
  quiz: Partial<Quiz> & { title: string; slug: string },
  quizId: string,
  rawStartAt: string | null,
  rawEndAt: string | null,
  settingsToSave: any
): Promise<void> {
  const basePayload: Record<string, any> = {
    id: quizId,
    title: quiz.title,
    slug: quiz.slug,
    description: quiz.description ?? null,
    cover_image: quiz.cover_image ?? null,
    status: quiz.status || 'draft',
    theme_id: quiz.theme_id && UUID_REGEX.test(quiz.theme_id) ? quiz.theme_id : null,
    settings: settingsToSave,
    instructions: (quiz as any).instructions ?? (quiz.settings as any)?.instructions ?? null,
    updated_at: new Date().toISOString()
  };

  let { error: quizError } = await supabase
    .from('quizzes')
    .upsert({
      ...basePayload,
      start_at: rawStartAt,
      end_at: rawEndAt
    });

  if (
    quizError &&
    (quizError.message?.includes('start_at') ||
     quizError.message?.includes('end_at') ||
     quizError.message?.includes('schema cache') ||
     quizError.code === '42703' ||
     quizError.code === 'PGRST204')
  ) {
    const fallback = await supabase
      .from('quizzes')
      .upsert(basePayload);
    quizError = fallback.error;
  }

  if (quizError) {
    throw new Error(`Supabase saveQuiz error: ${quizError.message}`);
  }
}

async function upsertLiveQuizSections(supabase: any, quizId: string, sections: QuizSection[]): Promise<void> {
  const sectionIds: string[] = [];
  const sectionsToUpsert = sections.map((sec, idx) => {
    const secId = ensureUuid(sec.id);
    sectionIds.push(secId);
    return {
      id: secId,
      quiz_id: quizId,
      title: sec.title,
      description: sec.description ?? null,
      section_order: sec.section_order ?? (idx + 1)
    };
  });

  if (sectionIds.length > 0) {
    await supabase
      .from('sections')
      .delete()
      .eq('quiz_id', quizId)
      .not('id', 'in', `(${sectionIds.join(',')})`);
  } else {
    await supabase.from('sections').delete().eq('quiz_id', quizId);
  }

  if (sectionsToUpsert.length > 0) {
    const { error: secError } = await supabase.from('sections').upsert(sectionsToUpsert);
    if (secError) throw new Error(`Supabase sections error: ${secError.message}`);
  }
}

async function upsertLiveQuizQuestionsAndOptions(supabase: any, quizId: string, questions: Question[]): Promise<void> {
  const questionIds: string[] = [];
  const questionsToUpsert: any[] = [];
  const optionsPerQuestion: { questionId: string; options: any[] }[] = [];

  for (let qIdx = 0; qIdx < questions.length; qIdx++) {
    const q = questions[qIdx];
    const qId = ensureUuid(q.id);
    questionIds.push(qId);

    questionsToUpsert.push({
      id: qId,
      quiz_id: quizId,
      section_id: q.section_id && UUID_REGEX.test(q.section_id) ? q.section_id : null,
      question_text: q.question_text,
      question_description: q.question_description ?? null,
      question_type: q.question_type,
      question_image: q.question_image ?? null,
      marks: q.marks ?? 5,
      negative_marks: q.negative_marks ?? 0,
      required: q.required ?? true,
      question_order: q.question_order ?? (qIdx + 1),
      section_title: q.section_title ?? null,
      section_description: q.section_description ?? null,
      time_limit_seconds: q.time_limit_seconds ?? null,
      scoring_method: q.scoring_method ?? 'all_or_nothing',
      accepted_answers: q.accepted_answers ?? [],
      case_sensitive: q.case_sensitive ?? false,
      trim_whitespace: q.trim_whitespace ?? true,
      normalize_spaces: q.normalize_spaces ?? true,
      updated_at: new Date().toISOString()
    });

    if (q.options && Array.isArray(q.options)) {
      const optList = q.options.map((opt, optIdx) => ({
        id: ensureUuid(opt.id),
        question_id: qId,
        option_text: opt.option_text,
        option_image: opt.option_image ?? null,
        is_correct: Boolean(opt.is_correct),
        option_order: opt.option_order ?? (optIdx + 1)
      }));
      optionsPerQuestion.push({ questionId: qId, options: optList });
    }
  }

  if (questionIds.length > 0) {
    await supabase
      .from('questions')
      .delete()
      .eq('quiz_id', quizId)
      .not('id', 'in', `(${questionIds.join(',')})`);
  } else {
    await supabase.from('questions').delete().eq('quiz_id', quizId);
  }

  if (questionsToUpsert.length > 0) {
    const { error: qError } = await supabase.from('questions').upsert(questionsToUpsert);
    if (qError) {
      throw new Error(`Supabase questions error: ${qError.message}`);
    }
  }

  for (const { questionId, options } of optionsPerQuestion) {
    const optIds = options.map(o => o.id);
    if (optIds.length > 0) {
      await supabase
        .from('options')
        .delete()
        .eq('question_id', questionId)
        .not('id', 'in', `(${optIds.join(',')})`);

      const { error: optError } = await supabase.from('options').upsert(options);
      if (optError) throw new Error(`Supabase options error: ${optError.message}`);
    } else {
      await supabase.from('options').delete().eq('question_id', questionId);
    }
  }
}

async function saveLiveQuiz(
  quiz: Partial<Quiz> & { title: string; slug: string },
  rawStartAt: string | null,
  rawEndAt: string | null,
  settingsToSave: any
): Promise<Quiz | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const quizId = ensureUuid(quiz.id);
  await upsertLiveQuizRecord(supabase, quiz, quizId, rawStartAt, rawEndAt, settingsToSave);

  if (quiz.sections && Array.isArray(quiz.sections)) {
    await upsertLiveQuizSections(supabase, quizId, quiz.sections);
  }

  if (quiz.questions && Array.isArray(quiz.questions)) {
    await upsertLiveQuizQuestionsAndOptions(supabase, quizId, quiz.questions);
  }

  return getQuizById(quizId);
}

export async function saveQuiz(quiz: Partial<Quiz> & { title: string; slug: string }): Promise<Quiz> {
  const rawStartAt = quiz.start_at ?? quiz.settings?.start_at ?? null;
  const rawEndAt = quiz.end_at ?? quiz.settings?.end_at ?? null;
  const scheduleEnabled = quiz.settings?.schedule_enabled ?? Boolean(rawStartAt || rawEndAt);

  const { valid, error: schedError } = validateScheduleTimes(rawStartAt, rawEndAt);
  if (!valid) {
    throw new Error(schedError || 'End time must be later than start time.');
  }

  const settingsToSave = {
    ...(quiz.settings || {}),
    schedule_enabled: scheduleEnabled,
    start_at: rawStartAt,
    end_at: rawEndAt
  };

  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const fullSaved = await saveLiveQuiz(quiz, rawStartAt, rawEndAt, settingsToSave);
    if (fullSaved) {
      return fullSaved;
    }
  }

  const mockSaved = mockStore.saveQuiz({
    ...quiz,
    start_at: rawStartAt,
    end_at: rawEndAt,
    settings: settingsToSave
  } as Quiz);
  return normalizeQuizRecord(mockSaved);
}

export async function setQuizStatus(id: string, status: QuizStatus): Promise<Quiz | null> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('quizzes')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase setQuizStatus error: ${error.message}`);
      }
      return normalizeQuizRecord(data);
    }
  }

  const updated = mockStore.updateQuizStatus(id, status);
  return updated ? normalizeQuizRecord(updated) : null;
}

export const updateQuizStatus = setQuizStatus;

export async function deleteQuiz(id: string): Promise<boolean> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { error } = await supabase.from('quizzes').delete().eq('id', id);
      if (error) {
        throw new Error(`Supabase deleteQuiz error: ${error.message}`);
      }
      return true;
    }
  }

  return mockStore.deleteQuiz(id);
}

export async function getAllThemes(): Promise<Theme[]> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data, error } = await supabase.from('themes').select('*').order('created_at', { ascending: false });
      if (error) {
        throw new Error(`Supabase getAllThemes error: ${error.message}`);
      }
      return data as Theme[];
    }
  }

  return mockStore.getThemes();
}

export async function getThemeById(id: string): Promise<Theme | null> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data, error } = await supabase.from('themes').select('*').eq('id', id).maybeSingle();
      if (error) {
        throw new Error(`Supabase getThemeById error: ${error.message}`);
      }
      return data as Theme | null;
    }
  }

  return mockStore.getThemes().find(t => t.id === id) || null;
}

export async function saveTheme(theme: Theme): Promise<Theme> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data, error } = await supabase.from('themes').upsert(theme).select().single();
      if (error) {
        throw new Error(`Supabase saveTheme error: ${error.message}`);
      }
      return data as Theme;
    }
  }

  return mockStore.saveTheme(theme);
}

export async function getAllSubmissions(quizId?: string): Promise<Submission[]> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      let query = supabase.from('submissions').select('*').order('submitted_at', { ascending: false });
      if (quizId) {
        query = query.eq('quiz_id', quizId);
      }
      const { data, error } = await query;
      if (error) {
        throw new Error(`Supabase getAllSubmissions error: ${error.message}`);
      }
      return data as Submission[];
    }
  }

  return mockStore.getSubmissions(quizId);
}

/**
 * Import a quiz from the standardized JSON format
 */
export async function importQuizFromJson(jsonData: QuizJsonImportFormat): Promise<Quiz> {
  let themeId: string | null = null;
  if (jsonData.theme) {
    const newTheme: Theme = {
      id: ensureUuid(),
      name: jsonData.theme.name,
      primary_color: jsonData.theme.primaryColor,
      secondary_color: jsonData.theme.secondaryColor,
      background_color: jsonData.theme.backgroundColor,
      surface_color: jsonData.theme.surfaceColor,
      text_color: jsonData.theme.textColor,
      button_color: jsonData.theme.buttonColor || jsonData.theme.primaryColor,
      border_radius: jsonData.theme.borderRadius || '0.75rem',
      font_family: jsonData.theme.fontFamily || 'Inter, system-ui, sans-serif'
    };
    const savedTheme = await saveTheme(newTheme);
    themeId = savedTheme.id;
  }

  const result = convertQuizJsonToQuiz(jsonData);
  if (!result.success || !result.quiz) {
    throw new Error(result.errors ? result.errors.join(', ') : 'Failed to parse quiz JSON');
  }

  const quizToSave: Quiz = {
    ...result.quiz,
    theme_id: themeId || result.quiz.theme_id
  };

  return await saveQuiz(quizToSave);
}

/**
 * Export a quiz into the standardized JSON format
 */
export async function exportQuizToJson(quizId: string): Promise<QuizJsonImportFormat | null> {
  const quiz = await getQuizById(quizId);
  if (!quiz) return null;

  return {
    title: quiz.title,
    slug: quiz.slug,
    description: quiz.description,
    status: quiz.status,
    start_at: quiz.start_at ?? quiz.settings?.start_at,
    end_at: quiz.end_at ?? quiz.settings?.end_at,
    schedule_enabled: quiz.settings?.schedule_enabled,
    theme: quiz.theme ? {
      name: quiz.theme.name,
      primaryColor: quiz.theme.primary_color,
      secondaryColor: quiz.theme.secondary_color,
      backgroundColor: quiz.theme.background_color,
      surfaceColor: quiz.theme.surface_color,
      textColor: quiz.theme.text_color,
      buttonColor: quiz.theme.button_color,
      borderRadius: quiz.theme.border_radius,
      fontFamily: quiz.theme.font_family
    } : undefined,
    coverImage: quiz.cover_image,
    instructions: quiz.instructions,
    settings: quiz.settings,
    sections: quiz.sections && quiz.sections.length > 0 ? quiz.sections.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      section_order: s.section_order
    })) : undefined,
    questions: (quiz.questions || []).map(q => ({
      id: q.id,
      question: q.question_text,
      description: q.question_description,
      type: q.question_type,
      required: q.required,
      marks: q.marks,
      negative_marks: q.negative_marks,
      image: q.question_image,
      section_title: q.section_title,
      section_description: q.section_description,
      time_limit_seconds: q.time_limit_seconds,
      scoring_method: q.scoring_method,
      accepted_answers: q.accepted_answers,
      case_sensitive: q.case_sensitive,
      options: (q.options || []).map(opt => ({
        id: opt.id,
        text: opt.option_text,
        correct: opt.is_correct,
        image: opt.option_image
      }))
    }))
  };
}

/**
 * Retrieves paginated participant responses with server-side filtering, search, and summary metrics.
 */
async function fetchSubmissionsAndQuizzes(
  filters: ResponsesFilterParams,
  isLive: boolean
): Promise<{ submissions: Submission[]; quizzes: Quiz[] }> {
  if (isLive) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      let query = supabase.from('submissions').select('*').order(filters.sortBy || 'submitted_at', {
        ascending: filters.sortOrder === 'asc'
      });

      if (filters.quizId) {
        query = query.eq('quiz_id', filters.quizId);
      }
      if (filters.status === 'passed') {
        query = query.eq('passed', true);
      } else if (filters.status === 'failed') {
        query = query.eq('passed', false);
      }
      if (filters.minScore !== undefined && filters.minScore !== null) {
        query = query.gte('score', filters.minScore);
      }
      if (filters.maxScore !== undefined && filters.maxScore !== null) {
        query = query.lte('score', filters.maxScore);
      }
      if (filters.startDate) {
        query = query.gte('submitted_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('submitted_at', filters.endDate);
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(`Supabase getResponsesPaginated error: ${error.message}`);
      }
      const submissions = (data as Submission[]) || [];
      const quizzes = await getAllQuizzes();
      return { submissions, quizzes };
    }
  }

  return {
    submissions: mockStore.getSubmissions(),
    quizzes: mockStore.getQuizzes()
  };
}

function toResponseListItem(sub: Submission, quizMap: Map<string, Quiz>): ResponseListItem {
  const quiz = quizMap.get(sub.quiz_id);
  return {
    id: sub.id,
    quiz_id: sub.quiz_id,
    quiz_title: quiz?.title || 'Unknown Quiz',
    quiz_slug: quiz?.slug,
    participant_name: sub.participant_name,
    participant_email: sub.participant_email || null,
    participant_data: sub.participant_data || null,
    score: Number(sub.score) || 0,
    total_possible_marks: Number(sub.total_possible_marks) || 0,
    percentage: Number(sub.percentage) || 0,
    passed: Boolean(sub.passed),
    submitted_at: sub.submitted_at,
    attempt_id: sub.attempt_id,
    time_taken_seconds: sub.time_taken_seconds
  };
}

function filterMockResponseItems(items: ResponseListItem[], filters: ResponsesFilterParams): ResponseListItem[] {
  let filtered = items;
  if (filters.quizId) {
    filtered = filtered.filter(i => i.quiz_id === filters.quizId);
  }
  if (filters.status === 'passed') {
    filtered = filtered.filter(i => i.passed);
  } else if (filters.status === 'failed') {
    filtered = filtered.filter(i => !i.passed);
  }
  if (filters.minScore !== undefined && filters.minScore !== null) {
    filtered = filtered.filter(i => i.score >= filters.minScore!);
  }
  if (filters.maxScore !== undefined && filters.maxScore !== null) {
    filtered = filtered.filter(i => i.score <= filters.maxScore!);
  }
  if (filters.startDate) {
    filtered = filtered.filter(i => new Date(i.submitted_at) >= new Date(filters.startDate!));
  }
  if (filters.endDate) {
    filtered = filtered.filter(i => new Date(i.submitted_at) <= new Date(filters.endDate!));
  }
  return filtered;
}

function searchResponseItems(items: ResponseListItem[], search?: string): ResponseListItem[] {
  if (!search || !search.trim()) return items;
  const query = search.toLowerCase().trim();
  return items.filter(i => {
    const nameMatch = i.participant_name.toLowerCase().includes(query);
    const emailMatch = i.participant_email?.toLowerCase().includes(query) ?? false;
    const quizMatch = i.quiz_title.toLowerCase().includes(query);
    const clubMatch = (i.participant_data?.club_name as string)?.toLowerCase().includes(query) ?? false;
    return nameMatch || emailMatch || quizMatch || clubMatch;
  });
}

function sortResponseItems(items: ResponseListItem[], sortBy = 'submitted_at', sortOrder = 'desc'): void {
  const mult = sortOrder === 'asc' ? 1 : -1;
  items.sort((a, b) => {
    if (sortBy === 'submitted_at') {
      return (new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()) * mult;
    }
    if (sortBy === 'score') {
      return (a.score - b.score) * mult;
    }
    if (sortBy === 'percentage') {
      return (a.percentage - b.percentage) * mult;
    }
    if (sortBy === 'participant_name') {
      return a.participant_name.localeCompare(b.participant_name) * mult;
    }
    return 0;
  });
}

function calculateResponsesSummary(items: ResponseListItem[]): ResponsesSummary {
  const total = items.length;
  let totalScoreSum = 0;
  let totalPercentageSum = 0;
  let passCount = 0;
  let highestScore = total > 0 ? items[0].score : 0;
  let lowestScore = total > 0 ? items[0].score : 0;

  for (const item of items) {
    totalScoreSum += item.score;
    totalPercentageSum += item.percentage;
    if (item.passed) passCount++;
    if (item.score > highestScore) highestScore = item.score;
    if (item.score < lowestScore) lowestScore = item.score;
  }

  const failCount = total - passCount;
  return {
    totalResponses: total,
    averageScore: total > 0 ? Math.round((totalScoreSum / total) * 10) / 10 : 0,
    averagePercentage: total > 0 ? Math.round((totalPercentageSum / total) * 10) / 10 : 0,
    passCount,
    failCount,
    passRate: total > 0 ? Math.round((passCount / total) * 100) : 0,
    highestScore,
    lowestScore
  };
}

/**
 * Retrieves paginated participant responses with server-side filtering, search, and summary metrics.
 */
export async function getResponsesPaginated(filters: ResponsesFilterParams = {}): Promise<PaginatedResponsesResult> {
  const isLive = await isSupabaseDatabaseReady();
  const { submissions, quizzes } = await fetchSubmissionsAndQuizzes(filters, isLive);

  const quizMap = new Map<string, Quiz>(quizzes.map(q => [q.id, q]));
  let items: ResponseListItem[] = submissions.map(sub => toResponseListItem(sub, quizMap));

  if (!isLive) {
    items = filterMockResponseItems(items, filters);
  }

  items = searchResponseItems(items, filters.search);
  sortResponseItems(items, filters.sortBy, filters.sortOrder);
  const summary = calculateResponsesSummary(items);

  const total = items.length;
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 25));
  const totalPages = Math.ceil(total / pageSize) || 1;
  const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize);

  return {
    items: paginatedItems,
    total,
    page,
    pageSize,
    totalPages,
    summary
  };
}

/**
 * Retrieves full response detail including question-by-question breakdown, participant answers,
 * and correct answer key for Admin review and manual grading.
 */
export async function getResponseDetail(submissionId: string): Promise<ResponseDetail | null> {
  const isLive = await isSupabaseDatabaseReady();
  let submission: Submission | null = null;
  let answers: Answer[] = [];

  if (isLive) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return null;

    const { data: subData, error: subError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .maybeSingle();

    if (subError || !subData) return null;
    submission = subData as Submission;

    const { data: ansData } = await supabase
      .from('answers')
      .select('*')
      .eq('submission_id', submissionId);
    answers = (ansData as Answer[]) || [];
  } else {
    const sub = mockStore.getSubmissionById(submissionId);
    if (!sub) return null;
    submission = sub;
    answers = mockStore.getAnswers(submissionId);
  }

  const quiz = await getQuizById(submission.quiz_id);
  if (!quiz) return null;

  const answerMap = new Map<string, Answer>();
  for (const a of answers) {
    answerMap.set(a.question_id, a);
  }

  const questions: QuestionResponseDetail[] = (quiz.questions || []).map(q => {
    const ans = answerMap.get(q.id);
    const options = q.options || [];

    // Selected options text lookup
    let selectedOptionTexts: string[] = [];
    if (ans?.selected_option_ids && ans.selected_option_ids.length > 0) {
      selectedOptionTexts = options
        .filter(o => ans.selected_option_ids!.includes(o.id))
        .map(o => o.option_text);
    } else if (ans?.selected_option_id) {
      const match = options.find(o => o.id === ans.selected_option_id);
      if (match) selectedOptionTexts = [match.option_text];
    }

    const correctOptionTexts = options
      .filter(o => o.is_correct)
      .map(o => o.option_text);

    const maxMarks = Number(q.marks) || 0;
    const earnedMarks = ans?.earned_marks !== undefined && ans?.earned_marks !== null 
      ? Number(ans.earned_marks) 
      : 0;

    let isCorrect = false;
    if (maxMarks > 0) {
      isCorrect = earnedMarks >= maxMarks;
    } else if (['single_choice', 'multiple_choice', 'true_false'].includes(q.question_type)) {
      isCorrect = correctOptionTexts.length > 0 && selectedOptionTexts.every(t => correctOptionTexts.includes(t));
    } else {
      isCorrect = Boolean(ans?.text_answer?.trim());
    }

    return {
      questionId: q.id,
      questionText: q.question_text,
      questionType: q.question_type,
      maxMarks,
      earnedMarks,
      selectedOptionId: ans?.selected_option_id || null,
      selectedOptionIds: ans?.selected_option_ids || null,
      textAnswer: ans?.text_answer || null,
      selectedOptionTexts,
      correctOptionTexts,
      acceptedAnswers: q.accepted_answers || [],
      isCorrect,
      answerId: ans?.id,
      sectionTitle: q.section_title || null
    };
  });

  return {
    submission: {
      ...submission,
      quiz_title: quiz.title,
      quiz_slug: quiz.slug
    },
    quiz,
    questions
  };
}

/**
 * Updates manual grade for a specific question answer and recalculates total submission score & percentage.
 */
export async function updateManualGrade(
  submissionId: string, 
  questionId: string, 
  earnedMarks: number
): Promise<{ success: boolean; newScore: number; newPercentage: number }> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    // 1. Check if answer row exists
    const { data: existingAns } = await supabase
      .from('answers')
      .select('id')
      .eq('submission_id', submissionId)
      .eq('question_id', questionId)
      .maybeSingle();

    if (existingAns) {
      await supabase
        .from('answers')
        .update({ earned_marks: earnedMarks })
        .eq('id', existingAns.id);
    } else {
      await supabase
        .from('answers')
        .insert({
          id: ensureUuid(),
          submission_id: submissionId,
          question_id: questionId,
          earned_marks: earnedMarks
        });
    }

    // 2. Fetch all answers for this submission to recompute total
    const { data: allAnswers } = await supabase
      .from('answers')
      .select('earned_marks')
      .eq('submission_id', submissionId);

    let newScore = 0;
    for (const a of allAnswers || []) {
      newScore += Number(a.earned_marks) || 0;
    }

    // 3. Fetch submission and quiz for percentage and passing calculation
    const { data: sub } = await supabase
      .from('submissions')
      .select('quiz_id, total_possible_marks')
      .eq('id', submissionId)
      .single();

    if (!sub) throw new Error('Submission not found');

    const totalPossible = Number(sub.total_possible_marks) || 1;
    const newPercentage = totalPossible > 0 ? Math.round((newScore / totalPossible) * 100) : 0;

    const { data: quiz } = await supabase
      .from('quizzes')
      .select('settings')
      .eq('id', sub.quiz_id)
      .single();

    const passingPercentage = quiz?.settings?.passing_score_percentage ?? 50;
    const passed = newPercentage >= passingPercentage;

    // 4. Update submission
    await supabase
      .from('submissions')
      .update({
        score: newScore,
        percentage: newPercentage,
        passed
      })
      .eq('id', submissionId);

    return { success: true, newScore, newPercentage };
  }

  return mockStore.updateAnswerMarks(submissionId, questionId, earnedMarks);
}

/**
 * Formats responses as a standardized CSV string.
 */
export async function exportResponsesCsv(filters: ResponsesFilterParams = {}): Promise<string> {
  const result = await getResponsesPaginated({
    ...filters,
    page: 1,
    pageSize: 10000 // Export all matching records
  });

  const headers = [
    'Submission ID',
    'Participant Name',
    'Participant Email',
    'Club Name',
    'District',
    'Quiz Title',
    'Score',
    'Total Possible Marks',
    'Percentage',
    'Status',
    'Submitted At'
  ];

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = result.items.map(item => [
    escapeCsv(item.id),
    escapeCsv(item.participant_name),
    escapeCsv(item.participant_email || ''),
    escapeCsv(item.participant_data?.club_name || ''),
    escapeCsv(item.participant_data?.district_number || ''),
    escapeCsv(item.quiz_title),
    escapeCsv(item.score),
    escapeCsv(item.total_possible_marks),
    escapeCsv(`${item.percentage}%`),
    escapeCsv(item.passed ? 'PASSED' : 'FAILED'),
    escapeCsv(new Date(item.submitted_at).toLocaleString())
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Generates a grouped Club Participation Summary report based on response records matching filters.
 */
export async function getClubSummary(filters: ResponsesFilterParams = {}): Promise<ClubSummaryReport> {
  const result = await getResponsesPaginated({
    ...filters,
    page: 1,
    pageSize: 10000 // Aggregate all matching records
  });

  return generateClubSummary(result.items);
}

/**
 * Formats club participation summary as a standardized CSV string.
 */
export async function exportClubSummaryCsvFromFilters(filters: ResponsesFilterParams = {}): Promise<string> {
  const summary = await getClubSummary(filters);
  return exportClubSummaryCsv(summary);
}

/**
 * Retrieves an admin user record by Supabase user_id or email.
 * Checks live database when available, falling back to environment allowlist and mock store.
 */
export async function getAdminUserRecord(userIdOrEmail: string): Promise<AdminUserRecord | null> {
  if (!userIdOrEmail) return null;
  const search = userIdOrEmail.trim().toLowerCase();

  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .or(`user_id.eq.${userIdOrEmail},email.eq.${search}`)
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          return data as AdminUserRecord;
        }
      } catch {
        // Fall back to allowlist / mock store if table is not yet migrated
      }
    }
  }

  // Check explicit ADMIN_EMAILS environment variable allowlist
  const envAdminEmails = process.env.ADMIN_EMAILS;
  if (envAdminEmails && envAdminEmails.trim().length > 0) {
    const allowed = envAdminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    if (allowed.includes(search)) {
      return {
        id: 'env-allowlist-admin',
        user_id: userIdOrEmail,
        email: search,
        role: 'admin',
        enabled: true,
        created_at: new Date().toISOString()
      };
    }
  }

  // Fallback to in-memory/disk mock store
  return mockStore.getAdminUser(userIdOrEmail);
}

/**
 * Creates or updates an admin user record in the administrative store.
 */
export async function saveAdminUserRecord(admin: AdminUserRecord): Promise<AdminUserRecord> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .upsert({
            id: admin.id || ensureUuid(),
            user_id: admin.user_id,
            email: admin.email.toLowerCase().trim(),
            role: admin.role || 'admin',
            enabled: admin.enabled ?? true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'email' })
          .select()
          .single();

        if (!error && data) {
          return data as AdminUserRecord;
        }
      } catch (err) {
        console.warn('Could not persist to admin_users table:', err);
      }
    }
  }

  return mockStore.saveAdminUser(admin);
}
