'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateQuizJson } from '@quizmania/quiz-schema';
import { importQuizFromJson } from '@quizmania/shared';
import { FileUp, AlertTriangle, CheckCircle, Code, Sparkles } from 'lucide-react';

const SAMPLE_QUIZ_JSON = `{
  "title": "Nutrition Week Quiz",
  "slug": "nutrition-week-2026",
  "description": "Test your knowledge about nutrition.",
  "status": "draft",
  "theme": {
    "name": "Nature Green",
    "primaryColor": "#2E7D32",
    "secondaryColor": "#81C784",
    "backgroundColor": "#F1F8E9",
    "surfaceColor": "#FFFFFF",
    "textColor": "#1A1A1A"
  },
  "coverImage": null,
  "questions": [
    {
      "id": "q1",
      "question": "Which nutrient is important for building muscles?",
      "type": "single_choice",
      "required": true,
      "marks": 5,
      "image": null,
      "options": [
        {
          "id": "a",
          "text": "Carbohydrates",
          "correct": false
        },
        {
          "id": "b",
          "text": "Protein",
          "correct": true
        },
        {
          "id": "c",
          "text": "Vitamins",
          "correct": false
        },
        {
          "id": "d",
          "text": "Water",
          "correct": false
        }
      ]
    }
  ]
}`;

export function JsonImporter({ onImportSuccess }: { onImportSuccess?: (quizId: string) => void }) {
  const router = useRouter();
  const [jsonText, setJsonText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      setJsonText(content);
      setErrors([]);
    };
    reader.readAsText(file);
  };

  const handleValidateAndImport = async () => {
    setErrors([]);
    setSuccessMessage(null);

    const validation = validateQuizJson(jsonText);
    if (!validation.success || !validation.data) {
      setErrors(validation.errors || ['Validation failed']);
      return;
    }

    setIsSubmitting(true);
    try {
      const createdQuiz = await importQuizFromJson(validation.data);
      setSuccessMessage(`Successfully imported quiz: "${createdQuiz.title}" (${createdQuiz.slug})`);
      if (onImportSuccess) {
        onImportSuccess(createdQuiz.id);
      } else {
        setTimeout(() => {
          router.push(`/quizzes/${createdQuiz.id}/edit`);
        }, 1200);
      }
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to import quiz']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <FileUp className="w-5 h-5 text-blue-600" />
            Import Quiz from JSON
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Upload or paste standard Quiz JSON. Validated with Zod schema before saving.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setJsonText(SAMPLE_QUIZ_JSON)}
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Load Sample JSON
        </button>
      </div>

      {/* File upload shortcut */}
      <div>
        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          <Code className="w-4 h-4 text-slate-500" />
          <span>Upload .json File</span>
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {/* JSON text area */}
      <div>
        <textarea
          rows={12}
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
          placeholder={`Paste JSON here...\n{\n  "title": "My Quiz",\n  "slug": "my-quiz",\n  "questions": [...]\n}`}
          className="w-full font-mono text-xs border border-slate-200 rounded-lg p-3 text-slate-800 bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:bg-white"
        />
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Validation Errors ({errors.length}):
          </div>
          <ul className="list-disc list-inside text-xs text-rose-600 space-y-0.5 pl-2 font-mono">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success alert */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleValidateAndImport}
        disabled={isSubmitting || !jsonText.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-xs transition-colors shadow-xs"
      >
        {isSubmitting ? 'Validating & Importing...' : 'Validate & Import Quiz'}
      </button>
    </div>
  );
}
