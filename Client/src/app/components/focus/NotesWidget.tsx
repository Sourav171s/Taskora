import { useState, useEffect } from "react";
import { StickyNote, Trash2, Plus, FileText, X, ChevronLeft } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export function NotesWidget() {
  const { addNotification } = useNotifications();

  // Load all notes from local storage, or initialize empty
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem("taskora_notes_v2");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // activeNoteId === null means we are viewing the LIST of notes
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  const activeNote = notes.find(n => n.id === activeNoteId);

  // Auto-save logic whenever notes array changes
  useEffect(() => {
    localStorage.setItem("taskora_notes_v2", JSON.stringify(notes));
  }, [notes]);

  // Create a new note
  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      updatedAt: Date.now(),
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const updateActiveNote = (updates: Partial<Note>) => {
    if (!activeNoteId) return;
    setNotes(prev => prev.map(n => 
      n.id === activeNoteId ? { ...n, ...updates, updatedAt: Date.now() } : n
    ));
  };

  const deleteNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(window.confirm("Are you sure you want to delete this note?")) {
      setNotes(prev => prev.filter(n => n.id !== id));
      if (activeNoteId === id) setActiveNoteId(null);
      addNotification({
        type: "system",
        title: "Note Deleted",
        message: "Your note was successfully deleted.",
        time: "Just now",
        icon: "🗑️"
      });
    }
  };

  const formatDate = (ms: number) => {
    const d = new Date(ms);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-2 px-1">
        
        {/* If in edit mode, show back button */}
        {activeNoteId ? (
          <button 
            onClick={() => setActiveNoteId(null)}
            className="p-1 rounded hover:bg-[#1A1A24] transition-colors -ml-1 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <StickyNote className="w-3.5 h-3.5 shrink-0" style={{ color: "#f59e0b" }} />
        )}

        <span className="truncate" style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 500, letterSpacing: "0.02em" }}>
          {activeNoteId ? "Editing Note" : "Scratchpad Notes"}
        </span>

        {/* If in list view, show Add button */}
        {!activeNoteId && (
          <div className="ml-auto flex items-center">
            <button 
              onClick={createNewNote}
              className="p-1 rounded hover:bg-[#1A1A24] transition-colors text-muted-foreground hover:text-foreground"
              title="New Note"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* If in edit mode, show delete button for current note */}
        {activeNoteId && (
          <div className="ml-auto flex items-center">
             <button 
              onClick={(e) => deleteNote(e, activeNoteId)}
              className="p-1 rounded hover:bg-[#1A1A24] transition-colors"
              title="Delete Note"
            >
              <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-400 transition-colors" />
            </button>
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 w-full bg-[#0e0e16] border border-[#1A1A24] rounded-lg overflow-hidden flex flex-col relative">
        
        {/* --- LIST VIEW --- */}
        {!activeNoteId && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {notes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-50">
                <FileText className="w-8 h-8 mb-2 text-[#4a4a5a]" />
                <p style={{ fontSize: 12, color: "#e4e4ed" }}>No notes yet</p>
                <p style={{ fontSize: 10, color: "#8a8a9a", marginTop: 4 }}>Click + to create your first note.</p>
              </div>
            ) : (
              // Sort by recently updated
              [...notes].sort((a,b) => b.updatedAt - a.updatedAt).map(note => (
                <div 
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className="group flex flex-col p-2.5 rounded-md hover:bg-[#1A1A24]/70 cursor-pointer transition-colors border border-transparent hover:border-[#1A1A24]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-[#e4e4ed]" style={{ fontSize: 13 }}>
                      {note.title || "Untitled Note"}
                    </span>
                    <button 
                      onClick={(e) => deleteNote(e, note.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#2a2a3a] rounded transition-all shrink-0"
                    >
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="truncate text-[#6b6b80]" style={{ fontSize: 11, maxWidth: "60%" }}>
                      {note.content.substring(0, 40) || "Empty..."}
                    </span>
                    <span style={{ fontSize: 9.5, color: "#4a4a5a" }}>
                      {formatDate(note.updatedAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- EDIT VIEW --- */}
        {activeNoteId && activeNote && (
          <div className="flex flex-col h-full bg-[#0e0e16]">
            {/* Title Input */}
            <input 
              type="text"
              value={activeNote.title}
              onChange={(e) => updateActiveNote({ title: e.target.value })}
              placeholder="Note Title"
              className="w-full bg-transparent border-b border-[#1A1A24] px-3 py-2.5 text-[#e4e4ed] focus:outline-none focus:border-[#7C5CFF]/30 transition-colors font-medium"
              style={{ fontSize: 13 }}
            />
            {/* Body Textarea */}
            <textarea
              value={activeNote.content}
              onChange={(e) => updateActiveNote({ content: e.target.value })}
              className="flex-1 w-full bg-transparent p-3 text-[#e4e4ed] focus:outline-none resize-none custom-scrollbar"
              placeholder="Jot down quick thoughts, or notes..."
              style={{ fontSize: 12.5, lineHeight: 1.5 }}
              spellCheck={false}
            />
          </div>
        )}

      </div>
    </div>
  );
}
