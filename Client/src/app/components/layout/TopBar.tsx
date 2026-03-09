import { useNavigate } from "react-router";
import { Search, Bell, Play, ChevronDown, Sun, Moon, User, LogOut, X, CheckCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

export function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead, removeNotification } = useNotifications();

  const [searchFocused, setSearchFocused] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const initials = user?.name
    ? user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.remove("light-mode");
    } else {
      document.documentElement.classList.add("light-mode");
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const typeColor = {
    task: "#f59e0b",
    focus: "#7C5CFF",
    achievement: "#10b981",
    reminder: "#3b82f6",
    system: "#6b7280",
  };

  return (
    <header className="h-[48px] border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-20">
      {/* Search */}
      <div className="flex items-center flex-1">
        <div
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all ${
            searchFocused ? "bg-secondary ring-1 ring-primary/30 w-[320px]" : "bg-secondary/60 w-[240px]"
          }`}
        >
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search tasks, projects..."
            className="bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground w-full"
            style={{ fontSize: 12.5 }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="hidden sm:inline-flex text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded border border-border" style={{ fontSize: 10 }}>
            {"⌘K"}
          </kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/focus")}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md transition-colors"
          style={{ fontSize: 12.5, fontWeight: 500 }}
        >
          <Play className="w-3 h-3 fill-current" />
          Start Focus
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            id="notification-bell"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full flex items-center justify-center"
                style={{ background: "#7C5CFF", fontSize: 9, fontWeight: 700, color: "white", padding: "0 3px" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {showNotifications && (
            <div
              className="absolute right-0 top-full mt-1 rounded-xl shadow-2xl overflow-hidden"
              style={{
                width: 340,
                background: "#12121a",
                border: "1px solid #1e1e2e",
                zIndex: 100,
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#1e1e2e" }}>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" style={{ color: "#7C5CFF" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#e4e4ed" }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(124,92,255,0.15)", fontSize: 10, color: "#7C5CFF", fontWeight: 600 }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 transition-colors"
                    style={{ fontSize: 11, color: "#6b6b80" }}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-6 h-6 mx-auto mb-2" style={{ color: "#3a3a4a" }} />
                    <p style={{ fontSize: 12, color: "#3a3a4a" }}>No notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/[0.02]"
                      style={{
                        borderBottom: "1px solid #1a1a26",
                        background: n.read ? "transparent" : "rgba(124,92,255,0.03)",
                      }}
                    >
                      {/* Icon */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${typeColor[n.type]}15`, border: `1px solid ${typeColor[n.type]}25` }}
                      >
                        <span style={{ fontSize: 14 }}>{n.icon}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p style={{ fontSize: 12.5, fontWeight: n.read ? 400 : 600, color: n.read ? "#8a8a9a" : "#e4e4ed" }}>
                            {n.title}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!n.read && (
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#7C5CFF" }} />
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                              className="p-0.5 rounded hover:bg-white/10 transition-colors"
                            >
                              <X className="w-3 h-3" style={{ color: "#3a3a4a" }} />
                            </button>
                          </div>
                        </div>
                        <p style={{ fontSize: 11.5, color: "#6b6b80", marginTop: 2, lineHeight: 1.4 }}>{n.message}</p>
                        <p style={{ fontSize: 10.5, color: "#3a3a4a", marginTop: 4 }}>{n.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t" style={{ borderColor: "#1e1e2e" }}>
                <button
                  style={{ fontSize: 12, color: "#7C5CFF", fontWeight: 500 }}
                  className="w-full text-center hover:opacity-80 transition-opacity"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
            className="flex items-center gap-1.5 p-1 rounded-md hover:bg-secondary transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary" style={{ fontSize: 10, fontWeight: 600 }}>{initials}</span>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {showProfileMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-[180px] bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
              style={{ zIndex: 50 }}
            >
              {/* User info */}
              <div className="px-3 py-2.5 border-b border-border">
                <p className="text-foreground" style={{ fontSize: 12.5, fontWeight: 500 }}>{user?.name}</p>
                <p className="text-muted-foreground" style={{ fontSize: 11 }}>{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { navigate("/profile"); setShowProfileMenu(false); }}
                  className="flex items-center gap-2.5 px-3 py-2 w-full text-left hover:bg-secondary/60 text-foreground transition-colors"
                  style={{ fontSize: 12.5 }}
                >
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  Profile
                </button>
              </div>

              <div className="border-t border-border py-1">
                <button
                  onClick={logout}
                  className="flex items-center gap-2.5 px-3 py-2 w-full text-left hover:bg-secondary/60 text-destructive transition-colors"
                  style={{ fontSize: 12.5 }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}