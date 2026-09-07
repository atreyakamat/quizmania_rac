import { z } from 'zod';
import type { 
  QuizJsonImportFormat, 
  QuizJsonImportQuestion,
  QuizJsonImportOption,
  QuizJsonImportSection,
  QuestionType, 
  QuizStatus, 
  ScoringMethod,
  Quiz,
  Question,
  Option,
  QuizSection,
  QuizSettings
} from '@quizmania/types';

// Slug regex: lowercase alphanumeric and hyphens
export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const quizStatusSchema = z.enum(['draft', 'published', 'closed', 'archived']);
export const questionTypeSchema = z.enum([
  'single_choice',
  'multiple_choice',
  'true_false',
  'short_answer',
  'paragraph',
  'text_answer',
  'short_text'
]);
export const scoringMethodSchema = z.enum(['all_or_nothing', 'partial']);

// Hex color validation
export const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/;
export const colorSchema = z.string().regex(hexColorRegex, 'Invalid hex color code');

export const themeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Theme name is required'),
  primary_color: colorSchema,
  secondary_color: colorSchema,
  background_color: colorSchema,
  surface_color: colorSchema,
  text_color: colorSchema,
  button_color: colorSchema,
  border_radius: z.string().default('0.75rem'),
  font_family: z.string().default('Inter, system-ui, sans-serif'),
  created_at: z.string().optional()
});

export const quizFeatureFlagsSchema = z.object({
  timer: z.boolean().default(false),
  questionTimers: z.boolean().default(false),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  sections: z.boolean().default(false),
  review: z.boolean().default(true),
  showScoreImmediately: z.boolean().default(true),
  showCorrectAnswers: z.boolean().default(false),
  showAnswerFeedback: z.boolean().default(false),
  multipleAttempts: z.boolean().default(false),
  negativeMarking: z.boolean().default(false),
  partialCredit: z.boolean().default(false),
  aiGeneration: z.boolean().default(false)
});

export const quizSettingsSchema = z.object({
  time_limit_minutes: z.number().int().positive().nullable().optional(),
  enable_question_timer: z.boolean().default(false).optional(),
  auto_submit_on_expire: z.boolean().default(true).optional(),
  attempt_limit: z.number().int().positive().default(1).optional(),
  shuffle_questions: z.boolean().default(false).optional(),
  shuffle_options: z.boolean().default(false).optional(),
  passing_score_percentage: z.number().min(0).max(100).default(50).optional(),
  show_score_immediately: z.boolean().default(true).optional(),
  show_correct_answers: z.boolean().default(false).optional(),
  allow_review: z.boolean().default(true).optional(),
  show_progress_bar: z.boolean().default(true).optional(),
  require_participant_email: z.boolean().default(false).optional(),
  collect_club_details: z.boolean().default(false).optional(),
  // NEW FIELDS
  instructions: z.string().nullable().optional(),
  require_name: z.boolean().default(true).optional(),
  require_phone: z.boolean().default(false).optional(),
  require_club: z.boolean().default(false).optional(),
  require_district: z.boolean().default(false).optional(),
  allow_multiple_attempts: z.boolean().default(false).optional(),
  max_attempts: z.number().int().positive().default(1).optional(),
  allow_back_navigation: z.boolean().default(true).optional(),
  show_percentage: z.boolean().default(true).optional(),
  show_answer_feedback: z.boolean().default(false).optional(),
  show_completion_message: z.string().nullable().optional(),
  prevent_duplicate_submission: z.boolean().default(true).optional(),
  allow_negative_total: z.boolean().default(false).optional(),
  features: quizFeatureFlagsSchema.partial().optional(),
  time_limit_seconds: z.number().int().positive().nullable().optional(),
  auto_submit_on_timeout: z.boolean().default(true).optional()
  , negative_marking: z.boolean().default(false).optional()

});

export const quizSectionSchema = z.object({
  id: z.string(),
  quiz_id: z.string(),
  title: z.string().min(1, 'Section title is required'),
  description: z.string().nullable().optional(),
  section_order: z.number().int().default(1),
  created_at: z.string().optional()
});

export const quizAttemptSchema = z.object({
  id: z.string(),
  quiz_id: z.string(),
  session_token: z.string(),
  participant_name: z.string(),
  participant_email: z.string().nullable().optional(),
  participant_data: z.record(z.any()).nullable().optional(),
  started_at: z.string(),
  expires_at: z.string().nullable().optional(),
  submitted_at: z.string().nullable().optional(),
  status: z.enum(['started', 'in_progress', 'submitted', 'auto_submitted', 'expired', 'abandoned']),
  attempt_number: z.number().int().default(1),
  answer_snapshot: z.record(z.any()).nullable().optional(),
  metadata: z.record(z.any()).nullable().optional()
});

export const textAnswerSettingsSchema = z.object({
  accepted_answers: z.array(z.string()),
  case_sensitive: z.boolean().default(false),
  trim_whitespace: z.boolean().default(true),
  normalize_spaces: z.boolean().default(true)
});

export const optionSchema = z.object({
  id: z.string().optional(),
  question_id: z.string().optional(),
  option_text: z.string().default(''),
  option_image: z.string().nullable().optional(),
  is_correct: z.boolean().default(false),
  option_order: z.number().int().nonnegative().default(1)
}).refine(data => {
  return Boolean(data.option_text?.trim() || data.option_image);
}, {
  message: 'Option must contain either text or an image',
  path: ['option_text']
});

export const questionSchema = z.object({
  id: z.string().optional(),
  quiz_id: z.string().optional(),
  question_text: z.string().min(1, 'Question text cannot be empty'),
  question_description: z.string().nullable().optional(),
  question_type: questionTypeSchema.default('single_choice'),
  question_image: z.string().nullable().optional(),
  marks: z.number().int().min(0, 'Marks cannot be negative').default(1),
  negative_marks: z.number().nonnegative().default(0).optional(),
  required: z.boolean().default(true),
  question_order: z.number().int().nonnegative().default(1),
  section_title: z.string().nullable().optional(),
  section_description: z.string().nullable().optional(),
  time_limit_seconds: z.number().int().positive().nullable().optional(),
  scoring_method: scoringMethodSchema.default('all_or_nothing').optional(),
  accepted_answers: z.array(z.string()).optional(),
  case_sensitive: z.boolean().default(false).optional(),
  options: z.array(optionSchema).default([])
}).refine(data => {
  if (data.question_type === 'single_choice') {
    if (!data.options || data.options.length < 2) return false;
    const correctCount = data.options.filter(o => o.is_correct).length;
    return correctCount === 1;
  }
  if (data.question_type === 'multiple_choice') {
    if (!data.options || data.options.length < 2) return false;
    const correctCount = data.options.filter(o => o.is_correct).length;
    return correctCount >= 1;
  }
  if (data.question_type === 'true_false') {
    if (!data.options || data.options.length !== 2) return false;
    const correctCount = data.options.filter(o => o.is_correct).length;
    return correctCount === 1;
  }
  return true;
}, {
  message: 'Question options are invalid for the selected question type',
  path: ['options']
});

export const quizSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Quiz title is required').max(200),
  slug: z.string().regex(slugRegex, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().nullable().optional(),
  cover_image: z.string().nullable().optional(),
  status: quizStatusSchema.default('draft'),
  theme_id: z.string().nullable().optional(),
  settings: quizSettingsSchema.default({}),
  questions: z.array(questionSchema).optional()
});

/**
 * Quiz JSON Import Schema (Extended & Backward Compatible)
 */
export const quizJsonImportThemeSchema = z.object({
  name: z.string().min(1, 'Theme name is required'),
  primaryColor: colorSchema.or(z.string()),
  secondaryColor: colorSchema.or(z.string()),
  backgroundColor: colorSchema.or(z.string()),
  surfaceColor: colorSchema.or(z.string()),
  textColor: colorSchema.or(z.string()),
  buttonColor: colorSchema.optional(),
  borderRadius: z.string().optional(),
  fontFamily: z.string().optional()
});

export const EXAMPLE_IMPORT_JSON = `{
  "title": "Nutrition Awareness Quiz",
  "description": "Weekly nutrition awareness quiz by Rotaract Mapusa",
  "settings": {
    "timeLimitMinutes": 15,
    "passingScorePercentage": 60
  },
  "questions": [
    {
      "id": 1,
      "question": "Which vitamin is synthesized by sunlight?",
      "type": "single_choice",
      "marks": 5,
      "options": [
        { "id": "a", "text": "Vitamin A", "correct": false },
        { "id": "b", "text": "Vitamin D", "correct": true },
        { "id": "c", "text": "Vitamin C", "correct": false },
        { "id": "d", "text": "Vitamin B12", "correct": false }
      ]
    },
    {
      "id": 2,
      "question": "Which of the following are water-soluble vitamins?",
      "type": "multiple_choice",
      "marks": 5,
      "options": [
        { "id": "a", "text": "Vitamin B complex", "correct": true },
        { "id": "b", "text": "Vitamin C", "correct": true },
        { "id": "c", "text": "Vitamin A", "correct": false },
        { "id": "d", "text": "Vitamin K", "correct": false }
      ]
    },
    {
      "id": 3,
      "question": "Water makes up approximately 60% of the human adult body.",
      "type": "true_false",
      "marks": 5,
      "options": [
        { "id": "t", "text": "True", "correct": true },
        { "id": "f", "text": "False", "correct": false }
      ]
    }
  ]
}`;

export function generateSlug(text: string): string {
  const s = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || `quiz-${Date.now()}`;
}

export const quizJsonImportOptionSchema = z.object({
  id: z.union([z.string(), z.number()]).optional().transform(v => v !== undefined ? String(v) : undefined),
  text: z.string().optional(),
  option_text: z.string().optional(),
  correct: z.boolean().optional(),
  is_correct: z.boolean().optional(),
  image: z.string().nullable().optional(),
  option_image: z.string().nullable().optional()
}).transform(val => ({
  id: val.id,
  text: val.text ?? val.option_text ?? '',
  correct: val.correct ?? val.is_correct ?? false,
  image: val.image ?? val.option_image ?? null
}));

export const quizJsonImportQuestionSchema = z.object({
  id: z.union([z.string(), z.number()]).optional().transform(v => v !== undefined ? String(v) : undefined),
  question: z.string().optional(),
  question_text: z.string().optional(),
  description: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  question_description: z.string().nullable().optional(),
  type: questionTypeSchema.default('single_choice').optional(),
  question_type: questionTypeSchema.default('single_choice').optional(),
  required: z.boolean().default(true).optional(),
  marks: z.number().int().min(0, 'Marks cannot be negative').default(1).optional(),
  negative_marks: z.number().nonnegative().default(0).optional(),
  negativeMarks: z.number().nonnegative().default(0).optional(),
  image: z.string().nullable().optional(),
  question_image: z.string().nullable().optional(),
  section_title: z.string().nullable().optional(),
  section_description: z.string().nullable().optional(),
  time_limit_seconds: z.number().int().positive().nullable().optional(),
  timeLimitSeconds: z.number().int().positive().nullable().optional(),
  scoring_method: scoringMethodSchema.default('all_or_nothing').optional(),
  scoringMethod: scoringMethodSchema.default('all_or_nothing').optional(),
  accepted_answers: z.array(z.string()).optional(),
  acceptedAnswers: z.array(z.string()).optional(),
  case_sensitive: z.boolean().default(false).optional(),
  caseSensitive: z.boolean().default(false).optional(),
  trim_whitespace: z.boolean().default(true).optional(),
  trimWhitespace: z.boolean().default(true).optional(),
  normalize_spaces: z.boolean().default(true).optional(),
  normalizeSpaces: z.boolean().default(true).optional(),
  options: z.array(quizJsonImportOptionSchema).optional().default([])
}).transform(val => ({
  id: val.id,
  question: val.question ?? val.question_text ?? '',
  description: val.description ?? val.explanation ?? val.question_description ?? null,
  type: (val.type ?? val.question_type ?? 'single_choice') as QuestionType,
  required: val.required ?? true,
  marks: val.marks ?? 1,
  negative_marks: val.negativeMarks ?? val.negative_marks ?? 0,
  image: val.image ?? val.question_image ?? null,
  section_title: val.section_title ?? null,
  section_description: val.section_description ?? null,
  time_limit_seconds: val.timeLimitSeconds ?? val.time_limit_seconds ?? null,
  scoring_method: val.scoringMethod ?? val.scoring_method ?? 'all_or_nothing',
  accepted_answers: val.acceptedAnswers ?? val.accepted_answers,
  case_sensitive: val.caseSensitive ?? val.case_sensitive ?? false,
  trim_whitespace: val.trimWhitespace ?? val.trim_whitespace ?? true,
  normalize_spaces: val.normalizeSpaces ?? val.normalize_spaces ?? true,
  options: val.options ?? []
}));

export const quizJsonImportSectionSchema = z.object({
  id: z.union([z.string(), z.number()]).optional().transform(v => v !== undefined ? String(v) : undefined),
  title: z.string().min(1, 'Section title is required'),
  description: z.string().nullable().optional(),
  questions: z.array(z.union([z.string(), z.number()])).optional()
});

export const quizJsonImportSchema = z.object({
  id: z.string().optional(),
  version: z.string().optional(),
  title: z.string().min(1, 'Quiz title is required'),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  status: quizStatusSchema.default('draft').optional(),
  theme: quizJsonImportThemeSchema.optional(),
  coverImage: z.string().nullable().optional(),
  cover_image: z.string().nullable().optional(),
  settings: z.record(z.any()).optional(),
  instructions: z.string().nullable().optional(),
  sections: z.array(z.union([quizSectionSchema, quizJsonImportSectionSchema])).optional(),
  features: quizFeatureFlagsSchema.partial().optional(),
  questions: z.array(quizJsonImportQuestionSchema).min(1, 'Quiz must have at least one question')
});

/**
 * Robust Participant Schema
 */
export const participantSchema = z.object({
  name: z.string().min(1, 'Full name is required').max(100),
  email: z.string().optional().nullable().or(z.literal('')),
  club_name: z.string().optional().nullable().or(z.literal('')),
  district_number: z.string().optional().nullable().or(z.literal('')),
  position: z.string().optional().nullable().or(z.literal('')),
  data: z.record(z.any()).optional().nullable()
});

export const startAttemptSchema = z.object({
  quizId: z.string(),
  participant: participantSchema
});

export const saveAttemptSchema = z.object({
  attemptId: z.string(),
  answers: z.record(z.any())
});

export const selectedAnswerSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  selectedOptionId: z.string().nullable().optional(),
  selectedOptionIds: z.array(z.string()).nullable().optional(),
  textAnswer: z.string().nullable().optional()
});

export const quizSubmissionSchema = z.object({
  participant: participantSchema,
  answers: z.array(selectedAnswerSchema),
  attemptId: z.string().optional(),
  sessionToken: z.string().optional()
});

/**
 * JSON validation helper with formatted human-readable errors
 */
export function validateQuizJson(input: string | unknown): {
  success: boolean;
  data?: QuizJsonImportFormat;
  errors?: string[];
} {
  try {
    let raw: unknown;
    if (typeof input === 'string') {
      try {
        raw = JSON.parse(input);
      } catch (err) {
        return {
          success: false,
          errors: [`Invalid JSON: ${err instanceof Error ? err.message : 'Syntax error'}`]
        };
      }
    } else {
      raw = input;
    }

    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return {
        success: false,
        errors: ['Invalid JSON: Expected a JSON object with title and questions.']
      };
    }

    const errors: string[] = [];
    const rawObj = raw as Record<string, any>;

    // 1. Basic Title Check
    if (!rawObj.title || typeof rawObj.title !== 'string' || !rawObj.title.trim()) {
      errors.push('Quiz title is required.');
    }

    // 2. Questions Array Check
    if (!rawObj.questions) {
      errors.push('Quiz must contain a "questions" array.');
    } else if (!Array.isArray(rawObj.questions)) {
      errors.push('"questions" must be an array.');
    } else if (rawObj.questions.length === 0) {
      errors.push('Quiz must have at least one question.');
    } else {
      // 3. Detailed per-question validation
      rawObj.questions.forEach((q: any, idx: number) => {
        const qNum = idx + 1;
        if (!q || typeof q !== 'object') {
          errors.push(`Question ${qNum}: Invalid question format.`);
          return;
        }

        // Question text
        const qText = q.question ?? q.question_text;
        if (!qText || typeof qText !== 'string' || !qText.trim()) {
          errors.push(`Question ${qNum}: Question text is required.`);
        }

        // Question type
        const rawType = q.type ?? q.question_type ?? 'single_choice';
        const validTypes = [
          'single_choice',
          'multiple_choice',
          'true_false',
          'short_text',
          'short_answer',
          'text_answer',
          'paragraph'
        ];
        if (!validTypes.includes(rawType)) {
          errors.push(
            `Question ${qNum}: Unsupported question type "${rawType}". Supported types are: single_choice, multiple_choice, true_false, short_text, paragraph.`
          );
          return;
        }

        const normalizedType = (rawType === 'short_answer' || rawType === 'text_answer') ? 'short_text' : rawType;

        // Check duplicate option IDs
        if (Array.isArray(q.options)) {
          const seenIds = new Set<string>();
          q.options.forEach((opt: any) => {
            if (opt && (opt.id !== undefined && opt.id !== null)) {
              const idStr = String(opt.id);
              if (seenIds.has(idStr)) {
                errors.push(`Question ${qNum}: Duplicate option ID "${idStr}" found.`);
              }
              seenIds.add(idStr);
            }
          });
        }

        // Specific Type Validations
        if (normalizedType === 'single_choice') {
          if (!Array.isArray(q.options) || q.options.length < 2) {
            errors.push(`Question ${qNum}: single_choice questions must have at least 2 options.`);
          } else {
            const correctCount = q.options.filter((o: any) => Boolean(o?.correct ?? o?.is_correct)).length;
            if (correctCount === 0) {
              errors.push(`Question ${qNum}: single_choice questions must have exactly one correct option (none found).`);
            } else if (correctCount > 1) {
              errors.push(`Question ${qNum}: single_choice questions must have exactly one correct option (${correctCount} found).`);
            }
          }
        } else if (normalizedType === 'multiple_choice') {
          if (!Array.isArray(q.options) || q.options.length < 2) {
            errors.push(`Question ${qNum}: multiple_choice questions must have at least 2 options.`);
          } else {
            const correctCount = q.options.filter((o: any) => Boolean(o?.correct ?? o?.is_correct)).length;
            if (correctCount === 0) {
              errors.push(`Question ${qNum}: multiple_choice questions must have at least one correct option.`);
            }
          }
        } else if (normalizedType === 'true_false') {
          if (Array.isArray(q.options)) {
            if (q.options.length !== 2) {
              errors.push(`Question ${qNum}: true_false questions must have exactly 2 options (True and False).`);
            } else {
              const correctCount = q.options.filter((o: any) => Boolean(o?.correct ?? o?.is_correct)).length;
              if (correctCount !== 1) {
                errors.push(`Question ${qNum}: true_false questions must have exactly one correct option.`);
              }
            }
          }
        } else if (normalizedType === 'short_text') {
          const marksVal = Number(q.marks ?? 1);
          // Graded short_text questions (marks > 0) require at least one accepted answer.
          // Ungraded / survey / registration fields (marks === 0) do not require accepted answers.
          if (marksVal > 0) {
            const accepted = q.acceptedAnswers ?? q.accepted_answers ?? (
              Array.isArray(q.options)
                ? q.options.filter((o: any) => Boolean(o?.correct ?? o?.is_correct)).map((o: any) => o?.text ?? o?.option_text)
                : []
            );
            if (!Array.isArray(accepted) || accepted.length === 0 || accepted.every((a: any) => !String(a).trim())) {
              errors.push(`Question ${qNum}: short_text questions must have at least one accepted answer.`);
            }
          }
        }
      });
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors
      };
    }

    // Structural Zod parsing
    const result = quizJsonImportSchema.safeParse(raw);
    if (!result.success) {
      const formatted = result.error.errors.map(err => {
        const path = err.path.join('.');
        return path ? `[${path}] ${err.message}` : err.message;
      });
      return {
        success: false,
        errors: formatted
      };
    }

    return {
      success: true,
      data: result.data as unknown as QuizJsonImportFormat
    };
  } catch (err) {
    return {
      success: false,
      errors: [err instanceof Error ? err.message : 'Unknown validation error']
    };
  }
}

export interface ImportSummary {
  questionsCount: number;
  optionsCount: number;
  sectionsCount: number;
}

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function generateCanonicalUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function isCanonicalUuid(id?: string | null): boolean {
  return Boolean(id && UUID_REGEX.test(id));
}

/**
 * Validates and converts JSON import data directly into QuizMania's internal Quiz model
 */
export function convertQuizJsonToQuiz(
  input: string | unknown,
  existingQuizId?: string
): {
  success: boolean;
  quiz?: Quiz;
  summary?: ImportSummary;
  errors?: string[];
} {
  const validation = validateQuizJson(input);
  if (!validation.success || !validation.data) {
    return {
      success: false,
      errors: validation.errors || ['Validation failed']
    };
  }

  const data = validation.data;
  const quizId = (existingQuizId && isCanonicalUuid(existingQuizId))
    ? existingQuizId
    : (data.id && isCanonicalUuid(String(data.id)))
      ? String(data.id)
      : generateCanonicalUuid();
  const slug = data.slug?.trim() ? generateSlug(data.slug) : generateSlug(data.title);

  // Parse Sections if any
  const questionToSectionTitle = new Map<string, string>();
  const sections: QuizSection[] = [];
  if (Array.isArray(data.sections)) {
    data.sections.forEach((sec: any, secIdx: number) => {
      const secTitle = sec.title || `Section ${secIdx + 1}`;
      const secId = (sec.id && isCanonicalUuid(String(sec.id))) ? String(sec.id) : generateCanonicalUuid();
      sections.push({
        id: secId,
        quiz_id: quizId,
        title: secTitle,
        description: sec.description || null,
        section_order: sec.section_order ?? (secIdx + 1)
      });
      if (Array.isArray(sec.questions)) {
        sec.questions.forEach((qRef: any) => {
          questionToSectionTitle.set(String(qRef), secTitle);
        });
      }
    });
  }

  // Parse Settings
  const rawSettings = (data.settings || {}) as Record<string, any>;
  const timeLimitMinutes = rawSettings.timeLimitMinutes ?? rawSettings.time_limit_minutes ?? (rawSettings.timer === false ? null : 15);
  const settings: QuizSettings = {
    time_limit_minutes: timeLimitMinutes,
    passing_score_percentage: rawSettings.passingScorePercentage ?? rawSettings.passing_score_percentage ?? 50,
    show_score_immediately: rawSettings.showScoreImmediately ?? rawSettings.show_score_immediately ?? true,
    show_correct_answers: rawSettings.showCorrectAnswers ?? rawSettings.show_correct_answers ?? false,
    allow_review: rawSettings.allowReview ?? rawSettings.allow_review ?? true,
    allow_back_navigation: rawSettings.allowBackNavigation ?? rawSettings.allow_back_navigation ?? true,
    require_participant_email: rawSettings.requireParticipantEmail ?? rawSettings.require_participant_email ?? false,
    shuffle_questions: rawSettings.shuffleQuestions ?? rawSettings.shuffle_questions ?? false,
    shuffle_options: rawSettings.shuffleOptions ?? rawSettings.shuffle_options ?? false,
    allow_multiple_attempts: rawSettings.multipleAttempts ?? rawSettings.allow_multiple_attempts ?? false,
    instructions: data.instructions ?? rawSettings.instructions ?? null,
    features: {
      timer: rawSettings.timer ?? Boolean(timeLimitMinutes && timeLimitMinutes > 0),
      review: rawSettings.allowReview ?? rawSettings.allow_review ?? true,
      showScoreImmediately: rawSettings.showScoreImmediately ?? rawSettings.show_score_immediately ?? true,
      showCorrectAnswers: rawSettings.showCorrectAnswers ?? rawSettings.show_correct_answers ?? false,
      shuffleQuestions: rawSettings.shuffleQuestions ?? rawSettings.shuffle_questions ?? false,
      shuffleOptions: rawSettings.shuffleOptions ?? rawSettings.shuffle_options ?? false
    }
  };

  let totalOptionsCount = 0;

  // Parse Questions
  const questions: Question[] = (data.questions || []).map((q: any, qIdx: number) => {
    const qNumber = qIdx + 1;
    const questionId = (q.id && isCanonicalUuid(String(q.id))) ? String(q.id) : generateCanonicalUuid();
    const logicalId = q.id !== undefined && q.id !== null ? String(q.id) : String(qNumber);
    const assignedSectionTitle = q.section_title || questionToSectionTitle.get(logicalId) || null;

    let qType = q.type || q.question_type || 'single_choice';
    if (qType === 'short_answer' || qType === 'text_answer') {
      qType = 'short_text';
    }

    let questionOptions: Option[] = [];

    if (qType === 'true_false') {
      if (Array.isArray(q.options) && q.options.length === 2) {
        questionOptions = q.options.map((opt: any, optIdx: number) => ({
          id: (opt.id && isCanonicalUuid(String(opt.id))) ? String(opt.id) : generateCanonicalUuid(),
          question_id: questionId,
          option_text: opt.text ?? opt.option_text ?? (optIdx === 0 ? 'True' : 'False'),
          option_image: opt.image ?? opt.option_image ?? null,
          is_correct: Boolean(opt.correct ?? opt.is_correct),
          option_order: optIdx + 1
        }));
      } else {
        questionOptions = [
          { id: generateCanonicalUuid(), question_id: questionId, option_text: 'True', option_image: null, is_correct: true, option_order: 1 },
          { id: generateCanonicalUuid(), question_id: questionId, option_text: 'False', option_image: null, is_correct: false, option_order: 2 }
        ];
      }
    } else if (qType === 'single_choice' || qType === 'multiple_choice') {
      questionOptions = (q.options || []).map((opt: any, optIdx: number) => ({
        id: (opt.id && isCanonicalUuid(String(opt.id))) ? String(opt.id) : generateCanonicalUuid(),
        question_id: questionId,
        option_text: opt.text ?? opt.option_text ?? '',
        option_image: opt.image ?? opt.option_image ?? null,
        is_correct: Boolean(opt.correct ?? opt.is_correct),
        option_order: optIdx + 1
      }));
    }

    totalOptionsCount += questionOptions.length;

    // Accepted answers for short_text
    let acceptedAnswers: string[] = [];
    if (qType === 'short_text') {
      let rawAccepted: any[] = [];
      if (Array.isArray(q.accepted_answers) && q.accepted_answers.length > 0) {
        rawAccepted = q.accepted_answers;
      } else if (Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length > 0) {
        rawAccepted = q.acceptedAnswers;
      } else if (Array.isArray(q.options) && q.options.length > 0) {
        rawAccepted = q.options.filter((o: any) => Boolean(o.correct ?? o.is_correct)).map((o: any) => o.text ?? o.option_text).filter(Boolean);
      }
      acceptedAnswers = rawAccepted.map(a => String(a).trim()).filter(Boolean);
    }

    return {
      id: questionId,
      quiz_id: quizId,
      question_text: q.question || q.question_text || '',
      question_description: q.description || q.explanation || q.question_description || null,
      question_type: qType as QuestionType,
      question_image: q.image || q.question_image || null,
      marks: typeof q.marks === 'number' && q.marks >= 0 ? q.marks : 1,
      negative_marks: typeof (q.negative_marks ?? q.negativeMarks) === 'number' ? (q.negative_marks ?? q.negativeMarks) : 0,
      required: q.required !== false,
      question_order: qNumber,
      section_title: assignedSectionTitle,
      section_description: q.section_description || null,
      time_limit_seconds: q.time_limit_seconds ?? q.timeLimitSeconds ?? null,
      scoring_method: q.scoring_method ?? q.scoringMethod ?? (qType === 'multiple_choice' ? 'all_or_nothing' : undefined),
      accepted_answers: acceptedAnswers,
      case_sensitive: Boolean(q.case_sensitive ?? q.caseSensitive),
      trim_whitespace: q.trim_whitespace ?? q.trimWhitespace ?? true,
      normalize_spaces: q.normalize_spaces ?? q.normalizeSpaces ?? true,
      options: questionOptions
    };
  });

  const quiz: Quiz = {
    id: quizId,
    title: data.title.trim(),
    slug,
    description: data.description || null,
    cover_image: data.coverImage || data.cover_image || null,
    status: data.status || 'draft',
    theme_id: null,
    settings,
    instructions: data.instructions ?? settings.instructions ?? null,
    sections: sections.length > 0 ? sections : undefined,
    questions
  };

  return {
    success: true,
    quiz,
    summary: {
      questionsCount: questions.length,
      optionsCount: totalOptionsCount,
      sectionsCount: sections.length
    }
  };
}

