import React from 'react';
import Link from 'next/link';
import { Award, Users, Globe2, Sparkles, ExternalLink } from 'lucide-react';

export function RotaractMapusaSection() {
  return (
    <section id="rotaract" className="py-20 lg:py-28 bg-white border-t border-[#F0E1E8] relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute right-0 top-0 w-80 h-80 bg-[#F3D6E1]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        <div className="bg-gradient-to-br from-[#FAF8F9] via-white to-[#F3D6E1]/20 rounded-3xl border border-[#F0E1E8] p-8 sm:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Logo Container */}
            <div className="lg:col-span-4 flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-[#F0E1E8] shadow-xs">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                <img
                  src="/branding/rotaract-mapusa-logo.png"
                  alt="Rotaract Club of Mapusa Logo"
                  className="max-h-full max-w-full object-contain drop-shadow-sm"
                />
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6E123D] block">
                  Rotaract Club of Mapusa
                </span>
                <span className="text-[11px] text-[#6B5A62]">
                  Rotary International District 3170
                </span>
              </div>
            </div>

            {/* Information Column */}
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#A50D52] bg-[#F3D6E1]/60 px-3.5 py-1 rounded-full border border-[#D83B70]/20">
                  <Award className="w-3.5 h-3.5" />
                  Official Club Initiative
                </span>

                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#24141C]">
                  Powered by the Rotaract Club of Mapusa
                </h2>

                <p className="text-base text-[#6B5A62] leading-relaxed">
                  QuizMania is an initiative designed to create engaging, interactive, and exciting quiz experiences for events and communities. Built with love by the youth of Mapusa, Goa, for clubs, schools, colleges, and community festivals.
                </p>
              </div>

              {/* Pillars grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white border border-[#F0E1E8] shadow-xs">
                  <Users className="w-5 h-5 text-[#A50D52] mb-1.5" />
                  <span className="text-xs font-bold text-[#24141C] block">Community Fellowship</span>
                  <span className="text-[11px] text-[#6B5A62]">Bringing people together through learning & fun.</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#F0E1E8] shadow-xs">
                  <Sparkles className="w-5 h-5 text-[#D83B70] mb-1.5" />
                  <span className="text-xs font-bold text-[#24141C] block">Youth Leadership</span>
                  <span className="text-[11px] text-[#6B5A62]">Empowering young minds with innovative platforms.</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#F0E1E8] shadow-xs">
                  <Globe2 className="w-5 h-5 text-[#6E123D] mb-1.5" />
                  <span className="text-xs font-bold text-[#24141C] block">District 3170</span>
                  <span className="text-[11px] text-[#6B5A62]">Proudly representing Rotaract in Goa, India.</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <span className="text-xs font-medium text-[#6B5A62]">
                  Join our upcoming activities and events.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
