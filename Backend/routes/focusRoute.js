import express from "express";
import authMiddleware from "../middleware/auth.js";
import { createFocusSession, getFocusSessions, getWeeklyFocus } from "../controllers/focusController.js";

const focusRouter = express.Router();

focusRouter.post("/session", authMiddleware, createFocusSession);
focusRouter.get("/sessions", authMiddleware, getFocusSessions);
focusRouter.get("/weekly", authMiddleware, getWeeklyFocus);

export default focusRouter;

