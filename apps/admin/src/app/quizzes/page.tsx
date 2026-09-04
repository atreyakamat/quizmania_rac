import React from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/AdminHeader';
import { QuizStatusBadge } from '@/components/QuizStatusBadge';
import { JsonImporter } from '@/components/JsonImporter';
import { getAllQuizzes } from '@quizmania/shared';
import { PlusCircle, ExternalLink, FileEdit, Eye, FileUp } from 'lucide-react';

export const revalidate = 0;

export default async function AllQuizzesPage({
  searchParams
}: {
  searchParams: { tab?: string };
}) {
  const quizzes = await getAllQuizzes();
  const showImportTab = searchParams.tab === 'import';

  return (
    <div>
      <AdminHeader
        title="Quizzes"
        subtitle="Create, configure, and publish quizzes to the public platform"
        action={
          <div className="flex items-center gap-2">
            <Link
              href={showImportTab ? '/quizzes' : '/quizzes?tab=import'}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors shadow-xs"
            >
              <FileUp className="w-3.5 h-3.5 text-purple-600" />
              <span>{showImportTab ? 'Show Quiz List' : 'Import JSON'}</span>
            </Link>
            <Link
              href="/quizzes/create"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-lg transition-colors shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Quiz</span>
            </Link>
          </div>
        }
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {showImportTab ? (
          <div className="max-w-3xl mx-auto">
            <JsonImporter />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                All Quizzes ({quizzes.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Title & Slug</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Questions</th>
                    <th className="px-6 py-3">Theme</th>
                    <th className="px-6 py-3">Updated</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quizzes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                        No quizzes found. Click &quot;Create Quiz&quot; or &quot;Import JSON&quot; to get started.
                      </td>
                    </tr>
                  ) : (
                    quizzes.map(quiz => (
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
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: quiz.theme?.primary_color || '#2563EB' }}
                            />
                            {quiz.theme?.name || 'Default'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {quiz.updated_at ? new Date(quiz.updated_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <Link
                            href={`/quizzes/${quiz.id}/preview`}
                            className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Preview
                          </Link>
                          <Link
                            href={`/quizzes/${quiz.id}/edit`}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                          >
                            <FileEdit className="w-3 h-3" />
                            Edit
                          </Link>
                          {quiz.status === 'published' && (
                            <a
                              href={`http://localhost:3000/q/${quiz.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-0.5"
                            >
                              <span>Public</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
