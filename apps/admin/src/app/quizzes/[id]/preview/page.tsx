import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AdminHeader } from '@/components/AdminHeader';
import { QuizPreview } from '@/components/QuizPreview';
import { getQuizById } from '@quizmania/shared';
import { ArrowLeft, FileEdit } from 'lucide-react';

export const revalidate = 0;

export default async function PreviewQuizPage({ params }: { params: { id: string } }) {
  const quiz = await getQuizById(params.id);

  if (!quiz) {
    notFound();
  }

  return (
    <div>
      <AdminHeader
        title={`Preview: ${quiz.title}`}
        subtitle="Simulating the public participant experience using the assigned dynamic theme"
        action={
          <Link
            href={`/quizzes/${quiz.id}/edit`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-lg transition-colors shadow-xs"
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Edit Quiz</span>
          </Link>
        }
      />
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <Link
          href="/quizzes"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Quizzes
        </Link>
        <QuizPreview quiz={quiz} />
      </div>
    </div>
  );
}
