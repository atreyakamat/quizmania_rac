import React from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/AdminHeader';
import { QuizStatusBadge } from '@/components/QuizStatusBadge';
import { getAllQuizzes, getAllSubmissions, getAllThemes, getDatabaseStatus } from '@quizmania/shared';
import { 
  HelpCircle, 
  Globe2, 
  FileEdit, 
  BarChart3, 
  PlusCircle, 
  FileUp, 
  ExternalLink,
  Layers,
  Database
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const quizzes = await getAllQuizzes();
  const themes = await getAllThemes();
  const submissions = await getAllSubmissions();
  const dbStatus = await getDatabaseStatus();

  const publishedCount = quizzes.filter(q => q.status === 'published').length;
  const draftCount = quizzes.filter(q => q.status === 'draft').length;
  const isDbLive = dbStatus.mode === 'supabase';

  return (
    <div>
      <AdminHeader
        title="Admin Dashboard"
        subtitle="Manage quizzes, themes, media assets, and participant submissions"
      />

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Supabase Status Banner */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isDbLive ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <div>
              <span className="text-xs font-bold text-slate-800">
                Data Source: {isDbLive ? 'Supabase PostgreSQL (Live)' : 'Local Storage Mode (Development)'}
              </span>
              <p className="text-[11px] text-slate-500">
                {isDbLive 
                  ? 'All changes sync directly to your Supabase PostgreSQL instance and storage buckets.'
                  : dbStatus.message}
              </p>
            </div>
          </div>
          <Link
            href="/settings"
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
          >
            Check Connection &rarr;
          </Link>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Quizzes</span>
              <HelpCircle className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-800">{quizzes.length}</div>
            <span className="text-[11px] text-slate-400">Created across all statuses</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Published</span>
              <Globe2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{publishedCount}</div>
            <span className="text-[11px] text-slate-400">Live on public quiz domain</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Drafts</span>
              <FileEdit className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600">{draftCount}</div>
            <span className="text-[11px] text-slate-400">In-progress quizzes</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Submissions</span>
              <BarChart3 className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-purple-600">{submissions.length}</div>
            <span className="text-[11px] text-slate-400">Participant answers recorded</span>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/quizzes/create"
            className="group bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl text-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <PlusCircle className="w-7 h-7 text-blue-200 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-base">Create New Quiz</h3>
              <p className="text-xs text-blue-100 mt-1">
                Build a quiz with single-choice questions, custom marks, and dynamic theme.
              </p>
            </div>
            <span className="text-xs font-semibold text-white/90 mt-4 flex items-center gap-1">
              Start Builder &rarr;
            </span>
          </Link>

          <Link
            href="/quizzes?tab=import"
            className="group bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <FileUp className="w-7 h-7 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-base text-slate-800">Import Quiz JSON</h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload or paste standardized Quiz JSON format with instant Zod schema validation.
              </p>
            </div>
            <span className="text-xs font-semibold text-purple-600 mt-4 flex items-center gap-1">
              Open JSON Importer &rarr;
            </span>
          </Link>

          <Link
            href="/themes/create"
            className="group bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <Layers className="w-7 h-7 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-base text-slate-800">Theme Designer</h3>
              <p className="text-xs text-slate-500 mt-1">
                Customize CSS variable palettes, card surface colors, and typography for quizzes.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 mt-4 flex items-center gap-1">
              Create Theme &rarr;
            </span>
          </Link>
        </div>

        {/* Recent Quizzes Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Recent Quizzes</h3>
            <Link href="/quizzes" className="text-xs text-blue-600 font-semibold hover:underline">
              View All Quizzes ({quizzes.length})
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Quiz Title</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Questions</th>
                  <th className="px-6 py-3">Theme</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quizzes.slice(0, 5).map(quiz => (
                  <tr key={quiz.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{quiz.title}</div>
                      <span className="text-xs text-slate-400 font-mono">/q/{quiz.slug}</span>
                    </td>
                    <td className="px-6 py-4">
                      <QuizStatusBadge status={quiz.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {quiz.questions?.length || 0} Questions
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: quiz.theme?.primary_color || '#2563EB' }}
                        />
                        {quiz.theme?.name || 'Default'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <Link
                        href={`/quizzes/${quiz.id}/edit`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </Link>
                      {quiz.status === 'published' && (
                        <a
                          href={`http://localhost:3010/q/${quiz.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-0.5"
                        >
                          <span>Public URL</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
