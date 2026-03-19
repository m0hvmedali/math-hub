import { EventEmitter } from 'events';

export interface AIEvent {
    id: string;
    timestamp: number;
    model: string;
    provider: string;
    task: string;
    duration: number;
    status: 'success' | 'error';
    error?: string;
    prompt?: string;
    response?: string;
}

export interface ProviderStats {
    id: string;
    name: string;
    status: 'online' | 'degraded' | 'offline';
    avgLatency: number;
    successRate: number;
    totalCalls: number;
    errorCount: number;
    lastUsed: number;
}

class AIMonitor extends EventEmitter {
    private history: AIEvent[] = [];
    private maxHistory = 100;
    private providers: Map<string, ProviderStats> = new Map();

    constructor() {
        super();
        this.initProviders();
    }

    private initProviders() {
        const models = [
            { id: 'gemini', name: 'Gemini 1.5 Flash' },
            { id: 'openrouter', name: 'GPT-OSS-120B' },
            { id: 'groq', name: 'Groq (Llama/Kimi)' },
            { id: 'mistral', name: 'Mistral Large' },
            { id: 'tavily', name: 'Tavily Search' }
        ];

        models.forEach(m => {
            this.providers.set(m.id, {
                id: m.id,
                name: m.name,
                status: 'online',
                avgLatency: 0,
                successRate: 100,
                totalCalls: 0,
                errorCount: 0,
                lastUsed: Date.now()
            });
        });
    }

    logCall(event: Omit<AIEvent, 'id' | 'timestamp'>) {
        const fullEvent: AIEvent = {
            ...event,
            id: Math.random().toString(36).substring(7),
            timestamp: Date.now()
        };

        this.history.unshift(fullEvent);
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }

        this.updateStats(fullEvent);
        this.emit('update', { event: fullEvent, stats: this.getStats() });
    }

    private updateStats(event: AIEvent) {
        const stats = this.providers.get(event.provider);
        if (!stats) return;

        stats.totalCalls++;
        stats.lastUsed = event.timestamp;
        
        if (event.status === 'error') {
            stats.errorCount++;
        }

        // Rolling average for latency (last 10 calls weight)
        if (event.status === 'success') {
            const weight = Math.min(stats.totalCalls, 10);
            stats.avgLatency = (stats.avgLatency * (weight - 1) + event.duration) / weight;
        }

        stats.successRate = ((stats.totalCalls - stats.errorCount) / stats.totalCalls) * 100;

        // Simple Circuit Breaker logic
        if (stats.successRate < 50 && stats.totalCalls > 5) {
            stats.status = 'offline';
        } else if (stats.successRate < 85 || stats.avgLatency > 5000) {
            stats.status = 'degraded';
        } else {
            stats.status = 'online';
        }

        this.providers.set(event.provider, stats);
    }

    getHistory() {
        return this.history;
    }

    getStats() {
        return Array.from(this.providers.values());
    }

    resetProvider(id: string) {
        const p = this.providers.get(id);
        if (p) {
            p.status = 'online';
            p.errorCount = 0;
            p.totalCalls = 0;
            p.avgLatency = 0;
            p.successRate = 100;
            this.emit('update', { stats: this.getStats() });
        }
    }

    clearHistory() {
        this.history = [];
        this.emit('update', { stats: this.getStats() });
    }
}

export const monitor = new AIMonitor();
