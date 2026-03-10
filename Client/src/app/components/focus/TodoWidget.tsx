import { useState } from "react";
import { Check, Circle, Plus, X, Link as LinkIcon } from "lucide-react";
import { useTasks, Task } from "../../context/TaskContext";
import { useNotifications } from "../../context/NotificationContext";

export function TodoWidget() {
  const { addNotification } = useNotifications();
  const { tasks: allTasks, updateTask, addTask: addTaskToDb, deleteTask } = useTasks();
  const activeTasks = allTasks.filter((t) => !t.completed);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("medium");
  const [newEst, setNewEst] = useState("25");

  const toggle = (id: string) => {
    const task = allTasks.find(t => t.id === id);
    if(task) {
      const willComplete = !task.completed;
      updateTask(id, { completed: willComplete });
      if (willComplete) {
        addNotification({
          type: "achievement",
          title: "Task Completed!",
          message: `Awesome job finishing '${task.title}'.`,
          time: "Just now",
          icon: "🎉"
        });
      }
    }
  };

  const addTask = async () => {
    if (!newTitle.trim()) return;
    await addTaskToDb({
      title: newTitle.trim(),
      priority: newPriority as any,
      estimatedMinutes: parseInt(newEst) || 25,
    });
    setNewTitle("");
    setNewPriority("medium");
    setNewEst("25");
    setShowAdd(false);
  };

  const removeTask = (id: string) => {
    deleteTask(id);
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case "critical": return "#ef4444";
      case "high": return "#f59e0b";
      case "medium": return "#7C5CFF";
      default: return "#4a4a5a";
    }
  };

  const completedCount = allTasks.filter(t => t.completed).length;
  const totalTasks = allTasks.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 11, color: "#6b6b80" }}>
          {completedCount}/{totalTasks} done
        </span>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors hover:bg-[#1A1A24]"
          style={{ fontSize: 10.5, color: "#7C5CFF" }}
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full mb-3" style={{ background: "#1A1A24" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: totalTasks > 0 ? `${(completedCount / totalTasks) * 100}%` : "0%",
            background: "#7C5CFF",
          }}
        />
      </div>

      {/* Add task form */}
      {showAdd && (
        <div className="mb-3 p-2.5 rounded-lg border border-[#2a2a3a]" style={{ background: "#0E0E16" }}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Task name..."
            className="w-full bg-transparent text-[#e4e4ed] placeholder-[#3a3a4a] outline-none mb-2"
            style={{ fontSize: 12 }}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as Task["priority"])}
              className="bg-[#1A1A24] text-[#8a8a9a] rounded px-1.5 py-1 outline-none border border-[#2a2a3a]"
              style={{ fontSize: 10.5 }}
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input
              type="number"
              value={newEst}
              onChange={(e) => setNewEst(e.target.value)}
              className="w-[50px] bg-[#1A1A24] text-[#8a8a9a] rounded px-1.5 py-1 outline-none border border-[#2a2a3a]"
              style={{ fontSize: 10.5 }}
              placeholder="min"
            />
            <span style={{ fontSize: 10, color: "#4a4a5a" }}>min</span>
            <div className="ml-auto flex gap-1">
              <button
                onClick={() => setShowAdd(false)}
                className="p-1 rounded hover:bg-[#1A1A24] transition-colors"
              >
                <X className="w-3 h-3" style={{ color: "#4a4a5a" }} />
              </button>
              <button
                onClick={addTask}
                className="px-2 py-0.5 rounded text-white transition-colors"
                style={{ fontSize: 10.5, background: "#7C5CFF" }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-0.5 overflow-y-auto focus-scrollbar" style={{ maxHeight: "calc(100% - 60px)" }}>
        {activeTasks.length === 0 && !showAdd && (
          <div className="text-center py-6">
            <p style={{ fontSize: 12, color: "#3a3a4a" }}>No tasks yet</p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-2 flex items-center gap-1 mx-auto px-3 py-1.5 rounded-md transition-colors"
              style={{ fontSize: 11, color: "#7C5CFF", background: "rgba(124,92,255,0.08)" }}
            >
              <Plus className="w-3 h-3" /> Add your first task
            </button>
          </div>
        )}
        {activeTasks.map((task) => {
          const isDone = task.completed;
          return (
            <div
              key={task.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-[#1A1A24]/50 group"
            >
              <button
                onClick={() => toggle(task.id)}
                className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all"
                style={{
                  borderColor: isDone ? "#7C5CFF" : "#2a2a3a",
                  background: isDone ? "#7C5CFF" : "transparent",
                }}
              >
                {isDone ? (
                  <Check className="w-2.5 h-2.5 text-white" />
                ) : (
                  <Circle className="w-2.5 h-2.5" style={{ color: "transparent" }} />
                )}
              </button>
              <div
                className="w-1 h-1 rounded-full shrink-0"
                style={{ background: priorityColor(task.priority) }}
              />
              <span
                className="flex-1 text-left truncate transition-all"
                style={{
                  fontSize: 12,
                  color: isDone ? "#3a3a4a" : "#c4c4d4",
                  textDecoration: isDone ? "line-through" : "none",
                }}
              >
                {task.title}
              </span>
              <span style={{ fontSize: 10, color: "#3a3a4a" }}>{task.estimatedMinutes}m</span>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                {task.url && (
                  <a
                    href={task.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded hover:bg-[#2a2a3a] text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" />
                  </a>
                )}
                <button
                  onClick={() => removeTask(task.id)}
                  className="p-1 rounded hover:bg-[#2a2a3a] transition-all"
                >
                  <X className="w-3 h-3" style={{ color: "#4a4a5a" }} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}