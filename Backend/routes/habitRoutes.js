import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getHabits, createHabit, toggleHabit, deleteHabit } from "../controllers/habitController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getHabits);
router.post("/", createHabit);
router.post("/:id/toggle", toggleHabit);
router.delete("/:id", deleteHabit);

export default router;
