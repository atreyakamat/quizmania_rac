import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { QuizManiaLogo } from './QuizManiaLogo';
import { Heart, Globe2, ShieldCheck, Mail, MapPin } from 'lucide-react';

export function QuizManiaFooter() {
  return (
    <footer className="bg-[#180A12] text-[#FAF8F9] border-t border-[#301322] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A50D52] to-[#6E123D] flex items-center justify-center text-white font-extrabold text-lg border border-[#D83B70]/30">
                Q
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white block">
                  QUIZ<span className="text-[#D83B70]">MANIA</span>
                </span>
                <span className="text-xs text-[#F3D6E1]/70 block">
                  by Rotaract Club of Mapusa
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              QuizMania is a reusable, high-performance quiz platform created for conducting
              engaging competitions, fellowship challenges, and educational events for
              the Rotaract Club of Mapusa and its community.
            </p>

            <div className="flex items-center gap-2 text-xs text-[#F3D6E1]/80">
              <MapPin className="w-3.5 h-3.5 text-[#D83B70]" />
              <span>Mapusa, Goa, India • Rotary International District 3170</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
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
                  Rotaract Club of Mapusa
                </Link>
              </li>
            </ul>
          </div>

          {/* Organisation */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D83B70]">
              Club Initiative
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Committed to youth leadership, community impact, fellowship, and professional development.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-[#F3D6E1]">
                <span>Self Development Through Service</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#301322] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 QuizMania. An initiative of Rotaract Club of Mapusa. All rights reserved.
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-[#D83B70] fill-current" />
            <span>for community & youth events</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
