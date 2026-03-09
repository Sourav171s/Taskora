import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Zap, Eye, EyeOff, Mail, Lock, User, AlertCircle } from "lucide-react";

type Mode = "login" | "register";

export function AuthPage() {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#09090f]">
      {/* Left panel – branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0d0d1a 0%, #12091f 100%)" }}
      >
        {/* Glow orbs */}
        <div
          className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(124,92,255,0.15) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)" }}
        />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#e4e4ed", letterSpacing: "-0.5px" }}>Taskora</span>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 space-y-6">
          <div>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#e4e4ed", lineHeight: 1.3, letterSpacing: "-0.5px" }}>
              Your intelligent
              <br />
              <span style={{ color: "#7C5CFF" }}>focus workspace</span>
            </p>
            <p style={{ fontSize: 14, color: "#6b6b80", marginTop: 12, lineHeight: 1.6 }}>
              Stay in deep work, track your sessions, manage tasks and reach flow state faster with AI-powered insights.
            </p>
          </div>

          {[
            { icon: "🎯", title: "Pomodoro & Custom Timers", desc: "Stay on task with flexible focus sessions" },
            { icon: "🎵", title: "Ambience & Music Player", desc: "Play rain, cafe, ocean sounds or lo-fi beats" },
            { icon: "📊", title: "Focus Analytics", desc: "Visualize your productivity heatmap & streaks" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(124,92,255,0.12)", border: "1px solid rgba(124,92,255,0.2)" }}
              >
                <span style={{ fontSize: 17 }}>{f.icon}</span>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#c4c4d4" }}>{f.title}</p>
                <p style={{ fontSize: 12, color: "#4a4a5a", marginTop: 2 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: "#3a3a4a" }} className="relative z-10">
          © 2026 Taskora · Built for deep work lovers
        </p>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#e4e4ed" }}>Taskora</span>
          </div>

          <div className="mb-6">
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e4e4ed", letterSpacing: "-0.3px" }}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p style={{ fontSize: 13, color: "#6b6b80", marginTop: 4 }}>
              {mode === "login"
                ? "Sign in to your Taskora workspace"
                : "Start your productivity journey today"}
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg transition-all mb-4"
            style={{
              background: "#1a1a24",
              border: "1px solid #2a2a3a",
              color: "#c4c4d4",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: "#1a1a24" }} />
            <span style={{ fontSize: 11, color: "#3a3a4a" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "#1a1a24" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#4a4a5a" }} />
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg outline-none"
                  style={{
                    background: "#1a1a24",
                    border: "1px solid #2a2a3a",
                    color: "#e4e4ed",
                    fontSize: 13,
                  }}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#4a4a5a" }} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-lg outline-none"
                style={{
                  background: "#1a1a24",
                  border: "1px solid #2a2a3a",
                  color: "#e4e4ed",
                  fontSize: 13,
                }}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#4a4a5a" }} />
              <input
                type={showPass ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-10 py-2.5 rounded-lg outline-none"
                style={{
                  background: "#1a1a24",
                  border: "1px solid #2a2a3a",
                  color: "#e4e4ed",
                  fontSize: 13,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPass ? (
                  <EyeOff className="w-4 h-4" style={{ color: "#4a4a5a" }} />
                ) : (
                  <Eye className="w-4 h-4" style={{ color: "#4a4a5a" }} />
                )}
              </button>
            </div>

            {error && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "#ef4444" }} />
                <span style={{ fontSize: 12, color: "#ef4444" }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium transition-all"
              style={{
                background: loading ? "#3d2fa0" : "#7C5CFF",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: loading ? "none" : "0 0 20px rgba(124,92,255,0.3)",
              }}
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="text-center mt-5" style={{ fontSize: 12.5, color: "#6b6b80" }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              style={{ color: "#7C5CFF", fontWeight: 500 }}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
