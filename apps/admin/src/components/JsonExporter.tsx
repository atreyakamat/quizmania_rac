'use client';

import React, { useState } from 'react';
import { Download, Check, Copy } from 'lucide-react';

export function JsonExporter({ quizId, quizSlug }: { quizId: string; quizSlug: string }) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchExportData = async () => {
    const res = await fetch(`/api/quizzes/${quizId}/export`);
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Export failed');
    }
    return result.data;
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const data = await fetchExportData();
      if (!data) return;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quizSlug || 'quiz'}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    try {
      const data = await fetchExportData();
      if (!data) return;
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to copy');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isExporting}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
      >
        <Download className="w-3.5 h-3.5 text-slate-500" />
        <span>{isExporting ? 'Exporting...' : 'Export JSON'}</span>
      </button>

      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
        <span>{copied ? 'Copied!' : 'Copy'}</span>
      </button>
    </div>
  );
}
