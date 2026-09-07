import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function QuizManiaLogo({
  size = 'default',
  showWordmark = true
}: {
  size?: 'small' | 'default' | 'large';
  showWordmark?: boolean;
}) {
  const isSmall = size === 'small';
  const isLarge = size === 'large';
  const pixelDimension = isSmall ? 32 : isLarge ? 48 : 40;

  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 group select-none"
      aria-label="QuizMania - Rotaract Club of Mapusa Home"
    >
      {/* Official Crisp Logo Emblem */}
      <div
        className={`relative rounded-xl overflow-hidden shadow-md shadow-[#A50D52]/20 border border-[#D83B70]/30 group-hover:scale-105 transition-transform flex-shrink-0 bg-white ${
          isSmall ? 'w-8 h-8' : isLarge ? 'w-12 h-12' : 'w-10 h-10'
        }`}
      >
        <Image
          src="/branding/quizmania.png"
          alt="QuizMania Official Logo"
          width={pixelDimension}
          height={pixelDimension}
          className="w-full h-full object-contain p-0.5"
          priority
        />
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <div className="flex flex-col">
          <span
            className={`font-black tracking-tight leading-none text-[#24141C] flex items-center ${
              isSmall ? 'text-base' : isLarge ? 'text-2xl' : 'text-xl'
            }`}
          >
            QUIZ<span className="text-[#A50D52]">MANIA</span>
          </span>
          <span
            className={`font-medium tracking-tight text-[#6B5A62] mt-0.5 ${
              isSmall ? 'text-[9px]' : isLarge ? 'text-xs' : 'text-[10px]'
            }`}
          >
            by Rotaract Club of Mapusa
          </span>
        </div>
      )}
    </Link>
  );
}
