import express from "express";
import { getFlashcards, createFlashcard, updateFlashcard, deleteFlashcard } from "../controllers/flashcardController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

router.route("/").get(getFlashcards).post(createFlashcard);
router.route("/:id").put(updateFlashcard).delete(deleteFlashcard);

export default router;
