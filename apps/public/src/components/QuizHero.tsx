'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Award, CheckCircle2, HelpCircle, Trophy, Flame } from 'lucide-react';

export function QuizHero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 bg-gradient-to-b from-[#FAF8F9] via-[#FAF8F9] to-[#F3D6E1]/20">
      {/* Subtle background glow spheres */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D83B70]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#A50D52]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Heading & Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F3D6E1]/60 border border-[#D83B70]/30 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#A50D52] animate-pulse" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#6E123D]">
                ROTARACT CLUB OF MAPUSA PRESENTS
              </span>
            </div>

            {/* Main Title */}
            <div className="space-y-2">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#24141C] uppercase leading-[1.05]">
                QUIZ<span className="bg-clip-text text-transparent bg-gradient-to-r from-[#A50D52] via-[#D83B70] to-[#6E123D]">MANIA</span>
              </h1>
              <p className="text-2xl sm:text-3xl font-bold text-[#A50D52] tracking-tight">
                Think. Play. Compete.
              </p>
            </div>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#6B5A62] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Discover exciting quizzes, challenge yourself, test your knowledge, and compete with others across community and youth events.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href="#featured-quizzes"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#A50D52] via-[#6E123D] to-[#4A0A28] hover:from-[#D83B70] hover:to-[#A50D52] text-white font-bold text-sm px-7 py-3.5 rounded-xl shadow-lg shadow-[#A50D52]/25 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95"
              >
                <span>Explore Quizzes</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="#about"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-[#FAF8F9] text-[#24141C] border border-[#F0E1E8] font-semibold text-sm px-6 py-3.5 rounded-xl shadow-xs transition-colors"
              >
                <span>About QuizMania</span>
              </Link>
            </div>

            {/* Micro stats / Trust indicators */}
            <div className="pt-6 border-t border-[#F0E1E8] flex items-center justify-center lg:justify-start gap-8 text-xs text-[#6B5A62]">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#D83B70]" />
                <span>Leaderboards & Certificates</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A50D52]" />
                <span>Instant Verified Scoring</span>
              </div>
            </div>
          </div>

          {/* Right Column: Quiz Themed Interactive Graphic */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Visual Container */}
            <div className="relative w-full max-w-md">
              {/* Decorative background cards */}
              <div className="absolute -top-4 -left-4 w-full h-full rounded-3xl bg-gradient-to-br from-[#A50D52]/20 to-[#D83B70]/10 transform -rotate-3 border border-[#D83B70]/20 pointer-events-none" />

              {/* Main Quiz Mockup Card */}
              <div className="relative bg-white/95 backdrop-blur-md rounded-3xl border border-[#F0E1E8] p-6 shadow-2xl space-y-5">
                {/* Header bar */}
                <div className="flex items-center justify-between border-b border-[#F0E1E8] pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-[#A50D52] text-white font-black text-xs flex items-center justify-center shadow-xs">
                      Q
                    </span>
                    <div>
                      <span className="text-xs font-bold text-[#24141C] block">Rotaract Youth Bowl</span>
                      <span className="text-[10px] text-[#D83B70] font-semibold">Question 1 of 4</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F3D6E1] text-[#6E123D] text-[10px] font-bold">
                    +10 Marks
                  </span>
                </div>

                {/* Question */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#24141C] leading-snug">
                    What is the primary motto of Rotary and Rotaract worldwide?
                  </h4>
                  <p className="text-[11px] text-[#6B5A62]">
                    Select the single correct choice to earn full marks.
                  </p>
                </div>

                {/* Options visual simulation */}
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border border-[#A50D52] bg-[#F3D6E1]/30 flex items-center justify-between transition-all">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#A50D52] text-white text-[10px] font-bold flex items-center justify-center">
                        A
                      </span>
                      <span className="text-xs font-semibold text-[#6E123D]">
                        Service Above Self
                      </span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-[#A50D52]" />
                  </div>

                  <div className="p-3 rounded-xl border border-[#F0E1E8] bg-white flex items-center gap-2.5 opacity-85">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                      B
                    </span>
                    <span className="text-xs text-[#24141C]">
                      Leadership for Tomorrow
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-[#F0E1E8] bg-white flex items-center gap-2.5 opacity-85">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                      C
                    </span>
                    <span className="text-xs text-[#24141C]">
                      Excellence in Action
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[10px] text-[#6B5A62] mb-1 font-semibold">
                    <span>Quiz Progress</span>
                    <span className="text-[#A50D52]">25% Completed</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F0E1E8] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#A50D52] to-[#D83B70] w-1/4 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Floating Trophy Badge Element */}
              <div className="absolute -bottom-6 -right-4 bg-gradient-to-r from-[#6E123D] to-[#A50D52] text-white px-4 py-2.5 rounded-2xl shadow-xl border border-white/20 flex items-center gap-2.5 animate-bounce duration-1000">
                <div className="w-8 h-8 rounded-full bg-[#D83B70]/40 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <span className="text-xs font-bold block leading-none">Instant Results</span>
                  <span className="text-[10px] text-[#F3D6E1]">Secure Scoring Engine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
