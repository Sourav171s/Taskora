import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Play, Pause, Square, RotateCcw, Brain, Coffee, X, AlertTriangle, Target, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const FOCUS_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;
const TOTAL_SESSIONS = 4;

export function TimerWidget() {
  const { token } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(280);
  const [sessionType, setSessionType] = useState("focus");
  const [timerState, setTimerState] = useState("idle");
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // Stats tracking
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [interruptionsCount, setInterruptionsCount] = useState(0);

  // Observe container width for responsive sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setContainerW(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const [sessionSummary, setSessionSummary] = useState<{ duration: string; interruptions: number; focusScore: number } | null>(null);
  const intervalRef = useRef<number | null>(null);

  const totalDuration = sessionType === "focus" ? FOCUS_DURATION : BREAK_DURATION;
  const progress = 1 - timeLeft / totalDuration;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const start = useCallback(() => {
    setSessionStartTime(new Date());
    setInterruptionsCount(0);
    setTimerState("running");
  }, []);
  
  const pause = useCallback(() => {
    setInterruptionsCount((p) => p + 1);
    setTimerState("paused");
  }, []);
  
  const resume = useCallback(() => setTimerState("running"), []);

  const finish = useCallback(async () => {
    if (sessionType === "focus" && sessionStartTime) {
      const endTime = new Date();
      const elapsedMins = Math.max(1, Math.round((totalDuration - timeLeft) / 60));
      
      // Dynamic score calculation: max 100, -8 for each interruption, time factor
      const timeFactor = elapsedMins >= 20 ? 0 : elapsedMins >= 10 ? 5 : 15;
      const focusScore = Math.max(0, 100 - (interruptionsCount * 8) - timeFactor);

      if (token) {
        try {
          const res = await fetch("http://localhost:4000/api/focus/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              startTime: sessionStartTime.toISOString(),
              endTime: endTime.toISOString(),
              duration: elapsedMins,
              interruptions: interruptionsCount,
              focusScore,
              sessionType: "focus",
            })
          });
          if (res.ok) {
            // Tell other widgets (like Stats) to refresh data!
            window.dispatchEvent(new Event("focus-session-completed"));
          }
        } catch (e) {
          console.error("Failed to save focus session:", e);
        }
      }

      setSessionSummary({ duration: `${elapsedMins}m`, interruptions: interruptionsCount, focusScore });
      setSessionsCompleted((p) => p + 1);
      setSessionType("break");
      setTimeLeft(BREAK_DURATION);
      setSessionStartTime(null);
      setInterruptionsCount(0);
    } else {
      setSessionType("focus");
      setTimeLeft(FOCUS_DURATION);
      setSessionStartTime(null);
      setInterruptionsCount(0);
    }
    setTimerState("idle");
  }, [sessionType, totalDuration, timeLeft, sessionStartTime, interruptionsCount, token]);

  const reset = useCallback(() => {
    setTimerState("idle");
    setSessionType("focus");
    setTimeLeft(FOCUS_DURATION);
    setSessionSummary(null);
    setSessionStartTime(null);
    setInterruptionsCount(0);
  }, []);

  useEffect(() => {
    if (timerState === "running") {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            finish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState, finish]);

  // Space bar shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        if (timerState === "idle") start();
        else if (timerState === "running") pause();
        else if (timerState === "paused") resume();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [timerState, start, pause, resume]);

  // Responsive sizes based on container width
  const scale = useMemo(() => Math.max(0.5, Math.min(1, containerW / 300)), [containerW]);
  const ringSize = Math.round(190 * scale);
  const radius = Math.round(80 * scale);
  const fontSize = Math.round(36 * scale);
  const btnFontSize = Math.max(10, Math.round(12 * scale));
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const currentSessionNum = Math.min(sessionsCompleted + 1, TOTAL_SESSIONS);

  // If showing session summary
  if (sessionSummary) {
    const scoreColor = sessionSummary.focusScore >= 85 ? "#22c55e" : sessionSummary.focusScore >= 70 ? "#f59e0b" : "#ef4444";
    return (
      <div className="flex flex-col items-center">
        <p style={{ fontSize: 11, fontWeight: 600, color: "#8a8a9a", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 12 }}>
          Focus Summary
        </p>

        {/* Score ring */}
        <div className="relative w-[100px] h-[100px] flex items-center justify-center mb-4">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#1A1A24" strokeWidth="4" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={scoreColor}
              strokeWidth="4" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={2 * Math.PI * 40 * (1 - sessionSummary.focusScore / 100)}
            />
          </svg>
          <span style={{ fontSize: 20, fontWeight: 600, color: scoreColor }}>{sessionSummary.focusScore}%</span>
        </div>

        <div className="w-full space-y-2 mb-4">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ background: "#0E0E16" }}>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" style={{ color: "#7C5CFF" }} />
              <span style={{ fontSize: 11.5, color: "#8a8a9a" }}>Duration</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#e4e4ed" }}>{sessionSummary.duration}</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ background: "#0E0E16" }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
              <span style={{ fontSize: 11.5, color: "#8a8a9a" }}>Interruptions</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#e4e4ed" }}>{sessionSummary.interruptions}</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ background: "#0E0E16" }}>
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5" style={{ color: scoreColor }} />
              <span style={{ fontSize: 11.5, color: "#8a8a9a" }}>Focus Score</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: scoreColor }}>{sessionSummary.focusScore}%</span>
          </div>
        </div>

        <button
          onClick={() => setSessionSummary(null)}
          className="focus-btn flex items-center gap-1.5 px-4 py-1.5"
          style={{ fontSize: 12, fontWeight: 500 }}
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center">
      {/* Session badge */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3"
        style={{
          background: sessionType === "focus" ? "rgba(124,92,255,0.12)" : "rgba(34,197,94,0.12)",
          color: sessionType === "focus" ? "#7C5CFF" : "#22c55e",
          fontSize: 11,
          fontWeight: 500,
        }}
      >
        {sessionType === "focus" ? <Brain className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
        {sessionType === "focus" ? "Deep Focus" : "Break"}
      </div>

      {/* Circular progress — scales with container */}
      <div className="relative flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
        <svg className="absolute inset-0 -rotate-90 focus-progress-ring" viewBox={`0 0 ${ringSize} ${ringSize}`}>
          <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke="#1A1A24" strokeWidth={Math.max(2, 3 * scale)} />
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke={sessionType === "focus" ? "#7C5CFF" : "#22c55e"}
            strokeWidth={Math.max(2, 3 * scale)}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="text-center relative z-10">
          <p className="tabular-nums focus-glow-text" style={{ fontSize, fontWeight: 300, color: "#e4e4ed", lineHeight: 1 }}>
            {formatTime(timeLeft)}
          </p>
          <p style={{ fontSize: Math.max(9, Math.round(11 * scale)), color: "#6b6b80", marginTop: Math.round(4 * scale) }}>
            Session {currentSessionNum} of {TOTAL_SESSIONS}
          </p>
        </div>
      </div>

      {/* Focus → Break cycle indicator */}
      <div className="flex items-center gap-1.5 mt-3 mb-1">
        {Array.from({ length: TOTAL_SESSIONS }, (_, i) => {
          const focusDone = i < sessionsCompleted % TOTAL_SESSIONS || (sessionsCompleted > 0 && sessionsCompleted % TOTAL_SESSIONS === 0);
          const isCurrent = i === sessionsCompleted % TOTAL_SESSIONS && sessionType === "focus";
          return (
            <div key={i} className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: isCurrent ? 20 : 14,
                    height: isCurrent ? 20 : 14,
                    background: focusDone ? "#7C5CFF" : isCurrent ? "rgba(124,92,255,0.3)" : "#1A1A24",
                    border: isCurrent ? "1.5px solid #7C5CFF" : "none",
                    boxShadow: isCurrent ? "0 0 6px rgba(124,92,255,0.4)" : "none",
                  }}
                >
                  <Brain style={{ width: isCurrent ? 10 : 7, height: isCurrent ? 10 : 7, color: focusDone || isCurrent ? "#fff" : "#3a3a4a" }} />
                </div>
                {i < TOTAL_SESSIONS - 1 && (
                  <div style={{ width: 6, height: 1.5, borderRadius: 1, background: focusDone ? "rgba(124,92,255,0.4)" : "#1A1A24" }} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mt-1 mb-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: i <= (sessionsCompleted % 4 || (sessionsCompleted > 0 ? 4 : 0)) ? "#7C5CFF" : "#1A1A24",
            }}
          />
        ))}
      </div>

      {/* Controls — scale with container */}
      <div className="flex items-center gap-2">
        {timerState === "idle" && (
          <button onClick={start} className="focus-btn flex items-center gap-1.5 px-4 py-1.5" style={{ fontSize: btnFontSize, fontWeight: 500 }}>
            <Play style={{ width: 14 * scale, height: 14 * scale }} className="fill-current" /> Start
          </button>
        )}
        {timerState === "running" && (
          <>
            <button onClick={pause} className="focus-btn-ghost flex items-center gap-1.5 px-4 py-1.5" style={{ fontSize: btnFontSize, fontWeight: 500 }}>
              <Pause style={{ width: 14 * scale, height: 14 * scale }} /> Pause
            </button>
            <button onClick={finish} className="focus-btn-ghost flex items-center gap-1.5 px-3 py-1.5" style={{ fontSize: btnFontSize, fontWeight: 500 }}>
              <Square style={{ width: 12 * scale, height: 12 * scale }} />
            </button>
          </>
        )}
        {timerState === "paused" && (
          <>
            <button onClick={resume} className="focus-btn flex items-center gap-1.5 px-4 py-1.5" style={{ fontSize: btnFontSize, fontWeight: 500 }}>
              <Play style={{ width: 14 * scale, height: 14 * scale }} className="fill-current" /> Resume
            </button>
            <button onClick={finish} className="focus-btn-ghost flex items-center gap-1.5 px-3 py-1.5" style={{ fontSize: btnFontSize, fontWeight: 500 }}>
              <Square style={{ width: 12 * scale, height: 12 * scale }} />
            </button>
          </>
        )}
        <button onClick={reset} className="p-1.5 rounded hover:bg-[#1A1A24] transition-colors" title="Reset">
          <RotateCcw style={{ width: 14 * scale, height: 14 * scale, color: "#4a4a5a" }} />
        </button>
      </div>

      {/* Keyboard shortcut hints */}
      <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-[#1A1A24]" style={{ width: "100%" }}>
        {[
          { key: "Space", label: "Start / Pause" },
          { key: "R", label: "Reset" },
          { key: "Esc", label: "Exit" },
        ].map((hint) => (
          <div key={hint.key} className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded" style={{ fontSize: 9, background: "#1A1A24", color: "#4a4a5a", border: "1px solid #2a2a3a" }}>
              {hint.key}
            </kbd>
            <span style={{ fontSize: 9.5, color: "#3a3a4a" }}>{hint.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}