import React from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/AdminHeader';
import { getAllThemes } from '@quizmania/shared';
import { Palette, PlusCircle, Sparkles } from 'lucide-react';

export const revalidate = 0;

export default async function ThemesPage() {
  const themes = await getAllThemes();

  return (
    <div>
      <AdminHeader
        title="Themes"
        subtitle="Manage dynamic visual themes and CSS variable color schemes for quizzes"
        action={
          <Link
            href="/themes/create"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-lg transition-colors shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Theme</span>
          </Link>
        }
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map(theme => (
            <div
              key={theme.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5 hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-base">{theme.name}</h3>
                <span className="text-[11px] font-mono text-slate-400">Radius: {theme.border_radius}</span>
              </div>

              {/* Color Swatches Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Color Tokens
                </span>
                <div className="grid grid-cols-5 gap-2">
                  <div className="text-center">
                    <div className="w-full h-8 rounded-lg border border-black/10 shadow-xs" style={{ backgroundColor: theme.primary_color }} />
                    <span className="text-[9px] text-slate-500 font-mono mt-1 block">Primary</span>
                  </div>
                  <div className="text-center">
                    <div className="w-full h-8 rounded-lg border border-black/10 shadow-xs" style={{ backgroundColor: theme.secondary_color }} />
                    <span className="text-[9px] text-slate-500 font-mono mt-1 block">Secondary</span>
                  </div>
                  <div className="text-center">
                    <div className="w-full h-8 rounded-lg border border-black/10 shadow-xs" style={{ backgroundColor: theme.background_color }} />
                    <span className="text-[9px] text-slate-500 font-mono mt-1 block">Bg</span>
                  </div>
                  <div className="text-center">
                    <div className="w-full h-8 rounded-lg border border-black/10 shadow-xs" style={{ backgroundColor: theme.surface_color }} />
                    <span className="text-[9px] text-slate-500 font-mono mt-1 block">Surface</span>
                  </div>
                  <div className="text-center">
                    <div className="w-full h-8 rounded-lg border border-black/10 shadow-xs" style={{ backgroundColor: theme.text_color }} />
                    <span className="text-[9px] text-slate-500 font-mono mt-1 block">Text</span>
                  </div>
                </div>
              </div>

              {/* Sample Card */}
              <div
                className="p-4 rounded-lg border text-xs space-y-2"
                style={{
                  backgroundColor: theme.background_color,
                  borderColor: 'rgba(0,0,0,0.1)',
                  borderRadius: theme.border_radius,
                  color: theme.text_color,
                  fontFamily: theme.font_family
                }}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Sample Quiz Card</span>
                  <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: theme.secondary_color }}>
                    Active
                  </span>
                </div>
                <p className="opacity-75 text-[11px]">
                  Colors dynamically injected via CSS variables.
                </p>
                <div
                  className="py-1 px-3 text-center text-white font-semibold rounded text-[11px]"
                  style={{ backgroundColor: theme.button_color || theme.primary_color, borderRadius: theme.border_radius }}
                >
                  Button Preview
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
