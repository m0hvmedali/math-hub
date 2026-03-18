import { auth } from './auth';

const BASE_URL = 'https://tasks.googleapis.com/tasks/v1';

class TasksService {
  /**
   * List all pending tasks in a given list
   */
  public async listAll(listId: string = '@default') {
    const res = await auth.fetchWithAuth(`${BASE_URL}/lists/${listId}/tasks?showCompleted=false`);
    return res.json();
  }

  /**
   * Create a new task in a given list
   */
  public async create(title: string, listId: string = '@default', notes?: string) {
    const res = await auth.fetchWithAuth(`${BASE_URL}/lists/${listId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ title, notes })
    });
    return res.json();
  }
}

export const tasks = new TasksService();
