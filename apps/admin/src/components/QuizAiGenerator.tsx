'use client';

import React, { useState } from 'react';
import type { Quiz } from '@quizmania/types';
import { convertQuizJsonToQuiz, type ImportSummary } from '@quizmania/quiz-schema';
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Code,
  ArrowDownToLine,
  Trash2,
  Bot
} from 'lucide-react';

export interface QuizAiGeneratorProps {
  onImport: (importedQuiz: Quiz, summary: ImportSummary) => void;
  existingQuizId?: string;
  defaultTitle?: string;
  defaultDescription?: string;
}

const SAMPLE_RAW_INPUT = `1. What is the capital of France?
Answer: Paris

2. Which planet is known as the Red Planet?
Answer: Mars

3. Which of the following are programming languages?
Answers: Python, JavaScript`;

export function QuizAiGenerator({
  onImport,
  existingQuizId,
  defaultTitle = '',
  defaultDescription = ''
}: QuizAiGeneratorProps) {
  const [rawInput, setRawInput] = useState('');
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [generatedJson, setGeneratedJson] = useState<string | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<ImportSummary | null>(null);
  const [copied, setCopied] = useState(false);
  const [imported, setImported] = useState(false);

  const [progressText, setProgressText] = useState<string | null>(null);

  const handleLoadSample = () => {
    setRawInput(SAMPLE_RAW_INPUT);
    if (!title) setTitle('General Knowledge AI Quiz');
    if (!description) setDescription('Quick trivia quiz generated from raw text using Ollama');
    setError(null);
    setValidationErrors([]);
  };

  const handleClear = () => {
    setRawInput('');
    setError(null);
    setValidationErrors([]);
    setGeneratedJson(null);
    setGeneratedQuiz(null);
    setGeneratedSummary(null);
    setImported(false);
    setProgressText(null);
  };

  const handleGenerate = async () => {
    if (!rawInput.trim()) {
      setError('Please paste questions and answers before generating.');
      return;
    }

    setIsGenerating(true);
    setProgressText('Preparing questions...');
    setError(null);
    setValidationErrors([]);
    setGeneratedJson(null);
    setGeneratedQuiz(null);
    setGeneratedSummary(null);
    setImported(false);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/x-ndjson, application/json'
        },
        body: JSON.stringify({
          input: rawInput,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          stream: true
        })
      });

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/x-ndjson') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalData: any = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const msg = JSON.parse(line);
              if (msg.type === 'progress') {
                setProgressText(msg.message);
              } else if (msg.type === 'complete') {
                finalData = msg;
              } else if (msg.type === 'error') {
                if (msg.validationErrors && Array.isArray(msg.validationErrors)) {
                  setValidationErrors(msg.validationErrors);
                }
                throw new Error(msg.error || 'Failed to generate quiz with AI');
              }
            } catch (e) {
              if (e instanceof Error && e.message.includes('Failed to generate')) {
                throw e;
              }
            }
          }
        }

        if (!finalData) {
          throw new Error('Incomplete response from AI generator.');
        }

        const rawQuiz = finalData.quiz || finalData.data;
        const conv = convertQuizJsonToQuiz(rawQuiz, existingQuizId);
        if (!conv.success || !conv.quiz || !conv.summary) {
          throw new Error(conv.errors && conv.errors.length > 0 ? conv.errors[0] : 'Failed to parse generated quiz');
        }

        setGeneratedJson(finalData.json || JSON.stringify(rawQuiz, null, 2));
        setGeneratedQuiz(conv.quiz);
        setGeneratedSummary(conv.summary);
        onImport(conv.quiz, conv.summary);
        setImported(true);
      } else {
        const data = await res.json();

        if (!res.ok || !data.success) {
          if (data.validationErrors && Array.isArray(data.validationErrors)) {
            setValidationErrors(data.validationErrors);
          }
          throw new Error(data.error || 'Failed to generate quiz with AI');
        }

        const rawQuiz = data.quiz || data.data;
        const conv = convertQuizJsonToQuiz(rawQuiz, existingQuizId);
        if (!conv.success || !conv.quiz || !conv.summary) {
          throw new Error(conv.errors && conv.errors.length > 0 ? conv.errors[0] : 'Failed to parse generated quiz');
        }

        setGeneratedJson(data.json || JSON.stringify(rawQuiz, null, 2));
        setGeneratedQuiz(conv.quiz);
        setGeneratedSummary(conv.summary);
        onImport(conv.quiz, conv.summary);
        setImported(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error during AI generation');
    } finally {
      setIsGenerating(false);
      setProgressText(null);
    }
  };

  const handleUseQuiz = () => {
    if (!generatedQuiz || !generatedSummary) return;
    onImport(generatedQuiz, generatedSummary);
    setImported(true);
  };

  const handleCopyJson = async () => {
    if (!generatedJson) return;
    try {
      await navigator.clipboard.writeText(generatedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Description / Instruction Banner */}
      <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <Bot className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">Local AI Conversion (Ollama): </span>
          Paste raw questions and answers from a document, lecture, or notes. The AI backend will structure and normalize them into the canonical QuizMania JSON format.
        </div>
      </div>

      {/* Optional Metadata Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Quiz Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Science & Capitals Trivia"
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-purple-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Short Description (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Questions covering general science and capitals"
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-purple-500 bg-white"
          />
        </div>
      </div>

      {/* Raw Text Textarea */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700">
            Paste questions and answers here <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1 text-[11px] text-purple-700 hover:text-purple-800 font-medium hover:underline"
            >
              <Sparkles className="w-3 h-3 text-purple-600" />
              Load Sample Text
            </button>
            {rawInput.trim() && (
              <>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        <textarea
          rows={8}
          value={rawInput}
          onChange={e => {
            setRawInput(e.target.value);
            if (error) setError(null);
          }}
          placeholder={`1. What is the capital of France?\nAnswer: Paris\n\n2. Which planet is known as the Red Planet?\nAnswer: Mars\n\n3. Which of the following are programming languages?\nAnswers: Python, JavaScript`}
          className="w-full font-mono text-xs border border-slate-200 rounded-lg p-3 text-slate-800 bg-slate-50/50 focus:outline-none focus:border-purple-500 focus:bg-white transition-colors"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-rose-800 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>AI Generation Error:</span>
          </div>
          <p className="text-rose-700 leading-relaxed pl-6">{error}</p>
          {validationErrors.length > 0 && (
            <ul className="list-disc list-inside text-rose-700 space-y-0.5 pl-6 font-mono text-[11px]">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Generate Button Row */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-[11px] text-slate-400">
          Powered by local Ollama backend. No questions leave your private environment.
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !rawInput.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{progressText || 'Generating Quiz with AI...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Quiz</span>
            </>
          )}
        </button>
      </div>

      {/* Generated JSON Preview Card */}
      {generatedJson && (
        <div className="mt-6 border border-purple-200 bg-purple-50/30 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-800 text-xs">
                Generated Quiz JSON ({generatedSummary?.questionsCount || 0} Questions)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>

              <button
                type="button"
                onClick={handleUseQuiz}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors shadow-xs ${
                  imported ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>{imported ? 'Imported! Click to Re-import' : 'Use This Quiz / Import'}</span>
              </button>
            </div>
          </div>

          {/* JSON code view */}
          <div className="relative">
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-72 leading-relaxed">
              {generatedJson}
            </pre>
          </div>

          {imported && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-900 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>
                Successfully loaded into editor! Scroll down to review, edit questions, and save draft.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
