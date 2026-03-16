import { useEffect } from 'react';

export interface PageModule {
  id: string;
  state: any;
  actions: Record<string, (...args: any) => void>;
}

class HubCore {
  private pages: Map<string, PageModule> = new Map();
  private subscribers: Set<(id: string, action: string, args: any[]) => void> = new Set();

  /**
   * Register a module (page or component) with the Hub Core.
   */
  register(page: PageModule) {
    console.log(`[HubCore] Registering atom: ${page.id}`);
    this.pages.set(page.id, page);
  }

  /**
   * Unregister a module when it unmounts.
   */
  unregister(id: string) {
    console.log(`[HubCore] Unregistering atom: ${id}`);
    this.pages.delete(id);
  }

  /**
   * Execute a specific action on a registered module.
   */
  execute(pageId: string, action: string, ...args: any[]) {
    const page = this.pages.get(pageId);
    if (page && page.actions[action]) {
      console.log(`[HubCore] Executing action '${action}' on '${pageId}'`);
      page.actions[action](...args);
      this.notifySubscribers(pageId, action, args);
    } else {
      console.warn(`[HubCore] Action '${action}' not found on '${pageId}'`);
    }
  }

  /**
   * Broadcast an action to all modules that implement it.
   */
  broadcast(action: string, ...args: any[]) {
    console.log(`[HubCore] Broadcasting action '${action}' to all atoms`);
    for (const [id, page] of this.pages.entries()) {
      if (page.actions[action]) {
        page.actions[action](...args);
        this.notifySubscribers(id, action, args);
      }
    }
  }

  /**
   * Get the state of a specific module.
   */
  getState(pageId: string) {
    return this.pages.get(pageId)?.state;
  }

  /**
   * Update the state of a registered module.
   */
  updateState(pageId: string, newState: any) {
    const page = this.pages.get(pageId);
    if (page) {
      page.state = { ...page.state, ...newState };
    }
  }

  /**
   * Subscribe to all actions executed through the Hub Core.
   */
  subscribe(callback: (id: string, action: string, args: any[]) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(id: string, action: string, args: any[]) {
    this.subscribers.forEach(cb => cb(id, action, args));
  }
}

export const hubCore = new HubCore();

/**
 * React Hook for automatic module registration and lifecycle management.
 */
export function useHubCore(config: PageModule | null) {
  useEffect(() => {
    if (config) {
      hubCore.register(config);
      return () => hubCore.unregister(config.id);
    }
  }, [config]);
}
