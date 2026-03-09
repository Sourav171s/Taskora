import User from "../models/userModel.js";
import validator from 'validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRES = '24h';

const createToken = (userId) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });

// ── Avatar upload setup ──────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'), false);
};

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
}).single('avatar');

// ── Register ─────────────────────────────────────────────────────────────────
export async function registerUser(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ success: false, message: "Invalid Email" });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be atleast 8 characters" });
  }

  try {
    if (await User.findOne({ email })) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    const token = createToken(user._id);

    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// ── Login ────────────────────────────────────────────────────────────────────
export async function loginUser(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const token = createToken(user._id);
    res.json({
      success: true, token, user: {
        id: user._id, name: user.name, email: user.email, avatar: user.avatar,
        age: user.age, gender: user.gender, bio: user.bio, phone: user.phone,
        location: user.location, occupation: user.occupation, dateOfBirth: user.dateOfBirth,
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// ── Get Current User ─────────────────────────────────────────────────────────
export async function getCurrentUser(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true, user: {
        id: user._id, name: user.name, email: user.email, avatar: user.avatar,
        age: user.age, gender: user.gender, bio: user.bio, phone: user.phone,
        location: user.location, occupation: user.occupation, dateOfBirth: user.dateOfBirth,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// ── Update Profile ───────────────────────────────────────────────────────────
export async function updateProfile(req, res) {
  const { name, email, age, gender, bio, phone, location, occupation, dateOfBirth } = req.body;
  if (!name || !email || !validator.isEmail(email)) {
    return res.status(400).json({ success: false, message: "Valid name and email required" });
  }

  try {
    const exists = await User.findOne({ email, _id: { $ne: req.user.id } });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email already in use by another account." });
    }

    const updates = { name, email };
    if (age !== undefined) updates.age = age;
    if (gender !== undefined) updates.gender = gender;
    if (bio !== undefined) updates.bio = bio;
    if (phone !== undefined) updates.phone = phone;
    if (location !== undefined) updates.location = location;
    if (occupation !== undefined) updates.occupation = occupation;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true, select: "-password" }
    );
    res.json({
      success: true, user: {
        id: user._id, name: user.name, email: user.email, avatar: user.avatar,
        age: user.age, gender: user.gender, bio: user.bio, phone: user.phone,
        location: user.location, occupation: user.occupation, dateOfBirth: user.dateOfBirth,
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// ── Upload/Update Avatar ─────────────────────────────────────────────────────
export async function updateAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    // Delete old avatar file if it exists
    const user = await User.findById(req.user.id);
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarUrl;
    await user.save();

    res.json({ success: true, avatar: avatarUrl });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// ── Change Password ──────────────────────────────────────────────────────────
export async function updatePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ success: false, message: "Password invalid or too short" });
  }

  try {
    const user = await User.findById(req.user.id).select("password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Current password incorrect" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: "Password changed" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
