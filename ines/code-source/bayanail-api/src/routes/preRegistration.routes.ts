import { Router } from "express";
import { saveDraft, submitPreRegistration, getPreRegistration } from "../controllers/preRegistration.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.post("/draft", saveDraft);
router.post("/submit", submitPreRegistration);
router.get("/:id", getPreRegistration);

export default router;

