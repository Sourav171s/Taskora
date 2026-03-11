import express from "express";
import { getLibrary, createLibrary, updateLibrary, deleteLibrary } from "../controllers/libraryController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

router.route("/").get(getLibrary).post(createLibrary);
router.route("/:id").put(updateLibrary).delete(deleteLibrary);

export default router;
