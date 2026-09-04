/**
 * QuizMania Design System & Brand Palette
 * Rotaract Club of Mapusa
 */

export const QUIZMANIA_BRAND = {
  name: 'QuizMania',
  subBrand: 'by Rotaract Club of Mapusa',
  tagline: 'Think. Play. Compete.',
  badgeText: 'ROTARACT CLUB OF MAPUSA PRESENTS',
  year: '2026',
  copyright: '© 2026 QuizMania. An initiative of Rotaract Club of Mapusa.',

  // Official color tokens inspired by branding reference
  colors: {
    primary: '#6E123D',      // Deep Burgundy / Wine
    secondary: '#A50D52',    // Rich Magenta
    accent: '#D83B70',       // Bright Pink Accent
    blush: '#F3D6E1',        // Soft Blush
    background: '#FAF8F9',   // Off White Background
    surface: '#FFFFFF',      // Clean White Surface
    darkText: '#24141C',     // Dark Text
    mutedText: '#6B5A62',    // Softened Dark Muted Text
    border: '#F0E1E8',       // Subtle Rose-Gray Border
    surfaceSubtle: '#F6EDF1' // Soft Surface Tint
  },

  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFamily: 'Inter, system-ui, sans-serif'
  }
} as const;

/**
 * Generates root CSS variables for QuizMania branding.
 */
export function getQuizManiaCssVariables(): Record<string, string> {
  return {
    '--qm-primary': QUIZMANIA_BRAND.colors.primary,
    '--qm-secondary': QUIZMANIA_BRAND.colors.secondary,
    '--qm-accent': QUIZMANIA_BRAND.colors.accent,
    '--qm-blush': QUIZMANIA_BRAND.colors.blush,
    '--qm-background': QUIZMANIA_BRAND.colors.background,
    '--qm-surface': QUIZMANIA_BRAND.colors.surface,
    '--qm-text': QUIZMANIA_BRAND.colors.darkText,
    '--qm-text-muted': QUIZMANIA_BRAND.colors.mutedText,
    '--qm-border': QUIZMANIA_BRAND.colors.border
  };
}
