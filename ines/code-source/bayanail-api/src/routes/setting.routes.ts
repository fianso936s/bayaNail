import { Router } from "express";
import { getSettings, updateSetting } from "../controllers/setting.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../lib/auth/guards.js";

const router = Router();

router.use(authenticate);
router.use(requireRole(["ADMIN"]));

router.get("/", getSettings);
router.put("/:key", updateSetting);

export default router;

