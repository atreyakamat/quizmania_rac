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

function isUnavailableError(err: string): boolean {
  const lower = err.toLowerCase();
  return (
    lower.includes('connect') ||
    lower.includes('timed out') ||
    lower.includes('timeout') ||
    lower.includes('unavailable') ||
    lower.includes('econnrefused') ||
    lower.includes('fetch failed') ||
    lower.includes('abort')
  );
}

/**
 * Executes a single chunk with retry logic (retry once on malformed response).
 */
function parseChunkQuestions(parsed: any, chunkIndex: number): any[] | null {
  if (Array.isArray(parsed.questions)) {
    return parsed.questions;
  }
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (chunkIndex === 1 && parsed.title) {
    return [];
  }
  return null;
}

async function tryExecuteChunkGeneration(
  prompt: string,
  systemPrompt: string,
  config: OllamaConfig,
  chunkIndex: number
): Promise<{ success: boolean; result?: ChunkResult; error?: string }> {
  const genResult = await generateWithOllama(prompt, systemPrompt, config);
  if (!genResult.success || !genResult.rawResponse) {
    return { success: false, error: genResult.error || 'Ollama connection failed or timed out' };
  }

  const jsonStr = extractJsonFromOllamaResponse(genResult.rawResponse);
  if (!jsonStr) {
    return { success: false, error: 'Could not extract valid JSON from AI response' };
  }

  try {
    const parsed = JSON.parse(jsonStr);
    const questions = parseChunkQuestions(parsed, chunkIndex);
    if (!questions) {
      return { success: false, error: 'AI response did not contain a valid questions list' };
    }

    return {
      success: true,
      result: {
        title: parsed.title,
        description: parsed.description,
        questions,
        settings: parsed.settings,
        sections: parsed.sections,
        rawResponse: genResult.rawResponse,
      }
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'JSON parse error' };
  }
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

  for (let attempt = 1; attempt <= 2; attempt++) {
    const executed = await tryExecuteChunkGeneration(prompt, systemPrompt, config, chunkIndex);
    if (executed.success && executed.result) {
      return executed.result;
    }
    lastError = executed.error || 'Unknown chunk execution error';
  }

  if (isUnavailableError(lastError)) {
    throw new Error('Ollama is unavailable. Make sure Ollama is running and the configured model is installed.');
  }

  throw new Error('AI returned invalid quiz JSON. Please try again or edit the input.');
}

function resolveMergedTitle(chunkResults: ChunkResult[], userTitle?: string): string {
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
  return mergedTitle || 'Generated Quiz';
}

function resolveMergedDescription(chunkResults: ChunkResult[], userDescription?: string): string {
  let mergedDescription = userDescription?.trim() || '';
  if (!mergedDescription) {
    for (const cr of chunkResults) {
      if (cr.description?.trim()) {
        mergedDescription = cr.description.trim();
        break;
      }
    }
  }
  return mergedDescription;
}

function resolveMergedSections(chunkResults: ChunkResult[]): any[] {
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
  return Array.from(sectionMap.values());
}

function resolveMergedSettings(chunkResults: ChunkResult[]): any {
  let mergedSettings: any = {};
  for (const cr of chunkResults) {
    if (cr.settings && typeof cr.settings === 'object') {
      mergedSettings = { ...mergedSettings, ...cr.settings };
    }
  }
  return mergedSettings;
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

  const mergedQuiz: any = {
    title: resolveMergedTitle(chunkResults, userTitle),
    description: resolveMergedDescription(chunkResults, userDescription),
    questions: allQuestions,
  };

  const mergedSections = resolveMergedSections(chunkResults);
  if (mergedSections.length > 0) {
    mergedQuiz.sections = mergedSections;
  }

  const mergedSettings = resolveMergedSettings(chunkResults);
  if (Object.keys(mergedSettings).length > 0) {
    mergedQuiz.settings = mergedSettings;
  }

  return mergedQuiz;
}

function buildPromptForChunk(
  params: QuizGenerationPipelineInput,
  chunk: string,
  chunkIndex: number,
  totalChunks: number
): string {
  if (totalChunks === 1 && params.mode && params.mode !== 'convert') {
    return buildGenerationPrompt({
      sourceContent: chunk,
      instructions: params.instructions,
      mode: params.mode,
    });
  }
  if (chunkIndex === 1) {
    return buildRawTextConversionPrompt({
      input: chunk,
      title: params.title,
      description: params.description,
    });
  }
  return buildChunkQuestionsPrompt({
    input: chunk,
    chunkIndex,
    totalChunks,
  });
}

async function processAllChunks(
  chunks: string[],
  params: QuizGenerationPipelineInput,
  config: OllamaConfig
): Promise<{ success: boolean; chunkResults?: ChunkResult[]; error?: string; stage?: string }> {
  const chunkResults: ChunkResult[] = [];
  const systemPrompt = QUIZMANIA_RAW_TEXT_SYSTEM_PROMPT;

  for (let i = 0; i < chunks.length; i++) {
    const chunkIndex = i + 1;
    params.onProgress?.({
      current: chunkIndex,
      total: chunks.length,
      message: `Processing question batch ${chunkIndex} of ${chunks.length}`
    });

    const prompt = buildPromptForChunk(params, chunks[i], chunkIndex, chunks.length);

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
      const errMsg = err instanceof Error ? err.message : '';
      const isUnavailable = isUnavailableError(errMsg);
      return {
        success: false,
        error: isUnavailable
          ? 'Ollama is unavailable. Make sure Ollama is running and the configured model is installed.'
          : 'AI returned invalid quiz JSON. Please try again or edit the input.',
        stage: 'ollama_call'
      };
    }
  }

  return { success: true, chunkResults };
}

/**
 * High-level orchestration pipeline for Ollama Quiz Generation.
 */
export async function runQuizGenerationPipeline(
  params: QuizGenerationPipelineInput,
  configOverride?: OllamaConfig
): Promise<QuizGenerationPipelineResult> {
  const rawContent = params.input.trim();
  if (!rawContent) {
    return {
      success: false,
      error: 'Please paste questions and answers to generate a quiz.',
      stage: 'validation'
    };
  }

  const config = configOverride || getDefaultOllamaConfig();
  if (!config.enabled) {
    return {
      success: false,
      error: 'Ollama AI generation is currently disabled.',
      stage: 'disabled'
    };
  }

  const maxChars = getChunkMaxChars();
  const chunks = splitIntoQuestionChunks(rawContent, maxChars);

  console.log(`[QuizAI] Input length: ${rawContent.length} chars | Chunks: ${chunks.length} | Max chunk: ${maxChars}`);
  chunks.forEach((c, idx) => {
    console.log(`[QuizAI] Chunk ${idx + 1}/${chunks.length}: ${c.length} chars`);
  });

  const processed = await processAllChunks(chunks, params, config);
  if (!processed.success || !processed.chunkResults) {
    return {
      success: false,
      error: processed.error || 'Failed to process chunks',
      stage: processed.stage || 'ollama_call',
      chunksCount: chunks.length
    };
  }

  // Deterministically merge all chunk outputs
  const mergedQuizObj = mergeChunkResults(processed.chunkResults, params.title, params.description);

  // Validate with canonical QuizMania schema
  const validation = validateQuizJson(mergedQuizObj);
  if (!validation.success || !validation.data) {
    return {
      success: false,
      error: 'AI returned invalid quiz JSON. Please try again or edit the input.',
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
      error: 'AI returned invalid quiz JSON. Please try again or edit the input.',
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

export const executeQuizGenerationPipeline = runQuizGenerationPipeline;

