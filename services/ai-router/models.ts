/**
 * 🧠 AI Gateway - Model Registry
 *
 * Central registry of all supported AI models.
 * Priority 1 = highest priority (tried first).
 * The router will iterate through models in priority order,
 * skipping disabled or over-quota models, and fall back
 * to the Gemini/Groq backend if all fail.
 */

export interface ModelConfig {
  id: string;
  model: string;
  provider: 'ollama' | 'openrouter' | 'gemini' | 'groq';
  priority: number;
  enabled: boolean;
  apiKey?: string;
  usageLimit?: number;
  /** Task affinity - if set, this model is preferred for matching tasks */
  taskAffinity?: string[];
  description?: string;
}

// ── Default API keys ───────────────────────────────────────────────────────────
const OLLAMA_API_KEY =
  (import.meta.env.VITE_OLLAMA_API_KEY || '').trim() ||
  '4e1fe3f137c14098b49c0349cb63d7ab.MjZZusjbMyjNkLgp33uW_0uDcloud';

// ── Model Registry ─────────────────────────────────────────────────────────────
export const DEFAULT_MODELS: ModelConfig[] = [
  {
    id: 'deepseek',
    model: 'deepseek-v3.2:cloud',
    provider: 'ollama',
    priority: 1,
    enabled: true,
    apiKey: '4e1fe3f137c14098b49c0349cb63d7ab.MjZZusjbMyjNkLgp33uW_0uDcloud',
    usageLimit: 300,
    taskAffinity: ['brain', 'lesson_explanation', 'daily_analysis'],
    description: 'DeepSeek V3.2 — Deep reasoning & analysis',
  },
  {
    id: 'kimi',
    model: 'kimi-k2.5:cloud',
    provider: 'ollama',
    priority: 2,
    enabled: true,
    apiKey: OLLAMA_API_KEY,
    usageLimit: 500,
    taskAffinity: ['long_context'],
    description: 'Kimi K2.5 — 1M context window',
  },
  {
    id: 'mistral',
    model: 'mistral-large-3:675b-cloud',
    provider: 'ollama',
    priority: 3,
    enabled: true,
    apiKey: OLLAMA_API_KEY,
    usageLimit: 200,
    taskAffinity: ['medium_task', 'formatting'],
    description: 'Mistral Large 3 — Multimodal & multilingual',
  },
];

// ── Storage helpers (in-memory per session) ────────────────────────────────────
let _registry: ModelConfig[] = loadRegistry();

function loadRegistry(): ModelConfig[] {
  try {
    const raw = sessionStorage.getItem('ai_gateway_registry');
    if (raw) {
      const parsed: ModelConfig[] = JSON.parse(raw);
      // Merge with defaults to catch newly added fields
      return DEFAULT_MODELS.map(def => {
        const saved = parsed.find(p => p.id === def.id);
        // Ensure apiKey and model ID are always updated from defaults if missing
        return saved ? { ...def, ...saved, apiKey: saved.apiKey || def.apiKey, model: def.model } : def;
      });
    }
  } catch (_) { /* ignore */ }
  return [...DEFAULT_MODELS];
}

function saveRegistry() {
  try {
    sessionStorage.setItem('ai_gateway_registry', JSON.stringify(_registry));
  } catch (_) { /* ignore */ }
}

// ── Usage tracking (in-memory per session) ─────────────────────────────────────
const _usage: Record<string, number> = {};

export function getRegistry(): ModelConfig[] {
  return _registry;
}

export function setRegistry(models: ModelConfig[]) {
  _registry = models;
  saveRegistry();
}

export function getActiveModels(): ModelConfig[] {
  return _registry
    .filter(m => m.enabled && (_usage[m.id] ?? 0) < (m.usageLimit ?? Infinity))
    .sort((a, b) => a.priority - b.priority);
}

export function getActiveModelsForTask(task: string): ModelConfig[] {
  const active = getActiveModels();
  // Models with explicit task affinity for this task come first
  const affine = active.filter(m => m.taskAffinity?.includes(task));
  const rest   = active.filter(m => !m.taskAffinity?.includes(task));
  return [...affine, ...rest];
}

export function incrementModelUsage(id: string) {
  _usage[id] = (_usage[id] ?? 0) + 1;
}

export function getModelUsage(): Record<string, number> {
  return { ..._usage };
}

export function toggleModel(id: string) {
  _registry = _registry.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m);
  saveRegistry();
}

export function setModelPriority(id: string, priority: number) {
  _registry = _registry.map(m => m.id === id ? { ...m, priority } : m);
  _registry.sort((a, b) => a.priority - b.priority);
  saveRegistry();
}

export function setModelEnabled(id: string, enabled: boolean) {
  _registry = _registry.map(m => m.id === id ? { ...m, enabled } : m);
  saveRegistry();
}
