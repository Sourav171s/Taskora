import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AccentColor = "Purple" | "Blue" | "Green" | "Orange" | "Pink";
export type ThemeStr = "Dark" | "Light" | "System";

export interface Settings {
  focusDuration: string;
  shortBreak: string;
  longBreak: string;
  sessionsBeforeLong: string;
  autoStartBreaks: boolean;
  defaultSound: string;
  defaultVolume: string;
  notificationSound: boolean;
  sessionReminders: boolean;
  dailySummary: boolean;
  streakAlerts: boolean;
  theme: ThemeStr;
  accentColor: AccentColor;
  compactMode: boolean;
}

export const defaultSettings: Settings = {
  focusDuration: "25",
  shortBreak: "5",
  longBreak: "15",
  sessionsBeforeLong: "4",
  autoStartBreaks: true,
  defaultSound: "Rain",
  defaultVolume: "60",
  notificationSound: true,
  sessionReminders: true,
  dailySummary: true,
  streakAlerts: false,
  theme: "Dark",
  accentColor: "Purple",
  compactMode: false,
};

export const ACCENT_COLORS: Record<AccentColor, string> = {
  Purple: "#7c5cff",
  Blue: "#3b82f6",
  Green: "#22c55e",
  Orange: "#f59e0b",
  Pink: "#ec4899",
};

interface SettingsContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("taskora_settings");
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("taskora_settings", JSON.stringify(settings));
    
    // Apply global CSS variables based on settings
    const root = document.documentElement;
    
    // Apply accent color
    const color = ACCENT_COLORS[settings.accentColor] || ACCENT_COLORS.Purple;
    root.style.setProperty("--primary-color", color);
    
    // We update Tailwind's primary utility logic via CSS variable.
    // Ensure index.css maps --primary to this color. We will need to update index.css to use this.
    
    // Note: Dark/Light theme logic can be implemented here if light mode exists
    if (settings.theme === "Light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }

  }, [settings]);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
