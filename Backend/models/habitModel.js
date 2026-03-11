import mongoose from "mongoose";

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  frequency: {
    type: String,
    enum: ["daily", "weekly", "weekdays"],
    default: "daily",
  },
  color: {
    type: String,
    default: "#8b5cf6",
  },
  completedDates: {
    type: [String], // Array of ISO date strings (YYYY-MM-DD)
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Habit = mongoose.model("Habit", habitSchema);
export default Habit;
