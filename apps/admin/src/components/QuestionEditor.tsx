'use client';

import React from 'react';
import { Trash2, Plus, GripVertical, CheckCircle, AlertCircle } from 'lucide-react';
import type { Question, Option, QuestionType } from '@quizmania/types';
import { OptionEditor } from './OptionEditor';
import { ImageUploader } from './ImageUploader';

interface QuestionEditorProps {
  question: Question;
  questionNumber: number;
  onChange: (updated: Question) => void;
  onDelete: () => void;
}

export function QuestionEditor({ question, questionNumber, onChange, onDelete }: QuestionEditorProps) {
  const options = question.options || [];

  const handleTextChange = (text: string) => {
    onChange({ ...question, question_text: text });
  };

  const handleMarksChange = (marks: number) => {
    onChange({ ...question, marks: Math.max(1, marks) });
  };

  const handleRequiredToggle = (required: boolean) => {
    onChange({ ...question, required });
  };

  const handleTypeChange = (type: QuestionType) => {
    onChange({ ...question, question_type: type });
  };

  const handleImageChange = (url: string) => {
    onChange({ ...question, question_image: url });
  };

  const handleOptionChange = (index: number, updatedOption: Option) => {
    const newOptions = [...options];
    // If single choice and marking as correct, uncheck other options
    if (question.question_type === 'single_choice' && updatedOption.is_correct) {
      newOptions.forEach(opt => {
        opt.is_correct = false;
      });
    }
    newOptions[index] = updatedOption;
    onChange({ ...question, options: newOptions });
  };

  const handleAddOption = () => {
    const newOpt: Option = {
      id: `opt-${Date.now()}-${options.length + 1}`,
      question_id: question.id,
      option_text: '',
      option_image: null,
      is_correct: options.length === 0, // First option default correct
      option_order: options.length + 1
    };
    onChange({ ...question, options: [...options, newOpt] });
  };

  const handleDeleteOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    onChange({ ...question, options: newOptions });
  };

  const hasCorrectOption = options.some(o => o.is_correct);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300">
      {/* Question Header Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
            {questionNumber}
          </span>
          <h3 className="font-semibold text-slate-800 text-sm">Question {questionNumber}</h3>
          {!hasCorrectOption && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" /> No correct answer selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Marks */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Marks:</span>
            <input
              type="number"
              min="1"
              value={question.marks}
              onChange={e => handleMarksChange(parseInt(e.target.value) || 1)}
              className="w-14 px-2 py-1 border border-slate-300 rounded text-center text-xs font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Required toggle */}
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={question.required}
              onChange={e => handleRequiredToggle(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
            />
            <span>Required</span>
          </label>

          {/* Delete Button */}
          <button
            type="button"
            onClick={onDelete}
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="Delete Question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Body */}
      <div className="p-6 space-y-5">
        {/* Question Text & Type */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Question Statement <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={question.question_text}
              onChange={e => handleTextChange(e.target.value)}
              placeholder="e.g. Which nutrient is important for building muscles?"
              className="w-full text-sm border border-slate-200 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Question Type</label>
            <select
              value={question.question_type}
              onChange={e => handleTypeChange(e.target.value as QuestionType)}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="single_choice">Single Choice</option>
              <option value="multiple_choice">Multiple Choice (Future)</option>
              <option value="true_false">True / False (Future)</option>
              <option value="text_answer">Short Text (Future)</option>
            </select>
            <div className="mt-3">
              <ImageUploader
                bucket="question-images"
                currentUrl={question.question_image}
                onUploaded={handleImageChange}
                label="Question Image (Optional)"
              />
            </div>
          </div>
        </div>

        {/* Options Section */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Answer Options ({options.length})
            </span>
            <span className="text-xs text-slate-400">
              Select the circle next to the correct answer
            </span>
          </div>

          <div className="space-y-2">
            {options.map((opt, idx) => (
              <OptionEditor
                key={opt.id || idx}
                option={opt}
                index={idx}
                questionType={question.question_type}
                onChange={updated => handleOptionChange(idx, updated)}
                onDelete={() => handleDeleteOption(idx)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddOption}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-dashed border-blue-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Option
          </button>
        </div>
      </div>
    </div>
  );
}
