import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ["planning", "active", "completed"], default: "planning" },
  dueDate: { type: Date }
}, { timestamps: true });

export default mongoose.model("Project", projectSchema);
