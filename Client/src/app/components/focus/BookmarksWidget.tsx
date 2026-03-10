import { useState, useEffect } from "react";
import { Link2, Trash2, Plus, ExternalLink } from "lucide-react";

interface Bookmark {
  id: string;
  title: string;
  url: string;
}

export function BookmarksWidget() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("taskora_bookmarks") || "[]");
    } catch { return []; }
  });
  const [isAdding, setIsAdding] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    localStorage.setItem("taskora_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    let finalUrl = url;
    if (!finalUrl.startsWith("http")) finalUrl = "https://" + finalUrl;
    
    setBookmarks([...bookmarks, { id: Date.now().toString(), title: title || finalUrl.replace("https://", ""), url: finalUrl }]);
    setIsAdding(false);
    setUrl("");
    setTitle("");
  };

  const remove = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-3 shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Links</span>
        <button onClick={() => setIsAdding(!isAdding)} className="p-1 hover:bg-secondary rounded text-foreground transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {isAdding && (
        <form onSubmit={add} className="bg-card p-3 rounded-lg border border-border mb-3 space-y-2 shrink-0">
          <input type="text" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-xs bg-input p-1.5 rounded text-foreground focus:outline-none focus:border-primary border border-transparent" />
          <input type="text" placeholder="URL *" value={url} onChange={(e) => setUrl(e.target.value)} autoFocus className="w-full text-xs bg-input p-1.5 rounded text-foreground focus:outline-none focus:border-primary border border-transparent" />
          <div className="flex justify-end pt-1">
             <button type="submit" className="text-xs px-3 py-1 bg-primary text-white rounded font-medium hover:opacity-90">Save</button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 px-1">
        {bookmarks.length === 0 && !isAdding && (
           <div className="h-full flex flex-col items-center justify-center opacity-50">
             <Link2 className="w-8 h-8 text-muted-foreground mb-2" />
             <p className="text-xs text-muted-foreground">No bookmarks saved</p>
           </div>
        )}
        {bookmarks.map(b => (
          <a key={b.id} href={b.url} target="_blank" rel="noreferrer" className="group flex items-center justify-between bg-input hover:bg-secondary p-2.5 rounded-lg transition-colors border border-transparent hover:border-border">
            <div className="flex items-center gap-2.5 overflow-hidden">
               <div className="w-6 h-6 rounded bg-black/20 flex items-center justify-center shrink-0 overflow-hidden">
                 <img src={`https://www.google.com/s2/favicons?domain=${b.url}`} alt="" className="w-3.5 h-3.5 opacity-80" />
               </div>
               <span className="text-sm font-medium text-foreground truncate">{b.title}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => remove(b.id, e)} 
                className="p-1.5 text-muted-foreground hover:text-red-400 rounded hover:bg-black/20 transition-colors"
                title="Remove link"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
