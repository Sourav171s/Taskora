You are improving an existing SaaS productivity dashboard design called **Taskora**.
Do NOT redesign the UI theme. Maintain the current **dark purple aesthetic, layout grid, typography, spacing, and card style**.

Your goal is to **refactor navigation, merge redundant pages, and introduce a few productivity features** while preserving the visual identity.

IMPORTANT RULES:

* Do not change the existing design language.
* Maintain current colors, shadows, typography, and card styling.
* Only adjust layout structure and add the requested features.
* Ensure the design remains minimal and productivity-focused.

---

1. NAVIGATION RESTRUCTURING

---

Current sidebar items include:
Dashboard
Focus Mode
Daily Planning
Tasks
Completed
Focus Insights
Heatmap
Profile

Refactor the sidebar to reduce clutter.

FINAL SIDEBAR SHOULD ONLY CONTAIN:

Dashboard
Focus Mode
Tasks
Focus Insights

Remove the following pages from sidebar navigation:

• Completed
• Heatmap
• Profile

These pages should be integrated elsewhere as described below.

---

2. MERGE COMPLETED PAGE INTO TASKS PAGE

---

Remove the separate **Completed page**.

Update the Tasks page to include tabs or filters:

Active
Completed

Completed tasks should appear inside the **Completed tab** of the Tasks page.

Ensure completed tasks visually show:
• completed checkmark
• slightly muted text
• completion timestamp
• optional focused time

Do not change table structure drastically.

---

3. MERGE HEATMAP INTO FOCUS INSIGHTS

---

Remove the separate **Heatmap page**.

Move the **Focus Activity Heatmap** into the **Focus Insights page**.

The Focus Insights page should now contain:

Top analytics cards:
• This Week Focus Time
• Current Streak
• Most Focused Task
• Average Session Length
• Deep Work Ratio
• Total Sessions

Analytics charts:
• Weekly Focus Trend
• Daily Focus Rhythm

Below those charts, add a section:

Focus Activity Heatmap

This heatmap should remain a GitHub-style yearly activity heatmap with hover tooltip showing:
• focus minutes
• full date

---

4. PROFILE PAGE RELOCATION

---

Remove Profile from sidebar.

Move profile access to the **top-right user avatar icon in the header**.

When the avatar is clicked, show a dropdown menu:

Profile
Settings
Logout

Selecting Profile opens the existing Profile page.

Do not remove profile page features.

---

5. DAILY FOCUS TARGET SYSTEM

---

Add a **Daily Focus Target widget** on the Dashboard.

Purpose: show user's daily deep work goal.

Example card:

Today's Focus Target

3h 24m / 5h goal

Add a horizontal progress bar below the numbers.

The progress bar should visually fill as focus sessions accumulate.

Design should match existing dashboard stat cards.

---

6. STREAK VISUAL FEEDBACK (LIGHT GAMIFICATION)

---

Improve the streak experience.

Enhance the **Streak card** on dashboard:

Display:

Current Streak: 12 days
Best Streak: 18 days

Add subtle visual feedback:

• flame icon
• soft glow effect around streak number
• small badge when streak increases

Keep the effect subtle and productivity-focused.

---

7. DARK MODE / LIGHT MODE TOGGLE

---

Add a theme toggle switch in the header near the user avatar.

The toggle should allow switching between:

Dark Mode (current theme)
Light Mode

Dark mode must remain identical to the current design.

Light mode should adapt:
• background becomes light neutral
• cards remain slightly elevated
• purple accent remains unchanged

Ensure typography contrast remains readable.

---

8. WEEKLY PLANNER (SUNDAY FEATURE)

---

Add a **Weekly Planner preview** on the Dashboard.

This section should appear especially useful on Sundays.

Card title:

Plan Next Week

Show:

• upcoming week's tasks
• estimated focus hours
• number of planned sessions

Add button:

Plan My Week

When clicked, it opens the existing **Daily Planning page** but allows planning for upcoming days.

Keep this planner visually consistent with existing dashboard cards.

---

## FINAL DESIGN GOAL

The application should feel like a **Deep Work Productivity Platform**, not just a task manager.

Focus on:
• minimal navigation
• action-driven dashboard
• integrated analytics
• clear focus on deep work tracking

Do NOT introduce unnecessary visual complexity.

Maintain the current Taskora aesthetic and layout structure.
