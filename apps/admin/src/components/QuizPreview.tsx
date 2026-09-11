'use client';

import React, { useState } from 'react';
import type { Quiz } from '@quizmania/types';
import { getThemeCssVariables } from '@quizmania/shared';
import { ArrowLeft, ArrowRight, Eye, CheckCircle, Clock } from 'lucide-react';

interface QuizPreviewProps {
  quiz: Quiz;
  onClose?: () => void;
}

export function QuizPreview({ quiz, onClose }: QuizPreviewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const cssVars = getThemeCssVariables(quiz.theme) as React.CSSProperties;

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-900 text-white px-6 py-3 rounded-xl shadow-md">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <Eye className="w-4 h-4" />
          <span>Interactive Admin Preview Mode</span>
        </div>
        <div className="text-xs text-slate-300">
          Theme: <span className="font-semibold text-white">{quiz.theme?.name || 'Default Clean'}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            Exit Preview
          </button>
        )}
      </div>

      {/* Styled Quiz Container with CSS Variables */}
      <div
        style={cssVars}
        className="rounded-2xl border border-black/10 overflow-hidden shadow-lg"
      >
        <div style={{ backgroundColor: 'var(--quiz-background)', color: 'var(--quiz-text)', fontFamily: 'var(--quiz-font-family)' }} className="min-h-[500px] p-8 flex flex-col justify-between">
          {/* Header */}
          <div className="space-y-2 border-b border-black/10 pb-4">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--quiz-primary)' }}>
              {quiz.title || 'Untitled Quiz'}
            </h1>
            {quiz.description && (
              <p className="text-sm opacity-80 max-w-2xl whitespace-pre-line">{quiz.description}</p>
            )}

            {/* Progress indicator */}
            {questions.length > 0 && (
              <div className="flex items-center justify-between pt-4 text-xs font-medium">
                <span>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="opacity-70">
                  {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Completed
                </span>
              </div>
            )}
          </div>

          {/* Question area */}
          {currentQuestion ? (
            <div className="my-8 max-w-2xl mx-auto w-full space-y-6">
              <div
                className="p-6 rounded-2xl shadow-sm border border-black/5"
                style={{ backgroundColor: 'var(--quiz-surface)', borderRadius: 'var(--quiz-border-radius)' }}
              >
                {currentQuestion.section_title && (
                  <div className="mb-4 pb-2 border-b border-black/10">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                      Section
                    </span>
                    <h2 className="text-xl font-bold mt-1" style={{ color: 'var(--quiz-primary)' }}>
                      {currentQuestion.section_title}
                    </h2>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--quiz-secondary)', color: 'var(--quiz-text)' }}>
                    {currentQuestion.marks} Marks
                  </span>
                  {currentQuestion.required && (
                    <span className="text-xs font-semibold text-rose-500">
                      * Required
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--quiz-text)' }}>
                  {currentQuestion.question_text}
                </h3>

                {currentQuestion.question_image && (
                  <div className="mb-4 rounded-lg overflow-hidden border border-black/10 max-h-64">
                    <img src={currentQuestion.question_image} alt="Question" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Options / Inputs */}
                <div className="space-y-2.5">
                  {(currentQuestion.question_type === 'short_answer' || currentQuestion.question_type === 'text_answer') ? (
                    <input
                      type="text"
                      placeholder="Type your answer here..."
                      value={selectedAnswers[currentQuestion.id] || ''}
                      onChange={e => setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                      className="w-full p-4 rounded-xl border text-sm focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: 'var(--quiz-surface)',
                        borderColor: 'rgba(0,0,0,0.1)',
                        color: 'var(--quiz-text)',
                        borderRadius: 'var(--quiz-border-radius)'
                      }}
                    />
                  ) : currentQuestion.question_type === 'paragraph' ? (
                    <textarea
                      rows={4}
                      placeholder="Type your detailed answer here..."
                      value={selectedAnswers[currentQuestion.id] || ''}
                      onChange={e => setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                      className="w-full p-4 rounded-xl border text-sm focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: 'var(--quiz-surface)',
                        borderColor: 'rgba(0,0,0,0.1)',
                        color: 'var(--quiz-text)',
                        borderRadius: 'var(--quiz-border-radius)'
                      }}
                    />
                  ) : (
                    (currentQuestion.options || []).map((option, idx) => {
                      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                      
                      const isMultiple = currentQuestion.question_type === 'multiple_choice';
                      const currentSelected = selectedAnswers[currentQuestion.id] || '';
                      const selectedArray = currentSelected ? currentSelected.split(',') : [];
                      const isSelected = isMultiple ? selectedArray.includes(option.id) : currentSelected === option.id;

                      const handleOptionClick = () => {
                        if (isMultiple) {
                          if (isSelected) {
                            setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: selectedArray.filter(id => id !== option.id).join(',') }));
                          } else {
                            setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: [...selectedArray, option.id].join(',') }));
                          }
                        } else {
                          handleSelectOption(currentQuestion.id, option.id);
                        }
                      };

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={handleOptionClick}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3.5 ${
                            isSelected ? 'shadow-sm ring-2' : 'hover:border-black/30'
                          }`}
                          style={{
                            backgroundColor: 'var(--quiz-surface)',
                            borderColor: isSelected ? 'var(--quiz-primary)' : 'rgba(0,0,0,0.1)',
                            borderRadius: 'var(--quiz-border-radius)',
                            outlineColor: 'var(--quiz-primary)'
                          }}
                        >
                          <div
                            className={`w-7 h-7 flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
                              isMultiple ? 'rounded-md' : 'rounded-full'
                            }`}
                            style={{
                              backgroundColor: isSelected ? 'var(--quiz-button)' : 'rgba(0,0,0,0.06)',
                              color: isSelected ? '#FFFFFF' : 'var(--quiz-text)'
                            }}
                          >
                            {letters[idx] || idx + 1}
                          </div>
                          <span className="text-sm font-medium flex-1" style={{ color: 'var(--quiz-text)' }}>
                            {option.option_text}
                          </span>
                          
                          {option.option_image && (
                            <img src={option.option_image} alt="Option" className="h-10 rounded object-cover ml-2" />
                          )}

                          {/* In Admin preview, show a subtle correct badge */}
                          {option.is_correct && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                              Correct Answer
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-sm opacity-60">
              No questions in this quiz yet. Add questions in the editor.
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t border-black/10 pt-4">
            <button
              type="button"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg disabled:opacity-30 transition-colors"
              style={{
                backgroundColor: 'rgba(0,0,0,0.05)',
                color: 'var(--quiz-text)'
              }}
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>

            <button
              type="button"
              disabled={currentQuestionIndex >= questions.length - 1}
              onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white rounded-lg shadow-sm disabled:opacity-30 transition-transform active:scale-95"
              style={{
                backgroundColor: 'var(--quiz-button)',
                borderRadius: 'var(--quiz-border-radius)'
              }}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
