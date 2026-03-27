import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.js";

const slotSchema = z.object({
  instructorId: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  location: z.string().optional(),
  recurringRule: z.string().optional(),
  isBlocked: z.boolean().optional(),
});

const timeOffSchema = z.object({
  instructorId: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  reason: z.string().optional(),
});

export const getInstructorAvailability = async (req: AuthRequest, res: Response) => {
  const { instructorId } = req.params;
  const { from, to } = req.query;

  try {
    // Vérification des droits : ADMIN ou INSTRUCTOR lui-même
    if (req.user?.role === "INSTRUCTOR") {
      const profile = await prisma.instructorProfile.findUnique({ where: { userId: req.user.id } });
      if (!profile || profile.id !== instructorId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
    }

    const slots = await prisma.availabilitySlot.findMany({
      where: {
        instructorId,
        startAt: from ? { gte: new Date(from as string) } : undefined,
        endAt: to ? { lte: new Date(to as string) } : undefined,
      },
      orderBy: { startAt: "asc" },
    });

    const timeOffs = await prisma.timeOff.findMany({
      where: {
        instructorId,
        startAt: from ? { gte: new Date(from as string) } : undefined,
        endAt: to ? { lte: new Date(to as string) } : undefined,
      },
      orderBy: { startAt: "asc" },
    });

    res.json({ slots, timeOffs });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des disponibilités" });
  }
};

export const createAvailabilitySlot = async (req: AuthRequest, res: Response) => {
  try {
    const data = slotSchema.parse(req.body);

    // Vérification des droits
    if (req.user?.role === "INSTRUCTOR") {
      const profile = await prisma.instructorProfile.findUnique({ where: { userId: req.user.id } });
      if (!profile || profile.id !== data.instructorId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
    }

    const slot = await prisma.availabilitySlot.create({
      data: {
        instructorId: data.instructorId,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        location: data.location,
        recurringRule: data.recurringRule,
        isBlocked: data.isBlocked ?? false,
      }
    });

    res.status(201).json(slot);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Erreur lors de la création du créneau" });
  }
};

export const updateAvailabilitySlot = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updateSchema = slotSchema.partial();

  try {
    const data = updateSchema.parse(req.body);
    const existingSlot = await prisma.availabilitySlot.findUnique({ where: { id } });

    if (!existingSlot) {
      return res.status(404).json({ message: "Créneau non trouvé" });
    }

    // Vérification des droits
    if (req.user?.role === "INSTRUCTOR") {
      const profile = await prisma.instructorProfile.findUnique({ where: { userId: req.user.id } });
      if (!profile || profile.id !== existingSlot.instructorId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
    }

    const slot = await prisma.availabilitySlot.update({
      where: { id },
      data: {
        startAt: data.startAt ? new Date(data.startAt) : undefined,
        endAt: data.endAt ? new Date(data.endAt) : undefined,
        location: data.location,
        recurringRule: data.recurringRule,
        isBlocked: data.isBlocked,
      }
    });

    res.json(slot);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Erreur lors de la mise à jour du créneau" });
  }
};

export const deleteAvailabilitySlot = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const existingSlot = await prisma.availabilitySlot.findUnique({ where: { id } });

    if (!existingSlot) {
      return res.status(404).json({ message: "Créneau non trouvé" });
    }

    // Vérification des droits
    if (req.user?.role === "INSTRUCTOR") {
      const profile = await prisma.instructorProfile.findUnique({ where: { userId: req.user.id } });
      if (!profile || profile.id !== existingSlot.instructorId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
    }

    await prisma.availabilitySlot.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression du créneau" });
  }
};

export const createTimeOff = async (req: AuthRequest, res: Response) => {
  try {
    const data = timeOffSchema.parse(req.body);

    // Vérification des droits
    if (req.user?.role === "INSTRUCTOR") {
      const profile = await prisma.instructorProfile.findUnique({ where: { userId: req.user.id } });
      if (!profile || profile.id !== data.instructorId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
    }

    const timeOff = await prisma.timeOff.create({
      data: {
        instructorId: data.instructorId,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        reason: data.reason,
      }
    });

    res.status(201).json(timeOff);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Erreur lors de la création de l'absence" });
  }
};

export const deleteTimeOff = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const existingTimeOff = await prisma.timeOff.findUnique({ where: { id } });

    if (!existingTimeOff) {
      return res.status(404).json({ message: "Absence non trouvée" });
    }

    // Vérification des droits
    if (req.user?.role === "INSTRUCTOR") {
      const profile = await prisma.instructorProfile.findUnique({ where: { userId: req.user.id } });
      if (!profile || profile.id !== existingTimeOff.instructorId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
    }

    await prisma.timeOff.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de l'absence" });
  }
};

