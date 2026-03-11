import { useState } from "react";
import { Plus, Check, Loader2, Sparkles, Flame, Calendar, Trash2 } from "lucide-react";
import { useHabits } from "../context/HabitContext";

export function Habits() {
  const { habits, isLoading, addHabit, toggleHabit, deleteHabit } = useHabits();

  // New habit form state
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState("#8b5cf6");

  // Handle adding new habit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await addHabit(newTitle, newColor);
    setNewTitle("");
    setIsAdding(false);
  };

  // Generate last 7 days for the tracker UI
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      dateStr: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate()
    };
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full custom-scrollbar">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Sparkles className="w-7 h-7" style={{ color: "#f59e0b" }} />
            Habits Tracker
          </h1>
          <p className="text-muted-foreground">Build consistency, one day at a time.</p>
        </div>
        
        <button 
          onClick={() => setIsAdding(true)}
          className="focus-btn px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> 
          <span className="hidden sm:inline">New Habit</span>
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="mb-8 p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col sm:flex-row gap-4 items-center">
          <input 
            type="text"
            required
            autoFocus
            placeholder="e.g. Read for 20 minutes"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 bg-input border border-border px-4 py-2.5 rounded-lg text-foreground focus:outline-none focus:border-primary/50"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border-0 p-0 overflow-hidden"
              title="Theme Color"
            />
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded text-muted-foreground hover:text-foreground">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 rounded-lg text-primary-foreground font-medium transition-transform active:scale-95" style={{ background: newColor }}>
              Save
            </button>
          </div>
        </form>
      )}

      {/* Habits Grid / List */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border shadow-sm">
          <Calendar className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No habits yet</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            Start tracking your daily routines by creating your first habit.
          </p>
          <button onClick={() => setIsAdding(true)} className="focus-btn px-6 py-2.5 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Habit
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          
          <div className="hidden md:flex items-center pl-6 pr-4 mb-2">
            <div className="flex-1 text-sm font-medium text-muted-foreground">Habit</div>
            <div className="flex gap-4">
              {days.map(d => (
                <div key={d.dateStr} className="w-10 text-center text-xs font-medium text-muted-foreground">
                  {d.label}
                </div>
              ))}
            </div>
            <div className="w-8"></div>
          </div>

          {habits.map(habit => {
            // Calculate a quick streak by counting backwards from today
            let streak = 0;
            const todayStr = new Date().toISOString().slice(0, 10);
            const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            
            let currentCheck = habit.completedDates.includes(todayStr) ? todayStr : yesterdayStr;
            let checkDate = new Date(currentCheck);
            
            while(habit.completedDates.includes(checkDate.toISOString().slice(0, 10))) {
              streak++;
               checkDate.setDate(checkDate.getDate() - 1);
            }

            return (
              <div key={habit._id} className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 shadow-sm hover:border-primary/20 transition-colors group">
                
                {/* Habit Info */}
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: habit.color }} />
                  <span className="font-medium text-foreground truncate text-base">{habit.title}</span>
                  {streak > 2 && (
                    <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: `${habit.color}15`, color: habit.color }}>
                      <Flame className="w-3 h-3" /> {streak}
                    </div>
                  )}
                </div>

                {/* Day Trackers */}
                <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4">
                  {days.map(d => {
                    const isCompleted = habit.completedDates.includes(d.dateStr);
                    const isToday = d.dateStr === todayStr;
                    return (
                      <div key={d.dateStr} className="flex flex-col items-center gap-1.5">
                        <span className="md:hidden text-[10px] uppercase text-muted-foreground font-medium">
                          {d.label.charAt(0)}
                        </span>
                        <button
                          onClick={() => toggleHabit(habit._id, d.dateStr)}
                          className={`w-10 h-10 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all ${
                            isCompleted 
                              ? "scale-110 shadow-md" 
                              : isToday 
                                ? "bg-secondary border-2 border-dashed border-border hover:border-primary/50" 
                                : "bg-input hover:bg-secondary"
                          }`}
                          style={isCompleted ? { background: habit.color, color: "#fff" } : {}}
                        >
                          {isCompleted ? <Check className="w-5 h-5" /> : (isToday ? <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" /> : null)}
                        </button>
                      </div>
                    );
                  })}
                  
                  {/* Actions */}
                  <button 
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this habit?")) {
                        deleteHabit(habit._id, habit.title);
                      }
                    }}
                    className="w-8 h-8 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0 ml-2"
                    title="Delete Habit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
