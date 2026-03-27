import { Router } from "express";
import { 
  getInstructorAvailability, 
  createAvailabilitySlot, 
  updateAvailabilitySlot, 
  deleteAvailabilitySlot,
  createTimeOff,
  deleteTimeOff 
} from "../controllers/availability.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../lib/auth/guards.js";

const router = Router();

router.use(authenticate);

// Seuls les ADMIN et INSTRUCTOR peuvent gérer les disponibilités
router.get("/instructors/:instructorId", getInstructorAvailability);
router.post("/slots", requireRole(["ADMIN", "INSTRUCTOR"]), createAvailabilitySlot);
router.patch("/slots/:id", requireRole(["ADMIN", "INSTRUCTOR"]), updateAvailabilitySlot);
router.delete("/slots/:id", requireRole(["ADMIN", "INSTRUCTOR"]), deleteAvailabilitySlot);
router.post("/timeoff", requireRole(["ADMIN", "INSTRUCTOR"]), createTimeOff);
router.delete("/timeoff/:id", requireRole(["ADMIN", "INSTRUCTOR"]), deleteTimeOff);

export default router;

