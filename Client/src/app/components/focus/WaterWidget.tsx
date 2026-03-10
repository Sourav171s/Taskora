import { useState } from "react";
import { Droplet, Plus, Minus } from "lucide-react";

export function WaterWidget() {
  const [glasses, setGlasses] = useState(0);
  const goal = 8;
  const fillHeight = Math.min((glasses / goal) * 100, 100);

  return (
    <div className="flex flex-col h-full w-full items-center justify-center p-4 relative overflow-hidden bg-card rounded-lg border border-border">
      {/* Wave Background */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-[#3b82f6]/20 transition-all duration-1000 ease-in-out z-0"
        style={{ height: `${fillHeight}%` }}
      />
      <div 
        className="absolute bottom-0 left-0 right-0 bg-[#3b82f6]/30 transition-all duration-700 ease-in-out z-0"
        style={{ height: `${fillHeight}%`, transform: 'scaleX(1.1) translateX(-5%)' }}
      />

      <div className="z-10 text-center mb-8 flex flex-col items-center">
        <Droplet className="w-10 h-10 text-[#3b82f6] mb-3 drop-shadow-lg transition-colors" fill={glasses > 0 ? "#3b82f6" : "none"} />
        <h2 className="text-4xl font-bold text-foreground mb-1">{glasses} <span className="text-xl text-muted-foreground font-medium">/ {goal}</span></h2>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Glasses of Water</p>
      </div>

      <div className="z-10 flex gap-4">
        <button 
          onClick={() => setGlasses(Math.max(0, glasses - 1))}
          className="w-12 h-12 bg-secondary border border-border hover:bg-border rounded-full flex items-center justify-center text-muted-foreground transition"
        >
          <Minus className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setGlasses(glasses + 1)}
          className="w-12 h-12 bg-[#3b82f6] hover:bg-[#2563eb] rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20 transition"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
