/**
 * Hard-bounded Question Chunker for Ollama
 * 
 * Protects small-context LLMs (such as llama3.2:3b with ~4k tokens) by strictly
 * guaranteeing that no single input chunk exceeds the configured character limit (default: 1000).
 *
 * Rules:
 * 1. Hard maximum = 1000 characters (configurable via OLLAMA_CHUNK_MAX_CHARS or param).
 * 2. Look for the nearest safe question boundary before the limit.
 * 3. If found, split there.
 * 4. If no safe boundary exists, use the hard limit.
 * 5. Continue from the exact next character.
 * 6. Never overlap characters.
 * 7. Never skip characters.
 * 8. Never create an unbounded >1000 character chunk.
 */

export const DEFAULT_CHUNK_MAX_CHARS = 1000;

export function getChunkMaxChars(): number {
  if (typeof process !== 'undefined' && process.env.OLLAMA_CHUNK_MAX_CHARS) {
    const parsed = parseInt(process.env.OLLAMA_CHUNK_MAX_CHARS, 10);
    if (!isNaN(parsed) && parsed > 100) {
      return parsed;
    }
  }
  return DEFAULT_CHUNK_MAX_CHARS;
}

function findLastRegexBoundary(regex: RegExp, slice: string, maxChars: number): number {
  let match: RegExpExecArray | null;
  let lastBoundary = -1;
  while ((match = regex.exec(slice)) !== null) {
    if (match.index > 0 && match.index < maxChars) {
      lastBoundary = match.index;
    }
  }
  return lastBoundary;
}

/**
 * Searches for the nearest safe question boundary strictly before maxChars.
 * Returns the character index within slice where the next chunk should start.
 */
export function findSafeQuestionBoundary(slice: string, maxChars: number): number {
  if (slice.length <= maxChars) {
    return slice.length;
  }

  const minAcceptableBoundary = Math.min(100, Math.floor(maxChars * 0.1));

  // 1. Primary: Question boundary preceded by newline(s)
  const questionBoundary = findLastRegexBoundary(
    /\n+(?=(?:---\s*\n+)?(?:\*\*)?(?:###\s*)?(?:Question\s*\d+|Q\d+[\.:\s]|\d+[\.\)])\s+)/gi,
    slice,
    maxChars
  );
  if (questionBoundary >= minAcceptableBoundary) {
    return questionBoundary;
  }

  // 2. Secondary fallback: Blank line boundary (double newline)
  const paragraphBoundary = findLastRegexBoundary(/\n\s*\n+/g, slice, maxChars);
  if (paragraphBoundary >= minAcceptableBoundary) {
    return paragraphBoundary;
  }

  // 3. Tertiary fallback: Newline that does not split inside option lists or Answer lines
  const safeNewlineBoundary = findLastRegexBoundary(
    /\n(?!\s*(?:[A-Za-z0-9][\.\)]|(?:Correct\s+)?Answer|Accepted|Explanation):?\s*)/gi,
    slice,
    maxChars
  );
  if (safeNewlineBoundary >= minAcceptableBoundary) {
    return safeNewlineBoundary;
  }

  // 4. Any newline before limit
  const anyNewline = slice.lastIndexOf('\n', maxChars - 1);
  if (anyNewline >= Math.min(50, Math.floor(maxChars * 0.1))) {
    return anyNewline;
  }

  // 5. Hard limit split (no safe boundary found in slice)
  return maxChars;
}

/**
 * Splits raw input text into strictly bounded chunks along question boundaries.
 * Guarantees:
 * - chunks.join('') === text (no skipped characters, no overlapping characters)
 * - chunk.length <= maxChars for all chunks
 */
export function splitIntoQuestionChunks(
  text: string,
  maxChars = getChunkMaxChars()
): string[] {
  if (!text) {
    return [];
  }

  if (text.length <= maxChars) {
    return [text];
  }

  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    const remaining = text.length - currentIndex;
    if (remaining <= maxChars) {
      chunks.push(text.slice(currentIndex));
      break;
    }

    // Examine the next slice of length maxChars + 1 to check boundary
    const slice = text.slice(currentIndex, currentIndex + maxChars + 1);
    const splitRelIdx = findSafeQuestionBoundary(slice, maxChars);

    // Defensive guarantee: splitRelIdx must be in [1, maxChars]
    const safeSplitIdx = Math.max(1, Math.min(splitRelIdx, maxChars));

    chunks.push(text.slice(currentIndex, currentIndex + safeSplitIdx));
    currentIndex += safeSplitIdx;
  }

  return chunks;
}
