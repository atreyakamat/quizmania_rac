import React from 'react';
import { notFound } from 'next/navigation';
import { AdminHeader } from '@/components/AdminHeader';
import { QuizEditor } from '@/components/QuizEditor';
import { getQuizById, getAllThemes } from '@quizmania/shared';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EditQuizPage({ params }: { params: { id: string } }) {
  const [quiz, themes] = await Promise.all([
    getQuizById(params.id),
    getAllThemes()
  ]);

  if (!quiz) {
    notFound();
  }

  return (
    <div>
      <AdminHeader
        title={`Edit Quiz: ${quiz.title}`}
        subtitle={`Editing quiz /q/${quiz.slug} (${quiz.status})`}
      />
      <QuizEditor initialQuiz={quiz} availableThemes={themes} />
    </div>
  );
}
