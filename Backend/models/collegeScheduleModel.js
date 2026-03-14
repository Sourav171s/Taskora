import mongoose from "mongoose";

const scheduleEntrySchema = new mongoose.Schema({
  time: { type: String, required: true },
  endTime: { type: String, required: true },
  subject: { type: String, required: true },
  type: { type: String, enum: ["class", "lab", "tutorial", "seminar", "gap", "lunch"], default: "class" },
  room: { type: String, default: "" },
  professor: { type: String, default: "" },
}, { _id: false });

const collegeScheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  weeklySchedule: {
    Monday: [scheduleEntrySchema],
    Tuesday: [scheduleEntrySchema],
    Wednesday: [scheduleEntrySchema],
    Thursday: [scheduleEntrySchema],
    Friday: [scheduleEntrySchema],
    Saturday: [scheduleEntrySchema],
    Sunday: [scheduleEntrySchema],
  },
  summary: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("CollegeSchedule", collegeScheduleSchema);
