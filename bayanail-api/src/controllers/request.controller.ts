import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.js";

const lessonRequestSchema = z.object({
  preferredSlotsJson: z.array(z.object({
    startAt: z.string(),
    endAt: z.string(),
  })),
  location: z.string().optional(),
  transmission: z.enum(["MANUAL", "AUTO"]).optional(),
  note: z.string().optional(),
});

export const createLessonRequest = async (req: AuthRequest, res: Response) => {
  try {
    const data = lessonRequestSchema.parse(req.body);
    
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user?.id }
    });

    if (!studentProfile) {
      return res.status(403).json({ message: "Profil élève non trouvé" });
    }

    const lessonRequest = await prisma.lessonRequest.create({
      data: {
        studentId: studentProfile.id,
        preferredSlotsJson: data.preferredSlotsJson,
        location: data.location,
        transmission: data.transmission,
        note: data.note,
      }
    });

    res.status(201).json(lessonRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Erreur lors de la création de la demande" });
  }
};

export const getLessonRequests = async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};

    if (req.user?.role === "STUDENT") {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id }
      });
      where.studentId = studentProfile?.id;
    }

    const requests = await prisma.lessonRequest.findMany({
      where,
      include: {
        student: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des demandes" });
  }
};

export const acceptLessonRequest = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { instructorId, vehicleId, startAt, endAt, location } = req.body;

  try {
    const lessonRequest = await prisma.lessonRequest.findUnique({ where: { id } });
    if (!lessonRequest) return res.status(404).json({ message: "Demande non trouvée" });

    // Créer la leçon
    const lesson = await prisma.lesson.create({
      data: {
        studentId: lessonRequest.studentId,
        instructorId,
        vehicleId,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        location: location || lessonRequest.location || "Centre",
        status: "CONFIRMED",
      }
    });

    // Mettre à jour la demande
    await prisma.lessonRequest.update({
      where: { id },
      data: { status: "ACCEPTED" }
    });

    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'acceptation de la demande" });
  }
};

export const rejectLessonRequest = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const lessonRequest = await prisma.lessonRequest.update({
      where: { id },
      data: { status: "REJECTED", note: reason ? `Rejet: ${reason}` : undefined }
    });
    res.json(lessonRequest);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du rejet de la demande" });
  }
};

