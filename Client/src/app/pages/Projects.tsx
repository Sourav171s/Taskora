import { useState, useEffect } from "react";
import { FolderKanban, Plus, Loader2, Trash2, CalendarDays } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

interface Project {
  _id: string;
  name: string;
  description: string;
  status: string;
  dueDate: string;
  createdAt: string;
}

const API = "http://localhost:4000/api/projects";

export function Projects() {
  const { token } = useAuth();
  const { addNotification } = useNotifications();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("planning");

  const fetchProjects = async () => {
    if (!token) return;
    try {
      const res = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setProjects(data.items);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !token) return;
    try {
      const res = await fetch(API, {
                 method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, description, status })
      });
      const data = await res.json();
      if (data.success) {
        setProjects([data.item, ...projects]);
        setName(""); setDescription(""); setStatus("planning"); setIsAdding(false);
        addNotification({ type: "system", title: "Project Created", message: "New project launched", icon: "🚀", time: "Just now" });
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if(!token) return;
    setProjects(prev => prev.map(p => p._id === id ? { ...p, status: newStatus } : p));
    try {
      await fetch(`${API}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: newStatus }) });
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm("Delete project?")) return;
    setProjects(projects.filter(e => e._id !== id));
    try { await fetch(`${API}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); } catch (e) { console.error(e); }
  };

  const getStatusColor = (s: string) => {
      if(s === "active") return "bg-green-500/10 text-green-500 border-green-500/20";
      if(s === "completed") return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
  };

  return (
    <div className="flex flex-col h-full bg-background p-4 md:p-8 max-w-6xl mx-auto w-full custom-scrollbar overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <FolderKanban className="w-7 h-7 text-primary" /> Projects
          </h1>
          <p className="text-muted-foreground">Manage your larger milestones, coursework, and assignments.</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="focus-btn px-4 py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Project</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSave} className="mb-8 bg-card border border-border p-5 rounded-xl shadow-md space-y-4 hover:-translate-y-1 transition-all duration-300">
          <div className="grid gap-4 sm:grid-cols-2">
             <input autoFocus placeholder="Project Name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-input border border-border px-4 py-2.5 rounded-lg text-foreground focus:outline-none focus:border-primary/50" />
             <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-input border border-border px-4 py-2.5 rounded-lg text-foreground focus:outline-none focus:border-primary/50">
               <option value="planning">Planning</option>
               <option value="active">Active</option>
               <option value="completed">Completed</option>
             </select>
          </div>
          <input placeholder="Short Description..." value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-input border border-border px-4 py-2.5 rounded-lg text-foreground focus:outline-none focus:border-primary/50" />
          
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded text-muted-foreground hover:bg-secondary">Cancel</button>
            <button type="submit" className="focus-btn px-6 py-2 font-medium">Create Project</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : projects.length === 0 && !isAdding ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border mt-2 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <FolderKanban className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No projects running</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">Set up some long-term goals or coursework projects to track your progress.</p>
          <button onClick={() => setIsAdding(true)} className="focus-btn px-6 py-2.5 flex items-center gap-2"><Plus className="w-4 h-4" /> Outline a Project</button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {projects.map(proj => (
            <div key={proj._id} className="bg-card border border-border rounded-xl p-5 flex flex-col group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${getStatusColor(proj.status)}`}>{proj.status}</span>
                <button onClick={() => handleDelete(proj._id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-1 truncate">{proj.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2">{proj.description || "No description provided."}</p>
              
              <div className="mt-auto border-t border-border pt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="w-3 h-3"/> Started {new Date(proj.createdAt).toLocaleDateString()}</div>
                <select value={proj.status} onChange={e => handleUpdateStatus(proj._id, e.target.value)} className="text-xs bg-input border border-border rounded px-2 py-1 outline-none">
                  <option value="planning">Plan</option>
                  <option value="active">Active</option>
                  <option value="completed">Complete</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
