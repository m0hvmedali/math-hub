// Google Tasks REST API Utility
// Requires an active Google Access Token

const BASE_URL = 'https://tasks.googleapis.com/tasks/v1';

export interface TaskList {
  id: string;
  title: string;
  updated: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  notes?: string;
  due?: string;
  completed?: string;
}

export const fetchTaskLists = async (accessToken: string): Promise<TaskList[]> => {
  const response = await fetch(`${BASE_URL}/users/@me/lists`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch task lists');
  }

  const data = await response.json();
  return data.items || [];
};

export const fetchTasks = async (listId: string, accessToken: string): Promise<GoogleTask[]> => {
  const response = await fetch(`${BASE_URL}/lists/${listId}/tasks?showCompleted=false`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }

  const data = await response.json();
  return data.items || [];
};

export const insertTask = async (listId: string, title: string, accessToken: string, notes?: string): Promise<GoogleTask> => {
  const response = await fetch(`${BASE_URL}/lists/${listId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, notes }),
  });

  if (!response.ok) {
    throw new Error('Failed to insert task');
  }

  return response.json();
};

export const updateTaskStatus = async (
  listId: string,
  taskId: string,
  updates: Partial<GoogleTask>,
  accessToken: string
): Promise<GoogleTask> => {
  const response = await fetch(`${BASE_URL}/lists/${listId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update task');
  }

  return response.json();
};
