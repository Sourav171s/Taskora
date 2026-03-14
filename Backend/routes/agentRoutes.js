import express from "express";
import { 
  handleAgentMessage, 
  clearAgentMemory, 
  handleScheduleExtract, 
  handleKoraChat, 
  getCollegeSchedule,
  getKoraHistory,
  clearKoraHistory
} from "../controllers/agentController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth);
router.post("/", handleAgentMessage);
router.post("/kora", handleKoraChat);
router.get("/kora/history", getKoraHistory);
router.delete("/kora/history", clearKoraHistory);
router.post("/schedule", handleScheduleExtract);
router.get("/schedule", getCollegeSchedule);
router.delete("/memory", clearAgentMemory);

export default router;
