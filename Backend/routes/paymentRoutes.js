import express from "express";
import auth from "../middleware/auth.js";
import { createCheckoutSession } from "../controllers/paymentController.js";

const router = express.Router();

router.use(auth);
router.post("/create-checkout-session", createCheckoutSession);

export default router;
