/**
 * Core Type Definitions for Quiz Management Platform
 */

export type QuizStatus = 'draft' | 'published' | 'closed' | 'archived';

export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'text_answer';

export interface Theme {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  surface_color: string;
  text_color: string;
  button_color: string;
  border_radius: string; // e.g. '0.5rem', '8px', '12px'
  font_family: string;   // e.g. 'Inter, sans-serif'
  created_at?: string;
}

export interface QuizSettings {
  time_limit_minutes?: number | null;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  passing_score_percentage?: number;
  show_score_immediately?: boolean;
  allow_review?: boolean;
  require_participant_email?: boolean;
}

export interface Option {
  id: string;
  question_id: string;
  option_text: string;
  option_image: string | null;
  is_correct: boolean;
  option_order: number;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: QuestionType;
  question_image: string | null;
  marks: number;
  required: boolean;
  question_order: number;
  created_at?: string;
  updated_at?: string;
  options?: Option[];
}

export interface Quiz {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  status: QuizStatus;
  theme_id: string | null;
  theme?: Theme | null;
  settings: QuizSettings;
  created_at?: string;
  updated_at?: string;
  questions?: Question[];
}

/**
 * Public facing types (Strictly sanitized - NEVER exposes is_correct)
 */
export interface PublicOption {
  id: string;
  question_id: string;
  option_text: string;
  option_image: string | null;
  option_order: number;
}

export interface PublicQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: QuestionType;
  question_image: string | null;
  marks: number;
  required: boolean;
  question_order: number;
  options: PublicOption[];
}

export interface PublicQuiz {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  status: 'published';
  theme: Theme | null;
  settings: QuizSettings;
  questions: PublicQuestion[];
  totalQuestions: number;
  totalMarks: number;
}

/**
 * Submissions & Answers
 */
export interface Submission {
  id: string;
  quiz_id: string;
  participant_name: string;
  participant_email: string | null;
  participant_data: Record<string, any> | null;
  score: number;
  submitted_at: string;
}

export interface Answer {
  id: string;
  submission_id: string;
  question_id: string;
  selected_option_id: string;
}

export interface ParticipantInfo {
  name: string;
  email?: string;
  data?: Record<string, any>;
}

export interface SelectedAnswer {
  questionId: string;
  selectedOptionId: string;
}

export interface QuizSubmissionPayload {
  participant: ParticipantInfo;
  answers: SelectedAnswer[];
}

export interface QuizSubmissionResult {
  submissionId: string;
  score: number;
  totalPossibleMarks: number;
  percentage: number;
  passed?: boolean;
  submittedAt: string;
  feedbackMessage?: string;
}

/**
 * JSON Import / Export Format
 */
export interface QuizJsonImportTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  buttonColor?: string;
  borderRadius?: string;
  fontFamily?: string;
}

export interface QuizJsonImportOption {
  id?: string;
  text: string;
  correct: boolean;
  image?: string | null;
}

export interface QuizJsonImportQuestion {
  id?: string;
  question: string;
  type: QuestionType;
  required: boolean;
  marks: number;
  image?: string | null;
  options: QuizJsonImportOption[];
}

export interface QuizJsonImportFormat {
  title: string;
  slug: string;
  description?: string | null;
  status?: QuizStatus;
  theme?: QuizJsonImportTheme;
  coverImage?: string | null;
  settings?: QuizSettings;
  questions: QuizJsonImportQuestion[];
}
