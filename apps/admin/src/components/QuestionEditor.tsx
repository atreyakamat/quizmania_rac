'use client';

import React from 'react';
import { 
  Trash2, 
  Plus, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  MinusCircle, 
  FolderPlus,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import type { Question, Option, QuestionType, ScoringMethod } from '@quizmania/types';
import { OptionEditor } from './OptionEditor';
import { ImageUploader } from './ImageUploader';

interface QuestionEditorProps {
  question: Question;
  questionNumber: number;
  totalQuestions?: number;
  onChange: (updated: Question) => void;
  onDuplicate?: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  sections?: {id: string, title: string}[];
}

export function QuestionEditor({
  question,
  questionNumber,
  totalQuestions,
  onChange,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  sections
}: QuestionEditorProps) {
  const options = question.options || [];

  const handleTextChange = (text: string) => {
    onChange({ ...question, question_text: text });
  };

  const handleDescriptionChange = (desc: string) => {
    onChange({ ...question, question_description: desc || null });
  };

  const handleMarksChange = (marks: number) => {
    onChange({ ...question, marks: Math.max(1, marks) });
  };

  const handleNegativeMarksChange = (neg: number) => {
    onChange({ ...question, negative_marks: Math.max(0, neg) });
  };

  const handleRequiredToggle = (required: boolean) => {
    onChange({ ...question, required });
  };

  const handleTypeChange = (type: QuestionType) => {
    let updatedOptions = [...options];

    // Preset for True / False
    if (type === 'true_false') {
      updatedOptions = [
        {
          id: `opt-tf-1-${Date.now()}`,
          question_id: question.id,
          option_text: 'True',
          option_image: null,
          is_correct: true,
          option_order: 1
        },
        {
          id: `opt-tf-2-${Date.now()}`,
          question_id: question.id,
          option_text: 'False',
          option_image: null,
          is_correct: false,
          option_order: 2
        }
      ];
    } else if (type === 'single_choice' && updatedOptions.length > 0) {
      // Ensure only 1 is correct
      let foundOne = false;
      updatedOptions = updatedOptions.map(opt => {
        if (opt.is_correct && !foundOne) {
          foundOne = true;
          return opt;
        }
        return { ...opt, is_correct: false };
      });
      if (!foundOne && updatedOptions[0]) {
        updatedOptions[0].is_correct = true;
      }
    } else if ((type === 'short_answer' || type === 'text_answer' || type === 'paragraph') && updatedOptions.length === 0) {
      // Clear options if switching to text
      updatedOptions = [];
    }

    onChange({ ...question, question_type: type, options: updatedOptions });
  };

  const handleImageChange = (url: string) => {
    onChange({ ...question, question_image: url });
  };

  const handleOptionChange = (index: number, updatedOption: Option) => {
    const newOptions = [...options];
    if (question.question_type === 'single_choice' || question.question_type === 'true_false') {
      if (updatedOption.is_correct) {
        newOptions.forEach(opt => {
          opt.is_correct = false;
        });
      }
    }
    newOptions[index] = updatedOption;
    onChange({ ...question, options: newOptions });
  };

  const handleAddOption = () => {
    const optId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    const newOpt: Option = {
      id: optId,
      question_id: question.id,
      option_text: '',
      option_image: null,
      is_correct: options.length === 0,
      option_order: options.length + 1
    };
    onChange({ ...question, options: [...options, newOpt] });
  };

  const handleDeleteOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    onChange({ ...question, options: newOptions });
  };

  const handleAcceptedAnswersChange = (value: string) => {
    const answers = value.split(',').map(a => a.trim()).filter(Boolean);
    onChange({ ...question, accepted_answers: answers });
  };

  const isTextType = question.question_type === 'short_answer' || question.question_type === 'text_answer' || question.question_type === 'paragraph';
  const hasCorrectOption = isTextType 
    ? (question.question_type === 'paragraph' || (question.accepted_answers && question.accepted_answers.length > 0))
    : options.some(o => o.is_correct);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300 space-y-0">
      
      {/* Optional Section Divider Header */}
      <div className="bg-slate-100/70 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <FolderPlus className="w-3.5 h-3.5 text-[#A50D52] flex-shrink-0" />
          {sections && sections.length > 0 ? (
            <select
              value={question.section_title || ''}
              onChange={e => onChange({ ...question, section_title: e.target.value || null })}
              className="w-full text-xs font-semibold bg-transparent border-0 p-0 text-slate-700 focus:ring-0 focus:outline-none"
            >
              <option value="">No Section Assigned</option>
              {sections.map(s => (
                <option key={s.id} value={s.title}>{s.title}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={question.section_title || ''}
              onChange={e => onChange({ ...question, section_title: e.target.value || null })}
              placeholder="Section (e.g. Section 1: General Knowledge, optional)..."
              className="w-full text-xs font-semibold bg-transparent border-0 p-0 text-slate-700 placeholder-slate-400 focus:ring-0 focus:outline-none"
            />
          )}
        </div>

        {/* Section reorder and management buttons */}
        <div className="flex items-center gap-1">
          {onMoveUp && (
            <button
              type="button"
              disabled={questionNumber <= 1}
              onClick={onMoveUp}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30"
              title="Move Question Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              disabled={totalQuestions ? questionNumber >= totalQuestions : false}
              onClick={onMoveDown}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30"
              title="Move Question Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}
          {onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-200"
              title="Duplicate Question"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-200"
            title="Delete Question"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Question Header */}
      <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-xl bg-[#A50D52] text-white font-black text-xs flex items-center justify-center shadow-xs">
            {questionNumber}
          </span>
          <span className="font-bold text-slate-800 text-sm">Question {questionNumber}</span>
          
          {!hasCorrectOption && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" /> Needs correct answer
            </span>
          )}
        </div>

        {/* Scoring & Settings Toolbar */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          {/* Marks */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Marks:</span>
            <input
              type="number"
              min="1"
              value={question.marks}
              onChange={e => handleMarksChange(parseInt(e.target.value) || 1)}
              className="w-12 px-1.5 py-1 border border-slate-300 rounded-lg text-center text-xs font-bold focus:outline-none focus:border-[#A50D52]"
            />
          </div>

          {/* Negative Marks */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Negative:</span>
            <input
              type="number"
              min="0"
              value={question.negative_marks || 0}
              onChange={e => handleNegativeMarksChange(parseInt(e.target.value) || 0)}
              className="w-12 px-1.5 py-1 border border-slate-300 rounded-lg text-center text-xs font-semibold focus:outline-none focus:border-[#A50D52]"
            />
          </div>

          {/* Question Timer */}
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="number"
              min="5"
              step="5"
              placeholder="Secs"
              value={question.time_limit_seconds || ''}
              onChange={e => onChange({ ...question, time_limit_seconds: parseInt(e.target.value) || null })}
              className="w-14 px-1.5 py-1 border border-slate-300 rounded-lg text-center text-xs placeholder-slate-400 focus:outline-none focus:border-[#A50D52]"
              title="Individual question timer in seconds (optional)"
            />
          </div>

          {/* Required toggle */}
          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none font-semibold">
            <input
              type="checkbox"
              checked={question.required}
              onChange={e => handleRequiredToggle(e.target.checked)}
              className="rounded border-slate-300 text-[#A50D52] focus:ring-[#A50D52] h-4 w-4"
            />
            <span>Required</span>
          </label>
        </div>
      </div>

      {/* Question Body */}
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Question Statement & Description */}
          <div className="md:col-span-8 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Question Statement <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={question.question_text}
                onChange={e => handleTextChange(e.target.value)}
                placeholder="e.g. Which vitamin is mainly produced in the body when skin is exposed to sunlight?"
                className="w-full text-sm font-medium border border-slate-200 rounded-xl p-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#A50D52] focus:ring-1 focus:ring-[#A50D52]"
              />
            </div>

            <div>
              <input
                type="text"
                value={question.question_description || ''}
                onChange={e => handleDescriptionChange(e.target.value)}
                placeholder="Optional explanation, hint, or supplementary instruction..."
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#A50D52]"
              />
            </div>
          </div>

          {/* Question Type & Image Uploader */}
          <div className="md:col-span-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Question Type</label>
              <select
                value={question.question_type}
                onChange={e => handleTypeChange(e.target.value as QuestionType)}
                className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 focus:outline-none focus:border-[#A50D52]"
              >
                <option value="single_choice">🔘 Single Choice (1 Correct)</option>
                <option value="multiple_choice">☑️ Multiple Choice (Multiple Correct)</option>
                <option value="true_false">⚖️ True / False</option>
                <option value="short_answer">✍️ Short Text Answer</option>
                <option value="paragraph">📄 Paragraph Response</option>
              </select>
            </div>

            {/* Multiple Choice Scoring Method */}
            {question.question_type === 'multiple_choice' && (
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1.5">
                <span className="text-[11px] font-bold text-purple-900 block">Multiple Choice Marking</span>
                <select
                  value={question.scoring_method || 'all_or_nothing'}
                  onChange={e => onChange({ ...question, scoring_method: e.target.value as ScoringMethod })}
                  className="w-full text-xs border border-purple-300 rounded-lg p-1.5 bg-white text-purple-900 focus:outline-none"
                >
                  <option value="all_or_nothing">All-or-Nothing (Must pick all correct)</option>
                  <option value="partial">Partial Marks (Proportional scoring)</option>
                </select>
              </div>
            )}

            {/* Question Image Attachment */}
            <div className="pt-1">
              <ImageUploader
                bucket="question-images"
                currentUrl={question.question_image}
                onUploaded={handleImageChange}
                label="Question Image / Diagram (Optional)"
              />
            </div>
          </div>
        </div>

        {/* Short Text Answer Configuration */}
        {(question.question_type === 'short_answer' || question.question_type === 'text_answer') && (
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-blue-900">Accepted Correct Answers (Comma Separated)</span>
              
              <div className="flex flex-wrap gap-4 mt-1">
                <label className="flex items-center gap-1.5 text-xs text-blue-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={question.case_sensitive || false}
                    onChange={e => onChange({ ...question, case_sensitive: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                  />
                  <span>Case Sensitive</span>
                </label>
                
                <label className="flex items-center gap-1.5 text-xs text-blue-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={question.trim_whitespace ?? true}
                    onChange={e => onChange({ ...question, trim_whitespace: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                  />
                  <span>Trim Whitespace</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-blue-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={question.normalize_spaces ?? true}
                    onChange={e => onChange({ ...question, normalize_spaces: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                  />
                  <span>Normalize Spaces</span>
                </label>
              </div>
            </div>
            
            <input
              type="text"
              value={(question.accepted_answers || []).join(', ')}
              onChange={e => handleAcceptedAnswersChange(e.target.value)}
              placeholder="e.g. Panaji, Panjim, Pangim"
              className="w-full text-xs border border-blue-300 rounded-lg p-2.5 bg-white text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            <span className="text-[11px] text-blue-700 block">
              Participants whose response matches any of the accepted answers will receive marks.
            </span>
          </div>
        )}

        {/* Paragraph Open Response Notice */}
        {question.question_type === 'paragraph' && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs text-slate-600">
            <span className="font-bold text-slate-800 block">Paragraph Response</span>
            <p>Participants will be provided a multi-line text area to write detailed subjective answers.</p>
          </div>
        )}

        {/* Options Section for Choices / True-False */}
        {!isTextType && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Answer Options ({options.length})
                </span>
                <span className="text-[11px] text-slate-500">
                  {question.question_type === 'multiple_choice' 
                    ? 'Click letters to toggle all correct answers (multiple allowed)' 
                    : 'Click a letter to mark it as the single correct answer'}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {question.question_type === 'true_false' ? (
                <div className="flex gap-4">
                  {options.map((opt, idx) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleOptionChange(idx, { ...opt, is_correct: true })}
                      className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                        opt.is_correct 
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-700 ring-2 ring-emerald-200' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {opt.option_text} {opt.is_correct && <CheckCircle className="inline w-4 h-4 ml-1 mb-0.5" />}
                    </button>
                  ))}
                </div>
              ) : (
                options.map((opt, idx) => (
                  <OptionEditor
                    key={opt.id || idx}
                    option={opt}
                    index={idx}
                    questionType={question.question_type}
                    onChange={updated => handleOptionChange(idx, updated)}
                    onDelete={() => handleDeleteOption(idx)}
                    onMoveUp={() => {
                      if (idx > 0) {
                        const newOptions = [...options];
                        [newOptions[idx - 1], newOptions[idx]] = [newOptions[idx], newOptions[idx - 1]];
                        newOptions.forEach((o, i) => o.option_order = i + 1);
                        onChange({ ...question, options: newOptions });
                      }
                    }}
                    onMoveDown={() => {
                      if (idx < options.length - 1) {
                        const newOptions = [...options];
                        [newOptions[idx + 1], newOptions[idx]] = [newOptions[idx], newOptions[idx + 1]];
                        newOptions.forEach((o, i) => o.option_order = i + 1);
                        onChange({ ...question, options: newOptions });
                      }
                    }}
                    isFirst={idx === 0}
                    isLast={idx === options.length - 1}
                  />
                ))
              )}
            </div>

            {question.question_type !== 'true_false' && (
              <button
                type="button"
                onClick={handleAddOption}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A50D52] hover:text-[#6E123D] hover:bg-[#F3D6E1]/40 px-4 py-2 rounded-xl border border-dashed border-[#A50D52]/40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Choice Option</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
