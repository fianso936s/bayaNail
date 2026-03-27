import { Response } from "express";
import prisma from "../lib/prisma.js";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.js";

const examSchema = z.object({
  type: z.enum(["CODE", "DRIVING"]),
  dateAt: z.string().optional(),
  status: z.enum(["NOT_SCHEDULED", "SCHEDULED", "PASSED", "FAILED"]).optional(),
  notes: z.string().optional(),
  location: z.string().optional(),
  resultNote: z.number().optional(),
  examinerComments: z.string().optional(),
});

export const getExams = async (req: AuthRequest, res: Response) => {
  try {
    let where: any = {};

    // RBAC: STUDENT voit seulement ses examens
    if (req.user?.role === "STUDENT") {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (profile) {
        where.studentId = profile.id;
      } else {
        return res.json([]);
      }
    } else if (req.user?.role === "INSTRUCTOR") {
      // Les moniteurs peuvent voir les examens de leurs élèves
      const instructorProfile = await prisma.instructorProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (instructorProfile) {
        const studentIds = await prisma.lesson
          .findMany({
            where: { instructorId: instructorProfile.id },
            select: { studentId: true },
            distinct: ["studentId"],
          })
          .then((lessons) => lessons.map((l) => l.studentId));
        where.studentId = { in: studentIds };
      }
    }
    // ADMIN voit tous les examens

    const exams = await prisma.exam.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      orderBy: { dateAt: "desc" },
    });

    // Format pour le frontend
    const formattedExams = exams.map((exam) => ({
      id: exam.id,
      type: exam.type,
      date: exam.dateAt,
      status: exam.status,
      location: (exam as any).location || null,
      resultNote: (exam as any).resultNote || null,
      examinerComments: (exam as any).examinerComments || null,
      studentName: `${exam.student.firstName} ${exam.student.lastName}`,
      studentEmail: exam.student.user.email,
    }));

    res.json(formattedExams);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des examens" });
  }
};

export const getExamById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return res.status(404).json({ message: "Examen non trouvé" });
    }

    // Vérification des droits
    if (req.user?.role === "STUDENT") {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (!profile || profile.id !== exam.studentId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
    }

    res.json({
      id: exam.id,
      type: exam.type,
      date: exam.dateAt,
      status: exam.status,
      location: (exam as any).location || null,
      resultNote: (exam as any).resultNote || null,
      examinerComments: (exam as any).examinerComments || null,
      notes: exam.notes,
      studentName: `${exam.student.firstName} ${exam.student.lastName}`,
      studentEmail: exam.student.user.email,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de l'examen" });
  }
};

export const createExam = async (req: AuthRequest, res: Response) => {
  try {
    const data = examSchema.parse(req.body);
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "studentId est requis" });
    }

    const exam = await prisma.exam.create({
      data: {
        studentId,
        type: data.type,
        dateAt: data.dateAt ? new Date(data.dateAt) : null,
        status: data.status || "NOT_SCHEDULED",
        notes: data.notes,
      },
    });

    res.status(201).json(exam);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Erreur lors de la création de l'examen" });
  }
};

export const updateExam = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updateSchema = examSchema.partial();

  try {
    const data = updateSchema.parse(req.body);

    const exam = await prisma.exam.update({
      where: { id },
      data: {
        type: data.type,
        dateAt: data.dateAt ? new Date(data.dateAt) : undefined,
        status: data.status,
        notes: data.notes,
      },
    });

    res.json(exam);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'examen" });
  }
};

