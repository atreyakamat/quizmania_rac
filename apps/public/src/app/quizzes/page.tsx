import React from 'react';
import Link from 'next/link';
import { QuizCard } from '@/components/QuizCard';
import { getPublishedQuizzesList } from '@quizmania/shared';
import { Sparkles, ArrowLeft, HelpCircle } from 'lucide-react';

export const revalidate = 0;

export default async function QuizzesDirectoryPage() {
  const publishedQuizzes = await getPublishedQuizzesList();

  return (
    <div className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B5A62] hover:text-[#A50D52] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="space-y-3 border-b border-[#F0E1E8] pb-6">
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#A50D52] bg-[#F3D6E1]/50 px-3.5 py-1 rounded-full border border-[#D83B70]/20">
          <Sparkles className="w-3.5 h-3.5" />
          All Available Challenges
        </span>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#24141C]">
          Explore Quizzes
        </h1>

        <p className="text-sm text-[#6B5A62] max-w-2xl">
          Browse published quizzes hosted by Rotaract Club of Mapusa. Select any quiz to read details, enter your participant profile, and test your knowledge.
        </p>
      </div>

      {/* Quizzes Grid */}
      {publishedQuizzes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-[#F0E1E8] p-16 text-center space-y-4">
          <HelpCircle className="w-10 h-10 text-[#A50D52] mx-auto" />
          <h3 className="text-base font-bold text-[#24141C]">No quizzes currently active</h3>
          <p className="text-xs text-[#6B5A62]">
            Please check back soon for upcoming Rotaract competitions and events.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {publishedQuizzes.map(quiz => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
}
