'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Trophy, CheckCircle2, ShieldCheck, Heart, Users } from 'lucide-react';

export function QuizHero() {
  const [selectedOption, setSelectedOption] = useState<string>('A');

  return (
    <section className="relative overflow-hidden pt-10 pb-20 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-32">
      {/* Background ambient floating gradients */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[320px] sm:w-[650px] h-[320px] sm:h-[650px] bg-gradient-to-tr from-[#F3D6E1]/70 via-[#D83B70]/15 to-[#A50D52]/5 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />
      <div className="absolute -top-10 -right-10 w-72 h-72 bg-[#D83B70]/10 rounded-full blur-2xl pointer-events-none -z-10 animate-float" />
      <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-[#A50D52]/10 rounded-full blur-2xl pointer-events-none -z-10 animate-float-reverse" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Heading & CTAs */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
            {/* Badges */}
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#F0E1E8] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#A50D52] animate-ping" />
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#6E123D]">
                  Rotaract Club of Mapusa • RI Dist. 3170
                </span>
              </div>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3D6E1]/50 border border-[#D83B70]/20 text-[11px] font-semibold text-[#A50D52]">
                <Heart className="w-3 h-3 text-[#D83B70] fill-current" />
                <span>Built by Atreya</span>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#24141C] uppercase leading-[1.06]">
                QUIZ<span className="bg-clip-text text-transparent bg-gradient-to-r from-[#A50D52] via-[#D83B70] to-[#6E123D]">MANIA</span>
              </h1>
              <p className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-[#A50D52] tracking-tight">
                Think Fast. Learn More. Compete Together.
              </p>
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base lg:text-lg text-[#6B5A62] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              The official interactive quiz platform by the <span className="font-semibold text-[#24141C]">Rotaract Club of Mapusa</span>. Test your knowledge, participate in club events, and challenge peers across Goa and beyond.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link
                href="#featured-quizzes"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#A50D52] to-[#6E123D] hover:from-[#D83B70] hover:to-[#A50D52] text-white font-bold text-sm h-13 px-8 rounded-2xl shadow-lg shadow-[#A50D52]/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span>Explore Live Quizzes</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="#rotaract"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-[#FAF8F9] text-[#24141C] border border-[#F0E1E8] font-semibold text-sm h-13 px-7 rounded-2xl shadow-xs hover:border-[#D83B70]/40 transition-all"
              >
                <Users className="w-4 h-4 text-[#A50D52]" />
                <span>About Our Club</span>
              </Link>
            </div>

            {/* Micro Highlights */}
            <div className="pt-6 border-t border-[#F0E1E8]/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8 text-xs text-[#6B5A62]">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#D83B70] flex-shrink-0" />
                <span className="font-medium">Live Club Competitions</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#A50D52] flex-shrink-0" />
                <span className="font-medium">Instant Fair Scoring</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#6E123D] flex-shrink-0" />
                <span className="font-medium">Goa & District 3170</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Quiz Mockup */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="w-full max-w-sm sm:max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-[#F0E1E8] p-6 sm:p-8 shadow-xl shadow-[#A50D52]/5 space-y-5 animate-float hover:shadow-2xl transition-all duration-500">
              {/* Header inside mockup */}
              <div className="flex items-center justify-between border-b border-[#F0E1E8] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#A50D52] to-[#6E123D] text-white font-black text-sm flex items-center justify-center shadow-xs">
                    Q
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#24141C] block">Rotaract Youth Challenge</span>
                    <span className="text-[11px] text-[#A50D52] font-semibold">Live Interactive Sample</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#F3D6E1]/70 text-[#6E123D] text-[10px] font-bold">
                  5 Marks
                </span>
              </div>

              {/* Question statement */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A50D52]">Tap an answer to preview:</span>
                <h4 className="text-sm sm:text-base font-bold text-[#24141C] leading-snug">
                  What is the primary motto of Rotary and Rotaract worldwide?
                </h4>
              </div>

              {/* Interactive simulated options */}
              <div className="space-y-2.5">
                {[
                  { id: 'A', text: 'Service Above Self', correct: true },
                  { id: 'B', text: 'Leadership in Motion', correct: false },
                  { id: 'C', text: 'Youth of Tomorrow', correct: false }
                ].map(opt => {
                  const isSelected = selectedOption === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedOption(opt.id)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between min-h-[48px] ${
                        isSelected
                          ? 'border-[#A50D52] bg-[#F3D6E1]/30 shadow-xs ring-1 ring-[#A50D52]/50'
                          : 'border-[#F0E1E8] bg-white hover:border-black/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#A50D52] text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span className={`text-xs font-semibold ${isSelected ? 'text-[#6E123D]' : 'text-[#24141C]'}`}>
                          {opt.text}
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#A50D52] flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[11px] text-[#6B5A62] mb-1.5 font-medium">
                  <span>Interactive Runner</span>
                  <span className="text-[#A50D52] font-semibold">100% Ready</span>
                </div>
                <div className="w-full h-1.5 bg-[#F0E1E8] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#A50D52] to-[#D83B70] w-full rounded-full transition-all duration-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
