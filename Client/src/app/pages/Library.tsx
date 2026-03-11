import { useState, useEffect } from "react";
import { Library as LibIcon, Plus, Loader2, Trash2, ExternalLink } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

interface LibraryItem {
  _id: string;
  title: string;
  url: string;
  type: string;
  status: string;
  createdAt: string;
}

const API = "http://localhost:4000/api/library";

export function Library() {
  const { token } = useAuth();
  const { addNotification } = useNotifications();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("article");

  const fetchItems = async () => {
    if (!token) return;
    try {
      const res = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setItems(data.items);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !token) return;
    try {
      const res = await fetch(API, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, url, type })
      });
      const data = await res.json();
      if (data.success) {
        setItems([data.item, ...items]);
        setTitle(""); setUrl(""); setType("article"); setIsAdding(false);
        addNotification({ type: "system", title: "Resource Saved", message: "Added to your library", icon: "📚", time: "Just now" });
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if(!token) return;
    setItems(prev => prev.map(p => p._id === id ? { ...p, status: newStatus } : p));
    try {
      await fetch(`${API}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: newStatus }) });
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm("Delete resource?")) return;
    setItems(items.filter(e => e._id !== id));
    try { await fetch(`${API}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); } catch (e) { console.error(e); }
  };

  const getTypeIcon = (t: string) => {
     switch(t) {
        case "video": return "🎥";
        case "pdf": return "📄";
        case "book": return "📖";
        default: return "🔗";
     }
  };

  return (
    <div className="flex flex-col h-full bg-background p-4 md:p-8 max-w-5xl mx-auto w-full custom-scrollbar overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <LibIcon className="w-7 h-7 text-primary" /> Resource Library
          </h1>
          <p className="text-muted-foreground">Keep your articles, PDFs, reading list, and bookmarks all in one place.</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="focus-btn px-4 py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Resource</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSave} className="mb-8 bg-card border border-border p-5 rounded-xl shadow-md space-y-4 hover:-translate-y-1 transition-all duration-300">
          <div className="grid gap-4 sm:grid-cols-4">
             <input autoFocus placeholder="Title (e.g. Intro to Databases)" value={title} onChange={e => setTitle(e.target.value)} required className="sm:col-span-2 w-full bg-input border border-border px-4 py-2.5 rounded-lg text-foreground focus:outline-none focus:border-primary/50" />
             <input placeholder="URL Link (Optional)" value={url} onChange={e => setUrl(e.target.value)} className="sm:col-span-1 w-full bg-input border border-border px-4 py-2.5 rounded-lg text-foreground focus:outline-none focus:border-primary/50" />
             <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-input border border-border px-4 py-2.5 rounded-lg text-foreground focus:outline-none focus:border-primary/50">
               <option value="article">Article / Website</option>
               <option value="video">Video</option>
               <option value="pdf">PDF Document</option>
               <option value="book">Book</option>
             </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded text-muted-foreground hover:bg-secondary">Cancel</button>
            <button type="submit" className="focus-btn px-6 py-2 font-medium">Save Item</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : items.length === 0 && !isAdding ? (
         <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border mt-10 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
           <LibIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
           <h3 className="text-lg font-medium text-foreground mb-2">Your library is empty</h3>
           <p className="text-muted-foreground text-center max-w-sm mb-6">Paste a link or add a reference file to collect your study material effectively.</p>
           <button onClick={() => setIsAdding(true)} className="focus-btn px-6 py-2.5 flex items-center gap-2"><Plus className="w-4 h-4" /> Add Item</button>
         </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <div key={item._id} className="bg-card border border-border rounded-xl p-4 flex flex-col group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xl bg-secondary px-2 py-1 rounded-md">{getTypeIcon(item.type)}</span>
                <button onClick={() => handleDelete(item._id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
              <h3 className="font-semibold text-foreground text-base mt-2 mb-1 truncate">{item.title}</h3>
              {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mb-4 truncate w-max max-w-full">
                     {item.url} <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
              ) : ( <p className="text-xs text-muted-foreground mb-4">No link attached</p> )}
              
              <div className="mt-auto pt-3 border-t border-border flex justify-between items-center">
                 <select value={item.status} onChange={e => handleUpdateStatus(item._id, e.target.value)} className={`text-xs font-medium border rounded px-2 py-1 outline-none ${item.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : item.status === 'reading' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-input text-muted-foreground border-border'}`}>
                    <option value="unread">Queue</option>
                    <option value="reading">In Progress</option>
                    <option value="completed">Completed</option>
                 </select>
                 <span className="text-[10px] text-muted-foreground uppercase">{item.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
