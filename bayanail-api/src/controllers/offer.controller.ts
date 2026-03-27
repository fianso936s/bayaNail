import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const getOffers = async (req: Request, res: Response) => {
  try {
    const offers = await prisma.offer.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" }
    });

    res.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des offres" });
  }
};

export const getOfferBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    const offer = await prisma.offer.findUnique({
      where: { slug }
    });

    if (!offer) {
      return res.status(404).json({ message: "Offre non trouvée" });
    }

    res.set("Cache-Control", "public, max-age=3600");
    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de l'offre" });
  }
};

