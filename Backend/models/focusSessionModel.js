import mongoose from "mongoose";

const focusSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      index: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null },
    // Duration in minutes (stored explicitly for fast analytics)
    duration: { type: Number, required: true, min: 0 },
    interruptions: { type: Number, default: 0, min: 0 },
    focusScore: { type: Number, default: null, min: 0, max: 100 },
    sessionType: { type: String, default: "focus", trim: true },
    // Normalized day bucket (00:00:00 local time) for grouping
    date: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// Helpful compound indexes for common queries
focusSessionSchema.index({ userId: 1, date: -1 });
focusSessionSchema.index({ userId: 1, startTime: -1 });

const FocusSession =
  mongoose.models.FocusSession ||
  mongoose.model("FocusSession", focusSessionSchema);

export default FocusSession;
