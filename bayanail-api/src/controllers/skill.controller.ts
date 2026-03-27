import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.js";

export const getSkills = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.skillCategory.findMany({
      include: {
        skills: {
          orderBy: { order: "asc" }
        }
      },
      orderBy: { order: "asc" }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des compétences" });
  }
};

export const getStudentProgress = async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // StudentProfile ID

  try {
    const progress = await prisma.studentSkill.findMany({
      where: { studentId: id },
      include: {
        skill: {
          include: { category: true }
        }
      }
    });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de la progression" });
  }
};

export const addLessonSkills = async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // Lesson ID
  const { skills } = req.body; // Array of { skillId, level, comment }

  try {
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) return res.status(404).json({ message: "Leçon non trouvée" });

    // Verify instructor ownership if not admin
    if (req.user?.role === "INSTRUCTOR") {
      const profile = await prisma.instructorProfile.findUnique({ where: { userId: req.user.id } });
      if (!profile || profile.id !== lesson.instructorId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
    }

    for (const skill of skills) {
      await prisma.lessonSkill.create({
        data: {
          lessonId: id,
          skillId: skill.skillId,
          level: skill.level,
          comment: skill.comment,
        }
      });

      // Update global student progress
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

    res.status(201).json({ message: "Compétences mises à jour" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour des compétences" });
  }
};

