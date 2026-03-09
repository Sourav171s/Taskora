import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { Dashboard } from "./pages/Dashboard";
import { Tasks } from "./pages/Tasks";
import { FocusMode } from "./pages/FocusMode";
import { Insights } from "./pages/Insights";
import { DailyPlanning } from "./pages/DailyPlanning";
import { Profile } from "./pages/Profile";
import { Pricing } from "./pages/Pricing";
import { Habits } from "./pages/Habits";
import { Journal } from "./pages/Journal";
import { Flashcards } from "./pages/Flashcards";
import { Projects } from "./pages/Projects";
import { Finance } from "./pages/Finance";
import { Library } from "./pages/Library";
import { KoraHub } from "./pages/KoraHub";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "tasks", Component: Tasks },
      { path: "focus", Component: FocusMode },
      { path: "insights", Component: Insights },
      { path: "planning", Component: DailyPlanning },
      { path: "habits", Component: Habits },
      { path: "journal", Component: Journal },
      { path: "flashcards", Component: Flashcards },
      { path: "projects", Component: Projects },
      { path: "finance", Component: Finance },
      { path: "library", Component: Library },
      { path: "kora", Component: KoraHub },
      { path: "profile", Component: Profile },
      { path: "pricing", Component: Pricing },
      { path: "*", Component: Dashboard },
    ],
  },
]);
