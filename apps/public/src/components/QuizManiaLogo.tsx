import React from 'react';
import Link from 'next/link';

export function QuizManiaLogo({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <Link href="/" className="inline-flex items-center gap-2.5 group select-none">
      {/* Icon Emblem */}
      <div className={`rounded-xl bg-gradient-to-br from-[#A50D52] via-[#6E123D] to-[#400A23] flex items-center justify-center text-white font-black shadow-md shadow-[#A50D52]/20 border border-[#D83B70]/40 group-hover:scale-105 transition-transform ${
        isSmall ? 'w-8 h-8 text-sm' : isLarge ? 'w-12 h-12 text-2xl' : 'w-9 h-9 text-base'
      }`}>
        <span className="bg-clip-text text-transparent bg-gradient-to-t from-rose-200 to-white">
          Q
        </span>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col">
        <span className={`font-black tracking-tight leading-none text-[#24141C] flex items-center ${
          isSmall ? 'text-base' : isLarge ? 'text-2xl' : 'text-xl'
        }`}>
          QUIZ<span className="text-[#A50D52]">MANIA</span>
        </span>
        <span className={`font-medium tracking-tight text-[#6B5A62] mt-0.5 ${
          isSmall ? 'text-[9px]' : isLarge ? 'text-xs' : 'text-[10px]'
        }`}>
          by Rotaract Club of Mapusa
        </span>
      </div>
    </Link>
  );
}
