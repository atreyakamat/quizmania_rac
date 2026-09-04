import React from 'react';
import { Compass, BrainCircuit, Swords, Sparkles, CheckCircle2 } from 'lucide-react';

export function AboutSection() {
  return (
    <section id="about" className="py-20 lg:py-28 bg-white border-y border-[#F0E1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#A50D52] bg-[#F3D6E1]/50 px-3.5 py-1 rounded-full border border-[#D83B70]/20">
            <Sparkles className="w-3.5 h-3.5" />
            About The Platform
          </span>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#24141C]">
            More Than Just a Quiz
          </h2>

          <p className="text-base text-[#6B5A62] leading-relaxed">
            QuizMania brings together knowledge, competition, and fun through engaging,
            interactive quizzes created for our community. Whether you are participating in a local
            fellowship evening or an inter-college championship, QuizMania powers seamless experiences.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Discover */}
          <div className="p-8 rounded-2xl bg-[#FAF8F9] border border-[#F0E1E8] space-y-4 hover:border-[#D83B70]/50 hover:shadow-qm-glow transition-all group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#A50D52] to-[#6E123D] text-white flex items-center justify-center shadow-md shadow-[#A50D52]/20 group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-[#24141C] group-hover:text-[#A50D52] transition-colors">
              Discover
            </h3>

            <p className="text-sm text-[#6B5A62] leading-relaxed">
              Explore exciting quizzes spanning general knowledge, pop culture, science,
              social awareness, and Rotaract history crafted by event conveners.
            </p>

            <ul className="space-y-2 pt-2 text-xs text-[#24141C]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D83B70]" />
                <span>Diverse topic domains</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D83B70]" />
                <span>Rich image diagrams & themes</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Challenge */}
          <div className="p-8 rounded-2xl bg-[#FAF8F9] border border-[#F0E1E8] space-y-4 hover:border-[#D83B70]/50 hover:shadow-qm-glow transition-all group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D83B70] to-[#A50D52] text-white flex items-center justify-center shadow-md shadow-[#D83B70]/20 group-hover:scale-110 transition-transform">
              <BrainCircuit className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-[#24141C] group-hover:text-[#A50D52] transition-colors">
              Challenge
            </h3>

            <p className="text-sm text-[#6B5A62] leading-relaxed">
              Test your knowledge and analytical skills against curated questions. Navigate easily,
              flag questions for review, and submit when ready.
            </p>

            <ul className="space-y-2 pt-2 text-xs text-[#24141C]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D83B70]" />
                <span>Adaptive responsive interface</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D83B70]" />
                <span>Review & verification matrix</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Compete */}
          <div className="p-8 rounded-2xl bg-[#FAF8F9] border border-[#F0E1E8] space-y-4 hover:border-[#D83B70]/50 hover:shadow-qm-glow transition-all group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6E123D] to-[#24141C] text-white flex items-center justify-center shadow-md shadow-[#6E123D]/20 group-hover:scale-110 transition-transform">
              <Swords className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-[#24141C] group-hover:text-[#A50D52] transition-colors">
              Compete
            </h3>

            <p className="text-sm text-[#6B5A62] leading-relaxed">
              Take part and challenge your fellow participants. Server-side scoring guarantees fair,
              tamper-proof mark tallying and instant feedback.
            </p>

            <ul className="space-y-2 pt-2 text-xs text-[#24141C]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D83B70]" />
                <span>Secure tamper-proof scoring</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D83B70]" />
                <span>Instant performance breakdown</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
