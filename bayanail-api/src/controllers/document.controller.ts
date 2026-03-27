import { Response } from "express";
import prisma from "../lib/prisma.js";
import { AuthRequest } from "../middleware/auth.js";
import { uploadFile } from "../lib/storage.js";
import { sendEmail, templates } from "../lib/email.js";

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Non authentifié" });
  if (!req.file) return res.status(400).json({ message: "Aucun fichier fourni" });

  const { type, preRegistrationId } = req.body;

  try {
    // Vérification que la pré-inscription appartient à l'utilisateur
    const preRegistration = await prisma.preRegistration.findUnique({
      where: { id: preRegistrationId }
    });

    if (!preRegistration) {
      return res.status(404).json({ message: "Pré-inscription non trouvée" });
    }

    if (preRegistration.userId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Accès refusé - Cette pré-inscription ne vous appartient pas" });
    }

    const key = `${req.user.id}/${preRegistrationId}/${Date.now()}-${req.file.originalname}`;
    const url = await uploadFile(req.file, key);

    const document = await prisma.document.create({
      data: {
        type,
        url,
        preRegistrationId,
        status: "PENDING",
      }
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du téléchargement" });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Non authentifié" });

  try {
    const documents = await prisma.document.findMany({
      where: req.user.role === "ADMIN" ? {} : {
        preRegistration: { userId: req.user.id }
      },
      include: { preRegistration: true }
    });

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération" });
  }
};

export const updateDocumentStatus = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Accès réservé aux administrateurs" });
  }

  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  try {
    const document = await prisma.document.update({
      where: { id },
      data: { status, rejectionReason },
      include: { preRegistration: { include: { user: true } } }
    });

    // Send Email
    const user = document.preRegistration.user;
    if (status === "APPROVED") {
      const email = templates.docApproved(document.type);
      await sendEmail(user.email, email.subject, email.html, "DOC_APPROVED", user.id);
    } else if (status === "REJECTED") {
      const email = templates.docRejected(document.type, rejectionReason || "Non spécifiée");
      await sendEmail(user.email, email.subject, email.html, "DOC_REJECTED", user.id);
    }

    // Log action
    await prisma.auditLog.create({
      data: {
        action: "DOCUMENT_STATUS_UPDATE",
        entity: "DOCUMENT",
        entityId: id,
        userId: req.user.id,
        metadata: { status, rejectionReason }
      }
    });

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour" });
  }
};

