import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getDailyAnalytics, getInsights, getWeeklyAnalytics } from "../controllers/analyticsController.js";
import { sendNightlySummaryToUser } from "../utils/nightlySummary.js";

const analyticsRouter = express.Router();

analyticsRouter.get("/daily", authMiddleware, getDailyAnalytics);
analyticsRouter.get("/weekly", authMiddleware, getWeeklyAnalytics);
analyticsRouter.get("/insights", authMiddleware, getInsights);

// Manual test trigger — sends email ONLY to the logged-in user
analyticsRouter.get("/test-nightly-email", authMiddleware, async (req, res) => {
    try {
        await sendNightlySummaryToUser(req.user._id);
        res.json({ success: true, message: "Nightly email sent to your registered email!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default analyticsRouter;

