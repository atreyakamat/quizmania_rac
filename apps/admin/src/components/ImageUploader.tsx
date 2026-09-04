'use client';

import React, { useState } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadImage, StorageBucket } from '@quizmania/shared';

interface ImageUploaderProps {
  bucket: StorageBucket;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  label?: string;
}

export function ImageUploader({ bucket, currentUrl, onUploaded, label = 'Upload Image' }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const res = await uploadImage(bucket, file, file.name);
      if (res.success && res.url) {
        onUploaded(res.url);
      } else {
        setError(res.error || 'Failed to upload image');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700">{label}</label>
      <div className="flex items-center gap-4">
        {currentUrl ? (
          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0 group">
            <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs">
              Replace
            </div>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50 flex-shrink-0">
            <ImageIcon className="w-6 h-6 mb-1" />
            <span className="text-[10px]">None</span>
          </div>
        )}

        <div className="flex-1">
          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors">
            <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
            <span>{isUploading ? 'Uploading...' : 'Choose File'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
          <p className="text-[11px] text-slate-400 mt-1">
            Target bucket: <span className="font-mono text-slate-600">{bucket}</span>
          </p>
          {error && (
            <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
