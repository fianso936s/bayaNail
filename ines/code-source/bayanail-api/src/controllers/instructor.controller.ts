import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { hashPassword } from "../lib/password.js";
import { logAction } from "../lib/audit.js";
import { AuthRequest } from "../middleware/auth.js";
import { emitEvent } from "../lib/socket.js";
import { z } from "zod";
import { instructorSchema } from "../lib/validations/instructor.schema.js";

export const getInstructors = async (req: AuthRequest, res: Response) => {
  try {
    const instructors = await prisma.instructorProfile.findMany({
      where: {
        user: {
          role: { not: "ADMIN" }
        }
      },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(instructors);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des moniteurs" });
  }
};

export const createInstructor = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body; // Les données sont déjà validées par le middleware validate()
    const normalizedEmail = data.email.toLowerCase().trim();
    
    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }
    
    // Le mot de passe est requis par le schéma de validation
    if (!data.password) {
      return res.status(400).json({ message: "Le mot de passe est requis" });
    }
    
    const hashedPassword = await hashPassword(data.password);

    const instructor = await prisma.user.create({
      data: {
        email: normalizedEmail, // Sauvegarder l'email normalisé
        password: hashedPassword,
        role: "INSTRUCTOR",
        instructorProfile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            licenseNumber: data.licenseNumber,
            bio: data.bio,
            isActive: data.isActive ?? true,
          }
        }
      },
      include: {
        instructorProfile: true
      }
    });

    await logAction("CREATE", "Instructor", instructor.id, req.user?.id);
    emitEvent("instructor:create", instructor);
    
    // Ne pas renvoyer le mot de passe haché
    const { password: _, ...instructorWithoutPassword } = instructor;
    res.status(201).json(instructorWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Erreur lors de la création du moniteur" });
  }
};

export const getInstructorById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const instructor = await prisma.instructorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          }
        }
      }
    });

    if (!instructor) {
      return res.status(404).json({ message: "Moniteur non trouvé" });
    }

    res.json(instructor);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération du moniteur" });
  }
};

export const updateInstructor = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updateSchema = instructorSchema.partial();

  try {
    const validated = updateSchema.parse({ body: req.body });
    const bodyData = validated.body;
    
    const updateData: any = {};
    if (bodyData?.firstName !== undefined) updateData.firstName = bodyData.firstName;
    if (bodyData?.lastName !== undefined) updateData.lastName = bodyData.lastName;
    if (bodyData?.phone !== undefined) updateData.phone = bodyData.phone;
    if (bodyData?.licenseNumber !== undefined) updateData.licenseNumber = bodyData.licenseNumber;
    if (bodyData?.bio !== undefined) updateData.bio = bodyData.bio;
    if (bodyData?.isActive !== undefined) updateData.isActive = bodyData.isActive;
    
    const instructor = await prisma.instructorProfile.update({
      where: { id },
      data: updateData,
    });

    await logAction("UPDATE", "Instructor", instructor.id, req.user?.id, updateData);
    emitEvent("instructor:update", instructor);
    res.json(instructor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Erreur lors de la mise à jour du moniteur" });
  }
};

export const toggleInstructorActive = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const instructor = await prisma.instructorProfile.update({
      where: { id },
      data: { isActive },
    });
    await logAction("TOGGLE_ACTIVE", "Instructor", id, req.user?.id, { isActive });
    emitEvent("instructor:update", instructor);
    res.json(instructor);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du changement de statut" });
  }
};

export const deleteInstructor = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const profile = await prisma.instructorProfile.findUnique({ 
      where: { id },
      include: { _count: { select: { lessons: { where: { startAt: { gte: new Date() } } } } } }
    });
    
    if (!profile) return res.status(404).json({ message: "Moniteur non trouvé" });

    // Safety check: no future lessons
    if (profile._count.lessons > 0) {
      return res.status(400).json({ 
        message: "Impossible de supprimer un moniteur ayant des leçons futures prévues." 
      });
    }

    await prisma.user.delete({ where: { id: profile.userId } });
    await logAction("DELETE", "Instructor", id, req.user?.id);
    emitEvent("instructor:delete", id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression du moniteur" });
  }
};

