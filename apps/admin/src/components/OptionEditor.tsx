'use client';

import React, { useState } from 'react';
import { Trash2, CheckCircle2, Check, Image as ImageIcon, X, ArrowUp, ArrowDown } from 'lucide-react';
import type { Option } from '@quizmania/types';
import { ImageUploader } from './ImageUploader';

interface OptionEditorProps {
  option: Option;
  index: number;
  questionType: string;
  onChange: (updated: Option) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function OptionEditor({ option, index, questionType, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: OptionEditorProps) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const label = letters[index] || `#${index + 1}`;
  const [showImageUploader, setShowImageUploader] = useState(Boolean(option.option_image));

  const isMultiple = questionType === 'multiple_choice';

  return (
    <div className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
      option.is_correct 
        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-200' 
        : 'bg-white border-slate-200 hover:border-slate-300'
    }`}>
      <div className="flex items-center gap-3">
        {/* Correct answer toggle button */}
        <button
          type="button"
          onClick={() => onChange({ ...option, is_correct: !option.is_correct })}
          title={option.is_correct ? 'Correct Answer (Click to toggle)' : 'Click to mark as correct'}
          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-colors flex-shrink-0 ${
            option.is_correct 
              ? 'bg-emerald-600 text-white shadow-xs' 
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          {option.is_correct ? <Check className="w-4 h-4 stroke-[3]" /> : label}
        </button>

        {/* Option Text Input */}
        <div className="flex-1">
          <input
            type="text"
            value={option.option_text || ''}
            onChange={e => onChange({ ...option, option_text: e.target.value })}
            placeholder={`Option ${label} text (or image-only)...`}
            className="w-full text-sm border-0 bg-transparent focus:ring-0 focus:outline-none p-0 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Toggle image attachment */}
          <button
            type="button"
            onClick={() => setShowImageUploader(!showImageUploader)}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              option.option_image
                ? 'bg-purple-100 text-purple-700'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title="Attach Image to Option"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">{option.option_image ? 'Image Attached' : 'Add Image'}</span>
          </button>

          {/* Status Badge */}
          {option.is_correct && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Correct
            </span>
          )}

          {/* Reorder Buttons */}
          {onMoveUp && (
            <button
              type="button"
              disabled={isFirst}
              onClick={onMoveUp}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30"
              title="Move Option Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              disabled={isLast}
              onClick={onMoveDown}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30"
              title="Move Option Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete Button */}
          <button
            type="button"
            onClick={onDelete}
            className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="Delete Option"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Option Image Attachment Box */}
      {showImageUploader && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-sm">
            <ImageUploader
              bucket="question-images"
              currentUrl={option.option_image}
              onUploaded={url => onChange({ ...option, option_image: url })}
              label={`Option ${label} Image`}
            />
          </div>
          {option.option_image && (
            <button
              type="button"
              onClick={() => {
                onChange({ ...option, option_image: null });
                setShowImageUploader(false);
              }}
              className="text-[11px] text-rose-500 hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Remove Image
            </button>
          )}
        </div>
      )}
    </div>
  );
}
