import FocusSession from "../models/focusSessionModel.js";

function normalizeDateBucket(d) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDateOrNull(value) {
  if (!value) return null;
  // Allow YYYY-MM-DD
  const d = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function getDailyAnalytics(req, res) {
  try {
    const day = req.query?.date ? parseDateOrNull(String(req.query.date)) : new Date();
    const bucket = normalizeDateBucket(day);
    if (!bucket) {
      return res.status(400).json({ success: false, message: "Invalid date" });
    }

    const next = new Date(bucket);
    next.setDate(next.getDate() + 1);

    const rows = await FocusSession.aggregate([
      {
        $match: {
          userId: req.user._id,
          startTime: { $gte: bucket, $lt: next },
        },
      },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: "$duration" },
          sessions: { $sum: 1 },
          interruptions: { $sum: "$interruptions" },
          avgFocusScore: { $avg: "$focusScore" },
          avgSessionMinutes: { $avg: "$duration" },
        },
      },
    ]);

    const agg = rows[0] || {
      totalMinutes: 0,
      sessions: 0,
      interruptions: 0,
      avgFocusScore: null,
      avgSessionMinutes: null,
    };

    return res.json({
      success: true,
      date: bucket.toISOString().slice(0, 10),
      analytics: {
        totalMinutes: agg.totalMinutes,
        sessions: agg.sessions,
        interruptions: agg.interruptions,
        avgFocusScore: agg.avgFocusScore,
        avgSessionMinutes: agg.avgSessionMinutes,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getWeeklyAnalytics(req, res) {
  try {
    const now = new Date();
    const end = normalizeDateBucket(now);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);

    const rows = await FocusSession.aggregate([
      { $match: { userId: req.user._id, date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: "$date",
          totalMinutes: { $sum: "$duration" },
          sessions: { $sum: 1 },
          interruptions: { $sum: "$interruptions" },
          avgFocusScore: { $avg: "$focusScore" },
          avgSessionMinutes: { $avg: "$duration" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const byKey = new Map(rows.map((r) => [new Date(r._id).toISOString().slice(0, 10), r]));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const r = byKey.get(key);
      days.push({
        date: key,
        totalMinutes: r?.totalMinutes ?? 0,
        sessions: r?.sessions ?? 0,
        interruptions: r?.interruptions ?? 0,
        avgFocusScore: r?.avgFocusScore ?? null,
        avgSessionMinutes: r?.avgSessionMinutes ?? null,
      });
    }

    const totalMinutes = days.reduce((s, d) => s + d.totalMinutes, 0);
    const totalSessions = days.reduce((s, d) => s + d.sessions, 0);
    const totalInterruptions = days.reduce((s, d) => s + d.interruptions, 0);
    const bestDay = [...days].sort((a, b) => b.totalMinutes - a.totalMinutes)[0] || null;

    return res.json({
      success: true,
      range: { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) },
      summary: {
        totalMinutes,
        totalSessions,
        totalInterruptions,
        bestDay: bestDay ? { date: bestDay.date, totalMinutes: bestDay.totalMinutes } : null,
      },
      days,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getInsights(req, res) {
  try {
    const now = new Date();
    const end = normalizeDateBucket(now);
    const start = new Date(end);
    start.setDate(start.getDate() - 29); // last 30 days

    const rows = await FocusSession.aggregate([
      { $match: { userId: req.user._id, date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: "$duration" },
          sessions: { $sum: 1 },
          interruptions: { $sum: "$interruptions" },
          avgFocusScore: { $avg: "$focusScore" },
          avgSessionMinutes: { $avg: "$duration" },
        },
      },
    ]);

    const agg = rows[0] || {
      totalMinutes: 0,
      sessions: 0,
      interruptions: 0,
      avgFocusScore: null,
      avgSessionMinutes: null,
    };

    // Most focused task in last 30 days (by total minutes)
    const topTaskRows = await FocusSession.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: start, $lte: end },
          taskId: { $ne: null },
        },
      },
      { $group: { _id: "$taskId", totalMinutes: { $sum: "$duration" }, sessions: { $sum: 1 } } },
      { $sort: { totalMinutes: -1 } },
      { $limit: 1 },
    ]);

    const topTask = topTaskRows[0]
      ? { taskId: String(topTaskRows[0]._id), totalMinutes: topTaskRows[0].totalMinutes, sessions: topTaskRows[0].sessions }
      : null;

    return res.json({
      success: true,
      range: { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) },
      insights: {
        totalMinutes: agg.totalMinutes,
        sessions: agg.sessions,
        interruptions: agg.interruptions,
        avgFocusScore: agg.avgFocusScore,
        avgSessionMinutes: agg.avgSessionMinutes,
        topTask,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

