'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Database, ShieldCheck } from 'lucide-react';

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function AdminHeader({ title = 'Administration', subtitle, action }: AdminHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {action}

        <div className="h-6 w-[1px] bg-slate-200" />

        <a
          href="http://localhost:3010"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
        >
          <span>Open Public Quiz App</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
}
