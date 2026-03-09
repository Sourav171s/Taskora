import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { SettingsProvider } from "./context/SettingsContext";
import { TaskProvider } from "./context/TaskContext";
import { HabitProvider } from "./context/HabitContext";
import { Toaster } from "sonner";

export default function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <SettingsProvider>
          <NotificationProvider>
            <HabitProvider>
              <Toaster position="bottom-right" theme="dark" richColors />
              <RouterProvider router={router} />
            </HabitProvider>
          </NotificationProvider>
        </SettingsProvider>
      </TaskProvider>
    </AuthProvider>
  );
}
