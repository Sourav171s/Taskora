import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Flag } from "lucide-react";

export function StopwatchWidget() {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<{lap: number, time: number}[]>([]);

  useEffect(() => {
    let interval: number;
    if (running) {
      interval = window.setInterval(() => setTime((t) => t + 10), 10);
    }
    return () => clearInterval(interval);
  }, [running]);

  const format = (ms: number) => {
    const mins = Math.floor(ms / 60000).toString().padStart(2, "0");
    const secs = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
    const millis = Math.floor((ms % 1000) / 10).toString().padStart(2, "0");
    return `${mins}:${secs}.${millis}`;
  };

  const toggle = () => setRunning(!running);
  const reset = () => { setRunning(false); setTime(0); setLaps([]); };
  const lap = () => { if (time > 0) setLaps([{ lap: laps.length + 1, time }, ...laps]); };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-col items-center justify-center p-4 py-6 bg-card rounded-xl border border-border mb-3">
        <span className="text-4xl font-mono text-foreground font-bold tracking-tight">{format(time)}</span>
      </div>
      
      <div className="flex justify-center gap-3 mb-4">
        <button onClick={reset} className="p-3 bg-secondary rounded-full hover:bg-border transition text-muted-foreground"><RotateCcw className="w-5 h-5"/></button>
        <button onClick={toggle} className="p-3 bg-primary rounded-full hover:opacity-90 transition text-primary-foreground shadow-lg shadow-primary/20">
          {running ? <Pause className="w-5 h-5 fill-current"/> : <Play className="w-5 h-5 fill-current"/>}
        </button>
        <button onClick={lap} className="p-3 bg-secondary rounded-full hover:bg-border transition text-muted-foreground"><Flag className="w-5 h-5"/></button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-1.5">
        {laps.map((l) => (
          <div key={l.lap} className="flex justify-between items-center text-sm p-2 rounded bg-input/50 border border-border/50">
            <span className="text-muted-foreground">Lap {l.lap}</span>
            <span className="font-mono text-foreground">{format(l.time)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
