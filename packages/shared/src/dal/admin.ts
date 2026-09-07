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
  Answer
} from '@quizmania/types';
import { convertQuizJsonToQuiz } from '@quizmania/quiz-schema';
import { getSupabaseAdminClient, isSupabaseDatabaseReady } from '../supabase';
import { mockStore } from '../mock-data';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function ensureUuid(id?: string | null): string {
  if (id && UUID_REGEX.test(id)) return id;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Admin Data Access Layer (Local & Private Server-Side Only)
 * Deterministic: When Supabase is ready, uses Supabase. Otherwise uses local disk-synced store.
 */
export async function getAllQuizzes(filterStatus?: QuizStatus): Promise<Quiz[]> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      let query = supabase
        .from('quizzes')
        .select(`
          *,
          theme:themes(*),
          sections:sections(*),
          questions:questions(
            *,
            options:options(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(`Supabase getAllQuizzes error: ${error.message}`);
      }
      if (data) {
        for (const quiz of data as any[]) {
          if (quiz.questions && Array.isArray(quiz.questions)) {
            quiz.questions.sort((a: any, b: any) => (a.question_order || 0) - (b.question_order || 0));
            for (const q of quiz.questions) {
              if (q.options && Array.isArray(q.options)) {
                q.options.sort((a: any, b: any) => (a.option_order || 0) - (b.option_order || 0));
              }
            }
          }
          if (quiz.sections && Array.isArray(quiz.sections)) {
            quiz.sections.sort((a: any, b: any) => (a.section_order || 0) - (b.section_order || 0));
          }
        }
        return data as Quiz[];
      }
    }
  }

  let list = mockStore.getQuizzes();
  if (filterStatus) {
    list = list.filter(q => q.status === filterStatus);
  }
  return list;
}

export async function getQuizById(id: string): Promise<Quiz | null> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          theme:themes(*),
          sections:sections(*),
          questions:questions(
            *,
            options:options(*)
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new Error(`Supabase getQuizById error: ${error.message}`);
      }

      if (data) {
        if (data.questions && Array.isArray(data.questions)) {
          data.questions.sort((a: any, b: any) => (a.question_order || 0) - (b.question_order || 0));
          for (const q of data.questions) {
            if (q.options && Array.isArray(q.options)) {
              q.options.sort((a: any, b: any) => (a.option_order || 0) - (b.option_order || 0));
            }
          }
        }
        if (data.sections && Array.isArray(data.sections)) {
          data.sections.sort((a: any, b: any) => (a.section_order || 0) - (b.section_order || 0));
        }
        return data as Quiz;
      }
      return null;
    }
  }

  return mockStore.getQuizById(id) || null;
}

export async function saveQuiz(quiz: Partial<Quiz> & { title: string; slug: string }): Promise<Quiz> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const quizId = ensureUuid(quiz.id);

      // 1. Upsert Quiz record
      const { error: quizError } = await supabase
        .from('quizzes')
        .upsert({
          id: quizId,
          title: quiz.title,
          slug: quiz.slug,
          description: quiz.description ?? null,
          cover_image: quiz.cover_image ?? null,
          status: quiz.status || 'draft',
          theme_id: quiz.theme_id && UUID_REGEX.test(quiz.theme_id) ? quiz.theme_id : null,
          settings: quiz.settings || {},
          instructions: (quiz as any).instructions ?? (quiz.settings as any)?.instructions ?? null,
          updated_at: new Date().toISOString()
        });

      if (quizError) {
        throw new Error(`Supabase saveQuiz error: ${quizError.message}`);
      }

      // 2. Persist Sections if provided
      if (quiz.sections && Array.isArray(quiz.sections)) {
        const sectionIds: string[] = [];
        const sectionsToUpsert = quiz.sections.map((sec, idx) => {
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

        // Delete removed sections
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

      // 3. Persist Questions and Options if provided
      if (quiz.questions && Array.isArray(quiz.questions)) {
        const questionIds: string[] = [];
        const questionsToUpsert: any[] = [];
        const optionsPerQuestion: { questionId: string; options: any[] }[] = [];

        for (let qIdx = 0; qIdx < quiz.questions.length; qIdx++) {
          const q = quiz.questions[qIdx];
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

        // Delete removed questions
        if (questionIds.length > 0) {
          await supabase
            .from('questions')
            .delete()
            .eq('quiz_id', quizId)
            .not('id', 'in', `(${questionIds.join(',')})`);
        } else {
          await supabase.from('questions').delete().eq('quiz_id', quizId);
        }

        // Upsert questions
        if (questionsToUpsert.length > 0) {
          const { error: qError } = await supabase.from('questions').upsert(questionsToUpsert);
          if (qError) {
            throw new Error(`Supabase questions error: ${qError.message}`);
          }
        }

        // Handle options per question
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

      // Re-fetch and return full populated quiz
      const fullSaved = await getQuizById(quizId);
      if (fullSaved) {
        return fullSaved;
      }
    }
  }

  return mockStore.saveQuiz(quiz as Quiz);
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
      return data as Quiz;
    }
  }

  return mockStore.updateQuizStatus(id, status) || null;
}

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

export async function saveTheme(theme: Theme): Promise<Theme> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const themeId = ensureUuid(theme.id);
      const { data, error } = await supabase
        .from('themes')
        .upsert({ ...theme, id: themeId })
        .select()
        .single();
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
    settings: quiz.settings,
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
export async function getResponsesPaginated(filters: ResponsesFilterParams = {}): Promise<PaginatedResponsesResult> {
  const isLive = await isSupabaseDatabaseReady();
  let submissions: Submission[] = [];
  let quizzes: Quiz[] = [];

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
      submissions = (data as Submission[]) || [];
      quizzes = await getAllQuizzes();
    }
  } else {
    submissions = mockStore.getSubmissions();
    quizzes = mockStore.getQuizzes();
  }

  const quizMap = new Map<string, Quiz>(quizzes.map(q => [q.id, q]));

  // Transform to ResponseListItem
  let items: ResponseListItem[] = submissions.map(sub => {
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
  });

  // Local/mock filtering for criteria
  if (!isLive) {
    if (filters.quizId) {
      items = items.filter(i => i.quiz_id === filters.quizId);
    }
    if (filters.status === 'passed') {
      items = items.filter(i => i.passed);
    } else if (filters.status === 'failed') {
      items = items.filter(i => !i.passed);
    }
    if (filters.minScore !== undefined && filters.minScore !== null) {
      items = items.filter(i => i.score >= filters.minScore!);
    }
    if (filters.maxScore !== undefined && filters.maxScore !== null) {
      items = items.filter(i => i.score <= filters.maxScore!);
    }
    if (filters.startDate) {
      items = items.filter(i => new Date(i.submitted_at) >= new Date(filters.startDate!));
    }
    if (filters.endDate) {
      items = items.filter(i => new Date(i.submitted_at) <= new Date(filters.endDate!));
    }
  }

  // Universal text search (participant name, email, quiz title, or club name)
  if (filters.search && filters.search.trim()) {
    const query = filters.search.toLowerCase().trim();
    items = items.filter(i => {
      const nameMatch = i.participant_name.toLowerCase().includes(query);
      const emailMatch = i.participant_email?.toLowerCase().includes(query) ?? false;
      const quizMatch = i.quiz_title.toLowerCase().includes(query);
      const clubMatch = (i.participant_data?.club_name as string)?.toLowerCase().includes(query) ?? false;
      return nameMatch || emailMatch || quizMatch || clubMatch;
    });
  }

  // Sorting
  const sortBy = filters.sortBy || 'submitted_at';
  const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
  items.sort((a, b) => {
    if (sortBy === 'submitted_at') {
      return (new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()) * sortOrder;
    }
    if (sortBy === 'score') {
      return (a.score - b.score) * sortOrder;
    }
    if (sortBy === 'percentage') {
      return (a.percentage - b.percentage) * sortOrder;
    }
    if (sortBy === 'participant_name') {
      return a.participant_name.localeCompare(b.participant_name) * sortOrder;
    }
    return 0;
  });

  // Summary calculation over the filtered items
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
  const summary: ResponsesSummary = {
    totalResponses: total,
    averageScore: total > 0 ? Math.round((totalScoreSum / total) * 10) / 10 : 0,
    averagePercentage: total > 0 ? Math.round((totalPercentageSum / total) * 10) / 10 : 0,
    passCount,
    failCount,
    passRate: total > 0 ? Math.round((passCount / total) * 100) : 0,
    highestScore,
    lowestScore
  };

  // Pagination
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.max(1, Number(filters.pageSize) || 25);
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
