"use client"

import React from "react"
import { cx } from "class-variance-authority"
import { motion } from "motion/react"
import { Send, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"

// ── Color Orb ────────────────────────────────────────────────────────────────
interface OrbProps {
  dimension?: string
  className?: string
  tones?: {
    base?: string
    accent1?: string
    accent2?: string
    accent3?: string
  }
  spinDuration?: number
}

const ColorOrb: React.FC<OrbProps> = ({
  dimension = "192px",
  className,
  tones,
  spinDuration = 20,
}) => {
  const fallbackTones = {
    base: "oklch(95% 0.02 264.695)",
    accent1: "oklch(75% 0.15 350)",
    accent2: "oklch(80% 0.12 200)",
    accent3: "oklch(78% 0.14 280)",
  }

  const palette = { ...fallbackTones, ...tones }
  const dimValue = parseInt(dimension.replace("px", ""), 10)
  const blurStrength = dimValue < 50 ? Math.max(dimValue * 0.008, 1) : Math.max(dimValue * 0.015, 4)
  const contrastStrength = dimValue < 50 ? Math.max(dimValue * 0.004, 1.2) : Math.max(dimValue * 0.008, 1.5)
  const pixelDot = dimValue < 50 ? Math.max(dimValue * 0.004, 0.05) : Math.max(dimValue * 0.008, 0.1)
  const shadowRange = dimValue < 50 ? Math.max(dimValue * 0.004, 0.5) : Math.max(dimValue * 0.008, 2)
  const maskRadius = dimValue < 30 ? "0%" : dimValue < 50 ? "5%" : dimValue < 100 ? "15%" : "25%"
  const adjustedContrast = dimValue < 30 ? 1.1 : dimValue < 50 ? Math.max(contrastStrength * 1.2, 1.3) : contrastStrength

  return (
    <div
      className={cn("color-orb", className)}
      style={{
        width: dimension,
        height: dimension,
        "--orb-base": palette.base,
        "--orb-accent1": palette.accent1,
        "--orb-accent2": palette.accent2,
        "--orb-accent3": palette.accent3,
        "--orb-spin-duration": `${spinDuration}s`,
        "--orb-blur": `${blurStrength}px`,
        "--orb-contrast": adjustedContrast,
        "--orb-dot": `${pixelDot}px`,
        "--orb-shadow": `${shadowRange}px`,
        "--orb-mask": maskRadius,
      } as React.CSSProperties}
    />
  )
}

// ── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: "user" | "agent"
  text: string
  time: string
}

const AGENT_API = "http://localhost:4000/api/agent"
const FORM_WIDTH = 420
const FORM_HEIGHT_CLOSED = 48
const FORM_HEIGHT_OPEN = 520
const SPEED_FACTOR = 1

// ── Markdown Bold Renderer ──────────────────────────────────────────────────
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
  ))
}

// ── Main Exported Component ─────────────────────────────────────────────────
interface TaskoraAgentProps {
  token: string | null
  fetchTasks: () => Promise<void>
  fetchHabits: () => Promise<void>
}

export function TaskoraAgentPanel({ token, fetchTasks, fetchHabits }: TaskoraAgentProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [input, setInput] = React.useState("")
  const [retryMsg, setRetryMsg] = React.useState<string | null>(null)
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      text: "Hey there! 💛 I'm **Kora**, your personal Taskora companion. I'm here to help you manage your day, track your habits, jot down thoughts, and honestly — just make your life a little easier.\n\nTalk to me like you'd talk to a friend. I understand natural language!",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ])

  // ── Auto-scroll to bottom on new messages ──
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  // ── Focus management: always keep cursor in textarea when panel is open ──
  const focusInput = React.useCallback(() => {
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        // Move cursor to end
        const len = textareaRef.current.value.length
        textareaRef.current.setSelectionRange(len, len)
      }
    }, 50)
  }, [])

  React.useEffect(() => {
    if (open) focusInput()
  }, [open, focusInput])

  // Re-focus after loading completes (agent replied)
  React.useEffect(() => {
    if (!loading && open) focusInput()
  }, [loading, open, focusInput])

  // ── Global keyboard shortcut: Ctrl+K to toggle ──
  React.useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener("keydown", handleGlobalKey)
    return () => document.removeEventListener("keydown", handleGlobalKey)
  }, [])

  // ── Auto-resize textarea ──
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize
    const el = e.target
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 80) + "px"
  }

  // ── Send message with timeout + retry ──
  const sendMessage = async (messageOverride?: string) => {
    const text = (messageOverride || input).trim()
    if (!text || loading) return

    if (!token) {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: "agent", text: "⚠️ You need to be logged in first. Please sign in and try again.", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ])
      return
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setRetryMsg(null)
    setLoading(true)

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto"

    // Timeout controller (30s)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    try {
      const res = await fetch(AGENT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        const errorText = errorData?.reply || `Server error (${res.status})`
        throw new Error(errorText)
      }

      const data = await res.json()
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        text: data.reply || "Hmm, I got an empty response. Mind trying again?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages(prev => [...prev, agentMsg])

      // Auto-refresh UI when agent performs actions
      if (data.action === "refetch_tasks") fetchTasks()
      if (data.action === "refetch_habits") fetchHabits()
    } catch (err: unknown) {
      clearTimeout(timeout)
      let errorMessage: string

      if (err instanceof DOMException && err.name === "AbortError") {
        errorMessage = "⏱️ That took too long — the request timed out after 30 seconds. This might be a rate limit issue. Want to **try again**?"
      } else if (err instanceof TypeError && err.message.includes("fetch")) {
        errorMessage = "🔌 Can't reach the server. Make sure your backend is running on **localhost:4000**."
      } else if (err instanceof Error) {
        errorMessage = err.message
      } else {
        errorMessage = "Something unexpected happened. Mind trying again? 🙏"
      }

      setRetryMsg(text) // Store for retry
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "agent", text: errorMessage, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([
      { id: "cleared", role: "agent", text: "Fresh start! ✨ I've cleared my memory. What can I help you with?", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ])
    setRetryMsg(null)
    focusInput()
    // Also clear server-side persistent memory
    if (token) {
      fetch(AGENT_API + "/memory", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") setOpen(false)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Global orb styles (converted from styled-jsx for Vite compatibility) */}
      <style>{`
        @property --orb-angle {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }
        .color-orb {
          display: grid;
          grid-template-areas: "stack";
          overflow: hidden;
          border-radius: 50%;
          position: relative;
          transform: scale(1.1);
        }
        .color-orb::before,
        .color-orb::after {
          content: "";
          display: block;
          grid-area: stack;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          transform: translateZ(0);
        }
        .color-orb::before {
          background:
            conic-gradient(from calc(var(--orb-angle) * 2) at 25% 70%, var(--orb-accent3), transparent 20% 80%, var(--orb-accent3)),
            conic-gradient(from calc(var(--orb-angle) * 2) at 45% 75%, var(--orb-accent2), transparent 30% 60%, var(--orb-accent2)),
            conic-gradient(from calc(var(--orb-angle) * -3) at 80% 20%, var(--orb-accent1), transparent 40% 60%, var(--orb-accent1)),
            conic-gradient(from calc(var(--orb-angle) * 2) at 15% 5%, var(--orb-accent2), transparent 10% 90%, var(--orb-accent2)),
            conic-gradient(from calc(var(--orb-angle) * 1) at 20% 80%, var(--orb-accent1), transparent 10% 90%, var(--orb-accent1)),
            conic-gradient(from calc(var(--orb-angle) * -2) at 85% 10%, var(--orb-accent3), transparent 20% 80%, var(--orb-accent3));
          box-shadow: inset var(--orb-base) 0 0 var(--orb-shadow) calc(var(--orb-shadow) * 0.2);
          filter: blur(var(--orb-blur)) contrast(var(--orb-contrast));
          animation: orb-spin var(--orb-spin-duration) linear infinite;
        }
        .color-orb::after {
          background-image: radial-gradient(circle at center, var(--orb-base) var(--orb-dot), transparent var(--orb-dot));
          background-size: calc(var(--orb-dot) * 2) calc(var(--orb-dot) * 2);
          backdrop-filter: blur(calc(var(--orb-blur) * 2)) contrast(calc(var(--orb-contrast) * 2));
          mix-blend-mode: overlay;
          mask-image: radial-gradient(black var(--orb-mask), transparent 75%);
        }
        @keyframes orb-spin {
          to { --orb-angle: 360deg; }
        }
        @media (prefers-reduced-motion: reduce) {
          .color-orb::before { animation: none; }
        }
        @keyframes agentSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Floating container — fixed to bottom-right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Chat Panel */}
        {open && (
            <div
              ref={wrapperRef}
              className="flex flex-col overflow-hidden border border-border shadow-2xl bg-card"
              style={{
                width: FORM_WIDTH,
                height: FORM_HEIGHT_OPEN,
                borderRadius: 20,
                animation: "agentSlideUp 0.25s ease-out",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.06), transparent)" }}
              >
                <div className="flex items-center gap-3">
                  <ColorOrb dimension="28px" tones={{ base: "oklch(22.64% 0 0)" }} spinDuration={12} />
                  <div>
                    <h3 className="text-foreground font-semibold leading-tight" style={{ fontSize: 14 }}>Kora</h3>
                    <span className="text-primary flex items-center gap-1" style={{ fontSize: 10.5 }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                      Your AI Companion
                    </span>
                  </div>
                </div>
                <button onClick={clearChat} className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground" title="Clear chat">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Message stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={cx(
                      "max-w-[85%] px-3.5 py-2.5",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-sm"
                        : "bg-secondary/50 text-foreground rounded-2xl rounded-bl-md border border-border/40"
                    )} style={{ fontSize: 12.5, lineHeight: 1.65 }}>
                      {renderText(msg.text)}
                      <span className={`block mt-1 ${msg.role === "user" ? "text-primary-foreground/50" : "text-muted-foreground"}`} style={{ fontSize: 9.5 }}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary/50 text-muted-foreground px-4 py-3 rounded-2xl rounded-bl-md border border-border/40 flex items-center gap-2.5">
                      <ColorOrb dimension="18px" tones={{ base: "oklch(22.64% 0 0)" }} spinDuration={6} />
                      <span style={{ fontSize: 12 }}>Thinking...</span>
                    </div>
                  </div>
                )}

                {/* Retry button */}
                {retryMsg && !loading && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => sendMessage(retryMsg)}
                      className="text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-full transition-colors"
                      style={{ fontSize: 11, fontWeight: 500 }}
                    >
                      🔄 Retry last message
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-3 pb-3 pt-2 border-t border-border shrink-0 bg-card">
                <div className="flex items-end gap-2 bg-input border border-border rounded-xl px-3 py-2 focus-within:border-primary/50 transition-colors">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    rows={1}
                    disabled={loading}
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[24px] max-h-[80px]"
                    style={{ fontSize: 13 }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all disabled:opacity-30 hover:scale-105 active:scale-95"
                    style={{ background: "hsl(var(--primary))" }}
                  >
                    <Send className="w-3.5 h-3.5 text-primary-foreground" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5 px-1">
                  <span className="text-muted-foreground" style={{ fontSize: 10 }}>Enter to send · Ctrl+K to toggle</span>
                  <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: 10 }}>
                    Powered by <span className="text-primary font-semibold">Gemini AI</span>
                  </span>
                </div>
              </div>
            </div>
          )}

        {/* Floating Orb Toggle */}
        <motion.button
          onClick={() => setOpen(!open)}
          className="relative w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border-2 border-border/30 shadow-2xl"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          style={{
            boxShadow: open ? "0 4px 20px hsl(var(--primary) / 0.15)" : "0 8px 40px hsl(var(--primary) / 0.35)",
          }}
        >
          {open ? (
            <span className="text-foreground text-xl font-light absolute">✕</span>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ColorOrb dimension="56px" spinDuration={10} tones={{
                base: "oklch(22.64% 0 0)",
                accent1: "oklch(65% 0.25 310)",
                accent2: "oklch(70% 0.2 230)",
                accent3: "oklch(68% 0.22 280)",
              }} />
            </div>
          )}
        </motion.button>
      </div>
    </>
  )
}

export default TaskoraAgentPanel
