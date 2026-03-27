import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.js";
import { logAction } from "../lib/audit.js";
import { emitEvent } from "../lib/socket.js";

const lessonSchema = z.object({
  studentId: z.string(),
  instructorId: z.string(),
  vehicleId: z.string().optional(),
  startAt: z.string(),
  endAt: z.string(),
  location: z.string(),
});

export const getLessons = async (req: AuthRequest, res: Response) => {
  const { from, to, instructorId, studentId, status } = req.query;

  try {
    const where: any = {};

    if (from || to) {
      where.startAt = {};
      if (from) where.startAt.gte = new Date(from as string);
      if (to) where.startAt.lte = new Date(to as string);
    }

    if (status) where.status = status;

    // RBAC logic for filtering
    if (req.user?.role === "INSTRUCTOR") {
      const profile = await prisma.instructorProfile.findUnique({ where: { userId: req.user.id } });
      where.instructorId = profile?.id;
    } else if (req.user?.role === "STUDENT") {
      const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
      where.studentId = profile?.id;
    } else if (req.user?.role === "ADMIN") {
      if (instructorId) where.instructorId = instructorId;
      if (studentId) where.studentId = studentId;
    }

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        student: true,
        instructor: true,
        vehicle: true,
        note: true,
        skills: true,
      },
      orderBy: { startAt: "asc" },
    });

    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des leçons" });
  }
};

export const createLesson = async (req: AuthRequest, res: Response) => {
  try {
    const data = lessonSchema.parse(req.body);
    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);

    // 1. Conflit moniteur
    const instructorConflict = await prisma.lesson.findFirst({
      where: {
        instructorId: data.instructorId,
        status: { in: ["PLANNED", "CONFIRMED"] },
        OR: [
          { startAt: { lt: endAt }, endAt: { gt: startAt } }
        ]
      }
    });

    if (instructorConflict) {
      return res.status(409).json({ message: "Le moniteur a déjà une leçon sur ce créneau" });
    }

    // 2. Conflit élève
    const studentConflict = await prisma.lesson.findFirst({
      where: {
        studentId: data.studentId,
        status: { in: ["PLANNED", "CONFIRMED"] },
        OR: [
          { startAt: { lt: endAt }, endAt: { gt: startAt } }
        ]
      }
    });

    if (studentConflict) {
      return res.status(409).json({ message: "L'élève a déjà une leçon sur ce créneau" });
    }

    // 3. Conflit véhicule
    if (data.vehicleId) {
      const vehicleConflict = await prisma.lesson.findFirst({
        where: {
          vehicleId: data.vehicleId,
          status: { in: ["PLANNED", "CONFIRMED"] },
          OR: [
            { startAt: { lt: endAt }, endAt: { gt: startAt } }
          ]
        }
      });

      if (vehicleConflict) {
        return res.status(409).json({ message: "Le véhicule est déjà réservé sur ce créneau" });
      }
    }

    const lesson = await prisma.lesson.create({
      data: {
        ...data,
        startAt,
        endAt,
      },
      include: {
        student: true,
        instructor: true,
      }
    });

    await logAction("CREATE", "Lesson", lesson.id, req.user?.id);
    emitEvent("lesson:create", lesson);
    res.status(201).json(lesson);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Erreur lors de la création de la leçon" });
  }
};

export const updateLesson = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updateSchema = lessonSchema.partial();

  try {
    const data = updateSchema.parse(req.body);
    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        ...data,
        startAt: data.startAt ? new Date(data.startAt) : undefined,
        endAt: data.endAt ? new Date(data.endAt) : undefined,
      }
    });
    await logAction("UPDATE", "Lesson", lesson.id, req.user?.id, data);
    emitEvent("lesson:update", lesson);
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour de la leçon" });
  }
};

export const confirmLesson = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const lesson = await prisma.lesson.update({
      where: { id },
      data: { status: "CONFIRMED" }
    });
    await logAction("CONFIRM", "Lesson", id, req.user?.id);
    emitEvent("lesson:update", lesson);
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la confirmation" });
  }
};

export const cancelLesson = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) return res.status(404).json({ message: "Leçon non trouvée" });

    // Règle d'annulation : 48h (depuis les settings)
    const cancellationHoursSetting = await prisma.setting.findUnique({ where: { key: "cancellationHours" } });
    const hoursThreshold = (cancellationHoursSetting?.valueJson as number) || 48;

    const now = new Date();
    const hoursDiff = (lesson.startAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (req.user?.role === "STUDENT" && hoursDiff < hoursThreshold) {
      return res.status(403).json({ message: `Annulation impossible moins de ${hoursThreshold}h avant.` });
    }

    const cancelledLesson = await prisma.lesson.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelReason: reason,
        cancelledByRole: req.user?.role as any,
      }
    });

    await logAction("CANCEL", "Lesson", id, req.user?.id, { reason });
    emitEvent("lesson:update", cancelledLesson);
    res.json(cancelledLesson);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'annulation" });
  }
};

export const completeLesson = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { summary, nextGoals, skills, signature } = req.body;

  try {
    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        status: "COMPLETED",
        note: {
          create: {
            summary,
            nextGoals,
            instructorId: (await prisma.instructorProfile.findUnique({ where: { userId: req.user?.id } }))?.id || "",
          }
        },
        signature: signature ? {
          create: {
            studentName: signature.studentName,
            signatureDataUrl: signature.signatureDataUrl,
          }
        } : undefined,
      }
    });

    // Update skills
    if (skills && Array.isArray(skills)) {
      for (const skill of skills) {
        await prisma.lessonSkill.create({
          data: {
            lessonId: id,
            skillId: skill.skillId,
            level: skill.level,
            comment: skill.comment,
          }
        });

        // Update student progress
        await prisma.studentSkill.upsert({
          where: {
            studentId_skillId: {
              studentId: lesson.studentId,
              skillId: skill.skillId,
            }
          },
          update: {
            level: skill.level,
            status: skill.level === 3 ? "ACQUIRED" : "IN_PROGRESS",
          },
          create: {
            studentId: lesson.studentId,
            skillId: skill.skillId,
            level: skill.level,
            status: skill.level === 3 ? "ACQUIRED" : "IN_PROGRESS",
          }
        });
      }
    }

    await logAction("COMPLETE", "Lesson", id, req.user?.id, { summary, nextGoals, skillsCount: skills?.length });
    emitEvent("lesson:update", lesson);
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la finalisation de la leçon" });
  }
};

