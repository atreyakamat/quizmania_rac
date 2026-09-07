'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, AlertCircle, CheckCircle, Loader2, Brain, Zap, ArrowRight, FileText } from 'lucide-react';
import type { QuizJsonImportFormat } from '@quizmania/types';
import { AdminHeader } from '@/components/AdminHeader';

export default function AIPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('checking');
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  const [sourceContent, setSourceContent] = useState('');
  const [instructions, setInstructions] = useState('');
  const [mode, setMode] = useState<'convert' | 'generate_from_topic' | 'add_distractors'>('convert');
  
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isEnabled = localStorage.getItem('quizmania_ai_enabled') === 'true';
    setEnabled(isEnabled);
    
    if (isEnabled) {
      checkConnection();
    } else {
      setStatus('disabled');
      setStatusMessage('AI generation is disabled. Enable it in Settings.');
    }
  }, []);

  const checkConnection = async () => {
    try {
      const res = await fetch('/api/ai/test');
      const data = await res.json();
      setStatus(data.status);
      setStatusMessage(data.message);
    } catch (err) {
      setStatus('unavailable');
      setStatusMessage('Failed to connect to AI service');
    }
  };

  const handleGenerate = async () => {
    if (!sourceContent.trim()) {
      setError('Source content is required');
      return;
    }
    
    setGenerating(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceContent, instructions, mode }),
      });
      
      const data = await res.json();
      
      if (!data.success) {
        setError(data.error || 'Generation failed');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('An unexpected error occurred during generation');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!result?.data) return;
    
    try {
      const res = await fetch('/api/quizzes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: result.data })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create draft');
      }
      router.push(`/quizzes/${data.quiz.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create draft');
    }
  };

  return (
    <div>
      <AdminHeader
        title="AI Quiz Generator"
        subtitle="Transform content into QuizMania JSON using local Ollama AI"
      />

      <div className="p-8 max-w-5xl mx-auto space-y-8">
        {!enabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-amber-500" />
            <div>
              <h3 className="text-lg font-bold text-amber-800">AI is Disabled</h3>
              <p className="text-amber-700 max-w-md mx-auto mt-2">
                The Ollama AI integration is currently turned off. You need to enable it in the system settings before you can generate quizzes.
              </p>
            </div>
            <button
              onClick={() => router.push('/settings')}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors"
            >
              Go to Settings
            </button>
          </div>
        )}

        {enabled && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    Generation Setup
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Status:</span>
                    {status === 'checking' && <Loader2 className="w-3 h-3 animate-spin text-slate-500" />}
                    {status === 'connected' && <span className="text-emerald-600 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Connected</span>}
                    {status !== 'checking' && status !== 'connected' && <span className="text-amber-600 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {status}</span>}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mode</label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as any)}
                      className="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    >
                      <option value="convert">Convert Q&A to Quiz</option>
                      <option value="generate_from_topic">Generate from Topic</option>
                      <option value="add_distractors">Add Distractors to Q&A</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Source Content</label>
                    <textarea
                      value={sourceContent}
                      onChange={(e) => setSourceContent(e.target.value)}
                      placeholder="Paste your questions, answers, or topic here..."
                      className="w-full text-sm border-slate-200 rounded-lg p-3 h-48 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Additional Instructions (Optional)</label>
                    <input
                      type="text"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="e.g. Make it suitable for 10-year-olds"
                      className="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    />
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={generating || status !== 'connected'}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Quiz...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Quiz JSON
                      </>
                    )}
                  </button>
                  {status !== 'connected' && status !== 'checking' && (
                    <p className="text-xs text-amber-600 mt-2 text-center">{statusMessage}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs h-full flex flex-col">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Results
                </h3>

                {error && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm mb-4">
                    <p className="font-bold flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4" /> Generation Error</p>
                    <p>{error}</p>
                  </div>
                )}

                {!result && !generating && !error && (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3">
                    <FileText className="w-12 h-12 text-slate-200" />
                    <p className="text-sm">Generated quiz will appear here</p>
                  </div>
                )}

                {generating && (
                  <div className="flex-1 flex flex-col items-center justify-center text-purple-600 space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-200" />
                    <div className="text-center">
                      <p className="font-bold">AI is thinking...</p>
                      <p className="text-xs text-slate-500 mt-1">This may take 10-30 seconds depending on the model.</p>
                    </div>
                  </div>
                )}

                {result && result.success && (
                  <div className="flex-1 flex flex-col">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="block text-xs font-semibold text-slate-500 uppercase">Questions</span>
                        <span className="text-xl font-black text-slate-800">{result.questionCount}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="block text-xs font-semibold text-slate-500 uppercase">Status</span>
                        <span className="text-sm font-bold text-emerald-600 flex items-center gap-1 mt-1">
                          <CheckCircle className="w-4 h-4" /> Valid JSON
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg mb-6 max-h-64">
                      <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 sticky top-0">
                        Preview Questions
                      </div>
                      <ul className="divide-y divide-slate-100">
                        {result.data.questions?.map((q: any, i: number) => (
                          <li key={i} className="p-3 text-sm text-slate-700">
                            <span className="font-bold text-slate-400 mr-2">{i + 1}.</span>
                            {q.question}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={handleCreateDraft}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors mt-auto"
                    >
                      Create Draft Quiz
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
