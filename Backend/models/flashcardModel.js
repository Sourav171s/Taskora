import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String },
  cards: [{
    front: { type: String },
    back: { type: String },
    masteryLevel: { type: Number, default: 0 }
  }]
}, { timestamps: true });

export default mongoose.model("Flashcard", flashcardSchema);
