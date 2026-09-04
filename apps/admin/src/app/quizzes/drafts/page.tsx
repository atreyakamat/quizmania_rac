import React from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/AdminHeader';
import { QuizStatusBadge } from '@/components/QuizStatusBadge';
import { getAllQuizzes } from '@quizmania/shared';
import { FileEdit, PlusCircle } from 'lucide-react';

export const revalidate = 0;

export default async function DraftsPage() {
  const drafts = await getAllQuizzes('draft');

  return (
    <div>
      <AdminHeader
        title="Draft Quizzes"
        subtitle="Quizzes currently being created or edited and not visible to public participants"
        action={
          <Link
            href="/quizzes/create"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-lg transition-colors shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Quiz</span>
          </Link>
        }
      />

      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Draft Quizzes ({drafts.length})
            </span>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Title & Slug</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Questions</th>
                <th className="px-6 py-3">Theme</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drafts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs">
                    No draft quizzes found.
                  </td>
                </tr>
              ) : (
                drafts.map(quiz => (
                  <tr key={quiz.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{quiz.title}</div>
                      <span className="text-xs text-slate-400 font-mono">/q/{quiz.slug}</span>
                    </td>
                    <td className="px-6 py-4">
                      <QuizStatusBadge status={quiz.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {quiz.questions?.length || 0} Questions
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {quiz.theme?.name || 'Default'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <Link
                        href={`/quizzes/${quiz.id}/edit`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <FileEdit className="w-3 h-3" />
                        Edit / Publish
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
