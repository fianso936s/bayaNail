import express, { Router } from "express";
import { createCheckoutSession, handleWebhook } from "../controllers/billing.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/checkout", authenticate, createCheckoutSession);

// Webhook needs raw body, so we'll handle it specially in index.ts or here
// But since we use express.json() globally, we might need a workaround for the webhook route
router.post("/webhook", handleWebhook);

export default router;

