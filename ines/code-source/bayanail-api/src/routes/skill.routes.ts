import { Router } from "express";
import { 
  getSkills, 
  getStudentProgress, 
  addLessonSkills 
} from "../controllers/skill.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../lib/auth/guards.js";

const router = Router();

router.use(authenticate);

router.get("/", getSkills);
router.get("/students/:id/progress", getStudentProgress);
router.post("/lessons/:id/skills", requireRole(["ADMIN", "INSTRUCTOR"]), addLessonSkills);

export default router;

