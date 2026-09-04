'use client';

import React from 'react';
import { Trash2, CheckCircle2, Circle } from 'lucide-react';
import type { Option } from '@quizmania/types';

interface OptionEditorProps {
  option: Option;
  index: number;
  questionType: string;
  onChange: (updated: Option) => void;
  onDelete: () => void;
}

export function OptionEditor({ option, index, questionType, onChange, onDelete }: OptionEditorProps) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const label = letters[index] || `#${index + 1}`;

  return (
    <div className={`p-3 rounded-lg border transition-colors flex items-center gap-3 ${
      option.is_correct ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white border-slate-200 hover:border-slate-300'
    }`}>
      {/* Correct answer toggle */}
      <button
        type="button"
        onClick={() => onChange({ ...option, is_correct: !option.is_correct })}
        title={option.is_correct ? 'Marked as correct' : 'Click to mark as correct'}
        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors flex-shrink-0 ${
          option.is_correct 
            ? 'bg-emerald-600 text-white shadow-xs' 
            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
        }`}
      >
        {label}
      </button>

      {/* Option Text */}
      <div className="flex-1">
        <input
          type="text"
          value={option.option_text}
          onChange={e => onChange({ ...option, option_text: e.target.value })}
          placeholder={`Option ${label} text...`}
          className="w-full text-sm border-0 bg-transparent focus:ring-0 focus:outline-none p-0 text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Status indicator tag */}
      {option.is_correct && (
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Correct
        </span>
      )}

      {/* Delete option button */}
      <button
        type="button"
        onClick={onDelete}
        className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors"
        title="Delete Option"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
