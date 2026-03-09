import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Clock,
  Target,
  Flame,
  Play,
  Check,
  ArrowRight,
  CalendarDays,
  Plus,
  RotateCcw,
  Book,
  Layers,
  FolderKanban,
  Wallet,
  Library as LibIcon,
  GraduationCap,
  MapPin,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TaskContext";
import { useNotifications } from "../context/NotificationContext";
import { useHabits } from "../context/HabitContext";
import api from "@/lib/api";

const quickActions = [
  { label: "Deep Work", icon: Target, action: "/focus", primary: true },
  { label: "Plan Day", icon: CalendarDays, action: "/planning" },
  { label: "Journal", icon: Book, action: "/journal" },
  { label: "Flashcards", icon: Layers, action: "/flashcards" },
  { label: "Projects", icon: FolderKanban, action: "/projects" },
  { label: "Finance", icon: Wallet, action: "/finance" },
  { label: "Library", icon: LibIcon, action: "/library" },
  { label: "Add Task", icon: Plus, action: "/tasks" },
];

const tooltipStyle = {
  background: "#1a1a24",
  border: "1px solid #1e1e2d",
  borderRadius: 6,
  fontSize: 11,
  color: "#e4e4ed",
  padding: "6px 10px",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
}

function CollegeScheduleSummary({ token, now, navigate }: { token: string | null, now: Date, navigate: any }) {
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.get("/agent/schedule")
      .then(res => {
        const d = res.data;
        if (d.success && d.schedule) setSchedule(d.schedule.weeklySchedule);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="animate-pulse bg-secondary/50 h-16 rounded mt-auto" />;
  if (!schedule) return (
    <div className="mt-auto">
      <p className="text-secondary-foreground/60" style={{ fontSize: 13 }}>No schedule uploaded</p>
      <button onClick={() => navigate("/kora")} className="text-primary hover:underline mt-1 block" style={{ fontSize: 11 }}>Setup Kora Hub →</button>
    </div>
  );

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = days[now.getDay()];
  const todayClasses = schedule[today] || [];

  if (todayClasses.length === 0) return (
    <div className="mt-auto">
      <p className="text-green-400 font-medium" style={{ fontSize: 15 }}>No classes today! 🎉</p>
      <p className="text-muted-foreground" style={{ fontSize: 11 }}>Enjoy your free time.</p>
    </div>
  );

  const currentTimeStr = now.toTimeString().slice(0, 5); // "HH:MM"

  // Find current or next
  let next = todayClasses.find((c: any) => c.time > currentTimeStr);
  let current = todayClasses.find((c: any) => c.time <= currentTimeStr && c.endTime > currentTimeStr);

  const item = current || next;
  if (!item) return (
    <div className="mt-auto">
      <p className="text-muted-foreground" style={{ fontSize: 13 }}>Done for the day! ✨</p>
      <p className="text-muted-foreground" style={{ fontSize: 11 }}>{todayClasses.length} sessions completed.</p>
    </div>
  );

  return (
    <div className="mt-auto">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${current ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
          {current ? 'Ongoing' : 'Up Next'}
        </span>
        <span className="text-muted-foreground text-[10px]">{item.time} - {item.endTime}</span>
      </div>
      <p className="text-foreground truncate font-semibold" style={{ fontSize: 15, lineHeight: 1.2 }}>{item.subject}</p>
      {item.room && (
        <p className="text-muted-foreground flex items-center gap-1 mt-0.5" style={{ fontSize: 11 }}>
          <MapPin className="w-3 h-3" /> {item.room}
        </p>
      )}
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { addNotification } = useNotifications();
  const { habits, toggleHabit } = useHabits();
  const now = useLiveClock();

  const [weeklyFocusData, setWeeklyFocusData] = useState<any[]>([]);
  const [focusedMinutes, setFocusedMinutes] = useState(0);
  const [sessionDistribution, setSessionDistribution] = useState([
    { name: "Deep Work", value: 100, fill: "#7C5CFF" },
    { name: "Learning", value: 0, fill: "#22c55e" },
    { name: "Admin", value: 0, fill: "#f59e0b" },
  ]);

  useEffect(() => {
    if (!token) return;
    api.get("/analytics/weekly")
      .then((res) => {
        const d = res.data;
        if (d.success) {
          const mapped = d.days.map((day: any) => ({
            day: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
            minutes: Math.round(day.totalMinutes),
          }));
          setWeeklyFocusData(mapped);
        }
      });
    api.get("/focus/sessions")
      .then((res) => {
        const d = res.data;
        if (d.success) {
          // compute type distribution loosely
          let deep = 100, learn = 0, admin = 0;
          let todayTotal = 0;
          if (d.sessions.length > 0) {
            deep = 0;
            const total = d.sessions.reduce((s: number, a: any) => s + a.duration, 0) || 1;
            todayTotal = d.sessions.reduce((s: number, a: any) => s + a.duration, 0);
            d.sessions.forEach((s: any) => {
              if (s.sessionType === "study") learn += s.duration;
              else if (s.sessionType === "break") admin += s.duration;
              else deep += s.duration;
            });
            deep = Math.round((deep / total) * 100);
            learn = Math.round((learn / total) * 100);
            admin = Math.round((admin / total) * 100);
          }
          setFocusedMinutes(todayTotal);
          setSessionDistribution([
            { name: "Deep Work", value: deep, fill: "#7C5CFF" },
            { name: "Study", value: learn, fill: "#14b8a6" },
            { name: "Breaks/Admin", value: admin, fill: "#f59e0b" },
          ]);
        }
      });
  }, [token]);

  const { tasks: allTasks, updateTask } = useTasks();

  const activeTasks = allTasks.filter((t: any) => !t.completed);
  const completedCount = allTasks.filter((t: any) => t.completed).length;
  const totalTasks = allTasks.length;

  const getPriorityWeight = (p: string) => {
    switch (p) {
      case "critical": return 4;
      case "high": return 3;
      case "medium": return 2;
      case "low": return 1;
      default: return 0;
    }
  };

  const frogTask = activeTasks.length > 0
    ? [...activeTasks].sort((a, b) => {
      const pDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      if (pDiff !== 0) return pDiff;
      return b.estimatedMinutes - a.estimatedMinutes;
    })[0]
    : null;

  const toggleTask = (id: string) => {
    const task = allTasks.find(t => t.id === id);
    if (task) {
      const willComplete = !task.completed;
      updateTask(id, { completed: willComplete });
      if (willComplete) {
        addNotification({
          type: "achievement",
          title: "Goal Crushed!",
          message: `You completed '${task.title}'. Keep it going!`,
          time: "Just now",
          icon: "🔥"
        });
      }
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case "critical": return "#ef4444";
      case "high": return "#f59e0b";
      case "medium": return "#8b5cf6";
      case "low": return "#6b7280";
      default: return "#6b7280";
    }
  };

  // Focus target calculations
  const focusGoalMinutes = allTasks.reduce((total: number, task: any) => total + (task.estimatedMinutes || 0), 0) || 300;
  const completedTaskMinutes = allTasks.filter((t: any) => t.completed).reduce((total: number, task: any) => total + (task.estimatedMinutes || 0), 0);
  const totalProgressMinutes = focusedMinutes + completedTaskMinutes;

  const focusProgress = Math.min((totalProgressMinutes / (focusGoalMinutes || 1)) * 100, 100);
  const fHours = Math.floor(totalProgressMinutes / 60);
  const fMins = totalProgressMinutes % 60;
  const gHours = Math.floor(focusGoalMinutes / 60);
  const gMins = focusGoalMinutes % 60;

  const greeting = getGreeting();
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-4">
      {/* Header with greeting and live clock */}
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600 }} className="text-foreground">
            {greeting}, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
            {formatDate(now)} · {activeTasks.length} tasks planned today
          </p>
        </div>

        {/* Live Clock */}
        <div className="flex flex-col items-end">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card"
            style={{ minWidth: 140 }}
          >
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span className="tabular-nums text-foreground" style={{ fontSize: 15, fontWeight: 600, letterSpacing: "0.03em" }}>
              {formatTime(now)}
            </span>
          </div>
        </div>
      </div>

      {/* Top row: Focus Target + Streak + College Class Progress */}
      <div className="grid grid-cols-4 gap-4">
        {/* Daily Focus Target */}
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground" style={{ fontSize: 12 }}>Today's Focus Target</span>
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
              <Clock className="w-3.5 h-3.5 text-primary" />
            </div>
          </div>
          <p className="text-foreground mt-auto" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.2 }}>
            {fHours}h {fMins}m <span className="text-muted-foreground" style={{ fontSize: 13, fontWeight: 400 }}>/ {gHours}h {gMins > 0 ? `${gMins}m ` : ''}goal</span>
          </p>
          <div className="mt-3 w-full h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${focusProgress}%`, background: "linear-gradient(90deg, #7c3aed, #8b5cf6, #a78bfa)" }}
            />
          </div>
          <p className="mt-1.5" style={{ fontSize: 11, color: "#6b6b80" }}>{Math.round(focusProgress)}% of daily goal</p>
        </div>

        {/* College Schedule - Next Class */}
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className="text-muted-foreground" style={{ fontSize: 12 }}>College Schedule</span>
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "rgba(14, 165, 233, 0.1)" }}>
              <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
          </div>

          <CollegeScheduleSummary token={token} now={now} navigate={navigate} />
        </div>

        {/* Streak Card */}
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col relative overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div
            className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)" }}
          />
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground" style={{ fontSize: 12 }}>Current Streak</span>
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "rgba(245, 158, 11, 0.1)" }}>
              <Flame className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <p className="text-foreground" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.2 }}>
              0 days
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <p style={{ fontSize: 11, color: "#6b6b80" }}>Best: 0 days</p>
          </div>
        </div>

        {/* Overview Stat */}
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground" style={{ fontSize: 12 }}>Overview</span>
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "rgba(99, 102, 241, 0.1)" }}>
              <Target className="w-3.5 h-3.5" style={{ color: "#6366f1" }} />
            </div>
          </div>
          <div className="space-y-1.5 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>Total Tasks</span>
              <span className="text-foreground" style={{ fontSize: 14, fontWeight: 600 }}>{totalTasks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>Completed</span>
              <span className="text-foreground" style={{ fontSize: 14, fontWeight: 600 }}>{completedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>Sessions</span>
              <span className="text-foreground" style={{ fontSize: 14, fontWeight: 600 }}>0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* Left: Task List + Quick Actions */}
        <div className="space-y-4">

          {/* Eat the Frog Highlight */}
          {frogTask && (
            <div className="relative overflow-hidden bg-card border border-border rounded-lg p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <div
                className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-20"
                style={{ background: 'radial-gradient(circle at top right, #22c55e, transparent 70%)' }}
              />
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🐸</span>
                <h3 className="text-foreground" style={{ fontSize: 13, fontWeight: 600 }}>Eat the Frog</h3>
                <span className="text-muted-foreground ml-2" style={{ fontSize: 11.5 }}>Your hardest task today</span>
              </div>
              <div className="flex items-center justify-between bg-secondary/40 border border-border/50 rounded-lg p-3">
                <div className="flex flex-col">
                  <span className="text-foreground font-medium" style={{ fontSize: 14 }}>{frogTask.title}</span>
                  <div className="flex items-center gap-3 mt-1" style={{ fontSize: 11.5 }}>
                    <span className="flex items-center gap-1.5 text-red-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" /> Critical
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {frogTask.estimatedMinutes}m
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/focus")}
                  className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md transition-colors shadow-lg shadow-green-500/20"
                  style={{ fontSize: 12.5, fontWeight: 500 }}
                >
                  <Play className="w-3 h-3 fill-current" />
                  Tackle It
                </button>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-foreground" style={{ fontSize: 13, fontWeight: 500 }}>Today's Tasks</h3>
              <button
                onClick={() => navigate("/tasks")}
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                style={{ fontSize: 12 }}
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {activeTasks.length === 0 && (
                <div className="py-8 text-center">
                  <p style={{ fontSize: 13, color: "#4a4a5a" }}>No tasks yet</p>
                  <button
                    onClick={() => navigate("/tasks")}
                    className="mt-2 text-primary hover:text-primary/80 transition-colors flex items-center gap-1 mx-auto"
                    style={{ fontSize: 12 }}
                  >
                    <Plus className="w-3 h-3" /> Add your first task
                  </button>
                </div>
              )}
              {activeTasks.slice(0, 6).map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-4 h-10 hover:bg-secondary/30 transition-colors group"
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="w-4 h-4 rounded border border-border hover:border-primary flex items-center justify-center shrink-0 transition-colors"
                  >
                    {task.completed && <Check className="w-3 h-3 text-primary" />}
                  </button>
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: priorityColor(task.priority) }}
                  />
                  <span className="flex-1 text-foreground truncate" style={{ fontSize: 13 }}>
                    {task.title}
                  </span>
                  <span className="text-muted-foreground shrink-0 w-8 text-right" style={{ fontSize: 11 }}>
                    {task.estimatedMinutes}m
                  </span>
                  <button
                    onClick={() => navigate("/focus")}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-primary/10 transition-all"
                  >
                    <Play className="w-3 h-3 text-primary fill-primary" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.action)}
                className={`flex flex-col items-center gap-2 py-4 px-2 rounded-lg border transition-colors ${action.primary
                  ? "bg-primary/10 border-primary/20 hover:bg-primary/15 text-primary"
                  : "bg-card border-border hover:bg-secondary/50 text-foreground"
                  }`}
              >
                <action.icon className="w-4 h-4" style={{ strokeWidth: 1.5 }} />
                <span style={{ fontSize: 11.5, fontWeight: 500 }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Charts */}
        <div className="space-y-4">
          {/* Weekly Focus */}
          <div className="bg-card border border-border rounded-lg p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <h3 className="text-foreground mb-3" style={{ fontSize: 13, fontWeight: 500 }}>Weekly Focus</h3>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={weeklyFocusData} barSize={18}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b6b80", fontSize: 10 }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "rgba(139, 92, 246, 0.05)" }}
                  formatter={(value: any) => [`${value}m`, "Focus"]}
                />
                <Bar dataKey="minutes" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Session Distribution */}
          <div className="bg-card border border-border rounded-lg p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <h3 className="text-foreground mb-3" style={{ fontSize: 13, fontWeight: 500 }}>Session Types</h3>
            <div className="flex items-center gap-4">
              <PieChart width={100} height={100}>
                <Pie
                  data={sessionDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={42}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {sessionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
              <div className="space-y-2 flex-1">
                {sessionDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.fill }} />
                      <span className="text-muted-foreground" style={{ fontSize: 11.5 }}>{item.name}</span>
                    </div>
                    <span className="text-foreground" style={{ fontSize: 11.5, fontWeight: 500 }}>{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Habits Card */}
          <div className="bg-card border border-border rounded-lg p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-foreground" style={{ fontSize: 13, fontWeight: 500 }}>Today's Habits</h3>
              <button onClick={() => navigate("/habits")} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1" style={{ fontSize: 12 }}>
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {habits.length === 0 ? (
                <div className="py-4 text-center">
                  <p style={{ fontSize: 12, color: "#6b6b80" }}>No habits tracked.</p>
                </div>
              ) : (
                habits.slice(0, 4).map(habit => {
                  const todayStr = new Date().toISOString().slice(0, 10);
                  const isCompleted = habit.completedDates.includes(todayStr);

                  return (
                    <div key={habit._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors border border-transparent hover:border-border cursor-pointer" onClick={() => toggleHabit(habit._id, todayStr)}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: habit.color }} />
                        <span className="text-foreground" style={{ fontSize: 13 }}>{habit.title}</span>
                      </div>
                      <button
                        className={`w-6 h-6 rounded flex items-center justify-center transition-all ${isCompleted ? "scale-105" : "bg-input hover:bg-secondary"
                          }`}
                        style={isCompleted ? { background: habit.color, color: "#fff" } : {}}
                      >
                        {isCompleted && <Check className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}