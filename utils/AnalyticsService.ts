import { hubCore } from './HubCore';

export interface AnalyticsEvent {
  id: string;
  action: string;
  args: any[];
  timestamp: number;
}

class AnalyticsService {
  private history: AnalyticsEvent[] = [];
  private readonly STORAGE_KEY = 'math_hub_analytics_v1';

  constructor() {
    this.loadHistory();
    // Subscribe to HubCore to track all actions
    hubCore.subscribe((id, action, args) => {
      this.trackEvent(id, action, args);
    });
  }

  private loadHistory() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.history = JSON.parse(stored);
      } catch (e) {
        console.error("[AnalyticsService] Failed to load history", e);
        this.history = [];
      }
    }
  }

  private saveHistory() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history.slice(-1000))); // Keep last 1000 events
  }

  private trackEvent(id: string, action: string, args: any[]) {
    // Avoid circular logging if AnalyticsPage itself triggers refresh
    if (id === 'AnalyticsPage') return;

    const event: AnalyticsEvent = {
      id,
      action,
      args,
      timestamp: Date.now()
    };

    this.history.push(event);
    this.saveHistory();
    console.log(`[Analytics] Tracked: ${action} on ${id}`);
  }

  getHistory(): AnalyticsEvent[] {
    return [...this.history];
  }

  clearHistory() {
    this.history = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }

  getActivityStats() {
    const stats: Record<string, number> = {};
    this.history.forEach(event => {
      stats[event.action] = (stats[event.action] || 0) + 1;
    });
    return stats;
  }
}

export const analyticsService = new AnalyticsService();
