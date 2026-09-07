'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/AdminHeader';
import { QuizThemeEditor } from '@/components/QuizThemeEditor';
import type { Theme } from '@quizmania/types';

export default function CreateThemePage() {
  const router = useRouter();

  const handleSaveTheme = async (theme: Theme) => {
    try {
      const res = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save theme');
      }
      router.push('/themes');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save theme failed');
    }
  };

  return (
    <div>
      <AdminHeader
        title="Create Theme"
        subtitle="Design a custom palette and visual identity using dynamic CSS variables"
      />
      <div className="p-8 max-w-6xl mx-auto">
        <QuizThemeEditor onSave={handleSaveTheme} />
      </div>
    </div>
  );
}
