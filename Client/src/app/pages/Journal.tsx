import { useState, useEffect } from "react";
import { Book, Plus, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

interface JournalEntry {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

const API = "http://localhost:4000/api/journal";

export function Journal() {
  const { token } = useAuth();
  const { addNotification } = useNotifications();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const fetchEntries = async () => {
    if (!token) return;
    try {
      const res = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setEntries(data.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !token) return;
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content })
      });
      const data = await res.json();
      if (data.success) {
        setEntries([data.item, ...entries]);
        setTitle("");
        setContent("");
        setIsAdding(false);
        addNotification({ type: "system", title: "Saved", message: "Journal entry saved", icon: "📖", time: "Just now" });
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm("Delete entry?")) return;
    setEntries(entries.filter(e => e._id !== id));
    try {
      await fetch(`${API}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex flex-col h-full bg-background p-4 md:p-8 max-w-5xl mx-auto w-full custom-scrollbar overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Book className="w-7 h-7 text-primary" /> Journal
          </h1>
          <p className="text-muted-foreground">Document your thoughts, ideas, and daily reflections.</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="focus-btn px-4 py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Entry</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSave} className="mb-8 bg-card border border-border p-4 rounded-xl flex flex-col gap-3 shadow-md animation-fade-in hover:-translate-y-1 transition-all duration-300">
          <input autoFocus placeholder="Entry Title..." value={title} onChange={e => setTitle(e.target.value)} required className="bg-transparent text-xl font-bold border-none outline-none placeholder:text-muted-foreground" />
          <textarea placeholder="Write your thoughts..." value={content} onChange={e => setContent(e.target.value)} rows={5} className="bg-transparent resize-none border-none outline-none text-muted-foreground text-sm" />
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded text-muted-foreground hover:bg-secondary">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-primary text-primary-foreground font-medium hover:bg-primary/90">Save Entry</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : entries.length === 0 && !isAdding ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border mt-2 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <Book className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No entries yet</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">Start your journaling journey by creating your first entry today.</p>
          <button onClick={() => setIsAdding(true)} className="focus-btn px-6 py-2.5 flex items-center gap-2"><Plus className="w-4 h-4" /> Write Entry</button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {entries.map(entry => (
            <div key={entry._id} className="bg-card border border-border rounded-xl p-5 flex flex-col group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{entry.title}</h3>
                <button onClick={() => handleDelete(entry._id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4"/></button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{new Date(entry.createdAt).toLocaleDateString()}</p>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap flex-1">{entry.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
