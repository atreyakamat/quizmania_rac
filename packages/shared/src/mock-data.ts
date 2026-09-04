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
  }
];

export const mockQuizzes: Quiz[] = [
  {
    id: 'quiz-nutrition-week-2026',
    title: 'Nutrition Week Quiz 2026',
    slug: 'nutrition-week-2026',
    description: 'Celebrate Nutrition Week with the Rotaract Club of Mapusa! Test your knowledge about healthy eating, nutrients, and balanced lifestyles. (Eligible for club collaboration recognition: minimum 3 members required per club).',
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
      require_participant_email: true,
      collect_club_details: true
    },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    questions: [
      {
        id: 'nq-1',
        quiz_id: 'quiz-nutrition-week-2026',
        question_text: "Which nutrient is the body's primary source of energy?",
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        required: true,
        question_order: 1,
        options: [
          { id: 'nq-1-a', question_id: 'nq-1', option_text: 'Vitamins', option_image: null, is_correct: false, option_order: 1 },
          { id: 'nq-1-b', question_id: 'nq-1', option_text: 'Proteins', option_image: null, is_correct: false, option_order: 2 },
          { id: 'nq-1-c', question_id: 'nq-1', option_text: 'Carbohydrates', option_image: null, is_correct: true, option_order: 3 },
          { id: 'nq-1-d', question_id: 'nq-1', option_text: 'Minerals', option_image: null, is_correct: false, option_order: 4 }
        ]
      },
      {
        id: 'nq-2',
        quiz_id: 'quiz-nutrition-week-2026',
        question_text: 'Which vitamin is mainly produced in the body when the skin is exposed to sunlight?',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        required: true,
        question_order: 2,
        options: [
          { id: 'nq-2-a', question_id: 'nq-2', option_text: 'Vitamin A', option_image: null, is_correct: false, option_order: 1 },
          { id: 'nq-2-b', question_id: 'nq-2', option_text: 'Vitamin C', option_image: null, is_correct: false, option_order: 2 },
          { id: 'nq-2-c', question_id: 'nq-2', option_text: 'Vitamin D', option_image: null, is_correct: true, option_order: 3 },
          { id: 'nq-2-d', question_id: 'nq-2', option_text: 'Vitamin K', option_image: null, is_correct: false, option_order: 4 }
        ]
      },
      {
        id: 'nq-3',
        quiz_id: 'quiz-nutrition-week-2026',
        question_text: 'Which nutrient is especially important for building and repairing body tissues?',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        required: true,
        question_order: 3,
        options: [
          { id: 'nq-3-a', question_id: 'nq-3', option_text: 'Protein', option_image: null, is_correct: true, option_order: 1 },
          { id: 'nq-3-b', question_id: 'nq-3', option_text: 'Fibre', option_image: null, is_correct: false, option_order: 2 },
          { id: 'nq-3-c', question_id: 'nq-3', option_text: 'Water', option_image: null, is_correct: false, option_order: 3 },
          { id: 'nq-3-d', question_id: 'nq-3', option_text: 'Carbohydrates', option_image: null, is_correct: false, option_order: 4 }
        ]
      },
      {
        id: 'nq-4',
        quiz_id: 'quiz-nutrition-week-2026',
        question_text: 'Which of the following foods is generally a good source of dietary fibre?',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        required: true,
        question_order: 4,
        options: [
          { id: 'nq-4-a', question_id: 'nq-4', option_text: 'White sugar', option_image: null, is_correct: false, option_order: 1 },
          { id: 'nq-4-b', question_id: 'nq-4', option_text: 'Whole grains', option_image: null, is_correct: true, option_order: 2 },
          { id: 'nq-4-c', question_id: 'nq-4', option_text: 'Butter', option_image: null, is_correct: false, option_order: 3 },
          { id: 'nq-4-d', question_id: 'nq-4', option_text: 'Soft drinks', option_image: null, is_correct: false, option_order: 4 }
        ]
      },
      {
        id: 'nq-5',
        quiz_id: 'quiz-nutrition-week-2026',
        question_text: 'Which mineral is important for maintaining healthy bones and teeth?',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        required: true,
        question_order: 5,
        options: [
          { id: 'nq-5-a', question_id: 'nq-5', option_text: 'Iron', option_image: null, is_correct: false, option_order: 1 },
          { id: 'nq-5-b', question_id: 'nq-5', option_text: 'Calcium', option_image: null, is_correct: true, option_order: 2 },
          { id: 'nq-5-c', question_id: 'nq-5', option_text: 'Sodium', option_image: null, is_correct: false, option_order: 3 },
          { id: 'nq-5-d', question_id: 'nq-5', option_text: 'Potassium', option_image: null, is_correct: false, option_order: 4 }
        ]
      },
      {
        id: 'nq-6',
        quiz_id: 'quiz-nutrition-week-2026',
        question_text: 'Which nutrient helps the body absorb certain vitamins and provides stored energy?',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        required: true,
        question_order: 6,
        options: [
          { id: 'nq-6-a', question_id: 'nq-6', option_text: 'Fats', option_image: null, is_correct: true, option_order: 1 },
          { id: 'nq-6-b', question_id: 'nq-6', option_text: 'Water', option_image: null, is_correct: false, option_order: 2 },
          { id: 'nq-6-c', question_id: 'nq-6', option_text: 'Minerals', option_image: null, is_correct: false, option_order: 3 },
          { id: 'nq-6-d', question_id: 'nq-6', option_text: 'Fibre', option_image: null, is_correct: false, option_order: 4 }
        ]
      },
      {
        id: 'nq-7',
        quiz_id: 'quiz-nutrition-week-2026',
        question_text: 'Which of the following is generally considered a healthy snack option?',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        required: true,
        question_order: 7,
        options: [
          { id: 'nq-7-a', question_id: 'nq-7', option_text: 'Fresh fruit', option_image: null, is_correct: true, option_order: 1 },
          { id: 'nq-7-b', question_id: 'nq-7', option_text: 'Candy', option_image: null, is_correct: false, option_order: 2 },
          { id: 'nq-7-c', question_id: 'nq-7', option_text: 'Sugary soda', option_image: null, is_correct: false, option_order: 3 },
          { id: 'nq-7-d', question_id: 'nq-7', option_text: 'Deep-fried chips', option_image: null, is_correct: false, option_order: 4 }
        ]
      },
      {
        id: 'nq-8',
        quiz_id: 'quiz-nutrition-week-2026',
        question_text: 'What is the main benefit of drinking enough water?',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        required: true,
        question_order: 8,
        options: [
          { id: 'nq-8-a', question_id: 'nq-8', option_text: 'It completely replaces meals', option_image: null, is_correct: false, option_order: 1 },
          { id: 'nq-8-b', question_id: 'nq-8', option_text: 'It helps maintain normal body functions and hydration', option_image: null, is_correct: true, option_order: 2 },
          { id: 'nq-8-c', question_id: 'nq-8', option_text: 'It provides large amounts of protein', option_image: null, is_correct: false, option_order: 3 },
          { id: 'nq-8-d', question_id: 'nq-8', option_text: 'It replaces the need for fruits and vegetables', option_image: null, is_correct: false, option_order: 4 }
        ]
      },
      {
        id: 'nq-9',
        quiz_id: 'quiz-nutrition-week-2026',
        question_text: 'Which nutrient is important for carrying oxygen in the blood?',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        required: true,
        question_order: 9,
        options: [
          { id: 'nq-9-a', question_id: 'nq-9', option_text: 'Calcium', option_image: null, is_correct: false, option_order: 1 },
          { id: 'nq-9-b', question_id: 'nq-9', option_text: 'Iron', option_image: null, is_correct: true, option_order: 2 },
          { id: 'nq-9-c', question_id: 'nq-9', option_text: 'Vitamin C', option_image: null, is_correct: false, option_order: 3 },
          { id: 'nq-9-d', question_id: 'nq-9', option_text: 'Fibre', option_image: null, is_correct: false, option_order: 4 }
        ]
      },
      {
        id: 'nq-10',
        quiz_id: 'quiz-nutrition-week-2026',
        question_text: 'A balanced diet generally includes:',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        required: true,
        question_order: 10,
        options: [
          { id: 'nq-10-a', question_id: 'nq-10', option_text: 'Only protein-rich foods', option_image: null, is_correct: false, option_order: 1 },
          { id: 'nq-10-b', question_id: 'nq-10', option_text: 'Only fruits and vegetables', option_image: null, is_correct: false, option_order: 2 },
          { id: 'nq-10-c', question_id: 'nq-10', option_text: 'A variety of foods from different food groups', option_image: null, is_correct: true, option_order: 3 },
          { id: 'nq-10-d', question_id: 'nq-10', option_text: 'Only low-fat foods', option_image: null, is_correct: false, option_order: 4 }
        ]
      },
      {
        id: 'nq-11',
        quiz_id: 'quiz-nutrition-week-2026',
        question_text: 'Which of these is a good source of healthy unsaturated fats?',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        required: true,
        question_order: 11,
        options: [
          { id: 'nq-11-a', question_id: 'nq-11', option_text: 'Nuts', option_image: null, is_correct: true, option_order: 1 },
          { id: 'nq-11-b', question_id: 'nq-11', option_text: 'Candy', option_image: null, is_correct: false, option_order: 2 },
          { id: 'nq-11-c', question_id: 'nq-11', option_text: 'Soft drinks', option_image: null, is_correct: false, option_order: 3 },
          { id: 'nq-11-d', question_id: 'nq-11', option_text: 'Refined sugar', option_image: null, is_correct: false, option_order: 4 }
        ]
      },
      {
        id: 'nq-12',
        quiz_id: 'quiz-nutrition-week-2026',
        question_text: 'Why is it beneficial to include a variety of fruits and vegetables in your diet?',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        required: true,
        question_order: 12,
        options: [
          { id: 'nq-12-a', question_id: 'nq-12', option_text: 'They provide a range of nutrients', option_image: null, is_correct: true, option_order: 1 },
          { id: 'nq-12-b', question_id: 'nq-12', option_text: 'They eliminate the need for water', option_image: null, is_correct: false, option_order: 2 },
          { id: 'nq-12-c', question_id: 'nq-12', option_text: 'They replace all other food groups', option_image: null, is_correct: false, option_order: 3 },
          { id: 'nq-12-d', question_id: 'nq-12', option_text: 'They contain only carbohydrates', option_image: null, is_correct: false, option_order: 4 }
        ]
      }
    ]
  }
];

export const mockSubmissions: Submission[] = [
  {
    id: 'sub-demo-1',
    quiz_id: 'quiz-nutrition-week-2026',
    participant_name: 'Rahul Naik',
    participant_email: 'rahul.naik@rotaract.org',
    participant_data: {
      club_name: 'Rotaract Club of Mapusa',
      district_number: '3170',
      position: 'President'
    },
    score: 60,
    submitted_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'sub-demo-2',
    quiz_id: 'quiz-nutrition-week-2026',
    participant_name: 'Sarah Chen',
    participant_email: 'sarah.c@rotaract.org',
    participant_data: {
      club_name: 'Rotaract Club of Panaji',
      district_number: '3170',
      position: 'Member'
    },
    score: 55,
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
