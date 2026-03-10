import { Flame, Target, Clock, TrendingUp, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API = "http://localhost:4000/api";

function Sparkline({ data }: { data: number[] }) {
  const width = 200;
  const height = 40;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C5CFF" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#7C5CFF" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill="url(#sparkGrad)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="#7C5CFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatMins(total: number) {
  if (!total) return "0m";
  const h = Math.floor(total / 60);
  const m = Math.floor(total % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function StatsWidget() {
  const { token } = useAuth();
  const [daily, setDaily] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [dRes, sRes] = await Promise.all([
          fetch(`${API}/analytics/daily`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/focus/sessions?limit=12`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const [dData, sData] = await Promise.all([ dRes.json(), sRes.json() ]);

        if (dData.success) setDaily(dData.analytics);
        if (sData.success) setSessions(sData.sessions.reverse()); // Chronological

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    const handleNewSession = () => fetchData();
    window.addEventListener("focus-session-completed", handleNewSession);
    
    return () => window.removeEventListener("focus-session-completed", handleNewSession);
  }, [token]);

  if (isLoading || !daily) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#7C5CFF]" />
      </div>
    );
  }

  const focusScore = daily.avgFocusScore ? Math.round(daily.avgFocusScore) : 0;
  
  const stats = [
    { label: "Sessions", value: String(daily.sessions), icon: Target, sub: "today" },
    { label: "Streak", value: "Active", icon: Flame, sub: "current" },
    { label: "Focused", value: formatMins(daily.totalMinutes), icon: Clock, sub: "today" },
    { label: "Efficiency", value: `${focusScore}%`, icon: TrendingUp, sub: "score" },
  ];

  // Map last 12 sessions duration for the sparkline
  const miniGraphData = sessions.length > 0 
    ? sessions.map(s => s.duration)
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
  // Ensure we have at least 2 points for a line
  if (miniGraphData.length === 1) miniGraphData.push(miniGraphData[0]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {stats.map((s) => (
          <div key={s.label} className="p-2 rounded-lg" style={{ background: "#0E0E16" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className="w-3 h-3" style={{ color: "#7C5CFF" }} />
              <span style={{ fontSize: 10, color: "#6b6b80" }}>{s.label}</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#e4e4ed", lineHeight: 1.2 }}>{s.value}</p>
            <p style={{ fontSize: 9, color: "#4a4a5a" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Mini graph */}
      <div className="p-2.5 rounded-lg" style={{ background: "#0E0E16" }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: 11, color: "#6b6b80" }}>Focus Trend</span>
          <span style={{ fontSize: 10, color: "#4a4a5a" }}>Last {Math.max(sessions.length, 12)} sessions</span>
        </div>
        <Sparkline data={miniGraphData} />
      </div>
    </div>
  );
}