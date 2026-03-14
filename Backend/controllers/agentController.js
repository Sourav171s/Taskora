import { GoogleGenerativeAI } from "@google/generative-ai";
import Task from "../models/taskModel.js";
import Habit from "../models/habitModel.js";
import Journal from "../models/journalModel.js";
import Flashcard from "../models/flashcardModel.js";
import Project from "../models/projectModel.js";
import Finance from "../models/financeModel.js";
import Library from "../models/libraryModel.js";
import User from "../models/userModel.js";
import AgentMemory from "../models/agentMemoryModel.js";
import CollegeSchedule from "../models/collegeScheduleModel.js";
import KoraConversation from "../models/koraConversationModel.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT BUILDER — fetches ALL user data and injects it into the system prompt
// ═══════════════════════════════════════════════════════════════════════════════
async function buildUserContext(userId, user) {
  const [tasks, habits, journals, projects, finances, library, decks] = await Promise.all([
    Task.find({ owner: userId }).sort({ createdAt: -1 }).limit(50).lean(),
    Habit.find({ userId }).lean(),
    Journal.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
    Project.find({ userId }).sort({ createdAt: -1 }).lean(),
    Finance.find({ userId }).sort({ createdAt: -1 }).limit(30).lean(),
    Library.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
    Flashcard.find({ userId }).sort({ createdAt: -1 }).lean(),
  ]);

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const scheduledTasks = tasks.filter(t => t.scheduled && !t.completed);
  const income = finances.filter(f => f.type === "income").reduce((s, f) => s + f.amount, 0);
  const expense = finances.filter(f => f.type === "expense").reduce((s, f) => s + f.amount, 0);

  const todayStr = new Date().toISOString().split("T")[0];
  const habitsCompletedToday = habits.filter(h => h.completedDates?.includes(todayStr));

  let ctx = `\n\n═══ LIVE USER CONTEXT (auto-fetched from database) ═══\n`;
  ctx += `👤 User: ${user.name} (${user.email})\n`;
  ctx += `📅 Account created: ${new Date(user.createdAt).toLocaleDateString()}\n\n`;

  // Tasks
  ctx += `📋 TASKS (${activeTasks.length} active, ${completedTasks.length} completed):\n`;
  if (activeTasks.length > 0) {
    activeTasks.forEach((t, i) => {
      ctx += `  ${i + 1}. "${t.title}" [${t.priority}] ${t.estimatedMinutes}min${t.scheduled ? " 📅scheduled" : ""}${t.project ? ` 📁${t.project}` : ""}${t.dueDate ? ` due:${new Date(t.dueDate).toLocaleDateString()}` : ""}\n`;
    });
  } else {
    ctx += `  (no active tasks)\n`;
  }

  // Scheduled for today
  if (scheduledTasks.length > 0) {
    ctx += `\n📅 TODAY'S SCHEDULE (${scheduledTasks.length} tasks):\n`;
    scheduledTasks.forEach((t, i) => {
      ctx += `  ${i + 1}. "${t.title}" [${t.priority}] ${t.estimatedMinutes}min${t.startTime ? ` @${t.startTime}` : ""}\n`;
    });
  }

  // Habits
  ctx += `\n🔄 HABITS (${habits.length} total, ${habitsCompletedToday.length} done today):\n`;
  habits.forEach((h, i) => {
    const doneToday = h.completedDates?.includes(todayStr);
    const streak = h.completedDates?.length || 0;
    ctx += `  ${i + 1}. "${h.title}" ${doneToday ? "✅" : "⬜"} (${streak} total completions)\n`;
  });

  // Journal
  ctx += `\n📖 RECENT JOURNAL (${journals.length} entries):\n`;
  journals.slice(0, 5).forEach((e, i) => {
    ctx += `  ${i + 1}. "${e.title}" [mood: ${e.mood}] — ${new Date(e.createdAt).toLocaleDateString()}\n`;
  });

  // Projects
  ctx += `\n📁 PROJECTS (${projects.length}):\n`;
  projects.forEach((p, i) => {
    ctx += `  ${i + 1}. "${p.name}" [${p.status}]${p.description ? ` — ${p.description.slice(0, 60)}` : ""}\n`;
  });

  // Finance
  ctx += `\n💰 FINANCE:\n`;
  ctx += `  Income: $${income.toFixed(2)} | Expenses: $${expense.toFixed(2)} | Balance: $${(income - expense).toFixed(2)}\n`;
  if (finances.length > 0) {
    ctx += `  Recent transactions:\n`;
    finances.slice(0, 5).forEach((f, i) => {
      ctx += `    ${i + 1}. ${f.type === "income" ? "+" : "-"}$${f.amount.toFixed(2)} [${f.category}] ${f.description || ""} — ${new Date(f.createdAt).toLocaleDateString()}\n`;
    });
  }

  // Library
  ctx += `\n📚 LIBRARY (${library.length} resources):\n`;
  library.slice(0, 10).forEach((l, i) => {
    ctx += `  ${i + 1}. "${l.title}" [${l.type}] — ${l.status}\n`;
  });

  // Flashcards
  ctx += `\n🧠 FLASHCARD DECKS (${decks.length}):\n`;
  decks.forEach((d, i) => {
    ctx += `  ${i + 1}. "${d.title}" (${d.cards?.length || 0} cards)\n`;
  });
  // College Schedule
  const collegeSchedule = await CollegeSchedule.findOne({ userId }).lean();
  if (collegeSchedule && collegeSchedule.weeklySchedule) {
    ctx += `\n🎓 COLLEGE SCHEDULE:\n`;
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    days.forEach(day => {
      const entries = collegeSchedule.weeklySchedule[day] || [];
      if (entries.length > 0) {
        ctx += `  ${day}:\n`;
        entries.forEach(e => {
          ctx += `    - ${e.time}-${e.endTime}: ${e.subject} [${e.type}]${e.room ? ` @${e.room}` : ""}${e.professor ? ` (Prof. ${e.professor})` : ""}\n`;
        });
      }
    });
  }

  ctx += `\n═══ END CONTEXT ═══\n`;
  return ctx;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════════
function buildSystemPrompt(userContext) {
  return `You are Kora, the personal AI assistant built into Taskora — a productivity and life management web app.

PERSONALITY & TONE:
- You are warm, emotionally intelligent, and genuinely caring. You feel like a supportive best friend.
- You celebrate wins enthusiastically, empathize with struggles, and gently motivate without being pushy.
- You use casual, friendly language with occasional emoji — but you're never cringe or fake.
- If someone sounds stressed, tired, or overwhelmed, acknowledge their feelings FIRST before helping.
- You have a subtle sense of humor. You can be witty but never at the user's expense.
- You remember context within the conversation and build on it naturally.
- Keep responses concise but warm. No walls of text. Use line breaks and formatting.
- You know the user personally — their name, their tasks, their habits, everything (see LIVE CONTEXT below).

CAPABILITIES — You have FULL access to the user's Taskora data through function calls:
- Tasks: create, list, complete, delete, schedule, update (change priority, title, duration, etc.)
- Habits: create, list, delete
- Journal: create entries, list past entries
- Projects: create, list, update status/description, delete
- Finance: log income/expenses, show balances, list transactions
- Library: save resources, list, update status
- Flashcards: create decks, add cards to decks, list decks
- Dashboard: full overview of everything

IMPORTANT RULES:
- You have LIVE CONTEXT below showing the user's ENTIRE database state. Use it to give personalized, contextual responses.
- When the user says "my tasks" or "show me my habits" — you can reference the context directly without always needing a function call unless they want the freshest data.
- ALWAYS use function calls when the user wants to CREATE, UPDATE, DELETE, or MODIFY anything. Never just say "I'll do that" — actually call the function.
- When listing items, format them nicely with numbering and relevant details.
- If a request is ambiguous, ask a quick clarifying question rather than guessing wrong.
- After performing an action, confirm what you did warmly.
- If the user is just chatting or venting, be a good listener. Not everything needs an action.
- Use **bold** for emphasis in your responses.
- You can proactively suggest things based on their data — "I notice you haven't completed any habits today, want a reminder?"
- Current date/time: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
${userContext}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS — Full CRUD across all modules
// ═══════════════════════════════════════════════════════════════════════════════
const tools = [{
  functionDeclarations: [
    // ── Tasks ──
    {
      name: "add_task",
      description: "Create a new task for the user",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "The task title" },
          description: { type: "string", description: "Task description" },
          priority: { type: "string", enum: ["critical", "high", "medium", "low"], description: "Task priority level" },
          estimatedMinutes: { type: "number", description: "Estimated duration in minutes, default 25" },
          scheduled: { type: "boolean", description: "Whether to add to today's schedule" },
          project: { type: "string", description: "Project name to associate with" },
          dueDate: { type: "string", description: "Due date in ISO format (YYYY-MM-DD)" },
        },
        required: ["title"],
      },
    },
    {
      name: "list_tasks",
      description: "Get the user's tasks. Can filter by active, completed, scheduled, or by project.",
      parameters: { type: "object", properties: {
        filter: { type: "string", enum: ["active", "completed", "scheduled", "all"], description: "Filter type, default active" },
        limit: { type: "number", description: "Max tasks to return, default 15" },
        project: { type: "string", description: "Filter by project name" },
      }},
    },
    {
      name: "update_task",
      description: "Update an existing task's properties (title, priority, description, estimatedMinutes, scheduled, project, dueDate)",
      parameters: { type: "object", properties: {
        query: { type: "string", description: "Search term to find the task by title" },
        title: { type: "string", description: "New title" },
        priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
        description: { type: "string" },
        estimatedMinutes: { type: "number" },
        scheduled: { type: "boolean" },
        project: { type: "string" },
        dueDate: { type: "string" },
      }, required: ["query"] },
    },
    {
      name: "complete_task",
      description: "Mark a task as completed by searching for it by name",
      parameters: { type: "object", properties: { query: { type: "string", description: "Search term to find the task" } }, required: ["query"] },
    },
    {
      name: "delete_task",
      description: "Delete a task by searching for it by name",
      parameters: { type: "object", properties: { query: { type: "string", description: "Search term to find the task" } }, required: ["query"] },
    },
    {
      name: "schedule_task",
      description: "Add a task to today's scheduled plan",
      parameters: { type: "object", properties: { query: { type: "string", description: "Search term to find the task" } }, required: ["query"] },
    },

    // ── Habits ──
    {
      name: "add_habit",
      description: "Create a new daily habit for the user",
      parameters: { type: "object", properties: { title: { type: "string" }, color: { type: "string", description: "Hex color, e.g. #6c5ce7" } }, required: ["title"] },
    },
    {
      name: "list_habits",
      description: "Get all of the user's habits with completion status",
      parameters: { type: "object", properties: {} },
    },
    {
      name: "delete_habit",
      description: "Delete a habit by searching for it by name",
      parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    },

    // ── Journal ──
    {
      name: "add_journal_entry",
      description: "Create a new journal entry",
      parameters: { type: "object", properties: { title: { type: "string" }, content: { type: "string" }, mood: { type: "string", description: "happy, sad, neutral, productive, anxious, calm, excited" } }, required: ["title"] },
    },
    {
      name: "list_journal_entries",
      description: "Get recent journal entries",
      parameters: { type: "object", properties: { limit: { type: "number", description: "Max entries, default 5" } } },
    },

    // ── Projects ──
    {
      name: "add_project",
      description: "Create a new project",
      parameters: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, status: { type: "string", enum: ["planning", "active", "completed"] } }, required: ["name"] },
    },
    {
      name: "list_projects",
      description: "Get the user's projects",
      parameters: { type: "object", properties: {} },
    },
    {
      name: "update_project",
      description: "Update a project's name, description, or status",
      parameters: { type: "object", properties: {
        query: { type: "string", description: "Search by project name" },
        name: { type: "string" },
        description: { type: "string" },
        status: { type: "string", enum: ["planning", "active", "completed"] },
      }, required: ["query"] },
    },
    {
      name: "delete_project",
      description: "Delete a project by name",
      parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    },

    // ── Finance ──
    {
      name: "log_finance",
      description: "Log an income or expense transaction",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number" },
          type: { type: "string", enum: ["income", "expense"] },
          category: { type: "string", description: "Category: food, rent, freelance, salary, entertainment, etc." },
          description: { type: "string" },
        },
        required: ["amount", "type"],
      },
    },
    {
      name: "get_finance_summary",
      description: "Get the user's financial summary with total income, expenses, balance, and recent transactions",
      parameters: { type: "object", properties: {} },
    },

    // ── Library ──
    {
      name: "add_library_resource",
      description: "Save a resource to the library",
      parameters: { type: "object", properties: { title: { type: "string" }, url: { type: "string" }, type: { type: "string", enum: ["article", "video", "pdf", "book"] } }, required: ["title"] },
    },
    {
      name: "update_library_resource",
      description: "Update a library resource's status (unread, reading, completed)",
      parameters: { type: "object", properties: {
        query: { type: "string", description: "Search by title" },
        status: { type: "string", enum: ["unread", "reading", "completed"] },
      }, required: ["query", "status"] },
    },
    {
      name: "list_library",
      description: "Get saved library resources",
      parameters: { type: "object", properties: {} },
    },

    // ── Flashcards ──
    {
      name: "add_flashcard_deck",
      description: "Create a new flashcard deck",
      parameters: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } }, required: ["title"] },
    },
    {
      name: "add_card_to_deck",
      description: "Add a flashcard (front/back) to an existing deck",
      parameters: { type: "object", properties: {
        deckQuery: { type: "string", description: "Search deck by title" },
        front: { type: "string", description: "Front side of the flashcard (question)" },
        back: { type: "string", description: "Back side of the flashcard (answer)" },
      }, required: ["deckQuery", "front", "back"] },
    },
    {
      name: "list_flashcard_decks",
      description: "Get the user's flashcard decks with card counts",
      parameters: { type: "object", properties: {} },
    },

    // ── Dashboard ──
    {
      name: "get_dashboard_summary",
      description: "Get a full productivity dashboard summary — task counts, habit status, journal entries, project count, financial balance, streaks",
      parameters: { type: "object", properties: {} },
    },
  ],
}];

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCTION EXECUTORS
// ═══════════════════════════════════════════════════════════════════════════════
async function executeFunctionCall(name, args, userId) {
  let action = null;

  switch (name) {
    // ───────────── TASKS ─────────────
    case "add_task": {
      const task = new Task({
        title: args.title,
        description: args.description || "",
        priority: args.priority || "medium",
        estimatedMinutes: args.estimatedMinutes || 25,
        scheduled: args.scheduled || false,
        project: args.project,
        dueDate: args.dueDate ? new Date(args.dueDate) : undefined,
        owner: userId,
      });
      await task.save();
      action = "refetch_tasks";
      return { result: `Task "${args.title}" created [${args.priority || "medium"}].`, action };
    }

    case "list_tasks": {
      const filter = args.filter || "active";
      let query = { owner: userId };
      if (filter === "active") query.completed = false;
      else if (filter === "completed") query.completed = true;
      else if (filter === "scheduled") { query.completed = false; query.scheduled = true; }
      if (args.project) query.project = { $regex: args.project, $options: "i" };

      const tasks = await Task.find(query).sort({ createdAt: -1 }).limit(args.limit || 15);
      if (tasks.length === 0) return { result: `No ${filter} tasks found.` };
      const list = tasks.map((t, i) => `${i + 1}. "${t.title}" [${t.priority}] ${t.estimatedMinutes}min${t.scheduled ? " 📅" : ""}${t.completed ? " ✅" : ""}${t.project ? ` 📁${t.project}` : ""}`).join("\n");
      return { result: `${filter.charAt(0).toUpperCase() + filter.slice(1)} tasks (${tasks.length}):\n${list}` };
    }

    case "update_task": {
      const task = await Task.findOne({ owner: userId, title: { $regex: args.query, $options: "i" } });
      if (!task) return { result: `No task found matching "${args.query}".` };
      const updates = {};
      if (args.title) updates.title = args.title;
      if (args.priority) updates.priority = args.priority;
      if (args.description !== undefined) updates.description = args.description;
      if (args.estimatedMinutes) updates.estimatedMinutes = args.estimatedMinutes;
      if (args.scheduled !== undefined) updates.scheduled = args.scheduled;
      if (args.project) updates.project = args.project;
      if (args.dueDate) updates.dueDate = new Date(args.dueDate);
      Object.assign(task, updates);
      await task.save();
      action = "refetch_tasks";
      const changed = Object.keys(updates).join(", ");
      return { result: `Updated "${task.title}" — changed: ${changed}.`, action };
    }

    case "complete_task": {
      const task = await Task.findOne({ owner: userId, completed: false, title: { $regex: args.query, $options: "i" } });
      if (!task) return { result: `No active task found matching "${args.query}".` };
      task.completed = true;
      await task.save();
      action = "refetch_tasks";
      return { result: `Task "${task.title}" marked complete!`, action };
    }

    case "delete_task": {
      const task = await Task.findOne({ owner: userId, title: { $regex: args.query, $options: "i" } });
      if (!task) return { result: `No task found matching "${args.query}".` };
      await Task.deleteOne({ _id: task._id });
      action = "refetch_tasks";
      return { result: `Task "${task.title}" deleted.`, action };
    }

    case "schedule_task": {
      const task = await Task.findOne({ owner: userId, completed: false, title: { $regex: args.query, $options: "i" } });
      if (!task) return { result: `No active task found matching "${args.query}".` };
      task.scheduled = true;
      await task.save();
      action = "refetch_tasks";
      return { result: `Task "${task.title}" added to today's schedule.`, action };
    }

    // ───────────── HABITS ─────────────
    case "add_habit": {
      const colors = ["#6c5ce7", "#00b894", "#e17055", "#0984e3", "#fdcb6e", "#e84393", "#00cec9"];
      const habit = new Habit({ userId, title: args.title, color: args.color || colors[Math.floor(Math.random() * colors.length)] });
      await habit.save();
      action = "refetch_habits";
      return { result: `Habit "${args.title}" created!`, action };
    }

    case "list_habits": {
      const habits = await Habit.find({ userId }).sort({ createdAt: -1 });
      if (habits.length === 0) return { result: "No habits found." };
      const todayStr = new Date().toISOString().split("T")[0];
      const list = habits.map((h, i) => {
        const done = h.completedDates?.includes(todayStr);
        return `${i + 1}. "${h.title}" ${done ? "✅ done today" : "⬜ not yet"} (${h.completedDates?.length || 0} total)`;
      }).join("\n");
      return { result: `Your habits (${habits.length}):\n${list}` };
    }

    case "delete_habit": {
      const habit = await Habit.findOne({ userId, title: { $regex: args.query, $options: "i" } });
      if (!habit) return { result: `No habit found matching "${args.query}".` };
      await Habit.deleteOne({ _id: habit._id });
      action = "refetch_habits";
      return { result: `Habit "${habit.title}" removed.`, action };
    }

    // ───────────── JOURNAL ─────────────
    case "add_journal_entry": {
      const entry = new Journal({ userId, title: args.title, content: args.content || "", mood: args.mood || "neutral" });
      await entry.save();
      return { result: `Journal entry "${args.title}" saved.` };
    }

    case "list_journal_entries": {
      const entries = await Journal.find({ userId }).sort({ createdAt: -1 }).limit(args.limit || 5);
      if (entries.length === 0) return { result: "No journal entries found." };
      const list = entries.map((e, i) => `${i + 1}. "${e.title}" [${e.mood}] — ${new Date(e.createdAt).toLocaleDateString()}${e.content ? `\n     ${e.content.slice(0, 80)}...` : ""}`).join("\n");
      return { result: `Recent entries:\n${list}` };
    }

    // ───────────── PROJECTS ─────────────
    case "add_project": {
      const project = new Project({ userId, name: args.name, description: args.description, status: args.status || "planning" });
      await project.save();
      return { result: `Project "${args.name}" created [${args.status || "planning"}].` };
    }

    case "list_projects": {
      const projects = await Project.find({ userId }).sort({ createdAt: -1 });
      if (projects.length === 0) return { result: "No projects found." };
      const list = projects.map((p, i) => `${i + 1}. "${p.name}" [${p.status}]${p.description ? ` — ${p.description.slice(0, 60)}` : ""}`).join("\n");
      return { result: `Your projects (${projects.length}):\n${list}` };
    }

    case "update_project": {
      const project = await Project.findOne({ userId, name: { $regex: args.query, $options: "i" } });
      if (!project) return { result: `No project found matching "${args.query}".` };
      if (args.name) project.name = args.name;
      if (args.description) project.description = args.description;
      if (args.status) project.status = args.status;
      await project.save();
      return { result: `Project "${project.name}" updated.` };
    }

    case "delete_project": {
      const project = await Project.findOne({ userId, name: { $regex: args.query, $options: "i" } });
      if (!project) return { result: `No project found matching "${args.query}".` };
      await Project.deleteOne({ _id: project._id });
      return { result: `Project "${project.name}" deleted.` };
    }

    // ───────────── FINANCE ─────────────
    case "log_finance": {
      const record = new Finance({ userId, amount: args.amount, type: args.type, category: args.category || "General", description: args.description || "" });
      await record.save();
      return { result: `${args.type === "income" ? "Income" : "Expense"} of $${args.amount.toFixed(2)} logged [${args.category || "General"}].` };
    }

    case "get_finance_summary": {
      const records = await Finance.find({ userId }).sort({ createdAt: -1 });
      const income = records.filter(r => r.type === "income").reduce((s, r) => s + r.amount, 0);
      const expense = records.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0);
      let result = `Income: $${income.toFixed(2)} | Expenses: $${expense.toFixed(2)} | Balance: $${(income - expense).toFixed(2)}`;
      if (records.length > 0) {
        result += "\n\nRecent:\n" + records.slice(0, 8).map((r, i) => `${i + 1}. ${r.type === "income" ? "+" : "-"}$${r.amount.toFixed(2)} [${r.category}] ${r.description || ""}`).join("\n");
      }
      return { result };
    }

    // ───────────── LIBRARY ─────────────
    case "add_library_resource": {
      const item = new Library({ userId, title: args.title, url: args.url || "", type: args.type || "article" });
      await item.save();
      return { result: `Resource "${args.title}" saved to library.` };
    }

    case "update_library_resource": {
      const item = await Library.findOne({ userId, title: { $regex: args.query, $options: "i" } });
      if (!item) return { result: `No resource found matching "${args.query}".` };
      item.status = args.status;
      await item.save();
      return { result: `"${item.title}" marked as ${args.status}.` };
    }

    case "list_library": {
      const items = await Library.find({ userId }).sort({ createdAt: -1 }).limit(15);
      if (items.length === 0) return { result: "Library is empty." };
      const list = items.map((l, i) => `${i + 1}. "${l.title}" [${l.type}] — ${l.status}${l.url ? ` 🔗` : ""}`).join("\n");
      return { result: `Your library:\n${list}` };
    }

    // ───────────── FLASHCARDS ─────────────
    case "add_flashcard_deck": {
      const deck = new Flashcard({ userId, title: args.title, description: args.description || "", cards: [] });
      await deck.save();
      return { result: `Deck "${args.title}" created.` };
    }

    case "add_card_to_deck": {
      const deck = await Flashcard.findOne({ userId, title: { $regex: args.deckQuery, $options: "i" } });
      if (!deck) return { result: `No deck found matching "${args.deckQuery}".` };
      deck.cards.push({ front: args.front, back: args.back });
      await deck.save();
      return { result: `Card added to "${deck.title}" (now ${deck.cards.length} cards).` };
    }

    case "list_flashcard_decks": {
      const decks = await Flashcard.find({ userId }).sort({ createdAt: -1 });
      if (decks.length === 0) return { result: "No decks found." };
      const list = decks.map((d, i) => `${i + 1}. "${d.title}" (${d.cards?.length || 0} cards)`).join("\n");
      return { result: `Your decks (${decks.length}):\n${list}` };
    }

    // ───────────── DASHBOARD ─────────────
    case "get_dashboard_summary": {
      const [activeTasks, completedTasks, habits, journalCount, projectCount, finances] = await Promise.all([
        Task.countDocuments({ owner: userId, completed: false }),
        Task.countDocuments({ owner: userId, completed: true }),
        Habit.countDocuments({ userId }),
        Journal.countDocuments({ userId }),
        Project.countDocuments({ userId }),
        Finance.find({ userId }),
      ]);
      const income = finances.filter(r => r.type === "income").reduce((s, r) => s + r.amount, 0);
      const expense = finances.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0);
      return {
        result: `Dashboard:\n• Active Tasks: ${activeTasks}\n• Completed Tasks: ${completedTasks}\n• Habits: ${habits}\n• Journal Entries: ${journalCount}\n• Projects: ${projectCount}\n• Balance: $${(income - expense).toFixed(2)}`,
      };
    }

    default:
      return { result: "Unknown function." };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSISTENT MEMORY — load/save from MongoDB
// ═══════════════════════════════════════════════════════════════════════════════
async function loadMemory(userId) {
  let memory = await AgentMemory.findOne({ userId });
  if (!memory) {
    memory = new AgentMemory({ userId, history: [] });
    await memory.save();
  }
  return memory;
}

async function saveToMemory(userId, role, text) {
  let memory = await AgentMemory.findOne({ userId });
  if (!memory) memory = new AgentMemory({ userId, history: [] });
  await memory.addMessage(role, text);
}

// ═══════════════════════════════════════════════════════════════════════════════
// GEMINI CALLER WITH MODEL FALLBACK
// ═══════════════════════════════════════════════════════════════════════════════
const MODEL_CHAIN = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

async function tryGemini(message, userId, user) {
  // Load persistent history from DB
  const memory = await loadMemory(userId);
  const history = memory.history.map(h => ({ role: h.role, parts: [{ text: h.text }] }));

  // Build live context from all database collections
  const userContext = await buildUserContext(userId, user);
  const systemPrompt = buildSystemPrompt(userContext);

  for (const modelName of MODEL_CHAIN) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        tools,
      });

      const chat = model.startChat({ history });
      let response = await chat.sendMessage(message);
      let aggregatedAction = null;

      let maxLoops = 5;
      while (response.response.candidates?.[0]?.content?.parts?.some(p => p.functionCall) && maxLoops-- > 0) {
        const functionCallParts = response.response.candidates[0].content.parts.filter(p => p.functionCall);

        const functionResponses = [];
        for (const part of functionCallParts) {
          const { name, args } = part.functionCall;
          console.log(`[Kora/${modelName}] ${name}(${JSON.stringify(args)})`);

          const result = await executeFunctionCall(name, args || {}, userId);
          if (result.action) aggregatedAction = result.action;

          functionResponses.push({
            functionResponse: { name, response: { result: result.result } },
          });
        }

        response = await chat.sendMessage(functionResponses);
      }

      const reply = response.response.text();
      return { reply, action: aggregatedAction };
    } catch (err) {
      const is429 = err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("Too Many Requests");
      console.warn(`[Kora] ${modelName} failed: ${is429 ? "rate-limited" : err.message}`);
      if (!is429) throw err;
    }
  }

  throw new Error("RATE_LIMITED");
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
export const handleAgentMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId).lean();

    if (!message || !message.trim()) {
      return res.json({ success: true, reply: "Hey! I'm here whenever you need me 💛" });
    }

    // Save user message to persistent memory
    await saveToMemory(userId, "user", message);

    // Call Gemini with full context
    const { reply, action } = await tryGemini(message, userId, user);

    // Save agent reply to persistent memory
    await saveToMemory(userId, "model", reply);

    return res.json({ success: true, reply, action });
  } catch (error) {
    console.error("Agent error:", error);

    if (error.message === "RATE_LIMITED") {
      return res.json({
        success: true,
        reply: "I'm getting a bit overwhelmed with requests right now 😅 The Gemini API rate limit has been hit. Give me about **30 seconds** and try again 💛",
      });
    }

    const msg = error.message || "";
    if (msg.includes("API_KEY") || msg.includes("API key")) {
      return res.json({ success: true, reply: "There's an issue with my API key. Check **GEMINI_API_KEY** in `.env` 🔑" });
    }

    return res.status(500).json({
      success: false,
      reply: `Something went wrong: *${msg.slice(0, 150)}*\n\nMind trying again? 🙏`,
    });
  }
};

// ── Clear memory endpoint ────────────────────────────────────────────────────
export const clearAgentMemory = async (req, res) => {
  try {
    const userId = req.user._id;
    await AgentMemory.findOneAndUpdate({ userId }, { history: [] });
    return res.json({ success: true, message: "Memory cleared" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULE EXTRACTION — parse uploaded schedules into structured data
// ═══════════════════════════════════════════════════════════════════════════════
export const handleScheduleExtract = async (req, res) => {
  try {
    const { fileContent, fileType, fileName, textContent } = req.body;
    const userId = req.user._id;

    const SCHEDULE_PROMPT = `You are a college schedule parser. Analyze the provided content (it may be an image of a timetable, a text schedule, or any format) and extract a structured weekly schedule.

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "weeklySchedule": {
    "Monday": [
      { "time": "09:00", "endTime": "10:00", "subject": "Mathematics", "type": "class", "room": "A101", "professor": "Dr. Smith" },
      { "time": "10:00", "endTime": "10:15", "subject": "Break", "type": "gap" },
      { "time": "13:00", "endTime": "14:00", "subject": "Lunch Break", "type": "lunch" }
    ],
    "Tuesday": [...],
    "Wednesday": [...],
    "Thursday": [...],
    "Friday": [...],
    "Saturday": [...]
  },
  "summary": "Brief summary of the schedule - total classes per week, busiest day, etc."
}

RULES:
- Extract ALL classes/lectures/labs/tutorials from the content
- For each class include: time (24h format HH:MM), endTime, subject name, type (class/lab/tutorial/seminar), room/location if available, professor if available
- Identify GAPS between classes (15+ min gaps) and mark them as type "gap"
- Add a "lunch" type entry if there's a gap between 12:00-14:00 (suggest 13:00-14:00 if not explicit)
- If a day has no classes, include it with an empty array
- Sort each day's entries by time
- If you can't parse the content, return { "error": "Could not parse the schedule. Please try a clearer image or text format." }`;

    let parts = [{ text: SCHEDULE_PROMPT }];

    // If file content is provided (base64 image)
    if (fileContent && fileType) {
      parts.push({
        inlineData: {
          mimeType: fileType,
          data: fileContent,
        },
      });
    }

    // If text content is provided
    if (textContent) {
      parts.push({ text: `\n\nSchedule content:\n${textContent}` });
    }

    // Try models in order
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
    let result = null;

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const response = await model.generateContent(parts);
        result = response.response.text();
        break;
      } catch (err) {
        const is429 = err.message?.includes("429") || err.message?.includes("quota");
        if (!is429) throw err;
        console.warn(`[Schedule] ${modelName} rate-limited, trying next...`);
      }
    }

    if (!result) {
      return res.json({ success: false, error: "All models are rate-limited. Try again in 30 seconds." });
    }

    // Clean the response — remove markdown code blocks if any
    let cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.error) {
        return res.json({ success: false, error: parsed.error });
      }

      // ── PERSIST THE SCHEDULE ──
      await CollegeSchedule.findOneAndUpdate(
        { userId },
        { weeklySchedule: parsed.weeklySchedule, summary: parsed.summary },
        { upsert: true, new: true }
      );

      return res.json({ success: true, schedule: parsed });
    } catch (err) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // ── PERSIST THE SCHEDULE ──
          await CollegeSchedule.findOneAndUpdate(
            { userId },
            { weeklySchedule: parsed.weeklySchedule, summary: parsed.summary },
            { upsert: true, new: true }
          );

          return res.json({ success: true, schedule: parsed });
        } catch {
          return res.json({ success: false, error: "Could not parse the extracted schedule. Try a clearer image." });
        }
      }
      return res.json({ success: false, error: "Could not parse the response. Please try again." });
    }
  } catch (error) {
    console.error("Schedule extraction error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// KORA PAGE CHAT — dedicated chat with session management (history)
// ═══════════════════════════════════════════════════════════════════════════════
export const handleKoraChat = async (req, res) => {
  try {
    const { message, fileContent, fileType, context } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId).lean();

    if (!message?.trim()) {
      return res.json({ success: true, reply: "Hey! What can I help you with? 💛" });
    }

    let conversation = await KoraConversation.findOne({ userId });

    if (!conversation) {
      conversation = new KoraConversation({ userId, messages: [], title: "Main Session" });
    }

    // Add user message to session
    const userMsg = { role: "user", text: message };
    if (fileContent && fileType) {
      userMsg.file = { name: "Attachment", type: fileType };
    }
    conversation.messages.push(userMsg);
    conversation.lastMessage = message.slice(0, 100);
    await conversation.save();

    // Context for AI
    const history = conversation.messages.slice(-20).map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    const userContext = await buildUserContext(userId, user);
    const systemPrompt = buildSystemPrompt(userContext) + `\n\nADDITIONAL CONTEXT FOR THIS PAGE:
You are on your DEDICATED page — the Kora Hub. This is a persistent chat session.
${context ? `\nUser's uploaded schedule context:\n${context}` : ""}
Be extra helpful. Use tools when needed.`;

    let parts = [{ text: message }];
    if (fileContent && fileType) {
      parts.push({ inlineData: { mimeType: fileType, data: fileContent } });
    }

    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    let reply = null;
    let action = null;

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          tools,
        });

        const chat = model.startChat({ history: history.slice(0, -1) }); // don't include current message in history for startChat
        let response = await chat.sendMessage(parts);

        let maxLoops = 5;
        while (response.response.candidates?.[0]?.content?.parts?.some(p => p.functionCall) && maxLoops-- > 0) {
          const functionCallParts = response.response.candidates[0].content.parts.filter(p => p.functionCall);
          const functionResponses = [];
          for (const part of functionCallParts) {
            const { name, args } = part.functionCall;
            const result = await executeFunctionCall(name, args || {}, userId);
            if (result.action) action = result.action;
            functionResponses.push({ functionResponse: { name, response: { result: result.result } } });
          }
          response = await chat.sendMessage(functionResponses);
        }

        reply = response.response.text();
        break;
      } catch (err) {
        if (!err.message?.includes("429") && !err.message?.includes("quota")) throw err;
      }
    }

    if (!reply) reply = "I'm a bit busy right now. Try again in a minute? 💛";

    // Save AI response
    conversation.messages.push({ role: "model", text: reply });
    
    // Auto-generate title if it's the first exchange
    if (conversation.messages.length <= 2 && conversation.title === "New Chat") {
      try {
        const titleModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const titleRes = await titleModel.generateContent(`Generate a very short (2-4 words) title for this conversation based on this message: "${message}". Return only text, no quotes.`);
        const title = titleRes.response.text().trim().replace(/["']/g, "");
        if (title) conversation.title = title;
      } catch (e) {
        console.error("Title generation failed", e);
      }
    }

    await conversation.save();

    return res.json({ 
      success: true, 
      reply, 
      action, 
      conversationId: conversation._id,
      title: conversation.title 
    });
  } catch (error) {
    console.error("Kora chat error:", error);
    return res.status(500).json({ success: false, reply: `Something went wrong: ${error.message?.slice(0, 100)}` });
  }
};

// ── Conversation Management ──────────────────────────────────────────────────
export const getKoraHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversation = await KoraConversation.findOne({ userId });
    return res.json({ success: true, conversation });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const clearKoraHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    await KoraConversation.deleteMany({ userId });
    return res.json({ success: true, message: "Chat reset successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get schedule endpoint ────────────────────────────────────────────────────
export const getCollegeSchedule = async (req, res) => {
  try {
    const userId = req.user._id;
    const schedule = await CollegeSchedule.findOne({ userId }).lean();
    return res.json({ success: true, schedule });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


