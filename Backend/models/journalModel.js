import mongoose from "mongoose";

const journalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String, default: "" },
  mood: { type: String, default: "neutral" },
}, { timestamps: true });

export default mongoose.model("Journal", journalSchema);
