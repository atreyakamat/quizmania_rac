import type { PublicQuiz, PublicQuestion, PublicOption, Theme } from '@quizmania/types';
import { getSupabasePublicClient, isSupabaseConfigured } from '../supabase';
import { mockStore } from '../mock-data';

/**
 * Public Data Access Layer (DAL)
 * CRITICAL SECURITY INVARIANT:
 * This layer MUST NEVER return `is_correct`, correct answers, or internal metadata to the client.
 */
export async function getPublishedQuizBySlug(slug: string): Promise<PublicQuiz | null> {
  // If Supabase is configured, fetch through Supabase
  if (isSupabaseConfigured()) {
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
          theme:themes(*)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (quizError || !quizData) {
        return null;
      }

      // 2. Fetch questions ordered by question_order
      const { data: questionsData, error: qError } = await supabase
        .from('questions')
        .select(`
          id,
          quiz_id,
          question_text,
          question_type,
          question_image,
          marks,
          required,
          question_order
        `)
        .eq('quiz_id', quizData.id)
        .order('question_order', { ascending: true });

      if (qError || !questionsData) {
        return null;
      }

      const questionIds = questionsData.map(q => q.id);

      // 3. Fetch options explicitly omitting is_correct
      const { data: optionsData, error: optError } = await supabase
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

      if (optError || !optionsData) {
        return null;
      }

      // 4. Assemble public questions
      let totalMarks = 0;
      const questions: PublicQuestion[] = questionsData.map(q => {
        totalMarks += Number(q.marks) || 0;
        const opts: PublicOption[] = (optionsData || [])
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
          question_type: q.question_type,
          question_image: q.question_image,
          marks: q.marks,
          required: q.required,
          question_order: q.question_order,
          options: opts
        };
      });

      return {
        id: quizData.id,
        title: quizData.title,
        slug: quizData.slug,
        description: quizData.description,
        cover_image: quizData.cover_image,
        status: 'published',
        theme: (Array.isArray(quizData.theme) ? quizData.theme[0] : quizData.theme) as Theme | null,
        settings: quizData.settings || {},
        questions,
        totalQuestions: questions.length,
        totalMarks
      };
    }
  }

  // Fallback to local mock data store for immediate offline previewing
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
      question_type: q.question_type,
      question_image: q.question_image,
      marks: q.marks,
      required: q.required,
      question_order: q.question_order,
      options: publicOptions
    };
  });

  return {
    id: mockQuiz.id,
    title: mockQuiz.title,
    slug: mockQuiz.slug,
    description: mockQuiz.description,
    cover_image: mockQuiz.cover_image,
    status: 'published',
    theme: mockQuiz.theme || null,
    settings: mockQuiz.settings || {},
    questions,
    totalQuestions: questions.length,
    totalMarks
  };
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
  questionCount: number;
}>> {
  if (isSupabaseConfigured()) {
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
          theme:themes(*)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(q => ({
          id: q.id,
          title: q.title,
          slug: q.slug,
          description: q.description,
          cover_image: q.cover_image,
          theme: q.theme,
          questionCount: 0
        }));
      }
    }
  }

  return mockStore.getQuizzes()
    .filter(q => q.status === 'published')
    .map(q => ({
      id: q.id,
      title: q.title,
      slug: q.slug,
      description: q.description,
      cover_image: q.cover_image,
      theme: q.theme,
      questionCount: q.questions?.length || 0
    }));
}
