'use client';

import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { Menu, X, Globe2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAF8F9] antialiased">
      {/* Mobile Top Bar */}
      <header className="lg:hidden bg-[#180A12] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-[#301322]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#A50D52] to-[#6E123D] flex items-center justify-center text-white font-extrabold text-sm border border-[#D83B70]/30">
            Q
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block">QUIZMANIA</span>
            <span className="text-[10px] text-[#D83B70] font-semibold block">Admin Studio</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="http://localhost:3010"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 text-xs"
            title="Open Public App"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            aria-label="Toggle Navigation"
          >
            {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Mobile Sliding Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#180A12] z-10 shadow-2xl">
            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto" onClick={() => setMobileSidebarOpen(false)}>
              <AdminSidebar />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
