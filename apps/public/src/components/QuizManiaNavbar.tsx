'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { QuizManiaLogo } from './QuizManiaLogo';
import { Menu, X, ArrowRight, Award } from 'lucide-react';

export function QuizManiaNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F9]/90 backdrop-blur-md border-b border-[#F0E1E8] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-4 sm:gap-6">
          <QuizManiaLogo />

          {/* Club Pill (hidden on small mobile to avoid crowding) */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3D6E1]/50 border border-[#D83B70]/20 text-[11px] font-semibold text-[#6E123D]">
            <Award className="w-3.5 h-3.5 text-[#A50D52]" />
            <span>Rotaract Club of Mapusa</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-semibold text-[#24141C]">
          <Link href="/" className="hover:text-[#A50D52] transition-colors">
            Home
          </Link>
          <Link href="/quizzes" className="hover:text-[#A50D52] transition-colors">
            Explore Quizzes
          </Link>
          <Link href="/#about" className="hover:text-[#A50D52] transition-colors">
            About
          </Link>
          <Link href="/#how-it-works" className="hover:text-[#A50D52] transition-colors">
            How It Works
          </Link>
          <Link href="/#rotaract" className="hover:text-[#A50D52] transition-colors">
            Rotaract Mapusa
          </Link>
        </nav>

        {/* Action Button */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/quizzes"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#A50D52] to-[#6E123D] hover:from-[#D83B70] hover:to-[#A50D52] text-white text-xs font-bold h-10 px-4 rounded-xl shadow-sm transition-transform active:scale-95"
          >
            <span>Explore Quizzes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[#24141C] hover:bg-[#F3D6E1]/40 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer with Backdrop */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 sm:top-20 z-50 bg-white/95 backdrop-blur-xl border-b border-[#F0E1E8] shadow-2xl p-5 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-semibold text-[#24141C] hover:bg-[#FAF8F9] hover:text-[#A50D52] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/quizzes"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-semibold text-[#24141C] hover:bg-[#FAF8F9] hover:text-[#A50D52] transition-colors"
            >
              Explore Quizzes
            </Link>
            <Link
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-semibold text-[#24141C] hover:bg-[#FAF8F9] hover:text-[#A50D52] transition-colors"
            >
              About QuizMania
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-semibold text-[#24141C] hover:bg-[#FAF8F9] hover:text-[#A50D52] transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/#rotaract"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-semibold text-[#24141C] hover:bg-[#FAF8F9] hover:text-[#A50D52] transition-colors"
            >
              Rotaract Club of Mapusa
            </Link>
          </div>

          <div className="pt-3 border-t border-[#F0E1E8]">
            <Link
              href="/quizzes"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full justify-center inline-flex items-center gap-2 bg-gradient-to-r from-[#A50D52] to-[#6E123D] text-white text-sm font-bold h-12 rounded-xl shadow-md"
            >
              <span>Explore All Quizzes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
