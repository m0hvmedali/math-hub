/**
 * 🧠 AI Router - Centralized AI Intelligence Network
 * 
 * Supports: Groq (Llama 3.1), Gemini (2.5-flash), Mistral (ministral-3b)
 * Strategy: Smart task routing + waterfall fallback
 * 
 * Task Types:
 *  - "chat"      → Best for conversational Arabic flows → Gemini first
 *  - "fast"      → Best for quick completions → Groq first
 *  - "json"      → Structured JSON output → Groq first (supports json_object)
 *  - "translate" → Translation tasks → Gemini (multilingual)
 *  - "search"    → Smart summarization from context → Groq
 *  - "image"     → Vision tasks → Gemini only
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Mistral } from '@mistralai/mistralai';

// ── Keys ──────────────────────────────────────────────────────────────────────
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GROQ_KEY   = import.meta.env.VITE_GROQ_API_KEY   || '';
const MISTRAL_KEY = import.meta.env.VITE_MISTRAL_API_KEY || '';

// ── Task Config ───────────────────────────────────────────────────────────────
export type AITask = 'chat' | 'fast' | 'json' | 'translate' | 'search' | 'image';

export interface AIRequest {
  prompt: string;
  systemInstruction?: string;
  task?: AITask;                     // Hint to select best provider
  imageBase64?: string;              // For vision tasks
  imageMimeType?: string;
  responseFormat?: 'text' | 'json'; // Force JSON mode
}

export interface AIResponse {
  text: string;
  provider: 'groq' | 'gemini' | 'mistral';
  cached?: boolean;
}

// ── Provider Implementations ──────────────────────────────────────────────────

async function callGroq(req: AIRequest): Promise<AIResponse> {
  if (!GROQ_KEY) throw new Error('No Groq key');

  const isJson = req.responseFormat === 'json';
  const body: any = {
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: (req.systemInstruction || 'You are a helpful assistant.') + (isJson ? '\n\nRespond ONLY with valid JSON.' : '') },
      { role: 'user', content: req.prompt }
    ],
    temperature: 0.7,
  };

  if (isJson) {
    body.response_format = { type: 'json_object' };
  }

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) throw new Error(`Groq ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return { text: data.choices[0].message.content, provider: 'groq' };
}

async function callGemini(req: AIRequest): Promise<AIResponse> {
  if (!GEMINI_KEY) throw new Error('No Gemini key');
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);

  // Vision task
  if (req.imageBase64) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent([
      req.prompt,
      { inlineData: { data: req.imageBase64.replace(/^data:[^;]+;base64,/, ''), mimeType: req.imageMimeType || 'image/jpeg' } }
    ]);
    return { text: result.response.text(), provider: 'gemini' };
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const cfg: any = {};
  if (req.responseFormat === 'json') cfg.responseMimeType = 'application/json';

  const systemPart = req.systemInstruction ? [{ text: req.systemInstruction }] : [];

  const result = await model.generateContent({
    contents: [
      ...(req.systemInstruction ? [{ role: 'user' as const, parts: [{ text: `[System] ${req.systemInstruction}` }] }, { role: 'model' as const, parts: [{ text: 'Understood.' }] }] : []),
      { role: 'user' as const, parts: [{ text: req.prompt }] }
    ],
    generationConfig: cfg,
  });

  return { text: result.response.text(), provider: 'gemini' };
}

async function callMistral(req: AIRequest): Promise<AIResponse> {
  if (!MISTRAL_KEY) throw new Error('No Mistral key');
  const client = new Mistral({ apiKey: MISTRAL_KEY });
  const isJson = req.responseFormat === 'json';

  const result = await client.chat.complete({
    model: 'ministral-3b-latest',
    messages: [
      { role: 'system', content: (req.systemInstruction || 'You are a helpful assistant.') + (isJson ? '\n\nOutput strictly valid JSON.' : '') },
      { role: 'user', content: req.prompt }
    ],
    responseFormat: isJson ? { type: 'json_object' } : undefined,
    temperature: 0.7,
  });

  const content = result.choices?.[0]?.message.content;
  if (!content) throw new Error('Empty Mistral response');
  return { text: typeof content === 'string' ? content : JSON.stringify(content), provider: 'mistral' };
}

// ── Route Decision ─────────────────────────────────────────────────────────────
function decideOrder(req: AIRequest): Array<() => Promise<AIResponse>> {
  const task = req.task || 'chat';

  // Vision → Gemini only
  if (task === 'image' || req.imageBase64) return [() => callGemini(req)];

  // Fast / JSON / Search → Groq first 
  if (['fast', 'json', 'search'].includes(task)) {
    const order = [];
    if (GROQ_KEY)    order.push(() => callGroq(req));
    if (MISTRAL_KEY) order.push(() => callMistral(req));
    if (GEMINI_KEY)  order.push(() => callGemini(req));
    return order.length ? order : [() => callGemini(req)];
  }

  // Chat / Translate → Gemini first (best Arabic)
  const order = [];
  if (GEMINI_KEY)  order.push(() => callGemini(req));
  if (GROQ_KEY)    order.push(() => callGroq(req));
  if (MISTRAL_KEY) order.push(() => callMistral(req));
  return order.length ? order : [() => callGroq(req)];
}

// ── Main Router ────────────────────────────────────────────────────────────────
export async function routeAI(req: AIRequest): Promise<AIResponse> {
  const providers = decideOrder(req);

  for (const invoke of providers) {
    try {
      return await invoke();
    } catch (err: any) {
      console.warn(`[AI Router] Provider failed:`, err?.message || err);
    }
  }

  throw new Error('[AI Router] All providers failed');
}

/**
 * Convenience wrapper - generate text with auto-routing
 */
export async function generateText(
  prompt: string,
  options?: {
    system?: string;
    task?: AITask;
    json?: boolean;
  }
): Promise<string> {
  const res = await routeAI({
    prompt,
    systemInstruction: options?.system,
    task: options?.task || 'chat',
    responseFormat: options?.json ? 'json' : 'text',
  });
  return res.text;
}

/**
 * Vision analysis - images only go to Gemini
 */
export async function analyzeImage(
  prompt: string,
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  const res = await routeAI({
    prompt,
    imageBase64: base64Image,
    imageMimeType: mimeType,
    task: 'image',
  });
  return res.text;
}
