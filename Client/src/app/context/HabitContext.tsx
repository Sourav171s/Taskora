import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useNotifications } from "./NotificationContext";

export interface Habit {
  _id: string;
  title: string;
  color: string;
  frequency: string;
  completedDates: string[];
}

interface HabitContextType {
  habits: Habit[];
  isLoading: boolean;
  addHabit: (title: string, color: string) => Promise<void>;
  toggleHabit: (habitId: string, dateStr: string) => Promise<void>;
  deleteHabit: (habitId: string, title: string) => Promise<void>;
  fetchHabits: () => Promise<void>;
}

import api from "@/lib/api";

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export function HabitProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { addNotification } = useNotifications();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHabits = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await api.get("/habits");
      if (res.data.success) {
        setHabits(res.data.habits);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();

    // Sync habits occasionally to give a "real-time" sync effect across sessions
    const interval = setInterval(fetchHabits, 1000 * 60 * 5); // every 5 minutes
    return () => clearInterval(interval);
  }, [token]);

  const addHabit = async (title: string, color: string) => {
    if (!title.trim() || !token) return;
    try {
      const res = await api.post("/habits", { title, color });
      if (res.data.success) {
        setHabits(prev => [res.data.habit, ...prev]);
        addNotification({
          type: "system",
          title: "Habit Created",
          message: `Your new habit '${title}' was added successfully.`,
          time: "Just now",
          icon: "🌱"
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleHabit = async (habitId: string, dateStr: string) => {
    if (!token) return;

    // Optimistic UI updates
    setHabits(prev => prev.map(h => {
      if (h._id === habitId) {
        const hasDate = h.completedDates.includes(dateStr);
        const newDates = hasDate
          ? h.completedDates.filter(d => d !== dateStr)
          : [...h.completedDates, dateStr];
        return { ...h, completedDates: newDates };
      }
      return h;
    }));

    try {
      await api.post(`/habits/${habitId}/toggle`, { date: dateStr });
    } catch (err) {
      console.error(err);
      fetchHabits();
    }
  };

  const deleteHabit = async (habitId: string, title: string) => {
    if (!token) return;
    setHabits(prev => prev.filter(h => h._id !== habitId));
    try {
      await api.delete(`/habits/${habitId}`);
      addNotification({
        type: "system",
        title: "Habit Deleted",
        message: `'${title}' was removed.`,
        time: "Just now",
        icon: "🗑️"
      });
    } catch (err) {
      console.error(err);
      fetchHabits();
    }
  };

  return (
    <HabitContext.Provider value={{ habits, isLoading, addHabit, toggleHabit, deleteHabit, fetchHabits }}>
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits() {
  const context = useContext(HabitContext);
  if (!context) throw new Error("useHabits must be used within HabitProvider");
  return context;
}
