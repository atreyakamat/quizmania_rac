'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Quiz, Question, Theme, QuizStatus } from '@quizmania/types';
import { saveQuiz, setQuizStatus, deleteQuiz } from '@quizmania/shared';
import { QuestionEditor } from './QuestionEditor';
import { QuizStatusBadge } from './QuizStatusBadge';
import { ImageUploader } from './ImageUploader';
import { QuizPreview } from './QuizPreview';
import { JsonExporter } from './JsonExporter';
import { 
  Save, 
  Globe2, 
  Eye, 
  Trash2, 
  Plus, 
  Layers, 
  Settings2, 
  Palette, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

interface QuizEditorProps {
  initialQuiz?: Quiz;
  availableThemes?: Theme[];
}

export function QuizEditor({ initialQuiz, availableThemes = [] }: QuizEditorProps) {
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz>(initialQuiz || {
    id: `quiz-${Date.now()}`,
    title: '',
    slug: '',
    description: '',
    cover_image: null,
    status: 'draft',
    theme_id: availableThemes[0]?.id || null,
    theme: availableThemes[0] || null,
    settings: {
      time_limit_minutes: 15,
      passing_score_percentage: 50,
      show_score_immediately: true,
      allow_review: true,
      require_participant_email: false
    },
    questions: []
  });

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (val: string) => {
    setQuiz(prev => ({
      ...prev,
      title: val,
      slug: prev.slug === '' || prev.slug === generateSlug(prev.title) ? generateSlug(val) : prev.slug
    }));
  };

  const handleThemeChange = (themeId: string) => {
    const matched = availableThemes.find(t => t.id === themeId) || null;
    setQuiz(prev => ({
      ...prev,
      theme_id: themeId,
      theme: matched
    }));
  };

  const handleAddQuestion = () => {
    const questions = quiz.questions || [];
    const qNumber = questions.length + 1;
    const newQ: Question = {
      id: `q-${Date.now()}-${qNumber}`,
      quiz_id: quiz.id,
      question_text: '',
      question_type: 'single_choice',
      question_image: null,
      marks: 5,
      required: true,
      question_order: qNumber,
      options: [
        { id: `opt-${Date.now()}-1`, question_id: `q-${Date.now()}-${qNumber}`, option_text: '', option_image: null, is_correct: true, option_order: 1 },
        { id: `opt-${Date.now()}-2`, question_id: `q-${Date.now()}-${qNumber}`, option_text: '', option_image: null, is_correct: false, option_order: 2 }
      ]
    };
    setQuiz(prev => ({ ...prev, questions: [...questions, newQ] }));
  };

  const handleUpdateQuestion = (index: number, updatedQ: Question) => {
    const newQuestions = [...(quiz.questions || [])];
    newQuestions[index] = updatedQ;
    setQuiz(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleDeleteQuestion = (index: number) => {
    const newQuestions = (quiz.questions || []).filter((_, i) => i !== index);
    setQuiz(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleSave = async (overrideStatus?: QuizStatus) => {
    if (!quiz.title.trim()) {
      setFeedback({ type: 'error', message: 'Quiz title is required' });
      return;
    }
    if (!quiz.slug.trim()) {
      setFeedback({ type: 'error', message: 'Quiz slug is required' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const targetStatus = overrideStatus || quiz.status;
    const quizToSave = { ...quiz, status: targetStatus };

    try {
      const saved = await saveQuiz(quizToSave);
      setQuiz(saved);
      setFeedback({
        type: 'success',
        message: targetStatus === 'published' 
          ? `Quiz published successfully! Available at /q/${saved.slug}` 
          : 'Quiz saved as draft successfully!'
      });
      router.refresh();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      await deleteQuiz(quiz.id);
      router.push('/quizzes');
    }
  };

  if (isPreviewMode) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <QuizPreview quiz={quiz} onClose={() => setIsPreviewMode(false)} />
      </div>
    );
  }

  const questions = quiz.questions || [];
  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs sticky top-20 z-10">
        <div className="flex items-center gap-3">
          <QuizStatusBadge status={quiz.status} />
          <span className="text-xs text-slate-500">
            {questions.length} Questions | {totalMarks} Total Marks
          </span>
        </div>

        <div className="flex items-center gap-3">
          {quiz.id && <JsonExporter quizId={quiz.id} quizSlug={quiz.slug} />}

          <button
            type="button"
            onClick={() => setIsPreviewMode(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview Quiz
          </button>

          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave('published')}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
          >
            <Globe2 className="w-3.5 h-3.5" />
            {quiz.status === 'published' ? 'Update & Publish' : 'Publish Quiz'}
          </button>

          {quiz.id && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
              title="Delete Quiz"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-medium ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Primary Quiz Info & Settings Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          Quiz Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quiz Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={quiz.title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="e.g. Nutrition Week 2026 Quiz"
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              URL Slug <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center">
              <span className="text-xs text-slate-400 bg-slate-50 border border-r-0 border-slate-200 px-3 py-2.5 rounded-l-lg font-mono">
                /q/
              </span>
              <input
                type="text"
                value={quiz.slug}
                onChange={e => setQuiz(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                placeholder="nutrition-week-2026"
                className="w-full text-sm border border-slate-200 rounded-r-lg p-2.5 font-mono text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={quiz.description || ''}
            onChange={e => setQuiz(prev => ({ ...prev, description: e.target.value }))}
            placeholder="A short overview of what participants will learn or be tested on..."
            className="w-full text-sm border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Theme & Cover Image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-600" />
              Assigned Theme
            </label>
            <select
              value={quiz.theme_id || ''}
              onChange={e => handleThemeChange(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white text-slate-700 focus:outline-none focus:border-blue-500"
            >
              {availableThemes.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {quiz.theme && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] text-slate-500">Palette:</span>
                <span className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: quiz.theme.primary_color }} title="Primary" />
                <span className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: quiz.theme.secondary_color }} title="Secondary" />
                <span className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: quiz.theme.background_color }} title="Background" />
                <span className="text-[11px] text-slate-400 font-mono">({quiz.theme.name})</span>
              </div>
            )}
          </div>

          <div>
            <ImageUploader
              bucket="quiz-covers"
              currentUrl={quiz.cover_image}
              onUploaded={url => setQuiz(prev => ({ ...prev, cover_image: url }))}
              label="Quiz Cover Image"
            />
          </div>
        </div>

        {/* Settings */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5" />
            Quiz Settings
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Passing Score (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={quiz.settings?.passing_score_percentage ?? 50}
                onChange={e => setQuiz(prev => ({
                  ...prev,
                  settings: { ...prev.settings, passing_score_percentage: parseInt(e.target.value) || 50 }
                }))}
                className="w-full text-xs border border-slate-200 rounded p-2 text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Time Limit (mins)</label>
              <input
                type="number"
                min="1"
                value={quiz.settings?.time_limit_minutes ?? ''}
                onChange={e => setQuiz(prev => ({
                  ...prev,
                  settings: { ...prev.settings, time_limit_minutes: e.target.value ? parseInt(e.target.value) : null }
                }))}
                placeholder="None"
                className="w-full text-xs border border-slate-200 rounded p-2 text-center"
              />
            </div>
            <div className="flex items-center pt-4">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={quiz.settings?.show_score_immediately ?? true}
                  onChange={e => setQuiz(prev => ({
                    ...prev,
                    settings: { ...prev.settings, show_score_immediately: e.target.checked }
                  }))}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>Show score immediately</span>
              </label>
            </div>
            <div className="flex items-center pt-4">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={quiz.settings?.require_participant_email ?? false}
                  onChange={e => setQuiz(prev => ({
                    ...prev,
                    settings: { ...prev.settings, require_participant_email: e.target.checked }
                  }))}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>Require Email</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg">
            Questions ({questions.length})
          </h3>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <p className="text-sm text-slate-500">No questions added yet.</p>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Add your first question
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <QuestionEditor
                key={q.id || idx}
                question={q}
                questionNumber={idx + 1}
                onChange={updated => handleUpdateQuestion(idx, updated)}
                onDelete={() => handleDeleteQuestion(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
