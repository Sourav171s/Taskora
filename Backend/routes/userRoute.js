import express from 'express';
import passport from 'passport';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  updatePassword,
  updateProfile,
  updateAvatar,
  uploadAvatar,
} from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';
import { createToken } from '../config/passport.js';

const userRouter = express.Router();

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────
userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);

// ─── GOOGLE OAUTH ─────────────────────────────────────────────────────────────
userRouter.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

userRouter.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:5173?error=google_failed' }),
  (req, res) => {
    const token = createToken(req.user._id);
    res.redirect(`http://localhost:5173?token=${token}`);
  }
);

// ─── PRIVATE ROUTES ───────────────────────────────────────────────────────────
userRouter.get('/me', authMiddleware, getCurrentUser);
userRouter.put('/profile', authMiddleware, updateProfile);
userRouter.put('/password', authMiddleware, updatePassword);
userRouter.post('/avatar', authMiddleware, uploadAvatar, updateAvatar);

export default userRouter;