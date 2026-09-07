import React from 'react';
import Link from 'next/link';
import { QuizHero } from '@/components/QuizHero';
import { QuizCard } from '@/components/QuizCard';
import { AboutSection } from '@/components/AboutSection';
import { HowItWorksSection } from '@/components/HowItWorksSection';
import { RotaractMapusaSection } from '@/components/RotaractMapusaSection';
import { getPublishedQuizzesList } from '@quizmania/shared';
import { ArrowRight, Sparkles, HelpCircle, PlusCircle, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function QuizManiaLandingPage() {
  const publishedQuizzes = await getPublishedQuizzesList();

  return (
    <div className="space-y-0 overflow-x-hidden">
      {/* 1. Hero Section */}
      <QuizHero />

      {/* 2. Featured Quizzes Section ("Explore Quizzes") */}
      <section id="featured-quizzes" className="py-20 lg:py-28 bg-[#FAF8F9] border-t border-[#F0E1E8]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[#F0E1E8] pb-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#A50D52] bg-[#F3D6E1]/50 px-3.5 py-1 rounded-full border border-[#D83B70]/20">
                <Sparkles className="w-3.5 h-3.5" />
                Live Competitions
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-[#24141C]">
                Explore Quizzes
              </h2>
              <p className="text-xs sm:text-sm text-[#6B5A62] max-w-lg">
                Choose from active quizzes, enter your details, and challenge yourself!
              </p>
            </div>

            {publishedQuizzes.length > 0 && (
              <Link
                href="/quizzes"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#A50D52] hover:text-[#D83B70] transition-colors self-start sm:self-auto"
              >
                <span>View All ({publishedQuizzes.length})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Quiz Cards Grid or Minimal Fresh State */}
          {publishedQuizzes.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-[#F0E1E8] p-10 sm:p-16 text-center space-y-5 max-w-xl mx-auto shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-[#F3D6E1]/50 text-[#A50D52] flex items-center justify-center mx-auto shadow-xs">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-[#24141C]">No Active Quizzes Right Now</h3>
                <p className="text-xs sm:text-sm text-[#6B5A62] leading-relaxed">
                  Quizzes published in the Admin app will instantly appear here for participants.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href="http://localhost:3011/quizzes/create"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#A50D52] to-[#6E123D] hover:from-[#D83B70] hover:to-[#A50D52] text-white text-xs font-bold h-11 px-6 rounded-2xl shadow-md transition-all active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create New Quiz in Admin</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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
