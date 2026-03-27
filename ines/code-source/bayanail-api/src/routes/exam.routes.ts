import { Router } from "express";
import {
  getExams,
  getExamById,
  createExam,
  updateExam,
} from "../controllers/exam.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole, requireExamAccess, requireInstructorHasAccess } from "../lib/auth/guards.js";

const router = Router();

router.use(authenticate);

router.get("/", getExams);
router.get("/:id", requireExamAccess(), getExamById);
router.post("/", requireRole(["ADMIN", "INSTRUCTOR"]), requireInstructorHasAccess("studentId", "body"), createExam);
router.patch("/:id", requireRole(["ADMIN", "INSTRUCTOR"]), requireExamAccess(), updateExam);

export default router;

