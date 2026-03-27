import { Router } from "express";
import { 
  getVehicles, 
  createVehicle, 
  updateVehicle, 
  toggleVehicleActive,
  deleteVehicle 
} from "../controllers/vehicle.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../lib/auth/guards.js";

const router = Router();

router.use(authenticate);
router.use(requireRole(["ADMIN"]));

router.get("/", getVehicles);
router.post("/", createVehicle);
router.patch("/:id", updateVehicle);
router.patch("/:id/active", toggleVehicleActive);
router.delete("/:id", deleteVehicle);

export default router;

