import { Router } from "express";
import { getCalendarEvents } from "../controllers/calendar.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/events", getCalendarEvents);
router.get("/", getCalendarEvents); // Alias pour compatibilité

export default router;

