import React from 'react';
import Image from 'next/image';
import { Award, Globe2, Sparkles, Mountain, ShoppingBag, Heart } from 'lucide-react';
import { ClubMedia } from './ClubMedia';

export function RotaractMapusaSection() {
  return (
    <section id="rotaract" className="py-20 lg:py-28 bg-white border-t border-[#F0E1E8] relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute right-0 top-1/3 w-96 h-96 bg-[#F3D6E1]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-0 bottom-10 w-80 h-80 bg-[#D83B70]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        <div className="bg-gradient-to-br from-[#FAF8F9] via-white to-[#F3D6E1]/20 rounded-3xl border border-[#F0E1E8] p-6 sm:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Club Group Photograph Column (5 cols) */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <ClubMedia />
            </div>

            {/* Information & Club Identity Column (7 cols) */}
            <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#A50D52] bg-[#F3D6E1]/60 px-3.5 py-1 rounded-full border border-[#D83B70]/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Rotaract Club of Mapusa</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-[11px] font-bold text-[#6E123D] border border-[#F0E1E8]">
                    <Award className="w-3.5 h-3.5 text-[#A50D52]" />
                    <span>RI District 3170</span>
                  </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-[#24141C]">
                  Service Above Self in the Heart of Goa
                </h2>

                <p className="text-sm sm:text-base text-[#6B5A62] leading-relaxed">
                  The <strong className="text-[#24141C]">Rotaract Club of Mapusa</strong> is a premier youth leadership and community service organization in Goa (RI District 3170). Through digital platforms like <strong className="text-[#A50D52]">QuizMania</strong>, youth empowerment initiatives, and active fellowship drives, we unite students, young professionals, and community builders.
                </p>
              </div>

              {/* Genuine Club Initiatives Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {/* 1. YUNAAY */}
                <div className="p-4 rounded-2xl bg-white border border-[#F0E1E8] shadow-xs space-y-1.5 hover:border-[#A50D52]/40 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-[#F3D6E1]/60 text-[#A50D52] flex items-center justify-center mb-2">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-[#24141C] block">YUNAAY</span>
                  <span className="text-[11px] text-[#6B5A62] leading-snug block">
                    Flagship annual exhibition supporting women entrepreneurship and local Goan culture.
                  </span>
                </div>

                {/* 2. ROTTREK */}
                <div className="p-4 rounded-2xl bg-white border border-[#F0E1E8] shadow-xs space-y-1.5 hover:border-[#D83B70]/40 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-[#F3D6E1]/60 text-[#D83B70] flex items-center justify-center mb-2">
                    <Mountain className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-[#24141C] block">ROTTREK</span>
                  <span className="text-[11px] text-[#6B5A62] leading-snug block">
                    Eco-trekking initiative promoting youth fitness, fellowship, and environmental care.
                  </span>
                </div>

                {/* 3. Community Quizzes & Health */}
                <div className="p-4 rounded-2xl bg-white border border-[#F0E1E8] shadow-xs space-y-1.5 hover:border-[#6E123D]/40 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-[#F3D6E1]/60 text-[#6E123D] flex items-center justify-center mb-2">
                    <Heart className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-[#24141C] block">Awareness Drives</span>
                  <span className="text-[11px] text-[#6B5A62] leading-snug block">
                    Community wellness, health campaigns, and educational competitions across Goa.
                  </span>
                </div>
              </div>

              {/* District & Sponsor Attribution */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#6B5A62] border-t border-[#F0E1E8] pt-4">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-[#A50D52]" />
                  <span>Sponsored by Rotary Club of Mapusa</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#24141C] font-semibold bg-white px-3 py-1.5 rounded-xl border border-[#F0E1E8]">
                  <span className="text-[#A50D52] font-bold">Rotary International</span>
                  <span>District 3170</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

