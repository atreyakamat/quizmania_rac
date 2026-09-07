import type { PublicQuiz, PublicQuestion, PublicOption, Theme } from '@quizmania/types';
import { getQuizAvailability } from '@quizmania/quiz-schema';
import { getSupabasePublicClient, getSupabaseAdminClient, isSupabaseDatabaseReady } from '../supabase';
import { mockStore } from '../mock-data';

/**
 * Public Data Access Layer (DAL)
 * CRITICAL SECURITY INVARIANT:
 * This layer MUST NEVER return `is_correct`, correct answers, or internal metadata to the client.
 */
export async function getPublishedQuizBySlug(slug: string): Promise<PublicQuiz | null> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const supabase = getSupabasePublicClient();
    if (supabase) {
      // 1. Fetch quiz by slug where status is published
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          slug,
          description,
          cover_image,
          status,
          settings,
          instructions,
          theme:themes(*),
          sections:sections(*)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (quizError) {
        throw new Error(`Supabase getPublishedQuizBySlug error: ${quizError.message}`);
      }

      if (quizData) {
        // 2. Fetch questions ordered by question_order
        const { data: questionsData, error: qError } = await supabase
          .from('questions')
          .select(`
            id,
            quiz_id,
            question_text,
            question_description,
            question_type,
            question_image,
            marks,
            negative_marks,
            required,
            question_order,
            section_title,
            section_description,
            time_limit_seconds,
            scoring_method
          `)
          .eq('quiz_id', quizData.id)
          .order('question_order', { ascending: true });

        if (qError) throw new Error(`Supabase questions error: ${qError.message}`);

        if (questionsData) {
          const questionIds = questionsData.map(q => q.id);

          // 3. Fetch options explicitly omitting is_correct
          let optionsData: any[] = [];
          if (questionIds.length > 0) {
            const { data: opts, error: optError } = await supabase
              .from('options')
              .select(`
                id,
                question_id,
                option_text,
                option_image,
                option_order
              `)
              .in('question_id', questionIds)
              .order('option_order', { ascending: true });

            if (optError) throw new Error(`Supabase options error: ${optError.message}`);
            optionsData = opts || [];
          }

          // 4. Assemble public questions
          let totalMarks = 0;
          const questions: PublicQuestion[] = questionsData.map(q => {
            totalMarks += Number(q.marks) || 0;
            const opts: PublicOption[] = optionsData
              .filter(opt => opt.question_id === q.id)
              .map(opt => ({
                id: opt.id,
                question_id: opt.question_id,
                option_text: opt.option_text,
                option_image: opt.option_image,
                option_order: opt.option_order
              }));

            return {
              id: q.id,
              quiz_id: q.quiz_id,
              question_text: q.question_text,
              question_description: q.question_description,
              question_type: q.question_type,
              question_image: q.question_image,
              marks: q.marks,
              negative_marks: q.negative_marks,
              required: q.required,
              question_order: q.question_order,
              section_title: q.section_title,
              section_description: q.section_description,
              time_limit_seconds: q.time_limit_seconds,
              scoring_method: q.scoring_method,
              options: opts
            };
          });

          const sections = Array.isArray(quizData.sections)
            ? [...quizData.sections].sort((a: any, b: any) => (a.section_order || 0) - (b.section_order || 0))
            : [];

          const start_at = (quizData as any).start_at ?? quizData.settings?.start_at ?? null;
          const end_at = (quizData as any).end_at ?? quizData.settings?.end_at ?? null;
          const schedule_enabled = quizData.settings?.schedule_enabled ?? Boolean(start_at || end_at);
          const settings = {
            ...(quizData.settings || {}),
            schedule_enabled,
            start_at,
            end_at
          };

          const publicQuiz: PublicQuiz = {
            id: quizData.id,
            title: quizData.title,
            slug: quizData.slug,
            description: quizData.description,
            cover_image: quizData.cover_image,
            status: 'published',
            theme: (Array.isArray(quizData.theme) ? quizData.theme[0] : quizData.theme) as Theme | null,
            settings,
            instructions: quizData.instructions ?? (quizData.settings as any)?.instructions ?? null,
            start_at,
            end_at,
            sections,
            questions,
            totalQuestions: questions.length,
            totalMarks
          };
          publicQuiz.availability = getQuizAvailability(publicQuiz);
          return publicQuiz;
        }
      }
      return null;
    }
  }

  // Fallback to local mock data store (Disallowed in production)
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const mockQuiz = mockStore.getQuizBySlug(slug);
  if (!mockQuiz || mockQuiz.status !== 'published') {
    return null;
  }

  let totalMarks = 0;
  const questions: PublicQuestion[] = (mockQuiz.questions || []).map(q => {
    totalMarks += q.marks || 0;
    // Strictly strip `is_correct`
    const publicOptions: PublicOption[] = (q.options || []).map(opt => ({
      id: opt.id,
      question_id: opt.question_id,
      option_text: opt.option_text,
      option_image: opt.option_image,
      option_order: opt.option_order
    }));

    return {
      id: q.id,
      quiz_id: q.quiz_id,
      question_text: q.question_text,
      question_description: q.question_description,
      question_type: q.question_type,
      question_image: q.question_image,
      marks: q.marks,
      negative_marks: q.negative_marks,
      required: q.required,
      question_order: q.question_order,
      section_title: q.section_title,
      section_description: q.section_description,
      time_limit_seconds: q.time_limit_seconds,
      scoring_method: q.scoring_method,
      options: publicOptions
    };
  });

  const sections = mockQuiz.sections
    ? [...mockQuiz.sections].sort((a, b) => (a.section_order || 0) - (b.section_order || 0))
    : [];

  const mockStartAt = mockQuiz.start_at ?? mockQuiz.settings?.start_at ?? null;
  const mockEndAt = mockQuiz.end_at ?? mockQuiz.settings?.end_at ?? null;
  const mockScheduleEnabled = mockQuiz.settings?.schedule_enabled ?? Boolean(mockStartAt || mockEndAt);
  const mockSettings = {
    ...(mockQuiz.settings || {}),
    schedule_enabled: mockScheduleEnabled,
    start_at: mockStartAt,
    end_at: mockEndAt
  };

  const publicMockQuiz: PublicQuiz = {
    id: mockQuiz.id,
    title: mockQuiz.title,
    slug: mockQuiz.slug,
    description: mockQuiz.description,
    cover_image: mockQuiz.cover_image,
    status: 'published',
    theme: mockQuiz.theme || null,
    settings: mockSettings,
    instructions: mockQuiz.instructions ?? (mockQuiz.settings as any)?.instructions ?? null,
    start_at: mockStartAt,
    end_at: mockEndAt,
    sections,
    questions,
    totalQuestions: questions.length,
    totalMarks
  };
  publicMockQuiz.availability = getQuizAvailability(publicMockQuiz);
  return publicMockQuiz;
}

/**
 * Returns a list of published quizzes for the public index/catalog.
 */
export async function getPublishedQuizzesList(): Promise<Array<{
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  theme: any;
  settings: any;
  start_at?: string | null;
  end_at?: string | null;
  availability?: any;
  questionCount: number;
}>> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const supabase = getSupabasePublicClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          slug,
          description,
          cover_image,
          settings,
          theme:themes(*),
          questions(count)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Supabase getPublishedQuizzesList error: ${error.message}`);
      }

      if (data) {
        return data.map(q => {
          const start_at = (q as any).start_at ?? q.settings?.start_at ?? null;
          const end_at = (q as any).end_at ?? q.settings?.end_at ?? null;
          const settings = {
            ...(q.settings || {}),
            start_at,
            end_at
          };
          const availability = getQuizAvailability({
            status: 'published',
            start_at,
            end_at,
            settings
          });
          return {
            id: q.id,
            title: q.title,
            slug: q.slug,
            description: q.description,
            cover_image: q.cover_image,
            theme: q.theme,
            settings,
            start_at,
            end_at,
            availability,
            questionCount: (q.questions as any)?.[0]?.count ?? 0
          };
        });
      }
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return [];
  }

  return mockStore.getQuizzes()
    .filter(q => q.status === 'published')
    .map(q => {
      const start_at = q.start_at ?? q.settings?.start_at ?? null;
      const end_at = q.end_at ?? q.settings?.end_at ?? null;
      const settings = {
        ...(q.settings || {}),
        start_at,
        end_at
      };
      const availability = getQuizAvailability({
        status: 'published',
        start_at,
        end_at,
        settings
      });
      return {
        id: q.id,
        title: q.title,
        slug: q.slug,
        description: q.description,
        cover_image: q.cover_image,
        theme: q.theme,
        settings,
        start_at,
        end_at,
        availability,
        questionCount: q.questions?.length || 0
      };
    });
}

export interface QuizAttemptRecord {
  id: string;
  quiz_id: string;
  session_token: string;
  participant_name: string;
  participant_email?: string | null;
  participant_data?: Record<string, any> | null;
  started_at: string;
  expires_at?: string | null;
  submitted_at?: string | null;
  status: 'started' | 'in_progress' | 'submitted' | 'auto_submitted' | 'expired' | 'abandoned';
}

export async function createQuizAttempt(data: QuizAttemptRecord): Promise<QuizAttemptRecord> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const supabase = getSupabaseAdminClient() || getSupabasePublicClient();
    if (supabase) {
      const { data: inserted, error } = await supabase
        .from('quiz_attempts')
        .insert({
          id: data.id,
          quiz_id: data.quiz_id,
          session_token: data.session_token,
          participant_name: data.participant_name,
          participant_email: data.participant_email || null,
          participant_data: data.participant_data || {},
          started_at: data.started_at,
          expires_at: data.expires_at || null,
          status: data.status,
          attempt_number: 1
        })
        .select()
        .single();
      if (error) {
        throw new Error(`Supabase createQuizAttempt error: ${error.message}`);
      }
      return inserted;
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database connection unavailable in production environment');
  }

  return mockStore.createAttempt({
    ...data,
    expires_at: data.expires_at ?? null,
    submitted_at: data.submitted_at ?? null
  });
}

export async function getQuizAttemptByToken(token: string): Promise<QuizAttemptRecord | null> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const supabase = getSupabaseAdminClient() || getSupabasePublicClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('session_token', token)
        .maybeSingle();
      if (error) {
        throw new Error(`Supabase getQuizAttemptByToken error: ${error.message}`);
      }
      return data || null;
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const attempt = mockStore.getAttemptByToken(token);
  return attempt || null;
}

export async function updateQuizAttemptStatus(
  token: string,
  status: QuizAttemptRecord['status'],
  submittedAt?: string | null
): Promise<void> {
  const isLive = await isSupabaseDatabaseReady();
  if (isLive) {
    const supabase = getSupabaseAdminClient() || getSupabasePublicClient();
    if (supabase) {
      const updatePayload: Record<string, any> = { status };
      if (submittedAt !== undefined) {
        updatePayload.submitted_at = submittedAt;
      }
      const { error } = await supabase
        .from('quiz_attempts')
        .update(updatePayload)
        .eq('session_token', token);
      if (error) {
        throw new Error(`Supabase updateQuizAttemptStatus error: ${error.message}`);
      }
      return;
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database connection unavailable in production environment');
  }

  mockStore.updateAttemptStatus(token, status, submittedAt || undefined);
}

