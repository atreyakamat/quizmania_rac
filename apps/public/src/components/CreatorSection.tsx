'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Code2, 
  GraduationCap, 
  Music, 
  Sparkles, 
  Globe, 
  ExternalLink,
  Layers,
  Heart
} from 'lucide-react';

export function CreatorSection() {
  return (
    <section id="creator" className="py-20 lg:py-28 bg-[#FAF8F9] border-t border-[#F0E1E8] relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 bg-[#F3D6E1]/40 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />
      <div className="absolute bottom-0 right-10 w-72 h-72 bg-[#D83B70]/10 rounded-full blur-3xl pointer-events-none -z-10 animate-float" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        <div className="bg-white rounded-3xl border border-[#F0E1E8] p-6 sm:p-12 lg:p-14 shadow-sm space-y-10">
          
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#F0E1E8] pb-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F3D6E1]/60 border border-[#D83B70]/20 text-[11px] font-bold text-[#A50D52] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#D83B70]" />
                <span>Meet The Creator & Architect</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#24141C]">
                Designed & Built by <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#A50D52] via-[#D83B70] to-[#6E123D]">Atreya Kamat</span>
              </h2>

              <p className="text-sm sm:text-base text-[#6B5A62] max-w-2xl leading-relaxed">
                Passionate web builder, platform systems architect, educator, and community collaborator dedicated to crafting seamless digital experiences for youth organizations.
              </p>
            </div>

            <div className="flex-shrink-0">
              <a
                href="https://atreyakamat.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#A50D52] to-[#6E123D] hover:from-[#D83B70] hover:to-[#A50D52] text-white text-xs font-bold h-11 px-6 rounded-2xl shadow-md transition-all active:scale-95"
              >
                <Globe className="w-4 h-4" />
                <span>atreyakamat.dev</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-75" />
              </a>
            </div>
          </div>

          {/* 3 Pillars / Roles of Atreya */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Web & Platform Systems Building */}
            <div className="p-6 rounded-2xl bg-[#FAF8F9] border border-[#F0E1E8] space-y-4 hover:border-[#A50D52]/40 hover:shadow-xs transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A50D52] to-[#6E123D] text-white flex items-center justify-center shadow-md shadow-[#A50D52]/20 group-hover:scale-105 transition-transform">
                <Code2 className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[#24141C] group-hover:text-[#A50D52] transition-colors">
                  Web & Platform Architect
                </h3>
                <p className="text-xs text-[#6B5A62] leading-relaxed">
                  Specializes in building modern web applications, distributed platform systems, secure scoring architectures, and interactive digital products.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold text-[#6E123D]">
                <span className="bg-[#F3D6E1]/60 px-2.5 py-0.5 rounded-lg">Full-Stack</span>
                <span className="bg-[#F3D6E1]/60 px-2.5 py-0.5 rounded-lg">Next.js & Supabase</span>
                <span className="bg-[#F3D6E1]/60 px-2.5 py-0.5 rounded-lg">System Design</span>
              </div>
            </div>

            {/* 2. Educator & Private Tutor */}
            <div className="p-6 rounded-2xl bg-[#FAF8F9] border border-[#F0E1E8] space-y-4 hover:border-[#D83B70]/40 hover:shadow-xs transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D83B70] to-[#A50D52] text-white flex items-center justify-center shadow-md shadow-[#D83B70]/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[#24141C] group-hover:text-[#A50D52] transition-colors">
                  Educator & Mentor
                </h3>
                <p className="text-xs text-[#6B5A62] leading-relaxed">
                  Dedicated private tutor and educator empowering students with conceptual clarity, analytical problem-solving, and technology skills.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold text-[#6E123D]">
                <span className="bg-[#F3D6E1]/60 px-2.5 py-0.5 rounded-lg">Private Tutoring</span>
                <span className="bg-[#F3D6E1]/60 px-2.5 py-0.5 rounded-lg">Concept Mastery</span>
                <span className="bg-[#F3D6E1]/60 px-2.5 py-0.5 rounded-lg">Youth Mentorship</span>
              </div>
            </div>

            {/* 3. Founder of Stix 'N' Vibes */}
            <div className="p-6 rounded-2xl bg-[#FAF8F9] border border-[#F0E1E8] space-y-4 hover:border-[#6E123D]/40 hover:shadow-xs transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6E123D] to-[#24141C] text-white flex items-center justify-center shadow-md shadow-[#6E123D]/20 group-hover:scale-105 transition-transform">
                <Music className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[#24141C] group-hover:text-[#A50D52] transition-colors">
                  Founder of Stix &apos;N&apos; Vibes
                </h3>
                <p className="text-xs text-[#6B5A62] leading-relaxed">
                  Creator and visionary behind <strong className="text-[#24141C]">Stix &apos;N&apos; Vibes</strong>, blending creative passion, community rhythm, and youth expression.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold text-[#6E123D]">
                <span className="bg-[#F3D6E1]/60 px-2.5 py-0.5 rounded-lg">Creative Direction</span>
                <span className="bg-[#F3D6E1]/60 px-2.5 py-0.5 rounded-lg">Community Rhythms</span>
                <span className="bg-[#F3D6E1]/60 px-2.5 py-0.5 rounded-lg">Youth Brand</span>
              </div>
            </div>
          </div>

          {/* Collaboration Footnote Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#F3D6E1]/50 via-white to-[#F3D6E1]/30 border border-[#F0E1E8] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#F0E1E8] text-[#A50D52] flex items-center justify-center flex-shrink-0 shadow-xs">
                <Heart className="w-4 h-4 fill-current text-[#D83B70]" />
              </div>
              <span className="text-[#24141C] font-medium text-center sm:text-left">
                Developed in close partnership with <strong className="text-[#6E123D]">Rotaract Club of Mapusa (RI District 3170)</strong> to power community quiz events.
              </span>
            </div>

            <div className="flex items-center gap-2 font-semibold text-[#A50D52]">
              <Layers className="w-3.5 h-3.5" />
              <span>Hosted at quizmania.atreyakamat.dev</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
