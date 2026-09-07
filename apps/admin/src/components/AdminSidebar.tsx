'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  HelpCircle, 
  PlusCircle, 
  Palette, 
  BarChart3, 
  Settings,
  Sparkles
} from 'lucide-react';

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#180A12] text-slate-200 min-h-screen flex flex-col border-r border-[#301322] flex-shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#301322] flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white/10 p-1 border border-[#D83B70]/30 shadow-lg shadow-[#A50D52]/30 flex-shrink-0">
          <Image
            src="/branding/quizmania.png"
            alt="QuizMania Logo"
            width={40}
            height={40}
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-black text-white tracking-tight text-base">QUIZMANIA</h1>
          </div>
          <span className="text-[11px] text-[#D83B70] font-semibold block">Admin Studio</span>
          <span className="text-[10px] text-slate-400 font-medium block truncate">Rotaract Club of Mapusa</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-6 text-sm overflow-y-auto">
        {/* Main */}
        <div>
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === '/' 
                ? 'bg-gradient-to-r from-[#A50D52] to-[#6E123D] text-white font-medium shadow-xs' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#D83B70]" />
            Dashboard
          </Link>
        </div>

        {/* Quizzes Group */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 py-1 text-xs font-semibold text-[#F3D6E1]/60 uppercase tracking-wider">
            <span>Quizzes</span>
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
          <div className="pl-1 space-y-1">
            <Link
              href="/quizzes"
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                pathname === '/quizzes' ? 'bg-[#301322] text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              All Quizzes
            </Link>
            <Link
              href="/quizzes/create"
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                pathname === '/quizzes/create' ? 'bg-[#301322] text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-[#D83B70]" />
              Create Quiz
            </Link>
          </div>
        </div>

        {/* Themes Group */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 py-1 text-xs font-semibold text-[#F3D6E1]/60 uppercase tracking-wider">
            <span>Themes</span>
            <Palette className="w-3.5 h-3.5" />
          </div>
          <div className="pl-1 space-y-1">
            <Link
              href="/themes"
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                pathname === '/themes' ? 'bg-[#301322] text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Palette className="w-4 h-4 text-purple-400" />
              All Themes
            </Link>
          </div>
        </div>

        {/* Results, AI & Settings */}
        <div className="space-y-1 pt-2 border-t border-[#301322]">
          <Link
            href="/results"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === '/results' ? 'bg-[#301322] text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Responses
          </Link>
          <Link
            href="/ai"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === '/ai' ? 'bg-[#301322] text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            AI Generator
          </Link>
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === '/settings' ? 'bg-[#301322] text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            Settings
          </Link>
        </div>
      </nav>

      {/* Local Admin & Rotaract footer */}
      <div className="p-4 border-t border-[#301322] bg-[#10060C] space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-2 h-2 rounded-full bg-[#D83B70] animate-pulse" />
          <span>Local Admin Studio (:3011)</span>
        </div>
        <p className="text-[10px] text-slate-500">
          Rotaract Club of Mapusa
        </p>
      </div>
    </aside>
  );
}
