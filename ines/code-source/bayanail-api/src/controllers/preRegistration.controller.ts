import { Response } from "express";
import prisma from "../lib/prisma.js";
import { AuthRequest } from "../middleware/auth.js";

export const saveDraft = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Non authentifié" });

  const { offerId } = req.body;

  try {
    const preRegistration = await prisma.preRegistration.create({
      data: {
        userId: req.user.id,
        offerId,
        status: "DRAFT",
      }
    });

    res.status(201).json(preRegistration);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la sauvegarde du brouillon" });
  }
};

export const submitPreRegistration = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Non authentifié" });

  const { id } = req.body; // PreRegistration ID

  try {
    const preRegistration = await prisma.preRegistration.update({
      where: { id, userId: req.user.id },
      data: { status: "SUBMITTED" },
      include: { user: { include: { profile: true } } }
    });

    // Update Lead status
    await prisma.lead.upsert({
      where: { email: preRegistration.user.email },
      update: { status: "NEW" },
      create: {
        email: preRegistration.user.email,
        firstName: preRegistration.user.profile?.firstName || "",
        lastName: preRegistration.user.profile?.lastName || "",
        status: "NEW",
        source: "website"
      }
    });

    res.json({ message: "Pré-inscription soumise avec succès", preRegistration });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la soumission" });
  }
};

export const getPreRegistration = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Non authentifié" });

  const { id } = req.params;

  try {
    const preRegistration = await prisma.preRegistration.findUnique({
      where: { id },
      include: { 
        offer: true,
        documents: true,
        payments: true
      }
    });

    if (!preRegistration) {
      return res.status(404).json({ message: "Pré-inscription non trouvée" });
    }

    // Authorization check
    if (!req.user) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    
    if (req.user.role !== "ADMIN" && preRegistration.userId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    res.json(preRegistration);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération" });
  }
};

