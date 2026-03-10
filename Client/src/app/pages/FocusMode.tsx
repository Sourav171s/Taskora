import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft, Timer, TimerReset, Music, Volume2, ListTodo, BarChart3, PanelLeftClose, PanelLeftOpen, RotateCcw, Keyboard, Wind, StickyNote, Droplets, CalendarDays, Globe, BookA, Palette, Bookmark
} from "lucide-react";
import { DraggableWidget } from "../components/focus/DraggableWidget";
import { TimerWidget } from "../components/focus/TimerWidget";
import { MusicWidget } from "../components/focus/MusicWidget";
import { AmbienceWidget } from "../components/focus/AmbienceWidget";
import { TodoWidget } from "../components/focus/TodoWidget";
import { StatsWidget } from "../components/focus/StatsWidget";
import { BreatheWidget } from "../components/focus/BreatheWidget";
import { NotesWidget } from "../components/focus/NotesWidget";
import { StopwatchWidget } from "../components/focus/StopwatchWidget";
import { WaterWidget } from "../components/focus/WaterWidget";
import { CalendarWidget } from "../components/focus/CalendarWidget";
import { ClockWidget } from "../components/focus/ClockWidget";
import { DictionaryWidget } from "../components/focus/DictionaryWidget";
import { WhiteboardWidget } from "../components/focus/WhiteboardWidget";
import { BookmarksWidget } from "../components/focus/BookmarksWidget";

/*
  Structured grid layout:
  ┌──────────┬───────────┬──────────┐
  │  Timer   │  To-Do    │  Stats   │
  │  (col 1) │  (col 2)  │  (col 3) │
  ├──────────┴───────────┤──────────┤
  │  Music               │ Ambience │
  │  (col 1-2)           │ (col 3)  │
  └──────────────────────┴──────────┘
*/

const WIDGET_CONFIG = {
  timer:    { title: "Timer",      icon: Timer,       defaultSize: { w: 320, h: 420 }, minSize: { w: 240, h: 300 }, defaultPos: { x: 20, y: 52 } },
  todo:     { title: "To-Do List", icon: ListTodo,    defaultSize: { w: 340, h: 420 }, minSize: { w: 220, h: 200 }, defaultPos: { x: 360, y: 52 } },
  stats:    { title: "Focus Stats",icon: BarChart3,   defaultSize: { w: 280, h: 420 }, minSize: { w: 220, h: 200 }, defaultPos: { x: 720, y: 52 } },
  music:    { title: "Music",      icon: Music,       defaultSize: { w: 500, h: 260 }, minSize: { w: 280, h: 180 }, defaultPos: { x: 20, y: 490 } },
  ambience: { title: "Ambience",   icon: Volume2,     defaultSize: { w: 320, h: 260 }, minSize: { w: 220, h: 180 }, defaultPos: { x: 540, y: 490 } },
  notes:    { title: "Scratchpad", icon: StickyNote,  defaultSize: { w: 340, h: 260 }, minSize: { w: 220, h: 180 }, defaultPos: { x: 880, y: 490 } },
  breathe:  { title: "Breathe",    icon: Wind,        defaultSize: { w: 320, h: 420 }, minSize: { w: 220, h: 300 }, defaultPos: { x: 1020, y: 52 } },
  stopwatch:  { title: "Stopwatch",  icon: TimerReset,defaultSize: { w: 300, h: 240 }, minSize: { w: 220, h: 180 }, defaultPos: { x: 340, y: 80 } },
  water:      { title: "Hydration",  icon: Droplets,  defaultSize: { w: 240, h: 280 }, minSize: { w: 200, h: 220 }, defaultPos: { x: 670, y: 80 } },
  calendar:   { title: "Calendar",   icon: CalendarDays,defaultSize: { w: 320, h: 320 }, minSize: { w: 280, h: 280 }, defaultPos: { x: 930, y: 80 } },
  clock:      { title: "World Clock",icon: Globe,     defaultSize: { w: 320, h: 280 }, minSize: { w: 240, h: 220 }, defaultPos: { x: 50, y: 460 } },
  dictionary: { title: "Dictionary", icon: BookA,     defaultSize: { w: 340, h: 360 }, minSize: { w: 260, h: 240 }, defaultPos: { x: 390, y: 340 } },
  whiteboard: { title: "Whiteboard", icon: Palette,   defaultSize: { w: 400, h: 360 }, minSize: { w: 280, h: 240 }, defaultPos: { x: 750, y: 380 } },
  bookmarks:  { title: "Bookmarks",  icon: Bookmark,  defaultSize: { w: 300, h: 320 }, minSize: { w: 220, h: 240 }, defaultPos: { x: 50, y: 230 } },
};

const WIDGET_IDS = Object.keys(WIDGET_CONFIG);

export function FocusMode() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeWidgets, setActiveWidgets] = useState({
    timer: false, music: false, ambience: false, todo: false, stats: false, breathe: false, notes: false,
    stopwatch: false, water: false, calendar: false, clock: false, dictionary: false, whiteboard: false, bookmarks: false,
  });
  const [zIndices, setZIndices] = useState(() => {
    const init: Record<string, number> = {};
    WIDGET_IDS.forEach((id, i) => { init[id] = i + 1; });
    return init;
  });
  const [topZ, setTopZ] = useState(WIDGET_IDS.length + 1);
  const [resetKey, setResetKey] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const bringToFront = useCallback((id: string) => {
    setZIndices((prev) => ({ ...prev, [id]: topZ }));
    setTopZ((p) => p + 1);
  }, [topZ]);

  const toggleWidget = useCallback((id: string) => {
    setActiveWidgets((prev) => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
  }, []);

  const closeWidget = useCallback((id: string) => {
    setActiveWidgets((prev) => ({ ...prev, [id]: false }));
  }, []);

  const resetWorkspace = useCallback(() => {
    setActiveWidgets({
      timer: false, music: false, ambience: false, todo: false, stats: false, breathe: false, notes: false,
      stopwatch: false, water: false, calendar: false, clock: false, dictionary: false, whiteboard: false, bookmarks: false,
    });
    const init: Record<string, number> = {};
    WIDGET_IDS.forEach((id, i) => { init[id] = i + 1; });
    setZIndices(init);
    setTopZ(WIDGET_IDS.length + 1);
    setResetKey((p) => p + 1);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;

      if (e.key === "w" || e.key === "W") {
        e.preventDefault();
        setSidebarOpen((p) => !p);
      }
      if (e.key === "Escape") {
        navigate("/");
      }
      if (e.key === "?" || (e.shiftKey && e.code === "Slash")) {
        e.preventDefault();
        setShowShortcuts((p) => !p);
      }
      if (e.key === "r" && !e.metaKey && !e.ctrlKey) {
        resetWorkspace();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, resetWorkspace]);

  const sidebarWidth = sidebarOpen ? 200 : 0;

  const getPosition = (id: string) => {
    const config = WIDGET_CONFIG[id as keyof typeof WIDGET_CONFIG];
    const base = config.defaultPos;
    const size = config.defaultSize;
    let x = base.x + sidebarWidth;
    let y = base.y;

    if (typeof window !== "undefined") {
      const maxX = window.innerWidth - size.w - 20;
      const maxY = window.innerHeight - size.h - 20;
      if (x > maxX) x = Math.max(sidebarWidth + 20, maxX);
      if (y > maxY) y = Math.max(20, maxY);
    }

    return { x, y };
  };

  const renderWidget = (id: string) => {
    const config = WIDGET_CONFIG[id as keyof typeof WIDGET_CONFIG];
    const WidgetContent = {
      timer: TimerWidget, music: MusicWidget, ambience: AmbienceWidget, todo: TodoWidget, stats: StatsWidget, breathe: BreatheWidget, notes: NotesWidget,
      stopwatch: StopwatchWidget, water: WaterWidget, calendar: CalendarWidget, clock: ClockWidget, dictionary: DictionaryWidget, whiteboard: WhiteboardWidget, bookmarks: BookmarksWidget,
    }[id] as React.ComponentType;

    return (
      <DraggableWidget
        key={`${id}-${resetKey}`}
        title={config.title}
        icon={config.icon}
        defaultPosition={getPosition(id)}
        defaultSize={config.defaultSize}
        minSize={config.minSize}
        zIndex={zIndices[id]}
        onFocus={() => bringToFront(id)}
        onClose={() => closeWidget(id)}
      >
        <WidgetContent />
      </DraggableWidget>
    );
  };

  return (
    <div className="h-screen focus-canvas relative overflow-hidden flex">
      {/* Widget Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            className="focus-sidebar h-full flex flex-col shrink-0 relative bg-sidebar border-r border-border z-50"
            style={{ width: 200 }}
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -200, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Widgets
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground transition-colors"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* Widget toggles */}
            <div className="flex-1 px-3 py-3 space-y-1">
              {WIDGET_IDS.map((id) => {
                const config = WIDGET_CONFIG[id as keyof typeof WIDGET_CONFIG];
                const Icon = config.icon;
                const isActive = activeWidgets[id as keyof typeof activeWidgets];
                return (
                  <button
                    key={id}
                    onClick={() => toggleWidget(id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all border ${
                      isActive ? "bg-primary/10 border-l-2 border-l-primary" : "bg-transparent border-transparent hover:bg-secondary"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {config.title}
                    </span>
                    <div className="ml-auto">
                      <div
                        className={`w-7 h-[16px] rounded-full relative transition-colors cursor-pointer ${isActive ? 'bg-primary' : 'bg-input'}`}
                      >
                        <div
                          className="absolute top-[2px] w-[12px] h-[12px] rounded-full bg-white transition-all shadow-sm"
                          style={{ left: isActive ? 13 : 2 }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sidebar footer */}
            <div className="px-3 py-3 border-t border-border space-y-1.5">
              <button
                onClick={resetWorkspace}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Reset Workspace</span>
                <kbd className="ml-auto px-1 py-0.5 rounded bg-input font-mono text-[9px] border border-border">R</kbd>
              </button>
              <div className="px-2.5 pt-1 text-center">
                <p className="text-[10px] text-muted-foreground">
                  Press <kbd className="px-1 py-0.5 rounded bg-input border border-border">W</kbd> to toggle sidebar
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main canvas area */}
      <div className="flex-1 relative bg-background">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2.5 z-40">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg bg-card border border-border text-muted-foreground hover:bg-secondary transition-colors"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Exit
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="p-1.5 rounded-lg bg-card border border-border text-muted-foreground hover:bg-secondary transition-colors"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Keyboard shortcuts tooltip */}
        <AnimatePresence>
          {showShortcuts && (
            <motion.div
              className="absolute top-12 right-4 z-50 rounded-xl p-3"
              style={{ background: "#12121A", border: "1px solid #1A1A24", width: 220 }}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              <p style={{ fontSize: 11, fontWeight: 600, color: "#8a8a9a", marginBottom: 8 }}>Keyboard Shortcuts</p>
              {[
                { key: "Space", desc: "Play / Pause timer" },
                { key: "W", desc: "Toggle sidebar" },
                { key: "R", desc: "Reset workspace" },
                { key: "?", desc: "Toggle shortcuts" },
                { key: "Esc", desc: "Exit focus mode" },
              ].map((s) => (
                <div key={s.key} className="flex items-center justify-between py-1">
                  <span style={{ fontSize: 11, color: "#6b6b80" }}>{s.desc}</span>
                  <kbd className="px-1.5 py-0.5 rounded" style={{ fontSize: 10, background: "#1A1A24", color: "#4a4a5a", border: "1px solid #2a2a3a" }}>
                    {s.key}
                  </kbd>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Widgets */}
        <AnimatePresence>
          {WIDGET_IDS.filter((id) => activeWidgets[id as keyof typeof activeWidgets]).map((id) => renderWidget(id))}
        </AnimatePresence>

        {/* Empty state */}
        {WIDGET_IDS.every((id) => !activeWidgets[id as keyof typeof activeWidgets]) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center flex flex-col items-center">
               <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-primary/5 border border-primary/20">
                  <Timer className="w-8 h-8 text-primary" />
               </div>
               <h1 className="text-2xl font-bold text-foreground mb-2">Ready to do great things?</h1>
               <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                 A quiet space for deep, unbroken focus. Toggle your widgets from the left sidebar to build your perfect workspace.
               </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}