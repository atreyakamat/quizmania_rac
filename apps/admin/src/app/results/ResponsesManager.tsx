'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { 
  PaginatedResponsesResult, 
  Quiz, 
  ResponsesFilterParams, 
  ResponseDetail, 
  QuestionResponseDetail 
} from '@quizmania/types';
import { 
  Search, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Clock, 
  User, 
  Mail, 
  Building, 
  MapPin, 
  Eye, 
  Save, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  BarChart3, 
  Calendar, 
  Check, 
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  Copy,
  Users
} from 'lucide-react';
import type { ClubSummaryReport } from '@quizmania/shared';

export type ResponseFilterStatus = 'all' | 'passed' | 'failed';

interface ResponsesManagerProps {
  readonly initialData: PaginatedResponsesResult;
  readonly quizzes: readonly Quiz[];
}

// --- SUB-COMPONENTS FOR COGNITIVE SIMPLICITY ---

export function ResponsesSummaryCards({ summary }: Readonly<{ summary: PaginatedResponsesResult['summary'] }>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Responses
          </span>
          <div className="text-2xl font-black text-slate-900 mt-0.5">
            {summary.totalResponses}
          </div>
          <span className="text-[11px] text-slate-400">across all competitions</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Average Score
          </span>
          <div className="text-2xl font-black text-slate-900 mt-0.5">
            {summary.averageScore} <span className="text-xs font-semibold text-slate-400">({summary.averagePercentage}%)</span>
          </div>
          <span className="text-[11px] text-slate-400">High: {summary.highestScore} | Low: {summary.lowestScore}</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Pass Rate
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-0.5">
            {summary.passRate}%
          </div>
          <span className="text-[11px] text-slate-400">{summary.passCount} passed / {summary.failCount} failed</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#F3D6E1]/60 text-[#A50D52] flex items-center justify-center font-bold">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Performance
          </span>
          <div className="text-2xl font-black text-slate-900 mt-0.5">
            {summary.highestScore > 0 ? `${summary.highestScore} pts` : '—'}
          </div>
          <span className="text-[11px] text-slate-400">top recorded mark</span>
        </div>
      </div>
    </div>
  );
}

interface ResponsesFilterBarProps {
  readonly search: string;
  readonly onSearchChange: (val: string) => void;
  readonly quizId: string;
  readonly onQuizIdChange: (val: string) => void;
  readonly quizzes: readonly Quiz[];
  readonly status: ResponseFilterStatus;
  readonly onStatusChange: (val: ResponseFilterStatus) => void;
  readonly onExportCsv: () => void;
  readonly onOpenSummaryReport: () => void;
  readonly onResetFilters: () => void;
}

function ResponsesFilterBar({
  search,
  onSearchChange,
  quizId,
  onQuizIdChange,
  quizzes,
  status,
  onStatusChange,
  onExportCsv,
  onOpenSummaryReport,
  onResetFilters
}: Readonly<ResponsesFilterBarProps>) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Search input */}
        <div className="relative md:col-span-2 lg:col-span-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search participant, email, quiz..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A50D52] focus:border-transparent text-slate-800 placeholder-slate-400 bg-slate-50/50"
          />
        </div>

        {/* Quiz selector */}
        <div>
          <select
            value={quizId}
            onChange={e => onQuizIdChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A50D52] text-slate-800 bg-slate-50/50"
          >
            <option value="">All Quizzes ({quizzes.length})</option>
            {quizzes.map(q => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div>
          <select
            value={status}
            onChange={e => onStatusChange(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A50D52] text-slate-800 bg-slate-50/50"
          >
            <option value="all">All Statuses (Passed & Failed)</option>
            <option value="passed">Passed Only</option>
            <option value="failed">Failed Only</option>
          </select>
        </div>

        {/* Actions: CSV Export & Summary Report */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportCsv}
            title="Export Raw Responses CSV"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenSummaryReport}
            title="Generate Club Participation Summary Report"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#A50D52] hover:bg-[#830940] shadow-xs rounded-xl transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Summary Report</span>
          </button>
          <button
            onClick={onResetFilters}
            title="Reset Filters"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface SubmissionTableRowProps {
  readonly item: PaginatedResponsesResult['items'][0];
  readonly onOpenDetail: (id: string) => void;
}

function SubmissionTableRow({
  item,
  onOpenDetail
}: Readonly<SubmissionTableRowProps>) {
  const clubName = item.participant_data?.club_name as string | undefined;
  const district = item.participant_data?.district_number as string | undefined;

  return (
    <tr className="hover:bg-slate-50/70 transition-colors">
      {/* Participant */}
      <td className="px-6 py-4">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span>{item.participant_name}</span>
        </div>
        {item.participant_email && (
          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
            <Mail className="w-3 h-3" />
            <span>{item.participant_email}</span>
          </div>
        )}
        {(clubName || district) && (
          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-1">
            {clubName && (
              <span className="flex items-center gap-0.5 truncate max-w-[180px]">
                <Building className="w-3 h-3 text-slate-400" />
                {clubName}
              </span>
            )}
            {district && (
              <span className="flex items-center gap-0.5 text-slate-400">
                <MapPin className="w-3 h-3" />
                Dist. {district}
              </span>
            )}
          </div>
        )}
      </td>

      {/* Quiz Title */}
      <td className="px-6 py-4">
        <span className="font-semibold text-slate-800 text-xs block">
          {item.quiz_title}
        </span>
        {item.quiz_slug && (
          <span className="text-[10px] text-slate-400 font-mono block">
            /{item.quiz_slug}
          </span>
        )}
      </td>

      {/* Score */}
      <td className="px-6 py-4">
        <div className="font-bold text-slate-800 text-xs">
          {item.score} <span className="text-slate-400 font-normal">/ {item.total_possible_marks}</span>
        </div>
      </td>

      {/* Percentage */}
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
          item.passed 
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
            : 'text-rose-700 bg-rose-50 border-rose-200'
        }`}>
          {item.percentage}%
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        {item.passed ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Passed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
            <XCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        )}
      </td>

      {/* Submitted At */}
      <td className="px-6 py-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{new Date(item.submitted_at).toLocaleDateString()}</span>
        </div>
        <span className="text-[10px] text-slate-400 block mt-0.5">
          {new Date(item.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <button
          onClick={() => onOpenDetail(item.id)}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#A50D52] hover:text-[#D83B70] bg-[#F3D6E1]/40 hover:bg-[#F3D6E1]/80 px-3 py-1.5 rounded-xl transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View & Grade</span>
        </button>
      </td>
    </tr>
  );
}

interface ResponsesPaginationProps {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
  readonly onPageChange: (fn: (p: number) => number) => void;
  readonly onPageSizeChange: (size: number) => void;
}

function ResponsesPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange
}: Readonly<ResponsesPaginationProps>) {
  return (
    <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
      <div className="flex items-center gap-2">
        <span>Showing</span>
        <span className="font-bold text-slate-800">
          {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)}
        </span>
        <span>of</span>
        <span className="font-bold text-slate-800">{total}</span>
        <span>results</span>

        <span className="mx-2 text-slate-300">|</span>

        <span>Per page:</span>
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(p => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>
        <span className="px-3 py-1 font-bold text-slate-700">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(p => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

interface ResponsesTableProps {
  readonly data: PaginatedResponsesResult;
  readonly loading: boolean;
  readonly search: string;
  readonly quizId: string;
  readonly status: string;
  readonly sortBy: string;
  readonly sortOrder: string;
  readonly onSortChange: (sortBy: any, sortOrder: any) => void;
  readonly onResetFilters: () => void;
  readonly onOpenDetail: (id: string) => void;
  readonly onPageChange: (fn: (p: number) => number) => void;
  readonly onPageSizeChange: (size: number) => void;
}

function ResponsesTable({
  data,
  loading,
  search,
  quizId,
  status,
  sortBy,
  sortOrder,
  onSortChange,
  onResetFilters,
  onOpenDetail,
  onPageChange,
  onPageSizeChange
}: Readonly<ResponsesTableProps>) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            Submissions
          </span>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
            {data.total}
          </span>
          {loading && <span className="text-xs text-[#A50D52] font-semibold animate-pulse ml-2">Updating...</span>}
        </div>

        {/* Sorting */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Sort:</span>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={e => {
              const [sb, so] = e.target.value.split('-');
              onSortChange(sb, so);
            }}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-700 bg-white"
          >
            <option value="submitted_at-desc">Newest First</option>
            <option value="submitted_at-asc">Oldest First</option>
            <option value="score-desc">Highest Score</option>
            <option value="score-asc">Lowest Score</option>
            <option value="percentage-desc">Highest Percentage</option>
            <option value="participant_name-asc">Name (A-Z)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Participant</th>
              <th className="px-6 py-3.5">Quiz</th>
              <th className="px-6 py-3.5">Score</th>
              <th className="px-6 py-3.5">Percentage</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Submitted At</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                  <div className="max-w-sm mx-auto space-y-2">
                    <BarChart3 className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-600 text-sm">No submissions found</p>
                    <p className="text-xs text-slate-400">
                      {search || quizId || status !== 'all' 
                        ? 'Try resetting the search filters to view all responses.' 
                        : 'Participant submissions from the public quiz app will appear here.'}
                    </p>
                    {(search || quizId || status !== 'all') && (
                      <button
                        onClick={onResetFilters}
                        className="mt-3 text-xs font-bold text-[#A50D52] hover:underline"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              data.items.map(item => (
                <SubmissionTableRow key={item.id} item={item} onOpenDetail={onOpenDetail} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {data.total > 0 && (
        <ResponsesPagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}

interface QuestionBreakdownItemProps {
  readonly question: QuestionResponseDetail;
  readonly index: number;
  readonly currentEarned: number;
  readonly isSaving: boolean;
  readonly onGradeChange: (val: number) => void;
  readonly onSaveGrade: () => void;
}

function QuestionBreakdownItem({
  question: q,
  index: idx,
  currentEarned,
  isSaving,
  onGradeChange,
  onSaveGrade
}: Readonly<QuestionBreakdownItemProps>) {
  const isSubjective = q.questionType === 'paragraph';

  return (
    <div 
      key={q.questionId}
      className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 hover:border-slate-300 transition-colors shadow-2xs"
    >
      {/* Question header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          {q.sectionTitle && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Section: {q.sectionTitle}
            </span>
          )}
          <p className="font-bold text-slate-900 text-sm">
            <span className="text-[#A50D52] mr-1">#{idx + 1}.</span>
            {q.questionText}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full capitalize">
            {q.questionType.replace('_', ' ')}
          </span>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
            q.earnedMarks > 0 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
            {q.earnedMarks} / {q.maxMarks} pts
          </span>
        </div>
      </div>

      {/* Participant's Answer */}
      <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 space-y-1">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Participant&apos;s Answer:
        </span>

        {q.selectedOptionTexts && q.selectedOptionTexts.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {q.selectedOptionTexts.map((opt, oIdx) => (
              <span 
                key={oIdx} 
                className="inline-flex items-center gap-1 text-xs font-semibold bg-white text-slate-800 border border-slate-200 px-3 py-1 rounded-lg"
              >
                <Check className="w-3 h-3 text-blue-500" />
                {opt}
              </span>
            ))}
          </div>
        ) : q.textAnswer ? (
          <p className="text-xs text-slate-800 bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap font-mono">
            {q.textAnswer}
          </p>
        ) : (
          <span className="text-xs text-slate-400 italic">No answer provided</span>
        )}
      </div>

      {/* Admin Answer Key */}
      {(Boolean(q.correctOptionTexts?.length) || Boolean(q.acceptedAnswers?.length)) && (
        <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100 space-y-1">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Correct Answer Key (Admin View):
          </span>

          {q.correctOptionTexts && q.correctOptionTexts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {q.correctOptionTexts.map((opt, oIdx) => (
                <span 
                  key={oIdx} 
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-white text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {opt}
                </span>
              ))}
            </div>
          )}

          {q.acceptedAnswers && q.acceptedAnswers.length > 0 && (
            <div className="text-xs text-emerald-900 font-mono pt-0.5">
              Accepted Answers: {q.acceptedAnswers.join(' | ')}
            </div>
          )}
        </div>
      )}

      {/* Manual Grading Action */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40 -mx-5 -mb-5 p-4 rounded-b-2xl">
        <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{isSubjective ? 'Manual Subjective Grading:' : 'Adjust Score:'}</span>
        </span>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500">Marks:</label>
            <input
              type="number"
              min={0}
              max={q.maxMarks}
              step={0.5}
              value={currentEarned}
              onChange={e => {
                const val = parseFloat(e.target.value);
                onGradeChange(Number.isNaN(val) ? 0 : val);
              }}
              className="w-20 px-2.5 py-1 text-xs font-bold text-slate-800 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A50D52] bg-white text-center"
            />
            <span className="text-xs text-slate-400">/ {q.maxMarks}</span>
          </div>

          <button
            onClick={onSaveGrade}
            disabled={isSaving}
            className="inline-flex items-center gap-1 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Update</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ResponseDetailModalProps {
  readonly activeDetail: ResponseDetail | null;
  readonly detailLoading: boolean;
  readonly gradeInputs: Record<string, number>;
  readonly savingGradeFor: string | null;
  readonly gradeStatusMsg: { readonly type: 'success' | 'error'; readonly text: string } | null;
  readonly onClose: () => void;
  readonly onGradeChange: (questionId: string, val: number) => void;
  readonly onSaveGrade: (questionId: string) => void;
  readonly onDismissGradeStatus: () => void;
}

function ResponseDetailModal({
  activeDetail,
  detailLoading,
  gradeInputs,
  savingGradeFor,
  gradeStatusMsg,
  onClose,
  onGradeChange,
  onSaveGrade,
  onDismissGradeStatus
}: Readonly<ResponseDetailModalProps>) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-gradient-to-r from-slate-50 to-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#A50D52] bg-[#F3D6E1]/50 px-2.5 py-0.5 rounded-full">
                Submission Breakdown
              </span>
              {activeDetail?.submission.passed ? (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Passed
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Failed
                </span>
              )}
            </div>

            <h3 className="text-lg font-black text-slate-900 mt-1">
              {activeDetail?.submission.participant_name}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
              {activeDetail?.submission.participant_email && (
                <span className="flex items-center gap-1 font-mono">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {activeDetail.submission.participant_email}
                </span>
              )}
              {activeDetail?.submission.participant_data?.club_name && (
                <span className="flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" />
                  {activeDetail.submission.participant_data.club_name}
                </span>
              )}
              {activeDetail?.submission.participant_data?.district_number && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  Dist. {activeDetail.submission.participant_data.district_number}
                </span>
              )}
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3" />
                {activeDetail?.submission.submitted_at && new Date(activeDetail.submission.submitted_at).toLocaleString()}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {detailLoading ? (
            <div className="py-20 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-[#A50D52] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Loading response breakdown...</p>
            </div>
          ) : activeDetail ? (
            <>
              {/* Status Banner / Feedback */}
              {gradeStatusMsg && (
                <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                  gradeStatusMsg.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  <span>{gradeStatusMsg.text}</span>
                  <button onClick={onDismissGradeStatus} className="opacity-70 hover:opacity-100">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Summary Bar */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Quiz</span>
                  <span className="font-bold text-slate-800 text-sm">{activeDetail.submission.quiz_title}</span>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Score</span>
                    <span className="font-extrabold text-slate-900 text-base">
                      {activeDetail.submission.score} / {activeDetail.submission.total_possible_marks}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Percentage</span>
                    <span className={`font-extrabold text-base ${
                      activeDetail.submission.passed ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {activeDetail.submission.percentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Questions Breakdown */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Question-by-Question Breakdown ({activeDetail.questions.length})
                </h4>

                {activeDetail.questions.map((q, idx) => (
                  <QuestionBreakdownItem
                    key={q.questionId}
                    question={q}
                    index={idx}
                    currentEarned={gradeInputs[q.questionId] ?? q.earnedMarks}
                    isSaving={savingGradeFor === q.questionId}
                    onGradeChange={val => onGradeChange(q.questionId, val)}
                    onSaveGrade={() => onSaveGrade(q.questionId)}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
}

interface ClubSummaryFrequencyTableProps {
  readonly report: ClubSummaryReport;
  readonly search: string;
}

function ClubSummaryFrequencyTable({
  report,
  search
}: Readonly<ClubSummaryFrequencyTableProps>) {
  const filteredItems = report.items.filter(item =>
    item.clubName.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
            <th className="px-5 py-3 w-16">#</th>
            <th className="px-5 py-3">Club Name</th>
            <th className="px-5 py-3 text-right w-32">Responses</th>
            <th className="px-5 py-3 text-right w-44">Share</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {filteredItems.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                No clubs match &ldquo;{search}&rdquo;
              </td>
            </tr>
          ) : (
            filteredItems.map((item, idx) => {
              const isUnknown = item.clubName === 'Unknown / Not Provided';
              return (
                <tr key={item.clubName} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">
                    {idx + 1}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">
                    {isUnknown ? (
                      <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-xs font-medium">
                        {item.clubName}
                      </span>
                    ) : (
                      <span>{item.clubName}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-extrabold text-slate-900 font-mono text-sm">
                    {item.count}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                        <div
                          className="bg-[#A50D52] h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-600 w-12 text-right">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 border-t-2 border-slate-200 font-extrabold text-xs text-slate-800">
            <td className="px-5 py-3.5 text-slate-400">∑</td>
            <td className="px-5 py-3.5">GRAND TOTAL</td>
            <td className="px-5 py-3.5 text-right font-mono text-sm text-[#A50D52]">
              {report.totalResponses}
            </td>
            <td className="px-5 py-3.5 text-right font-mono text-slate-700">
              100.0%
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

interface ClubSummaryModalBodyProps {
  readonly loading: boolean;
  readonly report: ClubSummaryReport | null;
  readonly search: string;
  readonly onSearchChange: (val: string) => void;
}

function ClubSummaryModalBody({
  loading,
  report,
  search,
  onSearchChange
}: Readonly<ClubSummaryModalBodyProps>) {
  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 border-4 border-[#F3D6E1] border-t-[#A50D52] rounded-full animate-spin mb-4" />
        <span className="text-sm font-bold text-slate-700">Generating Club Summary...</span>
        <span className="text-xs text-slate-400 mt-1">Normalizing club names and aggregating frequencies</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center text-slate-500">
        No summary data available.
      </div>
    );
  }

  return (
    <>
      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Responses
            </span>
            <span className="text-xl font-black text-slate-800">
              {report.totalResponses}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Unique Clubs
            </span>
            <span className="text-xl font-black text-slate-800">
              {report.uniqueClubs}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Top Participating Club
            </span>
            <span className="text-sm font-extrabold text-slate-800 truncate block max-w-[180px]">
              {report.items[0]?.clubName || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter / Search within Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search club in summary..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A50D52] bg-slate-50/50"
          />
        </div>
        <span className="text-xs text-slate-400">
          Sorted by highest frequency • Alphabetical secondary sort
        </span>
      </div>

      {/* Summary Frequency Table */}
      <ClubSummaryFrequencyTable report={report} search={search} />

      <p className="text-[11px] text-slate-400 leading-relaxed">
        ℹ️ Club names are grouped case-insensitively and internal whitespace is normalized so subtle typing differences do not create duplicate clubs. Responses with missing or blank club fields are grouped under &ldquo;Unknown / Not Provided&rdquo;.
      </p>
    </>
  );
}

interface ClubSummaryModalProps {
  readonly isOpen: boolean;
  readonly loading: boolean;
  readonly report: ClubSummaryReport | null;
  readonly search: string;
  readonly onSearchChange: (val: string) => void;
  readonly copied: boolean;
  readonly onClose: () => void;
  readonly onExportCsv: () => void;
  readonly onCopy: () => void;
  readonly onPrint: () => void;
}

function ClubSummaryModal({
  isOpen,
  loading,
  report,
  search,
  onSearchChange,
  copied,
  onClose,
  onExportCsv,
  onCopy,
  onPrint
}: Readonly<ClubSummaryModalProps>) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:max-h-none print:shadow-none print:rounded-none">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F3D6E1]/60 text-[#A50D52] flex items-center justify-center font-bold shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#A50D52] bg-[#F3D6E1]/50 px-2.5 py-0.5 rounded-full">
                  Participation Report
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Rotaract Club of Mapusa
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 mt-1">
                Club Participation Summary
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Case-insensitive, whitespace-normalized response breakdown by participant club name
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={onExportCsv}
              title="Download Summary CSV"
              disabled={loading || !report}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={onCopy}
              title="Copy Table to Clipboard"
              disabled={loading || !report}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={onPrint}
              title="Print Report"
              disabled={loading || !report}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close Modal"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <ClubSummaryModalBody
            loading={loading}
            report={report}
            search={search}
            onSearchChange={onSearchChange}
          />
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <span className="text-[11px] text-slate-400">
            QuizMania Platform • Rotaract Club of Mapusa
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onExportCsv}
              disabled={!report}
              className="px-4 py-2 text-xs font-bold text-white bg-[#A50D52] hover:bg-[#830940] rounded-xl transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Summary CSV</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN RESPONSES MANAGER COMPONENT ---

export function ResponsesManager({ initialData, quizzes }: Readonly<ResponsesManagerProps>) {
  const [data, setData] = useState<PaginatedResponsesResult>(initialData);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [quizId, setQuizId] = useState('');
  const [status, setStatus] = useState<ResponseFilterStatus>('all');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<'submitted_at' | 'score' | 'percentage' | 'participant_name'>('submitted_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal / Detail state
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<ResponseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [gradeInputs, setGradeInputs] = useState<Record<string, number>>({});
  const [savingGradeFor, setSavingGradeFor] = useState<string | null>(null);
  const [gradeStatusMsg, setGradeStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Summary Report state
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryReport, setSummaryReport] = useState<ClubSummaryReport | null>(null);
  const [summarySearch, setSummarySearch] = useState('');
  const [summaryCopied, setSummaryCopied] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch responses when filters change
  const fetchResponses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (quizId) params.set('quizId', quizId);
      if (status !== 'all') params.set('status', status);
      if (minScore) params.set('minScore', minScore);
      if (maxScore) params.set('maxScore', maxScore);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const res = await fetch(`/api/responses?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load responses:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, quizId, status, minScore, maxScore, startDate, endDate, page, pageSize, sortBy, sortOrder]);

  // Initial trigger or when parameters change
  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setQuizId('');
    setStatus('all');
    setMinScore('');
    setMaxScore('');
    setStartDate('');
    setEndDate('');
    setSortBy('submitted_at');
    setSortOrder('desc');
    setPage(1);
  };

  // Open detail modal
  const handleOpenDetail = async (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setDetailLoading(true);
    setGradeStatusMsg(null);
    try {
      const res = await fetch(`/api/responses/${submissionId}`);
      const json = await res.json();
      if (json.success) {
        setActiveDetail(json);
        const initialGrades: Record<string, number> = {};
        for (const q of json.questions) {
          initialGrades[q.questionId] = q.earnedMarks;
        }
        setGradeInputs(initialGrades);
      }
    } catch (err) {
      console.error('Failed to load submission details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedSubmissionId(null);
    setActiveDetail(null);
    setGradeStatusMsg(null);
  };

  // Save manual grade
  const handleSaveGrade = async (questionId: string) => {
    if (!selectedSubmissionId) return;
    const earnedMarks = gradeInputs[questionId];
    if (earnedMarks === undefined || isNaN(earnedMarks)) return;

    setSavingGradeFor(questionId);
    setGradeStatusMsg(null);

    try {
      const res = await fetch(`/api/responses/${selectedSubmissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, earnedMarks })
      });
      const json = await res.json();
      if (json.success) {
        setGradeStatusMsg({ type: 'success', text: `Marks updated to ${earnedMarks}. New total score: ${json.newScore} (${json.newPercentage}%)` });
        if (activeDetail) {
          const updatedQuestions = activeDetail.questions.map(q => 
            q.questionId === questionId ? { ...q, earnedMarks } : q
          );
          setActiveDetail({
            ...activeDetail,
            submission: {
              ...activeDetail.submission,
              score: json.newScore,
              percentage: json.newPercentage,
              passed: json.newPercentage >= (activeDetail.quiz.settings?.passing_score_percentage ?? 50)
            },
            questions: updatedQuestions
          });
        }
        fetchResponses();
      } else {
        setGradeStatusMsg({ type: 'error', text: json.error || 'Failed to update grade' });
      }
    } catch (err) {
      setGradeStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Network error' });
    } finally {
      setSavingGradeFor(null);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (quizId) params.set('quizId', quizId);
    if (status !== 'all') params.set('status', status);
    if (minScore) params.set('minScore', minScore);
    if (maxScore) params.set('maxScore', maxScore);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);

    window.open(`/api/responses/export?${params.toString()}`, '_blank');
  };

  // Open & Fetch Club Participation Summary Report
  const handleOpenSummaryReport = async () => {
    setIsSummaryModalOpen(true);
    setSummaryLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (quizId) params.set('quizId', quizId);
      if (status !== 'all') params.set('status', status);
      if (minScore) params.set('minScore', minScore);
      if (maxScore) params.set('maxScore', maxScore);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const res = await fetch(`/api/responses/summary?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.summary) {
        setSummaryReport(json.summary);
      }
    } catch (err) {
      console.error('Failed to load club summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Export Club Participation Summary CSV
  const handleExportSummaryCsv = () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (quizId) params.set('quizId', quizId);
    if (status !== 'all') params.set('status', status);
    if (minScore) params.set('minScore', minScore);
    if (maxScore) params.set('maxScore', maxScore);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);

    window.open(`/api/responses/summary/export?${params.toString()}`, '_blank');
  };

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    if (!summaryReport) return;
    const rows = [
      'Club Name\tResponses\tPercentage',
      ...summaryReport.items.map(item => `${item.clubName}\t${item.count}\t${item.percentage.toFixed(1)}%`),
      `TOTAL\t${summaryReport.totalResponses}\t100.0%`
    ];
    navigator.clipboard.writeText(rows.join('\n'));
    setSummaryCopied(true);
    setTimeout(() => setSummaryCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Summary Metrics Cards */}
      <ResponsesSummaryCards summary={data.summary} />

      {/* 2. Filter & Search Controls */}
      <ResponsesFilterBar
        search={search}
        onSearchChange={setSearch}
        quizId={quizId}
        onQuizIdChange={id => { setQuizId(id); setPage(1); }}
        quizzes={quizzes}
        status={status}
        onStatusChange={st => { setStatus(st); setPage(1); }}
        onExportCsv={handleExportCsv}
        onOpenSummaryReport={handleOpenSummaryReport}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Submissions Table */}
      <ResponsesTable
        data={data}
        loading={loading}
        search={debouncedSearch}
        quizId={quizId}
        status={status}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(sb, so) => { setSortBy(sb); setSortOrder(so); }}
        onResetFilters={handleResetFilters}
        onOpenDetail={handleOpenDetail}
        onPageChange={setPage}
        onPageSizeChange={size => { setPageSize(size); setPage(1); }}
      />

      {/* 4. Response Breakdown & Grading Modal */}
      {selectedSubmissionId && (
        <ResponseDetailModal
          activeDetail={activeDetail}
          detailLoading={detailLoading}
          gradeInputs={gradeInputs}
          savingGradeFor={savingGradeFor}
          gradeStatusMsg={gradeStatusMsg}
          onClose={handleCloseDetail}
          onGradeChange={(qId, val) => setGradeInputs(prev => ({ ...prev, [qId]: val }))}
          onSaveGrade={handleSaveGrade}
          onDismissGradeStatus={() => setGradeStatusMsg(null)}
        />
      )}

      {/* 5. Club Participation Summary Modal */}
      <ClubSummaryModal
        isOpen={isSummaryModalOpen}
        loading={summaryLoading}
        report={summaryReport}
        search={summarySearch}
        onSearchChange={setSummarySearch}
        copied={summaryCopied}
        onClose={() => setIsSummaryModalOpen(false)}
        onExportCsv={handleExportSummaryCsv}
        onCopy={handleCopySummary}
        onPrint={() => window.print()}
      />
    </div>
  );
}
