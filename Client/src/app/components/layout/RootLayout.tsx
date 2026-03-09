import { Outlet, useLocation } from "react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useAuth } from "../../context/AuthContext";
import { AuthPage } from "../../pages/AuthPage";
import { LoadingScreen } from "../ui/LoadingScreen";
import { TaskoraAgentPanel } from "@/components/ui/ai-input";
import { useTasks } from "../../context/TaskContext";
import { useHabits } from "../../context/HabitContext";
import { useState, useEffect } from "react";

export function RootLayout() {
  const location = useLocation();
  const { user, isLoading, token } = useAuth();
  const isFocusMode = location.pathname === "/focus";

  // We want to block rendering the app until BOTH auth is done AND minimum load time has passed
  const [minTimePassed, setMinTimePassed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), 2800);
    return () => clearTimeout(timer);
  }, []);

  const showLoading = isLoading || !minTimePassed;

  if (showLoading) {
    return <LoadingScreen authLoading={isLoading} />;
  }

  if (!user) {
    return <AuthPage />;
  }

  if (isFocusMode) {
    return <Outlet />;
  }

  return <AuthenticatedLayout token={token} />;
}

function AuthenticatedLayout({ token }: { token: string | null }) {
  const { fetchTasks } = useTasks();
  const { fetchHabits } = useHabits();

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[200px] min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1120px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <TaskoraAgentPanel token={token} fetchTasks={fetchTasks} fetchHabits={fetchHabits} />
    </div>
  );
}