import { useNavigate } from "react-router";
import {
  GripVertical,
  Play,
  Clock,
  Target,
  Plus,
  CheckCircle2,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Coffee,
  GraduationCap,
  MapPin,
} from "lucide-react";
import { useTasks } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

export function DailyPlanning() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { tasks: allTasks, updateTask, addTask } = useTasks();
  const activeTasks = allTasks.filter((t) => !t.completed);
  
  const [collegeSchedule, setCollegeSchedule] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    fetch("http://localhost:4000/api/agent/schedule", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.schedule) setCollegeSchedule(d.schedule.weeklySchedule);
      });
  }, [token]);

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = days[new Date().getDay()];
  const todayCollege = collegeSchedule ? (collegeSchedule[today] || []) : [];

  // Merge today's college classes with planned tasks
  const plainPlanItems = activeTasks.filter((t) => t.scheduled).sort((a,b) => (a.order || 0) - (b.order || 0));
  
  // Create virtual items for college classes
  const collegeItems = todayCollege.map((c: any, i: number) => ({
    id: `college-${i}`,
    title: c.subject,
    estimatedMinutes: 0, // Calculated by time difference
    startTime: c.time,
    endTime: c.endTime,
    type: 'college',
    collegeType: c.type,
    room: c.room,
    isCollege: true
  }));

  // Combine and sort by time
  const combinedItems = [...plainPlanItems, ...collegeItems].sort((a, b) => {
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.startTime) return -1;
    if (b.startTime) return 1;
    return (a.order || 0) - (b.order || 0);
  });

  let currentTime = new Date();
  currentTime.setHours(9, 0, 0, 0);

  const [quickTask, setQuickTask] = useState("");
  const [breakCount, setBreakCount] = useState(0);

  const timelineItems = combinedItems.map((item: any) => {
    if (item.startTime) {
       const [HH, MM] = item.startTime.split(":");
       currentTime.setHours(Number(HH), Number(MM), 0, 0);
    }
    const start = new Date(currentTime);
    
    let duration = item.estimatedMinutes;
    if (item.isCollege && item.endTime) {
      const [eHH, eMM] = item.endTime.split(":");
      const endD = new Date(currentTime);
      endD.setHours(Number(eHH), Number(eMM), 0, 0);
      duration = (endD.getTime() - currentTime.getTime()) / 60000;
      if (duration < 0) duration = 60; // fallback
    }

    currentTime = new Date(currentTime.getTime() + duration * 60000);
    const end = new Date(currentTime);
    return {
      ...item,
      duration,
      startObj: start,
      startStr: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      endStr: end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  });

  const totalMinutes = timelineItems.reduce((sum, p) => sum + (p.duration || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const toggleScheduled = (id: string, currentlyScheduled: boolean) => {
    updateTask(id, { scheduled: !currentlyScheduled, order: currentlyScheduled ? 0 : plainPlanItems.length });
  };

  const reorderTasks = (arr: any[]) => {
    arr.forEach((t, i) => { if (t.order !== i) updateTask(t.id, { order: i }); });
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...plainPlanItems];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    reorderTasks(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === plainPlanItems.length - 1) return;
    const newOrder = [...plainPlanItems];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    reorderTasks(newOrder);
  };

  const handleAddQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!quickTask.trim()) return;
    await addTask({ title: quickTask, estimatedMinutes: 25, scheduled: true, priority: 'medium', order: plainPlanItems.length });
    setQuickTask("");
  };

  const handleAddBreak = async (duration: number = 15) => {
    const count = breakCount + 1;
    setBreakCount(count);
    await addTask({ title: `Break #${count} (${duration}m)`, estimatedMinutes: duration, scheduled: true, priority: 'low', type: 'break', order: plainPlanItems.length });
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case "critical": return "#ef4444";
      case "high": return "#f59e0b";
      case "medium": return "#8b5cf6";
      default: return "#6b7280";
    }
  };

  return (
    <div className="max-w-[720px] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground" style={{ fontSize: 18, fontWeight: 600 }}>Plan Your Day</h1>
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: 13 }}>
            Saturday, February 21
          </p>
        </div>
        <button
          onClick={() => navigate("/focus")}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md transition-colors"
          style={{ fontSize: 12.5, fontWeight: 500 }}
        >
          <Play className="w-3 h-3 fill-current" />
          Start Working
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground" style={{ fontSize: 12 }}>Planned Time</span>
          </div>
          <p className="text-foreground" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>{hours}h {mins}m</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground" style={{ fontSize: 12 }}>Tasks</span>
          </div>
          <p className="text-foreground" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>
            {plainPlanItems.length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground" style={{ fontSize: 12 }}>Focus Sessions</span>
          </div>
          <p className="text-foreground" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>
            {Math.ceil(totalMinutes / 25)}
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-[1fr_280px] gap-6 items-start">
        {/* Visual Timeline */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-foreground" style={{ fontSize: 13, fontWeight: 500 }}>Time-Blocked Schedule</h3>
            <span className="text-muted-foreground" style={{ fontSize: 11.5 }}>Starting at 09:00 AM</span>
          </div>

          <div className="relative pl-3 border-l-2 border-border/40 space-y-6 pb-2">
            {timelineItems.length === 0 ? (
              <p className="text-muted-foreground text-sm ml-4">No tasks scheduled yet.</p>
            ) : (
              timelineItems.map((item, idx) => (
                <div key={item.id} className="relative pl-6 group">
                  {/* Timeline dot */}
                  <div
                    className="absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 border-background"
                    style={{ background: item.isCollege ? '#a855f7' : item.type === 'break' ? '#14b8a6' : priorityColor(item.priority) }}
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      {item.isCollege && <GraduationCap className="w-3.5 h-3.5 text-primary" />}
                      <span className="text-foreground" style={{ fontSize: 13, fontWeight: 500 }}>
                        {item.title}
                      </span>
                      <span className={`${item.isCollege ? 'bg-primary/20 text-primary' : 'bg-secondary/80 text-muted-foreground'} px-1.5 py-0.5 rounded text-[10px] font-medium uppercase min-w-max`}>
                        {Math.round(item.duration)} MIN
                      </span>
                      {!item.isCollege && (
                        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveUp(idx)} className="p-1 rounded hover:bg-secondary text-muted-foreground"><ArrowUp className="w-3.5 h-3.5"/></button>
                          <button onClick={() => moveDown(idx)} className="p-1 rounded hover:bg-secondary text-muted-foreground"><ArrowDown className="w-3.5 h-3.5"/></button>
                        </div>
                      )}
                    </div>
                    {item.isCollege && item.room && (
                      <div className="flex items-center gap-1 text-muted-foreground mb-1" style={{ fontSize: 11 }}>
                        <MapPin className="w-3 h-3" /> {item.room}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: 11.5 }}>
                      <Clock className="w-3 h-3" />
                      <div className="flex items-center gap-1 relative">
                        {!item.isCollege ? (
                          <input
                            type="time"
                            value={item.startTime || ""}
                            onChange={(e) => updateTask(item.id, { startTime: e.target.value })}
                            className="bg-transparent border border-transparent hover:border-border rounded px-1 outline-none font-mono text-primary focus:border-primary transition-colors cursor-pointer w-[68px]"
                            title="Set strict start time"
                          />
                        ) : (
                          <span className="font-mono text-primary">{item.startTime}</span>
                        )}
                         - <span className="font-mono">{item.endStr}</span>
                      </div>
                      {!item.isCollege && (
                        <button
                          onClick={() => toggleScheduled(item.id, true)}
                          className="ml-auto md:ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 px-1.5 rounded bg-red-400/10 text-[10px]"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {/* End marker */}
            {timelineItems.length > 0 && (
              <div className="relative pl-6 pt-2">
                <div className="absolute -left-[21.5px] top-3 w-2.5 h-2.5 rounded-full border-2 border-background bg-muted-foreground/30" />
                <span className="text-muted-foreground block pt-2" style={{ fontSize: 11.5 }}>
                  Day ends at {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Unplanned tasks */}
        <div className="flex flex-col gap-4">
          <div className="bg-card border border-border rounded-lg p-4 flex flex-col">
            <h3 className="text-muted-foreground mb-4" style={{ fontSize: 12, fontWeight: 500 }}>
              Unscheduled Tasks ({activeTasks.length - timelineItems.length})
            </h3>
            <div className="space-y-1.5 flex-1 custom-scrollbar overflow-y-auto max-h-[400px]">
              {activeTasks.filter(t => !t.scheduled).map((task) => (
                <div
                  key={task.id}
                  onClick={() => updateTask(task.id, { scheduled: true, order: plainPlanItems.length })}
                  className="flex items-center gap-2.5 px-3 py-2 rounded border border-border bg-secondary/10 hover:bg-secondary/40 transition-colors cursor-pointer group"
                >
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: priorityColor(task.priority) }} />
                  <span className="truncate text-foreground" style={{ fontSize: 12.5 }}>{task.title}</span>
                  <span className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-3.5 h-3.5 text-primary" />
                  </span>
                </div>
              ))}
              {activeTasks.length === timelineItems.length && (
                <p className="text-center text-muted-foreground text-xs py-4">All captured tasks are scheduled.</p>
              )}
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-muted-foreground mb-3" style={{ fontSize: 12, fontWeight: 500 }}>
              Custom Blocks
            </h3>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[5, 10, 15, 30].map(mins => (
                <button
                  key={mins}
                  onClick={() => handleAddBreak(mins)}
                  className="flex items-center justify-center gap-1 bg-input hover:bg-teal-500/20 hover:text-teal-400 border border-transparent hover:border-teal-500/30 transition-all text-foreground py-2 rounded-lg"
                  style={{ fontSize: 11, fontWeight: 500 }}
                >
                   <Coffee className="w-3 h-3 text-teal-500" /> {mins}m
                </button>
              ))}
            </div>
            <form onSubmit={handleAddQuickTask} className="relative">
               <input
                 type="text"
                 placeholder="Spontaneous task..."
                 value={quickTask}
                 onChange={e => setQuickTask(e.target.value)}
                 className="w-full bg-input border border-border rounded-lg py-2 pl-3 pr-8 focus:border-primary/50 text-foreground"
                 style={{ fontSize: 12 }}
               />
               <button type="submit" className="absolute right-2 top-2 text-muted-foreground hover:text-primary"><Plus className="w-4 h-4"/></button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}