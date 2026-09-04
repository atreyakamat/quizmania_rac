'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { PublicQuiz, ParticipantInfo, SelectedAnswer, QuizSubmissionResult } from '@quizmania/types';
import { getThemeCssVariables } from '@quizmania/shared';
import { 
  ArrowLeft, 
  ArrowRight, 
  Award, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Sparkles,
  Trophy,
  RotateCcw,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

type FlowStep = 'landing' | 'participant' | 'questions' | 'review' | 'completion';

export function QuizRunner({ quiz }: { quiz: PublicQuiz }) {
  const [step, setStep] = useState<FlowStep>('landing');
  const [participant, setParticipant] = useState<ParticipantInfo>({ name: '', email: '' });
  const [participantError, setParticipantError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);

  // Dynamic Theme CSS variables for this quiz
  const themeVars = getThemeCssVariables(quiz.theme) as React.CSSProperties;

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  // Fire confetti upon successful completion
  useEffect(() => {
    if (step === 'completion' && result?.passed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback if canvas is unavailable
      }
    }
  }, [step, result]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleStartQuiz = () => {
    setStep('participant');
  };

  const handleParticipantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participant.name.trim()) {
      setParticipantError('Please enter your name to proceed');
      return;
    }
    if (quiz.settings?.require_participant_email && !participant.email?.trim()) {
      setParticipantError('Email is required for this competition');
      return;
    }
    setParticipantError(null);
    setStep('questions');
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const formattedAnswers: SelectedAnswer[] = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
      questionId,
      selectedOptionId
    }));

    try {
      const res = await fetch(`/api/quizzes/${quiz.slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant,
          answers: formattedAnswers
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.result) {
        setResult(data.result);
        setStep('completion');
      } else {
        setSubmitError(data.error || 'Failed to submit quiz. Please try again.');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Network error while submitting quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const unansweredRequiredCount = questions.filter(q => q.required && !answers[q.id]).length;

  return (
    <div style={themeVars} className="min-h-[80vh] py-10 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-3xl mx-auto">
        {/* ==================================================================== */}
        {/* STEP 1: LANDING PAGE */}
        {/* ==================================================================== */}
        {step === 'landing' && (
          <div
            className="rounded-3xl border border-black/10 overflow-hidden shadow-xl"
            style={{
              backgroundColor: 'var(--quiz-surface)',
              borderRadius: 'var(--quiz-border-radius)',
              color: 'var(--quiz-text)',
              fontFamily: 'var(--quiz-font-family)'
            }}
          >
            {quiz.cover_image && (
              <div className="h-64 sm:h-80 w-full overflow-hidden relative">
                <img src={quiz.cover_image} alt={quiz.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-6 right-6 text-white">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                    Rotaract Club of Mapusa
                  </span>
                </div>
              </div>
            )}

            <div className="p-8 sm:p-12 space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: 'var(--quiz-primary)' }}>
                  {quiz.title}
                </h1>
                {quiz.description && (
                  <p className="text-sm sm:text-base opacity-85 leading-relaxed">
                    {quiz.description}
                  </p>
                )}
              </div>

              {/* Quiz Stats Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-black/5">
                <div className="p-4 rounded-xl border border-black/5" style={{ backgroundColor: 'var(--quiz-background)' }}>
                  <span className="text-[11px] font-semibold opacity-70 block">Total Questions</span>
                  <span className="text-xl font-black" style={{ color: 'var(--quiz-primary)' }}>
                    {quiz.totalQuestions}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-black/5" style={{ backgroundColor: 'var(--quiz-background)' }}>
                  <span className="text-[11px] font-semibold opacity-70 block">Total Marks</span>
                  <span className="text-xl font-black" style={{ color: 'var(--quiz-primary)' }}>
                    {quiz.totalMarks}
                  </span>
                </div>

                {quiz.settings?.time_limit_minutes && (
                  <div className="p-4 rounded-xl border border-black/5 col-span-2 sm:col-span-1" style={{ backgroundColor: 'var(--quiz-background)' }}>
                    <span className="text-[11px] font-semibold opacity-70 block">Time Limit</span>
                    <span className="text-xl font-black" style={{ color: 'var(--quiz-primary)' }}>
                      {quiz.settings.time_limit_minutes} mins
                    </span>
                  </div>
                )}
              </div>

              {/* Start Button */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link
                  href="/quizzes"
                  className="text-xs font-semibold opacity-75 hover:opacity-100 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Quizzes
                </Link>

                <button
                  type="button"
                  onClick={handleStartQuiz}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-md transition-transform active:scale-95"
                  style={{
                    backgroundColor: 'var(--quiz-button)',
                    borderRadius: 'var(--quiz-border-radius)'
                  }}
                >
                  <span>Begin Quiz</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* STEP 2: PARTICIPANT INFORMATION */}
        {/* ==================================================================== */}
        {step === 'participant' && (
          <div
            className="rounded-3xl border border-black/10 p-8 sm:p-12 shadow-xl space-y-6"
            style={{
              backgroundColor: 'var(--quiz-surface)',
              borderRadius: 'var(--quiz-border-radius)',
              color: 'var(--quiz-text)',
              fontFamily: 'var(--quiz-font-family)'
            }}
          >
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                Step 1 of 3: Participant Profile
              </span>
              <h2 className="text-2xl font-black" style={{ color: 'var(--quiz-primary)' }}>
                Enter Your Information
              </h2>
              <p className="text-xs opacity-75">
                Your name will be associated with your score on the Rotaract Club of Mapusa leaderboard.
              </p>
            </div>

            <form onSubmit={handleParticipantSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={participant.name}
                  onChange={e => setParticipant(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Rahul Naik"
                  className="w-full text-sm border border-black/15 rounded-xl p-3.5 bg-white text-slate-900 focus:outline-none focus:ring-2"
                  style={{ outlineColor: 'var(--quiz-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Email Address {quiz.settings?.require_participant_email && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="email"
                  required={quiz.settings?.require_participant_email}
                  value={participant.email}
                  onChange={e => setParticipant(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. rahul@example.com"
                  className="w-full text-sm border border-black/15 rounded-xl p-3.5 bg-white text-slate-900 focus:outline-none focus:ring-2"
                  style={{ outlineColor: 'var(--quiz-primary)' }}
                />
              </div>

              {participantError && (
                <p className="text-xs text-rose-500 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {participantError}
                </p>
              )}

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('landing')}
                  className="text-xs font-semibold opacity-70 hover:opacity-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-xs text-white shadow-md transition-transform active:scale-95"
                  style={{
                    backgroundColor: 'var(--quiz-button)',
                    borderRadius: 'var(--quiz-border-radius)'
                  }}
                >
                  <span>Continue to Questions</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================================================================== */}
        {/* STEP 3: QUESTIONS FLOW */}
        {/* ==================================================================== */}
        {step === 'questions' && currentQuestion && (
          <div
            className="rounded-3xl border border-black/10 overflow-hidden shadow-xl"
            style={{
              backgroundColor: 'var(--quiz-surface)',
              borderRadius: 'var(--quiz-border-radius)',
              color: 'var(--quiz-text)',
              fontFamily: 'var(--quiz-font-family)'
            }}
          >
            {/* Header / Progress Bar */}
            <div className="p-6 sm:p-8 border-b border-black/5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold tracking-wider uppercase" style={{ color: 'var(--quiz-primary)' }}>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="font-medium opacity-70">
                  {Object.keys(answers).length} of {questions.length} Answered
                </span>
              </div>

              {/* Progress track */}
              <div className="w-full h-2 rounded-full overflow-hidden bg-black/5">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    backgroundColor: 'var(--quiz-primary)',
                    width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Question Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--quiz-secondary)', color: 'var(--quiz-text)' }}>
                  {currentQuestion.marks} Marks
                </span>

                {currentQuestion.required && (
                  <span className="text-xs font-semibold text-rose-500">
                    * Required
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold leading-snug">
                {currentQuestion.question_text}
              </h2>

              {currentQuestion.question_image && (
                <div className="rounded-xl overflow-hidden border border-black/10 max-h-72">
                  <img src={currentQuestion.question_image} alt="Question illustration" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Options */}
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((option, idx) => {
                  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                  const isSelected = answers[currentQuestion.id] === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                        isSelected ? 'shadow-sm ring-2' : 'hover:border-black/30'
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'var(--quiz-background)' : 'var(--quiz-surface)',
                        borderColor: isSelected ? 'var(--quiz-primary)' : 'rgba(0,0,0,0.12)',
                        borderRadius: 'var(--quiz-border-radius)',
                        outlineColor: 'var(--quiz-primary)'
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors"
                        style={{
                          backgroundColor: isSelected ? 'var(--quiz-button)' : 'rgba(0,0,0,0.06)',
                          color: isSelected ? '#FFFFFF' : 'var(--quiz-text)'
                        }}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : (letters[idx] || idx + 1)}
                      </div>

                      <span className="text-sm font-medium flex-1">
                        {option.option_text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="p-6 sm:p-8 bg-black/[0.02] border-t border-black/5 flex items-center justify-between">
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold opacity-80 hover:opacity-100 disabled:opacity-30 transition-opacity"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('review')}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-black/15 hover:bg-black/5 transition-colors"
                >
                  Review All
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs transition-transform active:scale-95"
                    style={{
                      backgroundColor: 'var(--quiz-button)',
                      borderRadius: 'var(--quiz-border-radius)'
                    }}
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep('review')}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs transition-transform active:scale-95"
                    style={{
                      backgroundColor: 'var(--quiz-button)',
                      borderRadius: 'var(--quiz-border-radius)'
                    }}
                  >
                    <span>Review & Submit</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* STEP 4: REVIEW ANSWERS */}
        {/* ==================================================================== */}
        {step === 'review' && (
          <div
            className="rounded-3xl border border-black/10 p-8 sm:p-12 shadow-xl space-y-8"
            style={{
              backgroundColor: 'var(--quiz-surface)',
              borderRadius: 'var(--quiz-border-radius)',
              color: 'var(--quiz-text)',
              fontFamily: 'var(--quiz-font-family)'
            }}
          >
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                Step 3 of 3: Final Verification
              </span>
              <h2 className="text-2xl font-black" style={{ color: 'var(--quiz-primary)' }}>
                Review Your Answers
              </h2>
              <p className="text-xs opacity-75">
                Check that all questions are answered. Click on any question to modify your selection.
              </p>
            </div>

            {/* Warning if required question is missing */}
            {unansweredRequiredCount > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  You have {unansweredRequiredCount} required question(s) left unanswered. Please answer them before submitting.
                </span>
              </div>
            )}

            {/* Questions Matrix */}
            <div className="space-y-3">
              {questions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]);
                const selectedOptId = answers[q.id];
                const selectedOpt = q.options.find(o => o.id === selectedOptId);

                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      setStep('questions');
                    }}
                    className="p-4 rounded-xl border border-black/10 hover:border-black/25 cursor-pointer transition-all flex items-center justify-between gap-4"
                    style={{ backgroundColor: 'var(--quiz-background)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        isAnswered ? 'bg-emerald-600' : 'bg-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold line-clamp-1">{q.question_text}</h4>
                        <span className="text-[11px] opacity-70">
                          {isAnswered ? `Selected: ${selectedOpt?.option_text}` : 'Not answered yet'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isAnswered ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Answered
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          {q.required ? 'Required' : 'Skipped'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {submitError && (
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                {submitError}
              </p>
            )}

            {/* Final Action Bar */}
            <div className="pt-4 border-t border-black/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('questions')}
                className="text-xs font-semibold opacity-70 hover:opacity-100 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to Questions
              </button>

              <button
                type="button"
                disabled={isSubmitting || unansweredRequiredCount > 0}
                onClick={handleFinalSubmit}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-xs text-white shadow-lg transition-all disabled:opacity-40 active:scale-95"
                style={{
                  backgroundColor: 'var(--quiz-button)',
                  borderRadius: 'var(--quiz-border-radius)'
                }}
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Scoring & Submitting...' : 'Submit Quiz'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* STEP 5: COMPLETION / RESULT */}
        {/* ==================================================================== */}
        {step === 'completion' && result && (
          <div
            className="rounded-3xl border border-black/10 p-8 sm:p-14 text-center shadow-2xl space-y-8 animate-in zoom-in-95 duration-300"
            style={{
              backgroundColor: 'var(--quiz-surface)',
              borderRadius: 'var(--quiz-border-radius)',
              color: 'var(--quiz-text)',
              fontFamily: 'var(--quiz-font-family)'
            }}
          >
            {/* Trophy icon */}
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--quiz-secondary)' }}>
              <Trophy className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-widest opacity-70">
                Quiz Submitted Successfully
              </span>
              <h2 className="text-3xl sm:text-4xl font-black" style={{ color: 'var(--quiz-primary)' }}>
                Thank You, {participant.name}!
              </h2>
              <p className="text-sm opacity-80 max-w-md mx-auto">
                {result.feedbackMessage || 'Your answers have been securely evaluated.'}
              </p>
            </div>

            {/* Score card */}
            <div className="p-8 rounded-2xl border border-black/5 max-w-md mx-auto space-y-4" style={{ backgroundColor: 'var(--quiz-background)' }}>
              <div className="text-xs font-bold uppercase tracking-wider opacity-70">
                Your Final Score
              </div>
              <div className="text-5xl font-black" style={{ color: 'var(--quiz-primary)' }}>
                {result.score} <span className="text-2xl font-bold opacity-60">/ {result.totalPossibleMarks}</span>
              </div>
              <div className="text-sm font-semibold opacity-75">
                {result.percentage}% Accuracy
              </div>
              {result.passed !== undefined && (
                <div className="pt-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    result.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {result.passed ? 'Qualified / Passed' : 'Completed'}
                  </span>
                </div>
              )}
            </div>

            <div className="text-[11px] opacity-60 font-mono">
              Submission Reference: {result.submissionId}
            </div>

            {/* Action buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/quizzes"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white shadow-md transition-transform active:scale-95"
                style={{
                  backgroundColor: 'var(--quiz-button)',
                  borderRadius: 'var(--quiz-border-radius)'
                }}
              >
                <span>Explore More Quizzes</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-xs border border-black/15 hover:bg-black/5 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
