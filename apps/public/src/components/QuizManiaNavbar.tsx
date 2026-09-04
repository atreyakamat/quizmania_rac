'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { QuizManiaLogo } from './QuizManiaLogo';
import { Sparkles, Menu, X, ArrowRight, Award } from 'lucide-react';

export function QuizManiaNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F9]/90 backdrop-blur-md border-b border-[#F0E1E8] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <QuizManiaLogo />

          {/* Club Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F3D6E1]/50 border border-[#D83B70]/30 text-[11px] font-semibold text-[#6E123D]">
            <Award className="w-3.5 h-3.5 text-[#A50D52]" />
            <span>Rotaract Club of Mapusa</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#24141C]">
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
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#A50D52] to-[#6E123D] hover:from-[#D83B70] hover:to-[#A50D52] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#A50D52]/20 transition-all hover:scale-[1.02] active:scale-95"
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
            className="p-2 rounded-lg text-[#24141C] hover:bg-[#F3D6E1]/40"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#F0E1E8] px-5 py-4 space-y-3 shadow-lg animate-in slide-in-from-top duration-200">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-[#24141C] hover:text-[#A50D52]"
          >
            Home
          </Link>
          <Link
            href="/quizzes"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-[#24141C] hover:text-[#A50D52]"
          >
            Explore Quizzes
          </Link>
          <Link
            href="/#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-[#24141C] hover:text-[#A50D52]"
          >
            About QuizMania
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-[#24141C] hover:text-[#A50D52]"
          >
            How It Works
          </Link>
          <Link
            href="/#rotaract"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-[#24141C] hover:text-[#A50D52]"
          >
            Rotaract Club of Mapusa
          </Link>

          <div className="pt-3 border-t border-slate-100">
            <Link
              href="/quizzes"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full justify-center inline-flex items-center gap-2 bg-gradient-to-r from-[#A50D52] to-[#6E123D] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs"
            >
              <span>Explore All Quizzes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
