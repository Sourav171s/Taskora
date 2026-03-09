import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Play,
  Check,
  Filter,
  ArrowUpDown,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  RotateCcw,
  X,
  Wand2,
  Link,
  BookOpen,
  CalendarDays,
  Loader2,
  Trash2,
} from "lucide-react";
import { useTasks } from "../context/TaskContext";
import { useNotifications } from "../context/NotificationContext";

const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const ACTIVE_COL_TEMPLATE = "1fr 110px 72px 88px 80px";
const COMPLETED_COL_TEMPLATE = "1fr auto 72px 80px 32px";

export function Tasks() {
  const navigate = useNavigate();
  const { tasks: taskList, addTask: addTaskToDb, updateTask, deleteTask } = useTasks();
  const { addNotification } = useNotifications();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("priority");
  const [sortAsc, setSortAsc] = useState(true);
  const [filterPriority, setFilterPriority] = useState("all");
  const [activeTab, setActiveTab] = useState("active");

  // Add Task modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", priority: "medium", estimatedMinutes: "25", project: "", url: "", type: "normal" });
  const [isBreakingDown, setIsBreakingDown] = useState<string | null>(null);

  const addTask = async () => {
    if (!newTask.title.trim()) return;
    const task = {
      title: newTask.title.trim(),
      priority: newTask.priority as any,
      estimatedMinutes: parseInt(newTask.estimatedMinutes) || 25,
      focusedMinutes: 0,
      lastWorked: "Never",
      completed: false,
      project: newTask.project.trim() || undefined,
      url: newTask.url.trim() || undefined,
      type: newTask.type,
      repeats: newTask.type === "study",
    };
    await addTaskToDb(task);
    setNewTask({ title: "", priority: "medium", estimatedMinutes: "25", project: "", url: "", type: "normal" });
    setShowAddModal(false);
  };

  const breakDownTask = (taskId: string, title: string) => {
    setIsBreakingDown(taskId);
    setTimeout(async () => {
      const oldTask = taskList.find(t => t.id === taskId);
      if (!oldTask) {
        setIsBreakingDown(null);
        return;
      }
      
      const est = oldTask.estimatedMinutes;
      await addTaskToDb({ title: `Step 1: Prep ${title}`, priority: oldTask.priority, estimatedMinutes: Math.floor(est * 0.2), url: oldTask.url, project: oldTask.project, type: oldTask.type });
      await addTaskToDb({ title: `Step 2: Core ${title}`, priority: oldTask.priority, estimatedMinutes: Math.floor(est * 0.6), url: oldTask.url, project: oldTask.project, type: oldTask.type });
      await addTaskToDb({ title: `Step 3: Review ${title}`, priority: oldTask.priority, estimatedMinutes: Math.floor(est * 0.2), url: oldTask.url, project: oldTask.project, type: oldTask.type });
      
      await deleteTask(taskId);
      setIsBreakingDown(null);
    }, 1200);
  };

  const activeTasks = taskList.filter((t: any) => !t.completed);
  const completedTasks = taskList.filter((t: any) => t.completed);

  let filtered = activeTasks.filter(
    (t: any) => t.title.toLowerCase().includes(search.toLowerCase())
  );
  if (filterPriority !== "all") {
    filtered = filtered.filter((t: any) => t.priority === filterPriority);
  }

  const sorted = [...filtered].sort((a: any, b: any) => {
    let cmp = 0;
    if (sortKey === "priority") {
      cmp = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
    } else if (sortKey === "title") {
      cmp = a.title.localeCompare(b.title);
    } else if (sortKey === "estimatedMinutes") {
      cmp = a.estimatedMinutes - b.estimatedMinutes;
    } else {
      cmp = a.lastWorked.localeCompare(b.lastWorked);
    }
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const toggleComplete = (id: string) => {
    const task = taskList.find(t => t.id === id);
    if(task) {
      const willComplete = !task.completed;
      updateTask(id, { completed: willComplete });
      if (willComplete) {
        addNotification({
          type: "achievement",
          title: "Nice work!",
          message: `Task '${task.title}' completed.`,
          time: "Just now",
          icon: "✓"
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

  const priorityLabel = (p: string) => p.charAt(0).toUpperCase() + p.slice(1);

  const SortHeader = ({ label, sortKeyVal, className = "" }: any) => (
    <button
      onClick={() => toggleSort(sortKeyVal)}
      className={`flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors ${className}`}
      style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}
    >
      {label}
      {sortKey === sortKeyVal && <ArrowUpDown className="w-2.5 h-2.5" />}
    </button>
  );

  const totalFocused = completedTasks.reduce((sum: number, t: any) => sum + t.focusedMinutes, 0);
  const cHours = Math.floor(totalFocused / 60);
  const cMins = totalFocused % 60;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground" style={{ fontSize: 18, fontWeight: 600 }}>Tasks</h1>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
            {activeTab === "active"
              ? `${filtered.length} active tasks`
              : `${completedTasks.length} completed · ${cHours}h ${cMins}m total focus`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md transition-colors"
          style={{ fontSize: 12.5, fontWeight: 500 }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Task
        </button>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-[420px] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-foreground" style={{ fontSize: 15, fontWeight: 600 }}>New Task</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded hover:bg-secondary transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex gap-2 mb-4 bg-secondary/50 p-1 rounded-md mt-2">
              <button
                onClick={() => setNewTask(p => ({ ...p, type: 'normal' }))}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded transition-colors text-sm ${newTask.type === 'normal' ? 'bg-background text-foreground shadow font-medium' : 'text-muted-foreground'}`}
              >
                Task
              </button>
              <button
                onClick={() => setNewTask(p => ({ ...p, type: 'study' }))}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded transition-colors text-sm ${newTask.type === 'study' ? 'bg-blue-500/10 text-blue-500 shadow font-medium' : 'text-muted-foreground'}`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Study / Spaced Repetition
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-muted-foreground block mb-1" style={{ fontSize: 11.5 }}>Task Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  placeholder="What do you need to do?"
                  className="w-full bg-secondary text-foreground rounded-md px-3 py-2 outline-none border border-border focus:border-primary/50"
                  style={{ fontSize: 13 }}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-muted-foreground block mb-1" style={{ fontSize: 11.5 }}>Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full bg-secondary text-foreground rounded-md px-2 py-2 outline-none border border-border"
                    style={{ fontSize: 12.5 }}
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1" style={{ fontSize: 11.5 }}>Estimate (min)</label>
                  <input
                    type="number"
                    value={newTask.estimatedMinutes}
                    onChange={(e) => setNewTask({ ...newTask, estimatedMinutes: e.target.value })}
                    className="w-full bg-secondary text-foreground rounded-md px-2 py-2 outline-none border border-border"
                    style={{ fontSize: 12.5 }}
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1" style={{ fontSize: 11.5 }}>Project</label>
                  <input
                    type="text"
                    value={newTask.project}
                    onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                    placeholder="Optional"
                    className="w-full bg-secondary text-foreground rounded-md px-2 py-2 outline-none border border-border"
                    style={{ fontSize: 12.5 }}
                  />
                </div>
              </div>

              <div>
                <label className="text-muted-foreground flex items-center gap-1 mb-1" style={{ fontSize: 11.5 }}>
                  <Link className="w-3 h-3" /> Link or Resource (Optional)
                </label>
                <input
                  type="text"
                  value={newTask.url}
                  onChange={(e) => setNewTask({ ...newTask, url: e.target.value })}
                  placeholder="https://docs.google.com/..."
                  className="w-full bg-secondary text-foreground rounded-md px-3 py-2 outline-none border border-border focus:border-primary/50"
                  style={{ fontSize: 13 }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-1.5 rounded-md text-muted-foreground hover:text-foreground border border-border transition-colors"
                style={{ fontSize: 12.5 }}
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                className="px-4 py-1.5 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
                style={{ fontSize: 12.5, fontWeight: 500 }}
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-border">
        {([
          { key: "active", label: "Active", count: activeTasks.length },
          { key: "completed", label: "Completed", count: completedTasks.length },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 transition-colors border-b-2 -mb-[1px] ${
              activeTab === tab.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            {tab.label}
            <span
              className={`px-1.5 py-0.5 rounded ${
                activeTab === tab.key ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
              }`}
              style={{ fontSize: 11 }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      {activeTab === "active" && (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-secondary/60 rounded-md px-3 py-2 flex-1 max-w-[280px]">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground w-full"
                style={{ fontSize: 12.5 }}
              />
            </div>
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1" />
              {["all", "critical", "high", "medium", "low"].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={`px-2 py-1 rounded transition-colors ${
                    filterPriority === p
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                  style={{ fontSize: 11.5, fontWeight: 500 }}
                >
                  {p === "all" ? "All" : priorityLabel(p)}
                </button>
              ))}
            </div>
          </div>

          {/* Active Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div
              className="grid items-center gap-3 px-4 h-10 border-b border-border bg-secondary/20"
              style={{ gridTemplateColumns: ACTIVE_COL_TEMPLATE }}
            >
              <SortHeader label="Task" sortKeyVal="title" />
              <SortHeader label="Priority" sortKeyVal="priority" />
              <SortHeader label="Est." sortKeyVal="estimatedMinutes" />
              <SortHeader label="Last" sortKeyVal="lastWorked" />
              <span />
            </div>

            <div className="divide-y divide-border">
              {sorted.map((task) => (
                <div
                  key={task.id}
                  className="grid items-center gap-3 px-4 h-10 hover:bg-secondary/20 transition-colors group"
                  style={{ gridTemplateColumns: ACTIVE_COL_TEMPLATE }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => toggleComplete(task.id)}
                      className="w-4 h-4 rounded border border-border hover:border-primary flex items-center justify-center shrink-0 transition-colors"
                    >
                      {task.completed && <Check className="w-3 h-3 text-primary" />}
                    </button>
                    {isBreakingDown === task.id ? (
                      <span className="text-primary flex items-center gap-2" style={{ fontSize: 13 }}>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Breaking down...
                      </span>
                    ) : (
                      <>
                        <span className="text-foreground truncate" style={{ fontSize: 13 }}>{task.title}</span>
                        {task.url && (
                          <a href={task.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                            <Link className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {task.type === "study" && (
                          <span className="text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1" style={{ fontSize: 10.5 }}>
                            <BookOpen className="w-2.5 h-2.5" /> Study
                          </span>
                        )}
                        {task.project && (
                          <span className="text-muted-foreground bg-secondary px-1.5 py-0.5 rounded shrink-0" style={{ fontSize: 10.5 }}>
                            {task.project}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: priorityColor(task.priority) }} />
                    <span className="text-muted-foreground" style={{ fontSize: 12 }}>{priorityLabel(task.priority)}</span>
                  </div>
                  <span className="text-muted-foreground" style={{ fontSize: 12 }}>{task.estimatedMinutes}m</span>
                  <span className="text-muted-foreground" style={{ fontSize: 12 }}>{task.lastWorked}</span>
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {!isBreakingDown && task.estimatedMinutes >= 20 && (
                      <button
                        onClick={() => breakDownTask(task.id, task.title)}
                        className="p-1.5 rounded hover:bg-secondary text-indigo-400 hover:text-indigo-300 transition-colors flex items-center justify-center"
                        title="AI Breakdown"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => navigate("/focus")}
                      className="p-1.5 rounded hover:bg-primary/10 transition-colors flex items-center justify-center"
                      title="Start Focus"
                    >
                      <Play className="w-3.5 h-3.5 text-primary fill-primary" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {sorted.length === 0 && (
              <div className="py-12 text-center text-muted-foreground" style={{ fontSize: 13 }}>
                No tasks match your filters
              </div>
            )}
          </div>
        </>
      )}

      {/* Completed Tab Content */}
      {activeTab === "completed" && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div
            className="grid items-center gap-3 px-4 h-10 border-b border-border bg-secondary/20"
            style={{ gridTemplateColumns: COMPLETED_COL_TEMPLATE }}
          >
            <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Task
            </span>
            <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Project
            </span>
            <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Focused
            </span>
            <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Accuracy
            </span>
            <span />
          </div>

          <div className="divide-y divide-border">
            {completedTasks.map((task) => {
              const accuracy = task.estimatedMinutes > 0 ? Math.round(Math.min(task.focusedMinutes, task.estimatedMinutes) / Math.max(task.focusedMinutes, task.estimatedMinutes) * 100) : 0;
              const accColor = accuracy >= 85 ? "#22c55e" : accuracy >= 65 ? "#f59e0b" : "#ef4444";
              return (
              <div
                key={task.id}
                className="grid items-center gap-3 px-4 h-10 hover:bg-secondary/20 transition-colors group"
                style={{ gridTemplateColumns: COMPLETED_COL_TEMPLATE }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: priorityColor(task.priority) }} />
                  <span className="text-muted-foreground truncate" style={{ fontSize: 13 }}>{task.title}</span>
                </div>
                {task.project ? (
                  <span className="text-muted-foreground bg-secondary px-1.5 py-0.5 rounded shrink-0" style={{ fontSize: 10.5 }}>
                    {task.project}
                  </span>
                ) : <span />}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span style={{ fontSize: 12 }}>{task.focusedMinutes}m<span className="text-muted-foreground/60">/{task.estimatedMinutes}m</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-[40px] h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${accuracy}%`, background: accColor }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: accColor }}>{accuracy}%</span>
                </div>
                <button
                  onClick={() => toggleComplete(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary transition-all flex items-center justify-center"
                >
                  <RotateCcw className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
              );
            })}
          </div>

          {completedTasks.length === 0 && (
            <div className="py-12 text-center text-muted-foreground" style={{ fontSize: 13 }}>
              No completed tasks yet. Start a focus session to get going.
            </div>
          )}
        </div>
      )}
    </div>
  );
}