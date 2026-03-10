import { useState, useEffect } from "react";
import { Wind, Play, Square } from "lucide-react";

export function BreatheWidget() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<"idle" | "inhale" | "hold" | "exhale">("idle");
  const [seconds, setSeconds] = useState(4); // 4-7-8 breathing technique

  useEffect(() => {
    let interval: number | undefined;

    if (isActive) {
      interval = window.setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            // Cycle phases
            setPhase((currPhase) => {
              if (currPhase === "inhale") return "hold";
              if (currPhase === "hold") return "exhale";
              return "inhale";
            });
            // Return next seconds
            return phase === "inhale" ? 7 : phase === "hold" ? 8 : 4; 
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
      setPhase("idle");
      setSeconds(4);
    }

    return () => clearInterval(interval);
  }, [isActive, phase]);

  const toggle = () => {
    if (!isActive) {
      setPhase("inhale");
      setSeconds(4);
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  };

  const getMessage = () => {
    if (!isActive) return "Ready to relax?";
    if (phase === "inhale") return "Breathe in...";
    if (phase === "hold") return "Hold...";
    if (phase === "exhale") return "Breathe out...";
    return "";
  };

  // Determine scale based on phase
  const getScale = () => {
    if (!isActive) return 1;
    if (phase === "inhale") return 1.5; // grows
    if (phase === "hold") return 1.5;   // stays big
    if (phase === "exhale") return 1;   // shrinks back
    return 1;
  };

  const getDuration = () => {
    if (!isActive) return "0s";
    if (phase === "inhale") return "4s";
    if (phase === "hold") return "7s";
    if (phase === "exhale") return "8s";
    return "1s";
  };

  return (
    <div className="flex flex-col h-full w-full items-center justify-center relative p-4">
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Breathing Circle */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-6">
          <div 
            className="absolute inset-0 rounded-full"
            style={{
               background: "rgba(124,92,255,0.15)",
               border: "2px solid rgba(124,92,255,0.3)",
               transform: `scale(${getScale()})`,
               transition: `transform ${getDuration()} linear`
            }}
          />
          <div className="relative z-10 flex flex-col items-center">
            <Wind className="w-8 h-8 mb-1" style={{ color: "#7C5CFF" }} />
            {isActive && (
              <span style={{ fontSize: 24, fontWeight: 700, color: "#e4e4ed" }}>{seconds}</span>
            )}
          </div>
        </div>

        {/* Phase Text */}
        <p style={{ fontSize: 16, fontWeight: 500, color: "#8a8a9a", height: 24, transition: "color 0.3s" }}>
          {getMessage()}
        </p>
      </div>

      {/* Controls */}
      <div className="mt-auto pt-4 border-t border-[#1A1A24] w-full flex justify-center">
        <button 
          onClick={toggle}
          className="focus-btn flex items-center gap-2 px-5 py-2"
          style={{ fontSize: 13, background: isActive ? "rgba(239, 68, 68, 0.1)" : undefined, color: isActive ? "#ef4444" : undefined }}
        >
          {isActive ? (
            <>
              <Square className="w-4 h-4" /> Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> Start 4-7-8
            </>
          )}
        </button>
      </div>
    </div>
  );
}
