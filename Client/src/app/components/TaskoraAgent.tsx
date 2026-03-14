import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Sparkles, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TaskContext";
import { useHabits } from "../context/HabitContext";

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
  time: string;
}

const API = "http://localhost:4000/api/agent";

export function TaskoraAgent() {
  const { token } = useAuth();
  const { fetchTasks } = useTasks();
  const { fetchHabits } = useHabits();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      text: "Hey! 👋 I'm your **Taskora Agent**. I can manage your tasks, habits, journal, projects, finances, library and flashcards — all through chat.\n\nType **help** to see everything I can do!",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !token || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMsg.text }),
      });
      const data = await res.json();

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        text: data.reply || "Something went wrong.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, agentMsg]);

      // Auto-refresh data if the agent performed an action
      if (data.action === "refetch_tasks") fetchTasks();
      if (data.action === "refetch_habits") fetchHabits();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "agent",
          text: "⚠️ Couldn't reach the server. Make sure your backend is running.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "agent",
        text: "Chat cleared! How can I help you?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Simple markdown bold renderer
  const renderText = (text: string) => {
    return text.split("\n").map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))",
          boxShadow: open ? "none" : "0 8px 32px hsl(var(--primary) / 0.4)",
        }}
      >
        {open ? (
          <X className="w-6 h-6 text-primary-foreground" />
        ) : (
          <Bot className="w-6 h-6 text-primary-foreground" />
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden border border-border shadow-2xl"
          style={{
            width: 400,
            height: 520,
            borderRadius: 20,
            background: "hsl(var(--card))",
            animation: "agentSlideUp 0.3s ease-out",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), transparent)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "hsl(var(--primary) / 0.15)" }}
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold" style={{ fontSize: 14 }}>
                  Taskora Agent
                </h3>
                <span className="text-primary flex items-center gap-1" style={{ fontSize: 11 }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  Online
                </span>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary/60 text-foreground rounded-bl-md border border-border/50"
                  }`}
                  style={{ fontSize: 13, lineHeight: 1.6 }}
                >
                  {renderText(msg.text)}
                  <span
                    className={`block mt-1 ${
                      msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                    }`}
                    style={{ fontSize: 10 }}
                  >
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary/60 text-muted-foreground px-4 py-3 rounded-2xl rounded-bl-md border border-border/50 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span style={{ fontSize: 12 }}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="p-3 border-t border-border flex items-center gap-2 bg-card shrink-0"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 bg-input border border-border rounded-xl py-2.5 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              style={{ fontSize: 13 }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 hover:opacity-80"
              style={{ background: "hsl(var(--primary))" }}
            >
              <Send className="w-4 h-4 text-primary-foreground" />
            </button>
          </form>
        </div>
      )}

      {/* Animation keyframe */}
      <style>{`
        @keyframes agentSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
