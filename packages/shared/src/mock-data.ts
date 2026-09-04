import type { Theme, Quiz, Submission } from '@quizmania/types';
import { QUIZMANIA_BRAND } from './brand/quizmania-theme';

export const mockThemes: Theme[] = [
  {
    id: 'theme-quizmania-signature',
    name: 'QuizMania Signature (Rotaract)',
    primary_color: QUIZMANIA_BRAND.colors.primary,
    secondary_color: QUIZMANIA_BRAND.colors.secondary,
    background_color: QUIZMANIA_BRAND.colors.background,
    surface_color: QUIZMANIA_BRAND.colors.surface,
    text_color: QUIZMANIA_BRAND.colors.darkText,
    button_color: QUIZMANIA_BRAND.colors.secondary,
    border_radius: '1rem',
    font_family: 'Inter, system-ui, sans-serif',
    created_at: new Date().toISOString()
  },
  {
    id: 'theme-nature-green',
    name: 'Nature Green',
    primary_color: '#2E7D32',
    secondary_color: '#81C784',
    background_color: '#F1F8E9',
    surface_color: '#FFFFFF',
    text_color: '#1A1A1A',
    button_color: '#2E7D32',
    border_radius: '0.75rem',
    font_family: 'Inter, system-ui, sans-serif',
    created_at: new Date().toISOString()
  },
  {
    id: 'theme-ocean-blue',
    name: 'Ocean Blue',
    primary_color: '#0284C7',
    secondary_color: '#7DD3FC',
    background_color: '#F0F9FF',
    surface_color: '#FFFFFF',
    text_color: '#0C4A6E',
    button_color: '#0284C7',
    border_radius: '1rem',
    font_family: 'Inter, system-ui, sans-serif',
    created_at: new Date().toISOString()
  },
  {
    id: 'theme-modern-slate',
    name: 'Modern Slate',
    primary_color: '#475569',
    secondary_color: '#94A3B8',
    background_color: '#F8FAFC',
    surface_color: '#FFFFFF',
    text_color: '#0F172A',
    button_color: '#0F172A',
    border_radius: '0.5rem',
    font_family: 'Inter, system-ui, sans-serif',
    created_at: new Date().toISOString()
  }
];

export const mockQuizzes: Quiz[] = [
  {
    id: 'quiz-rotaract-mapusa-championship',
    title: 'Rotaract Youth Knowledge Bowl 2026',
    slug: 'rotaract-youth-bowl-2026',
    description: 'The premier annual inter-college knowledge challenge hosted by Rotaract Club of Mapusa.',
    cover_image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
    status: 'published',
    theme_id: 'theme-quizmania-signature',
    theme: mockThemes[0],
    settings: {
      time_limit_minutes: 20,
      shuffle_questions: false,
      shuffle_options: false,
      passing_score_percentage: 60,
      show_score_immediately: true,
      allow_review: true,
      require_participant_email: true
    },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    questions: [
      {
        id: 'rk-1',
        quiz_id: 'quiz-rotaract-mapusa-championship',
        question_text: 'What is the primary motto of Rotary and Rotaract worldwide?',
        question_type: 'single_choice',
        question_image: null,
        marks: 10,
        required: true,
        question_order: 1,
        options: [
          { id: 'ro-1-1', question_id: 'rk-1', option_text: 'Service Above Self', option_image: null, is_correct: true, option_order: 1 },
          { id: 'ro-1-2', question_id: 'rk-1', option_text: 'Excellence in Action', option_image: null, is_correct: false, option_order: 2 },
          { id: 'ro-1-3', question_id: 'rk-1', option_text: 'Leadership for Tomorrow', option_image: null, is_correct: false, option_order: 3 },
          { id: 'ro-1-4', question_id: 'rk-1', option_text: 'Unity in Diversity', option_image: null, is_correct: false, option_order: 4 }
        ]
      },
      {
        id: 'rk-2',
        quiz_id: 'quiz-rotaract-mapusa-championship',
        question_text: 'In which famous North Goa town is the historical Friday Market located?',
        question_type: 'single_choice',
        question_image: null,
        marks: 10,
        required: true,
        question_order: 2,
        options: [
          { id: 'ro-2-1', question_id: 'rk-2', option_text: 'Panaji', option_image: null, is_correct: false, option_order: 1 },
          { id: 'ro-2-2', question_id: 'rk-2', option_text: 'Mapusa', option_image: null, is_correct: true, option_order: 2 },
          { id: 'ro-2-3', question_id: 'rk-2', option_text: 'Margao', option_image: null, is_correct: false, option_order: 3 },
          { id: 'ro-2-4', question_id: 'rk-2', option_text: 'Vasco da Gama', option_image: null, is_correct: false, option_order: 4 }
        ]
      }
    ]
  },
  {
    id: 'quiz-nutrition-week-2026',
    title: 'Nutrition Week Quiz',
    slug: 'nutrition-week-2026',
    description: 'Test your knowledge about nutrition, vital micronutrients, and healthy dietary habits.',
    cover_image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&auto=format&fit=crop&q=80',
    status: 'published',
    theme_id: 'theme-quizmania-signature',
    theme: mockThemes[0],
    settings: {
      time_limit_minutes: 15,
      shuffle_questions: false,
      shuffle_options: false,
      passing_score_percentage: 60,
      show_score_immediately: true,
      allow_review: true,
      require_participant_email: true
    },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    questions: [
      {
        id: 'q1',
        quiz_id: 'quiz-nutrition-week-2026',
        question_text: 'Which nutrient is primarily responsible for building and repairing body tissues, including muscle?',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        required: true,
        question_order: 1,
        options: [
          { id: 'opt-1-1', question_id: 'q1', option_text: 'Carbohydrates', option_image: null, is_correct: false, option_order: 1 },
          { id: 'opt-1-2', question_id: 'q1', option_text: 'Protein', option_image: null, is_correct: true, option_order: 2 },
          { id: 'opt-1-3', question_id: 'q1', option_text: 'Vitamins', option_image: null, is_correct: false, option_order: 3 },
          { id: 'opt-1-4', question_id: 'q1', option_text: 'Water', option_image: null, is_correct: false, option_order: 4 }
        ]
      },
      {
        id: 'q2',
        quiz_id: 'quiz-nutrition-week-2026',
        question_text: 'Which vitamin is synthesized in human skin upon adequate exposure to sunlight?',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        required: true,
        question_order: 2,
        options: [
          { id: 'opt-2-1', question_id: 'q2', option_text: 'Vitamin A', option_image: null, is_correct: false, option_order: 1 },
          { id: 'opt-2-2', question_id: 'q2', option_text: 'Vitamin B12', option_image: null, is_correct: false, option_order: 2 },
          { id: 'opt-2-3', question_id: 'q2', option_text: 'Vitamin C', option_image: null, is_correct: false, option_order: 3 },
          { id: 'opt-2-4', question_id: 'q2', option_text: 'Vitamin D', option_image: null, is_correct: true, option_order: 4 }
        ]
      },
      {
        id: 'q3',
        quiz_id: 'quiz-nutrition-week-2026',
        question_text: 'What is the primary dietary role of soluble fiber?',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        required: true,
        question_order: 3,
        options: [
          { id: 'opt-3-1', question_id: 'q3', option_text: 'Assists in slowing digestion and regulating blood glucose levels', option_image: null, is_correct: true, option_order: 1 },
          { id: 'opt-3-2', question_id: 'q3', option_text: 'Provides immediate high-energy calories', option_image: null, is_correct: false, option_order: 2 },
          { id: 'opt-3-3', question_id: 'q3', option_text: 'Increases bone density directly', option_image: null, is_correct: false, option_order: 3 },
          { id: 'opt-3-4', question_id: 'q3', option_text: 'Acts as the principal carrier of oxygen in hemoglobin', option_image: null, is_correct: false, option_order: 4 }
        ]
      },
      {
        id: 'q4',
        quiz_id: 'quiz-nutrition-week-2026',
        question_text: 'Roughly what percentage of the healthy adult human body consists of water?',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        required: false,
        question_order: 4,
        options: [
          { id: 'opt-4-1', question_id: 'q4', option_text: 'Around 25% - 35%', option_image: null, is_correct: false, option_order: 1 },
          { id: 'opt-4-2', question_id: 'q4', option_text: 'Around 55% - 65%', option_image: null, is_correct: true, option_order: 2 },
          { id: 'opt-4-3', question_id: 'q4', option_text: 'Around 80% - 90%', option_image: null, is_correct: false, option_order: 3 },
          { id: 'opt-4-4', question_id: 'q4', option_text: 'Around 95% - 99%', option_image: null, is_correct: false, option_order: 4 }
        ]
      }
    ]
  },
  {
    id: 'quiz-js-web-fundamentals',
    title: 'Modern Web & Cloud Architecture',
    slug: 'web-cloud-fundamentals',
    description: 'Explore the foundations of scalable cloud systems, RESTful microservices, and client-server protocols.',
    cover_image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
    status: 'published',
    theme_id: 'theme-ocean-blue',
    theme: mockThemes[2],
    settings: {
      time_limit_minutes: 20,
      shuffle_questions: false,
      shuffle_options: false,
      passing_score_percentage: 70,
      show_score_immediately: true,
      allow_review: true,
      require_participant_email: false
    },
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    questions: [
      {
        id: 'web-q1',
        quiz_id: 'quiz-js-web-fundamentals',
        question_text: 'Which HTTP status code signifies that a resource was successfully created on the server?',
        question_type: 'single_choice',
        question_image: null,
        marks: 10,
        required: true,
        question_order: 1,
        options: [
          { id: 'w1-1', question_id: 'web-q1', option_text: '200 OK', option_image: null, is_correct: false, option_order: 1 },
          { id: 'w1-2', question_id: 'web-q1', option_text: '201 Created', option_image: null, is_correct: true, option_order: 2 },
          { id: 'w1-3', question_id: 'web-q1', option_text: '204 No Content', option_image: null, is_correct: false, option_order: 3 },
          { id: 'w1-4', question_id: 'web-q1', option_text: '301 Moved Permanently', option_image: null, is_correct: false, option_order: 4 }
        ]
      }
    ]
  },
  {
    id: 'quiz-draft-general-knowledge',
    title: 'General Science & Technology',
    slug: 'general-science-tech',
    description: 'Upcoming draft quiz covering astronomy, physics, and basic computing.',
    cover_image: null,
    status: 'draft',
    theme_id: 'theme-modern-slate',
    theme: mockThemes[3],
    settings: {
      passing_score_percentage: 50,
      show_score_immediately: true,
      allow_review: true,
      require_participant_email: false
    },
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    questions: [
      {
        id: 'draft-q1',
        quiz_id: 'quiz-draft-general-knowledge',
        question_text: 'What is the closest star to planet Earth?',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        required: true,
        question_order: 1,
        options: [
          { id: 'd1-1', question_id: 'draft-q1', option_text: 'Proxima Centauri', option_image: null, is_correct: false, option_order: 1 },
          { id: 'd1-2', question_id: 'draft-q1', option_text: 'The Sun', option_image: null, is_correct: true, option_order: 2 }
        ]
      }
    ]
  }
];

export const mockSubmissions: Submission[] = [
  {
    id: 'sub-demo-1',
    quiz_id: 'quiz-rotaract-mapusa-championship',
    participant_name: 'Rahul Naik',
    participant_email: 'rahul.naik@rotaract.org',
    participant_data: {},
    score: 20,
    submitted_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'sub-demo-2',
    quiz_id: 'quiz-nutrition-week-2026',
    participant_name: 'Alex Mercer',
    participant_email: 'alex@example.com',
    participant_data: {},
    score: 15,
    submitted_at: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

class MockStore {
  quizzes: Quiz[] = JSON.parse(JSON.stringify(mockQuizzes));
  themes: Theme[] = JSON.parse(JSON.stringify(mockThemes));
  submissions: Submission[] = JSON.parse(JSON.stringify(mockSubmissions));

  getQuizzes(): Quiz[] {
    return this.quizzes;
  }

  getQuizById(id: string): Quiz | undefined {
    return this.quizzes.find(q => q.id === id);
  }

  getQuizBySlug(slug: string): Quiz | undefined {
    return this.quizzes.find(q => q.slug === slug);
  }

  saveQuiz(quiz: Quiz): Quiz {
    const existingIndex = this.quizzes.findIndex(q => q.id === quiz.id || q.slug === quiz.slug);
    if (existingIndex >= 0) {
      this.quizzes[existingIndex] = { ...this.quizzes[existingIndex], ...quiz, updated_at: new Date().toISOString() };
      return this.quizzes[existingIndex];
    }
    const newQuiz: Quiz = {
      ...quiz,
      id: quiz.id || `quiz-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.quizzes.unshift(newQuiz);
    return newQuiz;
  }

  updateQuizStatus(id: string, status: Quiz['status']): Quiz | undefined {
    const quiz = this.getQuizById(id);
    if (quiz) {
      quiz.status = status;
      quiz.updated_at = new Date().toISOString();
    }
    return quiz;
  }

  deleteQuiz(id: string): boolean {
    const initialLen = this.quizzes.length;
    this.quizzes = this.quizzes.filter(q => q.id !== id);
    return this.quizzes.length < initialLen;
  }

  getThemes(): Theme[] {
    return this.themes;
  }

  saveTheme(theme: Theme): Theme {
    const existingIndex = this.themes.findIndex(t => t.id === theme.id);
    if (existingIndex >= 0) {
      this.themes[existingIndex] = { ...this.themes[existingIndex], ...theme };
      return this.themes[existingIndex];
    }
    const newTheme: Theme = {
      ...theme,
      id: theme.id || `theme-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    this.themes.push(newTheme);
    return newTheme;
  }

  addSubmission(submission: Submission): Submission {
    this.submissions.unshift(submission);
    return submission;
  }

  getSubmissions(quizId?: string): Submission[] {
    if (quizId) {
      return this.submissions.filter(s => s.quiz_id === quizId);
    }
    return this.submissions;
  }
}

const globalAny = global as any;
if (!globalAny.__QUIZMANIA_MOCK_STORE__) {
  globalAny.__QUIZMANIA_MOCK_STORE__ = new MockStore();
}

export const mockStore: MockStore = globalAny.__QUIZMANIA_MOCK_STORE__;
