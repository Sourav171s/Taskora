import { NavLink } from "react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Target,
  ListTodo,
  BarChart3,
  CalendarDays,
  User,
  CreditCard,
  Zap,
  LogOut,
  Settings,
  Sparkles,
  Book,
  Layers,
  FolderKanban,
  Wallet,
  Library as LibIcon,
  Brain,
  Coffee,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { CoffeeModal } from "./CoffeeModal";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/tasks", icon: ListTodo, label: "Tasks" },
  { to: "/focus", icon: Target, label: "Focus Mode" },
  { to: "/planning", icon: CalendarDays, label: "Daily Planning" },
  { to: "/habits", icon: Sparkles, label: "Habits" },
  { to: "/insights", icon: BarChart3, label: "Insights" },
];

const toolsNavItems = [
  { to: "/journal", icon: Book, label: "Journal" },
  { to: "/flashcards", icon: Layers, label: "Flashcards" },
  { to: "/finance", icon: Wallet, label: "Finance" },
  { to: "/library", icon: LibIcon, label: "Library" },
  { to: "/kora", icon: Brain, label: "Kora Hub" },
];

const bottomNavItems = [
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/pricing", icon: CreditCard, label: "Upgrade" },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const [isCoffeeModalOpen, setIsCoffeeModalOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[200px] bg-sidebar border-r border-sidebar-border flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-[48px] border-b border-sidebar-border shrink-0">
        <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
          <Zap className="w-3 h-3 text-white" />
        </div>
        <span className="text-foreground tracking-tight" style={{ fontSize: 15, fontWeight: 600 }}>
          Taskora
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        <div className="space-y-0.5">
          <p className="px-2.5 pb-1.5 pt-0.5" style={{ fontSize: 10, fontWeight: 600, color: "#3a3a5a", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            Main
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`
              }
              style={{ fontSize: 13 }}
            >
              <item.icon className="w-4 h-4 shrink-0" style={{ strokeWidth: 1.5 }} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="space-y-0.5 mt-4">
          <p className="px-2.5 pb-1.5 pt-0.5" style={{ fontSize: 10, fontWeight: 600, color: "#3a3a5a", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            Tools Base
          </p>
          {toolsNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`
              }
              style={{ fontSize: 13 }}
            >
              <item.icon className="w-4 h-4 shrink-0" style={{ strokeWidth: 1.5 }} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="space-y-0.5 mt-4">
          <p className="px-2.5 pb-1.5 pt-0.5" style={{ fontSize: 10, fontWeight: 600, color: "#3a3a5a", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            Account
          </p>
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`
              }
              style={{ fontSize: 13 }}
            >
              <item.icon className="w-4 h-4 shrink-0" style={{ strokeWidth: 1.5 }} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Buy me a coffee banner */}
      <div className="px-3 pb-3">
        <button
          onClick={() => setIsCoffeeModalOpen(true)}
          className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-colors group text-left"
        >
          <div className="w-7 h-7 rounded-md bg-orange-500/20 flex items-center justify-center shrink-0">
            <Coffee className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <span className="text-orange-600 dark:text-orange-400 leading-none mb-1 truncate" style={{ fontSize: 11.5, fontWeight: 600 }}>Help with a coffee</span>
            <span className="text-orange-600/70 dark:text-orange-400/70 leading-none" style={{ fontSize: 10 }}>Just for $1</span>
          </div>
        </button>
      </div>

      {/* Bottom section — user */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 w-full rounded-md py-1">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-primary" style={{ fontSize: 11, fontWeight: 600 }}>{initials}</span>
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-foreground truncate" style={{ fontSize: 12, fontWeight: 500 }}>{user?.name || "User"}</p>
            <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>Pro Plan</p>
          </div>
          <button
            onClick={logout}
            className="p-1 rounded hover:bg-sidebar-accent/50 transition-colors"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5 text-muted-foreground" style={{ strokeWidth: 1.5 }} />
          </button>
        </div>
      </div>

      <CoffeeModal isOpen={isCoffeeModalOpen} onClose={() => setIsCoffeeModalOpen(false)} />
    </aside>
  );
}