/**
 * Ollama AI Service — ADMIN ONLY
 * Never import this in apps/public or packages/shared
 */

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeoutMs: number;
  enabled: boolean;
}

export type OllamaConnectionStatus = 
  | 'connected'
  | 'unavailable'
  | 'model_missing'
  | 'timeout'
  | 'invalid_response'
  | 'disabled';

export interface OllamaTestResult {
  status: OllamaConnectionStatus;
  message: string;
  modelAvailable?: boolean;
  availableModels?: string[];
}

export interface OllamaGenerateResult {
  success: boolean;
  rawResponse?: string;
  extractedJson?: string;
  parsedData?: unknown;
  error?: string;
  stage?: 'ollama_call' | 'json_extract' | 'parse' | 'validate';
}

export function getDefaultOllamaConfig(): OllamaConfig {
  return {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
    timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '300000'),
    enabled: process.env.OLLAMA_ENABLED === 'true',
  };
}

export async function testOllamaConnection(config: OllamaConfig): Promise<OllamaTestResult> {
  if (!config.enabled) {
    return { status: 'disabled', message: 'AI generation is disabled. Enable it in Settings → AI.' };
  }
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const res = await fetch(`${config.baseUrl}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    if (!res.ok) {
      return { status: 'unavailable', message: `Ollama server responded with status ${res.status}` };
    }
    
    const data = await res.json() as { models?: Array<{ name: string }> };
    const models = (data.models || []).map(m => m.name);
    const modelAvailable = models.some(m => m.includes(config.model.split(':')[0]));
    
    if (!modelAvailable) {
      return {
        status: 'model_missing',
        message: `Model '${config.model}' not found. Run: ollama pull ${config.model}`,
        modelAvailable: false,
        availableModels: models,
      };
    }
    
    return {
      status: 'connected',
      message: `Connected. Model '${config.model}' is available.`,
      modelAvailable: true,
      availableModels: models,
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { status: 'timeout', message: 'Connection timed out. Is Ollama running?' };
    }
    return { 
      status: 'unavailable', 
      message: `Cannot reach Ollama at ${config.baseUrl}. Run: ollama serve` 
    };
  }
}

export async function generateWithOllama(
  prompt: string,
  systemPrompt: string,
  config: OllamaConfig
): Promise<OllamaGenerateResult> {
  if (!config.enabled) {
    return { success: false, error: 'AI is disabled.', stage: 'ollama_call' };
  }
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
    
    const res = await fetch(`${config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        prompt,
        system: systemPrompt,
        format: 'json',
        stream: false,
        options: { temperature: 0.1 }, // low temp for deterministic JSON
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    if (!res.ok) {
      return { 
        success: false, 
        error: `Ollama returned status ${res.status}`,
        stage: 'ollama_call' 
      };
    }
    
    const data = await res.json() as { response?: string };
    const rawResponse = data.response || '';
    
    return { success: true, rawResponse };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, error: 'Generation timed out. Try a shorter input or increase timeout.', stage: 'ollama_call' };
    }
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error', stage: 'ollama_call' };
  }
}

/**
 * Extract JSON from Ollama response (handles markdown fences and trailing text)
 */
export function extractJsonFromOllamaResponse(raw: string): string | null {
  // Remove markdown code fences if present
  let cleaned = raw.trim();
  
  // Try ```json ... ``` blocks
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }
  
  // Find the first { and last } to extract JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  
  return cleaned.slice(firstBrace, lastBrace + 1);
}
