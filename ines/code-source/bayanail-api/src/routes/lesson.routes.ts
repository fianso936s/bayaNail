import { Router } from "express";
import { 
  getLessons, 
  createLesson, 
  updateLesson, 
  confirmLesson,
  cancelLesson,
  completeLesson 
} from "../controllers/lesson.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole, requireLessonAccess } from "../lib/auth/guards.js";

const router = Router();

router.use(authenticate);

router.get("/", getLessons);
router.post("/", requireRole(["ADMIN", "INSTRUCTOR"]), createLesson);

// Routes spécifiques à une leçon
router.patch("/:id", requireRole(["ADMIN", "INSTRUCTOR"]), requireLessonAccess(), updateLesson);
router.post("/:id/confirm", requireRole(["ADMIN", "INSTRUCTOR"]), requireLessonAccess(), confirmLesson);
router.post("/:id/cancel", requireLessonAccess(), cancelLesson); 
router.post("/:id/complete", requireRole(["INSTRUCTOR"]), requireLessonAccess(), completeLesson);

export default router;

