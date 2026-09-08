'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminAuthProvider, useAdminAuth } from './AdminAuthProvider';
import { Menu, X, ExternalLink, Loader2, Shield } from 'lucide-react';

function AdminShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAdminAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // If on login page, render child component directly without shell chrome
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Prevent flash of private dashboard while verifying session
  if (loading) {
    return (
      <div className="min-h-screen bg-[#10060C] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 p-2 border border-[#D83B70]/40 shadow-xl shadow-[#A50D52]/20 flex items-center justify-center">
            <Image
              src="/branding/quizmania.png"
              alt="QuizMania Logo"
              width={48}
              height={48}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-[#D83B70]" />
            <span>Verifying administrator session...</span>
          </div>
        </div>
      </div>
    );
  }

  // If no user is authenticated, AdminAuthProvider will have initiated redirect to /login
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAF8F9] antialiased">
      {/* Mobile Top Bar */}
      <header className="lg:hidden bg-[#180A12] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-[#301322]">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white/10 p-0.5 border border-[#D83B70]/30 flex-shrink-0">
            <Image
              src="/branding/quizmania.png"
              alt="QuizMania Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
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

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShellInner>{children}</AdminShellInner>
    </AdminAuthProvider>
  );
}
