'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/AdminHeader';
import { QuizThemeEditor } from '@/components/QuizThemeEditor';
import { saveTheme } from '@quizmania/shared';
import type { Theme } from '@quizmania/types';

export default function CreateThemePage() {
  const router = useRouter();

  const handleSaveTheme = async (theme: Theme) => {
    await saveTheme(theme);
    router.push('/themes');
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
