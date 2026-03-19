import { auth } from './auth';

const BASE_URL = 'https://tasks.googleapis.com/tasks/v1';

class TasksService {
  /**
   * List all task lists for the user
   */
  public async getLists() {
    const res = await auth.fetchWithAuth(`${BASE_URL}/users/@me/lists?maxResults=20`);
    return res.json();
  }

  /**
   * List all pending tasks in a given list
   */
  public async listAll(listId: string = '@default') {
    const res = await auth.fetchWithAuth(`${BASE_URL}/lists/${listId}/tasks?showCompleted=false`);
    return res.json();
  }

  /**
   * Create a new task with optional due date
   */
  public async create(title: string, listId: string = '@default', notes?: string, due?: string) {
    const res = await auth.fetchWithAuth(`${BASE_URL}/lists/${listId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ title, notes, due })
    });
    return res.json();
  }

  /**
   * Update task details (title, notes, status, due)
   */
  public async updateTask(taskId: string, updates: Partial<{ title: string; notes: string; status: string; due: string }>, listId: string = '@default') {
    const res = await auth.fetchWithAuth(`${BASE_URL}/lists/${listId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    return res.json();
  }

  /**
   * Mark a task as completed (legacy wrapper)
   */
  public async complete(taskId: string, listId: string = '@default') {
    return this.updateTask(taskId, { status: 'completed' }, listId);
  }

  /**
   * Delete a task
   */
  public async deleteTask(taskId: string, listId: string = '@default') {
    const res = await auth.fetchWithAuth(`${BASE_URL}/lists/${listId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    return res;
  }
}

export const tasks = new TasksService();
