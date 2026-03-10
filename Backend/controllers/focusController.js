import FocusSession from "../models/focusSessionModel.js";

function normalizeDateBucket(d) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDateOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function computeDurationMinutes({ startTime, endTime, duration }) {
  if (typeof duration === "number" && Number.isFinite(duration) && duration >= 0) {
    return Math.round(duration);
  }
  if (typeof duration === "string" && duration.trim() !== "" && !Number.isNaN(Number(duration))) {
    const n = Number(duration);
    if (Number.isFinite(n) && n >= 0) return Math.round(n);
  }
  if (startTime && endTime) {
    const ms = endTime.getTime() - startTime.getTime();
    if (!Number.isFinite(ms) || ms < 0) return null;
    return Math.round(ms / 60000);
  }
  return null;
}

export async function createFocusSession(req, res) {
  try {
    const {
      taskId = null,
      startTime,
      endTime = null,
      duration,
      interruptions = 0,
      focusScore = null,
      sessionType = "focus",
      date = null,
    } = req.body || {};

    const start = parseDateOrNull(startTime);
    const end = parseDateOrNull(endTime);

    if (!start) {
      return res
        .status(400)
        .json({ success: false, message: "startTime is required and must be a valid date" });
    }

    const durationMinutes = computeDurationMinutes({ startTime: start, endTime: end, duration });
    if (durationMinutes === null) {
      return res.status(400).json({
        success: false,
        message: "duration is required (minutes) or provide both startTime and endTime",
      });
    }

    const bucket = date ? normalizeDateBucket(date) : normalizeDateBucket(start);
    if (!bucket) {
      return res.status(400).json({ success: false, message: "date must be a valid date" });
    }

    const session = await FocusSession.create({
      userId: req.user.id,
      taskId: taskId || null,
      startTime: start,
      endTime: end,
      duration: durationMinutes,
      interruptions: Number(interruptions) || 0,
      focusScore: focusScore === null || focusScore === undefined || focusScore === "" ? null : Number(focusScore),
      sessionType,
      date: bucket,
    });

    return res.status(201).json({ success: true, session });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getFocusSessions(req, res) {
  try {
    const {
      from = null,
      to = null,
      taskId = null,
      sessionType = null,
      limit = "100",
      skip = "0",
    } = req.query || {};

    const q = { userId: req.user.id };

    const fromDate = from ? parseDateOrNull(from) : null;
    const toDate = to ? parseDateOrNull(to) : null;
    if (fromDate || toDate) {
      q.startTime = {};
      if (fromDate) q.startTime.$gte = fromDate;
      if (toDate) q.startTime.$lte = toDate;
    }

    if (taskId) q.taskId = taskId;
    if (sessionType) q.sessionType = sessionType;

    const lim = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
    const sk = Math.max(parseInt(skip, 10) || 0, 0);

    const sessions = await FocusSession.find(q)
      .sort({ startTime: -1 })
      .skip(sk)
      .limit(lim);

    return res.json({ success: true, sessions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getWeeklyFocus(req, res) {
  try {
    const now = new Date();
    const end = normalizeDateBucket(now);
    const start = new Date(end);
    start.setDate(start.getDate() - 6); // inclusive 7 days

    const rows = await FocusSession.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$date",
          totalMinutes: { $sum: "$duration" },
          sessions: { $sum: 1 },
          interruptions: { $sum: "$interruptions" },
          avgFocusScore: { $avg: "$focusScore" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days with zeros so the UI can render a stable chart
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
      });
    }

    return res.json({ success: true, range: { start, end }, days });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

