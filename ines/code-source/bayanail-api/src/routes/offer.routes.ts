import { Router } from "express";
import { getOffers, getOfferBySlug } from "../controllers/offer.controller.js";

const router = Router();

router.get("/", getOffers);
router.get("/:slug", getOfferBySlug);

export default router;

