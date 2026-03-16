import { hubCore } from './HubCore';

export interface AnalyticsEvent {
  id: string;
  action: string;
  args: any[];
  timestamp: number;
}

class AnalyticsService {
  private history: AnalyticsEvent[] = [];
  private interactions = { clicks: 0, keypresses: 0 };
  private lastHeartbeat: number = Date.now();
  private readonly STORAGE_KEY = 'math_hub_analytics_v1';
  private readonly STATS_KEY = 'math_hub_interaction_stats_v1';

  constructor() {
    this.loadHistory();
    // Subscribe to HubCore to track all actions
    hubCore.subscribe((id, action, args) => {
      if (action === 'system_click') {
        this.interactions.clicks++;
        this.saveStats();
      } else if (action === 'system_keypress') {
        this.interactions.keypresses++;
        this.saveStats();
      } else {
        this.trackEvent(id, action, args);
      }
    });

    // Initialize session heartbeat
    setInterval(() => this.recordHeartbeat(), 60000);
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
    const stats = localStorage.getItem(this.STATS_KEY);
    if (stats) {
      try {
        this.interactions = JSON.parse(stats);
      } catch (e) {
        this.interactions = { clicks: 0, keypresses: 0 };
      }
    }
  }

  private saveStats() {
    localStorage.setItem(this.STATS_KEY, JSON.stringify(this.interactions));
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

  private recordHeartbeat() {
    this.trackEvent('System', 'session_heartbeat', ['active_minute']);
  }

  getInteractions() {
    return { ...this.interactions };
  }

  getHistory(): AnalyticsEvent[] {
    return [...this.history];
  }

  clearHistory() {
    this.history = [];
    this.interactions = { clicks: 0, keypresses: 0 };
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STATS_KEY);
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
