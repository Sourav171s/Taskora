import express from 'express'
import cors from 'cors';
import 'dotenv/config'
import session from 'express-session';
import passport from 'passport';
import { connectDB } from './config/db.js';
import { setupPassport } from './config/passport.js';
import userRouter from './routes/userRoute.js'
import taskRouter from './routes/taskRoute.js';
import focusRouter from './routes/focusRoute.js';
import analyticsRouter from './routes/analyticsRoute.js';
import subscriptionRouter from './routes/subscriptionRoute.js';
import habitRouter from './routes/habitRoutes.js';
import journalRouter from './routes/journalRoutes.js';
import flashcardRouter from './routes/flashcardRoutes.js';
import projectRouter from './routes/projectRoutes.js';
import financeRouter from './routes/financeRoutes.js';
import libraryRouter from './routes/libraryRoutes.js';
import agentRouter from './routes/agentRoutes.js';
import paymentRouter from './routes/paymentRoutes.js';
import { scheduleNightlyEmail } from './utils/nightlySummary.js';

const app = express()
const port = process.env.PORT || 4000;

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4000',
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
}));

// ── SECURITY HEADERS ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
});

// ── BODY PARSERS ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── STATIC FILES (avatar uploads) ─────────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ── SESSION (required by Passport even when we use JWT) ───────────────────────
app.use(session({
    secret: process.env.JWT_SECRET || 'session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
    },
}));

// ── PASSPORT ──────────────────────────────────────────────────────────────────
await setupPassport();
app.use(passport.initialize());
app.use(passport.session());

// ── DB ────────────────────────────────────────────────────────────────────────
await connectDB();

// ── CRON JOBS ─────────────────────────────────────────────────────────────────
scheduleNightlyEmail();

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.use("/api/user", userRouter)
app.use("/api/tasks", taskRouter)
app.use("/api/focus", focusRouter)
app.use("/api/analytics", analyticsRouter)
app.use("/api/subscription", subscriptionRouter);
app.use("/api/habits", habitRouter);
app.use("/api/journal", journalRouter);
app.use("/api/flashcards", flashcardRouter);
app.use("/api/projects", projectRouter);
app.use("/api/finance", financeRouter);
app.use("/api/library", libraryRouter);
app.use("/api/agent", agentRouter);
app.use("/api/payment", paymentRouter);

app.get('/', (req, res) => {
    res.json({ message: 'Taskora API working ✅', version: '1.0.0' });
})

app.use((req, res, next) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
    console.error("Internal Error:", err);
    res.status(err.status || 500).json({ success: false, message: err.message || "Internal Server Error" });
});

app.listen(port, () => {
    console.log(`Server Started on http://localhost:${port}`)
})