'use client';

import React, { useState } from 'react';
import { AdminHeader } from '@/components/AdminHeader';
import { ImageUploader } from '@/components/ImageUploader';
import { Check, Copy } from 'lucide-react';

export default function QuestionMediaPage() {
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleUploaded = (url: string) => {
    setUploadedUrls(prev => [url, ...prev]);
  };

  const handleCopy = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div>
      <AdminHeader
        title="Question Images"
        subtitle="Manage question diagram and illustration assets stored in the 'question-images' bucket"
      />

      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-xl">
          <ImageUploader
            bucket="question-images"
            onUploaded={handleUploaded}
            label="Upload Question Diagram / Image"
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
            Uploaded Question Images ({uploadedUrls.length})
          </h3>

          {uploadedUrls.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-400">
              No question images uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {uploadedUrls.map((url, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="h-44 bg-slate-100 relative">
                    <img src={url} alt="Question Diagram" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 flex items-center justify-between gap-2 border-t border-slate-100">
                    <span className="text-[11px] font-mono text-slate-400 truncate flex-1">{url}</span>
                    <button
                      onClick={() => handleCopy(url, i)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                      title="Copy URL"
                    >
                      {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
