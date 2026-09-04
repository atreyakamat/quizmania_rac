'use client';

import React, { useState } from 'react';
import type { Theme } from '@quizmania/types';
import { getThemeCssVariables } from '@quizmania/shared';
import { Palette, Check, Sparkles } from 'lucide-react';

interface QuizThemeEditorProps {
  initialTheme?: Theme;
  onSave: (theme: Theme) => void;
  isSaving?: boolean;
}

export function QuizThemeEditor({ initialTheme, onSave, isSaving = false }: QuizThemeEditorProps) {
  const [theme, setTheme] = useState<Theme>(initialTheme || {
    id: `theme-${Date.now()}`,
    name: 'New Custom Theme',
    primary_color: '#2563EB',
    secondary_color: '#60A5FA',
    background_color: '#F8FAFC',
    surface_color: '#FFFFFF',
    text_color: '#0F172A',
    button_color: '#2563EB',
    border_radius: '0.75rem',
    font_family: 'Inter, system-ui, sans-serif'
  });

  const cssVars = getThemeCssVariables(theme) as React.CSSProperties;

  const handleColorChange = (key: keyof Theme, value: string) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Editor Controls */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-600" />
            Theme Properties
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Configure dynamic CSS variables used across the public quiz experience.
          </p>
        </div>

        {/* Theme Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Theme Name</label>
          <input
            type="text"
            value={theme.name}
            onChange={e => handleColorChange('name', e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
            placeholder="e.g. Autumn Warmth"
          />
        </div>

        {/* Colors Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Color (--quiz-primary)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.primary_color}
                onChange={e => handleColorChange('primary_color', e.target.value)}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
              />
              <input
                type="text"
                value={theme.primary_color}
                onChange={e => handleColorChange('primary_color', e.target.value)}
                className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Secondary Color (--quiz-secondary)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.secondary_color}
                onChange={e => handleColorChange('secondary_color', e.target.value)}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
              />
              <input
                type="text"
                value={theme.secondary_color}
                onChange={e => handleColorChange('secondary_color', e.target.value)}
                className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Background Color (--quiz-background)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.background_color}
                onChange={e => handleColorChange('background_color', e.target.value)}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
              />
              <input
                type="text"
                value={theme.background_color}
                onChange={e => handleColorChange('background_color', e.target.value)}
                className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Surface / Card Color (--quiz-surface)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.surface_color}
                onChange={e => handleColorChange('surface_color', e.target.value)}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
              />
              <input
                type="text"
                value={theme.surface_color}
                onChange={e => handleColorChange('surface_color', e.target.value)}
                className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Text Color (--quiz-text)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.text_color}
                onChange={e => handleColorChange('text_color', e.target.value)}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
              />
              <input
                type="text"
                value={theme.text_color}
                onChange={e => handleColorChange('text_color', e.target.value)}
                className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Button Color (--quiz-button)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.button_color}
                onChange={e => handleColorChange('button_color', e.target.value)}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
              />
              <input
                type="text"
                value={theme.button_color}
                onChange={e => handleColorChange('button_color', e.target.value)}
                className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Styling tokens */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Border Radius</label>
            <select
              value={theme.border_radius}
              onChange={e => handleColorChange('border_radius', e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
            >
              <option value="0.25rem">Small (4px)</option>
              <option value="0.5rem">Medium (8px)</option>
              <option value="0.75rem">Large (12px)</option>
              <option value="1rem">X-Large (16px)</option>
              <option value="1.5rem">Pill (24px)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Font Family</label>
            <select
              value={theme.font_family}
              onChange={e => handleColorChange('font_family', e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
            >
              <option value="Inter, system-ui, sans-serif">Modern Sans (Inter)</option>
              <option value="Georgia, Cambria, serif">Editorial Serif (Georgia)</option>
              <option value="'Courier New', Courier, monospace">Monospace Tech</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSave(theme)}
          disabled={isSaving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-xs"
        >
          {isSaving ? 'Saving Theme...' : 'Save Theme'}
        </button>
      </div>

      {/* Live Preview Card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Live Preview (Dynamic CSS Variables)
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            style=&#123;cssVariables&#125;
          </span>
        </div>

        {/* Simulated Quiz Container with Dynamic CSS Variables */}
        <div
          style={cssVars}
          className="p-8 rounded-2xl border transition-all shadow-md min-h-[420px] flex flex-col justify-between"
          // We apply the CSS variables dynamically
        >
          <div style={{ backgroundColor: 'var(--quiz-background)', color: 'var(--quiz-text)', fontFamily: 'var(--quiz-font-family)' }} className="p-6 rounded-xl border border-black/5 space-y-4">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--quiz-primary)' }}>
                Sample Question 1 of 5
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--quiz-secondary)', color: 'var(--quiz-text)' }}>
                5 Marks
              </span>
            </div>

            <h4 className="text-base font-bold" style={{ color: 'var(--quiz-text)' }}>
              Which nutrient is important for building muscles?
            </h4>

            {/* Options styled via CSS variables */}
            <div className="space-y-2 pt-2">
              <div
                className="p-3 rounded-lg border transition-all flex items-center gap-3 cursor-pointer shadow-xs"
                style={{
                  backgroundColor: 'var(--quiz-surface)',
                  borderColor: 'var(--quiz-primary)',
                  borderRadius: 'var(--quiz-border-radius)'
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: 'var(--quiz-button)' }}
                >
                  A
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--quiz-text)' }}>
                  Protein (Selected Option Preview)
                </span>
              </div>

              <div
                className="p-3 rounded-lg border border-black/10 flex items-center gap-3 opacity-80"
                style={{
                  backgroundColor: 'var(--quiz-surface)',
                  borderRadius: 'var(--quiz-border-radius)'
                }}
              >
                <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-xs font-bold text-black/60">
                  B
                </div>
                <span className="text-sm" style={{ color: 'var(--quiz-text)' }}>
                  Carbohydrates
                </span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm transition-transform active:scale-95"
                style={{
                  backgroundColor: 'var(--quiz-button)',
                  borderRadius: 'var(--quiz-border-radius)'
                }}
              >
                Continue to Next Question →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
