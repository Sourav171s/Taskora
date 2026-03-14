import mongoose from "mongoose";

const koraMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "model"], required: true },
  text: { type: String, required: true },
  file: {
    name: String,
    type: String,
    url: String,
  }
}, { timestamps: true });

const koraConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "New Chat" },
  messages: [koraMessageSchema],
  lastMessage: { type: String, default: "" },
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });

// Index for faster lookups
koraConversationSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model("KoraConversation", koraConversationSchema);
