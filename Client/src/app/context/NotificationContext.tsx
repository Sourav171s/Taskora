import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useTasks } from "./TaskContext";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

export interface Notification {
  id: string;
  type: "task" | "focus" | "achievement" | "reminder" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (n: Omit<Notification, "id" | "read">) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const { tasks } = useTasks();

  const [hasLoadedInitials, setHasLoadedInitials] = useState(false);

  // Load from local storage initially
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`taskora_notifs_${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setNotifications(parsed);
            setHasLoadedInitials(true);
            return;
          }
        } catch (e) {
          console.error("Error parsing notifications", e);
        }
      }
    }
  }, [user]);

  // Derive initial real-time notifications once when tasks are available, if we haven't recovered from storage
  useEffect(() => {
    if (!user || user.name === undefined || hasLoadedInitials) return;

    // Once tasks load from DB
    if (tasks.length > 0) {
      const generated: Notification[] = [];
      const criticalTasks = tasks.filter((t) => t.priority === "critical" && !t.completed);
      const studyTasks = tasks.filter((t: any) => t.type === "study" && !t.completed); // added any to get around type checks

      // Dynamic Welcome
      generated.push({
        id: `sys-greet-${new Date().toISOString().slice(0, 10)}`, // unique per day
        type: "system",
        title: `Welcome back, ${user.name.split(' ')[0] || 'User'}!`,
        message: "You're all synced up. Let's make today productive.",
        time: "Just now",
        read: false,
        icon: "👋"
      });

      // Real check for critical priorities in DB
      if (criticalTasks.length > 0) {
        generated.push({
          id: `task-crit-${criticalTasks.length}`,
          type: "task",
          title: "Critical Tasks Pending",
          message: `You have ${criticalTasks.length} critical ${criticalTasks.length === 1 ? 'task' : 'tasks'} waiting to be completed.`,
          time: "Just now",
          read: false,
          icon: "⏰"
        });
        // Popup for critical deadlines on startup
        toast("Critical Tasks Pending", {
          description: `You have ${criticalTasks.length} critical ${criticalTasks.length === 1 ? 'task' : 'tasks'} waiting to be completed.`,
          icon: "⏰"
        });
      }

      setNotifications((prev) => [...generated, ...prev]);
      setHasLoadedInitials(true);
    }
  }, [user, tasks, hasLoadedInitials]);

  // Sync back to local storage whenever notifications change
  useEffect(() => {
    if (user && hasLoadedInitials) {
      localStorage.setItem(`taskora_notifs_${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user, hasLoadedInitials]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const playSound = (type: string) => {
    try {
      const audio = new Audio(`/sounds/${type}.mp3`);
      audio.volume = 0.5; // Set volume to 50% so it's not too loud
      audio.play().catch(e => console.log('Audio playback prevented by browser policy:', e));
    } catch (error) {
      console.log("Could not play notification sound", error);
    }
  };

  const addNotification = (n: Omit<Notification, "id" | "read">) => {
    const newN: Notification = { ...n, id: Date.now().toString(), read: false };
    setNotifications((prev) => [newN, ...prev]);
    playSound(n.type);

    // Create a toast popup
    toast(n.title, {
      description: n.message,
      icon: n.icon
    });
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markRead, markAllRead, addNotification, removeNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
