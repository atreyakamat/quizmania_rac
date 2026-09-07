import React from 'react';
import { AdminHeader } from '@/components/AdminHeader';
import { getResponsesPaginated, getAllQuizzes } from '@quizmania/shared';
import { ResponsesManager } from './ResponsesManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ResultsPage() {
  const [initialData, quizzes] = await Promise.all([
    getResponsesPaginated({ page: 1, pageSize: 25 }),
    getAllQuizzes()
  ]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <AdminHeader
        title="Participant Responses & Analytics"
        subtitle="Review participant submissions, scores, question breakdowns, and grade paragraph answers"
      />

      <ResponsesManager initialData={initialData} quizzes={quizzes} />
    </div>
  );
}
