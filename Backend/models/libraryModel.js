import mongoose from "mongoose";

const librarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  url: { type: String },
  type: { type: String, enum: ["article", "video", "pdf", "book"], default: "article" },
  status: { type: String, enum: ["unread", "reading", "completed"], default: "unread" },
  tags: [String]
}, { timestamps: true });

export default mongoose.model("Library", librarySchema);
