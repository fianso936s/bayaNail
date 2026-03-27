import { Router } from "express";
import { submitContact } from "../controllers/contact.controller.js";
import rateLimit from "express-rate-limit";

const router = Router();

// Specific rate limit for contact form to prevent spam
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 contact submissions per hour
  message: "Trop de messages envoyés. Veuillez réessayer plus tard.",
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", contactLimiter, submitContact);

export default router;

