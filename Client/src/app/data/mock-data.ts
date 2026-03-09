export const tasks = [
  {
    id: "1",
    title: "Write Final History Paper",
    priority: "critical",
    estimatedMinutes: 120,
    focusedMinutes: 0,
    lastWorked: "Never",
    completed: false,
    project: "History 101",
    type: "normal",
    url: "https://docs.google.com/document/d/1X...",
  },
  {
    id: "2",
    title: "Study Chapter 4: Calculus",
    priority: "high",
    estimatedMinutes: 60,
    focusedMinutes: 0,
    lastWorked: "Yesterday",
    completed: false,
    project: "Math",
    type: "study",
    repeats: true,
    nextReview: "2026-03-09",
  },
  {
    id: "3",
    title: "Physics Lab Report",
    priority: "medium",
    estimatedMinutes: 45,
    focusedMinutes: 45,
    lastWorked: "Today",
    completed: true,
    project: "Physics",
    type: "normal",
  },
  {
    id: "4",
    title: "Review 'Atomic Habits'",
    priority: "low",
    estimatedMinutes: 30,
    focusedMinutes: 0,
    lastWorked: "Never",
    completed: false,
    type: "study",
    repeats: true,
    nextReview: "2026-03-10",
  }
];

export const weeklyFocusData = [
  { day: "Mon", minutes: 0 },
  { day: "Tue", minutes: 0 },
  { day: "Wed", minutes: 0 },
  { day: "Thu", minutes: 0 },
  { day: "Fri", minutes: 0 },
  { day: "Sat", minutes: 0 },
  { day: "Sun", minutes: 0 },
];

export const sessionDistribution = [
  { name: "Deep Work", value: 100, fill: "#8b5cf6" },
  { name: "Shallow Work", value: 0, fill: "#6366f1" },
  { name: "Planning", value: 0, fill: "#a78bfa" },
];

export const monthlyFocusData = [
  { week: "W1", focus: 0, target: 900 },
  { week: "W2", focus: 0, target: 900 },
  { week: "W3", focus: 0, target: 900 },
  { week: "W4", focus: 0, target: 900 },
];

export const dailyFocusData = [
  { hour: "6am", minutes: 0 },
  { hour: "7am", minutes: 0 },
  { hour: "8am", minutes: 0 },
  { hour: "9am", minutes: 0 },
  { hour: "10am", minutes: 0 },
  { hour: "11am", minutes: 0 },
  { hour: "12pm", minutes: 0 },
  { hour: "1pm", minutes: 0 },
  { hour: "2pm", minutes: 0 },
  { hour: "3pm", minutes: 0 },
  { hour: "4pm", minutes: 0 },
  { hour: "5pm", minutes: 0 },
  { hour: "6pm", minutes: 0 },
  { hour: "7pm", minutes: 0 },
];

export function generateHeatmapData() {
  const data = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().split("T")[0],
      value: 0,
    });
  }
  return data;
}

export const soundOptions = [
  { id: "rain", label: "Rain", emoji: "\uD83C\uDF27\uFE0F" },
  { id: "cafe", label: "Cafe", emoji: "\u2615" },
  { id: "forest", label: "Forest", emoji: "\uD83C\uDF32" },
  { id: "lofi", label: "Lo-fi", emoji: "\uD83C\uDFB5" },
  { id: "whitenoise", label: "White Noise", emoji: "\u3030\uFE0F" },
  { id: "ocean", label: "Ocean", emoji: "\uD83C\uDF0A" },
];