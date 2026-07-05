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
  (req, res, next) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    passport.authenticate('google', { 
      session: false, 
      failureRedirect: `${frontendUrl}?error=google_failed` 
    })(req, res, next);
  },
  (req, res) => {
    const token = createToken(req.user._id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?token=${token}`);
  }
);

// ─── PRIVATE ROUTES ───────────────────────────────────────────────────────────
userRouter.get('/me', authMiddleware, getCurrentUser);
userRouter.put('/profile', authMiddleware, updateProfile);
userRouter.put('/password', authMiddleware, updatePassword);
userRouter.post('/avatar', authMiddleware, uploadAvatar, updateAvatar);

export default userRouter;