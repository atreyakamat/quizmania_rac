/**
 * Core Type Definitions for Quiz Management Platform
 * QuizMania - Rotaract Club of Mapusa (RI District 3170)
 */

export type QuizStatus = 'draft' | 'published' | 'closed' | 'archived';

export type QuestionType = 
  | 'single_choice' 
  | 'multiple_choice' 
  | 'true_false' 
  | 'short_answer' 
  | 'paragraph' 
  | 'text_answer' // Backwards compatibility alias for short_answer
  | 'short_text'; // Canonical new name

export type ScoringMethod = 'all_or_nothing' | 'partial';

export interface Theme {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  surface_color: string;
  text_color: string;
  button_color: string;
  border_radius: string;
  font_family: string;
  created_at?: string;
}

export interface QuizFeatureFlags {
  timer: boolean;
  questionTimers: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  sections: boolean;
  review: boolean;
  showScoreImmediately: boolean;
  showCorrectAnswers: boolean;
  showAnswerFeedback: boolean;
  multipleAttempts: boolean;
  negativeMarking: boolean;
  partialCredit: boolean;
  aiGeneration: boolean;
}

export interface QuizSettings {
  time_limit_minutes?: number | null;
  enable_question_timer?: boolean;
  auto_submit_on_expire?: boolean;
  attempt_limit?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  passing_score_percentage?: number;
  show_score_immediately?: boolean;
  show_correct_answers?: boolean;
  allow_review?: boolean;
  show_progress_bar?: boolean;
  require_participant_email?: boolean;
  collect_club_details?: boolean; // For Rotaract event quizzes
  // NEW FIELDS
  instructions?: string | null;
  require_name?: boolean;
  require_phone?: boolean;
  require_club?: boolean;
  require_district?: boolean;
  allow_multiple_attempts?: boolean;
  max_attempts?: number;
  allow_back_navigation?: boolean;
  show_percentage?: boolean;
  show_answer_feedback?: boolean;
  show_completion_message?: string | null;
  prevent_duplicate_submission?: boolean;
  allow_negative_total?: boolean;
  features?: Partial<QuizFeatureFlags>;
  time_limit_seconds?: number | null;
  negative_marking?: boolean;
  // Availability Schedule Window
  schedule_enabled?: boolean;
  start_at?: string | null;
  end_at?: string | null;
}

export type QuizAvailabilityStatus = 'draft' | 'unpublished' | 'upcoming' | 'live' | 'expired';

export interface QuizAvailability {
  status: QuizAvailabilityStatus;
  isAvailable: boolean; // true strictly when live and accepting new attempts
  startsAt?: string | null;
  endsAt?: string | null;
  message?: string;
}

export interface QuizSection {
  id: string;
  quiz_id: string;
  title: string;
  description?: string | null;
  section_order: number;
  created_at?: string;
}

export type QuizAttemptStatus = 'started' | 'in_progress' | 'submitted' | 'auto_submitted' | 'expired' | 'abandoned';

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  session_token: string;
  participant_name: string;
  participant_email?: string | null;
  participant_data?: Record<string, any> | null;
  started_at: string;
  expires_at?: string | null;
  submitted_at?: string | null;
  status: QuizAttemptStatus;
  attempt_number: number;
  answer_snapshot?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
}

export interface Option {
  id: string;
  question_id?: string;
  option_text: string;
  option_image: string | null;
  is_correct: boolean;
  option_order: number;
}

export interface Question {
  id: string;
  quiz_id?: string;
  question_text: string;
  question_description?: string | null;
  question_type: QuestionType;
  question_image: string | null;
  marks: number;
  negative_marks?: number;
  required: boolean;
  question_order: number;
  section_title?: string | null;
  section_description?: string | null;
  time_limit_seconds?: number | null;
  scoring_method?: ScoringMethod;
  accepted_answers?: string[];
  case_sensitive?: boolean;
  trim_whitespace?: boolean;
  normalize_spaces?: boolean;
  question_settings?: Record<string, any>;
  section_id?: string | null;
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
  instructions?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  availability?: QuizAvailability;
  created_at?: string;
  updated_at?: string;
  questions?: Question[];
  sections?: QuizSection[];
}

/**
 * Public facing types (Strictly sanitized - NEVER exposes is_correct or internal answer key)
 */
export interface PublicOption {
  id: string;
  question_id?: string;
  option_text: string;
  option_image: string | null;
  option_order: number;
}

export interface PublicQuestion {
  id: string;
  quiz_id?: string;
  question_text: string;
  question_description?: string | null;
  question_type: QuestionType;
  question_image: string | null;
  marks: number;
  negative_marks?: number;
  required: boolean;
  question_order: number;
  section_title?: string | null;
  section_description?: string | null;
  time_limit_seconds?: number | null;
  scoring_method?: ScoringMethod;
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
  instructions?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  availability?: QuizAvailability;
  sections?: QuizSection[];
  questions: PublicQuestion[];
  totalQuestions: number;
  totalMarks: number;
}

export interface PublicQuizWithAttempt extends PublicQuiz {
  attemptId?: string;
  sessionToken?: string;
  expiresAt?: string | null;
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
  attempt_id?: string | null;
  total_possible_marks?: number;
  percentage?: number;
  passed?: boolean;
  time_taken_seconds?: number;
}

export interface Answer {
  id: string;
  submission_id: string;
  question_id: string;
  selected_option_id?: string | null;
  selected_option_ids?: string[] | null;
  text_answer?: string | null;
  earned_marks?: number;
}

export interface ParticipantInfo {
  name: string;
  email?: string | null;
  club_name?: string | null;
  district_number?: string | null;
  position?: string | null;
  data?: Record<string, any> | null;
}

export interface SelectedAnswer {
  questionId: string;
  selectedOptionId?: string | null;
  selectedOptionIds?: string[] | null;
  textAnswer?: string | null;
}

export interface QuizSubmissionPayload {
  participant: ParticipantInfo;
  answers: SelectedAnswer[];
  attemptId?: string;
  sessionToken?: string;
}


export interface QuestionBreakdown {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  earnedMarks: number;
  maxMarks: number;
  isCorrect?: boolean;
  correctOptionIds?: string[];
  acceptedAnswers?: string[];
  userSelection?: string | string[] | null;
}

export interface QuizSubmissionResult {
  submissionId: string;
  score: number;
  totalPossibleMarks: number;
  percentage: number;
  passed?: boolean;
  submittedAt: string;
  feedbackMessage?: string;
  breakdown?: QuestionBreakdown[];
}

/**
 * Settings & Errors
 */
export interface TextAnswerSettings {
  accepted_answers: string[];
  case_sensitive: boolean;
  trim_whitespace: boolean;
  normalize_spaces: boolean;
}

export interface QuizValidationError {
  type: 'fatal' | 'warning';
  message: string;
  questionId?: string;
}

export interface OllamaSettings {
  enabled: boolean;
  endpoint: string;
  model: string;
  timeout_seconds: number;
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
  id?: string | number;
  text?: string;
  option_text?: string;
  correct?: boolean;
  is_correct?: boolean;
  image?: string | null;
  option_image?: string | null;
}

export interface QuizJsonImportQuestion {
  id?: string | number;
  question?: string;
  question_text?: string;
  description?: string | null;
  explanation?: string | null;
  question_description?: string | null;
  type?: QuestionType;
  question_type?: QuestionType;
  required?: boolean;
  marks?: number;
  negative_marks?: number;
  negativeMarks?: number;
  image?: string | null;
  question_image?: string | null;
  section_title?: string | null;
  section_description?: string | null;
  time_limit_seconds?: number | null;
  timeLimitSeconds?: number | null;
  scoring_method?: ScoringMethod;
  scoringMethod?: ScoringMethod;
  accepted_answers?: string[];
  acceptedAnswers?: string[];
  case_sensitive?: boolean;
  caseSensitive?: boolean;
  trim_whitespace?: boolean;
  trimWhitespace?: boolean;
  normalize_spaces?: boolean;
  normalizeSpaces?: boolean;
  options?: QuizJsonImportOption[];
}

export interface QuizJsonImportSection {
  id?: string | number;
  title: string;
  description?: string | null;
  questions?: (string | number)[];
}

export interface QuizJsonImportFormat {
  id?: string;
  version?: string;
  title: string;
  slug?: string;
  description?: string | null;
  status?: QuizStatus;
  theme?: QuizJsonImportTheme;
  coverImage?: string | null;
  cover_image?: string | null;
  settings?: QuizSettings | Record<string, any>;
  instructions?: string | null;
  schedule_enabled?: boolean;
  start_at?: string | null;
  end_at?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  sections?: (QuizSection | QuizJsonImportSection)[];
  features?: Partial<QuizFeatureFlags>;
  questions: QuizJsonImportQuestion[];
}

/**
 * Admin Responses & Results Analytics Types
 */
export interface ResponseListItem {
  id: string;
  quiz_id: string;
  quiz_title: string;
  quiz_slug?: string;
  participant_name: string;
  participant_email: string | null;
  participant_data: Record<string, any> | null;
  score: number;
  total_possible_marks: number;
  percentage: number;
  passed: boolean;
  submitted_at: string;
  attempt_id?: string | null;
  answer_count?: number;
  time_taken_seconds?: number;
}

export interface QuestionResponseDetail {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  maxMarks: number;
  earnedMarks: number;
  selectedOptionId?: string | null;
  selectedOptionIds?: string[] | null;
  textAnswer?: string | null;
  selectedOptionTexts?: string[];
  correctOptionTexts?: string[];
  acceptedAnswers?: string[];
  isCorrect?: boolean;
  answerId?: string;
  sectionTitle?: string | null;
}

export interface ResponseDetail {
  submission: Submission & { quiz_title: string; quiz_slug?: string };
  quiz: Quiz;
  questions: QuestionResponseDetail[];
}

export interface ResponsesFilterParams {
  search?: string;
  quizId?: string;
  status?: 'all' | 'passed' | 'failed';
  minScore?: number;
  maxScore?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'submitted_at' | 'score' | 'percentage' | 'participant_name';
  sortOrder?: 'asc' | 'desc';
}

export interface ResponsesSummary {
  totalResponses: number;
  averageScore: number;
  averagePercentage: number;
  passCount: number;
  failCount: number;
  passRate: number;
  highestScore: number;
  lowestScore: number;
}

export interface PaginatedResponsesResult {
  items: ResponseListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: ResponsesSummary;
}

