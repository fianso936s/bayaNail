import { Router } from "express";
import { 
  getInstructors, 
  createInstructor, 
  getInstructorById, 
  updateInstructor, 
  toggleInstructorActive,
  deleteInstructor 
} from "../controllers/instructor.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../lib/auth/guards.js";
import { validate } from "../middleware/validate.js";
import { instructorSchema, updateInstructorSchema } from "../lib/validations/instructor.schema.js";

const router = Router();

router.use(authenticate);
router.use(requireRole(["ADMIN"]));

router.get("/", getInstructors);
router.post("/", validate(instructorSchema), createInstructor);
router.get("/:id", getInstructorById);
router.patch("/:id", validate(updateInstructorSchema), updateInstructor);
router.patch("/:id/active", toggleInstructorActive);
router.delete("/:id", deleteInstructor);

export default router;

