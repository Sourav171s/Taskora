import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export interface Task {
  id: string;
  _id: string;
  title: string;
  priority: "critical" | "high" | "medium" | "low";
  estimatedMinutes: number;
  focusedMinutes: number;
  lastWorked: string;
  completed: boolean;
  project?: string;
  type?: string;
  url?: string;
  repeats?: boolean;
  nextReview?: string;
  scheduled?: boolean;
  order?: number;
  startTime?: string;
}

interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

import api from "@/lib/api";

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTasks = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await api.get("/tasks/gp");
      if (res.data.success) {
        const mapped = res.data.tasks.map((t: any) => ({ ...t, id: t._id }));
        setTasks(mapped);
      }
    } catch (e) {
      console.error("Failed to fetch tasks", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [user, token]);

  const addTask = async (task: Partial<Task>) => {
    if (!token) throw new Error("Not authenticated");
    const res = await api.post("/tasks/gp", task);
    const data = res.data;
    if (data.success) {
      const newTask = { ...data.task, id: data.task._id };
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    }
    throw new Error(data.message || "Failed to add task");
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!token) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    try {
      const res = await api.put(`/tasks/${id}/gp`, updates);
      if (!res.data.success) {
        console.error("Update failed", res.data.message);
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
      fetchTasks();
    }
  };

  const deleteTask = async (id: string) => {
    if (!token) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await api.delete(`/tasks/${id}/gp`);
    } catch (e) {
      fetchTasks();
    }
  };

  return (
    <TaskContext.Provider value={{ tasks, isLoading, fetchTasks, addTask, updateTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used within TaskProvider");
  return ctx;
}
