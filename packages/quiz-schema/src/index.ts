import { z } from 'zod';
import type { QuizJsonImportFormat, QuestionType, QuizStatus } from '@quizmania/types';

// Slug regex: lowercase alphanumeric and hyphens
export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const quizStatusSchema = z.enum(['draft', 'published', 'closed', 'archived']);
export const questionTypeSchema = z.enum(['single_choice', 'multiple_choice', 'true_false', 'text_answer']);

// Hex color validation
export const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/;
export const colorSchema = z.string().regex(hexColorRegex, 'Invalid hex color code');

export const themeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Theme name is required'),
  primary_color: colorSchema,
  secondary_color: colorSchema,
  background_color: colorSchema,
  surface_color: colorSchema,
  text_color: colorSchema,
  button_color: colorSchema,
  border_radius: z.string().default('0.5rem'),
  font_family: z.string().default('Inter, system-ui, sans-serif'),
  created_at: z.string().optional()
});

export const quizSettingsSchema = z.object({
  time_limit_minutes: z.number().int().positive().nullable().optional(),
  shuffle_questions: z.boolean().default(false),
  shuffle_options: z.boolean().default(false),
  passing_score_percentage: z.number().min(0).max(100).default(50),
  show_score_immediately: z.boolean().default(true),
  allow_review: z.boolean().default(true),
  require_participant_email: z.boolean().default(false)
});

export const optionSchema = z.object({
  id: z.string().uuid().optional(),
  question_id: z.string().uuid().optional(),
  option_text: z.string().min(1, 'Option text cannot be empty'),
  option_image: z.string().nullable().optional(),
  is_correct: z.boolean().default(false),
  option_order: z.number().int().nonnegative()
});

export const questionSchema = z.object({
  id: z.string().uuid().optional(),
  quiz_id: z.string().uuid().optional(),
  question_text: z.string().min(1, 'Question text cannot be empty'),
  question_type: questionTypeSchema.default('single_choice'),
  question_image: z.string().nullable().optional(),
  marks: z.number().int().min(1, 'Marks must be at least 1').default(1),
  required: z.boolean().default(true),
  question_order: z.number().int().nonnegative(),
  options: z.array(optionSchema).min(2, 'A question must have at least 2 options')
}).refine(data => {
  if (data.question_type === 'single_choice') {
    const correctCount = data.options.filter(o => o.is_correct).length;
    return correctCount === 1;
  }
  return true;
}, {
  message: 'Single choice questions must have exactly one correct option',
  path: ['options']
});

export const quizSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Quiz title is required').max(200),
  slug: z.string().regex(slugRegex, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().nullable().optional(),
  cover_image: z.string().nullable().optional(),
  status: quizStatusSchema.default('draft'),
  theme_id: z.string().uuid().nullable().optional(),
  settings: quizSettingsSchema.default({}),
  questions: z.array(questionSchema).optional()
});

/**
 * Quiz JSON Import Schema
 * Matches specified format in prompt
 */
export const quizJsonImportThemeSchema = z.object({
  name: z.string().min(1, 'Theme name is required'),
  primaryColor: colorSchema,
  secondaryColor: colorSchema,
  backgroundColor: colorSchema,
  surfaceColor: colorSchema,
  textColor: colorSchema,
  buttonColor: colorSchema.optional(),
  borderRadius: z.string().optional(),
  fontFamily: z.string().optional()
});

export const quizJsonImportOptionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Option text is required'),
  correct: z.boolean(),
  image: z.string().nullable().optional()
});

export const quizJsonImportQuestionSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1, 'Question text is required'),
  type: questionTypeSchema.default('single_choice'),
  required: z.boolean().default(true),
  marks: z.number().int().min(1, 'Marks must be at least 1').default(1),
  image: z.string().nullable().optional(),
  options: z.array(quizJsonImportOptionSchema).min(2, 'Each question must have at least 2 options')
}).refine(data => {
  if (data.type === 'single_choice') {
    const correctCount = data.options.filter(o => o.correct).length;
    return correctCount === 1;
  }
  return true;
}, {
  message: 'Single choice questions must have exactly one option marked correct: true',
  path: ['options']
});

export const quizJsonImportSchema = z.object({
  title: z.string().min(1, 'Quiz title is required'),
  slug: z.string().regex(slugRegex, 'Slug must be URL friendly (e.g. nutrition-week-2026)'),
  description: z.string().nullable().optional(),
  status: quizStatusSchema.default('draft').optional(),
  theme: quizJsonImportThemeSchema.optional(),
  coverImage: z.string().nullable().optional(),
  settings: quizSettingsSchema.optional(),
  questions: z.array(quizJsonImportQuestionSchema).min(1, 'Quiz must have at least one question')
});

/**
 * Public Quiz Submission Schema
 */
export const participantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  data: z.record(z.any()).optional()
});

export const selectedAnswerSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  selectedOptionId: z.string().min(1, 'Selected option ID is required')
});

export const quizSubmissionSchema = z.object({
  participant: participantSchema,
  answers: z.array(selectedAnswerSchema)
});

/**
 * JSON validation helper with formatted errors
 */
export function validateQuizJson(input: string | unknown): {
  success: boolean;
  data?: QuizJsonImportFormat;
  errors?: string[];
} {
  try {
    let parsed: unknown;
    if (typeof input === 'string') {
      try {
        parsed = JSON.parse(input);
      } catch (err) {
        return {
          success: false,
          errors: [`Invalid JSON format: ${err instanceof Error ? err.message : 'Syntax error'}`]
        };
      }
    } else {
      parsed = input;
    }

    const result = quizJsonImportSchema.safeParse(parsed);
    if (!result.success) {
      const formattedErrors = result.error.errors.map(err => {
        const path = err.path.join('.');
        return path ? `[${path}] ${err.message}` : err.message;
      });
      return {
        success: false,
        errors: formattedErrors
      };
    }

    return {
      success: true,
      data: result.data as QuizJsonImportFormat
    };
  } catch (err) {
    return {
      success: false,
      errors: [err instanceof Error ? err.message : 'Unknown validation error']
    };
  }
}
