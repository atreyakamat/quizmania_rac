import React from 'react';
import { AdminHeader } from '@/components/AdminHeader';
import { QuizEditor } from '@/components/QuizEditor';
import { getAllThemes } from '@quizmania/shared';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CreateQuizPage() {
  const themes = await getAllThemes();

  return (
    <div>
      <AdminHeader
        title="Create New Quiz"
        subtitle="Configure quiz details, add questions, set correct answers, and assign a theme"
      />
      <QuizEditor availableThemes={themes} />
    </div>
  );
}
