/**
 * 🧠 AI Router - Centralized AI Intelligence Network (Advanced v2)
 * 
 * Orchestration:
 * - Central Brain: GPT-OSS-120B (OpenRouter)
 * - Specialized Tools: Gemini 1.5 Flash, Llama 3.1, Gemma 3, Mistral, Kimi K2
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Keys ──────────────────────────────────────────────────────────────────────
// ── Keys ──────────────────────────────────────────────────────────────────────
const OPENROUTER_KEY = (import.meta.env.VITE_OPENROUTER_API_KEY || '').trim();
const GEMINI_KEY     = (import.meta.env.VITE_GEMINI_API_KEY     || '').trim();
const GROQ_KIMI_KEY  = (import.meta.env.VITE_GROQ_KIMI_KEY      || '').trim();
const GROQ_LLAMA_KEY = (import.meta.env.VITE_GROQ_LLAMA_KEY     || '').trim();
const MISTRAL_KEY    = (import.meta.env.VITE_MISTRAL_API_KEY    || '').trim();
const GEMMA_KEY      = (import.meta.env.VITE_OPENROUTER_GEMMA_KEY || '').trim();

console.groupCollapsed("[AI Router] Environment Initialization");
console.log("OpenRouter Key Found:", !!OPENROUTER_KEY, OPENROUTER_KEY ? `(Starts with: ${OPENROUTER_KEY.slice(0, 6)}...)` : "(MISSING)");
console.log("Gemini Key Found:", !!GEMINI_KEY, GEMINI_KEY ? `(Starts with: ${GEMINI_KEY.slice(0, 6)}...)` : "(MISSING)");
console.groupEnd();

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
  history?: any[];
}

export interface AIResponse {
  text: string;
  provider: string;
  reasoning?: string;
}

// ── Fetch Helpers ─────────────────────────────────────────────────────────────

async function callOpenRouter(req: AIRequest, model: string, key: string): Promise<AIResponse> {
  if (!key) {
    console.warn(`[AI Router] Missing OpenRouter key for ${model}`);
    throw new Error(`Missing key for ${model}. Please check VITE_OPENROUTER_API_KEY.`);
  }
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://math-hub-eta.vercel.app",
      "X-Title": "Math Hub"
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: (req.systemInstruction || '') + `\n\nSite Knowledge:\n${SITE_KNOWLEDGE}` },
        ...(req.history || []),
        { role: 'user', content: req.prompt }
      ],
      response_format: req.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      ...(model.includes('gpt-oss') ? { reasoning: { enabled: true } } : {})
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`OpenRouter Error: ${data.error?.message || response.statusText}`);
  
  const msg = data.choices[0].message;
  return { 
    text: msg.content, 
    provider: model,
    reasoning: msg.reasoning_details 
  };
}

async function callGroq(req: AIRequest, model: string, key: string): Promise<AIResponse> {
  if (!key) throw new Error(`Missing key for Groq ${model}`);

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: req.systemInstruction || 'You are a helpful assistant.' },
        ...(req.history || []),
        { role: 'user', content: req.prompt }
      ],
      response_format: req.responseFormat === 'json' ? { type: 'json_object' } : undefined,
    }),
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(`Groq ${resp.status}: ${data.error?.message || resp.statusText}`);
  return { text: data.choices[0].message.content, provider: `groq-${model}` };
}

async function callGemini(req: AIRequest): Promise<AIResponse> {
  if (!GEMINI_KEY) {
    console.warn("[AI Router] Missing Gemini API key (VITE_GEMINI_API_KEY)");
    throw new Error('No Gemini key. Please check your .env file.');
  }
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  if (req.imageBase64) {
    const result = await model.generateContent([
      req.prompt,
      { inlineData: { data: req.imageBase64.replace(/^data:[^;]+;base64,/, ''), mimeType: req.imageMimeType || 'image/jpeg' } }
    ]);
    return { text: result.response.text(), provider: 'gemini-1.5-flash' };
  }

  const result = await model.generateContent({
    contents: [
      ...(req.systemInstruction ? [{ role: 'user' as 'user', parts: [{ text: `[System] ${req.systemInstruction}` }] }, { role: 'model' as 'model', parts: [{ text: 'Understood.' }] }] : []),
      ...(req.history || []).map(h => ({ role: (h.role === 'assistant' ? 'model' : 'user') as 'user' | 'model', parts: [{ text: h.content }] })),
      { role: 'user' as 'user', parts: [{ text: req.prompt }] }
    ],
    generationConfig: (req.responseFormat === 'json' ? { responseMimeType: 'application/json' } : undefined) as any,
  });

  return { text: result.response.text(), provider: 'gemini-1.5-flash' };
}

import { monitor } from './monitor';

export async function routeAI(req: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  const task = req.task || 'brain';
  let result: AIResponse | null = null;
  let error: any = null;

  try {
    switch (task) {
      case 'brain':
        // User requested Gemini specifically
        result = await callGemini(req).catch(() => callOpenRouter(req, 'google/gemini-2.0-flash-001', OPENROUTER_KEY));
        break;
      
      case 'lesson_explanation':
      case 'daily_analysis':
        result = await callGemini(req);
        break;
      
      case 'long_context':
        result = await callGroq(req, 'kimi-k2-instruct-0905', GROQ_KIMI_KEY).catch(() => callGemini(req));
        break;
      
      case 'fast_task':
        result = await callGroq(req, 'llama-3.1-8b-instant', GROQ_LLAMA_KEY);
        break;
      
      case 'formatting':
        result = await callOpenRouter(req, 'google/gemma-3-27b-it:free', GEMMA_KEY);
        break;
      
      case 'medium_task':
        const resp = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${MISTRAL_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'mistral-medium-latest',
            messages: [{ role: 'user', content: req.prompt }]
          })
        });
        const data = await resp.json();
        result = { text: data.choices[0].message.content, provider: 'mistral' };
        break;

      case 'image':
        result = await callGemini(req);
        break;

      default:
                result = await callOpenRouter(req, 'google/gemini-2.0-flash-001', OPENROUTER_KEY);
    }
    return result!;
  } catch (err: any) {
    error = err;
    console.warn(`[AI Router] Primary provider for ${task} failed, falling back to Llama 3.1`, err);
    result = await callGroq(req, 'llama-3.1-8b-instant', GROQ_LLAMA_KEY).catch(() => callGemini(req));
    return result;
  } finally {
    monitor.logCall({
      model: result?.provider || 'unknown',
      provider: result?.provider.includes('gemini') ? 'gemini' : 
                result?.provider.includes('gpt') ? 'openrouter' :
                result?.provider.includes('mistral') ? 'mistral' : 
                result?.provider.includes('tavily') ? 'tavily' : 'groq',
      task,
      duration: Date.now() - startTime,
      status: error && !result ? 'error' : 'success',
      error: error?.message,
      prompt: req.prompt,
      response: result?.text
    });
  }
}

// ── Convenience Wrappers ──────────────────────────────────────────────────────

export async function generateText(prompt: string, options?: { system?: string; task?: AITask; json?: boolean; history?: any[] }): Promise<string> {
  const res = await routeAI({
    prompt,
    systemInstruction: options?.system,
    task: options?.task,
    responseFormat: options?.json ? 'json' : 'text',
    history: options?.history
  });
  return res.text;
}
