import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tasks as tasksService, auth } from '../services/platform-sdk';

export interface TaskList {
  id: string;
  title: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  notes?: string;
  due?: string;
}

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
  createTask: (title: string, notes?: string, due?: string) => Promise<void>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(auth.getToken());
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(localStorage.getItem('active_google_task'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    try {
      const token = await auth.login();
      setAccessToken(token);
    } catch (err) {
      setError('Login Failed');
    }
  };

  const logout = useCallback(() => {
    auth.logout();
    setAccessToken(null);
    setTaskLists([]);
    setTasks([]);
    setActiveTaskId(null);
    localStorage.removeItem('active_google_task');
  }, []);

  const refreshTasks = useCallback(async () => {
    if (!auth.getToken()) return;
    setIsLoading(true);
    setError(null);
    try {
      const listData = await tasksService.getLists();
      const lists = listData.items || [];
      setTaskLists(lists);
      
      if (lists.length > 0) {
        const taskData = await tasksService.listAll(lists[0].id);
        setTasks(taskData.items || []);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Unauthorized')) {
        logout();
      } else {
        setError('Failed to fetch tasks');
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const token = auth.getToken();
    if (token) {
        setAccessToken(token);
        refreshTasks();
    }
  }, [refreshTasks]);

  const handleSetActiveTask = (taskId: string | null) => {
    setActiveTaskId(taskId);
    if (taskId) {
      localStorage.setItem('active_google_task', taskId);
    } else {
      localStorage.removeItem('active_google_task');
    }
  };

  const completeTask = async (taskId: string) => {
    if (!auth.getToken() || taskLists.length === 0) return;
    try {
      await tasksService.complete(taskId, taskLists[0].id);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (activeTaskId === taskId) {
        handleSetActiveTask(null);
      }
    } catch (err) {
        console.error('Failed to complete task', err);
    }
  };

  const addNoteToTask = async (taskId: string, noteAddition: string) => {
    if (!auth.getToken() || taskLists.length === 0) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newNotes = task.notes ? `${task.notes}\n${noteAddition}` : noteAddition;
    try {
      const updated = await tasksService.updateTask(taskId, { notes: newNotes }, taskLists[0].id);
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    } catch (err) {
      console.error('Failed to update task notes', err);
    }
  };

  const createTask = async (title: string, notes?: string, due?: string) => {
    if (!auth.getToken() || taskLists.length === 0) return;
    try {
        const newTask = await tasksService.create(title, taskLists[0].id, notes, due);
        setTasks(prev => [newTask, ...prev]);
    } catch (err) {
        console.error('Failed to create task', err);
    }
  }

  return (
    <TasksContext.Provider value={{
      accessToken, taskLists, tasks, activeTaskId, isLoading, error,
      login, logout, setActiveTask: handleSetActiveTask, refreshTasks, completeTask, addNoteToTask, createTask
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
