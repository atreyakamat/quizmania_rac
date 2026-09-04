'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Trophy, CheckCircle2, ShieldCheck } from 'lucide-react';

export function QuizHero() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[600px] h-[340px] sm:h-[600px] bg-gradient-to-tr from-[#F3D6E1]/60 via-[#D83B70]/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Heading & CTAs */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F3D6E1]/60 border border-[#D83B70]/25 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#A50D52] animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#6E123D]">
                Rotaract Club of Mapusa Presents
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#24141C] uppercase leading-[1.08]">
                QUIZ<span className="bg-clip-text text-transparent bg-gradient-to-r from-[#A50D52] via-[#D83B70] to-[#6E123D]">MANIA</span>
              </h1>
              <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#A50D52] tracking-tight">
                Think. Play. Compete.
              </p>
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base lg:text-lg text-[#6B5A62] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Discover exciting quizzes, challenge your skills, test your knowledge, and compete with friends in interactive community events.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link
                href="#featured-quizzes"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#A50D52] to-[#6E123D] hover:from-[#D83B70] hover:to-[#A50D52] text-white font-bold text-sm h-12 px-7 rounded-2xl shadow-md shadow-[#A50D52]/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span>Explore Quizzes</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-[#FAF8F9] text-[#24141C] border border-[#F0E1E8] font-semibold text-sm h-12 px-6 rounded-2xl shadow-xs transition-colors"
              >
                <span>How It Works</span>
              </Link>
            </div>

            {/* Micro Highlights */}
            <div className="pt-4 border-t border-[#F0E1E8] flex flex-wrap items-center justify-center lg:justify-start gap-5 sm:gap-8 text-xs text-[#6B5A62]">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#D83B70] flex-shrink-0" />
                <span className="font-medium">Live Event Competitions</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#A50D52] flex-shrink-0" />
                <span className="font-medium">Secure Instant Scoring</span>
              </div>
            </div>
          </div>

          {/* Right Column: Quiz Preview Mockup (Mobile-optimized, zero overflow) */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl border border-[#F0E1E8] p-5 sm:p-7 shadow-xl space-y-4 sm:space-y-5">
              {/* Header inside mockup */}
              <div className="flex items-center justify-between border-b border-[#F0E1E8] pb-3 sm:pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#A50D52] to-[#6E123D] text-white font-black text-xs flex items-center justify-center shadow-xs">
                    Q
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#24141C] block">Rotaract Youth Bowl</span>
                    <span className="text-[10px] text-[#A50D52] font-semibold">Question 1 of 4</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#F3D6E1]/70 text-[#6E123D] text-[10px] font-bold">
                  10 Marks
                </span>
              </div>

              {/* Question statement */}
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-[#24141C] leading-snug">
                  What is the primary motto of Rotary and Rotaract worldwide?
                </h4>
              </div>

              {/* Interactive simulated options */}
              <div className="space-y-2">
                <div className="p-3 sm:p-3.5 rounded-xl border border-[#A50D52] bg-[#F3D6E1]/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#A50D52] text-white text-[10px] font-bold flex items-center justify-center">
                      A
                    </span>
                    <span className="text-xs font-semibold text-[#6E123D]">
                      Service Above Self
                    </span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#A50D52]" />
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl border border-[#F0E1E8] bg-white flex items-center gap-2.5 opacity-80">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                    B
                  </span>
                  <span className="text-xs text-[#24141C]">
                    Leadership for Tomorrow
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl border border-[#F0E1E8] bg-white flex items-center gap-2.5 opacity-80">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
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
          </div>
        </div>
      </div>
    </section>
  );
}
