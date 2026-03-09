import passport from 'passport';
import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function setupPassport() {
  // Only set up Google OAuth if credentials are configured
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || clientID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
    console.log('[Passport] Google OAuth not configured — set GOOGLE_CLIENT_ID in .env to enable it.');
  } else {
    try {
      const { Strategy: GoogleStrategy } = await import('passport-google-oauth20');
      passport.use(
        new GoogleStrategy(
          {
            clientID,
            clientSecret,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/user/auth/google/callback',
          },
          async (accessToken, refreshToken, profile, done) => {
            try {
              const email = profile.emails?.[0]?.value;
              const name = profile.displayName;
              const avatar = profile.photos?.[0]?.value;
              const googleId = profile.id;

              let user = await User.findOne({ googleId });
              if (!user) {
                user = await User.findOne({ email });
                if (user) {
                  user.googleId = googleId;
                  user.avatar = avatar;
                  user.authProvider = 'google';
                  await user.save();
                } else {
                  user = await User.create({
                    name,
                    email,
                    googleId,
                    avatar,
                    authProvider: 'google',
                    password: null,
                  });
                }
              }
              return done(null, user);
            } catch (err) {
              return done(err, null);
            }
          }
        )
      );
      console.log('[Passport] Google OAuth strategy registered.');
    } catch (e) {
      console.warn('[Passport] Failed to load Google strategy:', e.message);
    }
  }

  passport.serializeUser((user, done) => done(null, user._id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (e) {
      done(e, null);
    }
  });
}

export function createToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}
