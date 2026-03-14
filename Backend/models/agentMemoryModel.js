import mongoose from "mongoose";

const agentMemorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  history: [{
    role: { type: String, enum: ["user", "model"], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

// Keep max 50 messages per user
agentMemorySchema.methods.addMessage = function(role, text) {
  this.history.push({ role, text, timestamp: new Date() });
  if (this.history.length > 50) {
    this.history = this.history.slice(-50);
  }
  return this.save();
};

export default mongoose.model("AgentMemory", agentMemorySchema);
