import express from "express";
import { getJournals, createJournal, updateJournal, deleteJournal } from "../controllers/journalController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

router.route("/").get(getJournals).post(createJournal);
router.route("/:id").put(updateJournal).delete(deleteJournal);

export default router;
