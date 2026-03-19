import { useEffect } from 'react';

export interface PageModule {
  id: string;
  state: any;
  actions: Record<string, (...args: any) => void>;
}

export interface HubCommand {
  id: string;
  description: string;
  execute: (...args: any) => void;
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

class Assistant {
  private commands: Map<string, HubCommand> = new Map();

  /**
   * Register a named command (macro) in the assistant's library.
   */
  registerCommand(cmd: HubCommand) {
    console.log(`[Assistant] Registering command: ${cmd.id} (${cmd.description})`);
    this.commands.set(cmd.id, cmd);
  }

  /**
   * Run a specific command by ID.
   */
  runCommand(id: string, ...args: any) {
    const cmd = this.commands.get(id);
    if (cmd) {
      console.log(`%c[Assistant] Running: ${id}`, "color: #10B981; font-weight: bold;");
      cmd.execute(...args);
    } else {
      console.warn(`[Assistant] Command not found: ${id}`);
    }
  }

  /**
   * Get all registered commands.
   */
  getAvailableCommands(): HubCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Execute a sequence of commands (Macro).
   */
  runSequence(ids: string[]) {
    console.group(`[Assistant] Sequence Execution (${ids.length} steps)`);
    ids.forEach(id => this.runCommand(id));
    console.groupEnd();
  }

  /**
   * Use the Central Brain (AI Router) to interpret a command and execute it.
   */
  async performBrainAction(input: string, generateTextFn: any) {
    console.log(`[Assistant] Brain is thinking: ${input}`);
    const atoms = Array.from(hubCore['pages'].keys());
    const macros = this.getAvailableCommands();
    
    const prompt = `
User Command: "${input}"
Available Atoms (Features): ${atoms.join(', ')}
Available Macros (Registered Commands):
${macros.map(m => `- ${m.id}: ${m.description}`).join('\n')}

Goal: Decide which action to execute. 
Return ONLY a valid JSON object:
If it's a Macro: { "commandId": "MACRO_ID", "args": [] }
If it's an Atom Action: { "atomId": "ATOM_ID", "action": "ACTION_NAME", "args": [] }
If unsure: { "error": "Reason" }
    `;

    try {
      const result = await generateTextFn(prompt, { task: 'brain', json: true });
      const cmd = typeof result === 'string' ? JSON.parse(result) : result;
      
      if (cmd.commandId) {
        console.log(`[Assistant] AI executing Macro: ${cmd.commandId}`);
        this.runCommand(cmd.commandId, ...(cmd.args || []));
      } else if (cmd.atomId && cmd.action) {
        console.log(`[Assistant] AI executing Atom Action: ${cmd.atomId}.${cmd.action}`);
        hubCore.execute(cmd.atomId, cmd.action, ...(cmd.args || []));
      } else if (cmd.error) {
        throw new Error(cmd.error);
      }
    } catch (e) {
      console.error("[Assistant] AI Brain failed", e);
      throw e;
    }
  }
}

export const assistant = new Assistant();

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
