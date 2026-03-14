import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getSubscription, upsertSubscription } from "../controllers/subscriptionController.js";

const subscriptionRouter = express.Router();

subscriptionRouter.get("/", authMiddleware, getSubscription);
subscriptionRouter.post("/", authMiddleware, upsertSubscription);

export default subscriptionRouter;

