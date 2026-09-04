import React from 'react';
import Link from 'next/link';
import { HelpCircle, Award, ArrowRight, Clock, Sparkles } from 'lucide-react';

interface QuizCardProps {
  quiz: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    cover_image: string | null;
    totalQuestions?: number;
    totalMarks?: number;
    questionCount?: number;
    settings?: {
      time_limit_minutes?: number | null;
    };
    theme?: {
      name?: string;
      primary_color?: string;
      secondary_color?: string;
    } | null;
  };
}

export function QuizCard({ quiz }: QuizCardProps) {
  const count = quiz.totalQuestions ?? quiz.questionCount ?? 0;
  const marks = quiz.totalMarks ?? count * 5;
  const timeLimit = quiz.settings?.time_limit_minutes;

  return (
    <div className="group bg-white rounded-2xl border border-[#F0E1E8] shadow-qm-card hover:shadow-qm-glow transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1">
      {/* Quiz Cover Image */}
      <div className="relative h-48 w-full bg-gradient-to-br from-[#6E123D]/10 via-[#A50D52]/10 to-[#D83B70]/10 overflow-hidden">
        {quiz.cover_image ? (
          <img
            src={quiz.cover_image}
            alt={quiz.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#A50D52]/40 bg-gradient-to-br from-[#FAF8F9] to-[#F3D6E1]/30">
            <Sparkles className="w-12 h-12 mb-2 stroke-1" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6E123D]/60">
              QuizMania Event
            </span>
          </div>
        )}

        {/* Floating Theme / Tag Badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-[#6E123D] border border-white/60 shadow-xs">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: quiz.theme?.primary_color || '#A50D52' }}
            />
            {quiz.theme?.name || 'General'}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Metadata pill badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B5A62]">
            <span className="inline-flex items-center gap-1 bg-[#FAF8F9] px-2.5 py-1 rounded-lg border border-[#F0E1E8] font-medium text-[11px]">
              <HelpCircle className="w-3.5 h-3.5 text-[#A50D52]" />
              {count} Questions
            </span>
            <span className="inline-flex items-center gap-1 bg-[#FAF8F9] px-2.5 py-1 rounded-lg border border-[#F0E1E8] font-medium text-[11px]">
              <Award className="w-3.5 h-3.5 text-[#D83B70]" />
              {marks} Marks
            </span>
            {timeLimit && (
              <span className="inline-flex items-center gap-1 bg-[#FAF8F9] px-2.5 py-1 rounded-lg border border-[#F0E1E8] font-medium text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {timeLimit} mins
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-[#24141C] group-hover:text-[#A50D52] transition-colors line-clamp-1">
            {quiz.title}
          </h3>

          <p className="text-xs text-[#6B5A62] line-clamp-2 leading-relaxed">
            {quiz.description || 'Test your knowledge in this official QuizMania challenge.'}
          </p>
        </div>

        {/* Start Quiz CTA */}
        <div className="pt-2 border-t border-[#F0E1E8]/60">
          <Link
            href={`/q/${quiz.slug}`}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#A50D52] to-[#6E123D] hover:from-[#D83B70] hover:to-[#A50D52] text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-all active:scale-95"
          >
            <span>Start Quiz</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
