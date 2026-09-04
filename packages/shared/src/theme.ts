import type { Theme } from '@quizmania/types';
import { QUIZMANIA_BRAND } from './brand/quizmania-theme';

export const defaultTheme: Theme = {
  id: 'theme-quizmania-rotaract',
  name: 'QuizMania Rotaract',
  primary_color: QUIZMANIA_BRAND.colors.primary,
  secondary_color: QUIZMANIA_BRAND.colors.secondary,
  background_color: QUIZMANIA_BRAND.colors.background,
  surface_color: QUIZMANIA_BRAND.colors.surface,
  text_color: QUIZMANIA_BRAND.colors.darkText,
  button_color: QUIZMANIA_BRAND.colors.secondary,
  border_radius: '1rem',
  font_family: 'Inter, system-ui, sans-serif'
};

/**
 * Converts a Theme entity into a record of CSS variables.
 * These are attached dynamically to the root style of the Quiz container.
 */
export function getThemeCssVariables(theme?: Theme | null): Record<string, string> {
  const activeTheme = theme || defaultTheme;

  return {
    '--quiz-primary': activeTheme.primary_color || defaultTheme.primary_color,
    '--quiz-secondary': activeTheme.secondary_color || defaultTheme.secondary_color,
    '--quiz-background': activeTheme.background_color || defaultTheme.background_color,
    '--quiz-surface': activeTheme.surface_color || defaultTheme.surface_color,
    '--quiz-text': activeTheme.text_color || defaultTheme.text_color,
    '--quiz-button': activeTheme.button_color || activeTheme.primary_color || defaultTheme.button_color,
    '--quiz-border-radius': activeTheme.border_radius || defaultTheme.border_radius,
    '--quiz-font-family': activeTheme.font_family || defaultTheme.font_family
  };
}
