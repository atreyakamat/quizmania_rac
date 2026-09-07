import type { Quiz, Theme } from '@quizmania/types';
import { mockThemes } from '../mock-data';

export const QA_QUIZ_ID = '00000000-0000-0000-0000-0000000000aa';
export const QA_QUIZ_SLUG = 'quizmania-qa-full-engine-test';

export function createQaFixtureQuiz(): Quiz {
  const theme: Theme = mockThemes[0] || {
    id: 'd0000000-0000-0000-0000-000000000000',
    name: 'QuizMania Signature (Rotaract)',
    primary_color: '#6E123D',
    secondary_color: '#A50D52',
    background_color: '#FAF8F9',
    surface_color: '#FFFFFF',
    text_color: '#24141C',
    button_color: '#A50D52',
    border_radius: '1rem',
    font_family: 'Inter, system-ui, sans-serif'
  };

  return {
    id: QA_QUIZ_ID,
    title: 'QuizMania QA — Full Engine Test',
    slug: QA_QUIZ_SLUG,
    description: 'Comprehensive QA Test Quiz for validating the QuizMania engine across question types, timer, scoring, sections, and feature toggles.',
    cover_image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&auto=format&fit=crop&q=80',
    status: 'published',
    theme_id: theme.id,
    theme: theme,
    settings: {
      time_limit_minutes: 10,
      enable_question_timer: false,
      auto_submit_on_expire: true,
      passing_score_percentage: 50,
      show_score_immediately: true,
      show_correct_answers: true,
      allow_review: true,
      show_progress_bar: true,
      require_participant_email: true,
      collect_club_details: true,
      instructions: 'Welcome to the QuizMania QA Engine Test. Please verify each question type, review page, and submission evaluation.',
      prevent_duplicate_submission: false,
      allow_multiple_attempts: true,
      features: {
        timer: true,
        questionTimers: false,
        shuffleQuestions: false,
        shuffleOptions: false,
        sections: true,
        review: true,
        showScoreImmediately: true,
        showCorrectAnswers: true,
        showAnswerFeedback: true,
        multipleAttempts: true,
        negativeMarking: true,
        partialCredit: true,
        aiGeneration: false
      }
    },
    sections: [
      {
        id: '00000000-0000-0000-0000-0000000001e1',
        quiz_id: QA_QUIZ_ID,
        title: 'Section 1: General Knowledge & Mechanics',
        description: 'Testing single choice, negative marks, and true/false questions',
        section_order: 1
      },
      {
        id: '00000000-0000-0000-0000-0000000001e2',
        quiz_id: QA_QUIZ_ID,
        title: 'Section 2: Text & Media Evaluation',
        description: 'Testing short text matching, paragraph review, and media assets',
        section_order: 2
      }
    ],
    questions: [
      {
        id: '00000000-0000-0000-0000-0000000000f1',
        quiz_id: QA_QUIZ_ID,
        question_text: 'QA 1: What is the official primary motto of Rotary International?',
        question_description: 'Negative marking test question: -2 marks if answered incorrectly.',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        negative_marks: 2,
        required: true,
        question_order: 1,
        section_title: 'Section 1: General Knowledge & Mechanics',
        section_description: 'Testing single choice, negative marks, and true/false questions',
        time_limit_seconds: 60,
        scoring_method: 'all_or_nothing',
        options: [
          { id: '00000000-0000-0000-0000-000000001011', question_id: '00000000-0000-0000-0000-0000000000f1', option_text: 'Service Above Self', option_image: null, is_correct: true, option_order: 1 },
          { id: '00000000-0000-0000-0000-000000001012', question_id: '00000000-0000-0000-0000-0000000000f1', option_text: 'Profit Above Service', option_image: null, is_correct: false, option_order: 2 },
          { id: '00000000-0000-0000-0000-000000001013', question_id: '00000000-0000-0000-0000-0000000000f1', option_text: 'Speed Over Substance', option_image: null, is_correct: false, option_order: 3 },
          { id: '00000000-0000-0000-0000-000000001014', question_id: '00000000-0000-0000-0000-0000000000f1', option_text: 'Action Without Reflection', option_image: null, is_correct: false, option_order: 4 }
        ]
      },
      {
        id: '00000000-0000-0000-0000-0000000000f2',
        quiz_id: QA_QUIZ_ID,
        question_text: 'QA 2: Which of the following are recognized Rotary Avenues of Service? (Select ALL that apply)',
        question_description: 'Partial credit test: selects 3 correct options for full 6 marks.',
        question_type: 'multiple_choice',
        question_image: null,
        marks: 6,
        negative_marks: 0,
        required: true,
        question_order: 2,
        section_title: 'Section 1: General Knowledge & Mechanics',
        scoring_method: 'partial',
        options: [
          { id: '00000000-0000-0000-0000-000000001021', question_id: '00000000-0000-0000-0000-0000000000f2', option_text: 'Club Service', option_image: null, is_correct: true, option_order: 1 },
          { id: '00000000-0000-0000-0000-000000001022', question_id: '00000000-0000-0000-0000-0000000000f2', option_text: 'Community Service', option_image: null, is_correct: true, option_order: 2 },
          { id: '00000000-0000-0000-0000-000000001023', question_id: '00000000-0000-0000-0000-0000000000f2', option_text: 'International Service', option_image: null, is_correct: true, option_order: 3 },
          { id: '00000000-0000-0000-0000-000000001024', question_id: '00000000-0000-0000-0000-0000000000f2', option_text: 'Commercial Promotion Service', option_image: null, is_correct: false, option_order: 4 }
        ]
      },
      {
        id: '00000000-0000-0000-0000-0000000000f3',
        quiz_id: QA_QUIZ_ID,
        question_text: 'QA 3: The Rotaract Club of Mapusa operates within Rotary International District 3170.',
        question_description: 'True / False test question: 4 marks.',
        question_type: 'true_false',
        question_image: null,
        marks: 4,
        negative_marks: 1,
        required: true,
        question_order: 3,
        section_title: 'Section 1: General Knowledge & Mechanics',
        scoring_method: 'all_or_nothing',
        options: [
          { id: '00000000-0000-0000-0000-000000001031', question_id: '00000000-0000-0000-0000-0000000000f3', option_text: 'True', option_image: null, is_correct: true, option_order: 1 },
          { id: '00000000-0000-0000-0000-000000001032', question_id: '00000000-0000-0000-0000-0000000000f3', option_text: 'False', option_image: null, is_correct: false, option_order: 2 }
        ]
      },
      {
        id: '00000000-0000-0000-0000-0000000000f4',
        quiz_id: QA_QUIZ_ID,
        question_text: 'QA 4: What is the official single-word name of the youth partner organization of Rotary (founded in 1968)?',
        question_description: 'Short text matching test: accepts "Rotaract" or "Rotaract Club", case-insensitive with whitespace normalization.',
        question_type: 'short_text',
        question_image: null,
        marks: 5,
        negative_marks: 0,
        required: true,
        question_order: 4,
        section_title: 'Section 2: Text & Media Evaluation',
        section_description: 'Testing short text matching, paragraph review, and media assets',
        scoring_method: 'all_or_nothing',
        accepted_answers: ['Rotaract', 'Rotaract Club'],
        case_sensitive: false,
        trim_whitespace: true,
        normalize_spaces: true,
        options: []
      },
      {
        id: '00000000-0000-0000-0000-0000000000f5',
        quiz_id: QA_QUIZ_ID,
        question_text: 'QA 5: Briefly describe an impactful community initiative your team could lead this season.',
        question_description: 'Paragraph test: open-ended qualitative answer, recorded for review (0 auto marks).',
        question_type: 'paragraph',
        question_image: null,
        marks: 0,
        negative_marks: 0,
        required: false,
        question_order: 5,
        section_title: 'Section 2: Text & Media Evaluation',
        scoring_method: 'all_or_nothing',
        options: []
      },
      {
        id: '00000000-0000-0000-0000-0000000000f6',
        quiz_id: QA_QUIZ_ID,
        question_text: 'QA 6: Which device or emblem is depicted in the question reference image?',
        question_description: 'Question image display test: verifies image asset rendering within the question body.',
        question_type: 'single_choice',
        question_image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
        marks: 5,
        negative_marks: 0,
        required: true,
        question_order: 6,
        section_title: 'Section 2: Text & Media Evaluation',
        scoring_method: 'all_or_nothing',
        options: [
          { id: '00000000-0000-0000-0000-000000001061', question_id: '00000000-0000-0000-0000-0000000000f6', option_text: 'Digital Communication & Community Connection', option_image: null, is_correct: true, option_order: 1 },
          { id: '00000000-0000-0000-0000-000000001062', question_id: '00000000-0000-0000-0000-0000000000f6', option_text: 'Agricultural Harvester', option_image: null, is_correct: false, option_order: 2 },
          { id: '00000000-0000-0000-0000-000000001063', question_id: '00000000-0000-0000-0000-0000000000f6', option_text: 'Chemical Refinery Plant', option_image: null, is_correct: false, option_order: 3 }
        ]
      },
      {
        id: '00000000-0000-0000-0000-0000000000f7',
        quiz_id: QA_QUIZ_ID,
        question_text: 'QA 7: Which visual palette card represents the official QuizMania burgundy & magenta brand identity?',
        question_description: 'Option image test: verifies image rendering inside individual answer choice tiles.',
        question_type: 'single_choice',
        question_image: null,
        marks: 5,
        negative_marks: 0,
        required: true,
        question_order: 7,
        section_title: 'Section 2: Text & Media Evaluation',
        scoring_method: 'all_or_nothing',
        options: [
          {
            id: '00000000-0000-0000-0000-000000001071',
            question_id: '00000000-0000-0000-0000-0000000000f7',
            option_text: 'Deep Burgundy (#6E123D) and Rich Magenta (#A50D52)',
            option_image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=60',
            is_correct: true,
            option_order: 1
          },
          {
            id: '00000000-0000-0000-0000-000000001072',
            question_id: '00000000-0000-0000-0000-0000000000f7',
            option_text: 'Neon Yellow and Fluorescent Cyan',
            option_image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=60',
            is_correct: false,
            option_order: 2
          }
        ]
      }
    ]
  };
}
