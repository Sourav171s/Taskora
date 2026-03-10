import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Clock, Flame, Target, TrendingUp, Award, Calendar, AlertTriangle, Brain, Coffee, Star, Loader2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TaskContext";
import api from "@/lib/api";

const tooltipStyle = {
  background: "#1a1a24",
  border: "1px solid #1e1e2d",
  borderRadius: 6,
  fontSize: 11,
  color: "#e4e4ed",
  padding: "6px 10px",
};

/* ═══════════════════════════════════════════════════
   CalendarHeatmap — GitHub-style contribution graph
   ═══════════════════════════════════════════════════ */
const HM_CELL_SIZE = 14;
const HM_CELL_GAP = 3;
const HM_CELL_STEP = HM_CELL_SIZE + HM_CELL_GAP;
const HM_CELL_RADIUS = 3;
const HM_DAY_LABEL_WIDTH = 36;

function getColor(v: number) {
  if (v === 0) return "#16161f";
  if (v < 60) return "#2e1065";
  if (v < 120) return "#5b21b6";
  if (v < 180) return "#7c3aed";
  return "#a78bfa";
}

const LEGEND_SAMPLES = [0, 30, 80, 150, 210];

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function CalendarHeatmap({ data }: { data: { date: string, value: number }[] }) {
  const [tooltip, setTooltip] = useState<{ x: number, y: number, date: string, value: number } | null>(null);

  const { weekColumns, monthLabels, totalWeeks } = useMemo(() => {
    if (!data.length) return { weekColumns: [], monthLabels: [], totalWeeks: 0 };
    const weeks: any[] = [];
    let currentWeek: any[] = [];
    const firstDate = new Date(data[0].date + "T00:00:00");
    const startDay = firstDate.getDay();
    for (let i = 0; i < startDay; i++) currentWeek.push(null);
    data.forEach((d) => {
      currentWeek.push(d);
      if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
    });
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }
    const labels: any[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wIdx) => {
      const validDay = week.find((d) => d !== null);
      if (validDay) {
        const m = new Date(validDay.date + "T00:00:00").getMonth();
        if (m !== lastMonth) {
          labels.push({ label: new Date(validDay.date + "T00:00:00").toLocaleString("en", { month: "short" }), weekIdx: wIdx });
          lastMonth = m;
        }
      }
    });
    return { weekColumns: weeks, monthLabels: labels, totalWeeks: weeks.length };
  }, [data]);

  const handleMouseEnter = useCallback((e: any, day: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ x: rect.left + rect.width / 2, y: rect.top, date: day.date, value: day.value });
  }, []);
  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  const gridWidth = totalWeeks * HM_CELL_STEP - HM_CELL_GAP;
  const totalWidth = HM_DAY_LABEL_WIDTH + gridWidth;
  const totalHours = Math.round(data.reduce((s, d) => s + d.value, 0) / 60);

  return (
    <div className="space-y-3">
      <style>{`.hm-cell{transition:box-shadow .12s ease,filter .12s ease}.hm-cell:hover{box-shadow:0 0 0 2px rgba(139,92,246,.55);filter:brightness(1.25)}`}</style>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-muted-foreground" style={{ fontSize: 12 }}>
          {totalHours.toLocaleString()} total focus hours
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground" style={{ fontSize: 11 }}>Less</span>
          {LEGEND_SAMPLES.map((v) => (
            <div key={v} style={{ width: HM_CELL_SIZE, height: HM_CELL_SIZE, borderRadius: HM_CELL_RADIUS, background: getColor(v) }} />
          ))}
          <span className="text-muted-foreground" style={{ fontSize: 11 }}>More</span>
        </div>
      </div>
      <div className="overflow-x-auto" style={{ paddingBottom: 4 }}>
        <div style={{ minWidth: totalWidth }}>
          <div style={{ display: "flex" }}>
            <div style={{ width: HM_DAY_LABEL_WIDTH, flexShrink: 0, display: "flex", flexDirection: "column", gap: HM_CELL_GAP }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, idx) => (
                <div key={label} style={{ height: HM_CELL_SIZE, display: "flex", alignItems: "center", fontSize: 10, color: "#6b6b80", visibility: idx % 2 === 1 ? "visible" : "hidden" }}>{label}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateRows: `repeat(7, ${HM_CELL_SIZE}px)`, gridAutoFlow: "column", gridAutoColumns: `${HM_CELL_SIZE}px`, gap: HM_CELL_GAP }}>
              {weekColumns.flatMap((week, wIdx) =>
                week.map((day: any, dIdx: any) => {
                  if (!day) return <div key={`${wIdx}-${dIdx}`} style={{ width: HM_CELL_SIZE, height: HM_CELL_SIZE }} />;
                  return (
                    <div key={`${wIdx}-${dIdx}`} className="hm-cell" style={{ width: HM_CELL_SIZE, height: HM_CELL_SIZE, borderRadius: HM_CELL_RADIUS, background: getColor(day.value), cursor: "pointer" }} onMouseEnter={(e) => handleMouseEnter(e, day)} onMouseLeave={handleMouseLeave} />
                  );
                })
              )}
            </div>
          </div>
          <div style={{ marginLeft: HM_DAY_LABEL_WIDTH, position: "relative", height: 20, marginTop: 6 }}>
            {monthLabels.map((m, i) => (
              <span key={i} style={{ position: "absolute", left: m.weekIdx * HM_CELL_STEP, top: 0, fontSize: 10, color: "#6b6b80", whiteSpace: "nowrap" }}>{m.label}</span>
            ))}
          </div>
        </div>
      </div>
      {tooltip && (
        <div style={{ position: "fixed", left: tooltip.x, top: tooltip.y - 10, transform: "translate(-50%, -100%)", background: "#1a1a24", border: "1px solid #2e2e40", borderRadius: 8, padding: "7px 12px", zIndex: 9999, pointerEvents: "none", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.45)" }}>
          <div style={{ fontSize: 12, color: "#e4e4ed", fontWeight: 500 }}>{tooltip.value} minutes focused</div>
          <div style={{ fontSize: 11, color: "#6b6b80", marginTop: 2 }}>{formatFullDate(tooltip.date)}</div>
        </div>
      )}
    </div>
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

function formatTimeOnly(dStr: string) {
  return new Date(dStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false });
}

export function Insights() {
  const { token } = useAuth();
  const { tasks } = useTasks();

  const [isLoading, setIsLoading] = useState(true);
  const [daily, setDaily] = useState<any>(null);
  const [weekly, setWeekly] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [dRes, wRes, iRes, sRes] = await Promise.all([
          api.get(`/analytics/daily`),
          api.get(`/analytics/weekly`),
          api.get(`/analytics/insights`),
          api.get(`/focus/sessions?limit=365`)
        ]);

        const dData = dRes.data;
        const wData = wRes.data;
        const iData = iRes.data;
        const sData = sRes.data;

        if (dData.success) setDaily(dData);
        if (wData.success) setWeekly(wData);
        if (iData.success) setInsights(iData);
        if (sData.success) setSessions(sData.sessions);

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const heatmapData = useMemo(() => {
    const dataMap = new Map();
    sessions.forEach(s => {
      const dStr = s.startTime.split('T')[0];
      dataMap.set(dStr, (dataMap.get(dStr) || 0) + s.duration);
    });
    const arr = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const str = d.toISOString().slice(0, 10);
      arr.push({ date: str, value: dataMap.get(str) || 0 });
    }
    return arr;
  }, [sessions]);

  if (isLoading || !daily) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const dailySummary = {
    totalFocus: formatMins(daily.analytics.totalMinutes),
    sessions: daily.analytics.sessions,
    interruptions: daily.analytics.interruptions,
    focusScore: daily.analytics.avgFocusScore ? Math.round(daily.analytics.avgFocusScore) : 0,
  };

  let mostFocusedTaskTitle = "None";
  if (insights?.insights?.topTask?.taskId) {
    const t = tasks.find((x: any) => x.id === insights.insights.topTask.taskId);
    if (t) mostFocusedTaskTitle = t.title;
  }

  const weeklyAnalytics = weekly ? {
    totalFocus: formatMins(weekly.summary.totalMinutes),
    sessions: weekly.summary.totalSessions,
    bestDay: weekly.summary.bestDay ? new Date(weekly.summary.bestDay.date).toLocaleDateString('en-US', { weekday: 'long' }) : 'None',
    longestSession: formatMins(weekly.summary.totalMinutes), // approximation
    avgSession: formatMins(weekly.summary.totalMinutes / (weekly.summary.totalSessions || 1)),
    mostFocusedTask: mostFocusedTaskTitle,
  } : { totalFocus: "0m", sessions: 0, bestDay: "-", longestSession: "0m", avgSession: "0m", mostFocusedTask: "-" };

  const insightStats = [
    { label: "This Week", value: weekly ? formatMins(weekly.summary.totalMinutes) : "0m", icon: Clock, sub: "Last 7 days" },
    { label: "Current Streak", value: "Active", icon: Flame, sub: "Keep it up!" },
    { label: "Most Focused", value: mostFocusedTaskTitle, icon: Target, sub: (insights?.insights?.topTask?.totalMinutes ? formatMins(insights.insights.topTask.totalMinutes) + " total" : "Not available") },
    { label: "Avg Session", value: insights?.insights?.avgSessionMinutes ? formatMins(insights.insights.avgSessionMinutes) : "0m", icon: TrendingUp, sub: "Last 30 days" },
    { label: "Deep Work Ratio", value: "100%", icon: Award, sub: "Target: 70%" },
    { label: "Total Sessions", value: insights?.insights?.sessions ? String(insights.insights.sessions) : "0", icon: Calendar, sub: "Last 30 days" },
  ];

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysSessions = sessions.filter(s => s.startTime.startsWith(todayStr)).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const sessionTimeline = todaysSessions.map(s => {
    const t = tasks.find((x: any) => x.id === s.taskId);
    return {
      time: formatTimeOnly(s.startTime),
      type: s.sessionType || "focus",
      task: t ? t.title : "Deep Work",
      duration: `${Math.round(s.duration)}m`,
      color: s.sessionType === "break" ? "#22c55e" : "#7C5CFF"
    };
  });

  const weeklyTrend = weekly ? weekly.days.map((d: any) => ({
    week: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    minutes: d.totalMinutes
  })) : [];

  const dailyFocusMap = new Array(24).fill(0);
  sessions.forEach(s => {
    const d = new Date(s.startTime);
    dailyFocusMap[d.getHours()] += s.duration;
  });
  const dailyFocusData = dailyFocusMap.map((minutes, hour) => ({
    hour: `${hour}:00`,
    minutes: Math.round(minutes)
  }));


  const scoreColor = dailySummary.focusScore >= 85 ? "#22c55e" : dailySummary.focusScore >= 70 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-foreground" style={{ fontSize: 18, fontWeight: 600 }}>Focus Insights</h1>
        <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
          Track your deep work patterns and progress
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-foreground mb-3" style={{ fontSize: 13, fontWeight: 500 }}>Daily Productivity Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-foreground" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>{dailySummary.totalFocus}</p>
                <p className="text-muted-foreground" style={{ fontSize: 10.5 }}>Total Focus</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-foreground" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>{dailySummary.sessions}</p>
                <p className="text-muted-foreground" style={{ fontSize: 10.5 }}>Sessions</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(245, 158, 11, 0.1)" }}>
                <AlertTriangle className="w-4 h-4" style={{ color: "#f59e0b" }} />
              </div>
              <div>
                <p className="text-foreground" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>{dailySummary.interruptions}</p>
                <p className="text-muted-foreground" style={{ fontSize: 10.5 }}>Interruptions</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${scoreColor}15` }}>
                <Award className="w-4 h-4" style={{ color: scoreColor }} />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2, color: scoreColor }}>{dailySummary.focusScore}%</p>
                <p className="text-muted-foreground" style={{ fontSize: 10.5 }}>Focus Score</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-foreground mb-3" style={{ fontSize: 13, fontWeight: 500 }}>Weekly Productivity Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total Focus", value: weeklyAnalytics.totalFocus, icon: Clock },
              { label: "Sessions", value: String(weeklyAnalytics.sessions), icon: Target },
              { label: "Best Day", value: weeklyAnalytics.bestDay, icon: Star },
              { label: "Longest Session", value: weeklyAnalytics.longestSession, icon: TrendingUp },
              { label: "Avg Session", value: weeklyAnalytics.avgSession, icon: Brain },
              { label: "Top Task", value: weeklyAnalytics.mostFocusedTask, icon: Award },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <item.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-foreground truncate" style={{ fontSize: 12.5, fontWeight: 500 }}>{item.value}</p>
                  <p className="text-muted-foreground" style={{ fontSize: 10 }}>{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {insightStats.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>{s.label}</span>
            </div>
            <p className="text-foreground" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>{s.value}</p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {sessionTimeline.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-foreground mb-4" style={{ fontSize: 13, fontWeight: 500 }}>Session Timeline — Today</h3>
          <div className="relative">
            <div className="absolute left-[43px] top-0 bottom-0 w-px bg-border" />
            <div className="space-y-0">
              {sessionTimeline.map((session, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 relative">
                  <span className="text-muted-foreground shrink-0 w-[36px] text-right" style={{ fontSize: 11 }}>
                    {session.time}
                  </span>
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 relative z-10"
                    style={{ background: session.color, boxShadow: `0 0 6px ${session.color}40` }}
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {session.type === "focus" ? (
                        <Brain className="w-3 h-3" style={{ color: "#7C5CFF" }} />
                      ) : (
                        <Coffee className="w-3 h-3" style={{ color: "#22c55e" }} />
                      )}
                      <span
                        className="text-foreground"
                        style={{ fontSize: 12.5, fontWeight: session.type === "focus" ? 500 : 400 }}
                      >
                        {session.type === "focus" ? "Deep Work" : session.task}
                      </span>
                    </div>
                    {session.type === "focus" && (
                      <span className="text-muted-foreground bg-secondary px-1.5 py-0.5 rounded" style={{ fontSize: 10.5 }}>
                        {session.task}
                      </span>
                    )}
                    <span className="text-muted-foreground ml-auto shrink-0" style={{ fontSize: 11 }}>
                      {session.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-foreground mb-4" style={{ fontSize: 13, fontWeight: 500 }}>Weekly Focus Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyTrend}>
              <defs>
                <linearGradient id="insightsFocusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2d" vertical={false} />
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#6b6b80", fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b6b80", fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 60)}h`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => [`${Math.round(value / 60)}h ${value % 60}m`, "Focus"]} />
              <Area type="monotone" dataKey="minutes" stroke="#8b5cf6" fill="url(#insightsFocusGrad)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-foreground mb-4" style={{ fontSize: 13, fontWeight: 500 }}>Daily Focus Rhythm (All Time)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyFocusData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2d" vertical={false} />
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "#6b6b80", fontSize: 9 }} interval={1} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b6b80", fontSize: 10 }} tickFormatter={(v) => `${v}m`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => [`${value}m`, "Avg Focus"]} />
              <Bar dataKey="minutes" fill="#6366f1" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-foreground mb-4" style={{ fontSize: 13, fontWeight: 500 }}>Focus Activity Heatmap</h3>
        <CalendarHeatmap data={heatmapData} />
      </div>
    </div>
  );
}