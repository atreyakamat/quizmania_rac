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
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Trophy, 
  Check,
  Calendar,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';

type FlowStep = 'landing' | 'participant' | 'questions' | 'review' | 'completion';

export function QuizRunner({ quiz }: { quiz: PublicQuiz }) {
  const [step, setStep] = useState<FlowStep>('landing');
  const [participant, setParticipant] = useState<ParticipantInfo>({
    name: '',
    email: '',
    club_name: '',
    district_number: '3170',
    position: ''
  });
  const [participantError, setParticipantError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);

  const themeVars = getThemeCssVariables(quiz.theme) as React.CSSProperties;
  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (step === 'completion' && result?.passed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Fallback
      }
    }
  }, [step, result]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleParticipantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participant.name.trim()) {
      setParticipantError('Please enter your full name');
      return;
    }
    if (!participant.email?.trim()) {
      setParticipantError('Please enter your email address');
      return;
    }
    if (!participant.club_name?.trim()) {
      setParticipantError('Please enter your Rotaract Club Name');
      return;
    }
    if (!participant.district_number?.trim()) {
      setParticipantError('Please enter your Rotary / Rotaract District Number');
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
    <div style={themeVars} className="min-h-[85vh] py-8 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto">
        {/* ==================================================================== */}
        {/* STEP 1: LANDING PAGE */}
        {/* ==================================================================== */}
        {step === 'landing' && (
          <div
            className="rounded-3xl border border-black/10 overflow-hidden shadow-xl bg-white"
            style={{
              backgroundColor: 'var(--quiz-surface)',
              borderRadius: 'var(--quiz-border-radius)',
              color: 'var(--quiz-text)',
              fontFamily: 'var(--quiz-font-family)'
            }}
          >
            {quiz.cover_image && (
              <div className="h-52 sm:h-72 w-full overflow-hidden relative">
                <img src={quiz.cover_image} alt={quiz.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-white">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/25 backdrop-blur-md border border-white/20">
                    Rotaract Club of Mapusa • RI District 3170
                  </span>
                </div>
              </div>
            )}

            <div className="p-6 sm:p-10 space-y-6">
              <div className="space-y-2.5">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--quiz-primary)' }}>
                  {quiz.title}
                </h1>
                {quiz.description && (
                  <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
                    {quiz.description}
                  </p>
                )}
              </div>

              {/* Event Details Notice */}
              <div className="p-4 rounded-2xl border border-black/10 space-y-2 text-xs" style={{ backgroundColor: 'var(--quiz-background)' }}>
                <div className="flex items-center gap-2 font-bold" style={{ color: 'var(--quiz-primary)' }}>
                  <Calendar className="w-4 h-4 text-[#D83B70]" />
                  <span>Submission Period: 4th September 2026 – 7th September 2026</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] opacity-80">
                  <Users className="w-4 h-4 text-[#A50D52]" />
                  <span>Collaboration Recognition: Minimum 3 members per club required.</span>
                </div>
              </div>

              {/* Stats pill row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl border border-black/5" style={{ backgroundColor: 'var(--quiz-background)' }}>
                  <span className="text-[11px] font-semibold opacity-60 block">Questions</span>
                  <span className="text-lg font-black" style={{ color: 'var(--quiz-primary)' }}>
                    {quiz.totalQuestions}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-black/5" style={{ backgroundColor: 'var(--quiz-background)' }}>
                  <span className="text-[11px] font-semibold opacity-60 block">Max Marks</span>
                  <span className="text-lg font-black" style={{ color: 'var(--quiz-primary)' }}>
                    {quiz.totalMarks}
                  </span>
                </div>

                {quiz.settings?.time_limit_minutes && (
                  <div className="p-3.5 rounded-2xl border border-black/5 col-span-2 sm:col-span-1" style={{ backgroundColor: 'var(--quiz-background)' }}>
                    <span className="text-[11px] font-semibold opacity-60 block">Time Limit</span>
                    <span className="text-lg font-black" style={{ color: 'var(--quiz-primary)' }}>
                      {quiz.settings.time_limit_minutes}m
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-black/5">
                <Link
                  href="/quizzes"
                  className="w-full sm:w-auto text-center text-xs font-semibold opacity-70 hover:opacity-100 flex items-center justify-center gap-1.5 py-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Quizzes
                </Link>

                <button
                  type="button"
                  onClick={() => setStep('participant')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-8 rounded-2xl font-bold text-sm text-white shadow-md transition-all active:scale-95"
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
        {/* STEP 2: SECTION 1 - PARTICIPANT DETAILS */}
        {/* ==================================================================== */}
        {step === 'participant' && (
          <div
            className="rounded-3xl border border-black/10 p-6 sm:p-10 shadow-xl bg-white space-y-6"
            style={{
              backgroundColor: 'var(--quiz-surface)',
              borderRadius: 'var(--quiz-border-radius)',
              color: 'var(--quiz-text)',
              fontFamily: 'var(--quiz-font-family)'
            }}
          >
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                Section 1 of 2
              </span>
              <h2 className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--quiz-primary)' }}>
                Participant Details
              </h2>
              <p className="text-xs opacity-75">
                Please provide your details below for club collaboration and certificate issuance.
              </p>
            </div>

            <form onSubmit={handleParticipantSubmit} className="space-y-4">
              {/* 1. Full Name */}
              <div>
                <label className="block text-xs font-semibold mb-1">
                  1. Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={participant.name || ''}
                  onChange={e => setParticipant(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Rahul Naik"
                  className="w-full text-sm border border-black/15 rounded-2xl h-12 px-4 bg-white text-slate-900 focus:outline-none focus:ring-2"
                  style={{ outlineColor: 'var(--quiz-primary)' }}
                />
              </div>

              {/* 2. Email Address */}
              <div>
                <label className="block text-xs font-semibold mb-1">
                  2. Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={participant.email ?? ''}
                  onChange={e => setParticipant(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. rahul@example.com"
                  className="w-full text-sm border border-black/15 rounded-2xl h-12 px-4 bg-white text-slate-900 focus:outline-none focus:ring-2"
                  style={{ outlineColor: 'var(--quiz-primary)' }}
                />
              </div>

              {/* 3. Rotaract Club Name */}
              <div>
                <label className="block text-xs font-semibold mb-1">
                  3. Rotaract Club Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={participant.club_name ?? ''}
                  onChange={e => setParticipant(prev => ({ ...prev, club_name: e.target.value }))}
                  placeholder="e.g. Rotaract Club of Mapusa"
                  className="w-full text-sm border border-black/15 rounded-2xl h-12 px-4 bg-white text-slate-900 focus:outline-none focus:ring-2"
                  style={{ outlineColor: 'var(--quiz-primary)' }}
                />
              </div>

              {/* 4. Rotary / Rotaract District Number */}
              <div>
                <label className="block text-xs font-semibold mb-1">
                  4. Rotary / Rotaract District Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={participant.district_number ?? ''}
                  onChange={e => setParticipant(prev => ({ ...prev, district_number: e.target.value }))}
                  placeholder="e.g. 3170"
                  className="w-full text-sm border border-black/15 rounded-2xl h-12 px-4 bg-white text-slate-900 focus:outline-none focus:ring-2"
                  style={{ outlineColor: 'var(--quiz-primary)' }}
                />
              </div>

              {/* 5. Position in the Club */}
              <div>
                <label className="block text-xs font-semibold mb-1">
                  5. Position in the Club <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={participant.position ?? ''}
                  onChange={e => setParticipant(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="e.g. Member / President / Secretary"
                  className="w-full text-sm border border-black/15 rounded-2xl h-12 px-4 bg-white text-slate-900 focus:outline-none focus:ring-2"
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
                  Back
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-2xl font-bold text-xs text-white shadow-md transition-transform active:scale-95"
                  style={{
                    backgroundColor: 'var(--quiz-button)',
                    borderRadius: 'var(--quiz-border-radius)'
                  }}
                >
                  <span>Proceed to Section 2</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================================================================== */}
        {/* STEP 3: SECTION 2 - QUESTIONS STEPPER */}
        {/* ==================================================================== */}
        {step === 'questions' && currentQuestion && (
          <div
            className="rounded-3xl border border-black/10 overflow-hidden shadow-xl bg-white"
            style={{
              backgroundColor: 'var(--quiz-surface)',
              borderRadius: 'var(--quiz-border-radius)',
              color: 'var(--quiz-text)',
              fontFamily: 'var(--quiz-font-family)'
            }}
          >
            {/* Top Bar / Progress */}
            <div className="p-5 sm:p-6 border-b border-black/5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold tracking-wider uppercase" style={{ color: 'var(--quiz-primary)' }}>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="font-semibold opacity-70">
                  {Object.keys(answers).length} / {questions.length} Answered
                </span>
              </div>

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
            <div className="p-5 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--quiz-secondary)', color: 'var(--quiz-text)' }}>
                  {currentQuestion.marks} Marks
                </span>
                {currentQuestion.required && (
                  <span className="text-xs font-semibold text-rose-500">
                    * Required
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-bold leading-snug">
                {currentQuestion.question_text}
              </h2>

              {currentQuestion.question_image && (
                <div className="rounded-2xl overflow-hidden border border-black/10 max-h-64">
                  <img src={currentQuestion.question_image} alt="Diagram" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Touch-Friendly Options */}
              <div className="space-y-2.5 pt-1">
                {currentQuestion.options.map((option, idx) => {
                  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                  const isSelected = answers[currentQuestion.id] === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                      className={`w-full text-left p-4 sm:p-4.5 rounded-2xl border transition-all flex items-center gap-3.5 min-h-[56px] ${
                        isSelected ? 'ring-2 shadow-xs' : 'hover:border-black/30'
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'var(--quiz-background)' : 'var(--quiz-surface)',
                        borderColor: isSelected ? 'var(--quiz-primary)' : 'rgba(0,0,0,0.12)',
                        borderRadius: 'var(--quiz-border-radius)',
                        outlineColor: 'var(--quiz-primary)'
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors"
                        style={{
                          backgroundColor: isSelected ? 'var(--quiz-button)' : 'rgba(0,0,0,0.06)',
                          color: isSelected ? '#FFFFFF' : 'var(--quiz-text)'
                        }}
                      >
                        {isSelected ? <Check className="w-4 h-4" /> : (letters[idx] || idx + 1)}
                      </div>

                      <span className="text-xs sm:text-sm font-medium flex-1">
                        {option.option_text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 sm:p-6 bg-black/[0.02] border-t border-black/5 flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl text-xs font-semibold opacity-80 hover:opacity-100 disabled:opacity-25"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('review')}
                  className="h-11 px-3.5 rounded-xl text-xs font-semibold border border-black/15 hover:bg-black/5"
                >
                  Review
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="inline-flex items-center gap-1.5 h-11 px-6 rounded-xl font-bold text-xs text-white shadow-xs"
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
                    className="inline-flex items-center gap-1.5 h-11 px-6 rounded-xl font-bold text-xs text-white shadow-xs"
                    style={{
                      backgroundColor: 'var(--quiz-button)',
                      borderRadius: 'var(--quiz-border-radius)'
                    }}
                  >
                    <span>Review All</span>
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
            className="rounded-3xl border border-black/10 p-6 sm:p-10 shadow-xl bg-white space-y-6"
            style={{
              backgroundColor: 'var(--quiz-surface)',
              borderRadius: 'var(--quiz-border-radius)',
              color: 'var(--quiz-text)',
              fontFamily: 'var(--quiz-font-family)'
            }}
          >
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                Final Review
              </span>
              <h2 className="text-2xl font-black" style={{ color: 'var(--quiz-primary)' }}>
                Review Your Answers
              </h2>
              <p className="text-xs opacity-75">
                Check that all 12 questions are answered before submitting. Tap any question to make changes.
              </p>
            </div>

            {unansweredRequiredCount > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  {unansweredRequiredCount} question(s) left unanswered.
                </span>
              </div>
            )}

            {/* Questions Checklist */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
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
                    className="p-3.5 rounded-2xl border border-black/10 hover:border-black/25 cursor-pointer transition-all flex items-center justify-between gap-3"
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
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          Required
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
                className="inline-flex items-center gap-2 h-12 px-7 rounded-2xl font-bold text-xs text-white shadow-md transition-all disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--quiz-button)',
                  borderRadius: 'var(--quiz-border-radius)'
                }}
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Evaluating Score...' : 'Submit Quiz'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* STEP 5: COMPLETION / SCORE REPORT */}
        {/* ==================================================================== */}
        {step === 'completion' && result && (
          <div
            className="rounded-3xl border border-black/10 p-6 sm:p-12 text-center shadow-2xl bg-white space-y-6"
            style={{
              backgroundColor: 'var(--quiz-surface)',
              borderRadius: 'var(--quiz-border-radius)',
              color: 'var(--quiz-text)',
              fontFamily: 'var(--quiz-font-family)'
            }}
          >
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-md" style={{ backgroundColor: 'var(--quiz-secondary)' }}>
              <Trophy className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--quiz-primary)' }}>
                Thank You, {participant.name}!
              </h2>
              <p className="text-xs sm:text-sm opacity-80 max-w-sm mx-auto">
                {participant.club_name ? `${participant.club_name} • District ${participant.district_number || '3170'}` : 'Rotaract Club of Mapusa'}
              </p>
            </div>

            {/* Score Box */}
            <div className="p-6 rounded-2xl border border-black/5 max-w-sm mx-auto space-y-2" style={{ backgroundColor: 'var(--quiz-background)' }}>
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                Your Final Score
              </div>
              <div className="text-4xl sm:text-5xl font-black" style={{ color: 'var(--quiz-primary)' }}>
                {result.score} <span className="text-xl font-bold opacity-60">/ {result.totalPossibleMarks}</span>
              </div>
              <div className="text-xs font-semibold opacity-75">
                {result.percentage}% Accuracy
              </div>
            </div>

            <div className="text-[11px] opacity-50 font-mono">
              Submission ID: {result.submissionId}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/quizzes"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl font-bold text-xs text-white shadow-md"
                style={{
                  backgroundColor: 'var(--quiz-button)',
                  borderRadius: 'var(--quiz-border-radius)'
                }}
              >
                <span>Explore Other Quizzes</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-6 rounded-2xl font-semibold text-xs border border-black/15 hover:bg-black/5"
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
