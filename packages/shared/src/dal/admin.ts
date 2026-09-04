import type { Quiz, Theme, Submission, QuizStatus, QuizJsonImportFormat } from '@quizmania/types';
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from '../supabase';
import { mockStore } from '../mock-data';

/**
 * Admin Data Access Layer (Local & Private Server-Side Only)
 */
export async function getAllQuizzes(filterStatus?: QuizStatus): Promise<Quiz[]> {
  if (isSupabaseAdminConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      let query = supabase
        .from('quizzes')
        .select(`
          *,
          theme:themes(*),
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
      if (!error && data) {
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
  if (isSupabaseAdminConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          theme:themes(*),
          questions:questions(
            *,
            options:options(*)
          )
        `)
        .eq('id', id)
        .single();

      if (!error && data) {
        return data as Quiz;
      }
    }
  }

  return mockStore.getQuizById(id) || null;
}

export async function saveQuiz(quiz: Partial<Quiz> & { title: string; slug: string }): Promise<Quiz> {
  if (isSupabaseAdminConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('quizzes')
        .upsert({
          id: quiz.id,
          title: quiz.title,
          slug: quiz.slug,
          description: quiz.description,
          cover_image: quiz.cover_image,
          status: quiz.status || 'draft',
          theme_id: quiz.theme_id,
          settings: quiz.settings || {},
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!error && data) {
        return data as Quiz;
      }
    }
  }

  return mockStore.saveQuiz(quiz as Quiz);
}

export async function setQuizStatus(id: string, status: QuizStatus): Promise<Quiz | null> {
  if (isSupabaseAdminConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('quizzes')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data as Quiz;
      }
    }
  }

  return mockStore.updateQuizStatus(id, status) || null;
}

export async function deleteQuiz(id: string): Promise<boolean> {
  if (isSupabaseAdminConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { error } = await supabase.from('quizzes').delete().eq('id', id);
      return !error;
    }
  }

  return mockStore.deleteQuiz(id);
}

export async function getAllThemes(): Promise<Theme[]> {
  if (isSupabaseAdminConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data, error } = await supabase.from('themes').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data as Theme[];
      }
    }
  }

  return mockStore.getThemes();
}

export async function saveTheme(theme: Theme): Promise<Theme> {
  if (isSupabaseAdminConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data, error } = await supabase.from('themes').upsert(theme).select().single();
      if (!error && data) {
        return data as Theme;
      }
    }
  }

  return mockStore.saveTheme(theme);
}

export async function getAllSubmissions(quizId?: string): Promise<Submission[]> {
  if (isSupabaseAdminConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      let query = supabase.from('submissions').select('*').order('submitted_at', { ascending: false });
      if (quizId) {
        query = query.eq('quiz_id', quizId);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data as Submission[];
      }
    }
  }

  return mockStore.getSubmissions(quizId);
}

/**
 * Import a quiz from the standardized JSON format
 */
export async function importQuizFromJson(jsonData: QuizJsonImportFormat): Promise<Quiz> {
  // 1. Resolve or create theme if embedded
  let themeId: string | null = null;
  if (jsonData.theme) {
    const newTheme: Theme = {
      id: `theme-${Date.now()}`,
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

  const quizId = `quiz-${Date.now()}`;

  // 2. Build questions and options
  const questions = (jsonData.questions || []).map((q, qIndex) => {
    const questionId = q.id || `q-${quizId}-${qIndex + 1}`;
    const options = (q.options || []).map((opt, optIndex) => ({
      id: opt.id || `opt-${questionId}-${optIndex + 1}`,
      question_id: questionId,
      option_text: opt.text,
      option_image: opt.image || null,
      is_correct: Boolean(opt.correct),
      option_order: optIndex + 1
    }));

    return {
      id: questionId,
      quiz_id: quizId,
      question_text: q.question,
      question_type: q.type,
      question_image: q.image || null,
      marks: q.marks,
      required: q.required,
      question_order: qIndex + 1,
      options
    };
  });

  const newQuiz: Quiz = {
    id: quizId,
    title: jsonData.title,
    slug: jsonData.slug,
    description: jsonData.description || null,
    cover_image: jsonData.coverImage || null,
    status: jsonData.status || 'draft',
    theme_id: themeId,
    settings: jsonData.settings || {
      show_score_immediately: true,
      allow_review: true
    },
    questions
  };

  return await saveQuiz(newQuiz);
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
      type: q.question_type,
      required: q.required,
      marks: q.marks,
      image: q.question_image,
      options: (q.options || []).map(opt => ({
        id: opt.id,
        text: opt.option_text,
        correct: opt.is_correct,
        image: opt.option_image
      }))
    }))
  };
}
