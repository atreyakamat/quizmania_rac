import React from 'react';
import { AdminHeader } from '@/components/AdminHeader';
import { getAllSubmissions, getAllQuizzes } from '@quizmania/shared';
import { BarChart3, User, Mail, Award, Clock } from 'lucide-react';

export const revalidate = 0;

export default async function ResultsPage() {
  const [submissions, quizzes] = await Promise.all([
    getAllSubmissions(),
    getAllQuizzes()
  ]);

  const quizMap = new Map(quizzes.map(q => [q.id, q]));

  return (
    <div>
      <AdminHeader
        title="Participant Results & Submissions"
        subtitle="Review participant answers, scores, and completion timestamps"
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Total Submissions ({submissions.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Participant</th>
                  <th className="px-6 py-3">Quiz</th>
                  <th className="px-6 py-3">Earned Score</th>
                  <th className="px-6 py-3">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs">
                      No participant submissions recorded yet. Submissions made from the public quiz app will appear here.
                    </td>
                  </tr>
                ) : (
                  submissions.map(sub => {
                    const quiz = quizMap.get(sub.quiz_id);
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {sub.participant_name}
                          </div>
                          {sub.participant_email && (
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                              <Mail className="w-3 h-3" />
                              {sub.participant_email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-700">
                            {quiz?.title || sub.quiz_id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                            <Award className="w-3.5 h-3.5" />
                            {sub.score} Marks
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(sub.submitted_at).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
