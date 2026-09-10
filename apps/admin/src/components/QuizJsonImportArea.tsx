'use client';

import React, { useState, useRef } from 'react';
import type { Quiz } from '@quizmania/types';
import { convertQuizJsonToQuiz, EXAMPLE_IMPORT_JSON, type ImportSummary } from '@quizmania/quiz-schema';
import { QuizAiGenerator } from './QuizAiGenerator';
import {
  FileCode,
  UploadCloud,
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Trash2,
  X,
  ArrowDownToLine,
  Bot
} from 'lucide-react';

export interface QuizJsonImportAreaProps {
  onImport: (importedQuiz: Quiz, summary: ImportSummary) => void;
  existingQuizId?: string;
  defaultExpanded?: boolean;
}

function ValidationErrorsAlert({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
      <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs">
        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
        <span>JSON Validation Failed ({errors.length} {errors.length === 1 ? 'error' : 'errors'} found):</span>
      </div>
      <ul className="list-disc list-inside text-xs text-rose-700 space-y-1 pl-2 font-mono">
        {errors.map((err, i) => (
          <li key={i} className="break-words leading-relaxed">{err}</li>
        ))}
      </ul>
      <p className="text-[11px] text-rose-600 italic pt-1">
        Your existing form data was not modified. Fix the issues above and try importing again.
      </p>
    </div>
  );
}

function ImportSummaryAlert({ summary, onDismiss }: { summary: ImportSummary; onDismiss: () => void }) {
  return (
    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-3 text-xs text-emerald-800">
      <div className="flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-emerald-900">
            Imported successfully: {summary.questionsCount} questions, {summary.optionsCount} options
            {summary.sectionsCount > 0 ? `, ${summary.sectionsCount} sections` : ''}!
          </p>
          <p className="text-emerald-700 text-[11px]">
            The quiz details, questions, and settings have been populated into the editor below. You can review and make edits before saving.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-emerald-700 hover:text-emerald-900 p-1 rounded-md hover:bg-emerald-100 transition-colors"
        title="Dismiss message"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

interface DirectJsonImportTabProps {
  jsonText: string;
  setJsonText: (text: string) => void;
  validationErrors: string[];
  setValidationErrors: (errors: string[]) => void;
  importSummary: ImportSummary | null;
  setImportSummary: (summary: ImportSummary | null) => void;
  handleClear: () => void;
  handleImport: () => void;
  isImporting: boolean;
}

function DirectJsonImportTab({
  jsonText,
  setJsonText,
  validationErrors,
  setValidationErrors,
  importSummary,
  setImportSummary,
  handleClear,
  handleImport,
  isImporting
}: DirectJsonImportTabProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <label htmlFor="quiz-json-textarea" className="font-semibold text-slate-700">
            JSON Content
          </label>
          <span className="text-[11px] text-slate-400">
            Supports single choice, multiple choice, true/false, short text, paragraph, & settings
          </span>
        </div>
        <textarea
          id="quiz-json-textarea"
          rows={9}
          value={jsonText}
          onChange={e => {
            setJsonText(e.target.value);
            if (validationErrors.length > 0) setValidationErrors([]);
          }}
          placeholder={`{\n  "title": "Nutrition Awareness Quiz",\n  "description": "Weekly nutrition awareness quiz by Rotaract Mapusa",\n  "settings": { "timeLimitMinutes": 15, "passingScorePercentage": 60 },\n  "questions": [\n    {\n      "id": 1,\n      "question": "Which vitamin is synthesized by sunlight?",\n      "type": "single_choice",\n      "marks": 5,\n      "options": [\n        { "id": "a", "text": "Vitamin A", "correct": false },\n        { "id": "b", "text": "Vitamin D", "correct": true }\n      ]\n    }\n  ]\n}`}
          className="w-full font-mono text-xs border border-slate-200 rounded-lg p-3 text-slate-800 bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
        />
      </div>

      <ValidationErrorsAlert errors={validationErrors} />

      {importSummary && (
        <ImportSummaryAlert summary={importSummary} onDismiss={() => setImportSummary(null)} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {jsonText.trim() && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Input</span>
            </button>
          )}
          <span className="text-[11px] text-slate-400">
            Populates form below without saving directly to database.
          </span>
        </div>

        <button
          type="button"
          onClick={handleImport}
          disabled={isImporting || !jsonText.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>{isImporting ? 'Validating & Importing...' : 'Import JSON into Quiz'}</span>
        </button>
      </div>
    </div>
  );
}

export function QuizJsonImportArea({
  onImport,
  existingQuizId,
  defaultExpanded = true
}: QuizJsonImportAreaProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'ai'>('import');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [jsonText, setJsonText] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [copied, setCopied] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      setJsonText(content || '');
      setValidationErrors([]);
      setImportSummary(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadExample = () => {
    setJsonText(EXAMPLE_IMPORT_JSON);
    setValidationErrors([]);
    setImportSummary(null);
  };

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(EXAMPLE_IMPORT_JSON);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleClear = () => {
    setJsonText('');
    setValidationErrors([]);
    setImportSummary(null);
  };

  const handleImport = () => {
    if (!jsonText.trim()) {
      setValidationErrors(['Please paste JSON or upload a .json file before importing.']);
      return;
    }

    setIsImporting(true);
    setValidationErrors([]);

    try {
      const result = convertQuizJsonToQuiz(jsonText, existingQuizId);

      if (!result.success || !result.quiz || !result.summary) {
        setValidationErrors(result.errors && result.errors.length > 0 ? result.errors : ['Failed to parse and validate quiz JSON.']);
        setImportSummary(null);
        return;
      }

      setValidationErrors([]);
      setImportSummary(result.summary);
      onImport(result.quiz, result.summary);
    } catch (err) {
      setValidationErrors([err instanceof Error ? err.message : 'An unexpected error occurred during import.']);
      setImportSummary(null);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Header */}
      <div className="p-5 flex flex-wrap items-center justify-between gap-4 bg-slate-50/60 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
            activeTab === 'ai' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-burgundy-50 border-burgundy-100 text-burgundy-700'
          }`}>
            {activeTab === 'ai' ? <Bot className="w-5 h-5 text-purple-600" /> : <FileCode className="w-5 h-5 text-burgundy-700" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm md:text-base">
                {activeTab === 'ai' ? 'Generate with AI' : 'Import from JSON'}
              </h3>
              <span className={`text-[11px] font-semibold border px-2 py-0.5 rounded-full ${
                activeTab === 'ai'
                  ? 'text-purple-700 bg-purple-50 border-purple-200'
                  : 'text-burgundy-700 bg-burgundy-50 border-burgundy-200'
              }`}>
                {activeTab === 'ai' ? 'Ollama Powered' : 'Direct JSON'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'ai'
                ? 'Paste raw questions and answers below and Ollama will automatically generate standard QuizMania JSON.'
                : 'Paste or upload a JSON quiz file to automatically populate title, questions, options, and settings.'}
            </p>
          </div>
        </div>

        {/* Tab Selector & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('import')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'import'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-burgundy-700" />
              <span>Import JSON</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'ai'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Generate with AI</span>
            </button>
          </div>

          {activeTab === 'import' && (
            <div className="flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileUpload}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
                title="Upload .json file from your computer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                <span>Upload JSON</span>
              </button>

              <button
                type="button"
                onClick={handleLoadExample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors shadow-2xs"
                title="Load standard example template"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Load Example</span>
              </button>

              <button
                type="button"
                onClick={handleCopyTemplate}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
                title="Copy example JSON template to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors ml-1"
            title={isExpanded ? 'Collapse Area' : 'Expand Area'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-6">
          {activeTab === 'ai' ? (
            <QuizAiGenerator
              onImport={onImport}
              existingQuizId={existingQuizId}
            />
          ) : (
            <DirectJsonImportTab
              jsonText={jsonText}
              setJsonText={setJsonText}
              validationErrors={validationErrors}
              setValidationErrors={setValidationErrors}
              importSummary={importSummary}
              setImportSummary={setImportSummary}
              handleClear={handleClear}
              handleImport={handleImport}
              isImporting={isImporting}
            />
          )}
        </div>
      )}
    </div>
  );
}
