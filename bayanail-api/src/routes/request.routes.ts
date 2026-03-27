import { Router } from "express";
import { 
  createLessonRequest, 
  getLessonRequests, 
  acceptLessonRequest, 
  rejectLessonRequest 
} from "../controllers/request.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole, requireRequestAccess } from "../lib/auth/guards.js";

const router = Router();

router.use(authenticate);

router.post("/", requireRole(["STUDENT"]), createLessonRequest);
router.get("/", getLessonRequests);
router.post("/:id/accept", requireRole(["ADMIN", "INSTRUCTOR"]), requireRequestAccess(), acceptLessonRequest);
router.post("/:id/reject", requireRole(["ADMIN", "INSTRUCTOR"]), requireRequestAccess(), rejectLessonRequest);

export default router;

