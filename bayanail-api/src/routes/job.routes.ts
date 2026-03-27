import { Router } from "express";
import { runJobs } from "../controllers/job.controller.js";

const router = Router();

router.post("/run", runJobs);

export default router;

