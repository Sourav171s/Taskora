import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
    default: null,
  },
  googleId: {
    type: String,
    default: null,
  },
  avatar: {
    type: String,
    default: null,
  },
  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },
  // ── New profile fields ──
  age: {
    type: Number,
    default: null,
  },
  gender: {
    type: String,
    enum: ["male", "female", "non-binary", "prefer-not-to-say", null],
    default: null,
  },
  bio: {
    type: String,
    default: "",
    maxlength: 200,
  },
  phone: {
    type: String,
    default: "",
  },
  location: {
    type: String,
    default: "",
  },
  occupation: {
    type: String,
    default: "",
  },
  dateOfBirth: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;