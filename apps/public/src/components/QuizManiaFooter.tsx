import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, MapPin, Award, ArrowUpRight } from 'lucide-react';

export function QuizManiaFooter() {
  return (
    <footer className="bg-[#180A12] text-[#FAF8F9] border-t border-[#301322] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-white/10 p-1 border border-[#D83B70]/30 shadow-md flex-shrink-0">
                <Image
                  src="/branding/quizmania-logo.png"
                  alt="QuizMania Official Logo"
                  width={44}
                  height={44}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white block">
                  QUIZ<span className="text-[#D83B70]">MANIA</span>
                </span>
                <span className="text-xs text-[#F3D6E1]/80 block">
                  Rotaract Club of Mapusa • RI District 3170
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              A high-performance quiz platform created for conducting engaging competitions, fellowship events, and educational quizzes for the Rotaract Club of Mapusa and our community across Goa.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#F3D6E1]/90 pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D83B70]" />
                <span>Mapusa, Goa, India</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#A50D52]" />
                <span>RI District 3170</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D83B70]">
              Navigation
            </span>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/quizzes" className="hover:text-white transition-colors">
                  Explore Quizzes
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-white transition-colors">
                  About QuizMania
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#rotaract" className="hover:text-white transition-colors">
                  Rotaract Mapusa
                </Link>
              </li>
            </ul>
          </div>

          {/* Creator & Club Attribution */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D83B70]">
              Development
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Built with precision for seamless community engagement, mobile responsiveness, and fair scoring.
            </p>
            <div className="pt-2">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-[#F3D6E1] font-semibold">
                  <Heart className="w-3.5 h-3.5 text-[#D83B70] fill-current" />
                  <span>Built by Atreya</span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  For Rotaract Club of Mapusa
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#301322] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 QuizMania • Rotaract Club of Mapusa. All rights reserved.
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>Designed & Developed by</span>
            <span className="text-[#F3D6E1] font-semibold">Atreya</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
