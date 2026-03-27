import { Router } from "express";
import { 
  getStudents, 
  createStudent, 
  getStudentById, 
  updateStudent, 
  deleteStudent 
} from "../controllers/student.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../lib/auth/guards.js";
import { validate } from "../middleware/validate.js";
import { studentSchema, updateStudentSchema } from "../lib/validations/student.schema.js";

const router = Router();

// Les administrateurs et les moniteurs peuvent gérer les élèves
router.use(authenticate);
router.use(requireRole(["ADMIN", "INSTRUCTOR"]));

router.get("/", getStudents);
router.post("/", validate(studentSchema), createStudent);
router.get("/:id", getStudentById);
router.patch("/:id", validate(updateStudentSchema), updateStudent);
router.delete("/:id", deleteStudent);

export default router;

