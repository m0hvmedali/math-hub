/**
 * 🧠 AI Gateway - Router v3 (Gateway Architecture)
 *
 * Orchestration priority:
 * 1. Ollama Cloud models (DeepSeek → Kimi → Mistral) — by task affinity & priority
 * 2. Gemini 3.1 Flash Lite Preview                    — primary fallback
 * 3. OpenRouter (Gemini via cloud)                    — secondary fallback
 * 4. Groq (Llama/Kimi)                               — final fallback
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  getActiveModelsForTask,
  incrementModelUsage,
  ModelConfig,
  setModelEnabled,
} from './models';

// ── API Keys ───────────────────────────────────────────────────────────────────
const OPENROUTER_KEY = (import.meta.env.VITE_OPENROUTER_API_KEY || '').trim();
const GEMINI_KEY     = (import.meta.env.VITE_GEMINI_API_KEY     || '').trim();
const GROQ_KIMI_KEY  = (import.meta.env.VITE_GROQ_KIMI_KEY      || '').trim();
const GROQ_LLAMA_KEY = (import.meta.env.VITE_GROQ_LLAMA_KEY     || '').trim();
const GEMMA_KEY      = (import.meta.env.VITE_OPENROUTER_GEMMA_KEY || '').trim();
const MISTRAL_KEY    = (import.meta.env.VITE_MISTRAL_API_KEY    || '').trim();

// ── Circuit Breaker (Anti-429 Resilience) ──────────────────────────────────
let GEMINI_COOLDOWN_UNTIL = 0;
const isGeminiOnCooldown = () => Date.now() < GEMINI_COOLDOWN_UNTIL;
const setGeminiCooldown = (sec = 60) => {
    console.warn(`[AI Router] 🛡️ Gemini 429 detected - Cool-down for ${sec}s`);
    GEMINI_COOLDOWN_UNTIL = Date.now() + (sec * 1000);
};

// ── Ollama Cloud REST API (browser-compatible fetch via Vercel Proxy) ────────
const OLLAMA_HOST = '/api/ai/ollama';

/**
 * Low-level call to Ollama REST API (Proxied through /api/ai/ollama)
 */
async function ollamaChat(params: {
  model: string;
  messages: { role: string; content: string }[];
  format?: 'json';
  apiKey: string;
}): Promise<{ message: { content: string } }> {
  console.log(`[AI Router] Calling Ollama Proxy: ${OLLAMA_HOST}, model=${params.model}, keyLen=${params.apiKey?.length || 0}`);
  
  const resp = await fetch(OLLAMA_HOST, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      stream: false,
      ...(params.format ? { format: params.format } : {}),
    }),
  });
  const data = await resp.json();
  
  // Handle diagnostic 200-but-error responses
  if (data.error === true) {
    console.error('[AI Router] Proxy Diagnostic Error:', data);
    throw new Error(`Ollama Cloud Error: ${data.message} (Upstream: ${data.lastStatus})`);
  }

  return data;
}

// ── Site Knowledge ─────────────────────────────────────────────────────────────
const SITE_KNOWLEDGE = `
Math Hub Pages:
- /dashboard: Real-time progress, daily briefing, and quick access.
- /curriculum: Subject selection and academic pathways.
- /subject/:id: Course branches and lesson lists.
- /lesson/:id: Core learning area with video, text, and AI assistant.
- /labs: Interactive simulations (Organic Chem, Physics, etc.).
- /schedule: Google Calendar sync with AI optimization.
- /daily-analysis: AI-powered productivity scoring and mood tracking.
- /timer: Focus timer with level-up system.
- /gmail: Integrated inbox and email management.
- /notes: Sticky notes with Drive backup.
- /whiteboard: Collaborative workspace for formulas and diagrams.
`;

// ── Types ──────────────────────────────────────────────────────────────────────
export type AITask = 'brain' | 'lesson_explanation' | 'daily_analysis' | 'long_context' | 'fast_task' | 'formatting' | 'medium_task' | 'image';

export interface AIRequest {
  prompt: string;
  systemInstruction?: string;
  task?: AITask;
  imageBase64?: string;
  imageMimeType?: string;
  responseFormat?: 'text' | 'json';
  history?: { role: 'user' | 'assistant'; content: string; thoughtSignature?: string }[];
}

export interface AIResponse {
  text: string;
  provider: string;
  reasoning?: string;
  thoughtSignature?: string;
}

// ── Text Chunking ─────────────────────────────────────────────────────────────
/** Splits a prompt into chunks of ~3000 tokens (≈12000 chars) for large inputs */
function chunkText(text: string, maxChars = 12000): string[] {
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxChars;
    // Try to break at a sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      if (lastPeriod > start + maxChars * 0.5) end = lastPeriod + 1;
    }
    chunks.push(text.slice(start, end).trim());
    start = end;
  }
  return chunks;
}

// ── JSON Cleaner ─────────────────────────────────────────────────────────────
/**
 * Strips markdown code fences and surrounding whitespace/text from model outputs
 * that are supposed to be JSON but often come wrapped in  ```json ... ``` .
 */
/**
 * Strips markdown code fences and surrounding whitespace/text from model outputs
 * that are supposed to be JSON but often come wrapped in  ```json ... ``` .
 */
function cleanJson(raw: string): string {
  if (!raw) return '';
  
  let s = raw.trim();
  
  // 1. Identify valid JSON structure by finding the OUTTERMOST braces or brackets
  // This ignores any prose, headers, or markdown that the AI might have added.
  const firstCurly = s.indexOf('{');
  const firstSquare = s.indexOf('[');
  let start = -1;
  
  if (firstCurly !== -1 && firstSquare !== -1) start = Math.min(firstCurly, firstSquare);
  else if (firstCurly !== -1) start = firstCurly;
  else if (firstSquare !== -1) start = firstSquare;

  if (start === -1) return s;

  const lastCurly = s.lastIndexOf('}');
  const lastSquare = s.lastIndexOf(']');
  const end = Math.max(lastCurly, lastSquare);

  if (end === -1 || end < start) return s;

  s = s.slice(start, end + 1);

  // 2. Technical Polish: Remove common AI JSON errors
  // a. Escapes literal newlines inside strings
  s = s.replace(/"((?:\\.|[^"\\])*)"/g, (match, content) => {
    return '"' + content.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
  });
  // b. Remove trailing commas
  s = s.replace(/,\s*([\]}])/g, '$1');

  return s;
}

// ── Health Check ──────────────────────────────────────────────────────────────
async function checkModel(m: ModelConfig): Promise<boolean> {
  try {
    await ollamaChat({
      model: m.model,
      messages: [{ role: 'user', content: 'ping' }],
      apiKey: m.apiKey || '',
    });
    return true;
  } catch {
    return false;
  }
}

/** Run health check every 60s in the background */
let _healthInterval: ReturnType<typeof setInterval> | null = null;
export function startHealthChecks() {
  if (_healthInterval) return;
  _healthInterval = setInterval(async () => {
    const { getRegistry } = await import('./models');
    const models = getRegistry();
    for (const m of models) {
      if (!m.enabled) continue;
      const ok = await checkModel(m);
      if (!ok) {
        console.warn(`[AI Gateway] Health check failed for ${m.model} — disabling temporarily`);
        setModelEnabled(m.id, false);
        // Re-enable after 5 minutes
        setTimeout(() => setModelEnabled(m.id, true), 5 * 60 * 1000);
      }
    }
  }, 60_000);
}

// ── Ollama Call ───────────────────────────────────────────────────────────────
async function callOllama(req: AIRequest, m: ModelConfig): Promise<AIResponse> {
  // Build message history
  const messages: { role: string; content: string }[] = [];

  if (req.systemInstruction) {
    messages.push({ role: 'system', content: req.systemInstruction + '\n\n' + SITE_KNOWLEDGE });
  }

  for (const h of req.history || []) {
    messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content });
  }

  // Handle chunking for long prompts
  const chunks = chunkText(req.prompt);
  let rawText = '';

  for (const chunk of chunks) {
    const payload = [...messages, { role: 'user', content: chunk }];
    const res = await ollamaChat({
      model: m.model,
      messages: payload,
      format: req.responseFormat === 'json' ? 'json' : undefined,
      apiKey: m.apiKey || '',
    });
    const chunkContent: string = res.message?.content || '';
    rawText += chunkContent;

    // Add chunk pair as context for the next chunk (multi-chunk only)
    if (chunks.length > 1) {
      messages.push({ role: 'user', content: chunk });
      messages.push({ role: 'assistant', content: chunkContent });
    }
  }

  // For JSON requests: final cleanup is handled globally in routeAI
  return { text: rawText, provider: m.model };
}

// ── Gemini Call ───────────────────────────────────────────────────────────────
async function callGemini(req: AIRequest): Promise<AIResponse> {
  if (!GEMINI_KEY) throw new Error('No Gemini key');
  if (isGeminiOnCooldown()) throw new Error('Gemini on 429 cooldown');

  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const MODEL_ID = 'gemini-3.1-flash-lite-preview';
  const model = genAI.getGenerativeModel({ model: MODEL_ID });

  try {
    if (req.imageBase64) {
      const result = await model.generateContent([
        req.prompt,
        { inlineData: { data: req.imageBase64.replace(/^data:[^;]+;base64,/, ''), mimeType: req.imageMimeType || 'image/jpeg' } }
      ]);
      return { text: result.response.text(), provider: MODEL_ID };
    }

    const result = await model.generateContent({
      contents: [
        ...(req.systemInstruction ? [
          { role: 'user' as const, parts: [{ text: `[System] ${req.systemInstruction}` }] },
          { role: 'model' as const, parts: [{ text: 'Understood.' }] }
        ] : []),
        ...(req.history || []).map(h => ({
          role: (h.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
          parts: [
            { text: h.content } as any,
            ...(h.thoughtSignature ? [{ thought_signature: h.thoughtSignature } as any] : [])
          ]
        })),
        { role: 'user' as const, parts: [{ text: req.prompt }] }
      ],
      generationConfig: (req.responseFormat === 'json' ? { responseMimeType: 'application/json' } : undefined) as any,
    });

    const response = result.response;
    const candidate = (response as any).candidates?.[0];
    const thoughtSignature = candidate?.content?.parts?.find((p: any) => p.thought_signature)?.thought_signature;

    return { text: response.text(), provider: MODEL_ID, thoughtSignature };
  } catch (err: any) {
    if (err.message?.includes('429')) setGeminiCooldown(60);
    throw err;
  }
}

// ── OpenRouter Call ─────────────────────────────────────────────────────────
async function callOpenRouter(req: AIRequest, model: string, key: string): Promise<AIResponse> {
  if (!key) throw new Error(`Missing OpenRouter key for ${model}`);
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://math-hub-eta.vercel.app',
      'X-Title': 'Math Hub'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: (req.systemInstruction || '') + `\n\nSite Knowledge:\n${SITE_KNOWLEDGE}` },
        ...(req.history || []).map(h => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
        { role: 'user', content: req.prompt }
      ],
      response_format: req.responseFormat === 'json' ? { type: 'json_object' } : undefined,
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`OpenRouter Error: ${data.error?.message || response.statusText}`);
  return { text: data.choices[0].message.content, provider: model };
}

// ── Groq Call ──────────────────────────────────────────────────────────────
async function callGroq(req: AIRequest, model: string, key: string): Promise<AIResponse> {
  if (!key) throw new Error(`Missing Groq key for ${model}`);
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: req.systemInstruction || 'You are a helpful assistant.' },
        ...(req.history || []).map(h => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
        { role: 'user', content: req.prompt }
      ],
      response_format: req.responseFormat === 'json' ? { type: 'json_object' } : undefined,
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`Groq ${resp.status}: ${data.error?.message || resp.statusText}`);
  return { text: data.choices[0].message.content, provider: `groq-${model}` };
}

// ── Pollinations Call (Free Fallback) ─────────────────────────────────────────
async function callPollinationsText(req: AIRequest): Promise<AIResponse> {
    const model = 'openai'; // Pollinations default, high quality
    const url = `https://text.pollinations.ai/${encodeURIComponent(req.prompt)}?model=${model}&system=${encodeURIComponent(req.systemInstruction || '')}&json=true&seed=${Math.floor(Math.random()*1000)}`;
    
    const resp = await fetch(url);
    const text = await resp.text();
    return { text, provider: `pollinations-${model}` };
}

// ── Usage Tracking & Caching ─────────────────────────────────────────────────
const getTodayKey = () => `ai_usage_${new Date().toISOString().split('T')[0]}`;
const hashPrompt = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
  return hash.toString();
};

import { supabase } from '../../supabaseClient';

function incrementLegacyUsage(provider: string) {
  try {
    const key = getTodayKey();
    const raw = localStorage.getItem(key);
    const usage = raw ? JSON.parse(raw) : {};
    usage[provider] = (usage[provider] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(usage));
    if (supabase) {
      const today = new Date().toISOString().split('T')[0];
      supabase.from('ai_usage_logs').upsert({ user_id: 'default_user', provider, date: today, count: usage[provider] }, { onConflict: 'user_id,provider,date' });
    }
  } catch (_) {}
}

// ── Primary Fallback (when all Ollama models fail) ─────────────────────────────
async function fallbackPrimary(req: AIRequest): Promise<AIResponse> {
  // Try Gemini first
  try { return await callGemini(req); } catch (_) {}
  // Then OpenRouter
  try { return await callOpenRouter(req, 'google/gemini-2.0-flash-lite-preview-02-05:free', OPENROUTER_KEY); } catch (_) {}
  // Then Groq
  try { return await callGroq(req, 'llama-3.1-8b-instant', GROQ_LLAMA_KEY); } catch (_) {}
  // Finally Pollinations (Unlimited free fallback)
  return await callPollinationsText(req);
}

import { monitor } from './monitor';

// ── Main Gateway Router ────────────────────────────────────────────────────────
export async function routeAI(req: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  const task = req.task || 'brain';
  const isImage = !!req.imageBase64;

  // 1. Cache check (skip for JSON responses to prevent stale/malformed cache)
  const cacheKey = `ai_cache_${task}_${hashPrompt(req.prompt + (req.systemInstruction || ''))}`;
  if (req.responseFormat !== 'json') {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.text) {
          console.log(`[AI Gateway] Cache hit for ${task}`);
          return parsed;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
    } catch {
      localStorage.removeItem(cacheKey); // delete corrupted cache entry
    }
  }

  let result: AIResponse | null = null;
  let error: any = null;

  try {
    // 2. Try Ollama Cloud models (skip for image tasks — Gemini handles those)
    if (!isImage) {
      const models = getActiveModelsForTask(task);
      for (const m of models) {
        try {
          console.log(`[AI Gateway] Trying ${m.model} (priority ${m.priority})`);
          result = await callOllama(req, m);
          incrementModelUsage(m.id);
          incrementLegacyUsage('ollama');
          console.log(`[AI Gateway] ✅ Success with ${m.model}`);
          break;
        } catch (err: any) {
          console.warn(`[AI Gateway] ❌ ${m.model} failed:`, err.message || err);
        }
      }
    }

    // 3. Fallback to primary (Gemini / OpenRouter / Groq)
    if (!result) {
      console.log(`[AI Gateway] All Ollama models failed or skipped — using primary fallback`);
      result = await fallbackPrimary(req);
      if (result.provider.includes('gemini')) incrementLegacyUsage('gemini');
      else if (result.provider.includes('groq') || result.provider.includes('kimi')) incrementLegacyUsage('groq');
      else incrementLegacyUsage('openrouter');
    }

    // 4. Post-processing: Global JSON cleaning
    if (result && req.responseFormat === 'json') {
      result.text = cleanJson(result.text);
    }

    // 5. Cache success
    try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch (_) {}

    return result;
  } catch (err: any) {
    error = err;
    console.error('[AI Gateway] All providers failed!', err);
    // Ultimate fallback
    result = await callGroq(req, 'llama-3.1-8b-instant', GROQ_LLAMA_KEY).catch(() => callGemini(req));
    return result;
  } finally {
    if (result) {
      monitor.logCall({
        model: result.provider,
        provider: result.provider.includes('gemini') ? 'gemini'
                : result.provider.includes('gpt') ? 'openrouter'
                : result.provider.includes('mistral') ? 'mistral'
                : result.provider.includes('groq') || result.provider.includes('llama') ? 'groq'
                : 'ollama',
        task,
        duration: Date.now() - startTime,
        status: error && !result ? 'error' : 'success',
        error: error?.message,
        prompt: req.prompt,
        response: result?.text,
      });
    }
  }
}

// ── Convenience Wrapper ────────────────────────────────────────────────────────
export async function generateText(prompt: string, options?: { system?: string; task?: AITask; json?: boolean; history?: any[] }): Promise<string> {
  const res = await routeAI({
    prompt,
    systemInstruction: options?.system,
    task: options?.task,
    responseFormat: options?.json ? 'json' : 'text',
    history: options?.history,
  });
  return res.text;
}
