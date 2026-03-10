import { useState, useEffect } from "react";
import { Music, Plus, Trash2, Link as LinkIcon, AlertCircle } from "lucide-react";

interface PlaylistItem {
  id: string;
  title: string;
  url: string;
}

const DEFAULT_PLAYLIST: PlaylistItem[] = [
  { id: "1", title: "Lofi Girl - chill beats", url: "https://www.youtube.com/watch?v=jfKfPfyJRdk" },
  { id: "2", title: "Peaceful Piano", url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO" }
];

function getEmbedUrl(url: string) {
  try {
    const raw = new URL(url);

    // Spotify logic
    if (raw.hostname.includes("spotify.com")) {
      // e.g. https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO?si=xxx
      // -> https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO
      const pathParts = raw.pathname.split("/").filter(Boolean); // ["playlist", "37i..."]
      if (pathParts.length >= 2) {
        const type = pathParts[0]; // track, playlist, album, episode, show
        const id = pathParts[1];
        return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`;
      }
    }

    // YouTube logic
    if (raw.hostname.includes("youtube.com") || raw.hostname.includes("youtu.be")) {
      if (raw.pathname.includes("/playlist")) {
        // e.g. https://www.youtube.com/playlist?list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9CB5EYV
        const list = raw.searchParams.get("list");
        if (list) return `https://www.youtube.com/embed/videoseries?list=${list}`;
      } else {
        // e.g. https://www.youtube.com/watch?v=jfKfPfyJRdk or https://youtu.be/jfKfPfyJRdk
        const v = raw.searchParams.get("v") || raw.pathname.split("/").pop();
        if (v) return `https://www.youtube.com/embed/${v}?autoplay=1`;
      }
    }

    return null; // unsupported or malformed
  } catch {
    return null;
  }
}

export function MusicWidget() {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(() => {
    try {
      const saved = localStorage.getItem("taskora_music_playlist");
      return saved ? JSON.parse(saved) : DEFAULT_PLAYLIST;
    } catch {
      return DEFAULT_PLAYLIST;
    }
  });

  const [activeId, setActiveId] = useState<string>(playlist[0]?.id || "");
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    localStorage.setItem("taskora_music_playlist", JSON.stringify(playlist));
  }, [playlist]);

  const activeItem = playlist.find(p => p.id === activeId);
  const embedUrl = activeItem ? getEmbedUrl(activeItem.url) : null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    
    let finalUrl = newUrl.trim();
    if (!finalUrl.startsWith("http")) finalUrl = `https://${finalUrl}`;

    const parsedTitle = newTitle.trim() || "Untitled Track/Playlist";
    
    const newItem = { id: Date.now().toString(), title: parsedTitle, url: finalUrl };
    setPlaylist([...playlist, newItem]);
    
    if (playlist.length === 0) setActiveId(newItem.id);
    
    setNewTitle("");
    setNewUrl("");
    setIsAdding(false);
  };

  const removeTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = playlist.filter(p => p.id !== id);
    setPlaylist(filtered);
    if (activeId === id) {
      setActiveId(filtered[0]?.id || "");
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Player Frame */}
      <div className="w-full bg-card rounded-lg overflow-hidden shrink border border-border mb-3 select-none flex-1 min-h-[160px] flex flex-col">
        {embedUrl ? (
          <iframe 
            src={embedUrl} 
            title="Music Player"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="w-full h-full border-0"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-50">
            {activeItem ? (
              <>
                <AlertCircle className="w-8 h-8 mb-2 text-red-400" />
                <p className="text-xs text-muted-foreground">Unsupported URL type.</p>
                <p className="text-[10px] mt-1 text-muted-foreground max-w-[200px] leading-tight">Please use valid Spotify Track/Playlist links or YouTube Video/Playlist links.</p>
              </>
            ) : (
              <>
                <Music className="w-8 h-8 mb-2" />
                <p className="text-xs text-muted-foreground">No track selected.</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Playlist Actions Header */}
      <div className="flex items-center justify-between mb-2 px-1 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">My Library</span>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-1.5 rounded bg-secondary text-foreground hover:bg-primary hover:text-white transition-colors"
          title="Add Track/Playlist"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="mb-2 p-2 bg-card border border-border rounded-lg space-y-2 shrink-0">
          <input 
            type="text" 
            placeholder="Custom Name (e.g. Doom Music)" 
            value={newTitle} 
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full text-xs bg-input p-2 rounded text-foreground focus:outline-none focus:border-primary border border-transparent"
          />
          <input 
            type="text" 
            placeholder="Spotify or YouTube URL *" 
            required
            autoFocus
            value={newUrl} 
            onChange={(e) => setNewUrl(e.target.value)}
            className="w-full text-xs bg-input p-2 rounded text-foreground focus:outline-none focus:border-primary border border-transparent"
          />
          <div className="flex justify-end pt-1">
            <button type="submit" className="text-xs px-3 py-1.5 bg-primary text-white rounded font-medium hover:opacity-90">
              Add to Queue
            </button>
          </div>
        </form>
      )}

      {/* Playlist Queue */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 px-1 pb-2">
        {playlist.length === 0 ? (
          <div className="flex items-center justify-center opacity-50 py-4 text-xs text-muted-foreground border border-dashed border-border rounded-lg h-full">
            Library is empty
          </div>
        ) : (
          playlist.map(item => (
            <div 
              key={item.id}
              onClick={() => setActiveId(item.id)}
              className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors border ${
                activeId === item.id ? "bg-primary/10 border-primary/30" : "bg-input hover:bg-secondary border-transparent hover:border-border"
              }`}
            >
              <div className="flex items-center min-w-0 pr-3">
                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 mr-3 ${activeId === item.id ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground'}`}>
                  {item.url.includes("spotify") ? (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.241 1.2zM20.4 9.06c-3.96-2.34-10.44-2.58-14.22-1.44-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.38-1.32 11.52-1.02 16.02 1.62.54.36.72 1.02.42 1.56-.36.54-1.02.72-1.56.36z"/></svg>
                  ) : item.url.includes("youtube") || item.url.includes("youtu.be") ? (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M21.582 6.186a2.72 2.72 0 00-1.92-1.908C17.962 3.8 12 3.8 12 3.8s-5.962 0-7.662.478a2.72 2.72 0 00-1.92 1.908C1.94 7.886 1.94 12 1.94 12s0 4.114.478 5.814a2.72 2.72 0 001.92 1.908C6.038 20.2 12 20.2 12 20.2s5.962 0 7.662-.478a2.72 2.72 0 001.92-1.908c.478-1.7.478-5.814.478-5.814s0-4.114-.478-5.814zm-11.604 9.01V8.804L15.345 12l-5.367 3.196z"/></svg>
                  ) : (
                    <LinkIcon className="w-4 h-4" />
                  )}
                </div>
                <span className={`text-sm font-medium truncate ${activeId === item.id ? 'text-primary' : 'text-foreground'}`}>
                  {item.title}
                </span>
              </div>
              <button 
                onClick={(e) => removeTrack(item.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive transition-all shrink-0"
                title="Remove Track"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}