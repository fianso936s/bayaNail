import { Response } from "express";
import prisma from "../lib/prisma.js";
import { AuthRequest } from "../middleware/auth.js";

export const getCalendarEvents = async (req: AuthRequest, res: Response) => {
  const { from, to, scope, instructorId, studentId } = req.query;

  try {
    const where: any = {};
    
    if (from || to) {
      where.startAt = {};
      if (from) where.startAt.gte = new Date(from as string);
      if (to) where.startAt.lte = new Date(to as string);
    }

    // Filter by scope
    if (scope === "instructor" && instructorId) {
      where.instructorId = instructorId;
    } else if (scope === "student" && studentId) {
      where.studentId = studentId;
    }

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        instructor: true,
        student: true,
        vehicle: true,
      },
      take: 500, // Limit for performance
    });

    const events = lessons.map(lesson => ({
      id: lesson.id,
      title: `${lesson.student.firstName} ${lesson.student.lastName} - ${lesson.instructor.firstName}`,
      start: lesson.startAt,
      end: lesson.endAt,
      status: lesson.status,
      instructorName: `${lesson.instructor.firstName} ${lesson.instructor.lastName}`,
      studentName: `${lesson.student.firstName} ${lesson.student.lastName}`,
      location: lesson.location,
      vehicleName: lesson.vehicle?.name || "N/A",
      colorHint: lesson.status === "COMPLETED" ? "#10b981" : 
                 lesson.status === "CANCELLED" ? "#ef4444" : 
                 lesson.status === "CONFIRMED" ? "#3b82f6" : "#f59e0b",
    }));

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération du calendrier" });
  }
};

