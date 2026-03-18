import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { fetchTaskLists, fetchTasks, updateTaskStatus, GoogleTask, TaskList } from '../utils/googleTasksAPI';

interface TasksContextType {
  accessToken: string | null;
  taskLists: TaskList[];
  tasks: GoogleTask[];
  activeTaskId: string | null;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  setActiveTask: (taskId: string | null) => void;
  refreshTasks: () => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  addNoteToTask: (taskId: string, note: string) => Promise<void>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('google_tasks_token'));
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(localStorage.getItem('active_google_task'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      localStorage.setItem('google_tasks_token', tokenResponse.access_token);
      setError(null);
    },
    onError: (errorResponse) => {
      setError('Login Failed');
      console.error(errorResponse);
    },
    scope: 'https://www.googleapis.com/auth/tasks',
  });

  const logout = useCallback(() => {
    googleLogout();
    setAccessToken(null);
    setTaskLists([]);
    setTasks([]);
    setActiveTaskId(null);
    localStorage.removeItem('google_tasks_token');
    localStorage.removeItem('active_google_task');
  }, []);

  const refreshTasks = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const lists = await fetchTaskLists(accessToken);
      setTaskLists(lists);
      if (lists.length > 0) {
        // Fetch tasks from the first list (usually default)
        const defTasks = await fetchTasks(lists[0].id, accessToken);
        setTasks(defTasks);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('401')) {
        logout(); // Token expired
      } else {
        setError('Failed to fetch tasks');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, logout]);

  useEffect(() => {
    if (accessToken) {
      refreshTasks();
    }
  }, [accessToken, refreshTasks]);

  const handleSetActiveTask = (taskId: string | null) => {
    setActiveTaskId(taskId);
    if (taskId) {
      localStorage.setItem('active_google_task', taskId);
    } else {
      localStorage.removeItem('active_google_task');
    }
  };

  const completeTask = async (taskId: string) => {
    if (!accessToken || taskLists.length === 0) return;
    try {
      await updateTaskStatus(taskLists[0].id, taskId, { status: 'completed' }, accessToken);
      // Remove from local list
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (activeTaskId === taskId) {
        handleSetActiveTask(null);
      }
    } catch (err) {
      console.error('Failed to complete task', err);
    }
  };

  const addNoteToTask = async (taskId: string, noteAddition: string) => {
    if (!accessToken || taskLists.length === 0) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newNotes = task.notes ? `${task.notes}\n${noteAddition}` : noteAddition;
    try {
      const updatedTask = await updateTaskStatus(taskLists[0].id, taskId, { notes: newNotes }, accessToken);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (err) {
      console.error('Failed to update task notes', err);
    }
  };

  return (
    <TasksContext.Provider value={{
      accessToken, taskLists, tasks, activeTaskId, isLoading, error,
      login, logout, setActiveTask: handleSetActiveTask, refreshTasks, completeTask, addNoteToTask
    }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};
