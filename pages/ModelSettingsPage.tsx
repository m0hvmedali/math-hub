import React, { useState, useEffect, useCallback } from 'react';
import {
  getRegistry,
  setModelEnabled,
  setModelPriority,
  getModelUsage,
  DEFAULT_MODELS,
  ModelConfig,
} from '../services/ai-router/models';
import { startHealthChecks } from '../services/ai-router';
import {
  Activity,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  ToggleLeft,
  ToggleRight,
  RefreshCcw,
  Brain,
  Server,
  AlertTriangle,
} from 'lucide-react';

const PROVIDER_COLORS: Record<string, string> = {
  ollama: 'text-purple-400',
  openrouter: 'text-blue-400',
  gemini: 'text-cyan-400',
  groq: 'text-orange-400',
};

const PROVIDER_GLOWS: Record<string, string> = {
  ollama: 'border-purple-500/30 bg-purple-500/5',
  openrouter: 'border-blue-500/30 bg-blue-500/5',
  gemini: 'border-cyan-500/30 bg-cyan-500/5',
  groq: 'border-orange-500/30 bg-orange-500/5',
};

const ModelCard: React.FC<{
  model: ModelConfig;
  usage: number;
  onToggle: (id: string) => void;
  onPriorityUp: (id: string) => void;
  onPriorityDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}> = ({ model, usage, onToggle, onPriorityUp, onPriorityDown, isFirst, isLast }) => {
  const usagePct = Math.min((usage / (model.usageLimit || 500)) * 100, 100);

  return (
    <div
      className={`relative rounded-[2rem] border p-6 transition-all duration-300 ${
        model.enabled
          ? PROVIDER_GLOWS[model.provider] || 'border-white/10 bg-white/5'
          : 'border-white/5 bg-white/[0.02] opacity-50'
      }`}
    >
      {/* Priority Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button
          onClick={() => onPriorityUp(model.id)}
          disabled={isFirst}
          className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-20 transition-all text-gray-400 hover:text-white"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest w-4 text-center">
          {model.priority}
        </span>
        <button
          onClick={() => onPriorityDown(model.id)}
          disabled={isLast}
          className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-20 transition-all text-gray-400 hover:text-white"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-5">
        <div className={`p-3 rounded-2xl ${PROVIDER_GLOWS[model.provider] || 'bg-white/5'}`}>
          <Brain className={`w-6 h-6 ${PROVIDER_COLORS[model.provider] || 'text-white'}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-black text-base tracking-tight leading-none">
            {model.model}
          </h3>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
            {model.provider}
          </p>
          {model.description && (
            <p className="text-[11px] text-gray-400 mt-1">{model.description}</p>
          )}
        </div>
      </div>

      {/* Task Affinity Tags */}
      {model.taskAffinity && model.taskAffinity.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {model.taskAffinity.map((t) => (
            <span
              key={t}
              className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Usage Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
            Usage
          </span>
          <span className="text-[10px] font-black text-gray-400">
            {usage} / {model.usageLimit ?? '∞'}
          </span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              usagePct > 80
                ? 'bg-red-500'
                : usagePct > 50
                ? 'bg-yellow-500'
                : `bg-${model.provider === 'ollama' ? 'purple' : 'cyan'}-500`
            }`}
            style={{ width: `${usagePct}%` }}
          />
        </div>
      </div>

      {/* Status & Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {model.enabled ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          <span
            className={`text-[10px] font-black uppercase tracking-widest ${
              model.enabled ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {model.enabled ? 'Active' : 'Disabled'}
          </span>
        </div>

        <button
          onClick={() => onToggle(model.id)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          {model.enabled ? (
            <ToggleRight className="w-5 h-5 text-green-400" />
          ) : (
            <ToggleLeft className="w-5 h-5 text-gray-500" />
          )}
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {model.enabled ? 'Disable' : 'Enable'}
          </span>
        </button>
      </div>
    </div>
  );
};

// ── Fallback Chain Visualization ──────────────────────────────────────────────
const FallbackChain: React.FC<{ models: ModelConfig[] }> = ({ models }) => {
  const active = models.filter((m) => m.enabled).sort((a, b) => a.priority - b.priority);
  const PRIMARIES = [
    { label: 'Gemini 3.1 Flash Lite', color: 'text-cyan-400' },
    { label: 'OpenRouter', color: 'text-blue-400' },
    { label: 'Groq Llama', color: 'text-orange-400' },
  ];

  return (
    <div className="glass-card p-6 !rounded-[2.5rem]">
      <h2 className="text-xl font-black text-white tracking-tight mb-5 flex items-center gap-3">
        <Zap className="w-5 h-5 text-yellow-400" />
        Fallback Chain
      </h2>
      <div className="flex flex-col gap-2">
        {active.map((m, i) => (
          <div key={m.id} className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-black flex items-center justify-center">
              {i + 1}
            </span>
            <span className="text-sm font-bold text-white">{m.model}</span>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
              Ollama Cloud
            </span>
          </div>
        ))}
        {/* Divider */}
        <div className="flex items-center gap-2 pl-1 my-1">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">
            Primary Fallback
          </span>
          <div className="flex-1 h-px bg-white/5" />
        </div>
        {PRIMARIES.map((p, i) => (
          <div key={p.label} className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-white/5 text-gray-500 text-[10px] font-black flex items-center justify-center">
              {active.length + i + 1}
            </span>
            <span className={`text-sm font-bold ${p.color}`}>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ModelSettingsPage: React.FC = () => {
  const [models, setModels] = useState<ModelConfig[]>(getRegistry());
  const [usage, setUsage] = useState<Record<string, number>>(getModelUsage());

  // Sync usage every 5s
  useEffect(() => {
    startHealthChecks();
    const interval = setInterval(() => {
      setUsage(getModelUsage());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const refresh = useCallback(() => {
    setModels(getRegistry());
    setUsage(getModelUsage());
  }, []);

  const handleToggle = (id: string) => {
    setModelEnabled(id, !models.find((m) => m.id === id)?.enabled);
    refresh();
  };

  const handlePriorityUp = (id: string) => {
    const m = models.find((m) => m.id === id);
    if (!m || m.priority <= 1) return;
    const above = models.find((mm) => mm.priority === m.priority - 1);
    if (above) setModelPriority(above.id, above.priority + 1);
    setModelPriority(id, m.priority - 1);
    refresh();
  };

  const handlePriorityDown = (id: string) => {
    const m = models.find((m) => m.id === id);
    if (!m) return;
    const below = models.find((mm) => mm.priority === m.priority + 1);
    if (below) setModelPriority(below.id, below.priority - 1);
    setModelPriority(id, m.priority + 1);
    refresh();
  };

  const sorted = [...models].sort((a, b) => a.priority - b.priority);
  const activeCount = models.filter((m) => m.enabled).length;

  return (
    <div className="min-h-screen bg-[#050505] p-6 md:p-12 space-y-10 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-purple-500/10 rounded-3xl border border-purple-500/20">
            <Server className="w-8 h-8 text-purple-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">AI Gateway</h1>
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] flex items-center gap-2">
              <Activity className="w-3 h-3" />
              {activeCount} Active · {models.length} Total · Priority-Ordered
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400 hover:bg-purple-500/20 transition-all flex items-center gap-2"
        >
          <RefreshCcw className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-widest">Refresh</span>
        </button>
      </header>

      {/* Warning if none active */}
      {activeCount === 0 && (
        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
          <p className="text-sm font-bold text-red-400">
            No Ollama Cloud models are active! The system will fall back to Gemini automatically.
          </p>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Model Cards */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {sorted.map((m, i) => (
            <ModelCard
              key={m.id}
              model={m}
              usage={usage[m.id] ?? 0}
              onToggle={handleToggle}
              onPriorityUp={handlePriorityUp}
              onPriorityDown={handlePriorityDown}
              isFirst={i === 0}
              isLast={i === sorted.length - 1}
            />
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <FallbackChain models={models} />

          {/* Status Overview */}
          <div className="glass-card p-6 !rounded-[2.5rem]">
            <h2 className="text-xl font-black text-white tracking-tight mb-5 flex items-center gap-3">
              <Activity className="w-5 h-5 text-cyan-400" />
              Provider Overview
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Ollama Cloud', color: 'purple', count: models.filter(m => m.provider === 'ollama').length },
                { label: 'OpenRouter', color: 'blue', count: 1 },
                { label: 'Gemini', color: 'cyan', count: 1 },
                { label: 'Groq', color: 'orange', count: 1 },
              ].map(p => (
                <div key={p.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${p.color}-500`} />
                    <span className="text-xs font-bold text-gray-400">{p.label}</span>
                  </div>
                  <span className={`text-xs font-black text-${p.color}-400`}>{p.count} model{p.count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSettingsPage;
