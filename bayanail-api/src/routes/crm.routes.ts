import { Router } from "express";
import { 
  getLeads, 
  createLead, 
  updateLead, 
  convertLead,
  getLeadActivities,
  createLeadActivity,
  getTasks,
  createTask,
  completeTask
} from "../controllers/crm.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../lib/auth/guards.js";

const router = Router();

router.use(authenticate);
router.use(requireRole(["ADMIN", "INSTRUCTOR"]));

router.get("/leads", getLeads);
router.post("/leads", createLead);
router.get("/leads/:id", getLeads);
router.patch("/leads/:id", updateLead);
router.post("/leads/:id/convert", convertLead);
router.get("/leads/:id/activities", getLeadActivities);
router.post("/leads/:id/activities", createLeadActivity);

router.get("/tasks", getTasks);
router.post("/tasks", createTask);
router.post("/tasks/:id/done", completeTask);

export default router;

