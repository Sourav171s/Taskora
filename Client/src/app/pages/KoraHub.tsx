import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TaskContext";
import { useHabits } from "../context/HabitContext";
import {
  Send, Upload, FileText, Image as ImageIcon, Calendar, Clock, BookOpen,
  Sparkles, X, Brain, Loader2, Coffee, GraduationCap, MapPin,
  Pin, Edit3, RotateCcw
} from "lucide-react";

const API = "http://localhost:4000/api/agent";

// ── Types ──
interface Message {
  id?: string;
  role: "user" | "agent" | "model";
  text: string;
  time?: string;
  file?: { name: string; type: string };
}

interface ScheduleEntry {
  time: string;
  endTime: string;
  subject: string;
  type: "class" | "lab" | "tutorial" | "seminar" | "gap" | "lunch";
  room?: string;
  professor?: string;
}

interface WeeklySchedule {
  [day: string]: ScheduleEntry[];
}

// ── Markdown renderer ──
function renderText(text: string) {
  return text.split("\n").map((line, i) => (
    <span key={i}>
      {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={j} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
        ) : (
          <span key={j}>{part}</span>
        )
      )}
      {i < text.split("\n").length - 1 && <br />}
    </span>
  ));
}

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  class: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  lab: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  tutorial: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  seminar: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  gap: { bg: "bg-secondary/30", text: "text-muted-foreground", border: "border-border/30" },
  lunch: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function KoraHub() {
  const { token } = useAuth();
  const { fetchTasks } = useTasks();
  const { fetchHabits } = useHabits();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── States ──
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() === 0 ? 0 : new Date().getDay() - 1] || "Monday");
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [pendingFile, setPendingFile] = useState<{ name: string; base64: string; type: string } | null>(null);

  // ── Chat Session States ──
  const [messages, setMessages] = useState<Message[]>([]);

  // ── Fetch Individual Chat History ──
  const fetchHistory = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/kora/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.conversation?.messages?.length > 0) {
        setMessages(data.conversation.messages.map((m: any) => ({
          ...m,
          role: m.role === "model" ? "agent" : m.role,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        })));
      } else {
        setMessages([{
          id: "welcome",
          role: "agent",
          text: "Welcome back! I'm Kora. Upload your schedule or ask me anything. 🧠✨",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ── Fetch Schedule ──
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/schedule`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.schedule?.weeklySchedule) {
          setSchedule(data.schedule.weeklySchedule);
          const firstDay = DAYS.find(d => data.schedule.weeklySchedule[d]?.length > 0) || "Monday";
          setSelectedDay(firstDay);
        }
      });
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Session Controls ──
  const resetChat = async () => {
    if (!window.confirm("Are you sure you want to reset this chat? History will be cleared.")) return;
    try {
      const res = await fetch(`${API}/kora/history`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessages([{
          id: "welcome",
          role: "agent",
          text: "Chat reset! How can I help you today? 💬",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ── File handling ──
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setPendingFile({ name: file.name, base64, type: file.type });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const extractSchedule = useCallback(async () => {
    if (!pendingFile || !token) return;
    setExtracting(true);
    try {
      const res = await fetch(`${API}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileContent: pendingFile.base64, fileType: pendingFile.type }),
      });
      const data = await res.json();
      if (data.success && data.schedule?.weeklySchedule) {
        setSchedule(data.schedule.weeklySchedule);
        setSelectedDay(DAYS.find(d => data.schedule.weeklySchedule[d]?.length > 0) || "Monday");
        setMessages(prev => [...prev, {
          role: "agent",
          text: `✅ Schedule extracted! View it on the right sidebar.`,
          time: new Date().toLocaleTimeString()
        }]);
      }
    } catch (e) { console.error(e); }
    finally { setExtracting(false); setPendingFile(null); }
  }, [pendingFile, token]);

  useEffect(() => { if (pendingFile) extractSchedule(); }, [pendingFile, extractSchedule]);

  // ── Chat logic ──
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !token || loading) return;

    setMessages(prev => [...prev, { role: "user", text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/kora`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: text,
          context: schedule ? JSON.stringify(schedule) : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: "agent", text: data.reply, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
        if (data.action === "refetch_tasks") fetchTasks();
      }
    } catch {
      setMessages(prev => [...prev, { role: "agent", text: "Something went wrong 😅", time: new Date().toLocaleTimeString() }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex h-[calc(100vh-48px)] bg-background">
      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative border-r border-border">

        {/* ───── MAIN: CHAT ───── */}
        <div className="flex-1 flex flex-col max-w-[800px] mx-auto w-full p-4">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-foreground" style={{ fontSize: 17, fontWeight: 600 }}>Kora Hub</h1>
            </div>
            <div className="flex items-center gap-2">
               <button 
                 onClick={resetChat}
                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/40 hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
                 style={{ fontSize: 12 }}
               >
                 <RotateCcw className="w-3.5 h-3.5" /> Reset Chat
               </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar pb-6">
            {messages.length === 0 && (
               <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-20">
                  <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-primary/40" />
                  </div>
                  <h2 className="text-foreground font-medium" style={{ fontSize: 16 }}>Empower your day with Kora</h2>
                  <p className="text-muted-foreground max-w-[300px]" style={{ fontSize: 13, lineHeight: 1.6 }}>
                    Ask about your tasks, upload a schedule, or start a new project. I'm here to help.
                  </p>
               </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border ${
                  msg.role === "user" ? "bg-primary/20 border-primary/30" : "bg-card border-border"
                }`}>
                   {msg.role === "user" ? <div className="text-[10px] font-bold">ME</div> : <Brain className="w-4 h-4 text-primary" />}
                </div>
                <div className={`max-w-[80%] space-y-1.5 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                  <div className={`px-4 py-3 rounded-2xl ${
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-secondary/40 text-foreground rounded-tl-sm border border-border/40"
                  }`} style={{ fontSize: 13.5, lineHeight: 1.7, textAlign: 'left' }}>
                    {msg.file && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10 opacity-70">
                        <FileText className="w-3 h-3" />
                        <span style={{ fontSize: 10.5 }}>{msg.file.name}</span>
                      </div>
                    )}
                    {renderText(msg.text)}
                  </div>
                  <span className="text-muted-foreground block" style={{ fontSize: 10 }}>{msg.time}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
                   <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
                <div className="bg-secondary/20 border border-border/30 px-4 py-3 rounded-2xl rounded-tl-sm text-muted-foreground italic" style={{ fontSize: 13 }}>
                   Kora is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-4 pt-4 border-t border-border">
             <div className="relative group">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Message Kora Hub..."
                  rows={1}
                  className="w-full bg-card border border-border rounded-2xl py-3.5 pl-4 pr-24 outline-none focus:border-primary/50 transition-all resize-none shadow-sm"
                  style={{ fontSize: 14, lineHeight: 1.6 }}
                />
                <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
                   <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    className="p-2 rounded-xl bg-primary text-primary-foreground hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
             </div>
             <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
          </div>
        </div>
      </div>

      {/* ───── RIGHT SIDEBAR: SCHEDULE ───── */}
      <div className="w-[320px] border-l border-border bg-card/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h2 className="text-foreground" style={{ fontSize: 14, fontWeight: 600 }}>Active Schedule</h2>
           </div>
           {extracting && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
        </div>
        
        <div className="flex border-b border-border overflow-x-auto custom-scrollbar no-scrollbar">
          {DAYS.map(day => (
            <button
               key={day}
               onClick={() => setSelectedDay(day)}
               className={`px-3 py-2.5 text-center transition-colors relative flex-1 ${
                 selectedDay === day ? "text-primary" : "text-muted-foreground hover:text-foreground"
               }`}
               style={{ fontSize: 11, fontWeight: selectedDay === day ? 700 : 500 }}
            >
               {day.slice(0, 3)}
               {selectedDay === day && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
          {!schedule ? (
             <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center opacity-30">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <p className="text-muted-foreground" style={{ fontSize: 12.5 }}>Upload your college schedule to see it here.</p>
             </div>
          ) : (
            (schedule[selectedDay] || []).length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center opacity-40 py-10">
                  <Coffee className="w-8 h-8 mb-2" />
                  <p style={{ fontSize: 12 }}>Free Day</p>
               </div>
            ) : schedule[selectedDay].map((entry, idx) => (
               <div key={idx} className={`${typeColors[entry.type]?.bg} border ${typeColors[entry.type]?.border} p-3 rounded-xl space-y-1`}>
                  <div className="flex items-center justify-between">
                     <p className={`${typeColors[entry.type]?.text} font-bold`} style={{ fontSize: 12 }}>{entry.subject}</p>
                     <span className="text-[9px] uppercase font-bold opacity-70 px-1.5 py-0.5 bg-background/50 rounded">{entry.type}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground" style={{ fontSize: 10.5 }}>
                     <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {entry.time} - {entry.endTime}</span>
                     {entry.room && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {entry.room}</span>}
                  </div>
               </div>
            ))
          )}
        </div>

        <div className="p-4 bg-secondary/10 border-t border-border">
           <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-background border border-border hover:bg-secondary/50 transition-all text-foreground"
            style={{ fontSize: 12.5, fontWeight: 500 }}
           >
              <Upload className="w-3.5 h-3.5" /> Replace Schedule
           </button>
        </div>
      </div>
    </div>
  );
}
