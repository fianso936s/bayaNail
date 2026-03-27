import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.js";
import { hashPassword } from "../lib/password.js";
import { logAction } from "../lib/audit.js";
import { emitEvent } from "../lib/socket.js";

const leadSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(["NEW", "FOLLOW_UP", "CONVERTED", "LOST"]).optional(),
  score: z.number().optional(),
  ownerInstructorId: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
});

const taskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  assignedToUserId: z.string().optional(),
  dueAt: z.string().optional(),
  leadId: z.string().optional(),
  studentId: z.string().optional(),
});

export const getLeads = async (req: AuthRequest, res: Response) => {
  const { status, owner, q, page = "1" } = req.query;
  const skip = (parseInt(page as string) - 1) * 20;

  try {
    const leads = await prisma.lead.findMany({
      where: {
        status: status as any,
        ownerInstructorId: owner as string,
        OR: q ? [
          { firstName: { contains: q as string } },
          { lastName: { contains: q as string } },
          { email: { contains: q as string } },
        ] : undefined,
      },
      include: {
        ownerInstructor: {
          select: { email: true }
        }
      },
      skip,
      take: 20,
      orderBy: { createdAt: "desc" },
    });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des leads" });
  }
};

export const createLead = async (req: AuthRequest, res: Response) => {
  try {
    const data = leadSchema.parse(req.body);
    const lead = await prisma.lead.create({
      data: {
        ...data,
        nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : undefined,
      }
    });

    await logAction("CREATE", "Lead", lead.id, req.user?.id);
    emitEvent("crm:lead:create", lead);
    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création du lead" });
  }
};

export const updateLead = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const data = leadSchema.partial().parse(req.body);
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...data,
        nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : undefined,
      }
    });

    await logAction("UPDATE", "Lead", lead.id, req.user?.id, data);
    emitEvent("crm:lead:update", lead);
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour" });
  }
};

export const convertLead = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ message: "Lead non trouvé" });

    const normalizedEmail = lead.email.toLowerCase().trim();
    
    // Vérifier si un utilisateur avec cet email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    
    if (existingUser) {
      return res.status(400).json({ message: "Un utilisateur avec cet email existe déjà" });
    }

    const hashedPassword = await hashPassword(password || "permis123");

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail, // Sauvegarder l'email normalisé
        password: hashedPassword,
        role: "STUDENT",
        studentProfile: {
          create: {
            firstName: lead.firstName,
            lastName: lead.lastName,
            phone: lead.phone || "",
            city: "A préciser",
          }
        }
      }
    });

    await prisma.lead.update({
      where: { id },
      data: { status: "CONVERTED" }
    });

    await logAction("CONVERT", "Lead", id, req.user?.id, { userId: user.id });
    emitEvent("crm:lead:convert", { leadId: id, userId: user.id });
    res.json({ message: "Lead converti avec succès", userId: user.id });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la conversion" });
  }
};

export const getLeadActivities = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const activities = await prisma.leadActivity.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "desc" }
    });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des activités" });
  }
};

export const createLeadActivity = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { type, content } = req.body;
  try {
    const activity = await prisma.leadActivity.create({
      data: {
        leadId: id,
        actorUserId: req.user?.id,
        type: type as any,
        content,
      }
    });
    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création de l'activité" });
  }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  const { assignedTo, status, dueFrom, dueTo } = req.query;
  try {
    const tasks = await prisma.task.findMany({
      where: {
        assignedToUserId: assignedTo as string,
        status: status as any,
        dueAt: (dueFrom || dueTo) ? {
          gte: dueFrom ? new Date(dueFrom as string) : undefined,
          lte: dueTo ? new Date(dueTo as string) : undefined,
        } : undefined,
      },
      orderBy: { dueAt: "asc" }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des tâches" });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const data = taskSchema.parse(req.body);
    const task = await prisma.task.create({
      data: {
        ...data,
        dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
      }
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création de la tâche" });
  }
};

export const completeTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const task = await prisma.task.update({
      where: { id },
      data: { status: "DONE" }
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la finalisation de la tâche" });
  }
};

