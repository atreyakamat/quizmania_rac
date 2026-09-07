import { getDefaultOllamaConfig, generateWithOllama, extractJsonFromOllamaResponse, OllamaConfig } from './service';
import { 
  QUIZMANIA_RAW_TEXT_SYSTEM_PROMPT, 
  buildRawTextConversionPrompt, 
  buildChunkQuestionsPrompt, 
  buildGenerationPrompt 
} from './prompts';
import { splitIntoQuestionChunks, getChunkMaxChars } from './chunker';
import { validateQuizJson, convertQuizJsonToQuiz, type ImportSummary } from '@quizmania/quiz-schema';
import type { Quiz } from '@quizmania/types';

export interface QuizGenerationProgress {
  current: number;
  total: number;
  message: string;
}

export interface QuizGenerationPipelineInput {
  input: string;
  title?: string;
  description?: string;
  instructions?: string;
  mode?: 'convert' | 'generate_from_topic' | 'add_distractors';
  onProgress?: (progress: QuizGenerationProgress) => void;
}

export interface QuizGenerationPipelineResult {
  success: boolean;
  data?: any;
  quiz?: Quiz;
  summary?: ImportSummary;
  json?: string;
  questionCount?: number;
  chunksCount?: number;
  error?: string;
  validationErrors?: string[];
  stage?: string;
}

interface ChunkResult {
  title?: string;
  description?: string;
  questions: any[];
  settings?: any;
  sections?: any[];
  rawResponse?: string;
}

function isGenericTitle(title?: string): boolean {
  if (!title) return true;
  const lower = title.toLowerCase().trim();
  return (
    lower === 'quiz' ||
    lower === 'quiz title' ||
    lower === 'untitled quiz' ||
    lower === 'generated quiz' ||
    lower === 'new quiz'
  );
}

/**
 * Executes a single chunk with retry logic (retry once on malformed response).
 */
async function processChunkWithRetry(
  prompt: string,
  systemPrompt: string,
  config: OllamaConfig,
  chunkIndex: number,
  totalChunks: number
): Promise<ChunkResult> {
  let lastError = '';
  let lastRawResponse = '';

  for (let attempt = 1; attempt <= 2; attempt++) {
    const genResult = await generateWithOllama(prompt, systemPrompt, config);
    if (!genResult.success || !genResult.rawResponse) {
      lastError = genResult.error || 'Ollama connection failed or timed out';
      continue;
    }

    lastRawResponse = genResult.rawResponse;
    const jsonStr = extractJsonFromOllamaResponse(genResult.rawResponse);
    if (!jsonStr) {
      lastError = 'Could not extract valid JSON from AI response';
      continue;
    }

    try {
      const parsed = JSON.parse(jsonStr);
      let questions: any[] = [];

      if (Array.isArray(parsed.questions)) {
        questions = parsed.questions;
      } else if (Array.isArray(parsed)) {
        questions = parsed;
      } else if (chunkIndex === 1 && parsed.title) {
        // First chunk might have metadata even if empty questions
        questions = [];
      } else {
        lastError = 'AI response did not contain a valid questions list';
        continue;
      }

      return {
        title: parsed.title,
        description: parsed.description,
        questions,
        settings: parsed.settings,
        sections: parsed.sections,
        rawResponse: genResult.rawResponse,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'JSON parse error';
      continue;
    }
  }

  throw new Error(`AI generation failed for question batch ${chunkIndex} of ${totalChunks}. Please retry. (${lastError})`);
}

/**
 * Deterministically merges chunk results into a complete quiz definition.
 */
export function mergeChunkResults(
  chunkResults: ChunkResult[],
  userTitle?: string,
  userDescription?: string
): any {
  // 1. Merge questions sequentially
  const allQuestions: any[] = [];
  for (const cr of chunkResults) {
    if (Array.isArray(cr.questions)) {
      allQuestions.push(...cr.questions);
    }
  }

  // 2. Re-index IDs sequentially 1, 2, 3...
  allQuestions.forEach((q, idx) => {
    if (typeof q === 'object' && q !== null) {
      q.id = idx + 1;
    }
  });

  // 3. Deterministic Title resolution
  let mergedTitle = userTitle?.trim() || '';
  if (!mergedTitle) {
    for (const cr of chunkResults) {
      if (cr.title && !isGenericTitle(cr.title)) {
        mergedTitle = cr.title.trim();
        break;
      }
    }
    if (!mergedTitle && chunkResults[0]?.title?.trim()) {
      mergedTitle = chunkResults[0].title.trim();
    }
  }
  if (!mergedTitle) {
    mergedTitle = 'Generated Quiz';
  }

  // 4. Deterministic Description resolution
  let mergedDescription = userDescription?.trim() || '';
  if (!mergedDescription) {
    for (const cr of chunkResults) {
      if (cr.description?.trim()) {
        mergedDescription = cr.description.trim();
        break;
      }
    }
  }

  // 5. Deterministic Sections resolution
  const sectionMap = new Map<string, any>();
  for (const cr of chunkResults) {
    if (Array.isArray(cr.sections)) {
      for (const sec of cr.sections) {
        if (sec && sec.title && !sectionMap.has(sec.title.trim().toLowerCase())) {
          sectionMap.set(sec.title.trim().toLowerCase(), sec);
        }
      }
    }
  }
  const mergedSections = Array.from(sectionMap.values());

  // 6. Deterministic Settings resolution
  let mergedSettings: any = {};
  for (const cr of chunkResults) {
    if (cr.settings && typeof cr.settings === 'object') {
      mergedSettings = { ...mergedSettings, ...cr.settings };
    }
  }

  const mergedQuiz: any = {
    title: mergedTitle,
    description: mergedDescription,
    questions: allQuestions,
  };

  if (mergedSections.length > 0) {
    mergedQuiz.sections = mergedSections;
  }
  if (Object.keys(mergedSettings).length > 0) {
    mergedQuiz.settings = mergedSettings;
  }

  return mergedQuiz;
}

/**
 * High-level orchestration pipeline for Ollama Quiz Generation.
 */
export async function runQuizGenerationPipeline(
  params: QuizGenerationPipelineInput
): Promise<QuizGenerationPipelineResult> {
  const rawContent = params.input.trim();
  if (!rawContent) {
    return {
      success: false,
      error: 'Please paste questions and answers to generate a quiz.',
      stage: 'validation'
    };
  }

  const config = getDefaultOllamaConfig();
  if (!config.enabled) {
    return {
      success: false,
      error: 'AI generation is currently disabled. Set OLLAMA_ENABLED=true in apps/admin/.env.local and ensure Ollama is running.',
      stage: 'disabled'
    };
  }

  const maxChars = getChunkMaxChars();
  const chunks = splitIntoQuestionChunks(rawContent, maxChars);

  console.log(`[QuizAI] Input length: ${rawContent.length} chars | Chunks: ${chunks.length} | Max chunk: ${maxChars}`);
  chunks.forEach((c, idx) => {
    console.log(`[QuizAI] Chunk ${idx + 1}/${chunks.length}: ${c.length} chars`);
  });

  const systemPrompt = QUIZMANIA_RAW_TEXT_SYSTEM_PROMPT;
  const chunkResults: ChunkResult[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkIndex = i + 1;
    const progressMessage = `Processing question batch ${chunkIndex} of ${chunks.length}`;
    params.onProgress?.({
      current: chunkIndex,
      total: chunks.length,
      message: progressMessage
    });

    let prompt: string;
    if (chunks.length === 1 && params.mode && params.mode !== 'convert') {
      prompt = buildGenerationPrompt({
        sourceContent: chunks[i],
        instructions: params.instructions,
        mode: params.mode,
      });
    } else if (i === 0) {
      prompt = buildRawTextConversionPrompt({
        input: chunks[i],
        title: params.title,
        description: params.description,
      });
    } else {
      prompt = buildChunkQuestionsPrompt({
        input: chunks[i],
        chunkIndex,
        totalChunks: chunks.length,
      });
    }

    try {
      const result = await processChunkWithRetry(
        prompt,
        systemPrompt,
        config,
        chunkIndex,
        chunks.length
      );
      chunkResults.push(result);
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : `AI generation failed on batch ${chunkIndex}`,
        stage: 'ollama_call',
        chunksCount: chunks.length
      };
    }
  }

  // Deterministically merge all chunk outputs
  const mergedQuizObj = mergeChunkResults(chunkResults, params.title, params.description);

  // Validate with canonical QuizMania schema
  const validation = validateQuizJson(mergedQuizObj);
  if (!validation.success || !validation.data) {
    return {
      success: false,
      error: 'Generated JSON failed QuizMania schema validation.',
      validationErrors: validation.errors,
      data: mergedQuizObj,
      json: JSON.stringify(mergedQuizObj, null, 2),
      stage: 'validate'
    };
  }

  // Convert to internal Quiz domain model
  const conversion = convertQuizJsonToQuiz(mergedQuizObj);
  if (!conversion.success || !conversion.quiz) {
    return {
      success: false,
      error: 'Failed to normalize generated quiz into internal Quiz format.',
      validationErrors: conversion.errors,
      json: JSON.stringify(mergedQuizObj, null, 2),
      stage: 'convert'
    };
  }

  return {
    success: true,
    data: validation.data,
    quiz: conversion.quiz,
    summary: conversion.summary,
    json: JSON.stringify(validation.data, null, 2),
    questionCount: conversion.summary?.questionsCount || 0,
    chunksCount: chunks.length
  };
}
