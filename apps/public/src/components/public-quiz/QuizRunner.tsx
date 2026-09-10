'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import type { 
  PublicQuiz, 
  PublicQuestion, 
  ParticipantInfo, 
  SelectedAnswer, 
  QuizSubmissionResult,
  QuizAvailability
} from '@quizmania/types';
import { getThemeCssVariables } from '@quizmania/shared';
import { shuffleArray } from '@quizmania/quiz-schema';
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
  Users, 
  FolderPlus,
  HelpCircle,
  Sparkles,
  Timer,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

type FlowStep = 'landing' | 'participant' | 'instructions' | 'questions' | 'review' | 'completion';

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
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Question & Answers state
  const rawQuestions = useMemo(() => quiz.questions || [], [quiz.questions]);
  const [processedQuestions, setProcessedQuestions] = useState<PublicQuestion[]>(rawQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Flexible Answers State:
  // single_choice / true_false: single option ID string
  // multiple_choice: array of option ID strings
  // short_answer / paragraph: string
  const [singleAnswers, setSingleAnswers] = useState<Record<string, string>>({});
  const [multiAnswers, setMultiAnswers] = useState<Record<string, string[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);

  // Timer state (in seconds)
  const isTimerEnabled = quiz.settings?.features?.timer !== false && Boolean(quiz.settings?.time_limit_minutes && quiz.settings.time_limit_minutes > 0);
  const totalDurationMinutes = isTimerEnabled ? quiz.settings?.time_limit_minutes : null;
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(
    totalDurationMinutes ? totalDurationMinutes * 60 : null
  );
  const [serverExpiresAt, setServerExpiresAt] = useState<string | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);

  // Availability & schedule state
  const [currentAvailability, setCurrentAvailability] = useState<QuizAvailability>(
    quiz.availability || { status: 'live', isAvailable: true }
  );

  const [upcomingSecondsRemaining, setUpcomingSecondsRemaining] = useState<number | null>(() => {
    if (quiz.availability?.status === 'upcoming' && quiz.availability.startsAt) {
      const diff = new Date(quiz.availability.startsAt).getTime() - Date.now();
      return diff > 0 ? Math.ceil(diff / 1000) : 0;
    }
    return null;
  });

  // Check if upcoming countdown reached 0 and auto-fetch from server
  useEffect(() => {
    if (currentAvailability.status !== 'upcoming') return;

    const timer = setInterval(() => {
      if (!currentAvailability.startsAt) return;
      const diff = Math.ceil((new Date(currentAvailability.startsAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setUpcomingSecondsRemaining(0);
        clearInterval(timer);
        // Authoritative server fetch on transition
        fetch(`/api/quizzes/${quiz.slug}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.quiz?.availability) {
              setCurrentAvailability(data.quiz.availability);
            }
          })
          .catch(e => console.error("Error fetching updated quiz status", e));
      } else {
        setUpcomingSecondsRemaining(diff);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentAvailability, quiz.slug]);

  const formatUpcomingCountdown = (totalSecs: number) => {
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${mins}m ${secs}s`;
    }
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const themeVars = getThemeCssVariables(quiz.theme) as React.CSSProperties;
  const currentQuestion = processedQuestions[currentQuestionIndex];

  // Confetti on success
  useEffect(() => {
    if (step === 'completion' && result?.passed) {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Fallback
      }
    }
  }, [step, result]);

  // Handle Overall Quiz Countdown Timer
  useEffect(() => {
    if (step !== 'questions' && step !== 'review') return;
    if (secondsRemaining === null) return;

    if (secondsRemaining <= 0) {
      setTimerExpired(true);
      if (quiz.settings?.auto_submit_on_expire ?? true) {
        handleFinalSubmit();
      }
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, secondsRemaining]);

  // Initialize & Randomize Questions when proceeding from participant form
  // Classification: NON-SECURITY-SENSITIVE
  // Purpose: Cosmetic UI presentation ordering of questions/options for participants.
  // Preserves stable question and option IDs; authoritative server-side scoring is unaffected.
  const startQuizQuestions = async () => {
    let list = [...rawQuestions];
    if (quiz.settings?.shuffle_questions) {
      list = shuffleArray(list);
    }
    if (quiz.settings?.shuffle_options) {
      list = list.map(q => {
        if (q.options && q.options.length > 0 && q.question_type !== 'true_false') {
          return { ...q, options: shuffleArray(q.options) };
        }
        return q;
      });
    }
    setProcessedQuestions(list);
    setCurrentQuestionIndex(0);

    // Call start API
    try {
      const res = await fetch(`/api/quizzes/${quiz.slug}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          sessionToken,
          participant_name: participant.name,
          participant_email: participant.email,
          participant_data: participant
        })
      });
      const data = await res.json();
      if (res.status === 409) {
        setParticipantError(data.message || 'This quiz has not started yet.');
        return;
      }
      if (res.status === 410) {
        setParticipantError(data.message || 'This quiz has expired.');
        return;
      }
      if (!res.ok || !data.success) {
        setParticipantError(data.error || 'Failed to start quiz attempt.');
        return;
      }

      setSessionToken(data.sessionToken);
      setAttemptId(data.attemptId);
      if (data.expiresAt) {
        setServerExpiresAt(data.expiresAt);
        const expires = new Date(data.expiresAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expires - now) / 1000));
        setSecondsRemaining(remaining);
      }
    } catch (e) {
      console.error("Failed to start attempt", e);
      setParticipantError("Network error starting attempt. Please try again.");
      return;
    }
    
    if ((quiz.settings as any)?.instructions) {
      setStep('instructions');
    } else {
      setStep('questions');
    }
  };

  
  // Attempt restore on mount
  useEffect(() => {
    try {
      const activeAttemptId = sessionStorage.getItem(`quiz_active_attempt_${quiz.id}`);
      if (activeAttemptId) {
        const savedStateStr = sessionStorage.getItem(`quiz_attempt_${activeAttemptId}`);
        if (savedStateStr) {
          const savedState = JSON.parse(savedStateStr);
          // Check expiresAt if available
          if (!savedState.expiresAt || new Date(savedState.expiresAt).getTime() > Date.now()) {
            setAttemptId(savedState.attemptId);
            setSessionToken(savedState.sessionToken);
            if (savedState.singleAnswers) setSingleAnswers(savedState.singleAnswers);
            if (savedState.multiAnswers) setMultiAnswers(savedState.multiAnswers);
            if (savedState.textAnswers) setTextAnswers(savedState.textAnswers);
            
            // set timer
            if (savedState.expiresAt) {
               setServerExpiresAt(savedState.expiresAt);
               const remaining = Math.max(0, Math.floor((new Date(savedState.expiresAt).getTime() - Date.now()) / 1000));
               setSecondsRemaining(remaining);
            }
            
            // Skip participant step
            setStep('questions');
          }
        }
      }
    } catch (e) {
      console.error('Failed to restore session', e);
    }
  }, [quiz.id]);

  // Auto-save to session storage
  useEffect(() => {
    if (!attemptId) return;
    
    const saveState = { singleAnswers, multiAnswers, textAnswers, attemptId, sessionToken, expiresAt: serverExpiresAt };
    sessionStorage.setItem(`quiz_attempt_${attemptId}`, JSON.stringify(saveState));
    sessionStorage.setItem(`quiz_active_attempt_${quiz.id}`, attemptId);

  }, [singleAnswers, multiAnswers, textAnswers, attemptId, serverExpiresAt]);

  // Option selection handlers
  const handleSelectSingleOption = (questionId: string, optionId: string) => {
    setSingleAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleToggleMultiOption = (questionId: string, optionId: string) => {
    setMultiAnswers(prev => {
      const current = prev[questionId] || [];
      const exists = current.includes(optionId);
      const updated = exists ? current.filter(id => id !== optionId) : [...current, optionId];
      return { ...prev, [questionId]: updated };
    });
  };

  const handleTextAnswerChange = (questionId: string, text: string) => {
    setTextAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const handleParticipantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participant.name.trim()) {
      setParticipantError('Please enter your full name');
      return;
    }
    if (quiz.settings?.require_participant_email && !participant.email?.trim()) {
      setParticipantError('Please enter your email address');
      return;
    }
    if (quiz.settings?.collect_club_details && !participant.club_name?.trim()) {
      setParticipantError('Please enter your Rotaract Club Name');
      return;
    }
    setParticipantError(null);
    await startQuizQuestions();
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    // Build unified SelectedAnswer payload
    const formattedAnswers: SelectedAnswer[] = processedQuestions.map(q => {
      if (q.question_type === 'multiple_choice') {
        return {
          questionId: q.id,
          selectedOptionIds: multiAnswers[q.id] || []
        };
      }
      if (q.question_type === 'short_text' || q.question_type === 'short_answer' || q.question_type === 'text_answer' || q.question_type === 'paragraph') {
        return {
          questionId: q.id,
          textAnswer: textAnswers[q.id] || ''
        };
      }
      return {
        questionId: q.id,
        selectedOptionId: singleAnswers[q.id] || null
      };
    });

    try {
      const res = await fetch(`/api/quizzes/${quiz.slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attemptId || undefined,
          sessionToken: sessionToken || undefined,
          participant,
          answers: formattedAnswers
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.result) {
        setResult(data.result);
        setStep('completion');
        try {
          if (attemptId) {
            sessionStorage.removeItem(`quiz_attempt_${attemptId}`);
            sessionStorage.removeItem(`quiz_active_attempt_${quiz.id}`);
          }
        } catch (e) {
          // Ignore storage errors
        }
      } else {
        setSubmitError(data.error || 'Failed to submit quiz. Please try again.');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Network error while submitting quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if a question has been answered
  const isQuestionAnswered = (q: PublicQuestion) => {
    if (q.question_type === 'multiple_choice') {
      return (multiAnswers[q.id] || []).length > 0;
    }
    if (q.question_type === 'short_text' || q.question_type === 'short_answer' || q.question_type === 'text_answer' || q.question_type === 'paragraph') {
      return Boolean(textAnswers[q.id]?.trim());
    }
    return Boolean(singleAnswers[q.id]);
  };

  const answeredCount = processedQuestions.filter(isQuestionAnswered).length;
  const unansweredRequiredCount = processedQuestions.filter(q => q.required && !isQuestionAnswered(q)).length;

  // Format MM:SS for countdown timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={themeVars} className="min-h-[85vh] py-8 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto space-y-4">
        
        {/* ==================================================================== */}
        {/* TOP STICKY TIMER & PROGRESS BAR (During questions or review) */}
        {/* ==================================================================== */}
        {(step === 'questions' || step === 'review') && secondsRemaining !== null && (
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-black/10 px-4 py-2.5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{quiz.title}</span>
            </div>

            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold ${
              secondsRemaining < 60 
                ? 'bg-rose-100 text-rose-700 animate-pulse' 
                : 'bg-slate-100 text-slate-800'
            }`}>
              <Clock className="w-3.5 h-3.5 text-[#A50D52]" />
              <span>{formatTimer(secondsRemaining)} Remaining</span>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* STEP 1: LANDING OVERVIEW */}
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

              {/* Availability Status Banners */}
              {currentAvailability.status === 'upcoming' && (
                <div className="p-5 rounded-2xl border border-amber-300 bg-amber-50 text-amber-900 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                    <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                    <span>Quiz Coming Soon</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {currentAvailability.startsAt ? (
                      <>
                        This quiz is scheduled to start on <strong>{new Date(currentAvailability.startsAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}</strong> (Your Local Time).
                      </>
                    ) : (
                      <>This quiz has not started yet.</>
                    )}
                  </p>
                  {upcomingSecondsRemaining !== null && upcomingSecondsRemaining > 0 && (
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-xs font-semibold text-amber-800">Starts in:</span>
                      <span className="px-3.5 py-1.5 rounded-xl bg-amber-200/90 font-mono font-bold text-sm text-amber-950 border border-amber-300">
                        {formatUpcomingCountdown(upcomingSecondsRemaining)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {currentAvailability.status === 'expired' && (
                <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <span>Quiz Expired</span>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    {currentAvailability.endsAt ? (
                      <>This quiz ended on <strong>{new Date(currentAvailability.endsAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}</strong>.</>
                    ) : (
                      <>This quiz has ended.</>
                    )}
                    {' '}Submissions are closed for this quiz.
                  </p>
                </div>
              )}

              {currentAvailability.status === 'live' && currentAvailability.endsAt && (
                <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-center justify-between text-xs shadow-sm">
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Quiz is Live</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Available until {new Date(currentAvailability.endsAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              )}

              {/* Event Notice */}
              <div className="p-4 rounded-2xl border border-black/10 space-y-2 text-xs" style={{ backgroundColor: 'var(--quiz-background)' }}>
                <div className="flex items-center gap-2 font-bold" style={{ color: 'var(--quiz-primary)' }}>
                  <Calendar className="w-4 h-4 text-[#D83B70]" />
                  <span>Official Rotaract Club of Mapusa Quiz Event</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] opacity-80">
                  <Users className="w-4 h-4 text-[#A50D52]" />
                  <span>Participants are eligible for club certificate & collaboration recognition.</span>
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
                  <span className="text-[11px] font-semibold opacity-60 block">Total Marks</span>
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

                {currentAvailability.status === 'upcoming' ? (
                  <button
                    type="button"
                    disabled
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-8 rounded-2xl font-bold text-sm text-amber-800 bg-amber-100/90 border border-amber-200 cursor-not-allowed shadow-none"
                  >
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Quiz Coming Soon</span>
                  </button>
                ) : currentAvailability.status === 'expired' ? (
                  <button
                    type="button"
                    disabled
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-8 rounded-2xl font-bold text-sm text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed shadow-none"
                  >
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Submissions Closed</span>
                  </button>
                ) : (
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
                )}
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
                Participant Registration
              </span>
              <h2 className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--quiz-primary)' }}>
                Enter Your Details
              </h2>
              <p className="text-xs opacity-75">
                Please enter your details below for event score recording and certificate generation.
              </p>
            </div>

            
            <form onSubmit={handleParticipantSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 opacity-80">
                  1. Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={participant.name || ''}
                  onChange={e => setParticipant(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl border border-black/10 focus:border-black/30 focus:ring-4 focus:ring-black/5 bg-transparent text-sm transition-all"
                  placeholder="Enter your name"
                />
              </div>

              {(quiz.settings?.require_participant_email || (quiz.settings as any)?.require_email) && (
                <div>
                  <label className="block text-xs font-bold mb-1.5 opacity-80">
                    2. Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={participant.email ?? ''}
                    onChange={e => setParticipant(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl border border-black/10 focus:border-black/30 focus:ring-4 focus:ring-black/5 bg-transparent text-sm transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              )}

              {((quiz.settings as any)?.require_phone) && (
                <div>
                  <label className="block text-xs font-bold mb-1.5 opacity-80">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={participant.data?.phone ?? ''}
                    onChange={e => setParticipant(prev => ({ ...prev, data: { ...prev.data, phone: e.target.value } }))}
                    className="w-full h-12 px-4 rounded-xl border border-black/10 focus:border-black/30 focus:ring-4 focus:ring-black/5 bg-transparent text-sm transition-all"
                    placeholder="Enter your phone number"
                  />
                </div>
              )}

              {(quiz.settings?.collect_club_details || (quiz.settings as any)?.require_club) && (
                <div>
                  <label className="block text-xs font-bold mb-1.5 opacity-80">
                    Club/Organization Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={participant.club_name ?? ''}
                    onChange={e => setParticipant(prev => ({ ...prev, club_name: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl border border-black/10 focus:border-black/30 focus:ring-4 focus:ring-black/5 bg-transparent text-sm transition-all"
                    placeholder="Enter club name"
                  />
                </div>
              )}

              {((quiz.settings as any)?.require_district) && (
                <div>
                  <label className="block text-xs font-bold mb-1.5 opacity-80">
                    District Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={participant.district_number ?? ''}
                    onChange={e => setParticipant(prev => ({ ...prev, district_number: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl border border-black/10 focus:border-black/30 focus:ring-4 focus:ring-black/5 bg-transparent text-sm transition-all"
                    placeholder="e.g. 3170"
                  />
                </div>
              )}

              {participantError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {participantError}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl font-bold text-sm text-white shadow-md transition-all hover:opacity-90"
                  style={{ backgroundColor: 'var(--quiz-button)', borderRadius: 'var(--quiz-border-radius)' }}
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

          </div>
        )}

        {/* ==================================================================== */}
        {/* STEP 3: QUESTIONS STEPPER (All Question Types + Image Options) */}
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
            {/* Optional Section Banner */}
            {currentQuestion.section_title && (
              <div className="p-3 sm:px-6 bg-black/[0.03] border-b border-black/5 flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--quiz-primary)' }}>
                <FolderPlus className="w-3.5 h-3.5 text-[#D83B70]" />
                <span>{currentQuestion.section_title}</span>
              </div>
            )}

            {/* Top Bar / Progress */}
            <div className="p-5 sm:p-6 border-b border-black/5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold tracking-wider uppercase" style={{ color: 'var(--quiz-primary)' }}>
                  Question {currentQuestionIndex + 1} of {processedQuestions.length}
                </span>
                <span className="font-semibold opacity-70">
                  {answeredCount} / {processedQuestions.length} Answered
                </span>
              </div>

              <div className="w-full h-2 rounded-full overflow-hidden bg-black/5">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    backgroundColor: 'var(--quiz-primary)',
                    width: `${((currentQuestionIndex + 1) / processedQuestions.length) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Question Body */}
            <div className="p-5 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--quiz-secondary)', color: 'var(--quiz-text)' }}>
                    {currentQuestion.marks} Marks
                  </span>
                  {currentQuestion.negative_marks ? (
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      -{currentQuestion.negative_marks} for wrong
                    </span>
                  ) : null}
                </div>

                {currentQuestion.required && (
                  <span className="text-xs font-semibold text-rose-500">
                    * Required
                  </span>
                )}
              </div>

              {/* Question Statement & Description */}
              <div className="space-y-1.5">
                <h2 className="text-lg sm:text-xl font-bold leading-snug">
                  {currentQuestion.question_text}
                </h2>
                {currentQuestion.question_description && (
                  <p className="text-xs opacity-75 leading-relaxed">
                    {currentQuestion.question_description}
                  </p>
                )}
              </div>

              {/* Attached Question Diagram */}
              {currentQuestion.question_image && (
                <div className="rounded-2xl overflow-hidden border border-black/10 max-h-72">
                  <img src={currentQuestion.question_image} alt="Diagram" className="w-full h-full object-cover" />
                </div>
              )}

              {/* ======================================================== */}
              {/* RENDER QUESTION BY TYPE */}
              {/* ======================================================== */}

              {/* 1. SINGLE CHOICE & TRUE/FALSE */}
              {(currentQuestion.question_type === 'single_choice' || currentQuestion.question_type === 'true_false') && (
                <div className="space-y-2.5 pt-1">
                  {currentQuestion.options.map((option, idx) => {
                    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                    const isSelected = singleAnswers[currentQuestion.id] === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelectSingleOption(currentQuestion.id, option.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3.5 min-h-[56px] ${
                          isSelected ? 'ring-2 shadow-xs' : 'hover:border-black/30'
                        }`}
                        style={{
                          backgroundColor: isSelected ? 'var(--quiz-background)' : 'var(--quiz-surface)',
                          borderColor: isSelected ? 'var(--quiz-primary)' : 'rgba(0,0,0,0.12)',
                          borderRadius: 'var(--quiz-border-radius)'
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

                        {option.option_image && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-black/10 flex-shrink-0">
                            <img src={option.option_image} alt={option.option_text} className="w-full h-full object-cover" />
                          </div>
                        )}

                        <span className="text-xs sm:text-sm font-medium flex-1">
                          {option.option_text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2. MULTIPLE CHOICE (Multiple Correct Checkboxes) */}
              {currentQuestion.question_type === 'multiple_choice' && (
                <div className="space-y-2.5 pt-1">
                  <span className="text-[11px] font-bold text-[#A50D52] block">
                    ☑️ Select all options that apply:
                  </span>
                  {currentQuestion.options.map((option, idx) => {
                    const selectedList = multiAnswers[currentQuestion.id] || [];
                    const isSelected = selectedList.includes(option.id);

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleToggleMultiOption(currentQuestion.id, option.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3.5 min-h-[56px] ${
                          isSelected ? 'ring-2 shadow-xs' : 'hover:border-black/30'
                        }`}
                        style={{
                          backgroundColor: isSelected ? 'var(--quiz-background)' : 'var(--quiz-surface)',
                          borderColor: isSelected ? 'var(--quiz-primary)' : 'rgba(0,0,0,0.12)',
                          borderRadius: 'var(--quiz-border-radius)'
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors"
                          style={{
                            backgroundColor: isSelected ? 'var(--quiz-button)' : 'rgba(0,0,0,0.06)',
                            color: isSelected ? '#FFFFFF' : 'var(--quiz-text)'
                          }}
                        >
                          {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : (idx + 1)}
                        </div>

                        {option.option_image && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-black/10 flex-shrink-0">
                            <img src={option.option_image} alt={option.option_text} className="w-full h-full object-cover" />
                          </div>
                        )}

                        <span className="text-xs sm:text-sm font-medium flex-1">
                          {option.option_text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 3. SHORT TEXT ANSWER */}
              {(currentQuestion.question_type === 'short_answer' || currentQuestion.question_type === 'text_answer' || currentQuestion.question_type === 'short_text') && (
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-semibold opacity-70">
                    Your Short Answer:
                  </label>
                  <input
                    type="text"
                    value={textAnswers[currentQuestion.id] || ''}
                    onChange={e => handleTextAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Type your response here..."
                    className="w-full text-sm border border-black/15 rounded-2xl h-12 px-4 bg-white text-slate-900 focus:outline-none focus:ring-2"
                    style={{ outlineColor: 'var(--quiz-primary)' }}
                  />
                </div>
              )}

              {/* 4. PARAGRAPH RESPONSE */}
              {currentQuestion.question_type === 'paragraph' && (
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-semibold opacity-70">
                    Your Long / Paragraph Response:
                  </label>
                  <textarea
                    rows={4}
                    value={textAnswers[currentQuestion.id] || ''}
                    onChange={e => handleTextAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Type your detailed answer here..."
                    className="w-full text-sm border border-black/15 rounded-2xl p-4 bg-white text-slate-900 focus:outline-none focus:ring-2"
                    style={{ outlineColor: 'var(--quiz-primary)' }}
                  />
                </div>
              )}
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

                {currentQuestionIndex < processedQuestions.length - 1 ? (
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
                Check that all questions are answered before submitting. Tap any question to make changes.
              </p>
            </div>

            {unansweredRequiredCount > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  {unansweredRequiredCount} required question(s) left unanswered.
                </span>
              </div>
            )}

            {/* Questions Checklist */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {processedQuestions.map((q, idx) => {
                const isAnswered = isQuestionAnswered(q);
                let answerSummary = 'Not answered yet';

                if (q.question_type === 'multiple_choice') {
                  const selectedIds = multiAnswers[q.id] || [];
                  answerSummary = selectedIds.length > 0 ? `${selectedIds.length} options selected` : 'Not answered yet';
                } else if (q.question_type === 'short_answer' || q.question_type === 'text_answer' || q.question_type === 'short_text' || q.question_type === 'paragraph') {
                  answerSummary = textAnswers[q.id]?.trim() ? `Entered: "${textAnswers[q.id].substring(0, 30)}..."` : 'Not answered yet';
                } else {
                  const selectedOpt = q.options.find(o => o.id === singleAnswers[q.id]);
                  answerSummary = selectedOpt ? `Selected: ${selectedOpt.option_text}` : 'Not answered yet';
                }

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
                        <span className="text-[11px] opacity-70 block">
                          {answerSummary}
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
