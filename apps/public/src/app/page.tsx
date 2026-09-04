import React from 'react';
import Link from 'next/link';
import { QuizHero } from '@/components/QuizHero';
import { QuizCard } from '@/components/QuizCard';
import { AboutSection } from '@/components/AboutSection';
import { HowItWorksSection } from '@/components/HowItWorksSection';
import { RotaractMapusaSection } from '@/components/RotaractMapusaSection';
import { getPublishedQuizzesList } from '@quizmania/shared';
import { ArrowRight, Sparkles, HelpCircle } from 'lucide-react';

export const revalidate = 0;

export default async function QuizManiaLandingPage() {
  const publishedQuizzes = await getPublishedQuizzesList();

  return (
    <div className="space-y-0">
      {/* 1. Hero Section */}
      <QuizHero />

      {/* 2. Featured Quizzes Section ("Explore Quizzes") */}
      <section id="featured-quizzes" className="py-20 lg:py-28 bg-[#FAF8F9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#F0E1E8] pb-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#A50D52] bg-[#F3D6E1]/50 px-3.5 py-1 rounded-full border border-[#D83B70]/20">
                <Sparkles className="w-3.5 h-3.5" />
                Live Competitions
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#24141C]">
                Explore Quizzes
              </h2>
              <p className="text-sm text-[#6B5A62] max-w-lg">
                Choose from currently active quizzes, enter your details, and see how you score!
              </p>
            </div>

            <Link
              href="/quizzes"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#A50D52] hover:text-[#D83B70] transition-colors"
            >
              <span>View All Quizzes ({publishedQuizzes.length})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quiz Cards Grid */}
          {publishedQuizzes.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-[#F0E1E8] p-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#F3D6E1]/40 text-[#A50D52] flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#24141C]">No Active Quizzes Right Now</h3>
              <p className="text-xs text-[#6B5A62] max-w-sm mx-auto">
                New quizzes created and published by the administrator will immediately appear here.
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
      </section>

      {/* 3. About Section */}
      <AboutSection />

      {/* 4. How It Works Section */}
      <HowItWorksSection />

      {/* 5. Rotaract Club of Mapusa Section */}
      <RotaractMapusaSection />
    </div>
  );
}
